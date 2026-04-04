# 🌐 Website Manager - Visual Architecture Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WEBSITE MANAGER APP                       │
│                    (src/pages/Website.tsx)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              TAB NAVIGATION (4 Tabs)               │    │
│  │  🎁 Offers | ⭐ Special | 📞 Contacts | ⚙️ Settings│    │
│  └────────────────────────────────────────────────────┘    │
│                        ▼ ▼ ▼                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │         ACTIVE TAB CONTENT AREA                    │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │ Tab 1: Offers (Card Grid + Dialogs)        │  │    │
│  │  │ Tab 2: Special Offers (Card Grid + Dialogs)│  │    │
│  │  │ Tab 3: Contacts (Form)                     │  │    │
│  │  │ Tab 4: Settings (Form)                     │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                        ▼ ▼ ▼                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │             DATABASE & API LAYER                  │    │
│  │  supabaseClient.ts (12 functions)                │    │
│  └────────────────────────────────────────────────────┘    │
│                        ▼ ▼ ▼                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │            SUPABASE DATABASE                      │    │
│  │  [website_settings] [offers] [special_offers]    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
USER INTERACTION
      │
      ▼
┌─────────────────────┐
│  React Component    │
│  (Website.tsx)      │  ◄──── LanguageContext (i18n)
│                     │  ◄──── AuthContext (user info)
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ State Update │
    └──────┬───────┘
           │
           ▼
┌──────────────────────────┐
│ Event Handler            │
│ - Create                 │
│ - Update                 │
│ - Delete                 │
│ - Toggle Visibility      │
│ - Copy Link              │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ API Function Call        │
│ (supabaseClient.ts)      │
│ - createOffer()          │
│ - updateOffer()          │
│ - deleteOffer()          │
│ - updateWebsiteSettings()│
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Supabase Request         │
│ - Insert/Update/Delete   │
│ - Execute RLS Policies   │
│ - Store in Database      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Response Received        │
│ - Success/Error          │
│ - Return Data            │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ UI Update                │
│ - Refresh Data           │
│ - Show Toast             │
│ - Close Dialog           │
│ - Update Grid            │
└──────────────────────────┘
```

---

## Component Hierarchy

```
Website.tsx (Main)
│
├─► 🎁 Offers Tab
│   ├─ Search Input
│   ├─ Create Button
│   ├─ Offers Grid
│   │  └─ Offer Card (Repeating)
│   │     ├─ Image
│   │     ├─ Title & Mark
│   │     ├─ Prices
│   │     ├─ Discount Badge
│   │     └─ Action Buttons
│   ├─ Create Offer Dialog
│   │  ├─ Product Search
│   │  ├─ Product Selection Grid
│   │  └─ Form (Price, Description)
│   └─ Delete Confirmation Dialog
│
├─► ⭐ Special Offers Tab
│   ├─ Search Input
│   ├─ Create Button
│   ├─ Special Offers Grid
│   │  └─ Special Offer Card (Repeating)
│   │     ├─ Image
│   │     ├─ Title & Mark
│   │     ├─ Prices
│   │     ├─ Discount Display
│   │     └─ Action Buttons
│   ├─ Create Special Offer Dialog
│   │  ├─ Product Search
│   │  ├─ Product Selection Grid
│   │  ├─ Auto Discount Calculation
│   │  └─ Form
│   └─ Delete Confirmation Dialog
│
├─► 📞 Contacts Tab
│   ├─ Form Section
│   │  ├─ Facebook URL Input
│   │  ├─ Instagram URL Input
│   │  ├─ TikTok URL Input
│   │  ├─ Snapchat URL Input
│   │  ├─ Phone Input
│   │  ├─ WhatsApp Input
│   │  ├─ Telegram Input
│   │  └─ Location Input
│   └─ Save Button
│
└─► ⚙️ Settings Tab
    ├─ Logo Upload Section
    │  ├─ Upload Area
    │  └─ Preview Display
    ├─ Store Name Input
    ├─ Slogan Input
    ├─ Description Textarea
    └─ Save Settings Button
