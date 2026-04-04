-- ============================================================
-- DIAGNOSTIC: FIND WHAT'S BLOCKING ITEM INSERTS
-- ============================================================
-- Run this to find the exact issue

-- 1. CHECK RLS POLICIES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'products')
ORDER BY tablename, policyname;

-- 2. CHECK ALL TRIGGERS (THESE MIGHT BE BLOCKING!)
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('orders', 'order_items', 'products')
ORDER BY event_object_table, trigger_name;

-- 3. IF TRIGGERS EXIST, DROP THEM
-- Uncomment and run if triggers are found above:
/*
DROP TRIGGER IF EXISTS enforce_insert_trigger ON order_items;
DROP TRIGGER IF EXISTS order_items_insert_trigger ON order_items;
DROP TRIGGER IF EXISTS validate_order_items ON order_items;
DROP TRIGGER IF EXISTS protect_order_items ON order_items;
DROP TRIGGER IF EXISTS check_order_items ON order_items;
DROP TRIGGER IF EXISTS on_order_items_insert ON order_items;
*/

-- 4. CHECK TABLE PERMISSIONS
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'order_items'
ORDER BY grantee, privilege_type;

-- 5. TRY DIRECT INSERT (THIS WILL SHOW ERROR IF BLOCKED)
WITH product AS (
  SELECT id FROM products LIMIT 1
),
order_rec AS (
  SELECT id, total_price FROM orders WHERE total_price > 0 LIMIT 1
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
  o.id,
  p.id,
  'TEST ITEM',
  1,
  100,
  100
FROM order_rec o, product p
ON CONFLICT DO NOTHING
RETURNING order_id, product_id, product_name, '✅ INSERT WORKED' as status;

-- 6. IF INSERT FAILED, CHECK FOR CONSTRAINTS
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'order_items'
ORDER BY constraint_name;

-- 7. CHECK FOREIGN KEY CONSTRAINTS
SELECT
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints
WHERE table_name = 'order_items'
  OR referenced_table_name = 'order_items';

-- 8. FINAL STATUS CHECK
SELECT 
  '📊 FINAL STATUS' as check_type,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM order_items) as total_items,
  (SELECT COUNT(*) FROM (
    SELECT DISTINCT o.id FROM orders o 
    LEFT JOIN order_items oi ON o.id = oi.order_id 
    WHERE oi.id IS NULL
  ) x) as orders_without_items;
