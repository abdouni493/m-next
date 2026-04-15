-- Check current website_settings
SELECT 
  id,
  store_name,
  logo_url,
  landing_page_image_url,
  updated_at
FROM public.website_settings
WHERE id = '00000000-0000-0000-0000-000000000001';

-- If empty, check if there are any records at all
SELECT COUNT(*) as total_records FROM public.website_settings;

-- Check all website_settings records
SELECT * FROM public.website_settings LIMIT 5;