```

---

## State Management Structure

```
Website Component State
│
├─► Tab Management
│   └─ activeTab: 'offers' | 'special' | 'contacts' | 'settings'
│
├─► Shared Data
│   ├─ products: Product[]
│   ├─ offers: Offer[]
│   ├─ specialOffers: SpecialOffer[]
│   ├─ settings: WebsiteSettings
│   └─ loading: boolean
│
├─► Offers State
│   ├─ selectedProductOffer: Product | null
│   ├─ offerPrice: string
│   ├─ offerDescription: string
│   ├─ showCreateOfferDialog: boolean
│   ├─ showDeleteOfferDialog: boolean
│   └─ selectedOfferDelete: string | null
│
├─► Special Offers State
│   ├─ selectedProductSpecial: Product | null
│   ├─ specialPrice: string
│   ├─ originalPriceSpecial: number
│   ├─ discountAmountSpecial: number
│   ├─ discountPercentSpecial: number
│   ├─ specialOfferDescription: string
│   ├─ showCreateSpecialDialog: boolean
│   ├─ showDeleteSpecialDialog: boolean
│   └─ selectedSpecialDelete: string | null
│
├─► Settings State
│   ├─ logoPreview: string
│   └─ logoFile: File | null
│
└─► Dialog States
    ├─ showOfferDetails: boolean
    ├─ selectedOfferDetails: Offer | null
    ├─ showSpecialDetails: boolean
    └─ selectedSpecialDetails: SpecialOffer | null
```

---

## Database Schema Diagram

```
┌──────────────────────────┐
│   website_settings       │
├──────────────────────────┤
│ id (PK)                  │
│ store_name              │
│ slogan                  │
│ description             │
│ logo_url                │
│ facebook_url            │
│ instagram_url           │
│ tiktok_url              │
│ snapchat_url            │
│ location                │
│ phone_number            │
│ whatsapp_number         │
│ telegram_number         │
│ created_at              │
│ updated_at              │
└──────────────────────────┘


┌──────────────────────────┐         ┌──────────────────┐
│   offers                 │────────►│   products       │
├──────────────────────────┤         ├──────────────────┤
│ id (PK)                  │◄────────│ id (PK)          │
│ product_id (FK)          │         │ name             │
│ product_name             │         │ primary_image    │
│ product_image            │         │ mark             │
│ product_mark             │         │ description      │
│ product_description      │         │ selling_price    │
│ original_price           │         │ quantity_actual  │
│ offer_price              │         │ ...              │
│ description              │         │                  │
│ discount_percentage      │         │                  │
│ is_visible               │         │                  │
│ created_by (FK)          │         │                  │
│ created_at               │         │                  │
│ updated_at               │         │                  │
└──────────────────────────┘         └──────────────────┘


┌──────────────────────────┐         
│   special_offers         │────────►(Same link to products)
├──────────────────────────┤         
│ id (PK)                  │         
│ product_id (FK)          │         
│ product_name             │         
│ product_image            │         
│ product_mark             │         
│ product_description      │         
│ original_price           │         
│ special_price            │         
│ description              │         
│ discount_percentage      │         
│ discount_amount          │         
│ is_visible               │         
│ created_by (FK)          │         
│ created_at               │         
│ updated_at               │         
└──────────────────────────┘         


┌──────────────────────────────────────┐
│      Views (for website display)     │
├──────────────────────────────────────┤
│ visible_offers                       │
│  └─ filters: is_visible = true       │
│ visible_special_offers               │
│  └─ filters: is_visible = true       │
│ all_visible_offers                   │
│  └─ combines both visible views      │
└──────────────────────────────────────┘
```

---

## Tab Flow Diagram

```
OFFERS TAB
┌──────────────────────────────────────┐
│ Click "Create New Offer"             │
├──────────────────────────────────────┤
│ Dialog Opens                         │
│ ├─ Product Search                    │
│ ├─ Product Selection Grid            │
│ └─ Search Results                    │
├──────────────────────────────────────┤
│ Select Product                       │
├──────────────────────────────────────┤
│ Dialog Changes View                  │
│ ├─ Show Selected Product             │
│ ├─ Enter Offer Price                 │
│ ├─ Enter Description                 │
│ └─ Create Button                     │
├──────────────────────────────────────┤
│ Click Create                         │
├──────────────────────────────────────┤
│ API Call: createOffer()              │
├──────────────────────────────────────┤
│ Success Toast                        │
├──────────────────────────────────────┤
│ Dialog Closes                        │
├──────────────────────────────────────┤
│ Refresh Data                         │
├──────────────────────────────────────┤
│ Offer appears in Grid                │
└──────────────────────────────────────┘


