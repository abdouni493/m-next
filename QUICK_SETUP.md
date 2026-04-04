# ⚡ QUICK SETUP - NEW DATABASE (5 Minutes)

## 🎯 3-Step Setup

### Step 1: Create `.env.local`
Save this file as `.env.local` in your project root (next to `package.json`):

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_NAME=chargers Management System
VITE_API_URL=http://localhost:5000
```

### Step 2: Get Your Credentials
1. Go to: https://app.supabase.com
2. Open your NEW project
3. Click: **Settings → API**
4. Copy **Project URL** → paste as `VITE_SUPABASE_URL`
5. Copy **anon key** → paste as `VITE_SUPABASE_ANON_KEY`
6. Save `.env.local`

### Step 3: Deploy Database & Create Admin

#### 3a. Deploy Schema (5 min)
1. Go to Supabase SQL Editor
2. Copy all SQL from: [DATABASE_SCHEMA_FIXED.sql](DATABASE_SCHEMA_FIXED.sql)
3. Paste in SQL Editor
4. Click **Run**
5. Wait for completion ✅

#### 3b. Create Admin User (2 min)
1. Go to: https://app.supabase.com/project/YOUR-ID/auth/users
2. Click **"Add user"**
3. Enter:
   - Email: `admin@admin.com`
   - Password: `admin123`
   - Check "Auto confirm user"
4. Click **Create user** ✅
5. Copy the user UUID
6. Go to SQL Editor and run:
```sql
INSERT INTO public.users (id, email, username, role, is_active, created_at, updated_at) 
VALUES ('[PASTE_UUID]', 'admin@admin.com', 'admin', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

### Step 4: Start App
```bash
npm run dev
# Visit: http://localhost:8081
# Login: admin@admin.com / admin123
```

---

## ✅ Checklist

- [ ] `.env.local` created with NEW credentials
- [ ] Database schema deployed (DATABASE_SCHEMA_FIXED.sql)
- [ ] Admin user created (admin@admin.com)
- [ ] App restarted
- [ ] Login works
- [ ] Dashboard loads ✅

---

## 📍 Get Credentials Here

**Supabase Dashboard:**
- URL: https://app.supabase.com
- Settings → API
- Copy "Project URL" and "anon" key

---

## 🔒 Important
- Never share your ANON KEY publicly
- Don't commit `.env.local` to git
- Always use VITE_ prefix for Vite variables

---

**Done! Your app is now using the NEW database.** 🎉
