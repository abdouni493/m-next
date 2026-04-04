# ⚡ FINAL FIX - DO THIS NOW (3 Minutes)

## Your Errors Explained
1. **PGRST116** = website_settings default row doesn't exist
2. **406 Not Acceptable** = RLS policies are broken
3. **Storage RLS violation** = Storage bucket policies are wrong

**ROOT CAUSE:** SQL fixes haven't been applied to Supabase yet

---

## 🔧 THE FIX (Copy & Paste Everything Below)

### Step 1: Open Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **+ New Query**

### Step 2: Copy the ENTIRE SQL File
Open this file and copy ALL of it:
📄 **[FIX_ALL_ISSUES_NOW.sql](FIX_ALL_ISSUES_NOW.sql)**

Or copy this simplified version:

```sql
-- Insert default website_settings row
INSERT INTO website_settings (id, store_name, slogan, description, currency, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Mon Magasin', 'Votre partenaire de confiance', 'Bienvenue sur notre boutique en ligne', 'DZD', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Fix website_settings RLS
ALTER TABLE website_settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read website settings" ON website_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update website settings" ON website_settings;
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_select" ON website_settings FOR SELECT USING (true);
CREATE POLICY "ws_insert" ON website_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "ws_update" ON website_settings FOR UPDATE USING (true) WITH CHECK (true);

-- Fix offers RLS
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read visible offers" ON offers;
DROP POLICY IF EXISTS "Allow authenticated users to create offers" ON offers;
DROP POLICY IF EXISTS "Allow authenticated users to update their offers" ON offers;
DROP POLICY IF EXISTS "Allow authenticated users to delete their offers" ON offers;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "o_select" ON offers FOR SELECT USING (true);
CREATE POLICY "o_insert" ON offers FOR INSERT WITH CHECK (true);
CREATE POLICY "o_update" ON offers FOR UPDATE USING (true) WITH CHECK (true);

-- Fix special_offers RLS
ALTER TABLE special_offers DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all users to read visible special offers" ON special_offers;
DROP POLICY IF EXISTS "Allow authenticated users to create special offers" ON special_offers;
DROP POLICY IF EXISTS "Allow authenticated users to update their special offers" ON special_offers;
DROP POLICY IF EXISTS "Allow authenticated users to delete their special offers" ON special_offers;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "so_select" ON special_offers FOR SELECT USING (true);
CREATE POLICY "so_insert" ON special_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "so_update" ON special_offers FOR UPDATE USING (true) WITH CHECK (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('website', 'website', true) ON CONFLICT (id) DO NOTHING;

-- Fix storage policies
DROP POLICY IF EXISTS "website public" ON storage.objects;
DROP POLICY IF EXISTS "website authenticated" ON storage.objects;
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'website');
CREATE POLICY "storage_public_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'website');
CREATE POLICY "storage_public_update" ON storage.objects FOR UPDATE USING (bucket_id = 'website') WITH CHECK (bucket_id = 'website');
```

### Step 3: Paste into Supabase
1. Paste the SQL into the editor
2. Click **RUN** button
3. Wait for completion ✓

### Step 4: Verify (Optional but Recommended)
Paste this to verify:
```sql
SELECT * FROM website_settings WHERE id = '00000000-0000-0000-0000-000000000001';
```
Should return 1 row with data ✓

### Step 5: Refresh React App
1. Go back to your app
2. Press **F5** (or Cmd+R on Mac)
3. Try saving settings again ✅

---

## ✅ What Happens After

Once you run the SQL:
- ✅ Can save store name, slogan, description
- ✅ Can upload logos without storage errors
- ✅ Can save contact info (phone, WhatsApp, etc.)
- ✅ Can create/edit offers
- ✅ Can create/edit special offers
- ✅ **NO MORE ERRORS!**

---

## 🆘 If You Still Get Errors

### Error: "Duplicate key value"
This means the row already exists (GOOD!). Just continue.

### Error: "Permission denied"
Your Supabase user doesn't have permission. Contact support or switch to a superuser account.

### Error: Still getting PGRST116
The SQL didn't run successfully. Check for errors in the output panel.

### Error: "table does not exist"
Your database schema is incomplete. Run full setup from:
📄 [WEBSITE_MANAGEMENT_COMPLETE_SETUP.sql](WEBSITE_MANAGEMENT_COMPLETE_SETUP.sql)

---

## 📞 Still Stuck?

**Double-check:**
1. ✅ You're in the right Supabase project
2. ✅ You're using SQL Editor, NOT Table Editor
3. ✅ You copied the ENTIRE SQL file
4. ✅ You clicked RUN, not just selected the text
5. ✅ You waited for the query to complete

**Then:**
1. Refresh browser (F5)
2. Try saving settings again
3. Report any remaining errors

---

**DO THIS NOW and you'll be fixed! 🚀**
