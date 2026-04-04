-- FIX FOR ERROR: column "stock" does not exist
-- This error occurs when a database trigger or function tries to use a "stock" column
-- that doesn't exist on the products table

-- ============================================================================
-- 1. CHECK EXISTING TRIGGERS
-- ============================================================================
-- Run this to see what triggers exist on the orders table:
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
OR event_object_table = 'order_items'
OR event_object_table = 'products'
ORDER BY trigger_name;

-- ============================================================================
-- 2. DROP ANY PROBLEMATIC TRIGGERS
-- ============================================================================
-- If you see a trigger trying to use "stock" column, drop it:
DROP TRIGGER IF EXISTS trigger_finalize_order ON orders;
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON orders;
DROP TRIGGER IF EXISTS trigger_update_order_on_finalize ON orders;
DROP TRIGGER IF EXISTS finalize_order_trigger ON orders;

-- Drop functions that might reference "stock"
DROP FUNCTION IF EXISTS finalize_order_deduct_inventory();
DROP FUNCTION IF EXISTS deduct_order_inventory();
DROP FUNCTION IF EXISTS on_order_finalized();

-- ============================================================================
-- 3. CORRECT COLUMN NAMES IN PRODUCTS TABLE
-- ============================================================================
-- The products table has these quantity columns (NOT "stock"):
-- - quantity_on_hand (main inventory count)
-- - quantity_available (calculated available quantity)
-- - quantity_initial (purchase quantity)
-- - quantity_actual (current actual count)
-- - quantity_minimal (minimum threshold)

-- Verify these columns exist:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name LIKE '%quantity%'
ORDER BY column_name;

-- ============================================================================
-- 4. CREATE CORRECT TRIGGER FOR INVENTORY DEDUCTION
-- ============================================================================
-- This trigger will correctly deduct inventory when order status changes to 'delivered'

CREATE OR REPLACE FUNCTION deduct_order_inventory_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes to 'delivered', deduct from inventory
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Update products table, deducting quantities
    UPDATE products p
    SET quantity_on_hand = GREATEST(0, quantity_on_hand - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_delivery ON orders;
CREATE TRIGGER trigger_deduct_inventory_on_delivery
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_order_inventory_on_delivery();

-- ============================================================================
-- 5. VERIFY COLUMN NAMES ARE CORRECT
-- ============================================================================
-- Show what the products table looks like:
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- ============================================================================
-- 6. TEST THE FIX
-- ============================================================================
-- After applying the above, test by:
-- 1. Creating an order
-- 2. Changing status to 'on_delivery'
-- 3. Changing status to 'delivered' (this should deduct inventory)
-- 4. Check products table to verify quantity_on_hand decreased

-- Example query to check product inventory:
SELECT 
  id,
  name,
  quantity_on_hand,
  quantity_available,
  quantity_initial
FROM products
WHERE quantity_on_hand < quantity_initial
LIMIT 10;

-- ============================================================================
-- 7. TROUBLESHOOTING
-- ============================================================================

-- If you still get errors about "stock" column:
-- 1. Search for any views that might use "stock":
SELECT 
  table_schema,
  table_name,
  view_definition
FROM information_schema.views
WHERE view_definition LIKE '%stock%'
AND table_schema = 'public';

-- 2. Search for any functions that might use "stock":
SELECT 
  routine_schema,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%stock%'
AND routine_schema = 'public';

-- 3. If found, drop them:
-- DROP VIEW IF EXISTS view_name;
-- DROP FUNCTION IF EXISTS function_name;

-- ============================================================================
-- 8. FINAL CHECK - ORDER AND INVENTORY FLOW
-- ============================================================================

-- See all orders with their items and product quantities:
SELECT 
  o.id as order_id,
  o.customer_name,
  o.status,
  o.created_at,
  oi.product_name,
  oi.quantity as ordered_quantity,
  p.quantity_on_hand as current_inventory,
  p.quantity_initial as initial_inventory
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
ORDER BY o.created_at DESC
LIMIT 20;

-- See revenue from delivered orders:
SELECT 
  COUNT(*) as total_delivered,
  SUM(final_price) as total_revenue,
  AVG(final_price) as average_order
FROM orders
WHERE status = 'delivered';

-- ============================================================================
-- 9. IF NOTHING WORKS - NUCLEAR OPTION
-- ============================================================================
-- If the error persists, remove ALL triggers and rebuild them correctly:

-- Drop all problematic triggers:
DROP TRIGGER IF EXISTS trigger_finalize_order ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_order_on_finalize ON orders CASCADE;

-- Drop all problematic functions:
DROP FUNCTION IF EXISTS finalize_order_deduct_inventory() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory() CASCADE;

-- Verify orders table structure:
SELECT * FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;

-- ============================================================================
