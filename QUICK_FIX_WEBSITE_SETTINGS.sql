-- ========== QUICK FIX - Copy & Paste This Into Supabase SQL Editor ==========

-- Step 1: Insert the default website_settings row
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

-- Step 2: Verify it worked
SELECT * FROM website_settings WHERE id = '00000000-0000-0000-0000-000000000001';
-- Should return 1 row with all your settings
