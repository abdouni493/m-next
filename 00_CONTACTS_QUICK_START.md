# 🚀 Contacts Interface - Quick Reference

## What Was Done

✅ **Completely redesigned the Contacts management interface** in the Website management dashboard

## New Features

### 🔗 Social Media URLs Section
- **Facebook** - Link to your Facebook page
- **Instagram** - Link to your Instagram profile
- **TikTok** - Link to your TikTok account
- **Google Maps** - Link to your business location on Maps

### ☎️ Contact Numbers Section
- **Phone Number** - Your main business phone
- **WhatsApp** - WhatsApp business number
- **Telegram** - Telegram username or number
- **Address** - Complete physical or Maps address

## Design Highlights

### 🎨 Modern Design
- Gradient headers with themed colors
- Clean card-based layout
- Smooth animations and transitions
- Dark mode support
- Fully responsive (mobile, tablet, desktop)

### 🎯 User-Friendly
- Color-coded sections (Blue for social, Green for contacts)
- Icons for quick identification
- Clear labels and helpful placeholders
- Bilingual support (French & Arabic)
- Single save button for all changes

### 📱 Responsive Layout
- **Mobile**: Single column (stacked cards)
- **Tablet**: Two columns (balanced view)
- **Desktop**: Two columns (full view)

## Database Connection

All fields save directly to your `website_settings` table:
```
facebook_url → Facebook Link
instagram_url → Instagram Link
tiktok_url → TikTok Link
location → Google Maps / Address
phone_number → Phone Number
whatsapp_number → WhatsApp Number
telegram_number → Telegram
```

## How It Looks

### Desktop View
```
┌─ HEADER ─────────────────────────────────────┐
│ 📞 Gestion des Contacts                      │
└──────────────────────────────────────────────┘

┌─ SOCIAL MEDIA URLS ──────────────────────────┐
│ Facebook    │ Instagram                       │
├─────────────┼─────────────────────────────────┤
│ TikTok      │ Maps                            │
└──────────────────────────────────────────────┘

┌─ CONTACT NUMBERS ────────────────────────────┐
│ Phone       │ WhatsApp                        │
├─────────────┼─────────────────────────────────┤
│ Telegram    │ Address                         │
└──────────────────────────────────────────────┘

┌─ SAVE BUTTON ────────────────────────────────┐
│ ✅ Sauvegarder tous les contacts             │
└──────────────────────────────────────────────┘
```

### Mobile View (Single Column)
```
┌─ HEADER ─────────────┐
│ 📞 Contacts          │
└──────────────────────┘

┌─ SOCIAL MEDIA URLS ──┐
│ Facebook             │
│ Instagram            │
│ TikTok               │
│ Maps                 │
└──────────────────────┘

┌─ CONTACT NUMBERS ────┐
│ Phone                │
│ WhatsApp             │
│ Telegram             │
│ Address              │
└──────────────────────┘

┌─ SAVE BUTTON ────────┐
│ ✅ Save              │
└──────────────────────┘
```

## Color Scheme

| Section | Primary | Secondary | Icons |
|---------|---------|-----------|-------|
| Social Media | Blue | Cyan | Facebook (Blue), Instagram (Pink), TikTok (Dark), Maps (Red) |
| Contact Numbers | Green | Teal | Phone (Green), WhatsApp (Green), Telegram (Blue), Address (Purple) |
| Buttons | Emerald | Cyan | Check icon |

## Usage Example

### Step 1: Navigate
Go to **Website → Contacts tab**

### Step 2: Fill Social Media
- Facebook: `https://facebook.com/yourpage`
- Instagram: `https://instagram.com/yourprofile`
- TikTok: `https://tiktok.com/@yourprofile`
- Maps: `https://maps.google.com/maps?...`

### Step 3: Fill Contact Numbers
- Phone: `+213 5XX XX XX XX`
- WhatsApp: `+213 5XX XX XX XX`
- Telegram: `@yourusername` or `+213 5XX XX XX XX`
- Address: `Street address, City, Country`

### Step 4: Save
Click **✅ Sauvegarder tous les contacts**

## Features

### ✨ Visual Enhancements
- Icon badges for each platform
- Color-coded sections for easy navigation
- Smooth entrance animations
- Hover effects on interactive elements
- Professional gradient backgrounds

### 📝 Input Validation
- URL validation for social media links
- Tel type for phone numbers
- Text type for addresses and usernames
- Helpful placeholders with examples

### 🌍 Localization
- Complete bilingual support (French & Arabic)
- RTL (Right-to-Left) layout support for Arabic
- All labels and placeholders translated

### 🔄 Real-time Updates
- All changes save to database
- Immediate availability on website
- No need to refresh

## Tips for Best Results

1. **Use full URLs** for social media links (including https://)
2. **Include country code** for phone numbers (+213 for Algeria)
3. **Verify links** work before saving
4. **Keep addresses updated** when location changes
5. **Test on mobile** to ensure all links work properly
6. **Use @username** format for Telegram if preferred over number

## Browser Compatibility

✅ Chrome (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Edge (latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Dark Mode

The interface automatically adapts to your system's dark mode preference:
- Dark backgrounds for reduced eye strain
- Light text for readability
- Adjusted colors for visibility
- Same functionality in both modes

## File Location

**Main Component**: `src/pages/Website.tsx`
- Contacts tab section starts at line ~1197
- Uses Framer Motion for animations
- Integrated with useLanguage hook for translations

## Troubleshooting

### Issue: Links don't appear on website
- **Solution**: Make sure you clicked the Save button
- Check that URLs start with `https://`

### Issue: Numbers not showing correctly
- **Solution**: Use format: `+country code number`
- Example: `+213 5XX XX XX XX`

### Issue: Address not displaying
- **Solution**: You can use either:
  - Plain address text
  - Google Maps link (maps.google.com/...)

## Support

For questions or issues:
1. Check that all required fields are filled
2. Verify URLs are in correct format
3. Ensure phone numbers include country code
4. Clear browser cache if changes don't appear immediately

---

**Status**: ✅ Implementation Complete
**Version**: 1.0
**Last Updated**: April 2026
