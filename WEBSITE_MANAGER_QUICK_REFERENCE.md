# 🚀 Website Manager - Quick Reference Guide

## Access & Navigation

| Location | Action |
|----------|--------|
| **URL** | `http://yourapp.com/website` |
| **Sidebar** | Tools section → 🌐 Gestion du Site |
| **Role Required** | Admin only |

---

## Tab Overview

### 🎁 **Offers** - Manage regular product offers
```
Create → Search Product → Set Price → Save
Manage → Edit / Hide / Copy Link / Delete
```

### ⭐ **Special Offers** - Manage promotional offers
```
Create → Search Product → Set Price → Auto Discount Calc → Save
Manage → Edit / Hide / Copy Link / Delete
```

### 📞 **Contacts** - Manage contact information
```
Facebook    → https://facebook.com/yourpage
Instagram   → https://instagram.com/yourpage
TikTok      → https://tiktok.com/@yourpage
Snapchat    → snapchat.com/yourpage
Phone       → +213 XXX XXX XXX
WhatsApp    → +213 XXX XXX XXX
Telegram    → @username
Location    → Full address
```

### ⚙️ **Settings** - Manage website configuration
```
Logo        → Upload image (auto-preview)
Store Name  → Business name
Slogan      → Tagline/motto
Description → Full website description
```

---

## Common Tasks

### Creating an Offer

**Steps**:
1. Click "Create New Offer" button
2. Search for product name/mark
3. Click product card to select
4. Enter offer price (lower than original)
5. Add description (optional)
6. Click "Create Offer"

**Result**: Offer appears in grid with discount badge

---

### Making an Offer Invisible

**Steps**:
1. Find offer in grid
2. Click Eye icon button
3. Icon changes to EyeOff
4. Offer hidden from website

**Note**: Offer still exists, just not visible on website

---

### Sharing an Offer Link

**Steps**:
1. Find offer in grid
2. Click Copy icon button
3. Toast message confirms copy
4. Share link with customers

**Link Format**: `https://yoursite.com?offer=OFFER_ID`

---

### Deleting an Offer

**Steps**:
1. Find offer in grid
2. Click Trash icon button
3. Confirmation dialog appears
4. Click "Delete" to confirm
5. Offer removed from database

**Warning**: This cannot be undone!

---

### Updating Contact Information

**Steps**:
1. Go to 📞 Contacts tab
2. Fill in any fields you want
3. Leave blank fields empty (optional)
4. Click "Save" button
5. Success message appears
6. Data saved to database

---

### Uploading Logo

**Steps**:
1. Go to ⚙️ Settings tab
2. Click upload area or drag image
3. Preview appears on right
4. Adjust if needed
5. Click "Save Settings"
6. Logo uploaded to Supabase

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between fields |
| `Enter` | Click focused button |
| `Escape` | Close dialog |
| `Ctrl+S` | Save (may work in some browsers) |

---

## Language Selection

| Language | Code | Menu Location |
|----------|------|---------------|
| English 🇬🇧 | `en` | Top right corner |
| French 🇫🇷 | `fr` | Top right corner |
| Arabic 🇸🇦 | `ar` | Top right corner (RTL) |

---

## Price Information

### Offer Price Calculation
```
Original Price:  5000 DZD
Offer Price:     3500 DZD
Discount:        1500 DZD (30%)

Formula: discount = original - offer
Percentage: (discount / original) * 100
```

### Special Offer Auto-Calculation
```
Original Price:  5000 DZD
Special Price:   3500 DZD
Discount Amount: 1500 DZD (auto-calculated)
Discount %:      30% (auto-calculated)

Live update as you type price!
```

---

## Button Guide

| Button | Icon | Action | Location |
|--------|------|--------|----------|
| Create | ➕ | Create new offer/special | Header |
| Details | 📋 | View full details | Card |
| Show/Hide | 👁️/🚫 | Toggle visibility | Card |
| Copy Link | 📋 | Copy share URL | Card |
| Delete | 🗑️ | Remove offer | Card |
| Save | ✅ | Save settings | Bottom |

---

## Color Meanings

| Color | Meaning | Usage |
|-------|---------|-------|
| 🔵 Blue | Primary action | Offers, navigation |
| 🟣 Purple | Secondary action | Special offers, settings |
| 🟢 Green | Success/Save | Save buttons |
| 🔴 Red | Delete/Danger | Delete buttons |
| ⚪ Gray | Disabled/Hidden | Hidden offers |

---

## Message Types

### Success (Green) ✅
```
"✅ Succès - Offre créée avec succès"
"✅ تم - تم إنشاء العرض بنجاح"
"✅ Success - Offer created successfully"
```

