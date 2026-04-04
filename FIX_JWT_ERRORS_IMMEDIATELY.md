# 🔧 URGENT: Fix JWT Expired 401 Errors

## Problem
Your website is showing 401 Unauthorized errors with "JWT expired" message because:
- Supabase has Row Level Security (RLS) policies enabled
- These policies require valid authentication tokens
- Your anonymous session token has expired or is invalid
- The API requests are being blocked before they even reach the database

## Error You're Seeing
```
GET https://pzzngzaljrfrbteclexi.supabase.co/rest/v1/offers?... 401 (Unauthorized)
Error fetching offers: {code: 'PGRST303', message: 'JWT expired'}
```

## Solution - MUST DO THESE STEPS:

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project: `pzzngzaljrfrbteclexi`
3. Click **SQL Editor** (left sidebar)

### Step 2: Run the RLS Removal Script
1. Click **+ New Query** button
2. Copy the ENTIRE contents of file: `REMOVE_RLS_POLICIES.sql`
3. Paste it into the SQL editor
4. Click **Run** button (⚡ icon)
5. **Wait for it to complete** - should see "No results" or success message

### Step 3: Verify It Worked
1. Still in SQL Editor, run this simple test query:
```sql
SELECT COUNT(*) as offers_count FROM public.offers;
```
2. Should return a number (not an error)
3. If you see "42" errors or "JWT expired" - REPEAT Step 2

### Step 4: Clear Browser Cache
1. In VS Code, press **F12** (DevTools)
2. Right-click Reload button → **Empty cache and hard reload**
3. Check console - JWT errors should be GONE
4. Website should now load offers normally

### Step 5: Verify in Application
- Landing page should show offers
- Offers page should load
- Special offers page should load
- No 401 errors in console
- Cart should work

---

## If Still Getting Errors:

### Check Current RLS Status
Run this in Supabase SQL Editor:
```sql
-- Show which tables have RLS enabled
SELECT tablename, relrowsecurity 
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Result**: All important tables should show `f` (false) for RLS:
- offers: `f`
- special_offers: `f`
- products: `f`
- website_settings: `f`
- etc.

### Nuclear Option (If above doesn't work)
If RLS is still enabled, run this in SQL Editor:
```sql
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_types DISABLE ROW LEVEL SECURITY;
```

---

## Important Notes:

⚠️ **By disabling RLS:**
- Anyone can READ all product/offer data (this is OK for public catalog)
- Anyone can INSERT orders (this is OK - orders table doesn't have sensitive data)
- You should still protect admin tables with authentication

✅ **After RLS is disabled:**
- No more 401 errors
- Faster page loads
- Website displays normally
- Orders can be created

---

## Files to Help:
- `REMOVE_RLS_POLICIES.sql` - The SQL script to run
- This file - Instructions
- `CHANGES_IMPLEMENTED.md` - Summary of recent updates

**Once you complete Step 2 (run the SQL), your website will work immediately!**
