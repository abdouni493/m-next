-- ========== DELIVERY AGENCY WILAYA-BASED PRICING TABLE ==========
-- This table allows setting different delivery prices for each wilaya per delivery agency

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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_delivery_agency_wilaya_prices_agency_id ON public.delivery_agency_wilaya_prices(agency_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agency_wilaya_prices_wilaya_name ON public.delivery_agency_wilaya_prices(wilaya_name);
CREATE INDEX IF NOT EXISTS idx_delivery_agency_wilaya_prices_active ON public.delivery_agency_wilaya_prices(is_active);

-- Create a view to get wilaya-specific prices with fallback to agency defaults
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
  CASE WHEN dawp.id IS NOT NULL THEN true ELSE false END as has_wilaya_pricing
FROM public.delivery_agencies da
LEFT JOIN public.delivery_agency_wilaya_prices dawp ON da.id = dawp.agency_id;

-- ========== SAMPLE DATA FOR WILAYA PRICING ==========
-- Uncomment to insert sample wilaya pricing data

-- Example: Add wilaya-specific pricing for Yassir Livraison
-- UPDATE: First insert Yassir if not exists
-- INSERT INTO delivery_agencies (name, price_domicile, price_bureau, is_active, is_visible)
-- VALUES ('Yassir Livraison', 0, 0, true, true)
-- ON CONFLICT (name) DO NOTHING;

-- Then add wilaya pricing:
-- INSERT INTO delivery_agency_wilaya_prices (agency_id, wilaya_name, price_domicile, price_bureau, is_active)
-- SELECT id, 'Algiers', 200.00, 150.00, true FROM delivery_agencies WHERE name = 'Yassir Livraison'
-- ON CONFLICT (agency_id, wilaya_name) DO NOTHING;

-- Repeat for other wilayas...