### Error (Red) ❌
```
"❌ Erreur - Impossible de charger les données"
"❌ خطأ - فشل في تحميل البيانات"
"❌ Error - Failed to load data"
```

### Info (Blue) ℹ️
```
"📋 Copié - Lien copié"
"📋 تم النسخ - تم نسخ الرابط"
"📋 Copied - Link copied"
```

---

## Search Tips

### Product Search
- Search by **Product Name**: "USB Charger"
- Search by **Brand/Mark**: "Samsung"
- Search by **Description**: "65W"
- **Partial matches** work: "usb" finds "USB-C"
- Case-insensitive: "samsung" = "Samsung"

### No Results?
- Product doesn't exist in inventory
- Try different search term
- Check spelling
- Search in Inventory first to add product

---

## Troubleshooting

### Offer not appearing after create?
```
✓ Refresh page (F5)
✓ Check network in DevTools
✓ Verify product was selected
✓ Check browser console for errors
```

### Image not loading?
```
✓ Verify image format (PNG, JPG, WebP)
✓ Check file size (<5MB recommended)
✓ Clear browser cache
✓ Try different browser
```

### Save not working?
```
✓ Check internet connection
✓ Verify you're logged in
✓ Check Supabase status
✓ Clear browser cookies
```

### Language not changing?
```
✓ Check top right corner language selector
✓ Refresh page after change
✓ Clear localStorage
✓ Try different browser
```

---

## Data Storage

| Data | Storage Location | Backup | Retention |
|------|-----------------|--------|-----------|
| Offers | Supabase DB | Daily | Permanent |
| Special Offers | Supabase DB | Daily | Permanent |
| Contact Info | Supabase DB | Daily | Permanent |
| Website Settings | Supabase DB | Daily | Permanent |
| Logo Image | Supabase Storage | Daily | Permanent |

---

## Performance Tips

- 🚀 Use exact product names for faster search
- 📸 Optimize images before upload (<1MB)
- 🔄 Don't refresh too quickly (wait for save)
- 📱 Use on desktop for best experience
- 🌐 Good internet connection recommended

---

## Best Practices

### Offers
- ✅ Offer price 10-50% lower than original
- ✅ Add descriptive text (limited time, etc)
- ✅ Use clear product images
- ✅ Set realistic end dates
- ❌ Don't hide all offers
- ❌ Don't change price too frequently

### Special Offers
- ✅ Reserve for premium/VIP discounts
- ✅ Use for clearance items
- ✅ Add promotion details
- ✅ Monitor performance
- ❌ Don't over-discount
- ❌ Don't create duplicate offers

### Contact Info
- ✅ Keep info up-to-date
- ✅ Use correct phone formats
- ✅ Verify social links work
- ✅ Update location if moving
- ❌ Don't share personal numbers
- ❌ Don't use inactive social accounts

### Website Settings
- ✅ Use professional logo
- ✅ Keep store name consistent
- ✅ Write engaging description
- ✅ Use clear slogan
- ❌ Don't upload blurry images
- ❌ Don't use promotional language in description

---

## Keyboard Shortcuts (Advanced)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Command palette |
| `Cmd/Ctrl + L` | Focus search |
| `Cmd/Ctrl + S` | Save (if enabled) |
| `Escape` | Close dialogs |
| `Tab + Enter` | Navigate & confirm |

---

## API Endpoints (For Reference)

```
POST   /offers              - Create offer
GET    /offers              - List all offers
GET    /offers/visible      - List website offers
PATCH  /offers/:id          - Update offer
DELETE /offers/:id          - Delete offer

POST   /special-offers      - Create special offer
GET    /special-offers      - List all specials
GET    /special-offers/visible - List website specials
PATCH  /special-offers/:id  - Update special
DELETE /special-offers/:id  - Delete special

GET    /website/settings    - Get settings
PATCH  /website/settings    - Update settings
```

---

## File Size Limits

| File Type | Max Size | Recommended |
|-----------|----------|-------------|
| Logo Image | 10 MB | 500 KB |
| Product Image | 5 MB | 1 MB |
| Description Text | 5000 chars | 1000 chars |
| Offer Description | 500 chars | 200 chars |

---

## Support & Help

**For Technical Issues**:
1. Check browser console (F12)
2. Verify Supabase connection
3. Try clearing cache
4. Restart browser

**For Features**:
1. Check documentation
2. Review use-cases
3. Test in demo mode

**For Bugs**:
1. Note exact steps to reproduce
2. Take screenshot
3. Check error messages
4. Report with browser version

---

**Last Updated**: January 2024  
**Quick Reference Version**: 1.0
