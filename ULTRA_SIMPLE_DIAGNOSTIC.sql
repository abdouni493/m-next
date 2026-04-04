-- ============================================================
-- ULTRA-SIMPLE DIAGNOSTIC - Works on any PostgreSQL
-- ============================================================

-- 1. CHECK TABLE STATUS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('order_items', 'orders')
ORDER BY tablename;

-- 2. LIST ALL TRIGGERS ON order_items
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
  AND event_object_table = 'order_items';

-- 3. CHECK COLUMNS IN order_items TABLE
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 4. ATTEMPT INSERT WITH VALID IDS (Will show actual error)
-- First, get a valid order and product ID
WITH valid_order AS (
  SELECT id FROM orders LIMIT 1
),
valid_product AS (
  SELECT id FROM products LIMIT 1
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
  vo.id,
  vp.id,
  'TEST ITEM',
  1,
  100,
  100
FROM valid_order vo, valid_product vp;

-- This will show the exact error if it fails!
-- If this succeeds, the insert works and we found the issue
