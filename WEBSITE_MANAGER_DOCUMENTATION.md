# 🌐 Website Manager Interface Documentation

## Overview

The Website Manager is a complete e-commerce management interface for handling offers, special offers, contact information, and website settings. It provides a modern, multi-language interface with 4 main tabs.

## File Structure

- **Component**: `src/pages/Website.tsx`
- **Route**: `/website`
- **Sidebar Link**: Added to Tools section as "🌐 Gestion du Site"

## Features

### 1. **Offers Tab** 🎁
Manage regular product offers with custom pricing.

**Functionality:**
- Search products by name, mark, or description
- Select a product from search results
- Set custom offer price (below original price)
- Add optional description
- Display offers in card grid format
- Actions:
  - **View Details**: See full offer information
  - **Hide/Show**: Toggle visibility on website (Eye/EyeOff button)
  - **Copy Link**: Generate shareable link for the offer (shows discount percentage)
  - **Delete**: Remove offer with confirmation dialog

**Data Structure:**
```typescript
Offer {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_mark?: string;
  product_description?: string;
  original_price: number;
  offer_price: number;
  description?: string;
  discount_percentage: number;     // Auto-calculated
  is_visible: boolean;
}
```

**Design:**
- Card layout with product image
- Shows original price (strikethrough) vs offer price
- Discount badge displaying "-X%"
- Color scheme: Blue borders and accents

---

### 2. **Special Offers Tab** ⭐
Manage special promotional offers with automatic discount calculation.

**Functionality:**
- Search and select products same as Offers tab
- Set special price (lower than original)
- Auto-calculates discount amount and percentage
- Add optional description
- All same action buttons as Offers tab
- Real-time discount calculation display

**Data Structure:**
```typescript
SpecialOffer {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_mark?: string;
  product_description?: string;
  original_price: number;
  special_price: number;
  description?: string;
  discount_percentage: number;     // Auto-calculated
  discount_amount: number;         // Auto-calculated
  is_visible: boolean;
}
```

**Design:**
- Purple borders and accents (different from regular offers)
- Shows discount in green highlight
- ⭐ Badge to distinguish from regular offers
- Live calculation feedback

---

### 3. **Contacts Tab** 📞
Manage all website contact information and social media links.

**Fields:**
- **Social Media**:
  - 📘 Facebook URL
  - 📷 Instagram URL
  - 🎵 TikTok URL
  - 👻 Snapchat URL

- **Direct Contact**:
  - ☎️ Phone Number
  - 💬 WhatsApp Number
  - ✈️ Telegram Username
  - 📍 Location/Address

**Features:**
- All fields optional
- Form-based interface
- Single "Save" button to update all contacts at once
- Real-time field updates

**Language Support:**
- English: "Contact Information"
- French: "Informations de Contact"
- Arabic: "معلومات التواصل"

---

### 4. **Website Settings Tab** ⚙️
Configure main website information and branding.

**Fields:**
- **Logo**: 
  - File upload with preview
  - Displays current logo if set
  - Auto-uploads to Supabase storage (`website/logos/` folder)

- **Store Name**: Main business name
- **Slogan**: Short tagline/motto
- **Description**: Full website description (textarea)

**Features:**
- Logo upload with instant preview
- Current settings display
- Single "Save Settings" button
- Saves all data to `website_settings` table

**Design:**
- Purple theme (⚙️)
- Logo preview in 40x40 box
- Centered form layout

---

## Language Support

All interfaces support **3 languages** with automatic RTL for Arabic:

1. **English (en)** - Default
2. **French (fr)** - Full French translations
3. **Arabic (ar)** - Full Arabic + RTL layout

### Translation Keys Used
```
Common:
- "تم" / "Succès" / "Success"
- "خطأ" / "Erreur" / "Error"
- "إلغاء" / "Annuler" / "Cancel"
- "حذف" / "Supprimer" / "Delete"
- "رجوع" / "Retour" / "Back"

Offers:
- "إنشاء عرض جديد" / "Créer une nouvelle offre"
- "إنشاء عرض خاص جديد" / "Créer une nouvelle offre spéciale"
- "لا توجد عروض" / "Aucune offre"
- "التفاصيل" / "Détails"
- "ابحث بالاسم أو العلامة" / "Recherchez par nom ou marque"

Settings:
- "إعدادات الموقع" / "Paramètres du Site Web"
- "شعار الموقع" / "Logo du Site"
- "اسم المتجر" / "Nom du Magasin"
- "الشعار" / "Slogan"
- "الوصف" / "Description"
```

