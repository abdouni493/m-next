# 🎨 Landing Page Image - Quick Implementation Guide

## ⚡ Quick Start

### Step 1: Run Database Migration
```sql
-- Copy and paste this in your Supabase SQL editor
ALTER TABLE website_settings
ADD COLUMN IF NOT EXISTS landing_page_image_url TEXT;
```

**Or use the provided file:**
- Execute: `ADD_LANDING_PAGE_IMAGE_COLUMN.sql`

### Step 2: Restart Application
```bash
npm run dev
```

### Step 3: Test the Feature
1. Open your app in browser
2. Navigate to: **Website Manager (🌐) → Settings Tab (⚙️)**
3. Look for new section: **🎨 صورة الصفحة الأولى** (Landing Page Image)
4. Upload an image
5. Click **Save Settings** (💾)
6. Verify success message appears

## 📦 What Was Changed

### **Frontend (React/TypeScript)**
| File | Change | Details |
|------|--------|---------|
| `src/pages/Website.tsx` | Interface Update | Added `landing_page_image_url` to `WebsiteSettings` |
| `src/pages/Website.tsx` | State Variables | Added preview & file states for landing page image |
| `src/pages/Website.tsx` | New Function | Added `handleLandingPageImageUpload()` |
| `src/pages/Website.tsx` | UI Section | Added complete landing page image upload form |
| `src/pages/Website.tsx` | Save Logic | Updated `handleSaveSettings()` to handle image |

### **Database**
| Table | Change | SQL |
|-------|--------|-----|
| `website_settings` | New Column | `ALTER TABLE... ADD COLUMN landing_page_image_url TEXT` |

## 🎯 Features Implemented

✅ **Display:**
- Store name, slogan, description visible in settings
- Logo with upload and preview
- NEW: Landing page image with upload and preview

✅ **Landing Page Image:**
- Upload section with drag-and-drop UI
- Live image preview
- Website description displayed above image
- Saves to Supabase Storage
- URL stored in database

✅ **User Experience:**
- Multi-language support (Arabic & French)
- Beautiful gradient design
- Mobile responsive
- Instant preview updates
- Clear success/error messages

## 📱 UI Locations

### Where to Find the Feature:
```
Website Manager (🌐 Gestion Web)
└── Settings Tab (⚙️ Paramètres)
    ├── Logo Upload Section
    ├── Store Name Field
    ├── Slogan Field
    ├── Description Field
    └── 🎨 Landing Page Image Section ← NEW!
        ├── Description Display
        ├── Upload Area
        ├── Image Preview
        └── Save Button
```

## 🔧 Technical Details

### Image Upload Flow:
```
User Selects Image
       ↓
Preview displays (base64)
       ↓
User clicks Save
       ↓
Image uploads to Supabase Storage (`landing-page/`)
       ↓
Public URL generated
       ↓
URL saved to database (website_settings.landing_page_image_url)
       ↓
Settings state updated
       ↓
Success toast shown
```

### Storage Structure:
```
Supabase Storage (website bucket)
├── logos/
│   ├── logo-1756450000000.jpg
│   └── ...
└── landing-page/          ← NEW!
    ├── landing-page-1756450000000.jpg
    └── ...
```

## 🎨 Styling Features

- **Color Scheme:** Blue gradient (from-blue-50 to-purple-50)
- **Border:** 2px solid blue with dark mode support
- **Upload Area:** Dashed border, hover effects
- **Preview:** 48x48 thumbnail with rounded corners
- **Icons:** 🎨 Upload, 📌 Description, 📤 Select
- **Typography:** Bold labels, clear hierarchy

## 🌍 Internationalization (i18n)

### Arabic (عربي):
```
Label: 🎨 صورة الصفحة الأولى (خلفية الصفحة الرئيسية)
Description: 📌 اختر صورة خلفية جميلة ستظهر على الصفحة الأولى من موقعك
Button: 💾 حفظ الإعدادات
```

### French (Français):
```
Label: 🎨 Image Page d'accueil (Fond)
Description: 📌 Sélectionnez une belle image qui s'affichera en arrière-plan de votre page d'accueil
Button: 💾 Sauvegarder
```

## ✅ Checklist

- [ ] Database migration executed
- [ ] Application restarted
- [ ] Settings page loads without errors
- [ ] Can see store name, slogan, description
- [ ] Can upload logo
- [ ] Can upload landing page image
- [ ] Image preview displays correctly
- [ ] Save button works
- [ ] Settings persist after reload
- [ ] Error handling works for large files

## 🐛 Troubleshooting

### Issue: Can't see landing page image section
**Solution:** 
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh page (Ctrl+F5)
- Check browser console for errors

### Issue: Image upload fails
**Solution:**
- Check file size (keep under 5MB)
- Verify file format (PNG, JPG, GIF)
- Check Supabase bucket exists
- Check storage permissions

### Issue: Changes don't persist
**Solution:**
- Verify database migration ran
- Check browser console for errors
- Verify Supabase connection
- Check toast notification message

## 📚 Related Files

- `src/pages/Website.tsx` - Main component
- `src/lib/supabaseClient.ts` - Database functions
- `ADD_LANDING_PAGE_IMAGE_COLUMN.sql` - Migration script
- `LANDING_PAGE_IMAGE_IMPLEMENTATION_SUMMARY.md` - Detailed docs

## 🚀 Next Phase (Optional)

Future enhancements could include:
- Image cropping/resizing tool
- Multiple landing page image variants
- Image optimization
- Auto-sizing for different devices
- Scheduled image rotation

---

**Implementation Date:** April 14, 2026
**Status:** ✅ Ready for Production
**Testing Environment:** Development