SPECIAL OFFERS TAB
┌──────────────────────────────────────┐
│ Click "Create New Special Offer"     │
├──────────────────────────────────────┤
│ Dialog Opens (Product Search)        │
├──────────────────────────────────────┤
│ Select Product                       │
├──────────────────────────────────────┤
│ View Changes                         │
│ ├─ Show Original Price               │
│ ├─ Enter Special Price               │
│ ├─ Auto Calculate:                   │
│ │  ├─ discount_amount                │
│ │  └─ discount_percentage            │
│ ├─ Display Calculation               │
│ ├─ Enter Description                 │
│ └─ Create Button                     │
├──────────────────────────────────────┤
│ Click Create                         │
├──────────────────────────────────────┤
│ API Call: createSpecialOffer()       │
├──────────────────────────────────────┤
│ Success Toast                        │
├──────────────────────────────────────┤
│ Data Refresh                         │
├──────────────────────────────────────┤
│ Special Offer appears in Grid        │
└──────────────────────────────────────┘


CONTACTS TAB
┌──────────────────────────────────────┐
│ Display Contact Form                 │
│ ├─ 8 Input Fields                    │
│ ├─ All Fields Optional               │
│ └─ Icons for each field              │
├──────────────────────────────────────┤
│ User Fills Form                      │
│ (any/all fields)                     │
├──────────────────────────────────────┤
│ Click Save                           │
├──────────────────────────────────────┤
│ API Call: updateWebsiteSettings()    │
├──────────────────────────────────────┤
│ Success Toast                        │
├──────────────────────────────────────┤
│ Data Updated                         │
└──────────────────────────────────────┘


SETTINGS TAB
┌──────────────────────────────────────┐
│ Display Settings Form                │
│ ├─ Logo Upload                       │
│ ├─ Store Name Input                  │
│ ├─ Slogan Input                      │
│ ├─ Description Textarea              │
│ └─ Logo Preview (if exists)          │
├──────────────────────────────────────┤
│ User Uploads Logo (optional)         │
│ ├─ File Selected                     │
│ ├─ Preview Generated                 │
│ └─ Display Preview                   │
├──────────────────────────────────────┤
│ User Fills Other Fields              │
├──────────────────────────────────────┤
│ Click Save Settings                  │
├──────────────────────────────────────┤
│ If Logo: Upload to Supabase Storage  │
├──────────────────────────────────────┤
│ API Call: updateWebsiteSettings()    │
├──────────────────────────────────────┤
│ Success Toast                        │
├──────────────────────────────────────┤
│ Settings Saved                       │
└──────────────────────────────────────┘
```

---

## Action Buttons Diagram

```
OFFER CARD BUTTONS
┌─────────────────────────────────┐
│ [📋 Details] [👁️ Hide] [📋 Copy] [🗑️ Delete] │
└─────────────────────────────────┘
    │          │          │          │
    ▼          ▼          ▼          ▼
  Details   Visibility  Share       Delete
  Dialog    Toggle      Link        Dialog


VISIBILITY STATES
┌──────────────────────┐
│ Visible Offer        │
│ [Eye Icon]  Button   │ ◄── Click to hide
└──────────────────────┘
│
│ (Hidden)
│
┌──────────────────────┐
│ Hidden Offer         │
│ [EyeOff Icon] Button │ ◄── Click to show
└──────────────────────┘
```

---

## Language Toggle Mechanism

```
┌─────────────────────────────────────┐
│ Language Context (LanguageContext)  │
├─────────────────────────────────────┤
│ language: 'en' | 'fr' | 'ar'        │
│ isRTL: boolean                      │
│ getText(key): string                │
└─────────────────────────────────────┘
        ▲                  ▲
        │                  │
    ┌───┴──────────────────┴───┐
    │  Updates on Language      │
    │  Context Change           │
    │  from Sidebar/Header      │
    └───────────────────────────┘
        ▼
