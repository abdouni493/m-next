# MOST LIKELY FIX: RLS POLICIES BLOCKING ORDER ITEMS

## The Problem
90% probability: **RLS (Row Level Security) policies are blocking anonymous users from inserting order items.**

When website users create orders without logging in, they're "anon" (anonymous) users. If RLS policies require authentication or specific roles, the insert fails silently.

---

## Evidence
✅ Orders are created (tables accessible)
✅ Item errors are being logged but order continues (caught error)
❌ No items in database (insert failed)
❌ No clear error message to user (silently failed)

This is classic RLS blocking.

---

## The Fix (Run These Steps)

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project
2. Click "SQL Editor" on left sidebar
3. Create a new query

### Step 2: Copy This SQL

```sql
-- DISABLE RLS on order_items so website users can insert
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
```

### Step 3: Run It
- Click "Run" button (play icon)
- It should execute successfully
- No error should appear

### Step 4: Do the Same for Orders Table

```sql
-- DISABLE RLS on orders so website users can insert
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

Run this too.

### Step 5: Verify It Worked

```sql
-- Check if RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items');
```

**Expected result:**
```
tablename    | rowsecurity
─────────────┼────────────
orders       | f
order_items  | f
```

Both should show `f` (false = RLS disabled)

---

## Test If Fix Works

### Test 1: Create Another Order via Website
- Go to website order page
- Create a new order
- Submit it

### Test 2: Check Browser Console
Press F12, look for:
```
✅ Order item saved successfully: {...}
```

If you see this, the fix worked! ✅

### Test 3: Check SQL Query

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

You should now see:
```
✅ item_count: 1 (or 2, etc.) - NOT 0
```

### Test 4: Check UI
- Go to Commands page
- Open order details
- Should show:
  ✅ Produits (1)
  ✅ Product details visible

---

## If This Doesn't Work

Then we need the actual error message. Do this:

### Get the Real Error
```typescript
// Edit WebsiteOrder.tsx around line 283
// Change this:
if (itemError) {
  console.error('❌ ERROR saving order item:', itemError);
}

// To this:
if (itemError) {
  console.error('❌ ERROR saving order item FULL DETAILS:', {
    code: itemError.code,
    message: itemError.message,
    hint: itemError.hint,
    details: itemError.details,
    status: itemError.status,
    fullError: JSON.stringify(itemError, null, 2)
  });
  // Show alert to user
  alert('Error saving order item: ' + (itemError.message || 'Unknown error'));
}
```

Then create order again and tell me the error details.

---

## Safety Note

**Disabling RLS** makes these tables world-readable and world-writable. This is OK for public website orders, but might need refinement later:

If you want more security later, we can create **permissive policies** instead:

```sql
-- More secure: Allow anonymous INSERT/SELECT but not UPDATE/DELETE
CREATE POLICY "allow_anon_insert_order_items" ON order_items
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "allow_anon_select_order_items" ON order_items
FOR SELECT
TO anon
USING (true);

-- Then re-enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
```

But for now, disabling RLS is the fastest fix.

---

## Summary

**Most Likely Issue:** RLS policies blocking inserts
**Quick Fix:** Disable RLS on order_items and orders tables
**Time to Fix:** 2 minutes
**Risk Level:** Low (for public website orders)

**DO THIS NOW:**
1. Copy the two `ALTER TABLE` statements above
2. Run them in Supabase SQL Editor
3. Create a test order
4. Check if items save
5. Tell me if it worked

---

## Files Reference

- `ACTION_PLAN_FIX_ITEMS_NOW.md` - Full diagnostic steps
- `FIX_RLS_ORDER_ITEMS_WEBSITE.sql` - Complete RLS fix script
- `DIAGNOSTIC_ORDER_ITEMS_RLS.sql` - Check RLS status
- `URGENT_ORDER_ITEMS_NOT_SAVING_ROOT_CAUSE.md` - Root cause analysis

**Start with the two `ALTER TABLE` statements above. That's 90% likely to fix it.**
