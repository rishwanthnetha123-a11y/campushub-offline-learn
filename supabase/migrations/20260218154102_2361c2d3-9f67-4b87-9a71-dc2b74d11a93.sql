-- Fix admin_invites RLS: the existing policy is RESTRICTIVE which blocks access
-- We need a PERMISSIVE policy for admins to actually access the table

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can manage invites" ON public.admin_invites;

-- Create permissive policies
CREATE POLICY "Admins can view invites"
  ON public.admin_invites
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert invites"
  ON public.admin_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update invites"
  ON public.admin_invites
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));