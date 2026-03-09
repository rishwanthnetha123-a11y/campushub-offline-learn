import { useState, useRef, useEffect } from 'react';
import { Upload, Video, Loader2, X, FileVideo, Trash2, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CONTENT_LANGUAGES, getLanguageName } from '@/lib/languages';
import { useFacultySubjects } from '@/hooks/use-faculty';
import { useAuthContext } from '@/contexts/AuthContext';

interface VideoForm {
  title: string;
  description: string;
  subject_id: string;
  topic: string;
  resolution: '360p' | '480p';
  language: string;
}

interface DBVideo {
  id: string;
  title: string;
  subject: string;
  duration: string | null;
  file_size: string | null;
  instructor: string | null;
  language: string;
  created_at: string;
}

export function FacultyVideos() {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { subjects } = useFacultySubjects();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [videos, setVideos] = useState<DBVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<VideoForm>({
    title: '', description: '', subject_id: '', topic: '', resolution: '360p', language: 'en',
  });

  useEffect(() => {
    if (user) fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('videos')
      .select('id, title, subject, duration, file_size, instructor, language, created_at')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false });
    setVideos(data || []);
    setLoadingVideos(false);
  };

  const handleDeleteVideo = async (videoId: string) => {
    setDeletingId(videoId);
    try {
      const { error } = await (supabase as any).from('videos').delete().eq('id', videoId);
      if (error) throw error;
      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast({ title: 'Video deleted' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } finally { setDeletingId(null); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getVideoDuration = (file: File): Promise<number> =>
    new Promise(resolve => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(video.duration); };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const handleUpload = async () => {
    if (!selectedFile || !form.title || !form.subject_id || !user) {
      toast({ title: 'Missing info', description: 'Fill required fields and select a video.', variant: 'destructive' });
      return;
    }
    const selectedSubject = subjects.find(s => s.subject_id === form.subject_id);
    if (!selectedSubject) return;

    // Get department_id from the subject
    const { data: subjectData } = await (supabase as any).from('subjects').select('department_id').eq('id', form.subject_id).single();

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const duration = await getVideoDuration(selectedFile);
      const ts = Date.now();
      setUploadProgress(10);

      const { error: videoError } = await supabase.storage.from('videos').upload(`${ts}-${selectedFile.name}`, selectedFile, { cacheControl: '3600' });
      if (videoError) throw videoError;
      setUploadProgress(60);

      let thumbnailUrl = '';
      if (selectedThumbnail) {
        const thumbName = `${ts}-${selectedThumbnail.name}`;
        const { error: thumbError } = await supabase.storage.from('thumbnails').upload(thumbName, selectedThumbnail, { cacheControl: '3600' });
        if (!thumbError) {
          const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(thumbName);
          thumbnailUrl = publicUrl;
        }
      }
      setUploadProgress(80);

      const { data: { publicUrl: videoUrl } } = supabase.storage.from('videos').getPublicUrl(`${ts}-${selectedFile.name}`);

      // Get faculty profile for instructor name
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();

      const { error: dbError } = await (supabase as any).from('videos').insert({
        title: form.title,
        description: form.description,
        subject: selectedSubject.subject_name,
        subject_id: form.subject_id,
        department_id: subjectData?.department_id || null,
        topic: form.topic,
        instructor: profile?.full_name || 'Faculty',
        resolution: form.resolution,
        language: form.language,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration: formatDuration(duration),
        duration_seconds: Math.floor(duration),
        file_size: formatFileSize(selectedFile.size),
        file_size_bytes: selectedFile.size,
        is_active: true,
        uploaded_by: user.id,
      });
      if (dbError) throw dbError;
      setUploadProgress(100);

      toast({ title: 'Video uploaded!', description: `"${form.title}" added to ${selectedSubject.subject_name}.` });
      setForm({ title: '', description: '', subject_id: '', topic: '', resolution: '360p', language: 'en' });
      setSelectedFile(null);
      setSelectedThumbnail(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      fetchVideos();
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" />My Videos</CardTitle>
          <CardDescription>{videos.length} videos uploaded by you</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingVideos ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : videos.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No videos yet. Upload one below for your assigned subjects.</p>
          ) : (
            <div className="space-y-2">
              {videos.map(video => (
                <div key={video.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{video.title}</p>
                      <Badge variant="outline">{video.subject}</Badge>
                      <Badge variant="secondary">{getLanguageName(video.language)}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {video.duration && <span>{video.duration}</span>}
                      {video.file_size && <span>{video.file_size}</span>}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" disabled={deletingId === video.id}>
                        {deletingId === video.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Video</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete "{video.title}"?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteVideo(video.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload Video</CardTitle>
          <CardDescription>Upload a video for one of your assigned subjects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Video File *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${selectedFile ? 'border-success bg-success/5' : 'border-muted-foreground/25 hover:border-primary'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/x-matroska" onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!f.type.startsWith('video/')) { toast({ title: 'Invalid file type', description: 'Only MP4, WebM, and MKV files are allowed.', variant: 'destructive' }); return; }
                if (f.size > 500 * 1024 * 1024) { toast({ title: 'File too large', description: 'Maximum file size is 500MB.', variant: 'destructive' }); return; }
                setSelectedFile(f);
              }} className="hidden" />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileVideo className="h-8 w-8 text-success" />
                  <div className="text-left"><p className="font-medium">{selectedFile.name}</p><p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p></div>
                  <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedFile(null); }}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="space-y-2"><Video className="h-10 w-10 mx-auto text-muted-foreground" /><p className="font-medium">Click to select video</p></div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Thumbnail (Optional)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${selectedThumbnail ? 'border-success bg-success/5' : 'border-muted-foreground/25 hover:border-primary'}`}
              onClick={() => thumbnailInputRef.current?.click()}
            >
              <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) setSelectedThumbnail(f); }} className="hidden" />
              {selectedThumbnail ? (
                <div className="flex items-center justify-center gap-3">
                  <Check className="h-5 w-5 text-success" /><span className="text-sm">{selectedThumbnail.name}</span>
                  <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelectedThumbnail(null); }}><X className="h-4 w-4" /></Button>
                </div>
              ) : <p className="text-sm text-muted-foreground">Click to add thumbnail</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="e.g., Lecture 1 - Intro" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name} ({s.subject_code}) – {s.class_label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input placeholder="e.g., Chapter 1" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select value={form.resolution} onValueChange={(v: '360p' | '480p') => setForm({ ...form, resolution: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="360p">360p (Low Data)</SelectItem>
                  <SelectItem value="480p">480p (Better Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Language</Label>
              <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.nativeName} ({l.name})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>

          {isUploading && <Progress value={uploadProgress} className="h-2" />}

          <Button onClick={handleUpload} disabled={isUploading || !selectedFile || !form.title || !form.subject_id} className="w-full sm:w-auto">
            {isUploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading {uploadProgress}%</> : <><Upload className="h-4 w-4 mr-2" />Upload Video</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
