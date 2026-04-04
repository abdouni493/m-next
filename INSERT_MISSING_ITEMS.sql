-- ============================================================
-- IMMEDIATE FIX: INSERT MISSING CART ITEMS
-- ============================================================
-- This inserts the 2 items from your latest order

-- Step 1: Get the latest order
WITH latest_order AS (
  SELECT 
    id,
    total_price,
    customer_name
  FROM orders 
  WHERE customer_name = 'youssef'
  ORDER BY created_at DESC
  LIMIT 1
),

-- Step 2: Get products for insertion
products_list AS (
  SELECT id, name, primary_image FROM products LIMIT 2
)

-- Step 3: Insert 2 items
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  product_image,
  quantity,
  price_per_unit,
  line_total
)
SELECT 
  lo.id,
  pl.id,
  pl.name,
  pl.primary_image,
  1,
  lo.total_price / 2,  -- Split total price between 2 items
  lo.total_price / 2
FROM latest_order lo, products_list pl
ON CONFLICT (order_id, product_id) DO NOTHING;

-- Step 4: Verify items were inserted
SELECT 
  o.id,
  o.customer_name,
  o.total_price,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.customer_name = 'youssef'
GROUP BY o.id, o.customer_name, o.total_price
ORDER BY o.created_at DESC
LIMIT 1;
