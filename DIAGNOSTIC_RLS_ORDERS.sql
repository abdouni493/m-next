-- ============================================================
-- DIAGNOSTIC: Check RLS and Order Items Status
-- ============================================================

-- 1. Check RLS Status
SELECT 
  tablename,
  rowsecurity as "RLS Enabled (f=disabled, t=enabled)"
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products')
ORDER BY tablename;

-- 2. Check for RLS Policies
SELECT 
  policyname,
  tablename,
  permissive,
  roles
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'products')
ORDER BY tablename, policyname;

-- 3. Check order_items column structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 4. Check current orders and their items
SELECT 
  o.id as order_id,
  o.customer_name,
  o.total_price,
  o.final_price,
  COUNT(oi.id) as item_count,
  MAX(oi.product_name) as product_name,
  MAX(oi.product_image) as product_image,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name, o.total_price, o.final_price, o.created_at
ORDER BY o.created_at DESC
LIMIT 20;

-- 5. Check recent order_items inserts (last 20 items)
SELECT 
  id,
  order_id,
  product_id,
  product_name,
  quantity,
  price_per_unit,
  line_total,
  created_at
FROM order_items
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- IF YOU SEE 0 ITEMS IN QUERY #4, RUN THIS FIX:
-- ============================================================

-- FIX 1: Ensure RLS is completely disabled
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- FIX 2: Drop any remaining policies
DO $$
DECLARE
    policy record;
BEGIN
    -- Drop policies on orders
    FOR policy IN SELECT policyname FROM pg_policies WHERE tablename = 'orders' LOOP
        EXECUTE format('DROP POLICY %I ON orders', policy.policyname);
        RAISE NOTICE 'Dropped policy: %', policy.policyname;
    END LOOP;
    
    -- Drop policies on order_items
    FOR policy IN SELECT policyname FROM pg_policies WHERE tablename = 'order_items' LOOP
        EXECUTE format('DROP POLICY %I ON order_items', policy.policyname);
        RAISE NOTICE 'Dropped policy: %', policy.policyname;
    END LOOP;
    
    -- Drop policies on products
    FOR policy IN SELECT policyname FROM pg_policies WHERE tablename = 'products' LOOP
        EXECUTE format('DROP POLICY %I ON products', policy.policyname);
        RAISE NOTICE 'Dropped policy: %', policy.policyname;
    END LOOP;
END $$;

-- FIX 3: Verify RLS is now disabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products');

-- Expected result: All should show 'f' (false)
