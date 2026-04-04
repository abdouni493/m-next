-- ============================================================
-- COMPLETE DATABASE FIX - ITEMS NOT SAVING
-- ============================================================
-- Run this entire script in Supabase SQL Editor

-- PART 1: CHECK FOR BLOCKING TRIGGERS
-- ============================================================
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
AND event_object_table IN ('orders', 'order_items');

-- PART 2: DISABLE ALL TRIGGERS (if any are blocking)
-- ============================================================
-- If triggers exist, run these:
DROP TRIGGER IF EXISTS enforce_insert_trigger ON order_items;
DROP TRIGGER IF EXISTS order_items_insert_trigger ON order_items;
DROP TRIGGER IF EXISTS orders_insert_trigger ON orders;

-- PART 3: CHECK TABLE STRUCTURE
-- ============================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- PART 4: VERIFY NO CONSTRAINTS BLOCKING INSERTS
-- ============================================================
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'order_items';

-- PART 5: VERIFY RLS IS FULLY DISABLED
-- ============================================================
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products');
-- All should show 'f' (false)

-- PART 6: TEST INSERT - CREATE TEST DATA
-- ============================================================
-- First, get an order and product for testing
WITH test_order AS (
  SELECT id, total_price FROM orders ORDER BY created_at DESC LIMIT 1
),
test_product AS (
  SELECT id, name FROM products LIMIT 1
)
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  quantity,
  price_per_unit,
  line_total
)
SELECT 
  to.id,
  tp.id,
  tp.name,
  1,
  to.total_price,
  to.total_price
FROM test_order to, test_product tp
ON CONFLICT DO NOTHING;

-- PART 7: VERIFY INSERT WORKED
-- ============================================================
SELECT 
  o.id as order_id,
  o.customer_name,
  COUNT(oi.id) as item_count,
  STRING_AGG(oi.product_name, ', ') as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name
ORDER BY o.created_at DESC
LIMIT 5;

-- PART 8: CHECK FOR ANY ERRORS IN RECENT ORDERS
-- ============================================================
SELECT 
  o.id,
  o.customer_name,
  o.total_price,
  o.final_price,
  COUNT(oi.id) as items_count,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name, o.total_price, o.final_price, o.created_at
ORDER BY o.created_at DESC;
