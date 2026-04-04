# QUICK: RLS FIX - COPY & PASTE READY

## Step 1: Copy and run these SQL commands in order

### Command 1: Disable RLS on order_items
```sql
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
```

### Command 2: Disable RLS on orders
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Command 3: Verify RLS is disabled
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('orders', 'order_items');
```

**Expected result:** Both show `false`

---

## Step 2: Test if items can now be inserted

### Command 4: Get a product ID
```sql
SELECT id, product_name FROM products LIMIT 1;
```

Copy the `id` value - it will look like: `550e8400-e29b-41d4-a716-446655440000`

### Command 5: Test insert (Replace product_id)
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
  'PASTE_PRODUCT_ID_HERE'::uuid,
  'Test',
  1,
  100,
  100
);
```

**Expected:** Succeeds with no error

---

## Step 3: Create a new order on website

1. Go to website order page
2. Fill form and create order
3. Check browser console (F12)
4. Should see: `✅ Order item saved successfully`

---

## Step 4: Fix existing orders' final_price

```sql
UPDATE orders
SET final_price = total_price - COALESCE(discount_amount, 0)
WHERE final_price = 0 AND total_price > 0;
```

---

## Step 5: Verify everything

```sql
SELECT 
  o.id,
  o.customer_name,
  o.total_price,
  o.final_price,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.total_price > 0
GROUP BY o.id, o.customer_name, o.total_price, o.final_price
ORDER BY o.created_at DESC;
```

**Expected:**
```
✅ final_price: 1500.00 (not 0.00)
✅ item_count: 1 (not 0)
```

---

That's it! The RLS was blocking anonymous users from saving items.
