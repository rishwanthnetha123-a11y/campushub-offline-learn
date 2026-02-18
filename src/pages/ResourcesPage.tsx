import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Music, StickyNote, Loader2, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/ContentCard';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { subjects } from '@/data/demo-content';
import { supabase } from '@/integrations/supabase/client';
import { CONTENT_LANGUAGES } from '@/lib/languages';
import type { Resource } from '@/types/content';

const resourceTypeIcons = {
  pdf: FileText,
  audio: Music,
  notes: StickyNote,
};

const ResourcesPage = () => {
  const navigate = useNavigate();
  const { isDownloaded, markAsDownloaded, removeDownload, getProgress } = useOfflineStorage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [dbResources, setDbResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDbResources(data.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          type: r.type as 'pdf' | 'notes' | 'audio',
          fileSize: r.file_size || '',
          fileSizeBytes: r.file_size_bytes || 0,
          subject: r.subject,
          topic: r.topic || '',
          fileUrl: r.file_url,
          pages: r.pages || undefined,
          duration: r.duration || undefined,
          language: (r as any).language || 'en',
        })));
      }
      setLoading(false);
    };
    fetchResources();
  }, []);

  const filteredResources = dbResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !selectedSubject || resource.subject === selectedSubject;
    const matchesType = !selectedType || resource.type === selectedType;
    const matchesLanguage = !selectedLanguage || resource.language === selectedLanguage;
    return matchesSearch && matchesSubject && matchesType && matchesLanguage;
  });

  const handleResourceClick = (resourceId: string) => {
    navigate(`/resource/${resourceId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-success" />
            Learning Resources
          </h1>
          <p className="text-muted-foreground">
            {dbResources.length} resources • PDFs, notes, and audio materials
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground self-center mr-2">Type:</span>
          <Button
            variant={selectedType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            All
          </Button>
          {Object.entries(resourceTypeIcons).map(([type, Icon]) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="gap-1"
            >
              <Icon className="h-3 w-3" />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Subject Filter */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground self-center mr-2">Subject:</span>
          <Button
            variant={selectedSubject === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSubject(null)}
          >
            All
          </Button>
          {subjects.map(subject => (
            <Button
              key={subject}
              variant={selectedSubject === subject ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(subject)}
            >
              {subject}
            </Button>
          ))}
        </div>

        {/* Language Filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <Globe className="h-4 w-4 text-muted-foreground mr-1" />
          <Button
            variant={selectedLanguage === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLanguage(null)}
          >
            All Languages
          </Button>
          {CONTENT_LANGUAGES.slice(0, 5).map(lang => (
            <Button
              key={lang.code}
              variant={selectedLanguage === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLanguage(lang.code)}
            >
              {lang.nativeName}
            </Button>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-success/5 border border-success/20 rounded-lg p-4 flex items-center gap-3">
        <div className="p-2 rounded-full bg-success/10">
          <FileText className="h-5 w-5 text-success" />
        </div>
        <div>
          <p className="font-medium text-foreground">Lightweight Resources</p>
          <p className="text-sm text-muted-foreground">
            All resources are optimized for low storage. Download for offline access anytime.
          </p>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(resource => {
          const progress = getProgress(resource.id);
          
          return (
            <ContentCard
              key={resource.id}
              content={resource}
              type="resource"
              isDownloaded={isDownloaded(resource.id)}
              learningProgress={progress?.progress}
              onDownload={() => markAsDownloaded(resource.id, 'resource')}
              onRemove={() => removeDownload(resource.id)}
              onClick={() => handleResourceClick(resource.id)}
            />
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No resources found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
