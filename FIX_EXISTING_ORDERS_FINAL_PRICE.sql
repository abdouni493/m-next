-- ============================================================
-- FIX EXISTING ORDERS - Set final_price from total_price
-- ============================================================
-- This script fixes orders where final_price was incorrectly set to 0
-- while total_price has the correct value

-- Step 1: Check current state
SELECT 
  id,
  customer_name,
  total_price,
  final_price,
  discount_amount,
  status,
  created_at
FROM orders
WHERE final_price = 0 AND total_price > 0
ORDER BY created_at DESC;

-- Step 2: Update final_price for broken orders
-- Calculate: final_price = total_price - discount_amount (or just total_price if no discount)
UPDATE orders
SET final_price = total_price - COALESCE(discount_amount, 0),
    updated_at = NOW()
WHERE final_price = 0 AND total_price > 0;

-- Step 3: Verify the fix
SELECT 
  id,
  customer_name,
  total_price,
  final_price,
  discount_amount,
  status,
  CASE 
    WHEN final_price > 0 THEN '✅ FIXED'
    ELSE '❌ STILL BROKEN'
  END as status_check
FROM orders
WHERE total_price > 0
ORDER BY created_at DESC;

-- Step 4: Count order items for each order (to verify items were saved)
SELECT 
  o.id,
  o.customer_name,
  o.total_price,
  o.final_price,
  COUNT(oi.id) as item_count,
  STRING_AGG(DISTINCT oi.product_name, ', ') as products
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.total_price > 0
GROUP BY o.id, o.customer_name, o.total_price, o.final_price
ORDER BY o.created_at DESC;
