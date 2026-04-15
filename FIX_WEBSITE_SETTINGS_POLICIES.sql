-- ========== ENSURE WEBSITE_SETTINGS IS FULLY ACCESSIBLE ==========

-- First, disable RLS on website_settings table if it's enabled
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;

-- Add a simple public access policy if needed
CREATE POLICY website_settings_public_access ON public.website_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- Verify the policy was created
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'website_settings';

-- Also ensure the table is readable
GRANT SELECT ON public.website_settings TO anon;
GRANT SELECT ON public.website_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.website_settings TO authenticated;
