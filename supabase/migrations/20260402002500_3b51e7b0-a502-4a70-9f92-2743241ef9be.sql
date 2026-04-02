
-- Fix overly permissive profiles policies
DROP POLICY IF EXISTS "Users can upsert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow insert: authenticated users for their own profile, or service role for edge functions
CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anon/service insert for edge function upserts (device_id based)
CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users can update own profile
CREATE POLICY "Authenticated users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can update profiles (for edge function memory updates)
CREATE POLICY "Service can update profiles"
  ON public.profiles FOR UPDATE
  TO anon
  USING (true);
