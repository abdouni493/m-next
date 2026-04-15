-- ============================================================
-- 🔍 BACKGROUND IMAGE DATABASE VERIFICATION QUERIES
-- ============================================================

-- 1. CHECK CURRENT WEBSITE SETTINGS
SELECT 
  id,
  store_name,
  slogan,
  description,
  logo_url,
  landing_page_image_url,
  created_at,
  updated_at
FROM public.website_settings
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Expected Result:
-- landing_page_image_url should be:
-- - NULL (if no image uploaded yet) OR
-- - https://pzzngzaljrfrbteclexi.supabase.co/storage/v1/object/public/chargers/landing_bg_[timestamp]_[filename] (if uploaded)

-- 2. CHECK IF WEBSITE_SETTINGS TABLE HAS DATA
SELECT COUNT(*) as total_records FROM public.website_settings;

-- 3. GET FULL WEBSITE SETTINGS
SELECT * FROM public.website_settings;

-- 4. IF NO RECORDS, CREATE INITIAL RECORD
INSERT INTO public.website_settings (
  id,
  store_name,
  slogan,
  description,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'M NEXT TECH',
  'Your trusted partner',
  'Premium charging solutions',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 5. CLEAR BROKEN IMAGE URL (if needed)
-- Only run this if landing_page_image_url contains placeholder text
UPDATE public.website_settings 
SET landing_page_image_url = NULL 
WHERE id = '00000000-0000-0000-0000-000000000001'
AND (
  landing_page_image_url LIKE '%[YOUR-PROJECT]%'
  OR landing_page_image_url LIKE '%[timestamp]%'
  OR landing_page_image_url LIKE '%[filename]%'
  OR landing_page_image_url IS NULL
);

-- 6. UPDATE WITH VALID IMAGE URL (manual test - replace with real URL)
-- UPDATE public.website_settings 
-- SET landing_page_image_url = 'https://pzzngzaljrfrbteclexi.supabase.co/storage/v1/object/public/chargers/landing_bg_1234567890_test.jpg'
-- WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================
-- 📊 CHECK STORAGE BUCKET
-- ============================================================

-- Note: Supabase storage isn't queryable via SQL
-- Instead, verify in Supabase Dashboard:
-- 1. Go to Storage → chargers bucket
-- 2. Look for files starting with "landing_bg_"
-- 3. Verify the file exists and is accessible
-- 4. Try opening the URL in browser

-- ============================================================
-- 🔐 VERIFY RLS POLICIES
-- ============================================================

-- Check if you have select permission on website_settings
SELECT 1 FROM public.website_settings LIMIT 1;

-- Expected: Should return 1 row (no permission error)

-- ============================================================
-- 🎯 DEBUGGING STEPS
-- ============================================================

-- Step 1: Check if data loads
-- → Run: SELECT * FROM public.website_settings;
-- → Should see store_name and other data

-- Step 2: Check image URL format
-- → Run: SELECT landing_page_image_url FROM public.website_settings;
-- → Should be full Supabase URL or NULL

-- Step 3: Verify URL is accessible
-- → Copy the URL from database
-- → Paste in browser
-- → Should download image file

-- Step 4: Check for placeholder text
-- → Run: SELECT landing_page_image_url FROM public.website_settings;
-- → If contains [YOUR-PROJECT], [timestamp], or [filename] → broken
-- → Run Step 5 to clear it

-- Step 5: If broken, clear the URL
-- → Run the "CLEAR BROKEN IMAGE URL" query above

-- Step 6: Re-upload image via admin panel
-- → Go to http://localhost:8083/dashboard/website
-- → Settings tab
-- → Upload image and Save

-- ============================================================
-- 📝 NOTES
-- ============================================================

-- The landing_page_image_url should follow this pattern:
-- https://[PROJECT_ID].supabase.co/storage/v1/object/public/chargers/landing_bg_[TIMESTAMP]_[FILENAME]
--
-- Example:
-- https://pzzngzaljrfrbteclexi.supabase.co/storage/v1/object/public/chargers/landing_bg_1713052800000_myimage.jpg

-- If you see [YOUR-PROJECT], [timestamp], or [filename] literally in the URL:
-- → This is the broken placeholder
-- → Delete and re-upload the image

-- ============================================================
