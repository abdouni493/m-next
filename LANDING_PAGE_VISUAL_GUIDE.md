# 🎨 VISUAL GUIDE - Landing Page UI/UX

## 📱 MOBILE VIEW (375px)

```
┌────────────────────────────────┐
│ ≡ Header                       │
├────────────────────────────────┤
│                                │ <- Hero Section
│    [BACKGROUND IMAGE]          │    Min height: auto
│    ╔══════════════════════╗   │    (Image scales)
│    ║  Dark Overlay 70%   ║   │
│    ║                     ║   │
│    ║  ⚡ M NEXT TECH    ║   │
│    ║  Your Trusted      ║   │
│    ║  Partner           ║   │
│    ║                     ║   │
│    ║  [Shop Now]        ║   │
│    ║  [View Offers]     ║   │
│    ║                     ║   │
│    ╚══════════════════════╝   │
│                                │
├────────────────────────────────┤
│  Featured Offers               │
│                                │
│  ┌──────────────────────────┐  │
│  │ Card 1                   │  │
│  │ [Image]                  │  │
│  │ Product Name             │  │
│  │ ⭐⭐⭐⭐⭐            │
│  │ -20% DA 150₽ → 120₽    │
│  │ [Add to Cart]            │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Card 2                   │  │
│  │ [Image]                  │  │
│  │ Product Name             │  │
│  │ ⭐⭐⭐⭐⭐            │
│  │ [Add to Cart]            │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

---

## 💻 DESKTOP VIEW (1440px)

```
┌─────────────────────────────────────────────────────────────────────┐
│ M NEXT TECH | Home | Shop | Offers | Contact            [Cart] 🛒  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│              ╔═══════════════════════════════════════╗              │
│              ║      [BACKGROUND IMAGE HERO]        ║              │
│              ║      Dark Overlay 70%                ║              │
│              ║                                       ║              │
│              ║  ⚡ M NEXT TECH                      ║              │
│              ║  Your Trusted Partner                ║              │
│              ║  Premium Charging Solutions          ║              │
│              ║                                       ║              │
│              ║  [Shop Now] [View Offers] [Packs]   ║              │
│              ║  📸 Uploader (dev mode)             ║              │
│              ║                                       ║              │
│              ╚═══════════════════════════════════════╝              │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                        Featured Offers                               │
│                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐ ┌──────────...┐ │
│  │  [Product Image]     │  │  [Product Image]     │ │ [Product...  │ │
│  │  Brand: Samsung      │  │  Brand: Anker        │ │ Brand: iPhone│ │
│  │  Fast Charger 65W    │  │  Quick Charge 18W    │ │ Pro Charger  │ │
│  │  Specs: 65W, USB-C   │  │  Specs: 18W, USB-C   │ │ Specs: ...   │ │
│  │  DA 200₽ → 160₽     │  │  DA 80₽ → 60₽       │ │ DA ...       │ │
│  │  ⭐⭐⭐⭐⭐ (45 reviews)│  │  ⭐⭐⭐⭐⭐ (128)│ │ ⭐⭐⭐⭐⭐ (89) │
│  │  [View] [Add Cart]   │  │  [View] [Add Cart]   │ │ [View] [Add] │
│  └──────────────────────┘  └──────────────────────┘ └──────────...┘ │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                 Special Offers & Testimonials                        │
│                                                                       │
│  [Featured Products Grid]        [Client Testimonials]              │
│  [Brand Filtering]               [Star Ratings]                     │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Footer | About | Contact | Privacy | Terms | Socials              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎬 UPLOAD MODAL (All Sizes)

```
Centered Modal (max-width: 400px)
┌─────────────────────────────────────┐
│ Télécharger l'image          [X]   │
├─────────────────────────────────────┤
│                                     │
│ [Error Message - if any]           │
│ ├─ ⚠️ File size exceeds 5MB       │
│                                     │
│ ╔═════════════════════════════════╗│
│ ║ Click to upload or drag & drop ║│
│ ║          📤                      ║│
│ ║ PNG, JPG, GIF up to 5MB        ║│
│ ╚═════════════════════════════════╝│
│                                     │
│ Current Image (if exists):          │
│ ╔═════════════════════════════════╗│
│ ║    [Image Preview]             ║│
│ ║    (32 x 128 height)           ║│
│ ╚═════════════════════════════════╝│
│                                     │
│ [Delete Current Image] or          │
│ [Choose Image] or                  │
│ [Choose Image - Uploading...]      │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 COLOR SCHEME

### Primary Colors:
```
Blue:    #3B82F6 (500) / #1E40AF (600)
Purple:  #A855F7 (500) / #7E22CE (600)
Pink:    #EC4899 (500) / #BE185D (600)
```

### Text Colors:
```
White:        #FFFFFF
Light Blue:   #60A5FA (200)
Light Gray:   #D1D5DB (300)
Dark Gray:    #374151 (700)
Black:        #000000
```

### Overlay:
```
Black with 70% opacity: rgba(0, 0, 0, 0.7)
Black with 50% opacity: rgba(0, 0, 0, 0.5)
```

---

## 📐 SPACING & LAYOUT

### Container:
```
max-width: 1280px (lg breakpoint)
padding: 1rem (mobile) → 2rem (desktop)
margin: auto (centered)
```

### Hero Section:
```
min-height: 600px (mobile) → 800px (desktop)
padding-y: 48px (12 * 4px) → 80px (20 * 4px)
```

### Cards Grid:
```
grid-cols: 1 (mobile)
grid-cols: 2 (tablet - 768px)
grid-cols: 3 (desktop - 1024px)
gap: 24px (6 * 4px)
```

### Button Spacing:
```
padding: 12px 24px (sm)
padding: 16px 32px (lg)
gap: 16px (between buttons)
```

---

## 🎯 TYPOGRAPHY

### Headings:
```
H1 (Hero Title):
  Font Size: 36px (mobile) → 84px (desktop)
  Font Weight: 700 (bold)
  Line Height: 1.2
  Letter Spacing: -0.02em (tight)

H2 (Section Title):
  Font Size: 32px
  Font Weight: 900 (black)
  Background: Gradient (blue → purple)
```

### Body Text:
```
Large (Slogan):
  Font Size: 20px (sm) → 28px (md)
  Font Weight: 300 (light)
  Color: #60A5FA (light blue)

Medium (Description):
  Font Size: 16px → 18px
  Font Weight: 400 (normal)
  Color: #D1D5DB (light gray)

Small (Labels):
  Font Size: 12px → 14px
  Font Weight: 600 (semibold)
  Color: #374151 (dark gray)
```

---

## 🎬 ANIMATIONS

### 1. Hero Title (1000ms):
```
Input:  opacity: 0, y: -30px
Output: opacity: 1, y: 0px
Curve:  easeOut
```

### 2. Slogan Slide-Up (800ms, delay: 200ms):
```
Input:  opacity: 0, y: +20px
Output: opacity: 1, y: 0px
Curve:  easeOut
```

### 3. Buttons Fade-In (800ms, delay: 400ms):
```
Input:  opacity: 0, scale: 0.8
Output: opacity: 1, scale: 1
Curve:  easeOut
```

### 4. Button Hover:
```
scale: 1 → 1.05
box-shadow: none → 0 15px 35px rgba(168, 85, 247, 0.4)
Duration: 200ms
```

### 5. Button Tap:
```
scale: 1 → 0.95
Duration: 100ms
```

### 6. Floating Elements (6000ms, infinite):
```
Element 1: y: 0 → -20 → 0
Element 2: y: 0 → +20 → 0 (delay: 1000ms)
```

### 7. Modal Open:
```
Input:  opacity: 0, scale: 0.9
Output: opacity: 1, scale: 1
Duration: 300ms
```

### 8. Loading Spinner:
```
rotate: 0 → 360°
Duration: 1000ms
Infinite rotation
```

---

## 📱 RESPONSIVE BREAKPOINTS

```
Mobile:       0px - 639px
Tablet:       640px - 1023px
Desktop:      1024px - 1279px
Large:        1280px+
```

### Mobile-First Approach:
```
base:   Mobile styles
sm:     640px+
md:     768px+
lg:     1024px+
xl:     1280px+
2xl:    1536px+
```

---

## ✨ INTERACTIVE STATES

### Buttons:
```
Default:  bg-blue-600, text-white, shadow-lg
Hover:    bg-blue-700, scale: 1.05
Active:   bg-blue-800, scale: 0.95
Disabled: opacity: 0.5, cursor: not-allowed
```

### Modal:
```
Closed:   display: none
Opening:  opacity: 0 → 1, scale: 0.9 → 1
Closing:  opacity: 1 → 0, scale: 1 → 0.9
```

### Loading States:
```
Uploading:  opacity: 0.7, pointer-events: none
Success:    icon changes to ✓
Error:      text turns red, icon: ⚠️
```

---

## 🎭 DARK MODE (Optional)

```
Background:   from-blue-900 to-purple-900
Text:         text-white
Cards:        bg-slate-800
Borders:      border-blue-700
Overlay:      rgba(0, 0, 0, 0.8)
```

---

## 📊 VISUAL HIERARCHY

1. **Primary Focus:** Hero Image & Title
2. **Secondary Focus:** CTA Buttons
3. **Tertiary Focus:** Slogan & Description
4. **Supporting:** Decorative elements
5. **Background:** Floating shapes

---

## 🎯 ACCESSIBILITY

### Contrast Ratios:
```
White on Blue-600:     ✅ 4.5:1 (AA)
White on Purple-600:   ✅ 4.5:1 (AA)
Blue-100 on White:     ✅ 4.5:1 (AA)
```

### Touch Targets:
```
Buttons:  min 44px × 44px
Links:    min 48px × 48px
Modals:   centered, full screen overlay
```

### Focus States:
```
Outline: 2px solid #3B82F6
Offset:  2px
Color:   Blue-600
```

---

## 📸 IMAGE SPECIFICATIONS

### Recommended Size:
```
Width:       1200px - 1920px
Height:      600px - 800px
Aspect Ratio: 2:1 (landscape)
Format:      JPEG (best compression)
File Size:   50KB - 100KB (optimal)
Max Size:    5MB (enforced)
```

### Image Optimization:
```
Tool:        TinyPNG, ImageOptim
Quality:     85-90%
Compression: Lossy
Dimensions:  1200x600px @2x
```

---

**Generated:** April 14, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
