# ⚡ NEW DATABASE - QUICK REFERENCE CARD

## 🎯 THE 3-STEP PROCESS

### STEP 1: Create `.env.local`
```
Location: Project root (where package.json is)
File name: .env.local

Contents:
────────────────────────────────────────
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=chargers Management System
VITE_API_URL=http://localhost:5000
────────────────────────────────────────

Get credentials from:
https://app.supabase.com → Your Project → Settings → API
```

### STEP 2: Deploy Schema
```
1. Go to: https://app.supabase.com/project/YOUR-ID/sql/new
2. Copy ALL code from: DATABASE_SCHEMA_FIXED.sql
3. Paste into SQL Editor
4. Click: Run
5. Wait: "Query executed successfully"
```

### STEP 3: Create Admin User
```
Email: admin@admin.com
Password: admin123
SQL: See ADMIN_USER_SETUP.sql
```

### STEP 4: Start App
```bash
npm run dev
```

### STEP 5: Login
```
Email: admin@admin.com
Password: admin123
```

---

## 📋 CHECKLIST

- [ ] Created `.env.local` with credentials
- [ ] Deployed DATABASE_SCHEMA_FIXED.sql
- [ ] Created admin user account
- [ ] Ran `npm run dev`
- [ ] Logged in successfully
- [ ] Dashboard displays data

---

## 🔑 CREDENTIALS

```
Admin Email:    admin@admin.com
Admin Password: admin123
Admin Role:     admin
```

---

## 🌐 IMPORTANT URLs

```
App:                  http://localhost:8081
Supabase Dashboard:   https://app.supabase.com
```

---

## 📂 KEY FILES

```
Create:   .env.local
Deploy:   DATABASE_SCHEMA_FIXED.sql
SQL Ref:  ADMIN_USER_SETUP.sql
Code:     src/lib/supabaseClient.ts
```

---

## 🚀 COMMANDS

```bash
npm run dev          # Start development server
npm install          # Install dependencies
npm run build        # Build for production
```

---

## ✅ SUCCESS SIGNS

✅ App starts without credential error
✅ Login page appears at http://localhost:8081
✅ Can login with admin@admin.com / admin123
✅ Dashboard shows data from new database
✅ All pages display their data

---

## 🆘 QUICK FIXES

**"Cannot find .env.local"**
→ Create in project root (same folder as package.json)

**"Invalid API key"**
→ Use anon key, not secret key

**"Database does not exist"**
→ Deploy DATABASE_SCHEMA_FIXED.sql to Supabase

**"Can't login"**
→ Admin user not created properly

---

## 📖 GUIDES

| Guide | Time |
|-------|------|
| START_HERE_NEW_DATABASE.md | 5 min |
| QUICK_SETUP.md | 5 min |
| SETUP_FINAL_INSTRUCTIONS.md | 10 min |
| COMPLETE_SETUP_GUIDE.md | 20 min |

---

## 📊 13 PAGES READY

✅ Dashboard
✅ Inventory  
✅ Purchase Invoices
✅ Sales
✅ Suppliers
✅ Employees
✅ Reports
✅ POS
✅ Barcodes
✅ Settings
✅ Login
✅ Profile
✅ Home

---

**Time:** 15-20 minutes
**Status:** Ready to go!
