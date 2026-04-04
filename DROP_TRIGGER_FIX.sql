-- ============================================================
-- FIX: DROP BLOCKING TRIGGER
-- ============================================================

-- 1. DROP THE BLOCKING TRIGGER
DROP TRIGGER IF EXISTS order_items_calculate_totals ON order_items;

-- 2. VERIFY IT'S GONE
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'order_items';
-- Should return: (empty - no triggers)

-- 3. TEST INSERT NOW (Should work!)
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
  'TEST ITEM - After Trigger Drop',
  1,
  100,
  100
FROM valid_order vo, valid_product vp
RETURNING id, order_id, product_name, '✅ INSERT WORKED!' as status;

-- 4. VERIFY INSERT SUCCEEDED
SELECT 
  o.id,
  o.customer_name,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.customer_name
ORDER BY o.created_at DESC
LIMIT 1;
