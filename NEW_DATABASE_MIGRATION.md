![NEW_DATABASE_MIGRATION.md] # 🔄 NEW DATABASE MIGRATION GUIDE

## Overview
Your application is now configured to use **environment variables** for the NEW database connection. The old database credentials have been removed from the code.

---

## ✅ What Was Fixed

### 1. **Schema Error** ✅
- **Problem:** `LONGTEXT` type doesn't exist in PostgreSQL
- **Solution:** Created `DATABASE_SCHEMA_FIXED.sql` with `TEXT` instead
- **File:** [DATABASE_SCHEMA_FIXED.sql](DATABASE_SCHEMA_FIXED.sql)

### 2. **Database Connection** ✅
- **Old Hardcoded Database Removed:** `pzzngzaljrfrbteclexi.supabase.co`
- **New Setup:** Uses environment variables for flexibility
- **File Updated:** [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts)

### 3. **Admin User Setup** ✅
- **SQL File Created:** [CREATE_ADMIN_USER.sql](CREATE_ADMIN_USER.sql)
- **Credentials:** admin@admin.com / admin123
- **Role:** admin

---

## 🚀 SETUP INSTRUCTIONS (Required!)

### Step 1: Create `.env.local` File

Copy the template file or create `.env.local` in your project root:

```bash
# On Windows (PowerShell)
copy .env.local.example .env.local
```

### Step 2: Add Your NEW Database Credentials

Edit `.env.local` and fill in YOUR NEW Supabase project details:

```
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to find your credentials:**
1. Go to: https://app.supabase.com
2. Select your NEW project
3. Click: **Settings → API**
4. Copy **Project URL** → `VITE_SUPABASE_URL`
5. Copy **anon key** → `VITE_SUPABASE_ANON_KEY`

### Step 3: Deploy the Database Schema

1. Open Supabase Dashboard → **SQL Editor**
2. Open file: [DATABASE_SCHEMA_FIXED.sql](DATABASE_SCHEMA_FIXED.sql)
3. Copy all the SQL code
4. Paste into Supabase SQL Editor
5. Click **Run**
6. Wait for all tables to be created ✅

### Step 4: Create Admin User

**Choose ONE method:**

#### Option A: Use Supabase Dashboard (Easiest) 🟢
1. Go to: https://app.supabase.com/project/[your-project-id]/auth/users
2. Click **"Add user"**
3. Enter:
   - Email: `admin@admin.com`
   - Password: `admin123`
   - Check "Auto confirm user"
4. Click **Create user**
5. Copy the user UUID
6. Run this SQL in your database:
```sql
INSERT INTO public.users (
  id, email, username, role, is_active, created_at, updated_at
) VALUES (
  '[PASTE_UUID_HERE]',
  'admin@admin.com',
  'admin',
  'admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

#### Option B: Use SignUp in App
1. Start your app: `npm run dev`
2. Go to: http://localhost:8081
3. Click **"Sign up"**
4. Enter: admin@admin.com / admin123 / admin
5. After signup, run this SQL to set role:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'admin@admin.com';
```

### Step 5: Restart the Application

```bash
# Stop current dev server (Ctrl+C)
# Then restart:
npm run dev
```

The app will now connect to your NEW database! 🎉

---

## 📋 All Updated Pages

The following pages will now display data from the NEW database:

- ✅ **Dashboard** (Tableau de Bord) - Overview & analytics
- ✅ **Inventory** (Gestion du Stock) - Product management
- ✅ **Purchase Invoices** (Factures d'Achat) - Purchase orders
- ✅ **Sales** (Ventes) - Sales transactions
- ✅ **Suppliers** (Fournisseurs) - Supplier management
- ✅ **Employees** (Employés) - Staff management
- ✅ **Reports** (Rapports) - Business analytics
- ✅ **POS** (Point de Vente) - Point of sale system
- ✅ **Barcodes** (Codes Barres) - Barcode tracking
- ✅ **Settings** (Paramètres) - System configuration

All pages are already importing from `src/lib/supabaseClient.ts` ✅

---

## 🔒 Security Checklist

- [ ] `.env.local` is in your `.gitignore` (never commit it!)
- [ ] New Supabase URL added to `.env.local`
- [ ] New Anon Key added to `.env.local`
- [ ] Database schema deployed to NEW database
- [ ] Admin user created and tested
- [ ] App restarted after .env changes
- [ ] Login with admin@admin.com / admin123 works

---

## ✨ Verification Tests

After setup, test these functions:

```bash
# 1. Start app
npm run dev

# 2. Open browser
http://localhost:8081

# 3. Test Login
- Email: admin@admin.com
- Password: admin123
- Should see Dashboard ✅

# 4. Test Inventory
- Click "Gestion du Stock"
- Should load products from NEW database ✅

# 5. Test Other Pages
- Click each menu item
- Should display data from NEW database ✅
```

---

## 🆘 Troubleshooting

### Error: "Supabase credentials not configured!"
**Solution:** You're missing `.env.local` file
```bash
copy .env.local.example .env.local
# Then add your credentials
```

### Error: "Project not found"
**Solution:** Your VITE_SUPABASE_URL is incorrect
- Go to: https://app.supabase.com
- Check Project URL in Settings → API
- Paste correct URL in `.env.local`

### Error: "Invalid API key"
**Solution:** Your VITE_SUPABASE_ANON_KEY is incorrect
- Go to: https://app.supabase.com
- Get the **anon** key (not secret key!)
- Paste in `.env.local`

### Login shows "Invalid credentials"
**Solution:** Admin user might not be created
- Run the SQL from Step 4 above
- Make sure role is set to 'admin'

### Tables don't exist in database
**Solution:** Schema wasn't deployed
1. Copy all SQL from [DATABASE_SCHEMA_FIXED.sql](DATABASE_SCHEMA_FIXED.sql)
2. Paste in Supabase SQL Editor
3. Click Run
4. Wait for completion

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| **Admin Email** | admin@admin.com |
| **Admin Password** | admin123 |
| **Admin Role** | admin |
| **App URL** | http://localhost:8081 |
| **Supabase Dashboard** | https://app.supabase.com |
| **Config File** | .env.local |
| **Database Client** | src/lib/supabaseClient.ts |

---

## 🎯 Next Steps

1. ✅ Create `.env.local` with new credentials
2. ✅ Deploy database schema
3. ✅ Create admin user
4. ✅ Restart application
5. ✅ Test login and navigation
6. ✅ Verify data loads from new database

---

**Last Updated:** 2026-04-02
**Status:** ✅ Ready for Deployment
