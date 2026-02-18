import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Loader2,
  Check,
  X,
  Trash2,
  File
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
import { CONTENT_LANGUAGES, getLanguageName } from '@/lib/languages';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];
const RESOURCE_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'notes', label: 'Notes' },
  { value: 'audio', label: 'Audio' },
];

interface ResourceForm {
  title: string;
  description: string;
  subject: string;
  topic: string;
  type: string;
  language: string;
}

interface DBResource {
  id: string;
  title: string;
  subject: string;
  type: string;
  file_size: string | null;
  pages: number | null;
  is_active: boolean | null;
  language: string;
  created_at: string;
}

export function AdminResources() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resources, setResources] = useState<DBResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceForm>({
    title: '',
    description: '',
    subject: '',
    topic: '',
    type: 'pdf',
    language: 'en',
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, subject, type, file_size, pages, is_active, language, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setResources(data);
    }
    setLoadingResources(false);
  };

  const handleDeleteResource = async (resourceId: string) => {
    setDeletingId(resourceId);
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      setResources(prev => prev.filter(r => r.id !== resourceId));
      toast({
        title: 'Resource deleted',
        description: 'The resource has been removed.',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete the resource.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getAcceptType = () => {
    switch (form.type) {
      case 'pdf': return '.pdf';
      case 'audio': return 'audio/*';
      default: return '.pdf,.doc,.docx,.txt';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !form.title || !form.subject) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields and select a file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${selectedFile.name}`;
      setUploadProgress(10);

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      setUploadProgress(60);

      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(fileName);

      setUploadProgress(80);

      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: form.title,
          description: form.description,
          subject: form.subject,
          topic: form.topic,
          type: form.type,
          language: form.language,
          file_url: publicUrl,
          file_size: formatFileSize(selectedFile.size),
          file_size_bytes: selectedFile.size,
          is_active: true,
        });

      if (dbError) throw dbError;
      setUploadProgress(100);

      toast({
        title: 'Resource uploaded!',
        description: `"${form.title}" has been added to ${form.subject}.`,
      });

      setForm({ title: '', description: '', subject: '', topic: '', type: 'pdf', language: 'en' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchResources();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manage Resources
          </CardTitle>
          <CardDescription>{resources.length} resources in the library</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingResources ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : resources.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No resources yet. Use the form below to add resources.
            </p>
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{resource.title}</p>
                      <Badge variant="outline" className="shrink-0">{resource.subject}</Badge>
                      <Badge variant="secondary" className="shrink-0">{resource.type.toUpperCase()}</Badge>
                      <Badge variant="secondary" className="shrink-0">{getLanguageName(resource.language)}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {resource.file_size && <span>{resource.file_size}</span>}
                      {resource.pages && <span>{resource.pages} pages</span>}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        disabled={deletingId === resource.id}
                      >
                        {deletingId === resource.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{resource.title}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteResource(resource.id)}
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
            Upload New Resource
          </CardTitle>
          <CardDescription>Add PDFs, notes, or audio materials for students</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label>File *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                selectedFile ? 'border-success bg-success/5' : 'border-muted-foreground/25 hover:border-primary'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptType()}
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="h-8 w-8 text-success" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
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
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="font-medium">Click to select file</p>
                  <p className="text-sm text-muted-foreground">PDF, DOC, audio files</p>
                </div>
              )}
            </div>
          </div>

          {/* Resource Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="res-title">Title *</Label>
              <Input
                id="res-title"
                placeholder="e.g., Algebra Formulas Cheat Sheet"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-subject">Subject *</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-type">Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-topic">Topic</Label>
              <Input
                id="res-topic"
                placeholder="e.g., Quadratic Equations"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-language">Language *</Label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-desc">Description</Label>
            <Textarea
              id="res-desc"
              placeholder="Brief description of this resource..."
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

          <Button onClick={handleUpload} disabled={isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resource
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
