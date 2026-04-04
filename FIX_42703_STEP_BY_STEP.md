# 🔧 COMPLETE FIX: Error "column stock does not exist" - Database Trigger Issue

## Error Symptoms
```
PATCH https://...supabase.co/rest/v1/orders?id=eq.xxxxx 400 (Bad Request)
Error: {code: '42703', message: 'column "stock" does not exist'}
Location: When clicking "Finalize" button on order
```

## Root Cause
A **database trigger** on the `orders` table is trying to reference a column called `"stock"` that doesn't exist. This trigger fires when we try to update the order status to 'delivered'.

## The Fix - Two Steps Required

### STEP 1: Clean Database Triggers (Supabase SQL Editor)

In your Supabase project:
1. Go to **SQL Editor**
2. Create a **new query**
3. Copy and paste THIS SQL:

```sql
-- DROP ALL PROBLEMATIC TRIGGERS
DROP TRIGGER IF EXISTS trigger_finalize_order ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_order_on_finalize ON orders CASCADE;
DROP TRIGGER IF EXISTS finalize_order_trigger ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_delivery ON orders CASCADE;
DROP TRIGGER IF EXISTS on_order_finalized ON orders CASCADE;

-- DROP FUNCTIONS USING "stock"
DROP FUNCTION IF EXISTS finalize_order_deduct_inventory() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory() CASCADE;
DROP FUNCTION IF EXISTS on_order_finalized() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory_on_delivery() CASCADE;

-- VERIFY NO TRIGGERS REMAIN
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'orders';
```

4. Click **Run** ✅
5. Should see: "No results" (meaning all triggers are gone)

### STEP 2: Update TypeScript Code (Already Done ✅)

The code in `src/lib/supabaseClient.ts` has been updated with:
- ✅ Improved error handling
- ✅ Better logging
- ✅ Graceful degradation if items can't be processed
- ✅ Separate update calls (avoids trigger issues)
- ✅ Better async/await handling

## After the Fix

### Test the Solution

**Step 1: Create an order**
```
/website-shop/order → Search "teste" → Click "Commander"
```

**Step 2: Admin finalizes order**
```
Commands → Click order
→ "🚚 Start Delivery" (status: pending → on_delivery)
→ "📦 Finalize" ← SHOULD WORK NOW! ✅
```

**Expected Result:**
- ✅ Order status changes to "delivered"
- ✅ No error 42703
- ✅ Product inventory decreases
- ✅ Success toast appears

### Verify Inventory Deduction

Run this SQL in Supabase:
```sql
SELECT 
  o.id,
  o.customer_name,
  o.status,
  oi.product_name,
  oi.quantity,
  p.quantity_on_hand
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.status = 'delivered'
ORDER BY o.created_at DESC
LIMIT 5;
```

## Why This Happened

The `orders` table had a trigger that was trying to execute this logic:
```sql
UPDATE products SET stock = stock - quantity  -- ❌ WRONG!
```

But the products table has no `stock` column. It has `quantity_on_hand` instead:
```sql
UPDATE products SET quantity_on_hand = quantity_on_hand - quantity  -- ✅ CORRECT!
```

Our TypeScript code now handles this correctly without relying on triggers.

## Files Modified

| File | Change |
|------|--------|
| src/lib/supabaseClient.ts | ✅ Updated finalizeOrder() |
| CRITICAL_FIX_REMOVE_TRIGGERS.sql | ✅ Created (SQL to remove triggers) |

## Troubleshooting

### Still Getting Error 42703?

**1. Check if triggers were removed:**
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'orders';
```
Should return: (no results)

**2. Check products table structure:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name LIKE '%quantity%'
ORDER BY column_name;
```
Should show: `quantity_on_hand` ✅

**3. Test order update directly:**
```sql
UPDATE orders SET status = 'delivered' WHERE id = 'ORDER_ID';
```
If no error, triggers are gone! ✅

### Nothing Works?

As a last resort, go to Supabase Dashboard:
1. **SQL Editor**
2. **Query History**
3. Look for any trigger creation queries
4. Delete them manually

## Prevention

Going forward:
- ✅ All inventory deduction happens in TypeScript code
- ✅ No reliance on database triggers for this logic
- ✅ Easier to debug and maintain
- ✅ More reliable error handling

## Summary

| Issue | Solution | Status |
|-------|----------|--------|
| Error 42703 | Remove problematic triggers | ✅ SQL provided |
| Column "stock" | Use correct column name | ✅ Code fixed |
| Inventory not deducting | Improved function | ✅ Code updated |
| Better error handling | Added logging & try/catch | ✅ Implemented |

---

## Next Steps

1. ✅ **Copy the SQL** from this guide
2. ✅ **Run it** in Supabase SQL Editor
3. ✅ **Verify** no triggers remain
4. ✅ **Test** finalizing an order
5. ✅ **Check** inventory decreased

**Should work now!** 🎉
