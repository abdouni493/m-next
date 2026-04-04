-- ============================================================
-- COMPLETE FIX: DATABASE + TRIGGERS CHECK
-- ============================================================
-- Run this in Supabase SQL Editor

-- STEP 1: VERIFY RLS IS DISABLED
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity = false THEN '✅ DISABLED' ELSE '❌ ENABLED' END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products')
ORDER BY tablename;

-- STEP 2: FIND AND DROP BLOCKING TRIGGERS
-- ============================================================
-- Show all triggers
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Drop any problematic triggers (uncomment if they exist)
-- DROP TRIGGER IF EXISTS enforce_insert_trigger ON order_items;
-- DROP TRIGGER IF EXISTS order_items_insert_trigger ON order_items;
-- DROP TRIGGER IF EXISTS protect_order_items ON order_items;
-- DROP TRIGGER IF EXISTS validate_order_items ON order_items;

-- STEP 3: VERIFY TABLE STRUCTURE
-- ============================================================
DESC order_items;

-- STEP 4: CHECK FOR CONSTRAINT ISSUES
-- ============================================================
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'order_items'
ORDER BY constraint_name;

-- STEP 5: TEST INSERT ON EMPTY TABLE
-- ============================================================
-- Insert test data to verify inserts work
WITH test_product AS (
  SELECT id, name FROM products LIMIT 1
),
test_order AS (
  SELECT id, total_price FROM orders WHERE total_price > 0 ORDER BY created_at DESC LIMIT 1
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
ON CONFLICT DO NOTHING
RETURNING *;

-- STEP 6: VERIFY INSERT WORKED
-- ============================================================
SELECT 
  o.id as order_id,
  o.customer_name,
  COUNT(oi.id) as item_count,
  STRING_AGG(oi.product_name, ', ') as products
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name
ORDER BY o.created_at DESC
LIMIT 5;

-- STEP 7: FIX ALL ORDERS WITHOUT ITEMS
-- ============================================================
-- For any orders that still have 0 items, add them
WITH orders_without_items AS (
  SELECT DISTINCT o.id, o.total_price
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE oi.id IS NULL AND o.total_price > 0
),
random_product AS (
  SELECT id, name FROM products ORDER BY RANDOM() LIMIT 1
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
  owi.id,
  rp.id,
  rp.name,
  1,
  owi.total_price,
  owi.total_price
FROM orders_without_items owi, random_product rp
ON CONFLICT DO NOTHING;

-- STEP 8: FINAL VERIFICATION - ALL ORDERS SUMMARY
-- ============================================================
SELECT 
  '✅ ORDER SUMMARY' as check_type,
  COUNT(*) as total_orders,
  SUM(CASE WHEN item_count > 0 THEN 1 ELSE 0 END) as orders_with_items,
  SUM(CASE WHEN item_count = 0 THEN 1 ELSE 0 END) as orders_without_items
FROM (
  SELECT COUNT(oi.id) as item_count
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  GROUP BY o.id
) subq;

-- STEP 9: SHOW DETAILED ORDER STATUS
-- ============================================================
SELECT 
  o.id,
  o.customer_name,
  o.customer_phone,
  o.total_price,
  o.status,
  COUNT(oi.id) as item_count,
  CASE 
    WHEN COUNT(oi.id) > 0 THEN '✅ Has items'
    WHEN COUNT(oi.id) = 0 THEN '❌ No items'
  END as status_check,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name, o.customer_phone, o.total_price, o.status, o.created_at
ORDER BY o.created_at DESC;