┌─────────────────────────────────────┐
│ Website Component                   │
├─────────────────────────────────────┤
│ useLanguage() hook                  │
│ Re-renders entire UI                │
│ with new language                   │
└─────────────────────────────────────┘
        ▼
    All text updates
    Layout flips if Arabic
    Icons remain same
```

---

## Form Validation Flow

```
USER INPUT
    │
    ▼
┌────────────────────┐
│ Product Selection  │
│ Required?          │ ─ No ─► Error Toast
└────────────────────┘
    │ Yes
    ▼
┌────────────────────┐
│ Offer Price        │
│ Valid Number?      │ ─ No ─► Show Error
└────────────────────┘
    │ Yes
    ▼
┌────────────────────┐
│ Price > 0?         │ ─ No ─► Invalid
└────────────────────┘
    │ Yes
    ▼
┌────────────────────┐
│ Description        │
│ (Optional)         │ ─ Pass ─► Ready
└────────────────────┘
    │
    ▼
CREATE OFFER ENABLED ✅
```

---

## Error Handling Flow

```
API CALL
    │
    ├─► Network Error
    │   └─► Toast: Error message
    │       └─► Log to console
    │
    ├─► Supabase Error
    │   └─► Check error code
    │       ├─► 'PGRST116' (No data) ─► OK, return empty
    │       └─► Other errors ─► Toast: Error message
    │
    ├─► Success
    │   └─► Toast: Success message
    │       └─► Refresh data
    │           └─► Update UI
    │
    └─► Timeout
        └─► Toast: Timeout error
            └─► Retry option
```

---

## Image Upload Process

```
USER CLICKS UPLOAD
    │
    ▼
BROWSER FILE PICKER
    │
    ▼
FILE SELECTED
    │
    ▼
CREATE FILE READER
    │
    ▼
GENERATE PREVIEW URL
    │
    ▼
DISPLAY PREVIEW
    │
    ▼
USER CLICKS SAVE
    │
    ▼
UPLOAD TO SUPABASE
│   ├─ Bucket: 'website'
│   ├─ Path: 'logos/{timestamp}'
│   └─ Get public URL
│
    ▼
SAVE SETTINGS TO DB
│   └─ Store public URL
│
    ▼
SUCCESS TOAST
```

---

## Search & Filter Flow

```
USER TYPES IN SEARCH
    │
    ▼
onInput Event Fired
    │
    ▼
searchQuery State Updated
    │
    ▼
REAL-TIME FILTER
    │
    ├─ Filter by name
    ├─ Filter by mark
    ├─ Filter by description
    │
    ▼
UPDATE RESULTS
    │
    ├─ Re-render Product Grid
    ├─ Show matching items
    ├─ Hide non-matching
    │
    ▼
INSTANT FEEDBACK
    (No network request)
```

---

## Discount Calculation

```
SPECIAL OFFER ONLY

Original Price: 5000
    │
    ▼
User Enters Special Price: 3500
    │
    ▼
AUTO CALCULATE
    │
    ├─ Discount Amount = 5000 - 3500 = 1500
    │
    ├─ Discount % = (1500 / 5000) * 100 = 30%
    │
    ▼
DISPLAY INSTANTLY
    │
    ├─ Show green box
    ├─ Display amount: 1500 DZD
    ├─ Display percentage: 30%
    │
    ▼
ON SAVE
    ├─ Store both values
    ├─ Store in database
    └─ Display on cards
```

---

## Mobile Responsive Breakpoints

```
MOBILE (320px - 640px)
┌────────────────────┐
│ Stack vertically   │
│ 1 column           │
│ Full width buttons │
│ Small fonts        │
└────────────────────┘

TABLET (640px - 1024px)
┌────────────────────┐
│ 2 columns          │
│ Larger touch areas │
│ Readable text      │
└────────────────────┘

DESKTOP (1024px+)
┌────────────────────┐
│ 3 columns          │
│ Full UI            │
│ Optimized spacing  │
└────────────────────┘
```

---

**Last Updated**: January 2024  
**Diagram Version**: 1.0
