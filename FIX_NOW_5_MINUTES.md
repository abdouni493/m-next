# 🆘 IMMEDIATE FIX - 5 Minutes to Solve

## The Problem
Your Supabase database is missing the default `website_settings` row. That's why you get PGRST116 errors.

## Solution (Do This RIGHT NOW)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Click on your project
3. Click **SQL Editor** (on the left sidebar)

### Step 2: Create New Query
1. Click **+ New Query** button
2. Copy ALL the text below:

```sql
INSERT INTO website_settings (
  id,
  store_name,
  slogan,
  description,
  currency,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Mon Magasin',
  'Votre partenaire de confiance',
  'Bienvenue sur notre boutique en ligne',
  'DZD',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Execute
1. Paste the SQL into the editor
2. Click **RUN** button (or press `Ctrl+Enter`)
3. Wait for success message ✓

### Step 4: Verify It Worked
Copy and paste this verification query:

```sql
SELECT * FROM website_settings WHERE id = '00000000-0000-0000-0000-000000000001';
```

**Result should show:** 1 row with your settings data

### Step 5: Refresh React App
1. Go back to your website management interface
2. Refresh browser (F5 or Cmd+R)
3. Try saving settings again ✓

---

## If You Still Get Errors

### Error: "duplicate key value violates unique constraint"
**This is GOOD!** It means the row already exists.
- Run the verification query above to check its state
- If the row exists, delete it first:
```sql
DELETE FROM website_settings WHERE id = '00000000-0000-0000-0000-000000000001';
```
Then run the INSERT again.

### Error: "table website_settings does not exist"
Your table wasn't created. Run [WEBSITE_MANAGEMENT_COMPLETE_SETUP.sql](WEBSITE_MANAGEMENT_COMPLETE_SETUP.sql) first.

### Error: Still getting PGRST116 after running the SQL
1. Verify the row exists (run verification query)
2. If it doesn't exist, run the INSERT again
3. Refresh your browser

---

## ✅ What Should Happen Next

After running the SQL:
1. ✅ You can save website settings
2. ✅ You can create offers
3. ✅ You can create special offers
4. ✅ You can save contacts

**Everything should work now!**

---

## Files Referenced
- [QUICK_FIX_WEBSITE_SETTINGS.sql](QUICK_FIX_WEBSITE_SETTINGS.sql) - The SQL to run
- [WEBSITE_MANAGEMENT_COMPLETE_SETUP.sql](WEBSITE_MANAGEMENT_COMPLETE_SETUP.sql) - Full setup if needed

---

**Do this now and report back! 🚀**
