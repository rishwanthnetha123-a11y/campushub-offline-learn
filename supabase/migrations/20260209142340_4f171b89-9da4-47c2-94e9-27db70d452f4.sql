
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Videos table
CREATE TABLE public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    duration_seconds INTEGER,
    resolution TEXT DEFAULT '360p',
    file_size TEXT,
    file_size_bytes BIGINT,
    subject TEXT NOT NULL,
    topic TEXT,
    thumbnail_url TEXT,
    video_url TEXT NOT NULL,
    instructor TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active videos"
ON public.videos FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage videos"
ON public.videos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Resources table
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'pdf',
    file_size TEXT,
    file_size_bytes BIGINT,
    subject TEXT NOT NULL,
    topic TEXT,
    file_url TEXT NOT NULL,
    pages INTEGER,
    duration TEXT,
    is_active BOOLEAN DEFAULT true,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active resources"
ON public.resources FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage resources"
ON public.resources FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Student progress table
CREATE TABLE public.student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'video',
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    last_position INTEGER DEFAULT 0,
    quiz_completed BOOLEAN DEFAULT false,
    quiz_score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, content_id, content_type)
);
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
ON public.student_progress FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
ON public.student_progress FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_id TEXT NOT NULL,
    answers JSONB DEFAULT '[]',
    score INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quiz attempts"
ON public.quiz_attempts FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User downloads table
CREATE TABLE public.user_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'video',
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own downloads"
ON public.user_downloads FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all downloads"
ON public.user_downloads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin invites table
CREATE TABLE public.admin_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    invite_token UUID DEFAULT gen_random_uuid(),
    accepted BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invites"
ON public.admin_invites FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON public.student_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets for video and thumbnail uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies
CREATE POLICY "Anyone can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Anyone can view thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Admins can upload videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can upload thumbnails" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'thumbnails' AND public.has_role(auth.uid(), 'admin'));
