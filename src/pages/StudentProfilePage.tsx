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
import { User, Mail, Building2, Users, BookOpen, Save, Loader2, Globe, Shield } from 'lucide-react';
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
      .update({ full_name: trimmedName || null, preferred_language: preferredLanguage })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated', description: 'Your details have been saved.' });
    }
    setSaving(false);
  };

  if (authLoading || !user) return null;

  const initials = (fullName || user.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Profile Header Card */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="h-24 gradient-primary relative" />
        <CardContent className="relative pt-0 pb-6 px-6">
          {/* Avatar */}
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground border-4 border-card shadow-lg avatar-ring">
              {initials}
            </div>
            <div className="pb-1">
              {loading ? (
                <>
                  <Skeleton className="h-6 w-40 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-foreground">{fullName || 'Student'}</h1>
                  <p className="text-sm text-muted-foreground">{profile?.email || user.email}</p>
                </>
              )}
            </div>
          </div>
          {/* Role badges */}
          <div className="flex gap-2 flex-wrap">
            {roles.length > 0 ? roles.map(r => (
              <Badge key={r} className="gap-1.5 capitalize">
                <Shield className="h-3 w-3" />{r}
              </Badge>
            )) : <Badge variant="secondary" className="gap-1.5"><User className="h-3 w-3" />Student</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10"><User className="h-4 w-4 text-primary" /></div>
            Personal Details
          </CardTitle>
          <CardDescription>Update your name and language preference</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  maxLength={100}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <div className="flex items-center gap-3 h-11 px-3 rounded-lg bg-muted/50 border">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{profile?.email || user.email || 'Not set'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Preferred Language
                </Label>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_LANGUAGES.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.nativeName} ({lang.name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={saving} className="gap-2 gradient-primary border-0 text-primary-foreground h-11 w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Class Assignment */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>
            Class Assignment
          </CardTitle>
          <CardDescription>Your department and class details (managed by HOD)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : classInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Building2, label: 'Department', value: classInfo.departments?.name || '—', color: 'bg-primary/10 text-primary' },
                { icon: Users, label: 'Year', value: `Year ${classInfo.year}`, color: 'bg-success/10 text-success' },
                { icon: BookOpen, label: 'Section', value: `Section ${classInfo.section}`, color: 'bg-accent/10 text-accent' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="p-4 rounded-xl bg-muted/50 border text-center transition-colors hover:bg-muted">
                  <div className={`inline-flex p-2 rounded-lg ${color} mb-2`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-3 rounded-xl bg-muted/50 w-fit mx-auto mb-3">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">You are not assigned to a class yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Contact your HOD to get assigned.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Subjects */}
      {subjects.length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-accent/10"><BookOpen className="h-4 w-4 text-accent" /></div>
              Department Subjects
            </CardTitle>
            <CardDescription>Subjects offered in your department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subjects.map(s => (
                <div key={s.subject_code} className="flex items-center justify-between p-3.5 rounded-xl border hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.subject_name}</p>
                    <p className="text-xs text-muted-foreground">{s.subject_code}</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-medium">Sem {s.semester}</Badge>
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