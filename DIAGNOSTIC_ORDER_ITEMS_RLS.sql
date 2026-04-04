-- ============================================================
-- DIAGNOSTIC: Check order_items table and RLS policies
-- ============================================================

-- Step 1: Check if order_items table exists and its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- Step 2: Check RLS status on order_items table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'order_items';

-- Step 3: Check if there are any RLS policies on order_items
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

-- Step 4: Try a simple direct insert to see if it works
-- WARNING: This is a test - remove after testing
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  quantity,
  price_per_unit,
  line_total
) VALUES (
  '9c1fd922-35b4-457f-9b76-c6a171b241ea'::uuid,
  'test-product-id'::uuid,
  'Test Product',
  1,
  100.00,
  100.00
) RETURNING *;

-- Step 5: Check what we have in orders and order_items
SELECT 
  'orders' as table_name,
  COUNT(*) as record_count
FROM orders
UNION ALL
SELECT 
  'order_items' as table_name,
  COUNT(*) as record_count
FROM order_items;

-- Step 6: Check permissions for anon role on order_items
SELECT 
  grantee,
  privilege_type,
  table_name
FROM role_table_grants
WHERE table_name = 'order_items'
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;
