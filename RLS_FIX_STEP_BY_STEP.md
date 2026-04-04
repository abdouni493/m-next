# FIX RLS - CORRECTED STEPS

## Steps 1-6: Check and Disable RLS (Do These First)

### Step 1: Check current RLS status
```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items')
ORDER BY tablename;
```

### Step 2: Check existing policies on order_items
```sql
SELECT
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;
```

### Step 3: Check existing policies on orders
```sql
SELECT
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;
```

### Step 4: DISABLE RLS on order_items
```sql
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
```

### Step 5: DISABLE RLS on orders
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Step 6: Verify RLS is disabled
```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items')
ORDER BY tablename;
```

**Expected result:** Both should show `false` for rowsecurity

---

## Steps 7-8: Test and Verify

### Step 7a: Get a valid product ID
```sql
SELECT id, product_name FROM products LIMIT 5;
```

Copy one of the `id` values from the result.

### Step 7b: Insert test order item (Use the product ID from 7a)

Replace `YOUR_PRODUCT_ID_HERE` with the actual ID from step 7a:

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
  'YOUR_PRODUCT_ID_HERE'::uuid,
  'Test Charger',
  1,
  1500.00,
  1500.00
) RETURNING *;
```

**Expected:** Insert succeeds with no error

### Step 8: Verify items are showing in orders
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

**Expected result:**
```
✅ item_count: 1 (or more)
✅ products: showing product names
```

---

## After RLS Fix: Create a New Order

1. Go to website order page
2. Create a new order
3. Check browser console for logs:
   - `📝 Creating order...`
   - `✅ Order item saved successfully:` (instead of error)

If you see the success log, **RLS was the issue and it's now fixed!**

---

## Then: Fix Existing Orders' final_price

Once RLS is fixed and items are saving:

```sql
-- Fix final_price for existing orders
UPDATE orders
SET final_price = total_price - COALESCE(discount_amount, 0),
    updated_at = NOW()
WHERE final_price = 0 AND total_price > 0;

-- Verify
SELECT id, customer_name, total_price, final_price 
FROM orders 
WHERE total_price > 0 
ORDER BY created_at DESC;
```

Expected: final_price now shows correct values (1500.00, 2000.00, etc.) instead of 0.00

---

## Verify in UI

After RLS fix:
1. Go to **Commands** page
2. Open any order details
3. Should show:
   - ✅ **Produits (1)** or higher count - NOT (0)
   - ✅ **Product name and specs visible**
   - ✅ **final_price showing correct amount**

---

## If Still Having Issues

Run this to see what's blocking:

```sql
-- Check if you can view existing order_items
SELECT * FROM order_items LIMIT 5;

-- Check if you can insert
INSERT INTO order_items (order_id, product_id, product_name, quantity, price_per_unit, line_total)
VALUES ('9c1fd922-35b4-457f-9b76-c6a171b241ea'::uuid, 'YOUR_PRODUCT_ID'::uuid, 'Test', 1, 100, 100);

-- Check orders table directly
SELECT * FROM orders WHERE total_price > 0 LIMIT 5;
```

If any of these fail, tell me the error message.

---

## Summary

**Execute in order:**
1. ✅ Steps 1-6: Check and disable RLS (4 SQL queries)
2. ✅ Steps 7-8: Test and verify (3 SQL queries)
3. ✅ Create new order via website (should work now)
4. ✅ Fix existing orders' final_price (1 UPDATE query)
5. ✅ Verify in UI (Commands page)

**Total time: ~10 minutes**
