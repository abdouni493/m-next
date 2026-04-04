# 🔧 SUPABASE SQL FIX - VISUAL GUIDE

## ❌ The Problem
Your code is working perfectly! BUT the database still has **broken triggers** that crash when you try to finalize an order.

Error message shows: `column "stock" does not exist` 

This is a **database trigger issue**, NOT a code issue.

---

## ✅ The Solution
You must **execute SQL in Supabase** to remove these broken triggers.

### Step-by-Step:

#### **Step 1: Open Supabase Dashboard**
- Go to: https://supabase.com
- Login to your account
- Open your **"chargeur"** project

#### **Step 2: Find SQL Editor**
Look at the LEFT SIDEBAR:
```
📊 Projects
  chargeur
    ├─ Home
    ├─ Editor (SQL Editor is here) ← CLICK
    ├─ Database
    ├─ Authentication
    └─ ...
```

Click on **"SQL Editor"** or **"Editor"**

#### **Step 3: Create New Query**
At the top, you'll see:
```
[New Query] button
```
Click it to create a new query

#### **Step 4: Copy the SQL**
In VS Code, open: **FIX_DATABASE_COMPLETE.sql**

**SELECT ALL** (Ctrl+A) and **COPY** (Ctrl+C)

#### **Step 5: Paste in Supabase**
In the Supabase SQL editor, **PASTE** (Ctrl+V) all the SQL code

You'll see something like:
```sql
DROP TRIGGER IF EXISTS trigger_finalize_order ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON orders CASCADE;
... (more DROP statements)
SELECT trigger_name, event_object_table ...
```

#### **Step 6: Execute the SQL**
Look for the **RUN** button (usually top-right, blue button)

Click **RUN** ▶️

#### **Step 7: Check the Result**
You should see:
```
(0 rows)
```

This means: ✅ **Triggers are removed!**

---

## 🧪 Test it Now

After running the SQL:

1. Go back to your app
2. Create a test order from: `/website-shop/order`
3. Go to **Commands** (Admin panel)
4. Click the order
5. Click **"Start Delivery"**
6. Click **"Finalize"**

**Expected result:**
- ✅ Order status changes to "delivered"
- ✅ Product inventory decreases
- ❌ **NO ERROR 42703**

---

## 🆘 Troubleshooting

### Issue: Can't find SQL Editor
**Solution:** Look at left sidebar for "SQL" or "Editor" tab. If not visible, click the three dots menu icon.

### Issue: Got an error running SQL
**Solution:** Make sure you're using the correct Supabase project URL in your app code. Check your `.env` file for `VITE_SUPABASE_URL`

### Issue: Still getting error 42703 after running SQL
**Solution:** 
1. Refresh your browser (F5)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try finalizing the order again

### Issue: Can't copy the SQL file
**Solution:** 
Open FIX_DATABASE_COMPLETE.sql → Click Ctrl+A → Click Ctrl+C → Then paste in Supabase

---

## 📞 Still Having Issues?

The SQL has these commands:
- `DROP TRIGGER` - Removes 6 broken triggers
- `DROP FUNCTION` - Removes 4 broken functions  
- `SELECT` - Verifies everything is clean

Make sure ALL of these run successfully (no red errors).

---

## ✨ After This Works

Your finalize order button will:
1. ✅ Update order status to "delivered"
2. ✅ Deduct inventory from products automatically
3. ✅ Show success message (no errors!)

**Go run the SQL now! It takes 30 seconds.** 🚀
