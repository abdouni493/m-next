# 🔄 DATA FLOW REFERENCE - Landing Page Image System

## 1️⃣ INITIALIZATION FLOW

```
App Start
    ↓
WebsiteLanding Component Mounts
    ↓
useWebsiteSettings() Hook Called
    ├─ Creates loading=true state
    ├─ Creates imageUrl=null state
    └─ Creates error=null state
    ↓
fetchSettings() Function Runs
    ├─ Call: supabase.from('website_settings')
    │         .select('...landing_page_image_url...')
    │         .eq('id', '00000000-0000-0000-0000-000000000001')
    │         .single()
    ├─ Success: setSettings(data)
    │           imageUrl = data.landing_page_image_url
    │           loading = false
    └─ Error: setError(message)
             loading = false
    ↓
Component Re-Renders
    ├─ If imageUrl exists:
    │  └─ style={{ backgroundImage: `url('${imageUrl}')` }}
    └─ If imageUrl is null:
       └─ style with gradient fallback
```

---

## 2️⃣ UPLOAD FLOW

```
User Clicks "Upload Hero Image"
    ↓
Modal Opens (showUploadUI = true)
    ↓
User Selects File
    ↓
handleFileChange() Triggered
    ├─ Get file from input
    └─ Call uploadLandingImage(file)
    ↓
uploadLandingImage() Function
    ├─ Validate file type (must be image/*) ✓
    ├─ Validate file size (max 5MB) ✓
    ├─ Generate unique filename
    │  └─ landing_bg_1234567890_myimage.jpg
    ├─ Upload to Supabase Storage
    │  └─ supabase.storage
    │      .from('chargers')
    │      .upload(fileName, file)
    ├─ Get public URL
    │  └─ supabase.storage
    │      .from('chargers')
    │      .getPublicUrl(path)
    ├─ Save to database
    │  └─ supabase.from('website_settings')
    │      .upsert({
    │        id: '00000000-0000-0000-0000-000000000001',
    │        landing_page_image_url: publicUrl
    │      })
    └─ Return { success: true, publicUrl, error: null }
    ↓
Back in handleFileChange()
    ├─ If result.success:
    │  ├─ Call refetch()
    │  │  └─ Re-fetch settings from DB
    │  │      imageUrl updates with new image
    │  ├─ Modal closes (showUploadUI = false)
    │  └─ File input resets
    └─ If result.error:
       └─ Display error message
    ↓
Component Re-Renders
    └─ Background image updated immediately
       (No page refresh needed)
```

---

## 3️⃣ DELETE FLOW

```
User Clicks "Delete Current Image"
    ↓
handleDeleteImage() Triggered
    ├─ Check if imageUrl exists
    └─ Call deleteLandingImage(imageUrl)
    ↓
deleteLandingImage() Function
    ├─ Extract filename from URL
    │  └─ Regex: /[^/]+$/ on URL
    ├─ Delete from Supabase Storage
    │  └─ supabase.storage
    │      .from('chargers')
    │      .remove([fileName])
    ├─ Clear URL from database
    │  └─ supabase.from('website_settings')
    │      .update({ landing_page_image_url: null })
    │      .eq('id', '00000000-0000-0000-0000-000000000001')
    └─ Return { success: true, publicUrl: null, error: null }
    ↓
Component Re-Renders
    └─ Background reverts to gradient
       (Image removed from Storage and DB)
```

---

## 4️⃣ STATE MANAGEMENT

### useWebsiteSettings Hook State:
```tsx
const [settings, setSettings] = useState<WebsiteSettings | null>(null);
// Full settings object: { id, store_name, slogan, description, logo_url, landing_page_image_url, ... }

const [loading, setLoading] = useState(true);
// true while fetching from DB, false when done

const [error, setError] = useState<string | null>(null);
// null if success, error message if failed

// Derived value:
const imageUrl = settings?.landing_page_image_url || null;
// Extracted from settings for convenience
```

### WebsiteLanding Component State:
```tsx
const [showUploadUI, setShowUploadUI] = useState(false);
// true when modal is open

const [uploading, setUploading] = useState(false);
// true during upload, false when done

const [uploadError, setUploadError] = useState<string | null>(null);
// null if success, error message if upload fails

const [deleting, setDeleting] = useState(false);
// true during deletion, false when done

const fileInputRef = useRef<HTMLInputElement>(null);
// Reference to hidden file input for programmatic trigger
```

---

## 5️⃣ CONDITIONAL RENDERING

