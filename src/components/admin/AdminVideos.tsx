import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Video, 
  Plus,
  Loader2,
  Check,
  X,
  FileVideo,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];

interface VideoForm {
  title: string;
  description: string;
  subject: string;
  topic: string;
  instructor: string;
  resolution: '360p' | '480p';
}

interface DBVideo {
  id: string;
  title: string;
  subject: string;
  duration: string | null;
  file_size: string | null;
  instructor: string | null;
  is_active: boolean | null;
  created_at: string;
}

export function AdminVideos() {
  const { toast } = useToast();
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
    title: '',
    description: '',
    subject: '',
    topic: '',
    instructor: '',
    resolution: '360p',
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, subject, duration, file_size, instructor, is_active, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoadingVideos(false);
  };

  const handleDeleteVideo = async (videoId: string) => {
    setDeletingId(videoId);
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast({
        title: 'Video deleted',
        description: 'The video has been removed from the library.',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete the video.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a video file.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file for thumbnail.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedThumbnail(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!selectedFile || !form.title || !form.subject) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields and select a video file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const duration = await getVideoDuration(selectedFile);
      const timestamp = Date.now();
      const videoFileName = `${timestamp}-${selectedFile.name}`;
      const thumbnailFileName = selectedThumbnail 
        ? `${timestamp}-${selectedThumbnail.name}` 
        : null;

      setUploadProgress(10);

      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (videoError) throw videoError;
      setUploadProgress(60);

      let thumbnailUrl = '';
      if (selectedThumbnail && thumbnailFileName) {
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, selectedThumbnail, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!thumbError && thumbData) {
          const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = publicUrl;
        }
      }
      setUploadProgress(80);

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName);

      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          title: form.title,
          description: form.description,
          subject: form.subject,
          topic: form.topic,
          instructor: form.instructor,
          resolution: form.resolution,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: formatDuration(duration),
          duration_seconds: Math.floor(duration),
          file_size: formatFileSize(selectedFile.size),
          file_size_bytes: selectedFile.size,
          is_active: true,
        });

      if (dbError) throw dbError;
      setUploadProgress(100);

      toast({
        title: 'Video uploaded!',
        description: `"${form.title}" has been added to the ${form.subject} library.`,
      });

      // Reset form & refresh list
      setForm({
        title: '',
        description: '',
        subject: '',
        topic: '',
        instructor: '',
        resolution: '360p',
      });
      setSelectedFile(null);
      setSelectedThumbnail(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      fetchVideos();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Videos List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Manage Videos
          </CardTitle>
          <CardDescription>
            {videos.length} videos in the library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingVideos ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : videos.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No videos uploaded yet. Use the form below to add videos.
            </p>
          ) : (
            <div className="space-y-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{video.title}</p>
                      <Badge variant="outline" className="shrink-0">
                        {video.subject}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {video.instructor && <span>{video.instructor}</span>}
                      {video.duration && <span>{video.duration}</span>}
                      {video.file_size && <span>{video.file_size}</span>}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={deletingId === video.id}
                      >
                        {deletingId === video.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Video</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{video.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteVideo(video.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Video
          </CardTitle>
          <CardDescription>
            Add educational videos to the library for students to access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video File Selection */}
          <div className="space-y-2">
            <Label>Video File *</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                selectedFile ? 'border-success bg-success/5' : 'border-muted-foreground/25 hover:border-primary'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileVideo className="h-8 w-8 text-success" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Video className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="font-medium">Click to select video file</p>
                  <p className="text-sm text-muted-foreground">
                    MP4, WebM, or other video formats
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Selection */}
          <div className="space-y-2">
            <Label>Thumbnail (Optional)</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                selectedThumbnail ? 'border-success bg-success/5' : 'border-muted-foreground/25 hover:border-primary'
              }`}
              onClick={() => thumbnailInputRef.current?.click()}
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              {selectedThumbnail ? (
                <div className="flex items-center justify-center gap-3">
                  <Check className="h-5 w-5 text-success" />
                  <span className="text-sm">{selectedThumbnail.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedThumbnail(null);
                      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click to add a thumbnail image
                </p>
              )}
            </div>
          </div>

          {/* Video Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Algebra"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select 
                value={form.subject} 
                onValueChange={(value) => setForm({ ...form, subject: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Linear Equations"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                placeholder="e.g., Prof. Sharma"
                value={form.instructor}
                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select 
                value={form.resolution} 
                onValueChange={(value: '360p' | '480p') => setForm({ ...form, resolution: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="360p">360p (Low Data)</SelectItem>
                  <SelectItem value="480p">480p (Better Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the video content..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Upload Button */}
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !selectedFile || !form.title || !form.subject}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
