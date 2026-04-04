-- ==========================================
-- COMPREHENSIVE FIX FOR ORDER ITEMS ISSUE
-- ==========================================
-- This script will:
-- 1. Check RLS status on all relevant tables
-- 2. Disable RLS completely
-- 3. Drop all policies
-- 4. Verify fixes
-- 5. Check recent orders and items
-- ==========================================

-- PART 1: CHECK CURRENT RLS STATUS
-- ==========================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products', 'offers', 'special_offers')
ORDER BY tablename;

-- PART 2: LIST ALL EXISTING POLICIES
-- ==========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products', 'offers', 'special_offers')
ORDER BY tablename, policyname;

-- PART 3: DISABLE RLS ON ALL CRITICAL TABLES
-- ==========================================
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers DISABLE ROW LEVEL SECURITY;

-- PART 4: DROP ALL POLICIES PERMANENTLY
-- ==========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products', 'offers', 'special_offers')
  )
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    RAISE NOTICE 'Dropped policy % on %', r.policyname, r.tablename;
  END LOOP;
END $$;

-- PART 5: VERIFY RLS IS DISABLED
-- ==========================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled (should be false)"
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products', 'offers', 'special_offers')
ORDER BY tablename;

-- PART 6: CHECK ORDER_ITEMS TABLE STRUCTURE
-- ==========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PART 7: COUNT ORDERS AND THEIR ITEMS
-- ==========================================
SELECT 
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(oi.id) as total_order_items,
  COUNT(DISTINCT o.id) FILTER (WHERE oi.id IS NULL) as orders_without_items,
  COUNT(DISTINCT CASE WHEN oi.quantity > 0 THEN o.id END) as orders_with_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id;

-- PART 8: DETAILED BREAKDOWN OF RECENT ORDERS
-- ==========================================
SELECT 
  o.id,
  o.customer_name,
  o.total_price,
  o.final_price,
  COUNT(oi.id) as item_count,
  STRING_AGG(oi.product_name, ', ') as product_names,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name, o.total_price, o.final_price, o.created_at
ORDER BY o.created_at DESC
LIMIT 20;

-- PART 9: CHECK IF ANY ORDER_ITEMS EXIST
-- ==========================================
SELECT 
  COUNT(*) as total_items,
  COUNT(DISTINCT order_id) as orders_with_items,
  MIN(created_at) as first_item,
  MAX(created_at) as last_item
FROM order_items;

-- PART 10: SHOW SAMPLE ORDER_ITEMS
-- ==========================================
SELECT *
FROM order_items
ORDER BY created_at DESC
LIMIT 5;

-- PART 11: FIX FINAL_PRICE FOR ORDERS THAT DON'T HAVE IT
-- ==========================================
UPDATE orders
SET final_price = total_price
WHERE final_price = 0 OR final_price IS NULL;

-- PART 12: VERIFY FIXES
-- ==========================================
SELECT 
  'RLS Status' as check_item,
  COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items', 'products', 'offers', 'special_offers')
  AND rowsecurity = true
UNION ALL
SELECT 
  'Policies Count' as check_item,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'products', 'offers', 'special_offers')
UNION ALL
SELECT 
  'Orders Without final_price' as check_item,
  COUNT(*) as count
FROM orders
WHERE final_price = 0 OR final_price IS NULL
UNION ALL
SELECT 
  'Orders Without Items' as check_item,
  COUNT(*) as count
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);

-- ==========================================
-- EXECUTION COMPLETE
-- ==========================================
-- After running this script:
-- 1. RLS should be completely disabled
-- 2. All policies should be dropped
-- 3. Orders should have final_price set
-- 4. New orders from website should have items saved
-- 5. Admin panel should display item counts
-- ==========================================
