# SQL Migration Guide - Adding Last Price to Sell

## Overview
This migration adds functionality to track the last selling price of products, allowing users to see price history and manage invoice pricing more effectively.

## Prerequisites
- Access to Supabase database
- Superuser or admin role (for creating triggers and functions)
- Backup of existing data (recommended)

## Migration Steps

### Step 1: Add the Column
Execute this SQL command in Supabase SQL Editor:

```sql
ALTER TABLE public.products
ADD COLUMN last_price_to_sell NUMERIC(10, 2) DEFAULT 0;
```

**Expected Result**: Column added successfully with default value of 0

---

### Step 2: Initialize Existing Data
Populate existing products with their current selling price:

```sql
UPDATE public.products
SET last_price_to_sell = selling_price
WHERE last_price_to_sell = 0;
```

**Expected Result**: All products updated (check row count)

---

### Step 3: Create Trigger Function
Create a function that updates `last_price_to_sell` when `selling_price` changes:

```sql
CREATE OR REPLACE FUNCTION update_last_price_to_sell()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
    NEW.last_price_to_sell := OLD.selling_price;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Expected Result**: Function created or replaced

---

### Step 4: Drop Existing Trigger (if any)
Remove any existing trigger to avoid conflicts:

```sql
DROP TRIGGER IF EXISTS update_last_price_on_change ON public.products;
```

**Expected Result**: Trigger dropped (or "no such trigger" message is fine)

---

### Step 5: Create New Trigger
Create the trigger that calls the function before each update:

```sql
CREATE TRIGGER update_last_price_on_change
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_last_price_to_sell();
```

**Expected Result**: Trigger created successfully

---

### Step 6: Create Index for Performance
Add an index to optimize queries on `last_price_to_sell`:

```sql
CREATE INDEX IF NOT EXISTS idx_products_last_price_to_sell 
ON public.products(last_price_to_sell);
```

**Expected Result**: Index created successfully

---

## Verification

### Verify Column Exists
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'last_price_to_sell';
```

Expected output:
```
column_name         | data_type
last_price_to_sell  | numeric
```

---

### Verify Data Populated
```sql
SELECT id, name, selling_price, last_price_to_sell 
FROM products 
LIMIT 10;
```

Expected: All products show `last_price_to_sell` equal to `selling_price`

---

### Verify Trigger Works
1. Update a product's selling price:
```sql
UPDATE products SET selling_price = 200 WHERE id = 'YOUR_PRODUCT_ID';
```

2. Check that `last_price_to_sell` was updated to the old price:
```sql
SELECT selling_price, last_price_to_sell 
FROM products 
WHERE id = 'YOUR_PRODUCT_ID';
```

Expected: 
- `selling_price` = 200 (new value)
- `last_price_to_sell` = (previous value)

---

## Rollback Instructions

If you need to revert these changes:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS update_last_price_on_change ON public.products;

-- Drop function
DROP FUNCTION IF EXISTS update_last_price_to_sell();

-- Drop index
DROP INDEX IF EXISTS idx_products_last_price_to_sell;

-- Remove column
ALTER TABLE public.products
DROP COLUMN last_price_to_sell;
```

---

## Application Code Updates

After running the SQL migration, the application code has been updated to:

1. **Display `last_price_to_sell`**:
   - Inventory cards show it in purple (⏱️ Derni.)
   - Product details dialog shows it alongside current selling price

2. **Use in POS**:
   - POS cards show last price if different from current
   - Invoice finalization dialog displays it for reference

3. **Track Changes**:
   - Automatically updated via database trigger
   - No manual intervention needed

---

## Troubleshooting

### Issue: "Column already exists"
**Solution**: The migration was already run. Proceed to verification step.

### Issue: "Trigger already exists"
**Solution**: The DROP TRIGGER IF EXISTS statement handles this. Just run it again.

### Issue: "Permission denied" for trigger/function
**Solution**: 
- Ensure you're using a superuser account
- Contact your Supabase admin
- Or run migration with service role

### Issue: Data not updating after price change
**Solution**:
1. Verify trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'update_last_price_on_change';`
2. Check function: `SELECT proname FROM pg_proc WHERE proname = 'update_last_price_to_sell';`
3. If missing, re-run Steps 3-5

---

## Performance Considerations

- Index created on `last_price_to_sell` for optimal query performance
- Trigger is minimal and only executes when `selling_price` changes
- No impact on existing queries or normal operations
- Recommended: Run maintenance queries during off-hours

---

## Testing Checklist

- [ ] Column created successfully
- [ ] Data migrated to existing products
- [ ] Function created
- [ ] Trigger activated
- [ ] Index created
- [ ] Update product price and verify `last_price_to_sell` updates
- [ ] Application displays new field correctly
- [ ] No errors in browser console
- [ ] Invoice dialog shows editable prices

