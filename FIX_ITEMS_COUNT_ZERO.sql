-- ============================================================================
-- FIX: Items Count Showing 0 in Commands Interface
-- ============================================================================
-- PROBLEM: Orders display but show "0 items" even though items exist
-- ROOT CAUSE: items_count column not being updated properly
-- 
-- SOLUTIONS:
-- 1. Ensure items_count column exists
-- 2. Update all existing orders with correct item counts
-- 3. Verify triggers are working
-- 4. Drop and recreate triggers if needed
-- ============================================================================

-- Step 1: Verify items_count column exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS items_count integer DEFAULT 0;

-- Step 2: Drop old triggers if they exist (we'll recreate them)
DROP TRIGGER IF EXISTS trigger_update_order_thumbnail_count ON public.order_items CASCADE;
DROP TRIGGER IF EXISTS trigger_delete_order_thumbnail_count ON public.order_items CASCADE;

-- Step 3: Drop old function if exists
DROP FUNCTION IF EXISTS public.update_order_thumbnail_and_count() CASCADE;

-- Step 4: Create BETTER trigger function that handles both INSERT and DELETE
CREATE OR REPLACE FUNCTION public.update_order_thumbnail_and_count()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id uuid;
  v_count integer;
  v_image text;
BEGIN
  -- Determine order_id based on operation
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.order_id;
  ELSE
    v_order_id := NEW.order_id;
  END IF;

  -- Count total items in this order
  SELECT COUNT(*) INTO v_count
  FROM public.order_items
  WHERE order_id = v_order_id;

  -- Get first product image (if any items exist)
  SELECT product_image INTO v_image
  FROM public.order_items
  WHERE order_id = v_order_id
  ORDER BY created_at ASC
  LIMIT 1;

  -- Update the order
  UPDATE public.orders 
  SET 
    items_count = v_count,
    thumbnail_image = COALESCE(v_image, thumbnail_image)
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for INSERT and UPDATE on order_items
CREATE TRIGGER trigger_update_order_items_count_insert_update
AFTER INSERT OR UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_order_thumbnail_and_count();

-- Step 6: Create trigger for DELETE on order_items
CREATE TRIGGER trigger_update_order_items_count_delete
AFTER DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_order_thumbnail_and_count();

-- Step 7: MANUALLY UPDATE ALL EXISTING ORDERS with correct counts
-- This is crucial - triggers only work for NEW operations, not historical data
UPDATE public.orders o
SET items_count = (
  SELECT COUNT(*) 
  FROM public.order_items 
  WHERE order_id = o.id
)
WHERE items_count IS NULL OR items_count = 0;

-- Step 8: Also update thumbnail_image for orders that don't have it
UPDATE public.orders o
SET thumbnail_image = (
  SELECT product_image 
  FROM public.order_items oi
  WHERE oi.order_id = o.id 
  ORDER BY oi.created_at ASC 
  LIMIT 1
)
WHERE thumbnail_image IS NULL AND EXISTS (
  SELECT 1 FROM public.order_items WHERE order_id = o.id
);

-- Step 9: VERIFY THE FIX
SELECT 
  id,
  customer_name,
  customer_phone,
  items_count,
  (SELECT COUNT(*) FROM public.order_items WHERE order_id = orders.id) as actual_count,
  thumbnail_image,
  created_at
FROM public.orders
ORDER BY created_at DESC
LIMIT 20;

-- Step 10: Check for any mismatches
SELECT 
  o.id,
  o.customer_name,
  o.items_count,
  COUNT(oi.id) as actual_item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name, o.items_count
HAVING o.items_count != COUNT(oi.id)
ORDER BY o.created_at DESC;

-- If there are mismatches, run this to fix them:
UPDATE public.orders o
SET items_count = subquery.count
FROM (
  SELECT order_id, COUNT(*) as count
  FROM public.order_items
  GROUP BY order_id
) subquery
WHERE o.id = subquery.order_id AND o.items_count != subquery.count;

-- Step 11: Final verification
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN items_count > 0 THEN 1 END) as orders_with_items,
  COUNT(CASE WHEN items_count = 0 THEN 1 END) as orders_without_items,
  SUM(items_count) as total_items_across_all_orders
FROM public.orders;
