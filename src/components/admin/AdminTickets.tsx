import { useState } from 'react';
import {
  TicketIcon, Search, Loader2, Send, CheckCircle2, Clock,
  ArrowLeft, Paperclip, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTickets, useTicketMessages, Ticket } from '@/hooks/use-tickets';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = [
  { value: 'download_issue', label: 'Download Issue' },
  { value: 'login', label: 'Login' },
  { value: 'content_not_opening', label: 'Content Not Opening' },
  { value: 'bug', label: 'Bug' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

export const AdminTickets = () => {
  const { tickets, loading, updateTicketStatus } = useTickets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.user_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  if (selectedTicket) {
    return (
      <AdminTicketDetail
        ticket={selectedTicket}
        onBack={() => { setSelectedTicket(null); }}
        onStatusChange={async (status) => {
          await updateTicketStatus(selectedTicket.id, status);
          setSelectedTicket({ ...selectedTicket, status });
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketIcon className="h-5 w-5" /> Support Tickets ({filtered.length})
        </CardTitle>
        <CardDescription>Manage and respond to student tickets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No tickets found</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(ticket => {
              const statusConf = STATUS_CONFIG[ticket.status];
              return (
                <div
                  key={ticket.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ticket.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORIES.find(c => c.value === ticket.category)?.label}
                      </Badge>
                      <span>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
                      <span className="truncate">User: {ticket.user_id.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <Badge className={cn("text-xs", statusConf.color)}>{statusConf.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminTicketDetail = ({
  ticket,
  onBack,
  onStatusChange,
}: {
  ticket: Ticket;
  onBack: () => void;
  onStatusChange: (status: Ticket['status']) => Promise<void>;
}) => {
  const { messages, loading, sendMessage } = useTicketMessages(ticket.id);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage(newMessage, attachment || undefined);
      setNewMessage('');
      setAttachment(null);
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to tickets
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <CardDescription>
                {CATEGORIES.find(c => c.value === ticket.category)?.label} • {format(new Date(ticket.created_at), 'PPp')}
                <br />User ID: {ticket.user_id}
              </CardDescription>
            </div>
            <Select value={ticket.status} onValueChange={(v) => onStatusChange(v as Ticket['status'])}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
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

      <Card>
        <CardHeader><CardTitle className="text-base">Messages</CardTitle></CardHeader>
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
                  msg.is_admin ? "bg-primary/10 border border-primary/20" : "bg-muted ml-auto"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">{msg.is_admin ? '🛡️ Admin' : '👤 Student'}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                </div>
                <p>{msg.message}</p>
                {msg.attachment_url && (
                  <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">📎 Attachment</a>
                )}
              </div>
            ))
          )}

          {/* Admin reply */}
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Reply to student..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <label className="cursor-pointer flex items-center">
              <Paperclip className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              <input type="file" className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
            </label>
            <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {attachment && <p className="text-xs text-muted-foreground">📎 {attachment.name}</p>}
        </CardContent>
      </Card>
    </div>
  );
};