---

## Database Integration

### Tables Used

1. **website_settings** - Single row storing global website config
2. **offers** - Product offers with custom pricing
3. **special_offers** - Special promotional offers
4. **products** - Source data for product selection

### Database Functions (supabaseClient.ts)

```typescript
// Website Settings
getWebsiteSettings()
updateWebsiteSettings(updates)

// Offers
getOffers()                    // All offers
getVisibleOffers()            // Only visible to website
createOffer(offer)
updateOffer(id, updates)
deleteOffer(id)

// Special Offers
getSpecialOffers()            // All special offers
getVisibleSpecialOffers()     // Only visible to website
createSpecialOffer(specialOffer)
updateSpecialOffer(id, updates)
deleteSpecialOffer(id)

// Products (for selection)
getProducts()
```

---

## State Management

**Local State Variables:**

```typescript
// Tab Management
activeTab: 'offers' | 'special' | 'contacts' | 'settings'

// Data Caching
products: Product[]
offers: Offer[]
specialOffers: SpecialOffer[]
settings: WebsiteSettings

// Offers State
selectedProductOffer: Product | null
offerPrice: string
offerDescription: string
showCreateOfferDialog: boolean
showDeleteOfferDialog: boolean
selectedOfferDelete: string | null

// Special Offers State
selectedProductSpecial: Product | null
specialPrice: string
originalPriceSpecial: number
discountAmountSpecial: number
discountPercentSpecial: number
specialOfferDescription: string
showCreateSpecialDialog: boolean
showDeleteSpecialDialog: boolean
selectedSpecialDelete: string | null

// Website Settings State
logoPreview: string
logoFile: File | null

// UI States
showOfferDetails: boolean
selectedOfferDetails: Offer | null
showSpecialDetails: boolean
selectedSpecialDetails: SpecialOffer | null
loading: boolean
```

---

## UI Components Used

- **shadcn/ui**:
  - Button
  - Input
  - Card, CardContent, CardHeader, CardTitle
  - Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
  - Badge
  - Label

- **Framer Motion**:
  - motion.div
  - motion.button
  - AnimatePresence
  - whileHover, whileTap, initial, animate, exit

- **Lucide Icons**:
  - ShoppingBag, Tag, MessageSquare, Settings
  - Plus, Search, Edit2, Trash2
  - Eye, EyeOff, Copy, ChevronRight, X, Check, AlertCircle
  - Upload
  - Facebook, Instagram, MapPin, Phone, MessageCircle, Send

---

## Styling

**Color Scheme:**
- **Primary**: Blue/Cyan gradient (offers, navigation)
- **Secondary**: Purple/Pink gradient (special offers, settings)
- **Success**: Green (save actions)
- **Danger**: Red (delete actions)
- **Neutral**: Slate (backgrounds, text)

**Key Classes:**
- Cards: `rounded-2xl border-2 shadow-lg hover:shadow-xl`
- Buttons: `rounded-xl px-8 py-4 font-bold text-lg`
- Headers: `text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent`
- Tabs: `px-6 py-3 rounded-xl font-bold text-lg`

**Responsive Design:**
- Mobile: 1 column
- Tablet: 2 columns (md:grid-cols-2)
- Desktop: 3 columns (lg:grid-cols-3)
- Max width: 7xl with centered container

---

## Image Handling

### Logo Upload
- Accepts all image types (`image/*`)
- Stores in Supabase: `storage/website/logos/`
- File naming: `logo-{timestamp}`
- Returns public URL after upload
- Displays preview before saving

### Product Images
- Loaded from products table (`primary_image` field)
- Used in offer/special offer cards
- Fallback icon if no image available
- Object-fit: cover for consistent sizing

---

## Toast Notifications

Uses `useToast()` hook for feedback:

**Success Messages:**
- Offer created/deleted/updated
- Special offer created/deleted/updated
- Settings saved
- Link copied to clipboard

**Error Messages:**
- Failed to load data
- Failed to create/update/delete offer
- Failed to save settings
- Failed to upload logo

---

