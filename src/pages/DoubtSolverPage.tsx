import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  ArrowLeft,
  Globe,
  BookOpen,
  Sparkles,
  Bot,
  User,
  History,
  Plus,
  Trash2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
];

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];

const UI_TRANSLATIONS: Record<string, { title: string; subtitle: string; placeholder: string; askTitle: string; askDesc: string; thinking: string; anySubject: string }> = {
  en: { title: 'AI Doubt Solver', subtitle: 'Ask any question in your preferred language', placeholder: 'Type your question here...', askTitle: 'Ask Your Doubts', askDesc: 'Type any question about your studies. I can explain concepts, solve problems, and help you understand difficult topics.', thinking: 'Thinking...', anySubject: 'Any subject' },
  hi: { title: 'AI संदेह समाधानकर्ता', subtitle: 'अपनी पसंदीदा भाषा में कोई भी प्रश्न पूछें', placeholder: 'अपना प्रश्न यहाँ टाइप करें...', askTitle: 'अपने संदेह पूछें', askDesc: 'अपनी पढ़ाई के बारे में कोई भी प्रश्न टाइप करें।', thinking: 'सोच रहा हूँ...', anySubject: 'कोई भी विषय' },
  ta: { title: 'AI சந்தேக தீர்வு', subtitle: 'உங்கள் விருப்பமான மொழியில் கேள்வி கேளுங்கள்', placeholder: 'உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யுங்கள்...', askTitle: 'உங்கள் சந்தேகங்களைக் கேளுங்கள்', askDesc: 'உங்கள் படிப்பு பற்றிய எந்த கேள்வியையும் தட்டச்சு செய்யுங்கள்.', thinking: 'சிந்திக்கிறது...', anySubject: 'எந்த பாடமும்' },
  te: { title: 'AI సందేహ పరిష్కారం', subtitle: 'మీ ఇష్టమైన భాషలో ఏదైనా ప్రశ్న అడగండి', placeholder: 'మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి...', askTitle: 'మీ సందేహాలను అడగండి', askDesc: 'మీ చదువు గురించి ఏదైనా ప్రశ్న టైప్ చేయండి.', thinking: 'ఆలోచిస్తోంది...', anySubject: 'ఏదైనా విషయం' },
  kn: { title: 'AI ಸಂದೇಹ ಪರಿಹಾರ', subtitle: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಿ', placeholder: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...', askTitle: 'ನಿಮ್ಮ ಸಂದೇಹಗಳನ್ನು ಕೇಳಿ', askDesc: 'ನಿಮ್ಮ ಅಧ್ಯಯನದ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ.', thinking: 'ಯೋಚಿಸುತ್ತಿದೆ...', anySubject: 'ಯಾವುದೇ ವಿಷಯ' },
  mr: { title: 'AI शंका निवारक', subtitle: 'तुमच्या पसंतीच्या भाषेत प्रश्न विचारा', placeholder: 'तुमचा प्रश्न इथे टाइप करा...', askTitle: 'तुमच्या शंका विचारा', askDesc: 'तुमच्या अभ्यासाबद्दल कोणताही प्रश्न टाइप करा.', thinking: 'विचार करत आहे...', anySubject: 'कोणताही विषय' },
  bn: { title: 'AI সন্দেহ সমাধানকারী', subtitle: 'আপনার পছন্দের ভাষায় যেকোনো প্রশ্ন জিজ্ঞাসা করুন', placeholder: 'আপনার প্রশ্ন এখানে টাইপ করুন...', askTitle: 'আপনার সন্দেহ জিজ্ঞাসা করুন', askDesc: 'আপনার পড়াশোনা সম্পর্কে যেকোনো প্রশ্ন টাইপ করুন।', thinking: 'চিন্তা করছে...', anySubject: 'যেকোনো বিষয়' },
  gu: { title: 'AI શંકા નિવારક', subtitle: 'તમારી પસંદગીની ભાષામાં પ્રશ્ન પૂછો', placeholder: 'તમારો પ્રશ્ન અહીં ટાઈપ કરો...', askTitle: 'તમારી શંકાઓ પૂછો', askDesc: 'તમારા અભ્યાસ વિશે કોઈપણ પ્રશ્ન ટાઈપ કરો.', thinking: 'વિચારી રહ્યું છે...', anySubject: 'કોઈપણ વિષય' },
  ml: { title: 'AI സംശയ പരിഹാരം', subtitle: 'നിങ്ങളുടെ ഇഷ്ട ഭാഷയിൽ ചോദ്യം ചോദിക്കൂ', placeholder: 'നിങ്ങളുടെ ചോദ്യം ഇവിടെ ടൈപ്പ് ചെയ്യുക...', askTitle: 'നിങ്ങളുടെ സംശയങ്ങൾ ചോദിക്കൂ', askDesc: 'നിങ്ങളുടെ പഠനത്തെക്കുറിച്ചുള്ള ഏതെങ്കിലും ചോദ്യം ടൈപ്പ് ചെയ്യുക.', thinking: 'ചിന്തിക്കുന്നു...', anySubject: 'ഏത് വിഷയവും' },
  pa: { title: 'AI ਸ਼ੰਕਾ ਹੱਲਕਰਤਾ', subtitle: 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਵਿੱਚ ਸਵਾਲ ਪੁੱਛੋ', placeholder: 'ਆਪਣਾ ਸਵਾਲ ਇੱਥੇ ਟਾਈਪ ਕਰੋ...', askTitle: 'ਆਪਣੇ ਸ਼ੰਕੇ ਪੁੱਛੋ', askDesc: 'ਆਪਣੀ ਪੜ੍ਹਾਈ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਟਾਈਪ ਕਰੋ।', thinking: 'ਸੋਚ ਰਿਹਾ ਹੈ...', anySubject: 'ਕੋਈ ਵੀ ਵਿਸ਼ਾ' },
};

import { supabase } from '@/integrations/supabase/client';

const CHAT_HISTORY_KEY = 'campushub_doubt_history';
const MAX_SAVED_CONVERSATIONS = 20;

interface SavedConversation {
  id: string;
  messages: Message[];
  subject: string;
  language: string;
  createdAt: string;
  preview: string;
}

const loadChatHistory = (): SavedConversation[] => {
  try {
    return JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
  } catch { return []; }
};

const saveChatHistory = (conversations: SavedConversation[]) => {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(conversations.slice(0, MAX_SAVED_CONVERSATIONS)));
};

const DoubtSolverPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuthContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('campushub_language') || 'en'; } catch { return 'en'; }
  });
  const [subject, setSubject] = useState('any');
  const [chatHistory, setChatHistory] = useState<SavedConversation[]>(loadChatHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  // Save conversation whenever messages change (after streaming completes)
  useEffect(() => {
    if (messages.length < 2 || isStreaming) return;
    const convId = activeConversationId || crypto.randomUUID();
    if (!activeConversationId) setActiveConversationId(convId);
    
    const conversation: SavedConversation = {
      id: convId,
      messages,
      subject,
      language,
      createdAt: new Date().toISOString(),
      preview: messages[0]?.content.slice(0, 80) || '',
    };
    
    setChatHistory(prev => {
      const updated = [conversation, ...prev.filter(c => c.id !== convId)];
      saveChatHistory(updated);
      return updated.slice(0, MAX_SAVED_CONVERSATIONS);
    });
  }, [messages, isStreaming]);

  const loadConversation = (conv: SavedConversation) => {
    setMessages(conv.messages);
    setActiveConversationId(conv.id);
    setSubject(conv.subject || 'any');
    setShowHistory(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    setChatHistory(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveChatHistory(updated);
      return updated;
    });
    if (activeConversationId === id) startNewChat();
  };

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to use the AI Doubt Solver.',
      });
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    let assistantContent = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-doubt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
            language,
            subject: subject === 'any' ? undefined : subject,
          }),
        }
      );

      if (response.status === 429) {
        toast({
          title: 'Too many requests',
          description: 'Please wait a moment before asking another question.',
          variant: 'destructive',
        });
        setIsStreaming(false);
        return;
      }

      if (response.status === 402) {
        toast({
          title: 'Service unavailable',
          description: 'AI credits exhausted. Please contact administrator.',
          variant: 'destructive',
        });
        setIsStreaming(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect to AI tutor');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put it back
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Connection error',
        description: 'Could not connect to AI tutor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, language, subject, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      streamChat();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-heading text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {t.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={startNewChat} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History ({chatHistory.length})</span>
          </Button>
        </div>
      </div>

      {/* Chat History Panel */}
      {showHistory && (
        <Card className="max-h-64 overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Past Conversations ({chatHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ScrollArea className="max-h-44">
              {chatHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No saved conversations yet</p>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors group",
                        activeConversationId === conv.id ? "bg-primary/10" : "hover:bg-muted"
                      )}
                    >
                      <div className="flex-1 min-w-0" onClick={() => loadConversation(conv)}>
                        <p className="text-sm font-medium truncate">{conv.preview || 'Conversation'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(conv.createdAt).toLocaleDateString()}
                          {conv.subject !== 'any' && ` • ${conv.subject}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Language & Subject Selection */}
      <div className="flex flex-wrap gap-3">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-48">
            <Globe className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-48">
            <BookOpen className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Subject (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t.anySubject}</SelectItem>
            {SUBJECTS.map((subj) => (
              <SelectItem key={subj} value={subj}>
                {subj}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="space-y-4">
                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t.askTitle}</h3>
                  <p className="text-muted-foreground max-w-md">
                    {t.askDesc}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {['What is photosynthesis?', 'Explain algebra basics', 'Help with grammar'].map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="p-2 rounded-full bg-primary/10 h-fit">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="p-2 rounded-full bg-primary h-fit">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <span className="text-muted-foreground">{t.thinking}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder={t.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              rows={2}
              className="resize-none"
            />
            <Button 
              onClick={streamChat} 
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-auto aspect-square"
            >
              {isStreaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DoubtSolverPage;
