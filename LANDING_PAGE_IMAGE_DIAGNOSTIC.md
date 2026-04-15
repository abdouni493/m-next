# 🔍 Landing Page Image - Complete Diagnostic Guide

## Problem: Image Not Displaying

Your landing page is showing a **gradient background** instead of the uploaded image. This means:

- ✅ Component is rendering (you can see it works)
- ✅ Fallback UI is showing (the gradient)
- ❌ `landing_page_image_url` is NULL or undefined
- ❌ Image hasn't been uploaded yet OR wasn't saved to database

---

## 🔧 Diagnostic Steps

### Step 1: Check Database Directly

**Run this SQL in Supabase SQL Editor:**

```sql
SELECT 
  id,
  store_name,
  logo_url,
  landing_page_image_url,
  updated_at
FROM public.website_settings
WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Expected Results:**
- ✅ If `landing_page_image_url` has a URL → Image should display (check browser cache)
- ❌ If `landing_page_image_url` is NULL → You haven't uploaded an image yet
- ❌ If `landing_page_image_url` exists but shows error → URL might be invalid

---

### Step 2: Check Browser Console

**Steps:**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Refresh the page (Ctrl+R)
4. Look for logs:

**Good Signs:**
```
✅ Background image loaded successfully: https://...
📊 Website Settings Fetched: {
  dataLength: 1,
  hasData: true,
  firstRecord: { ... },
  imageUrl: 'https://...'
}
```

**Bad Signs:**
```
❌ Background image failed to load: https://...
❌ REST API error: 401 or 403
📊 Website Settings Fetched: {
  dataLength: 0,
  hasData: false,
  imageUrl: undefined
}
```

---

### Step 3: Check Storage Bucket

**In Supabase Dashboard:**
1. Go to **Storage**
2. Look for **`chargers` bucket**
3. You should see files like:
   - `landing_bg_1712345678901_background.jpg`
   - `logo_1712345678902_logo.png`

**If bucket doesn't exist:**
- Create it manually in Storage
- Make it **Public** (not private)

---

### Step 4: Verify Supabase Credentials

**Check your `.env.local` file:**

```
VITE_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
```

**If wrong:**
- Go to Supabase Dashboard
- Settings → API
- Copy the correct values
- Update `.env.local`
- Restart dev server

---

## 🚀 Complete Fix Workflow

### Option A: Upload Image Fresh (Recommended)

1. **Check Database is Empty:**
   ```sql
   UPDATE public.website_settings
   SET landing_page_image_url = NULL
   WHERE id = '00000000-0000-0000-0000-000000000001';
   ```

2. **Go to Admin Panel:**
   - Website Manager → Settings Tab
   - Scroll to "Landing Page Image"
   - Upload an image file
   - Click "Save Settings"

3. **Check Console (F12):**
   - Should see: `✅ Background image loaded successfully`

4. **Verify Database:**
   - Run SQL check above
   - Should see URL in `landing_page_image_url`

---

### Option B: Directly Insert URL to Database

**If you already have an image in storage:**

```sql
UPDATE public.website_settings
SET landing_page_image_url = 'https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/chargers/landing_bg_1712345678901_background.jpg'
WHERE id = '00000000-0000-0000-0000-000000000001';
```

Then:
1. Hard refresh browser (Ctrl+F5)
2. Check console for image load
3. Should display on homepage

---

## 🔐 Fix RLS Policies (If Needed)

**Run this SQL to ensure website_settings is fully accessible:**

```sql
-- Disable RLS on website_settings
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY website_settings_public_access ON public.website_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.website_settings TO anon;
GRANT SELECT ON public.website_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.website_settings TO authenticated;
```

---

## 🧪 Testing the Fix

### 1. After Uploading Image:
- [ ] Check F12 Console for success message
- [ ] Check database has URL
- [ ] Hard refresh (Ctrl+F5)
- [ ] Image should appear with parallax effect

### 2. Check Image URL:
- [ ] Copy URL from database
- [ ] Paste in new browser tab
- [ ] Image should display directly from storage

### 3. Verify All Data:
```sql
SELECT 
  store_name,
  logo_url,
  landing_page_image_url
FROM public.website_settings
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

## 📊 Troubleshooting Matrix

| Issue | Cause | Fix |
|-------|-------|-----|
| Image URL is NULL | Haven't uploaded | Upload via admin panel |
| URL exists but image doesn't show | URL is invalid | Check URL in browser |
| 403 error | Bucket not public | Make `chargers` bucket public |
| CORS error | Storage access issue | Check Supabase CORS settings |
| Console shows "undefined" | API query failed | Check RLS policies |
| Image uploads but doesn't save | Database write failed | Check auth permissions |

---

## ✅ Complete Checklist

- [ ] Supabase credentials are correct in `.env.local`
- [ ] `chargers` bucket exists and is public
- [ ] `website_settings` table has RLS disabled or public policy
- [ ] Uploaded image appears in `chargers` bucket
- [ ] Database `website_settings.landing_page_image_url` has URL
- [ ] F12 Console shows success messages
- [ ] Hard refresh browser (Ctrl+F5)
- [ ] Image displays with parallax effect

---

## 📞 Still Not Working?

**Send me:**
1. Screenshot of F12 Console (with all messages)
2. Output of this SQL:
   ```sql
   SELECT landing_page_image_url FROM public.website_settings WHERE id = '00000000-0000-0000-0000-000000000001';
   ```
3. Screenshot of Supabase Storage (show if files are there)
4. Which step failed?

---

## 🎯 Next Steps

1. **Run the database check SQL** above
2. **Check F12 Console** for error messages
3. **If URL is NULL** → Upload image via admin panel
4. **If URL exists** → Check if it's valid by pasting in browser
5. **If still failing** → Run the RLS fix SQL

Your landing page is ready - just need to get the image URL in the database! 🚀
