import { useState, useEffect, useRef } from 'react';
import { Megaphone, Plus, Loader2, Trash2, Image as ImageIcon, X, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface Notice {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  image_url: string | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

const NOTICE_TYPES = [
  { value: 'event', label: 'Event' },
  { value: 'notice', label: 'Notice' },
  { value: 'urgent', label: 'Urgent Alert' },
  { value: 'advertisement', label: 'Advertisement' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function AdminNotices() {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'notice',
    priority: 'normal',
    starts_at: new Date().toISOString().slice(0, 16),
    expires_at: '',
  });

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    const { data } = await (supabase as any)
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    setNotices(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !user) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (selectedImage) {
        const fileName = `${Date.now()}-${selectedImage.name}`;
        const { error: uploadErr } = await supabase.storage.from('notice-images').upload(fileName, selectedImage, { cacheControl: '3600' });
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('notice-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error } = await (supabase as any).from('notices').insert({
        title: form.title,
        description: form.description,
        type: form.type,
        priority: form.priority,
        image_url: imageUrl,
        starts_at: new Date(form.starts_at).toISOString(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        created_by: user.id,
      });
      if (error) throw error;

      toast({ title: 'Notice created', description: `"${form.title}" is now live.` });
      setForm({ title: '', description: '', type: 'notice', priority: 'normal', starts_at: new Date().toISOString().slice(0, 16), expires_at: '' });
      setSelectedImage(null);
      setShowForm(false);
      fetchNotices();
    } catch (err: any) {
      toast({ title: 'Failed to create', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from('notices').update({ is_active: !current }).eq('id', id);
    setNotices(prev => prev.map(n => n.id === id ? { ...n, is_active: !current } : n));
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await (supabase as any).from('notices').delete().eq('id', id);
      if (error) throw error;
      setNotices(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Notice deleted' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally { setDeletingId(null); }
  };

  const priorityColor = (p: string) => {
    if (p === 'urgent') return 'destructive';
    if (p === 'high') return 'default';
    if (p === 'normal') return 'secondary';
    return 'outline';
  };

  const typeColor = (t: string) => {
    if (t === 'urgent') return 'destructive';
    if (t === 'event') return 'default';
    if (t === 'advertisement') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" />Notices & Announcements</CardTitle>
            <CardDescription>{notices.length} total notices</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />{showForm ? 'Cancel' : 'New Notice'}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : notices.length === 0 && !showForm ? (
            <p className="text-center text-muted-foreground py-6">No notices yet. Create your first one!</p>
          ) : (
            <div className="space-y-3">
              {notices.map(notice => (
                <div key={notice.id} className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30">
                  {notice.image_url && (
                    <img src={notice.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground truncate">{notice.title}</p>
                      <Badge variant={typeColor(notice.type) as any} className="capitalize text-xs">{notice.type}</Badge>
                      <Badge variant={priorityColor(notice.priority) as any} className="capitalize text-xs">{notice.priority}</Badge>
                      {!notice.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                    </div>
                    {notice.description && <p className="text-sm text-muted-foreground line-clamp-2">{notice.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notice.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {notice.expires_at && ` — expires ${new Date(notice.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(notice.id, notice.is_active)} className="text-muted-foreground">
                      {notice.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" disabled={deletingId === notice.id}>
                          {deletingId === notice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Notice</AlertDialogTitle>
                          <AlertDialogDescription>Delete "{notice.title}"? This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(notice.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Notice</CardTitle>
            <CardDescription>Publish an event, announcement, or urgent notice for all students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input placeholder="e.g., Annual Sports Day 2026" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Starts At</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Expires At (optional)</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Add details about the event or notice..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Poster / Image (optional)</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${selectedImage ? 'border-success bg-success/5' : 'border-muted-foreground/25 hover:border-primary'}`}
                onClick={() => imageInputRef.current?.click()}
              >
                <input ref={imageInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) setSelectedImage(f); }} className="hidden" />
                {selectedImage ? (
                  <div className="flex items-center justify-center gap-3">
                    <ImageIcon className="h-6 w-6 text-success" />
                    <span className="text-sm font-medium">{selectedImage.name}</span>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedImage(null); }}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload a poster or event image</p>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={saving || !form.title.trim()} className="w-full sm:w-auto">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : <><Megaphone className="h-4 w-4 mr-2" />Publish Notice</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
