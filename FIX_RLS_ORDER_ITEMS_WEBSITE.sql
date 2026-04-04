-- ============================================================
-- DISABLE RLS ON ORDER_ITEMS FOR WEBSITE ORDERS
-- ============================================================
-- Website orders should be insertable by anonymous users
-- This script removes RLS restriction on order_items

-- Step 1: Check current RLS status
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- Step 2: Check existing policies on order_items
SELECT
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

-- Step 3: Check existing policies on orders
SELECT
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- Step 4: DISABLE RLS on order_items table (allows website orders)
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Step 5: DISABLE RLS on orders table if needed
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Step 6: Verify RLS is disabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- Step 7a: First, get a valid product ID to use for testing
SELECT id, name FROM products LIMIT 1;

-- Step 7b: Try inserting a test order item to verify it works
-- IMPORTANT: Replace 'PRODUCT_ID_FROM_STEP_7A' with actual product ID
-- This should succeed now without RLS errors
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  quantity,
  price_per_unit,
  line_total
) VALUES (
  '9c1fd922-35b4-457f-9b76-c6a171b241ea'::uuid,
  'PRODUCT_ID_FROM_STEP_7A'::uuid,  -- Replace this with real product ID
  'Test Charger',
  1,
  1500.00,
  1500.00
) RETURNING *;

-- Step 8: Verify order items are now appearing
SELECT 
  o.id,
  o.customer_name,
  COUNT(oi.id) as item_count,
  STRING_AGG(oi.product_name, ', ') as products
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.total_price > 0
GROUP BY o.id, o.customer_name
ORDER BY o.created_at DESC;
