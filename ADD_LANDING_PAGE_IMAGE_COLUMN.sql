-- ========== ADD LANDING PAGE IMAGE COLUMN TO WEBSITE_SETTINGS ==========

-- Add landing_page_image_url column if it doesn't exist
ALTER TABLE website_settings
ADD COLUMN IF NOT EXISTS landing_page_image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN website_settings.landing_page_image_url IS 'URL of the landing page background image that displays on the first page of the website';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'website_settings' AND column_name = 'landing_page_image_url';
