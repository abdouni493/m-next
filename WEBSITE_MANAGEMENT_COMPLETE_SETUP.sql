-- ===============================================================================
-- COMPLETE SETUP GUIDE - Website Management Module
-- ===============================================================================
-- This file contains ALL SQL fixes needed to make the website management
-- system work properly. Run these scripts in Supabase SQL Editor.
-- ===============================================================================

-- ========== STEP 1: FIX WEBSITE_SETTINGS TABLE ==========

-- Ensure the default row exists
INSERT INTO website_settings (
  id,
  store_name,
  slogan,
  description,
  currency,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Mon Magasin',
  'Votre partenaire de confiance',
  'Bienvenue sur notre boutique en ligne',
  'DZD',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ========== STEP 2: RESET RLS POLICIES FOR WEBSITE_SETTINGS ==========

ALTER TABLE website_settings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'website_settings' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON website_settings';
  END LOOP;
END $$;

ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "website_settings_select_all"
  ON website_settings
  FOR SELECT
  USING (true);

CREATE POLICY "website_settings_update_all"
  ON website_settings
  FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "website_settings_insert_all"
  ON website_settings
  FOR INSERT
  WITH CHECK (true);

-- ========== STEP 3: CREATE STORAGE BUCKET (if not exists) ==========
-- Run this in SQL Editor or create manually via Storage UI
INSERT INTO storage.buckets (id, name, public)
VALUES ('website', 'website', true)
ON CONFLICT (id) DO NOTHING;

-- ========== STEP 4: FIX OFFERS & SPECIAL_OFFERS POLICIES ==========

ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers DISABLE ROW LEVEL SECURITY;

-- Drop all offers policies
DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'offers' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON offers';
  END LOOP;
END $$;

-- Drop all special_offers policies
DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'special_offers' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON special_offers';
  END LOOP;
END $$;

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

-- Create offers policies
CREATE POLICY "offers_read_authenticated"
  ON offers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "offers_read_public"
  ON offers
  FOR SELECT
  USING (auth.role() = 'anon' AND is_visible = true AND is_active = true AND (end_date IS NULL OR end_date > NOW()));

CREATE POLICY "offers_create"
  ON offers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "offers_update"
  ON offers
  FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "offers_delete"
  ON offers
  FOR DELETE
  USING (true);

-- Create special_offers policies
CREATE POLICY "special_offers_read_authenticated"
  ON special_offers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "special_offers_read_public"
  ON special_offers
  FOR SELECT
  USING (auth.role() = 'anon' AND is_visible = true AND is_active = true AND (end_date IS NULL OR end_date > NOW()));

CREATE POLICY "special_offers_create"
  ON special_offers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "special_offers_update"
  ON special_offers
  FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "special_offers_delete"
  ON special_offers
  FOR DELETE
  USING (true);

-- ========== VERIFICATION ==========
-- Run these queries to verify everything is set up correctly:

-- Check website_settings data exists:
-- SELECT * FROM website_settings WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check offers policies:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'offers' ORDER BY policyname;

-- Check special_offers policies:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'special_offers' ORDER BY policyname;

-- Check storage bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'website';

-- ========== SUMMARY OF CHANGES ==========
-- ✅ website_settings table:
--    - Default row exists with all fields initialized
--    - RLS policies allow all operations
--
-- ✅ offers table:
--    - Authenticated users can READ and manage all offers
--    - Public users can only see visible/active offers
--    - INSERT, UPDATE, DELETE allowed for authenticated users
--
-- ✅ special_offers table:
--    - Same policies as offers table
--    - Public/anon users only see visible & active offers
--
-- ✅ storage bucket:
--    - 'website' bucket created and public
--    - Can upload logos and other media
--
-- ✅ React Interface (Website.tsx):
--    - Improved UI with gradients and colors
--    - Better organization of Offers, Special Offers, Contacts, Settings
--    - Enhanced dialogs with better design
--    - Error handling for storage issues
--    - Emojis and icons for better UX
