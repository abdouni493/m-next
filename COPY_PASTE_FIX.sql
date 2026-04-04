-- ============================================================================
-- COPY AND PASTE THIS ENTIRE BLOCK INTO SUPABASE SQL EDITOR
-- ============================================================================
-- This removes all problematic triggers that reference "stock" column
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_finalize_order ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_order_on_finalize ON orders CASCADE;
DROP TRIGGER IF EXISTS finalize_order_trigger ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_delivery ON orders CASCADE;
DROP TRIGGER IF EXISTS on_order_finalized ON orders CASCADE;

DROP FUNCTION IF EXISTS finalize_order_deduct_inventory() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory() CASCADE;
DROP FUNCTION IF EXISTS on_order_finalized() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory_on_delivery() CASCADE;

-- ============================================================================
-- VERIFY - Run this to check all triggers are gone
-- ============================================================================

SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'order_items', 'products')
ORDER BY trigger_name;

-- If this returns NO ROWS, you're good! ✅

-- ============================================================================
-- OPTIONAL: Check what the orders table looks like
-- ============================================================================

SELECT * FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- ============================================================================
-- OPTIONAL: See your orders
-- ============================================================================

SELECT 
  id,
  customer_name,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
