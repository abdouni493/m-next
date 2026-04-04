# Image Upload and Storage Configuration Guide

## Overview

Your charger app now uses Supabase Storage to save images and the database to store URLs for display.

**Flow**:
1. User selects image(s) in Inventory
2. File uploads to `chargers` bucket in Supabase Storage
3. Public URL is generated
4. URL is saved to `product_images` table in database
5. App displays image using the URL

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Inventory.tsx (Frontend)               │
│  User selects image → handleFileSelect() → uploadImages()
└────────────────────────┬────────────────────────────────┘
                         ↓
        ┌───────────────────────────────────┐
        │  Supabase Storage                 │
        │  Bucket: 'chargers'               │
        │  Path: product-id/timestamp.jpg   │
        │  ↓                                │
        │  Returns public URL               │
        └────────────┬──────────────────────┘
                     ↓
        ┌───────────────────────────────────┐
        │  Database                         │
        │  Table: product_images            │
        │  Stores:                          │
        │  - product_id                     │
        │  - image_url (public URL)         │
        │  - file_path (in bucket)          │
        │  - display_order                  │
        │  - is_primary                     │
        └────────────┬──────────────────────┘
                     ↓
        ┌───────────────────────────────────┐
        │  Display in App                   │
        │  <img src={image_url} />          │
        └───────────────────────────────────┘
```

---

## Setup Steps

### Step 1: Create the 'chargers' Bucket

1. Go to: https://app.supabase.com/project/pzzngzaljrfrbteclexi/storage/buckets
2. Click **"New Bucket"** button
3. Enter name: `chargers`
4. Toggle **"Public bucket"** ON (important!)
5. Click **"Create bucket"**

### Step 2: Configure Storage Policies

Run the SQL file: **`STORAGE_AND_IMAGE_SETUP.sql`**

This creates the necessary RLS policies:

```sql
-- Policy 1: Anyone can read images
CREATE POLICY "Allow public to read chargers" ON storage.objects
  FOR SELECT USING (bucket_id = 'chargers');

-- Policy 2: Authenticated users can upload
CREATE POLICY "Allow authenticated uploads chargers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chargers' AND auth.role() = 'authenticated');

