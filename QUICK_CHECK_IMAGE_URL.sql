-- QUICK FIX: Get the exact current state

-- 1. Check what's in website_settings
SELECT 
  id,
  store_name,
  slogan,
  description,
  logo_url,
  landing_page_image_url,
  updated_at
FROM public.website_settings;

-- 2. If landing_page_image_url is NULL, set a test image
-- First, let's see all data
SELECT * FROM public.website_settings LIMIT 10;

-- 3. If you have NO records, create one
INSERT INTO public.website_settings (
  id,
  store_name,
  slogan,
  description,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'M NEXT TECH',
  'Votre partenaire de confiance',
  'Description here',
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET 
  updated_at = NOW();

-- 4. Then check again what we have
SELECT 
  store_name,
  landing_page_image_url
FROM public.website_settings
WHERE id = '00000000-0000-0000-0000-000000000001';
