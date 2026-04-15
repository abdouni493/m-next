# 🎯 Landing Page Image - Exact Steps to Fix

## Current Status
- ✅ Dev server running: http://localhost:8083/
- ✅ Component renders with gradient background
- ❌ Image not displaying = `landing_page_image_url` is likely NULL

---

## 🚨 The Problem

Your landing page is showing a **gradient background** which is the **fallback** when:
- `landing_page_image_url` is **NULL**
- OR the URL is **invalid/broken**

---

## ✅ Complete Fix (3 Steps)

### Step 1: Run SQL in Supabase Dashboard

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Paste this complete script:**

```sql
-- Enable public access to website_settings
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY website_settings_public_access ON public.website_settings
FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.website_settings TO anon;
GRANT SELECT ON public.website_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.website_settings TO authenticated;

-- Ensure record exists
INSERT INTO public.website_settings (id, store_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'My Store')
ON CONFLICT (id) DO NOTHING;

-- Check current state
SELECT id, store_name, landing_page_image_url, updated_at
FROM public.website_settings
WHERE id = '00000000-0000-0000-0000-000000000001';
```

4. **Run the script** - You should see one record returned

---

### Step 2: Upload Image Via Admin Panel

1. **Go to Admin Panel**: http://localhost:8083/dashboard/website
2. **Login** with your credentials
3. **Click Settings Tab** (⚙️ Paramètres)
4. **Scroll to "Landing Page Image"** section (🎨)
5. **Click Upload Area** and select an image file
6. **Click Save Settings** (💾)
7. **Look for success message**: "Paramètres sauvegardés avec succès"

---

### Step 3: Verify in Browser Console

1. **Open DevTools**: Press F12
2. **Go to Console tab**
3. **Refresh page**: Ctrl+R
4. **Look for these messages:**

**SUCCESS (Image will display):**
```
✅ Background image loaded successfully: https://...landing_bg_...
📊 Website Settings Fetched: {
  imageUrl: 'https://...',
  hasData: true
}
```

**FAILURE (Image won't display):**
```
❌ Background image failed to load: https://...
📊 Website Settings Fetched: {
  imageUrl: undefined,
  hasData: false
}
```

---

## 🧪 Test Result Check

After completing all 3 steps:

| Indicator | What It Means |
|-----------|--------------|
| **Gradient Background** | Image URL is NULL - upload image |
| **Image + Parallax** | ✅ SUCCESS - Image displaying |
| **Console has errors** | Check error message for next steps |
| **Console shows undefined** | RLS policy is blocking access |

---

## 🔍 If Image Still Doesn't Show

### Check 1: Verify Database Has URL
```sql
SELECT landing_page_image_url 
FROM public.website_settings 
WHERE id = '00000000-0000-0000-0000-000000000001';
```
- If **NULL** → Upload image again
- If **has URL** → Check if URL is valid (paste in browser)

### Check 2: Verify Storage Bucket
1. Go to Supabase Dashboard
2. Click **Storage**
3. Look for **chargers** bucket
4. Inside, should see files like:
   - `landing_bg_1712345678901_background.jpg`

If **bucket doesn't exist**:
- Click **Create Bucket**
- Name: `chargers`
- Make it **PUBLIC**

### Check 3: Verify Image URL
1. Copy URL from database
2. Paste in **new browser tab**
3. Image should **display directly**
4. If **403 error** → Bucket not public
5. If **404 error** → File doesn't exist

---

## 📋 File to Execute

I've created a complete SQL script at:
```
c:\Users\Admin\Desktop\chargeur\SUPABASE_LANDING_PAGE_FIX.sql
```

**How to use it:**
1. Open file in text editor
2. Copy all SQL
3. Paste in Supabase SQL Editor
4. Run line by line or all at once

---

## 🎯 Quick Summary

| Step | Action | Success Signs |
|------|--------|----------------|
| 1️⃣ | Run SQL script in Supabase | No errors, record found |
| 2️⃣ | Upload image via admin | Toast shows "Saved successfully" |
| 3️⃣ | Check F12 Console | See "✅ Background image loaded" |
| 4️⃣ | View homepage | Image displays with parallax |

---

## 🆘 Still Not Working?

**Send me these:**

1. **Screenshot of Console** (F12 → Console tab)
2. **Screenshot of Supabase Storage** (show chargers bucket)
3. **SQL Query Output:**
   ```sql
   SELECT id, landing_page_image_url, updated_at
   FROM public.website_settings
   WHERE id = '00000000-0000-0000-0000-000000000001';
   ```
4. **Error messages** from console

---

## 🚀 Expected Final Result

Once working:
- ✅ Beautiful background image on homepage
- ✅ Parallax effect when you move mouse
- ✅ Animated shapes rotating
- ✅ Gradient overlays
- ✅ All animations smooth
- ✅ Works on mobile too

---

**That's it! Follow the 3 steps above and your landing page image will display perfectly!** 🎨
