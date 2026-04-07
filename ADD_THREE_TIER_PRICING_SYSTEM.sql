-- ============================================
-- THREE-TIER PRICING SYSTEM MIGRATION
-- ============================================
-- This migration adds support for three-tier pricing:
-- 1. selling_price_1 (Normal Price)
-- 2. selling_price_2 (Revendeur - Reseller Price)
-- 3. selling_price_3 (Gros - Wholesale Price)

-- ============================================
-- 1. ALTER PRODUCTS TABLE - ADD THREE-TIER PRICING
-- ============================================

-- Add three selling price columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS selling_price_1 numeric NOT NULL DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS selling_price_2 numeric NOT NULL DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS selling_price_3 numeric NOT NULL DEFAULT 0;

-- Migrate existing selling_price to selling_price_1
UPDATE public.products
SET selling_price_1 = selling_price
WHERE selling_price_1 = 0 AND selling_price > 0;

-- Update selling_price_2 and selling_price_3 with default values (80% and 60% of selling_price_1)
UPDATE public.products
SET 
  selling_price_2 = ROUND(selling_price_1 * 0.80, 2),
  selling_price_3 = ROUND(selling_price_1 * 0.60, 2)
WHERE selling_price_2 = 0 AND selling_price_3 = 0;

-- Keep selling_price column for backward compatibility but sync it with selling_price_1
-- You can optionally add a trigger to keep them in sync
ALTER TABLE public.products
ADD CONSTRAINT selling_price_sync CHECK (selling_price = selling_price_1);

-- ============================================
-- 2. CREATE CLIENTS TABLE (CUSTOMERS WITH PRICE TIER)
-- ============================================

-- Rename or create a more descriptive table for client management
-- Add price_tier column to existing customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS price_tier integer NOT NULL DEFAULT 1;

-- Add constraint to ensure price_tier is 1, 2, or 3
ALTER TABLE public.customers
ADD CONSTRAINT customers_price_tier_check CHECK (price_tier IN (1, 2, 3));

-- Add a column to track if this is an internal client (for POS system)
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS client_type character varying DEFAULT 'retail' CHECK (client_type IN ('retail', 'wholesale', 'reseller'));

-- Add a column for notes/tags
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS notes text;

-- ============================================
-- 3. CREATE CLIENT PURCHASE HISTORY VIEW
-- ============================================

-- Create a view to easily access client purchase history
CREATE OR REPLACE VIEW public.client_purchase_history AS
SELECT 
  si.id,
  si.invoice_number,
  c.id as customer_id,
  c.name as customer_name,
  c.phone as customer_phone,
  si.invoice_date,
  si.total_amount,
  si.payment_method,
  si.status,
  si.notes,
  si.items
FROM public.sales_invoices si
JOIN public.customers c ON si.customer_id = c.id
ORDER BY si.invoice_date DESC;

-- ============================================
-- 4. UPDATE CART_ITEMS TO SUPPORT PRICE TIER
-- ============================================

-- Add column to track which price tier was used when item was added
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS price_tier integer DEFAULT 1;

-- Add constraint
ALTER TABLE public.cart_items
ADD CONSTRAINT cart_items_price_tier_check CHECK (price_tier IN (1, 2, 3));

-- ============================================
-- 5. UPDATE INVOICE_ITEMS TO TRACK PRICE TIER
-- ============================================

-- Add column to track which price tier was used for this line item
ALTER TABLE public.invoice_items
ADD COLUMN IF NOT EXISTS price_tier integer DEFAULT 1;

-- Add constraint
ALTER TABLE public.invoice_items
ADD CONSTRAINT invoice_items_price_tier_check CHECK (price_tier IN (1, 2, 3));

-- ============================================
-- 6. UPDATE ORDER_ITEMS TO TRACK PRICE TIER
-- ============================================

-- Add column to track which price tier was used
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS price_tier integer DEFAULT 1;

-- Add constraint
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_price_tier_check CHECK (price_tier IN (1, 2, 3));

-- ============================================
-- 7. CREATE FUNCTION TO GET CLIENT PRICING
-- ============================================

CREATE OR REPLACE FUNCTION public.get_product_price_for_client(
  product_id uuid,
  client_id uuid
)
RETURNS numeric AS $$
DECLARE
  price_tier integer;
  selling_price_1 numeric;
  selling_price_2 numeric;
  selling_price_3 numeric;
  result_price numeric;
BEGIN
  -- Get the client's price tier
  SELECT customers.price_tier INTO price_tier
  FROM public.customers
  WHERE customers.id = client_id;

  -- If client not found, default to tier 1
  IF price_tier IS NULL THEN
    price_tier := 1;
  END IF;

  -- Get product prices
  SELECT p.selling_price_1, p.selling_price_2, p.selling_price_3
  INTO selling_price_1, selling_price_2, selling_price_3
  FROM public.products p
  WHERE p.id = product_id;

  -- Return appropriate price based on tier
  IF price_tier = 1 THEN
    result_price := selling_price_1;
  ELSIF price_tier = 2 THEN
    result_price := selling_price_2;
  ELSIF price_tier = 3 THEN
    result_price := selling_price_3;
  ELSE
    result_price := selling_price_1;
  END IF;

  RETURN COALESCE(result_price, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. CREATE CLIENT SUMMARY VIEW
-- ============================================

CREATE OR REPLACE VIEW public.client_summary AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.email,
  c.price_tier,
  c.client_type,
  c.is_active,
  COUNT(DISTINCT si.id) as total_purchases,
  COALESCE(SUM(si.total_amount), 0) as total_spent,
  MAX(si.invoice_date) as last_purchase_date,
  c.created_at,
  c.updated_at
FROM public.customers c
LEFT JOIN public.sales_invoices si ON c.id = si.customer_id
GROUP BY c.id, c.name, c.phone, c.email, c.price_tier, c.client_type, c.is_active, c.created_at, c.updated_at;

-- ============================================
-- 9. CREATE PRICE TIER LABELS TABLE (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS public.price_tiers (
  id integer NOT NULL PRIMARY KEY,
  name character varying NOT NULL UNIQUE,
  description text,
  discount_percentage numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT price_tiers_check CHECK (id IN (1, 2, 3))
);

-- Seed price tier data
INSERT INTO public.price_tiers (id, name, description, discount_percentage)
VALUES 
  (1, 'Normal', 'Normal Selling Price', 0),
  (2, 'Revendeur', 'Reseller Price - 20% discount', 20),
  (3, 'Gros', 'Wholesale Price - 40% discount', 40)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  discount_percentage = EXCLUDED.discount_percentage;

-- ============================================
-- 10. CREATE TRIGGER TO SYNC SELLING_PRICE
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_selling_price()
RETURNS TRIGGER AS $$
BEGIN
  -- When selling_price_1 is updated, also update selling_price for backward compatibility
  IF NEW.selling_price_1 IS DISTINCT FROM OLD.selling_price_1 THEN
    NEW.selling_price := NEW.selling_price_1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_selling_price_trigger ON public.products;

CREATE TRIGGER sync_selling_price_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_selling_price();

-- ============================================
-- 11. VERIFY SCHEMA CHANGES
-- ============================================

-- Verify products table changes
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name LIKE 'selling_price%'
-- ORDER BY column_name;

-- Verify customers table changes
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'customers' AND column_name IN ('price_tier', 'client_type', 'notes')
-- ORDER BY column_name;

-- ============================================
-- END OF MIGRATION
-- ============================================
