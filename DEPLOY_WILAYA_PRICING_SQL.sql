-- ========== DEPLOY: Wilaya-Based Delivery Pricing System ==========
-- Run this SQL script in your Supabase SQL Editor to enable the feature

-- Step 1: Create the main table for wilaya prices
CREATE TABLE IF NOT EXISTS public.delivery_agency_wilaya_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL,
  wilaya_name character varying NOT NULL,
  price_domicile numeric NOT NULL DEFAULT 0,
  price_bureau numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT delivery_agency_wilaya_prices_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_agency_wilaya_prices_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.delivery_agencies(id) ON DELETE CASCADE,
  CONSTRAINT delivery_agency_wilaya_prices_unique UNIQUE (agency_id, wilaya_name)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_agency_wilaya_prices_agency_id 
  ON public.delivery_agency_wilaya_prices(agency_id);

CREATE INDEX IF NOT EXISTS idx_delivery_agency_wilaya_prices_wilaya_name 
  ON public.delivery_agency_wilaya_prices(wilaya_name);

CREATE INDEX IF NOT EXISTS idx_delivery_agency_wilaya_prices_active 
  ON public.delivery_agency_wilaya_prices(is_active);

-- Step 3: Create a helpful view for price lookup with fallback
CREATE OR REPLACE VIEW delivery_prices_with_wilaya_fallback AS
SELECT 
  da.id as agency_id,
  da.name as agency_name,
  da.description,
  da.logo_url,
  da.contact_phone,
  da.contact_email,
  da.is_active,
  da.is_visible,
  COALESCE(dawp.wilaya_name, 'DEFAULT') as wilaya_name,
  COALESCE(dawp.price_domicile, da.price_domicile) as price_domicile,
  COALESCE(dawp.price_bureau, da.price_bureau) as price_bureau,
  CASE WHEN dawp.id IS NOT NULL THEN true ELSE false END as has_wilaya_pricing,
  dawp.created_at as wilaya_pricing_created_at,
  dawp.updated_at as wilaya_pricing_updated_at
FROM public.delivery_agencies da
LEFT JOIN public.delivery_agency_wilaya_prices dawp ON da.id = dawp.agency_id AND dawp.is_active = true;

-- Step 4: Verify the installation was successful
SELECT 'Wilaya Pricing Table Created Successfully ✅' as status,
  COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'delivery_agency_wilaya_prices';

-- ========== OPTIONAL: Add sample data for testing ==========
-- Uncomment and run to add sample wilaya pricing data

-- Step 5a: Get an agency ID (replace with your agency ID)
-- SELECT id, name FROM public.delivery_agencies LIMIT 1;

-- Step 5b: Insert sample prices for Yassir Livraison (replace agency_id)
-- INSERT INTO public.delivery_agency_wilaya_prices 
--   (agency_id, wilaya_name, price_domicile, price_bureau, is_active)
-- VALUES 
--   ('YOUR_AGENCY_ID_HERE', 'Algiers', 200.00, 150.00, true),
--   ('YOUR_AGENCY_ID_HERE', 'Oran', 350.00, 280.00, true),
--   ('YOUR_AGENCY_ID_HERE', 'Constantine', 400.00, 320.00, true),
--   ('YOUR_AGENCY_ID_HERE', 'Béjaïa', 380.00, 300.00, true),
--   ('YOUR_AGENCY_ID_HERE', 'Annaba', 420.00, 350.00, true);

-- ========== USEFUL QUERIES ==========

-- Query 1: View all configured wilaya prices for a specific agency
-- SELECT 
--   wilaya_name,
--   price_domicile,
--   price_bureau,
--   (price_domicile + price_bureau) / 2 as average_price,
--   created_at,
--   updated_at
-- FROM public.delivery_agency_wilaya_prices
-- WHERE agency_id = 'YOUR_AGENCY_ID'
-- ORDER BY wilaya_name;

