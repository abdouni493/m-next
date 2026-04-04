# Image Upload Setup - Quick Checklist

## ⚡ Setup (5 Minutes)

### Step 1: Create Storage Bucket (2 minutes)

1. Go to: https://app.supabase.com/project/pzzngzaljrfrbteclexi/storage/buckets
2. Click **"New Bucket"**
3. Name: `chargers`
4. Toggle: **"Public bucket"** ✅ (important!)
5. Click **"Create bucket"**

✅ Done!

---

### Step 2: Apply SQL Policies (2 minutes)

1. Open: `STORAGE_AND_IMAGE_SETUP.sql`
2. Copy all content (Ctrl+A, Ctrl+C)
3. Go to: https://app.supabase.com/project/pzzngzaljrfrbteclexi/sql/new
4. Paste SQL (Ctrl+V)
5. Click **RUN**
6. Wait for completion ✅

✅ Done!

---

### Step 3: Code Already Updated ✅

The `uploadImages()` function in `Inventory.tsx` is already updated to:
- Upload files to the 'chargers' bucket
- Get public URLs
- Save URLs to product_images table
- Include proper error handling

**No code changes needed!** ✅

---

## 🧪 Test (2 Minutes)

### Test Image Upload:

1. Go to Inventory page
2. Click "Add Charger"
3. Fill form:
   - Name: "Test USB-C Charger"
   - Mark, connector, voltage, etc.
   - **Add at least 1 image** (select file)
4. Click "Save"

### Expected Result:

✅ "Charger added successfully!" message  
✅ New charger appears in list  
✅ Image displays in charger card  

### If It Fails:

1. Open **Browser Console** (F12)
2. Look for error messages
3. Check:
   - Is bucket 'chargers' PUBLIC?
   - Are SQL policies created?
   - Is user authenticated?

---

## 📋 Complete Checklist

Before testing:

- [ ] Bucket 'chargers' created
- [ ] Bucket set to PUBLIC
- [ ] `STORAGE_AND_IMAGE_SETUP.sql` executed
- [ ] Inventory.tsx updated (already done ✅)
- [ ] User is logged in

After testing:

- [ ] Can save charger with image
- [ ] Success message appears
- [ ] Image displays in list
- [ ] Image URL is in database
- [ ] File in storage bucket

---

## 🎯 File Upload Flow

```
┌─────────────────┐
│ User selects    │
│ image in app    │
└────────┬────────┘
         ↓
┌─────────────────────────────┐
│ uploadImages() called        │
│ for each image:              │
│ 1. Upload to storage         │
│ 2. Get public URL            │
│ 3. Save URL to database      │
└────────┬────────────────────┘
         ↓
┌──────────────────────────────┐
│ Storage: chargers/productId/ │
│          /timestamp-0.jpg    │
│          /timestamp-1.jpg    │
└────────┬─────────────────────┘
         ↓
┌──────────────────────────────┐
│ Database: product_images     │
│ - product_id                 │
│ - image_url (public link)    │
│ - file_path (in bucket)      │
│ - display_order              │
│ - is_primary                 │
└────────┬─────────────────────┘
         ↓
┌──────────────────────────────┐
│ App displays image using URL │
│ <img src={image_url} />      │
└──────────────────────────────┘
```

---

## 📚 Files Provided

| File | Purpose | Time |
|------|---------|------|
| `STORAGE_AND_IMAGE_SETUP.sql` | Create RLS policies | 1 min to run |
| `IMAGE_UPLOAD_GUIDE.md` | Full documentation | 10 min to read |
| `Inventory.tsx` | Updated code | Already done ✅ |
| `IMAGE_UPLOAD_QUICK_SETUP.md` | This file | 5 min |

---

## 🚀 Ready?

1. ✅ Create bucket (2 min)
2. ✅ Run SQL (2 min)
3. ✅ Test (2 min)

**Total: ~6 minutes** to full working image uploads!

---

## 💡 Quick Answers

**Q: Where do images go?**  
A: Supabase Storage 'chargers' bucket

**Q: How do they display?**  
A: Public URLs saved in product_images table

**Q: Can I delete images?**  
A: Yes, admins only (via RLS policy)

**Q: File size limits?**  
A: Depends on Supabase plan (usually 1GB per file)

**Q: Do images need auth to view?**  
A: No, bucket is public (URLs work anywhere)

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Upload fails (403) | Bucket not public - toggle it in Storage settings |
| Upload fails (401) | User not logged in - check auth session |
| No image displays | URL in database - verify image_url field |
| URL doesn't work | Bucket public toggle off - turn it on |

---

## ✅ Success Indicators

When working correctly:

✅ File appears in storage bucket  
✅ Record in product_images table  
✅ image_url contains valid URL  
✅ Image displays in app  
✅ No console errors  

**You're all set!** 🎉
