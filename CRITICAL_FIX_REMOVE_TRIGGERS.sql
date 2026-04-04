-- CRITICAL FIX: Remove problematic database triggers
-- The error "column stock does not exist" is coming from a trigger that fires when updating orders

-- ============================================================================
-- STEP 1: DROP ALL PROBLEMATIC TRIGGERS FIRST
-- ============================================================================
-- Run these in Supabase SQL editor to remove broken triggers:

DROP TRIGGER IF EXISTS trigger_finalize_order ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_order_on_finalize ON orders CASCADE;
DROP TRIGGER IF EXISTS finalize_order_trigger ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_delivery ON orders CASCADE;
DROP TRIGGER IF EXISTS on_order_finalized ON orders CASCADE;

-- ============================================================================
-- STEP 2: DROP FUNCTIONS THAT MIGHT USE "stock"
-- ============================================================================

DROP FUNCTION IF EXISTS finalize_order_deduct_inventory() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory() CASCADE;
DROP FUNCTION IF EXISTS on_order_finalized() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory_on_delivery() CASCADE;

-- ============================================================================
-- STEP 3: VERIFY NO TRIGGERS REMAIN ON ORDERS TABLE
-- ============================================================================

SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'orders'
ORDER BY trigger_name;

-- If this returns nothing, good! No triggers remain.

-- ============================================================================
-- STEP 4: CREATE CORRECT TRIGGER (OPTIONAL - our code handles it)
-- ============================================================================
-- Note: We're NOT creating a trigger because the finalizeOrder() function 
-- now handles inventory deduction in the TypeScript code.
-- This is better because:
-- 1. No "stock" column references
-- 2. Easier to debug
-- 3. Consistent with our code logic

-- If you WANT a trigger for redundancy, create it like this:
-- CREATE OR REPLACE FUNCTION deduct_order_inventory_on_delivery()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
--     UPDATE products p
--     SET quantity_on_hand = GREATEST(0, quantity_on_hand - oi.quantity)
--     FROM order_items oi
--     WHERE oi.order_id = NEW.id
--     AND p.id = oi.product_id;
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_deduct_inventory_on_delivery
-- AFTER UPDATE ON orders
-- FOR EACH ROW
-- EXECUTE FUNCTION deduct_order_inventory_on_delivery();

-- ============================================================================
-- STEP 5: VERIFY THE FIX WORKS
-- ============================================================================

-- Check that orders table can be updated without errors
-- Run this to test (change the ID to an actual order ID):
-- UPDATE orders SET status = 'delivered' WHERE id = 'YOUR_ORDER_ID';

-- If no error about "stock", the fix worked! ✅

-- ============================================================================
-- STEP 6: VERIFY PRODUCTS TABLE STRUCTURE
-- ============================================================================

-- Show all quantity-related columns:
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND (column_name LIKE '%quantity%' OR column_name LIKE '%stock%')
ORDER BY column_name;

-- ============================================================================
-- STEP 7: TEST DATA - See current orders
-- ============================================================================

SELECT 
  id,
  customer_name,
  status,
  created_at,
  delivered_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 8: FINAL VERIFICATION - Orders with items
-- ============================================================================

SELECT 
  o.id as order_id,
  o.customer_name,
  o.status,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.line_total) as order_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name, o.status
ORDER BY o.created_at DESC
LIMIT 10;
