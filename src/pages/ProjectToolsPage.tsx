import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Presentation, GitBranch, Sparkles, Loader2, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-project-docs`;

export default function ProjectToolsPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [docType, setDocType] = useState<string>('all');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!projectTitle.trim() || !projectDescription.trim()) {
      toast.error('Please fill in project title and description');
      return;
    }

    setLoading(true);
    setOutput('');
    abortRef.current = new AbortController();

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ projectTitle, projectDescription, techStack, docType }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || 'Failed to generate');
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setOutput(fullText);
            }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error('Generation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '_')}_${docType}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Project Documentation Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered tool to generate abstracts, PPT outlines, and UML diagrams for your academic projects
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Details</CardTitle>
          <CardDescription>Describe your project and we'll generate professional documentation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Project Title (e.g., Smart Attendance System using Face Recognition)"
            value={projectTitle}
            onChange={e => setProjectTitle(e.target.value)}
          />
          <Textarea
            placeholder="Project Description — Explain what your project does, the problem it solves, key features, and target users. The more detail you provide, the better the output."
            value={projectDescription}
            onChange={e => setProjectDescription(e.target.value)}
            rows={4}
          />
          <Input
            placeholder="Tech Stack (e.g., Python, Flask, OpenCV, MySQL, React)"
            value={techStack}
            onChange={e => setTechStack(e.target.value)}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What to generate:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Complete Package', icon: Sparkles, desc: 'Abstract + PPT + UML' },
                { value: 'abstract', label: 'Abstract', icon: FileText, desc: 'Project abstract' },
                { value: 'ppt', label: 'PPT Outline', icon: Presentation, desc: 'Slide-by-slide' },
                { value: 'uml', label: 'UML Diagrams', icon: GitBranch, desc: 'All diagram types' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDocType(opt.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    docType === opt.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  <div className="text-left">
                    <p>{opt.label}</p>
                    <p className="text-[10px] opacity-70">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Generate Documentation'}
            </Button>
            {loading && (
              <Button variant="outline" onClick={handleStop}>Stop</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generated Output</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Download .md
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