### Background Style Logic:
```tsx
const backgroundStyle = imageUrl
  ? {
      backgroundImage: `url('${imageUrl}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }
  : {};
  // If imageUrl exists: use image
  // If null: use gradient fallback (in CSS)
```

### Upload Button Visibility:
```tsx
{process.env.NODE_ENV === 'development' && (
  <button onClick={() => setShowUploadUI(!showUploadUI)}>
    📸 Uploader
  </button>
)}
// Only visible in development mode
// Hidden in production
```

### Modal Display:
```tsx
{showUploadUI && (
  <motion.div className="upload-modal">
    {/* Modal content only renders if true */}
  </motion.div>
)}
// Modal only shows when user clicks upload button
```

### Loading State:
```tsx
{loading && (
  <div className="loading-spinner">
    <Loader className="animate-spin" />
  </div>
)}
// Shows while fetching settings
```

### Error Message:
```tsx
{uploadError && (
  <div className="error-message">
    {uploadError}
  </div>
)}
// Shows only if upload fails
```

---

## 6️⃣ ANIMATION STATES

### Hero Title Animation:
```tsx
initial={{ opacity: 0, y: -30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 1 }}
// Starts: invisible, 30px up
// Ends: visible, in place
// Duration: 1 second
```

### Staggered Content:
```tsx
variants={containerVariants}
initial="hidden"
animate="visible"
// Container: {staggerChildren: 0.2}
// Each child: {duration: 0.8, delay: index * 0.2}
// Children appear one after another
```

### Loading State Animation:
```tsx
<Loader className="animate-spin" />
// Built-in Tailwind spinner
// Rotates indefinitely during async operation
```

### Modal Transition:
```tsx
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.9 }}
// Fade in and scale up when opening
// Fade out and scale down when closing
```

---

## 7️⃣ ERROR HANDLING

### Upload Validation:
```tsx
if (!file) return { success: false, error: 'No file provided' };
if (!file.type.startsWith('image/')) return { success: false, error: 'Invalid file type' };
if (file.size > 5 * 1024 * 1024) return { success: false, error: 'File size exceeds 5MB' };
// Validates before upload attempt
```

### Supabase Error Handling:
```tsx
const { data, error } = await supabase.from('website_settings').select(...).single();
if (error) throw new Error(error.message);
if (!data) throw new Error('No data found');
// Catches and converts errors
```

### Try-Catch Pattern:
```tsx
try {
  const result = await uploadLandingImage(file);
  if (result.success) {
    await refetch();
  } else {
    setUploadError(result.error);
  }
} catch (err) {
  setUploadError(err instanceof Error ? err.message : 'Unknown error');
} finally {
  setUploading(false);
}
// Always clean up uploading state
```

---

## 8️⃣ PERFORMANCE CONSIDERATIONS

### Lazy Loading:
```
- Image loads after page content
- Gradient displays while loading
- No render blocking
```

### Caching:
```
- Supabase CDN caches images
- Browser caches with headers
- Unique filename = new URL on each upload
```

### Optimization:
```
- Filename timestamp prevents cache issues
- 5MB limit prevents huge files
- JPEG format recommended (50-100KB)
- Animations use requestAnimationFrame
```

---

## 9️⃣ TESTING CHECKLIST

✅ **Initialization:**
- [ ] Hook fetches settings on mount
- [ ] imageUrl updates when settings load
- [ ] Gradient shows initially

✅ **Upload:**
- [ ] File picker opens
- [ ] File validation works (type, size)
- [ ] Upload succeeds
- [ ] Database saves URL
- [ ] refetch() gets new image
- [ ] Modal closes
- [ ] No page refresh needed

✅ **Display:**
- [ ] Image shows as background
- [ ] Image covers full section
- [ ] Text readable over image
- [ ] Works on mobile
- [ ] Works on desktop

✅ **Delete:**
- [ ] Delete button works
- [ ] File removed from Storage
- [ ] URL removed from database
- [ ] Gradient shows after delete
- [ ] No errors

✅ **Errors:**
- [ ] Network error handled
- [ ] Invalid file shows error
- [ ] Large file shows error
- [ ] Error cleared on retry

---

## 🔟 ENVIRONMENT VARIABLES

No specific env vars needed beyond standard Supabase:
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[public-key]
```

Check `.env.local` for current values.

---

## 📚 RELATED FILES

| File | Purpose |
|------|---------|
| `LANDING_PAGE_IMAGE_IMPLEMENTATION.md` | Complete guide |
| `LANDING_PAGE_QUICK_START.md` | 5-minute setup |
| `VERIFY_IMAGE_DATABASE.sql` | Debug queries |
| `src/hooks/useWebsiteSettings.ts` | Hook source |
| `src/lib/uploadLandingImage.ts` | Upload helpers |
| `src/pages/WebsiteLanding.tsx` | Main component |

---

**Generated:** April 14, 2026
**Status:** ✅ Production Ready
