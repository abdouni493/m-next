-- ============================================================================
-- SUPABASE STORAGE CONFIGURATION AND RLS POLICIES FOR IMAGE UPLOADS
-- ============================================================================
-- This SQL configures the 'chargers' storage bucket and creates proper RLS 
-- policies to allow authenticated users to upload, read, and delete images.
--
-- EXECUTION STEPS:
-- 1. Copy all content
-- 2. Go to: https://app.supabase.com/project/pzzngzaljrfrbteclexi/sql/new
-- 3. Paste the entire content
-- 4. Click RUN
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENSURE product_images TABLE HAS CORRECT RLS POLICIES
-- ============================================================================

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "product_images_read_all" ON public.product_images;
DROP POLICY IF EXISTS "product_images_insert_authenticated" ON public.product_images;
DROP POLICY IF EXISTS "product_images_delete_admin" ON public.product_images;
DROP POLICY IF EXISTS "Allow authenticated to view product_images" ON public.product_images;
DROP POLICY IF EXISTS "Allow admins to manage product_images" ON public.product_images;

-- SELECT Policy: Anyone can read product images
CREATE POLICY "product_images_select_all" ON public.product_images
  FOR SELECT 
  USING (true);

-- INSERT Policy: Authenticated users can insert product images
CREATE POLICY "product_images_insert_authenticated" ON public.product_images
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Authenticated users can update their own images
CREATE POLICY "product_images_update_authenticated" ON public.product_images
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- DELETE Policy: Admins can delete product images
CREATE POLICY "product_images_delete_admin" ON public.product_images
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 2: STORAGE BUCKET POLICIES FOR 'chargers' BUCKET
-- ============================================================================
-- These policies control access to files in the storage.objects table

-- Policy 1: Allow anyone to read/view images from chargers bucket
DROP POLICY IF EXISTS "Allow public to read chargers" ON storage.objects;
CREATE POLICY "Allow public to read chargers" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'chargers');

-- Policy 2: Allow authenticated users to upload images to chargers bucket
DROP POLICY IF EXISTS "Allow authenticated uploads chargers" ON storage.objects;
CREATE POLICY "Allow authenticated uploads chargers" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'chargers' AND
    auth.role() = 'authenticated'
  );

-- Policy 3: Allow authenticated users to update their own uploads
DROP POLICY IF EXISTS "Allow authenticated to update chargers" ON storage.objects;
CREATE POLICY "Allow authenticated to update chargers" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'chargers' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'chargers' AND auth.role() = 'authenticated');

-- Policy 4: Allow admins to delete images from chargers bucket
DROP POLICY IF EXISTS "Allow admin to delete chargers" ON storage.objects;
CREATE POLICY "Allow admin to delete chargers" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chargers' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 3: VERIFY CONFIGURATION
-- ============================================================================

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- Check product_images policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'product_images'
ORDER BY policyname;

-- Check buckets exist
SELECT 
  id,
  name,
  owner,
  public,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- SECTION 4: NOTES
-- ============================================================================
/*
STORAGE BUCKET POLICIES EXPLAINED:

1. "Allow public to read chargers"
   - Anyone (including unauthenticated) can READ images
   - This makes images viewable in the app without auth

2. "Allow authenticated uploads chargers"
   - Only logged-in users can UPLOAD to the chargers bucket
   - Prevents spam and unauthorized uploads

3. "Allow authenticated to update chargers"
   - Logged-in users can modify their uploaded files
   - Useful for replacing images

4. "Allow admin to delete chargers"
   - Only admins can DELETE images
   - Prevents accidental or malicious deletion

PUBLIC BUCKET:
- The 'chargers' bucket should be set to PUBLIC in Storage settings
- This allows the public URLs to be accessible without auth tokens

DATABASE LINKS:
- product_images table stores:
  - product_id: Links to the product
  - image_url: The public URL from storage
  - file_path: The path in the bucket
  - display_order: Order of images
  - is_primary: Primary image flag

FLOW:
1. User selects image in Inventory.tsx
2. uploadImages() function uploads to storage.objects
3. Returns public URL (e.g., https://...storage/chargers/product-id/image.jpg)
4. Saves URL to product_images table
5. Image displays in app using the URL

IF UPLOADS STILL FAIL:
1. Check that bucket 'chargers' exists in Supabase Storage
2. Ensure bucket is set to PUBLIC in Storage settings
3. Verify policies above are created
4. Check browser console for specific error
5. Ensure user is authenticated (has valid session)
*/
