
-- Create phone_otps table for Twilio OTP verification
CREATE TABLE public.phone_otps (
  phone text PRIMARY KEY,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access
-- (edge functions use service role key)

-- Create sms_helpdesk_logs table
CREATE TABLE public.sms_helpdesk_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text,
  student_id uuid,
  question text NOT NULL,
  answer text NOT NULL,
  subject text,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_helpdesk_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view helpdesk logs"
ON public.sms_helpdesk_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
