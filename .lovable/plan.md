

# Implementation Plan: SML Tutor Mode + Twilio OTP Auth + SMS Help Desk + DB Tables

The build error is a temporary git infrastructure issue, not a code bug. All previously created edge functions (send-otp, verify-otp, sms-helpdesk) are already in place. Here is the plan for completing the remaining work.

---

## 1. Create Database Tables (Migration)

Two tables need to be created for the Twilio OTP and SMS Help Desk features:

**`phone_otps`** - Stores temporary OTP hashes for phone verification
- `phone` (text, primary key) 
- `otp_hash` (text, not null)
- `expires_at` (timestamptz, not null)
- `created_at` (timestamptz, default now())
- RLS enabled, service-role only access

**`sms_helpdesk_logs`** - Records SMS help desk interactions
- `id` (uuid, primary key)
- `phone` (text)
- `student_id` (uuid, nullable)
- `question` (text)
- `answer` (text)
- `subject` (text, nullable)
- `language` (text, default 'en')
- `created_at` (timestamptz, default now())
- RLS enabled, admin-only SELECT access

---

## 2. Add SML Tutor Mode to Doubt Solver

**File: `supabase/functions/ask-doubt/index.ts`**
- Accept a new `mode` parameter (`general` or `sml_tutor`)
- When `mode === 'sml_tutor'`, use a dedicated SML Tutor system prompt that instructs the AI to act as a Standard ML expert tutor (explain types, pattern matching, recursion, syntax, etc.)
- Keep the existing general tutor prompt as default

**File: `src/pages/DoubtSolverPage.tsx`**
- Add a "Mode" toggle button group (General Tutor / SML Tutor) in the header area near the language/subject selectors
- Pass `mode` to the `ask-doubt` edge function in the request body
- When SML Tutor mode is active, update the placeholder text and suggested questions to SML-specific ones (e.g., "Explain pattern matching in SML", "What is a datatype in SML?")
- Add "Standard ML" to the SUBJECTS list

---

## 3. Wire Twilio OTP into Auth Page

**File: `src/pages/AuthPage.tsx`**
- Replace the current `supabase.auth.signInWithOtp({ phone })` call with a fetch to the `send-otp` edge function
- Replace `supabase.auth.verifyOtp(...)` with a fetch to the `verify-otp` edge function
- On successful verification:
  - If `is_new` is true, sign in with the returned `email` and `temp_password`
  - If `is_new` is false, sign in with the returned `email` using a magic-link-based approach or redirect to email sign-in
- Handle error states (invalid OTP, expired OTP, Twilio errors)

---

## 4. Update Edge Function Config

**File: `supabase/config.toml`**
- Entries for `send-otp`, `verify-otp`, and `sms-helpdesk` with `verify_jwt = false` are needed (send-otp and sms-helpdesk already exist in config, but verify-otp and sms-helpdesk need to be confirmed/added)

---

## 5. Summary of File Changes

| File | Action |
|------|--------|
| Database migration | Create `phone_otps` and `sms_helpdesk_logs` tables |
| `supabase/functions/ask-doubt/index.ts` | Add SML Tutor mode with dedicated system prompt |
| `src/pages/DoubtSolverPage.tsx` | Add mode toggle UI, pass mode to edge function |
| `src/pages/AuthPage.tsx` | Wire phone OTP to Twilio edge functions |
| `supabase/config.toml` | Add verify-otp and sms-helpdesk function entries |

