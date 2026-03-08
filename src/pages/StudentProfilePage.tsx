import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building2, Users, BookOpen, Save, Loader2 } from 'lucide-react';
import { CONTENT_LANGUAGES } from '@/lib/languages';

interface ProfileData {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  department_id: string | null;
  class_id: string | null;
}

interface ClassInfo {
  year: number;
  section: string;
  departments: { name: string } | null;
}

interface SubjectInfo {
  subject_name: string;
  subject_code: string;
  semester: number;
}

const StudentProfilePage = () => {
  const { user, isLoading: authLoading, roles } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, preferred_language, department_id, class_id')
        .eq('id', user.id)
        .single();

      if (prof) {
        setProfile(prof);
        setFullName(prof.full_name || '');
        setPreferredLanguage(prof.preferred_language || 'en');

        if (prof.class_id) {
          const { data: cls } = await supabase
            .from('classes')
            .select('year, section, departments(name)')
            .eq('id', prof.class_id)
            .single();
          setClassInfo(cls as any);
        }

        if (prof.department_id) {
          const { data: subs } = await supabase
            .from('subjects')
            .select('subject_name, subject_code, semester')
            .eq('department_id', prof.department_id)
            .order('semester')
            .order('subject_name');
          setSubjects((subs as any) || []);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const trimmedName = fullName.trim();
    if (trimmedName.length > 100) {
      toast({ title: 'Name too long', description: 'Max 100 characters.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName || null,
        preferred_language: preferredLanguage,
      })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated', description: 'Your details have been saved.' });
    }
    setSaving(false);
  };

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm">View and update your personal details</p>
      </div>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" />Personal Details</CardTitle>
          <CardDescription>Update your name and language preference</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{profile?.email || user.email || 'Not set'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Language</Label>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_LANGUAGES.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.nativeName} ({lang.name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="flex gap-2 flex-wrap">
                  {roles.length > 0 ? roles.map(r => (
                    <Badge key={r} variant="secondary" className="capitalize">{r}</Badge>
                  )) : <Badge variant="outline">Student</Badge>}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Class Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" />Class Assignment</CardTitle>
          <CardDescription>Your department and class details (managed by admin/HOD)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : classInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border text-center">
                <Building2 className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-semibold text-foreground text-sm">{classInfo.departments?.name || '—'}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Year</p>
                <p className="font-semibold text-foreground text-sm">Year {classInfo.year}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border text-center">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Section</p>
                <p className="font-semibold text-foreground text-sm">Section {classInfo.section}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">You are not assigned to a class yet. Contact your admin or HOD.</p>
          )}
        </CardContent>
      </Card>

      {/* Department Subjects */}
      {subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5" />Department Subjects</CardTitle>
            <CardDescription>Subjects offered in your department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subjects.map(s => (
                <div key={s.subject_code} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.subject_name}</p>
                    <p className="text-xs text-muted-foreground">{s.subject_code}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Sem {s.semester}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentProfilePage;
