# RLS FIX - CORRECT COLUMN NAMES

## Step 1: Find correct product table columns

Run this first:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
```

This will show you all available columns in products table.

---

## Step 2: Once you see the columns, run RLS disable

```sql
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

---

## Step 3: Get a product ID with correct column

Based on what you see from Step 1, you might need to use:
- `name` instead of `product_name`
- `title` instead of `product_name`
- Or another column name

Run one of these:
```sql
-- Try this first
SELECT id, name FROM products LIMIT 1;

-- Or if that doesn't work, try:
SELECT id, title FROM products LIMIT 1;

-- Or just get all columns:
SELECT * FROM products LIMIT 1;
```

---

## Step 4: Once you have a product ID, test insert

Replace `YOUR_PRODUCT_ID_HERE` with the actual ID:

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
  'Test Product',
  1,
  100,
  100
);
```

---

## Step 5: Verify it worked

```sql
SELECT 
  o.id,
  o.customer_name,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.total_price > 0
GROUP BY o.id, o.customer_name
ORDER BY o.created_at DESC;
```

---

**DO THIS NOW:**
1. Run Step 1 query to see products table columns
2. Tell me what columns you see
3. I'll give you the exact correct query to use