-- Query 2: Find which agencies have wilaya-specific pricing
-- SELECT 
--   da.name as agency_name,
--   COUNT(dawp.id) as configured_wilayas
-- FROM public.delivery_agencies da
-- LEFT JOIN public.delivery_agency_wilaya_prices dawp ON da.id = dawp.agency_id
-- GROUP BY da.id, da.name
-- HAVING COUNT(dawp.id) > 0
-- ORDER BY configured_wilayas DESC;

-- Query 3: Get effective price for a customer (with fallback)
-- SELECT 
--   agency_name,
--   wilaya_name,
--   price_domicile,
--   price_bureau,
--   has_wilaya_pricing,
--   CASE 
--     WHEN has_wilaya_pricing THEN 'Wilaya-Specific'
--     ELSE 'Agency Default'
--   END as price_type
-- FROM delivery_prices_with_wilaya_fallback
-- WHERE agency_name = 'Yassir Livraison'
-- AND wilaya_name IN ('Algiers', 'DEFAULT');

-- Query 4: Find missing wilaya prices (find unconfigured wilayas)
-- WITH all_wilayas AS (
--   SELECT DISTINCT wilaya_name 
--   FROM (
--     SELECT 'Adrar' as wilaya_name UNION
--     SELECT 'Chlef' UNION
--     SELECT 'Laghouat' UNION
--     SELECT 'Oum El Bouaghi' UNION
--     SELECT 'Batna' 
--     -- ... include all 58 wilayas
--   ) AS wilayas
-- )
-- SELECT aw.wilaya_name
-- FROM all_wilayas aw
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.delivery_agency_wilaya_prices dawp
--   WHERE dawp.agency_id = 'YOUR_AGENCY_ID'
--   AND dawp.wilaya_name = aw.wilaya_name
-- );

-- Query 5: Statistics - Average delivery prices by wilaya
-- SELECT 
--   wilaya_name,
--   ROUND(AVG(price_domicile)::numeric, 2) as avg_domicile_price,
--   ROUND(AVG(price_bureau)::numeric, 2) as avg_bureau_price,
--   COUNT(*) as agencies_with_this_price
-- FROM public.delivery_agency_wilaya_prices
-- WHERE is_active = true
-- GROUP BY wilaya_name
-- ORDER BY wilaya_name;

-- ========== MAINTENANCE QUERIES ==========

-- Deactivate all wilaya prices for an agency (soft delete)
-- UPDATE public.delivery_agency_wilaya_prices
-- SET is_active = false, updated_at = CURRENT_TIMESTAMP
-- WHERE agency_id = 'YOUR_AGENCY_ID';

-- Reactivate wilaya prices
-- UPDATE public.delivery_agency_wilaya_prices
-- SET is_active = true, updated_at = CURRENT_TIMESTAMP
-- WHERE agency_id = 'YOUR_AGENCY_ID'
-- AND is_active = false;

-- Update all prices for an agency (e.g., increase by 10%)
-- UPDATE public.delivery_agency_wilaya_prices
-- SET 
--   price_domicile = ROUND((price_domicile * 1.10)::numeric, 2),
--   price_bureau = ROUND((price_bureau * 1.10)::numeric, 2),
--   updated_at = CURRENT_TIMESTAMP
-- WHERE agency_id = 'YOUR_AGENCY_ID';

-- Delete all wilaya prices for an agency (hard delete)
-- DELETE FROM public.delivery_agency_wilaya_prices
-- WHERE agency_id = 'YOUR_AGENCY_ID';

-- ========== VERIFICATION ==========

-- Final verification query - Run this to confirm everything is set up
SELECT 
  'delivery_agency_wilaya_prices table' as item,
  COUNT(*) as count,
  'EXISTS ✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'delivery_agency_wilaya_prices'
UNION ALL
SELECT 
  'idx_delivery_agency_wilaya_prices_agency_id index',
  COUNT(*),
  'EXISTS ✅'
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'delivery_agency_wilaya_prices'
AND indexname = 'idx_delivery_agency_wilaya_prices_agency_id'
UNION ALL
SELECT 
  'delivery_prices_with_wilaya_fallback view',
  COUNT(*),
  'EXISTS ✅'
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'delivery_prices_with_wilaya_fallback';
