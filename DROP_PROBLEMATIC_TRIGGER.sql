-- ============================================================================
-- DROP THE PROBLEMATIC TRIGGER
-- ============================================================================
-- The trigger "orders_update_stock" is trying to use "stock" column
-- which doesn't exist. Drop it now!
-- ============================================================================

DROP TRIGGER IF EXISTS orders_update_stock ON orders CASCADE;

-- ============================================================================
-- VERIFY - Should show no orders_update_stock trigger
-- ============================================================================

SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'order_items', 'products')
ORDER BY event_object_table, trigger_name;

-- Expected result after this runs:
-- 1. order_items_calculate_totals (INSERT, DELETE, UPDATE) - KEEPS
-- 2. orders_updated_at_trigger (UPDATE) - KEEPS
-- NO orders_update_stock ✅
