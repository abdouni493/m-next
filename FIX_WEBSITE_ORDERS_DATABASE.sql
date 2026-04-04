-- Fix Website Orders Database
-- This SQL ensures the orders and order_items tables are properly configured
-- to store website orders created from WebsiteOrder.tsx

-- 1. Verify orders table exists and has correct structure
-- The orders table should already exist from your schema
-- but we'll ensure all columns are present

-- Check the orders table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Verify order_items table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- 3. Test query to see all website orders
SELECT 
  o.id,
  o.customer_name,
  o.customer_phone,
  o.customer_address,
  o.customer_wilaya,
  o.delivery_type,
  o.status,
  o.total_price,
  o.final_price,
  o.created_at,
  COUNT(oi.id) as item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id
ORDER BY o.created_at DESC;

-- 4. Get order details with items
SELECT 
  o.id as order_id,
  o.customer_name,
  o.customer_phone,
  o.customer_address,
  o.customer_wilaya,
  o.delivery_type,
  o.status,
  o.total_price,
  o.final_price,
  o.created_at,
  oi.id as item_id,
  oi.product_name,
  oi.product_mark,
  oi.quantity,
  oi.price_per_unit,
  oi.line_total
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
WHERE o.status = 'pending'
ORDER BY o.created_at DESC;

-- 5. Update order status (example: confirm an order)
UPDATE public.orders
SET 
  status = 'confirmed',
  confirmed_at = NOW(),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000'; -- Replace with actual order ID

-- 6. Mark order as on delivery
UPDATE public.orders
SET 
  status = 'on_delivery',
  delivery_started_at = NOW(),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000'; -- Replace with actual order ID

-- 7. Mark order as delivered (finalized)
UPDATE public.orders
SET 
  status = 'delivered',
  delivered_at = NOW(),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000'; -- Replace with actual order ID

-- 8. Cancel an order
UPDATE public.orders
SET 
  status = 'cancelled',
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000'; -- Replace with actual order ID

-- 9. Revenue calculation query
SELECT 
  COUNT(*) as total_orders,
  SUM(final_price) as total_revenue,
  AVG(final_price) as average_order_value,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
  SUM(CASE WHEN status = 'delivered' THEN final_price ELSE 0 END) as delivered_revenue
FROM public.orders
WHERE status IN ('delivered', 'on_delivery', 'confirmed');

-- 10. Orders by wilaya (delivery location)
SELECT 
  customer_wilaya,
  COUNT(*) as order_count,
  SUM(final_price) as total_revenue
FROM public.orders
GROUP BY customer_wilaya
ORDER BY order_count DESC;

-- 11. Orders by delivery type
SELECT 
  delivery_type,
  COUNT(*) as order_count,
  SUM(final_price) as total_revenue
FROM public.orders
GROUP BY delivery_type;

-- 12. Orders by status
SELECT 
  status,
  COUNT(*) as order_count,
  SUM(final_price) as total_revenue
FROM public.orders
GROUP BY status
ORDER BY order_count DESC;

-- 13. Deduct inventory when order is delivered
-- This should be called when order status changes to 'delivered'
UPDATE public.products
SET 
  quantity_on_hand = quantity_on_hand - (
    SELECT COALESCE(SUM(oi.quantity), 0)
    FROM public.order_items oi
    WHERE oi.order_id = '00000000-0000-0000-0000-000000000000' -- Replace with order ID
  ),
  updated_at = NOW()
WHERE id IN (
  SELECT product_id
  FROM public.order_items
  WHERE order_id = '00000000-0000-0000-0000-000000000000' -- Replace with order ID
);

-- 14. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
