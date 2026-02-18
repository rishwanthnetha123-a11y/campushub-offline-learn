import { useState } from 'react';
import { 
  TicketIcon, Plus, Clock, CheckCircle2, Loader2, 
  AlertCircle, Paperclip, Send, ChevronRight, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTickets, useTicketMessages, Ticket } from '@/hooks/use-tickets';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'download_issue', label: 'Download Issue' },
  { value: 'login', label: 'Login Problem' },
  { value: 'content_not_opening', label: 'Content Not Opening' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
] as const;

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Loader2 },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
};

const SupportPage = () => {
  const { user } = useAuthContext();
  const { tickets, loading, createTicket } = useTickets();
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Ticket['category']>('other');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await createTicket({ title, category, description, attachment: attachment || undefined });
      setTitle(''); setCategory('other'); setDescription(''); setAttachment(null);
      setShowForm(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Please sign in to raise support tickets.</p>
      </div>
    );
  }

  if (selectedTicket) {
    return <TicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-foreground flex items-center gap-2">
            <TicketIcon className="h-6 w-6 text-muted-foreground" />
            Support
          </h1>
          <p className="text-muted-foreground">Raise tickets and track your issues</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Ticket
        </Button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Raise a New Ticket</CardTitle>
            <CardDescription>Describe your issue and we'll help you out</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Issue title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <Select value={category} onValueChange={(v) => setCategory(v as Ticket['category'])}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={4}
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <Paperclip className="h-4 w-4" />
                  {attachment ? attachment.name : 'Attach screenshot/file'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={e => setAttachment(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Submit Ticket
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ticket List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TicketIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No tickets yet. Raise one if you need help!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const statusConf = STATUS_CONFIG[ticket.status];
            const StatusIcon = statusConf.icon;
            return (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg", statusConf.color)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ticket.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIES.find(c => c.value === ticket.category)?.label}
                      </Badge>
                      <span>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <Badge className={cn("text-xs", statusConf.color)}>{statusConf.label}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Ticket Detail with messages
const TicketDetail = ({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) => {
  const { messages, loading, sendMessage } = useTicketMessages(ticket.id);
  const { user } = useAuthContext();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const statusConf = STATUS_CONFIG[ticket.status];

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to tickets
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <CardDescription className="mt-1">
                {CATEGORIES.find(c => c.value === ticket.category)?.label} • {format(new Date(ticket.created_at), 'PPp')}
              </CardDescription>
            </div>
            <Badge className={cn(statusConf.color)}>{statusConf.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{ticket.description}</p>
          {ticket.attachment_url && (
            <a href={ticket.attachment_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline mt-2 inline-block">
              📎 View attachment
            </a>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  "p-3 rounded-lg text-sm max-w-[85%]",
                  msg.is_admin
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted ml-auto"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">
                    {msg.is_admin ? '🛡️ Admin' : 'You'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p>{msg.message}</p>
                {msg.attachment_url && (
                  <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs mt-1 inline-block">
                    📎 Attachment
                  </a>
                )}
              </div>
            ))
          )}

          {/* Reply input */}
          {ticket.status !== 'resolved' && (
            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportPage;
