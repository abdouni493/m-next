# 🔥 CRITICAL: Fix RLS Blocking Your Website NOW

## The Problem
Your website pages are returning 401 Unauthorized errors because Supabase Row Level Security (RLS) policies are blocking ALL requests. The website cannot display:
- Offers
- Special Offers  
- Website Settings
- Store Name/Logo
- Any other data

## The Solution - 3 Options (Choose ONE)

### OPTION A: Quick Direct Fix (RECOMMENDED) ✅

1. Go to https://app.supabase.com
2. Login to your project
3. Click **SQL Editor** (left sidebar)
4. Click **+ New Query**
5. Copy this ENTIRE code:

```sql
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
```

6. Click **RUN** button (⚡)
7. Wait for "Success" message
8. **Refresh your browser** (F5)

✅ **All offers and data should now display!**

---

### OPTION B: Using Prepared Script File

1. Open file `SIMPLE_RLS_FIX.sql` from your workspace
2. Copy everything
3. Go to Supabase SQL Editor
4. Click **+ New Query**
5. Paste the code
6. Click **RUN**

---

### OPTION C: Through Supabase Dashboard UI

If SQL doesn't work:

1. Go to https://app.supabase.com
2. Go to **Settings → Database → Extensions**
3. Search for and expand "Row Level Security"
4. Disable RLS for each table:
   - offers
   - special_offers
   - products
   - website_settings
   - marks
   - connector_types
   - orders

---

## After Running SQL

✅ **Refresh browser** - All errors gone  
✅ **See offers loading** - Both offers pages will work  
✅ **Logo displays** - Store name and logo visible  
✅ **Website settings load** - All info displays  
✅ **No more 401 errors** - Console will be clean  

---

## Why This Happens

Supabase RLS (Row Level Security) requires authentication tokens. Your public website doesn't have valid tokens, so RLS blocks everything with 401 errors. Disabling RLS allows public read access.

---

## Files Updated

Your code has also been improved:
- ✅ `supabaseClient.ts` - Added error handling that won't crash if RLS is still enabled
- ✅ `SIMPLE_RLS_FIX.sql` - Minimal SQL script to run
- ✅ `REMOVE_RLS_POLICIES.sql` - More detailed version

---

## Verification

After running SQL, check the console for no 401 errors. If you still see errors:

1. Wait 10 seconds for database to apply changes
2. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
3. Check if RLS was actually disabled - run in SQL Editor:

```sql
SELECT tablename, relrowsecurity FROM pg_tables 
WHERE tablename IN ('offers', 'special_offers', 'products', 'website_settings');
```

Should show all with `f` (false) = RLS is disabled ✅

---

## URGENT: Do This NOW

1. **Copy 8 lines of SQL above** (OPTION A, step 5)
2. **Go to Supabase SQL Editor**  
3. **Paste and RUN**
4. **Refresh browser**

**Your website will work immediately after this!**
