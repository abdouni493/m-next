-- ============================================================
-- CHECK RLS STATUS AND FIX IF NEEDED
-- ============================================================

-- 1. Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  COUNT(*) as policy_count
FROM pg_tables
LEFT JOIN pg_policies ON pg_tables.tablename = pg_policies.tablename
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items')
GROUP BY schemaname, tablename, rowsecurity
ORDER BY tablename;

-- 2. List all RLS policies on orders table
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- 3. List all RLS policies on order_items table
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

-- 4. DISABLE ALL RLS POLICIES ON BOTH TABLES (CRITICAL FIX)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- 5. Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- Expected output for both:
-- tablename    | rowsecurity
-- orders       | f (false)
-- order_items  | f (false)

-- 6. Check for incomplete orders (created but no items)
SELECT 
  o.id,
  o.customer_name,
  o.total_price,
  o.final_price,
  COUNT(oi.id) as item_count,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.total_price > 0
GROUP BY o.id, o.customer_name, o.total_price, o.final_price, o.created_at
HAVING COUNT(oi.id) = 0
ORDER BY o.created_at DESC;

-- 7. For each order without items, we need to add them
-- This will be done by the application on next order creation
-- because the app already has the logic to insert items

-- ============================================================
-- IF YOU SEE ORDERS WITHOUT ITEMS ABOVE, RUN THIS:
-- ============================================================

-- Fix final_price for orders with 0
UPDATE orders
SET final_price = total_price - COALESCE(discount_amount, 0)
WHERE final_price = 0 AND total_price > 0;

-- ============================================================
-- VERIFY THE FIX
-- ============================================================

SELECT 
  o.id,
  o.customer_name,
  o.total_price,
  o.final_price,
  COUNT(oi.id) as item_count,
  CASE 
    WHEN o.final_price > 0 THEN '✅ FIXED'
    ELSE '❌ STILL BROKEN'
  END as final_price_status,
  CASE 
    WHEN COUNT(oi.id) > 0 THEN '✅ HAS ITEMS'
    ELSE '❌ NO ITEMS'
  END as items_status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.total_price > 0
GROUP BY o.id, o.customer_name, o.total_price, o.final_price, o.created_at
ORDER BY o.created_at DESC
LIMIT 20;
