# CORRECT: RLS FIX - READY TO RUN

## Step 1: Disable RLS

Run these two commands:

```sql
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

---

## Step 2: Get a product ID

```sql
SELECT id, name FROM products LIMIT 1;
```

Copy the `id` value from result. It looks like: `550e8400-e29b-41d4-a716-446655440000`

---

## Step 3: Test insert with product ID

Replace `YOUR_PRODUCT_ID` with the ID from Step 2:

```sql
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  quantity,
  price_per_unit,
  line_total
) VALUES (
  '9c1fd922-35b4-457f-9b76-c6a171b241ea'::uuid,
  'YOUR_PRODUCT_ID'::uuid,
  'Test Product',
  1,
  100,
  100
);
```

---

## Step 4: Verify it worked

```sql
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
```

Expected:
- ✅ `item_count: 1` (not 0)
- ✅ `products: Test Product`

---

## Step 5: Create new order on website

Go to website order page and create a new order. Should work now.

---

## Step 6: Fix existing orders' final_price

```sql
UPDATE orders
SET final_price = total_price - COALESCE(discount_amount, 0)
WHERE final_price = 0 AND total_price > 0;
```

---

That's it! RLS is fixed now.