-- Policy 3: Admins can delete images
CREATE POLICY "Allow admin to delete chargers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chargers' AND role = 'admin' in users);
```

### Step 3: Verify product_images Table

Check that the `product_images` table has RLS enabled with proper policies:

```sql
-- Check table exists
SELECT * FROM public.product_images LIMIT 1;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'product_images';
```

---

## Code Implementation

### Inventory.tsx - Image Upload Function

The `uploadImages()` function:

```typescript
const uploadImages = async (productId: string) => {
  if (formData.images.length === 0) return;

  try {
    console.log(`Starting image upload for product ${productId}`);
    
    for (let i = 0; i < formData.images.length; i++) {
      const file = formData.images[i];
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${productId}/${timestamp}-${i}.${fileExtension}`;
      
      console.log(`Uploading: ${fileName}`);
      
      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('chargers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('chargers')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;

      // 3. Save to database
      const { error: dbError } = await supabase
        .from('product_images')
        .insert([
          {
            product_id: productId,
            image_url: publicUrl,
            file_path: fileName,
            display_order: i,
            is_primary: i === 0,
            uploaded_by: (await supabase.auth.getUser()).data?.user?.id,
          },
        ]);

      if (dbError) throw dbError;
    }
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};
```

### Features:

✅ Unique filename with timestamp to prevent conflicts  
✅ File extension preserved  
✅ Cache control set (3600 seconds)  
✅ Public URL generation  
✅ Database record creation  
✅ Track who uploaded image  
✅ Error logging for debugging  

---

## File Structure in Storage

```
chargers/
├── product-uuid-1/
│   ├── 1712234567890-0.jpg
│   ├── 1712234567891-1.jpg
│   └── 1712234567892-2.jpg
├── product-uuid-2/
│   ├── 1712234567900-0.png
│   └── 1712234567901-1.png
└── product-uuid-3/
    └── 1712234567910-0.jpg
```

**Naming pattern**: `{productId}/{timestamp}-{imageIndex}.{extension}`

**Benefits**:
- Organized by product
- No filename conflicts
- Preserves original format
- Easy to track upload time

---

## Database Schema

### product_images Table

```sql
CREATE TABLE product_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,                    -- Public URL from storage
  file_path text NOT NULL,                    -- Path in bucket
  display_order integer DEFAULT 0,            -- Order in gallery
  is_primary boolean DEFAULT false,           -- Primary image flag
  uploaded_by uuid REFERENCES auth.users(id), -- Who uploaded
  created_at timestamp DEFAULT NOW()
);
```

---

## Error Handling

The improved error handling provides detailed feedback:

```typescript
try {
  // Attempt to save product
  const { data, error } = await supabase
    .from('products')
    .insert([...])
    .select()
    .single();

  if (error) throw error;

  // Try to upload images
  if (formData.images.length > 0) {
    try {
      await uploadImages(data.id);
    } catch (imageError) {
      // Product saved but images failed
      alert(`Charger saved but image upload failed: ${imageError.message}`);
      // Still refresh the list
      loadChargers();
      return;
    }
  }

  // Success
  alert('Charger added successfully!');
} catch (error) {
  // Product save failed
  alert(`Error saving charger: ${error.message}`);
}
```

**Key features**:
- Graceful degradation (product saved even if images fail)
- Detailed error messages
- Console logging for debugging
- User-friendly alerts

---

## Displaying Images

In your product display component, use the `image_url`:

```typescript
// Load images for a product
const { data: images } = await supabase
  .from('product_images')
  .select('*')
  .eq('product_id', productId)
  .order('display_order', { ascending: true });

// Display primary image
const primaryImage = images?.find(img => img.is_primary);

// In JSX
<img 
  src={primaryImage?.image_url} 
  alt="Product"
  className="w-full h-auto"
/>
```

---

## Troubleshooting

### Issue: Upload fails with 403 error

**Cause**: Storage policies not configured or bucket not public

**Solution**:
1. Check bucket 'chargers' exists and is PUBLIC
2. Run `STORAGE_AND_IMAGE_SETUP.sql`
3. Verify policies in Supabase dashboard

### Issue: Images upload but don't display

**Cause**: URL wrong or database record not saved

**Solution**:
1. Check `product_images` table has the record
2. Verify `image_url` field contains valid URL
3. Test URL directly in browser

### Issue: Can't upload (401/Unauthorized)

**Cause**: User not authenticated

**Solution**:
1. Ensure user is signed in
2. Check auth session is valid
3. Check token expiration

### Issue: File too large

**Cause**: Supabase storage has size limits

**Solution**:
1. Compress images before upload
2. Or use client-side image compression

---

## Best Practices

### File Naming
```typescript
// ✅ Good: Unique and organized
const fileName = `${productId}/${timestamp}-${index}.${ext}`;

// ❌ Bad: Prone to conflicts
const fileName = `image.jpg`;
```

### Bucket Organization
```typescript
// ✅ Good: Organized by product
chargers/product-id-1/image.jpg
chargers/product-id-2/image.jpg

// ❌ Bad: All mixed together
chargers/image1.jpg
chargers/image2.jpg
```

### Error Handling
```typescript
// ✅ Good: Catch and log specific errors
try {
  await uploadImages(productId);
} catch (error) {
  console.error('Image upload failed:', error);
  alert(`Upload failed: ${error.message}`);
}

// ❌ Bad: Generic error
try {
  await uploadImages(productId);
} catch (error) {
  console.error('Error');
  alert('Error');
}
```

### Public Access
```typescript
// ✅ Good: Use public URLs for display
const { data } = supabase.storage
  .from('chargers')
  .getPublicUrl(fileName);
// URL is public and doesn't need auth

// ❌ Bad: Using signed URLs for public images
const { data } = supabase.storage
  .from('chargers')
  .createSignedUrl(fileName, 3600);
// URL expires - not good for permanent storage
```

---

## Configuration Checklist

Before uploading images:

- [ ] 'chargers' bucket created
- [ ] Bucket set to PUBLIC
- [ ] Storage RLS policies created
- [ ] product_images table RLS enabled
- [ ] product_images table has INSERT policy
- [ ] Inventory.tsx updated with new uploadImages()
- [ ] User is authenticated before upload
- [ ] Browser console shows no errors

After uploading:

- [ ] Image appears in storage bucket
- [ ] Record appears in product_images table
- [ ] image_url field contains valid URL
- [ ] URL works in browser (no 404)
- [ ] Image displays in app

---

## SQL Files

### Main Setup File

**File**: `STORAGE_AND_IMAGE_SETUP.sql`

Run in Supabase SQL Editor to:
1. Create RLS policies for product_images
2. Create RLS policies for storage.objects
3. Verify configuration

Steps:
1. Copy entire file content
2. Go to: https://app.supabase.com/project/pzzngzaljrfrbteclexi/sql/new
3. Paste SQL
4. Click RUN
5. Check Results section

---

## Complete Flow Example

### User adds charger with 2 images:

```
1. User in Inventory page
   ↓
2. Clicks "Add Charger" button
   ↓
3. Fills form:
   - Name: "USB-C Charger 65W"
   - Voltage: 5
   - Selects 2 images: photo1.jpg, photo2.jpg
   ↓
4. Clicks "Save" button
   ↓
5. handleSaveCharger() executes:
   - Validates form
   - Creates product record → product-uuid-123
   - Calls uploadImages(product-uuid-123)
   ↓
6. uploadImages() loops through 2 images:
   
   Image 1:
   - Upload: chargers/product-uuid-123/1712234567890-0.jpg
   - Get URL: https://...storage/chargers/product-uuid-123/1712234567890-0.jpg
   - Save to product_images: {
       product_id: product-uuid-123,
       image_url: https://...storage/chargers/product-uuid-123/1712234567890-0.jpg,
       file_path: chargers/product-uuid-123/1712234567890-0.jpg,
       display_order: 0,
       is_primary: true
     }
   
   Image 2:
   - Upload: chargers/product-uuid-123/1712234567891-1.jpg
   - Get URL: https://...storage/chargers/product-uuid-123/1712234567891-1.jpg
   - Save to product_images: {
       product_id: product-uuid-123,
       image_url: https://...storage/chargers/product-uuid-123/1712234567891-1.jpg,
       file_path: chargers/product-uuid-123/1712234567891-1.jpg,
       display_order: 1,
       is_primary: false
     }
   ↓
7. Success!
   - "Charger added successfully!" message
   - Modal closes
   - List refreshes with new charger
   - Both images display in charger card
```

---

## Summary

Your image upload system:

✅ Files stored in Supabase Storage  
✅ Public URLs generated  
✅ URLs saved to database  
✅ Proper RLS policies  
✅ Error handling and logging  
✅ Display ready  

**Ready to upload images!** 🎉
