# 🔐 Remove All Blocking Policies - SQL Script

If you're still having issues, run this script to **completely open** the `website_settings` table:

---

## Complete Removal Script

**Copy and paste this in Supabase SQL Editor:**

```sql
-- ========== REMOVE ALL BLOCKING POLICIES ==========

-- Step 1: Disable RLS completely
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'website_settings'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.website_settings';
    END LOOP;
END $$;

-- Step 3: Verify no policies remain
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'website_settings';
-- Should return: 0

-- Step 4: Grant full public access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_settings TO service_role;

-- Step 5: Verify access
SELECT COUNT(*) as total_records
FROM public.website_settings;

-- If you see a number > 0, then access is working!
```

---

## What This Does

| Line | Purpose |
|------|---------|
| `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` | Completely disables RLS |
| `DROP POLICY` | Removes any existing policies |
| `GRANT ... TO anon` | Public users can read |
| `GRANT ... TO authenticated` | Logged-in users can read/write |
| `SELECT COUNT(*)` | Verify access works |

---

## Result

After running:
- ✅ RLS is **disabled**
- ✅ All policies are **removed**
- ✅ Table is **publicly accessible**
- ✅ Anyone can read `landing_page_image_url`

---

## If You Still Want RLS (More Secure)

Use this instead:

```sql
-- Disable RLS
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS website_settings_public_access ON public.website_settings;

-- Create simple public read policy
CREATE POLICY website_public_read ON public.website_settings
FOR SELECT
USING (true);

-- Create authenticated write policy
CREATE POLICY website_authenticated_write ON public.website_settings
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

---

## Verify It Worked

Run this query - should return at least 1 record:

```sql
SELECT id, store_name, landing_page_image_url
FROM public.website_settings
LIMIT 1;
```

If you see data → ✅ Access is working
If error → ❌ There's still an issue

---

## Nuclear Option (Complete Reset)

If nothing else works, completely rebuild the table:

```sql
-- Backup existing data (optional)
CREATE TABLE website_settings_backup AS
SELECT * FROM public.website_settings;

-- Drop and recreate table
DROP TABLE IF EXISTS public.website_settings CASCADE;

CREATE TABLE public.website_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  store_name VARCHAR NOT NULL,
  slogan VARCHAR,
  description TEXT,
  logo_url TEXT,
  logo_data BYTEA,
  facebook_url VARCHAR,
  instagram_url VARCHAR,
  tiktok_url VARCHAR,
  snapchat_url VARCHAR,
  location VARCHAR,
  phone_number VARCHAR,
  whatsapp_number VARCHAR,
  telegram_number VARCHAR,
  currency VARCHAR DEFAULT 'DZD',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID,
  landing_page_image_url TEXT,
  CONSTRAINT website_settings_pkey PRIMARY KEY (id),
  CONSTRAINT website_settings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Disable RLS (completely open)
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT SELECT ON public.website_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.website_settings TO authenticated;

-- Insert default record
INSERT INTO public.website_settings (
  id,
  store_name,
  slogan,
  description
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'My Store',
  'Your slogan',
  'Your description'
);

-- Verify
SELECT * FROM public.website_settings;
```

---

## 🚨 IMPORTANT

After running any SQL:
1. **Refresh your browser** (Ctrl+F5)
2. **Check F12 Console** for new logs
3. **Try uploading image again** via admin panel
4. **Homepage should display the image**

---

**Choose the script above that fits your situation and run it in Supabase SQL Editor!** 🔧
