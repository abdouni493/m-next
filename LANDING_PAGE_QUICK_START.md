# 🚀 QUICK START - Landing Page Background Image

## ⏱️ 5-MINUTE SETUP

### **Step 1: Verify Database** (1 min)
```sql
-- Run in Supabase SQL Editor
SELECT * FROM website_settings 
WHERE id = '00000000-0000-0000-0000-000000000001';
```
Expected: One row with store_name, slogan, description fields

### **Step 2: Test Development Mode** (2 min)
```bash
# Ensure you're in development mode
npm run dev

# Navigate to landing page
# http://localhost:5173/website
```

**You should see:**
- Upload button: "📸 Uploader" (bottom of hero)
- Gradient background (no image yet)

### **Step 3: Upload Your First Image** (2 min)
1. Click **"📸 Uploader"** button
2. Select an image file (PNG/JPG, max 5MB)
3. Click **"Choisir une image"** (or Arabic equivalent)
4. **✅ Done!** Image displays immediately

---

## 📋 COMPONENTS OVERVIEW

| File | Purpose | Location |
|------|---------|----------|
| `useWebsiteSettings.ts` | Fetch image from DB | `src/hooks/` |
| `uploadLandingImage.ts` | Upload to Supabase | `src/lib/` |
| `WebsiteLanding.tsx` | Hero with image | `src/pages/` |
| `LandingPageHero.tsx` | Standalone hero | `src/pages/` |

---

## 🎯 KEY FEATURES

✅ **Automatic Image Loading**
- No page refresh needed
- Real-time updates

✅ **Fallback Gradient**
- Shows if no image uploaded
- Blue-purple gradient

✅ **Admin Panel**
- Visible in development
- Upload/delete in modal

✅ **Fully Responsive**
- Mobile optimized
- Touch-friendly

✅ **Smooth Animations**
- Framer Motion
- Floating elements
- Button effects

---

## 🔍 HOW TO VERIFY IT WORKS

### **Check Hook:**
```tsx
// In WebsiteLanding.tsx
const { imageUrl, loading, error } = useWebsiteSettings();
console.log('Image URL:', imageUrl);
console.log('Loading:', loading);
console.log('Error:', error);
```

### **Check Database:**
```sql
SELECT landing_page_image_url FROM website_settings 
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### **Check Storage:**
- Supabase Dashboard
- Storage → chargers
- Look for: `landing_bg_[timestamp]_[filename]`

---

## ⚡ PRODUCTION DEPLOYMENT

### **Step 1: Upload Image to Production**
```
1. Go to: http://your-app.com/dashboard/website
2. Settings tab
3. Upload image
4. Save
```

### **Step 2: Verify**
```
1. Visit landing page
2. Image should display
3. Test on mobile
```

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| No upload button | Check NODE_ENV is 'development' |
| Image not showing | Check database URL, verify Supabase access |
| Upload fails | Check file size (max 5MB), type (image only) |
| Slow loading | Optimize image size, use JPEG format |
| 403 error | Check RLS policies on storage |

---

## 📱 TEST SIZES

- **Mobile:** 375px, 667px
- **Tablet:** 768px, 1024px
- **Desktop:** 1440px, 1920px
- **4K:** 2560px+

---

## 🎬 WHAT YOU'LL SEE

### **With Image:**
```
┌─────────────────────────────┐
│  [HERO IMAGE AS BACKGROUND] │
│  ┌─────────────────────────┐│
│  │ Dark Overlay (70%)      ││
│  │ ⚡ M NEXT TECH          ││
│  │ Your Trusted Partner    ││
│  │ [Shop Now] [View Offers]││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### **Without Image (Fallback):**
```
┌─────────────────────────────┐
│  [BLUE-PURPLE GRADIENT]     │
│  ┌─────────────────────────┐│
│  │ ⚡ M NEXT TECH          ││
│  │ Your Trusted Partner    ││
│  │ [Shop Now] [View Offers]││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

---

## 💡 TIPS

1. **Best Image Size:** 1200x600px
2. **File Format:** JPEG (best compression)
3. **File Size:** 50-100KB ideal
4. **Optimal Content:** Chargers, tech products

---

## 📞 NEED HELP?

Check detailed guide:
→ `LANDING_PAGE_IMAGE_IMPLEMENTATION.md`

---

**Status:** ✅ Ready to Deploy
**Last Updated:** April 14, 2026
