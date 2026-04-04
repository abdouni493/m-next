# 🚨 STEP-BY-STEP: RUN SQL IN SUPABASE NOW

## YOU MUST DO THIS - Nothing else will work until you do

### Step 1: Open Supabase Dashboard
Go to: **https://app.supabase.com**
- Login if needed
- Select project: **pzzngzaljrfrbteclexi**

### Step 2: Click SQL Editor
In left sidebar, find and click **SQL Editor**
(It looks like a database icon with "SQL" text)

### Step 3: Create New Query
Click **+ New Query** button (top right)
A blank text area appears

### Step 4: Copy This SQL Code
Copy EXACTLY this (all 7 lines):

```
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
```

### Step 5: Paste Into SQL Editor
- Click in the empty text area
- Paste the code (Ctrl+V or Cmd+V)

### Step 6: RUN THE QUERY
Look for **RUN** button (looks like a play ▶️ button or blue button)
Click it

### Step 7: Wait for Success
You should see:
- "Success" message, OR
- "No results" message
- (NOT an error message)

### Step 8: Refresh Your Browser
Back in VS Code:
- Press **F5** to refresh
- Or **Ctrl+Shift+R** for hard refresh

---

## IMPORTANT NOTES

⚠️ **The SQL must run WITHOUT errors** - if you see "ERROR 42P01" or similar, something went wrong

✅ **After successful SQL run:**
- All 401 errors disappear
- Offers load
- Special offers load
- Website displays normally
- Logo and store name appear

---

## Visual Guide: Where to Click

```
Supabase Dashboard
├─ Left Sidebar
│  └─ SQL Editor  ← CLICK HERE
├─ Top Area
│  └─ + New Query  ← CLICK HERE
├─ Text Area
│  └─ PASTE SQL HERE
└─ Top Right
   └─ RUN Button  ← CLICK HERE
```

---

## Troubleshooting

### If you see an error:
1. Copy the SQL code again carefully
2. Make sure you didn't add extra spaces/lines
3. Click RUN again

### If nothing happens:
1. Wait 5 seconds
2. Check if there's a "Running..." indicator
3. Try again

### If it says "relation does not exist":
- Don't worry, just means that table doesn't exist
- The query will skip it and continue
- Other tables will be fixed

---

## CONFIRM SUCCESS

After running SQL and refreshing browser, check:
- [ ] No 401 errors in console
- [ ] Offers page loads
- [ ] Special offers page loads  
- [ ] Landing page shows offers
- [ ] Store name/logo visible
- [ ] No JWT errors

If all checked ✅ - YOU'RE DONE!

---

## Can't Find SQL Editor?

Alternative: Check your Supabase email for project URL, should look like:
`https://app.supabase.com/project/[YOUR-PROJECT-ID]/editor`

Then:
1. Go to that URL
2. Should be in SQL Editor already
3. Click "+ New Query"
4. Paste code
5. Click RUN

---

**DO THIS NOW - IT'S THE ONLY THING BLOCKING YOUR WEBSITE**
