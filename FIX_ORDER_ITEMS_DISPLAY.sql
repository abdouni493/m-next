-- ============================================================================
-- FIX: Order Items Not Displaying in Admin Commands Interface
-- ============================================================================
-- This script fixes the issue where order_items were showing 0 items in the
-- admin Commands interface. The problem was caused by:
-- 1. Cart storing items with 'id' field instead of 'product_id'
-- 2. Missing product information in cart items
-- 3. Incorrect field mapping in WebsiteOrder.tsx
-- ============================================================================

-- Step 1: Add thumbnail_image column to orders table for card display
-- This stores the first product's image for quick display without joins
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS thumbnail_image text,
ADD COLUMN IF NOT EXISTS items_count integer DEFAULT 0;

-- Step 2: Create an index on orders(created_at) for faster sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc 
ON public.orders(created_at DESC);

-- Step 3: Create an index on order_items(order_id) for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON public.order_items(order_id);

-- Step 4: Create a function to auto-update thumbnail_image and items_count
-- This will be triggered when order_items are inserted
CREATE OR REPLACE FUNCTION public.update_order_thumbnail_and_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the order's thumbnail_image with the first item's image and count
  UPDATE public.orders 
  SET 
    thumbnail_image = (
      SELECT product_image 
      FROM public.order_items 
      WHERE order_id = NEW.order_id 
      ORDER BY created_at ASC 
      LIMIT 1
    ),
    items_count = (
      SELECT COUNT(*) 
      FROM public.order_items 
      WHERE order_id = NEW.order_id
    )
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for when order_items are inserted or updated
DROP TRIGGER IF EXISTS trigger_update_order_thumbnail_count ON public.order_items;
CREATE TRIGGER trigger_update_order_thumbnail_count
AFTER INSERT OR UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_order_thumbnail_and_count();

-- Step 6: Create trigger for when order_items are deleted
DROP TRIGGER IF EXISTS trigger_delete_order_thumbnail_count ON public.order_items;
CREATE TRIGGER trigger_delete_order_thumbnail_count
AFTER DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_thumbnail_and_count();

-- Step 7: For existing orders without thumbnail_image, populate them
UPDATE public.orders o
SET 
  thumbnail_image = (
    SELECT product_image 
    FROM public.order_items oi
    WHERE oi.order_id = o.id 
    ORDER BY oi.created_at ASC 
    LIMIT 1
  ),
  items_count = (
    SELECT COUNT(*) 
    FROM public.order_items 
    WHERE order_id = o.id
  )
WHERE thumbnail_image IS NULL OR items_count = 0;

-- Step 8: Verify the update
SELECT id, customer_name, items_count, thumbnail_image, created_at 
FROM public.orders 
WHERE items_count > 0
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================================================
-- ANALYSIS: What was fixed
-- ============================================================================
-- ISSUE 1: Cart Structure
--   BEFORE: cart.push({ id: offer.product_id, name, price, ... })
--   AFTER:  cart.push({ product_id: offer.product_id, name, product_name, mark, description, ... })
--   WHY: WebsiteOrder.tsx was reading item.product_id which didn't exist
--
-- ISSUE 2: WebsiteOrder Item Mapping
--   BEFORE: product_id: item.product_id (was undefined)
--   AFTER:  product_id: item.product_id || item.id (backward compatible)
--   ALSO FIXED: offer_id mapping (was item.id, now item.offer_id)
--
-- ISSUE 3: Missing Product Data
--   NOW STORED IN CART: mark, description, voltage, wattage, amperage, connection_type
--
-- ISSUE 4: Order Card Display
--   ADDED: thumbnail_image column and auto-update trigger
--   BENEFIT: No need to join order_items for card display
--
-- ISSUE 5: Query Performance
--   ADDED: Indexes on orders(created_at) and order_items(order_id)
--   BENEFIT: Faster sorting and filtering
-- ============================================================================