## Accessibility Features

- ✅ Semantic HTML with proper labels
- ✅ Keyboard navigation (Tab, Enter)
- ✅ Proper button roles and click handlers
- ✅ Form labels with proper associations
- ✅ Error messages with proper context
- ✅ Loading states to prevent duplicate submissions
- ✅ Confirmation dialogs for destructive actions
- ✅ Icon + text combinations for clarity
- ✅ Tooltip titles on collapsed sidebar

---

## Performance Optimizations

1. **Data Loading**: 
   - Fetches all data in parallel using `Promise.all()`
   - Caches data in component state
   - Refreshes after mutations

2. **Search Filtering**:
   - Client-side filtering of products
   - Instant search feedback
   - No network requests during typing

3. **Image Handling**:
   - Uses Supabase CDN for storage
   - Public URLs for fast delivery
   - Image compression in browser before upload

4. **Dialog Rendering**:
   - Modals only render when open
   - Proper cleanup on close
   - No unnecessary re-renders

---

## Error Handling

1. **Network Errors**:
   - Caught with try/catch
   - User-friendly toast messages
   - Logged to console for debugging

2. **Validation**:
   - Product must be selected before creating offer
   - Prices validated as numbers
   - File type validation for logo upload

3. **User Feedback**:
   - Loading states on buttons
   - Toast notifications
   - Confirmation dialogs before destructive actions

---

## Usage Instructions

### Creating an Offer
1. Click "Create New Offer" button (🎁 tab)
2. Search and select a product
3. Enter offer price (lower than original)
4. Add optional description
5. Click "Create Offer"
6. Offer appears in grid below

### Managing Visibility
- Click Eye icon to show/hide on website
- Hidden offers: EyeOff icon, gray background
- Visible offers: Eye icon, normal display

### Sharing Offers
- Click Copy icon on any offer card
- Link copied to clipboard
- Share with customers to direct traffic

### Updating Settings
1. Click relevant Settings sub-tab
2. Edit information directly
3. Click "Save" or "Save Settings"
4. Success message confirms update

---

## Future Enhancements

- [ ] Bulk offer creation from product categories
- [ ] Schedule offers to start/end on specific dates
- [ ] Analytics dashboard showing offer performance
- [ ] Email notifications when visibility changes
- [ ] Multi-language offer descriptions
- [ ] Offer templates for quick creation
- [ ] QR code generation for offers
- [ ] Social media integration for auto-posting
- [ ] Customer reviews/ratings display
- [ ] Inventory sync with offers

---

## Troubleshooting

**Offers not appearing:**
- Verify database tables exist
- Check RLS policies are set correctly
- Ensure user is authenticated

**Images not loading:**
- Verify Supabase storage bucket exists
- Check file permissions in storage
- Ensure CDN is enabled

**Save not working:**
- Check internet connection
- Verify Supabase credentials
- Check browser console for errors

**Language not changing:**
- Verify Language context is set
- Check browser language settings
- Clear localStorage and refresh

---

## API Response Examples

### Website Settings Response
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "store_name": "Phone Chargers",
  "slogan": "Fast & Reliable",
  "description": "Premium phone charging solutions",
  "logo_url": "https://cdn.example.com/logo.png",
  "facebook_url": "https://facebook.com/chargers",
  "instagram_url": "https://instagram.com/chargers",
  "phone_number": "+213 XXX XXX XXX",
  "whatsapp_number": "+213 XXX XXX XXX",
  "location": "Algiers, Algeria",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Offer Response
```json
{
  "id": "uuid-string",
  "product_id": "uuid-string",
  "product_name": "USB-C Charger 65W",
  "product_image": "https://cdn.example.com/image.jpg",
  "product_mark": "Samsung",
  "original_price": 5000,
  "offer_price": 3500,
  "description": "Limited time offer",
  "discount_percentage": 30,
  "is_visible": true,
  "created_by": "user-id",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

---

## Related Files

- Database Schema: `WEBSITE_MANAGEMENT_SCHEMA.sql`
- API Functions: `src/lib/supabaseClient.ts`
- Language Context: `src/contexts/LanguageContext.tsx`
- Main Routes: `src/App.tsx`
- Sidebar Navigation: `src/components/Layout/Sidebar.tsx`

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Complete & Production Ready ✅
