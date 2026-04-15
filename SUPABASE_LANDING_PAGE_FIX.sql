-- ========== LANDING PAGE IMAGE - COMPLETE FIX SCRIPT ==========
-- Run this in Supabase SQL Editor to diagnose and fix the issue

-- ========== STEP 1: CHECK CURRENT STATE ==========
-- See what's currently stored
SELECT 
  id,
  store_name,
  logo_url,
  landing_page_image_url,
  updated_at,
  created_at
FROM public.website_settings
LIMIT 5;

-- ========== STEP 2: ENSURE TABLE EXISTS AND IS CORRECT ==========
-- Verify the landing_page_image_url column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'website_settings'
ORDER BY ordinal_position;

-- ========== STEP 3: DISABLE RLS IF NEEDED ==========
-- Make sure RLS is disabled on website_settings
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;

-- ========== STEP 4: CREATE PUBLIC ACCESS POLICY ==========
-- Drop existing policies first (if any)
DROP POLICY IF EXISTS website_settings_public_access ON public.website_settings;
DROP POLICY IF EXISTS website_settings_all ON public.website_settings;

-- Create new public access policy
CREATE POLICY website_settings_public_access ON public.website_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- ========== STEP 5: GRANT PERMISSIONS ==========
-- Ensure all roles can access
GRANT SELECT ON public.website_settings TO anon;
GRANT SELECT ON public.website_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_settings TO service_role;

-- ========== STEP 6: VERIFY POLICIES ==========
-- Check that policies are in place
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'website_settings';

-- ========== STEP 7: ENSURE RECORD EXISTS ==========
-- Make sure the primary record exists
INSERT INTO public.website_settings (
  id,
  store_name,
  slogan,
  description
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'My Store',
  'Your slogan here',
  'Your description here'
)
ON CONFLICT (id) DO NOTHING;

-- ========== STEP 8: UPDATE WITH IMAGE URL (IF YOU HAVE ONE) ==========
-- If you already have an image URL from storage, update it
-- Replace the URL below with your actual URL
UPDATE public.website_settings
SET landing_page_image_url = 'https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/chargers/landing_bg_[timestamp]_[filename].jpg'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ========== STEP 9: VERIFY FINAL STATE ==========
-- Check everything is correct
SELECT 
  id,
  store_name,
  slogan,
  description,
  logo_url,
  landing_page_image_url,
  updated_at
FROM public.website_settings
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ========== STEP 10: CHECK IF ANYTHING BLOCKS THE TABLE ==========
-- View all table permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'website_settings';
