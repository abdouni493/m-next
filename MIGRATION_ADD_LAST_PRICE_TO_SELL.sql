-- Migration: Add last_price_to_sell column to products table
-- Purpose: Track the last selling price for each product to display in inventory and POS

-- Step 1: Add the new column to products table
ALTER TABLE public.products
ADD COLUMN last_price_to_sell NUMERIC(10, 2) DEFAULT 0;

-- Step 2: Update existing records to copy selling_price to last_price_to_sell initially
UPDATE public.products
SET last_price_to_sell = selling_price
WHERE last_price_to_sell = 0;

-- Step 3: Add a trigger to automatically update last_price_to_sell when selling_price changes
CREATE OR REPLACE FUNCTION update_last_price_to_sell()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
    NEW.last_price_to_sell := OLD.selling_price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_last_price_on_change ON public.products;

-- Create trigger to track previous selling price before update
CREATE TRIGGER update_last_price_on_change
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_last_price_to_sell();

-- Step 4: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_last_price_to_sell 
ON public.products(last_price_to_sell);

-- Verification query
-- SELECT id, name, selling_price, last_price_to_sell FROM public.products LIMIT 10;
