# 🎨 Contacts Interface - Visual Guide

## Interface Structure

### 📍 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER SECTION (Dark gradient with globe icon)             │
│  "Gestion des Contacts" / "إدارة جهات الاتصال"           │
│  Description line explaining what to do                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 SOCIAL MEDIA URLs SECTION (Blue theme)                 │
│  ┌──────────────────┬──────────────────┐                   │
│  │ Facebook Link    │ Instagram Link   │                   │
│  │ (Blue icon)      │ (Pink icon)      │                   │
│  │ URL input        │ URL input        │                   │
│  ├──────────────────┼──────────────────┤                   │
│  │ TikTok Link      │ Maps Link        │                   │
│  │ (Dark icon)      │ (Red icon)       │                   │
│  │ URL input        │ URL input        │                   │
│  └──────────────────┴──────────────────┘                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ☎️ CONTACT NUMBERS SECTION (Green theme)                  │
│  ┌──────────────────┬──────────────────┐                   │
│  │ Phone Number     │ WhatsApp Number  │                   │
│  │ (Green icon)     │ (Green icon)     │                   │
│  │ Tel input        │ Tel input        │                   │
│  ├──────────────────┼──────────────────┤                   │
│  │ Telegram         │ Address/Location │                   │
│  │ (Blue icon)      │ (Purple icon)    │                   │
│  │ Text input       │ Text input       │                   │
│  └──────────────────┴──────────────────┘                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [✅ Save Button] (Full width, gradient emerald to cyan)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ℹ️ Info Box: Helpful tip about entering correct data       │
└─────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Social Media Section (Blue Gradient)
- **Header**: Blue (600-700) to Cyan (600-700)
- **Background**: Blue/Cyan with 30-40% opacity
- **Border**: Blue/Cyan with 50% opacity
- **Card Backgrounds**: White/Slate-800 (dark mode)

### Social Media Platforms
| Platform | Icon Color | Label Background | Input Border |
|----------|-----------|------------------|--------------|
| Facebook | Blue-600 | Blue-50 | Blue-300/50 |
| Instagram | Pink-600 | Pink-50 | Pink-300/50 |
| TikTok | Slate-600 | Slate-50 | Slate-300/50 |
| Maps | Red-600 | Red-50 | Red-300/50 |

### Contact Numbers Section (Green Gradient)
- **Header**: Green (600-700) to Teal (600-700)
- **Background**: Green/Teal with 30-40% opacity
- **Border**: Green/Teal with 50% opacity
- **Card Backgrounds**: White/Slate-800 (dark mode)

### Contact Platforms
| Contact Type | Icon Color | Label Background | Input Border |
|-------------|-----------|------------------|--------------|
| Phone | Green-600 | Green-50 | Green-300/50 |
| WhatsApp | Green-600 | Green-50 | Green-300/50 |
| Telegram | Blue-600 | Blue-50 | Blue-300/50 |
| Address | Purple-600 | Purple-50 | Purple-300/50 |

## Animation Timing

### Entrance Animations
- **Header**: Fade + Y-20 translation (delay: 0.1s)
- **Social Section**: Fade + Y-20 translation (delay: 0.2s)
  - Facebook: X-left (delay: 0.25s)
  - Instagram: X-right (delay: 0.3s)
  - TikTok: X-left (delay: 0.35s)
  - Maps: X-right (delay: 0.4s)
- **Contact Section**: Fade + Y-20 translation (delay: 0.45s)
  - Phone: X-left (delay: 0.5s)
  - WhatsApp: X-right (delay: 0.55s)
  - Telegram: X-left (delay: 0.6s)
  - Address: X-right (delay: 0.65s)
- **Save Button**: Fade + Y-20 translation (delay: 0.7s)
- **Info Box**: Fade + Y-20 translation (delay: 0.75s)

### Hover Effects (Cards)
- Border color brightens
- Box shadow increases
- Scale stays at 1 (no scale transformation)
- Transition duration: 300ms

### Button Effects
- **Hover**: Scale 1.02, Shadow increases
- **Tap**: Scale 0.98
- Transition: Smooth

## Responsive Behavior

### Mobile (< 768px)
- Single column layout for cards
- Full-width inputs
- Reduced padding

### Tablet (768px - 1024px)
- Two-column grid (2 cards per row)
- Standard padding
- Medium input sizes

### Desktop (> 1024px)
- Two-column grid (2 cards per row)
- Full padding and spacing
- Large input sizes

## Typography

### Headers
- Font Size: 2xl (1.875rem) for section headers
- Font Size: 4xl (2.25rem) with gradient text for main title
- Font Weight: Bold (700-900)
- Color: Gradient to text or white

### Labels
- Font Size: Small (0.875rem) for helper text
- Font Weight: Bold (700)
- Color: Icon color + theme color

### Inputs
- Height: 48px (h-12)
- Border Radius: 12px (rounded-xl)
- Font Size: Base (1rem)

## Dark Mode Support

### Color Adjustments
- Backgrounds: Dark variants (slate-800, slate-900, black)
- Text: Light colors (slate-100, slate-300, slate-400)
- Borders: Dark variants with reduced opacity
- Labels: Dark theme variants

### Dark Mode Examples
- Input: `dark:bg-slate-700 dark:text-slate-100`
- Border: `dark:border-blue-700/50`
- Label: `dark:text-blue-300`
- Background: `dark:from-blue-900/40`

## Input Field Details

### Social Media URLs
- **Type**: URL
- **Placeholder**: `https://facebook.com/...`
- **Validation**: URL format (handled by type="url")

### Phone Numbers
- **Type**: tel
- **Placeholder**: `+213 5XX XX XX XX`
- **Validation**: Numeric format (tel type)

### Telegram
- **Type**: text
- **Placeholder**: `@yourusername or +213...`
- **Validation**: Text (can be username or number)

### Address
- **Type**: text
- **Placeholder**: `Entrez l'adresse complète` / `أدخل العنوان الكامل`
- **Validation**: Text

## Bilingual Text Examples

### French Version
- Header: "Gestion des Contacts"
- Social Section: "Liens Réseaux Sociaux"
- Contact Section: "Numéros de Contact"
- Button: "Sauvegarder tous les contacts"

### Arabic Version
- Header: "إدارة جهات الاتصال"
- Social Section: "روابط وسائل التواصل الاجتماعي"
- Contact Section: "أرقام الاتصال"
- Button: "حفظ جميع معلومات الاتصال"

## Accessibility Features

### For Screen Readers
- All inputs have associated `<Label>` elements
- Icons paired with text labels
- Semantic HTML structure

### For Keyboard Navigation
- All inputs are focusable
- Tab order follows left-to-right, top-to-bottom
- Visual focus indicators (border color change)

### For Color Blind Users
- Color + icons for identification
- Not relying on color alone
- Text labels for all elements

## Performance Optimizations

### Animation Performance
- Uses CSS transitions for smooth performance
- Staggered animations prevent layout thrashing
- GPU-accelerated transforms (scale, opacity)

### Responsive Images
- Icons are SVG (Lucide React)
- No image loading delays
- Instant rendering

---

## Integration with Website Settings

### Data Flow
```
User Input → setSettings() → handleSaveSettings() → Supabase Update
    ↓
website_settings table
    ↓
Displayed on public website
```

### Fields Mapped
- `facebook_url` ← Facebook input
- `instagram_url` ← Instagram input
- `tiktok_url` ← TikTok input
- `location` ← Maps & Address input
- `phone_number` ← Phone input
- `whatsapp_number` ← WhatsApp input
- `telegram_number` ← Telegram input
