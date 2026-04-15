-- ============================================
-- Supabase Storage Bucket Configuration
-- For Brand/Mark Images
-- ============================================

-- NOTE: Supabase storage buckets are created through the dashboard or via Supabase client library.
-- This file documents the configuration needed.

-- ============================================
-- STORAGE BUCKET SETUP (via Supabase Dashboard)
-- ============================================

-- 1. CREATE BUCKET IN SUPABASE DASHBOARD:
--    - Name: marks (or brand-logos)
--    - Public: YES (so images can be displayed on website)
--    - File size limit: 5MB per file
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- 2. BUCKET NAME: marks
--    Path structure: /marks/{mark_id}/{filename}
--    Example: /marks/550e8400-e29b-41d4-a716-446655440000/logo.png

-- ============================================
-- RLS POLICIES FOR STORAGE BUCKET
-- ============================================

-- Policy 1: Everyone can READ (public images)
-- =========================================
-- CREATE POLICY "Public Access to Brand Logos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'marks');

-- Policy 2: Authenticated users can UPLOAD their own brand logos
-- ==============================================================
-- CREATE POLICY "Users Can Upload Brand Logos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'marks' 
--   AND auth.role() = 'authenticated'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy 3: Users can UPDATE their own uploads
-- =============================================
-- CREATE POLICY "Users Can Update Own Brand Logos"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'marks' 
--   AND auth.role() = 'authenticated'
-- )
-- WITH CHECK (
--   bucket_id = 'marks' 
--   AND auth.role() = 'authenticated'
-- );

-- Policy 4: Users can DELETE their own uploads
-- =============================================
-- CREATE POLICY "Users Can Delete Own Brand Logos"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'marks' 
--   AND auth.role() = 'authenticated'
-- );

-- ============================================
-- PUBLIC ACCESS URL FORMAT
-- ============================================

-- After uploading a brand logo, you can access it at:
-- https://YOUR_SUPABASE_URL.supabase.co/storage/v1/object/public/marks/{mark_id}/{filename}

-- Example:
-- https://project-ref.supabase.co/storage/v1/object/public/marks/550e8400-e29b-41d4-a716-446655440000/coca-cola-logo.png

-- ============================================
-- PROGRAMMATIC SETUP (in TypeScript/JavaScript)
-- ============================================

/*
// Use this code to create the bucket programmatically:

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Create bucket (run once)
const { data, error } = await supabase
  .storage
  .createBucket('marks', {
    public: true,
    fileSizeLimit: 5242880, // 5MB in bytes
  })

if (error) console.error('Error creating bucket:', error)
else console.log('Bucket created:', data)

// Upload brand logo
const { data, error } = await supabase.storage
  .from('marks')
  .upload(`${markId}/logo.png`, file, {
    cacheControl: '3600',
    upsert: false,
  })

if (error) console.error('Upload error:', error)
else console.log('File uploaded:', data)

// Get public URL
const { data: { publicUrl } } = supabase
  .storage
  .from('marks')
  .getPublicUrl(`${markId}/logo.png`)

console.log('Public URL:', publicUrl)
*/

-- ============================================
-- SQL QUERIES FOR BRAND IMAGE MANAGEMENT
-- ============================================

-- Query 1: List all brands with their logos
-- ==========================================
-- SELECT id, name, logo_url, logo_file_path, is_logo_uploaded, logo_uploaded_at, logo_uploaded_by 
-- FROM marks 
-- WHERE is_active = true 
-- ORDER BY name ASC;

-- Query 2: List brands with missing logos
-- ========================================
-- SELECT id, name, logo_url, is_logo_uploaded 
-- FROM marks 
-- WHERE is_logo_uploaded = false OR logo_url IS NULL 
-- ORDER BY name ASC;

-- Query 3: Update brand logo URL
-- ==============================
-- UPDATE marks 
-- SET logo_url = 'https://project-ref.supabase.co/storage/v1/object/public/marks/{mark_id}/{filename}',
--     logo_file_path = '/marks/{mark_id}/{filename}',
--     is_logo_uploaded = true,
--     logo_uploaded_at = now()
-- WHERE id = '{mark_id}';

-- Query 4: Delete brand logo
-- ==========================
-- UPDATE marks 
-- SET logo_url = NULL,
--     logo_file_path = NULL,
--     is_logo_uploaded = false
-- WHERE id = '{mark_id}';

-- Query 5: Get storage usage for brand logos
-- ==========================================
-- SELECT 
--   COUNT(*) as total_brand_logos,
--   COUNT(CASE WHEN is_logo_uploaded = true THEN 1 END) as uploaded_logos,
--   COUNT(CASE WHEN is_logo_uploaded = false THEN 1 END) as missing_logos
-- FROM marks;

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- To remove a bucket (caution: this deletes all files!):
-- DELETE FROM storage.buckets WHERE name = 'marks';

-- To drop the new columns (undo):
-- ALTER TABLE public.marks
-- DROP COLUMN IF EXISTS logo_file_path,
-- DROP COLUMN IF EXISTS logo_uploaded_by,
-- DROP COLUMN IF EXISTS logo_uploaded_at,
-- DROP COLUMN IF EXISTS is_logo_uploaded;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify columns were added:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'marks' 
-- ORDER BY ordinal_position;

-- Verify indexes were created:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'marks';

-- ============================================
-- NEXT STEPS
-- ============================================

-- 1. Run this SQL script in Supabase SQL Editor
-- 2. Create the "marks" storage bucket in Supabase Dashboard
-- 3. Configure RLS policies for the bucket
-- 4. Update the React component to handle brand logo uploads
-- 5. Test the upload functionality in the Add Brand form
