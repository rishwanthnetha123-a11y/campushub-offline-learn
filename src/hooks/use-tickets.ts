import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Ticket {
  id: string;
  user_id: string;
  title: string;
  category: 'download_issue' | 'login' | 'content_not_opening' | 'bug' | 'other';
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  is_admin: boolean;
  created_at: string;
}

const OFFLINE_TICKETS_KEY = 'campushub_offline_tickets';

export const useTickets = () => {
  const { user, isAdmin } = useAuthContext();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets((data as any[]) || []);
      localStorage.setItem(OFFLINE_TICKETS_KEY, JSON.stringify(data || []));
    } catch {
      // Load from offline cache
      try {
        const cached = localStorage.getItem(OFFLINE_TICKETS_KEY);
        if (cached) setTickets(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, (payload) => {
        const msg = payload.new as TicketMessage;
        if (msg.sender_id !== user.id) {
          toast({
            title: isAdmin ? '📩 New ticket message' : '📩 Admin replied to your ticket',
            description: msg.message.substring(0, 80),
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin, fetchTickets]);

  const createTicket = async (data: {
    title: string;
    category: Ticket['category'];
    description: string;
    attachment?: File;
  }) => {
    if (!user) return;

    let attachment_url: string | null = null;
    if (data.attachment) {
      const ext = data.attachment.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('ticket-attachments')
        .upload(path, data.attachment);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(path);
        attachment_url = urlData.publicUrl;
      }
    }

    const { error } = await (supabase as any)
      .from('tickets')
      .insert({
        user_id: user.id,
        title: data.title,
        category: data.category,
        description: data.description,
        attachment_url,
      });

    if (error) throw error;
    
    toast({ title: '✅ Ticket submitted', description: 'We\'ll get back to you soon!' });
    fetchTickets();
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    const { error } = await (supabase as any)
      .from('tickets')
      .update({ status })
      .eq('id', ticketId);
    if (error) throw error;
    fetchTickets();
  };

  return { tickets, loading, createTicket, updateTicketStatus, refetch: fetchTickets };
};

export const useTicketMessages = (ticketId: string | null) => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!ticketId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages((data as any[]) || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [ticketId, user]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`ticket-msgs-${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`,
      }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId, fetchMessages]);

  const sendMessage = async (message: string, attachment?: File) => {
    if (!ticketId || !user) return;

    let attachment_url: string | null = null;
    if (attachment) {
      const ext = attachment.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('ticket-attachments')
        .upload(path, attachment);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(path);
        attachment_url = urlData.publicUrl;
      }
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    // Check if admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    const isAdminUser = (roles && roles.length > 0);

    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message,
        attachment_url,
        is_admin: isAdminUser,
      });
    if (error) throw error;
    fetchMessages();
  };

  return { messages, loading, sendMessage, refetch: fetchMessages };
};
