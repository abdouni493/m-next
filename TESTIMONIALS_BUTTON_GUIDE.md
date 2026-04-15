# 💬 Testimonials Button Guide

## Where to Find the Button

The testimonials button is located on the **Order/Cart Page** (Commandes) next to the name input field.

### Location:
- **Page**: `/commandes` (Order/Cart page)
- **Section**: Customer Information Form
- **Field**: Next to "Client Name" input field

## What You'll See

### 1. **The Button** (Always Visible)
- **Mobile**: Shows as 💬 emoji only
- **Desktop**: Shows as "💬 Mes avis" (FR) or "💬 آرائي" (AR)
- **Status**: Disabled (grayed out) when name field is empty
- **Status**: Active (enabled) when you enter your name

### 2. **Click the Button** →
When you click the button with your name entered:

**Modal Opens** showing:
- ✅ All your previous opinions
- ⭐ Star ratings (1-5 stars)
- ⏳ Status badge:
  - "✅ Approuvé" (Approved) - Admin approved it
  - "⏳ En attente" (Pending) - Waiting for admin approval
- 📅 Date of submission
- 💬 Your full opinion text

### 3. **Action Buttons** (For Each Opinion)

#### 📝 **Modifier (Edit)**
- Blue button
- Opens form to update your opinion
- Pre-fills with your previous text
- Change star rating
- Click "Envoyer" to save

#### 🗑️ **Supprimer (Delete)**
- Red button
- Softly deletes your opinion (removed from view)
- Can be restored by admin if needed

### 4. **Add New Opinion**
In the testimonials modal:
- Click "➕ Nouvel avis" (New Opinion) button
- Form opens with:
  - ⭐ Star rating selector (click stars 1-5)
  - 💬 Opinion text area
  - Character counter
  - "Envoyer" (Submit) button

## Step-by-Step Flow

```
1. Enter your name in the "Client Name" field
   ↓
2. Button "💬 Mes avis" becomes active
   ↓
3. Click the button
   ↓
4. Modal opens showing your previous opinions (if any)
   ↓
5. Choose action:
   - Add new opinion → Click "➕ Nouvel avis"
   - Edit existing → Click "📝 Modifier" on opinion
   - Delete existing → Click "🗑️ Supprimer" on opinion
   ↓
6. Fill form with opinion and rating
   ↓
7. Click "Envoyer" to submit
   ↓
8. ✅ Success! Opinion is sent for admin approval
```

## What Happens After You Submit

1. Your opinion is saved in database
2. Status shows "⏳ En attente" (Pending Approval)
3. Admin will review and approve
4. Once approved, status shows "✅ Approuvé"
5. Approved opinions appear on landing page for other clients to see

## Multi-Language Support

- **French (FR)**: "Mes avis", "Modifier", "Supprimer", "Nouvel avis"
- **Arabic (AR)**: "آرائي", "تعديل", "حذف", "رأي جديد"
- **English (EN)**: Full support (labels translated in code)

## Responsive Design

- **Mobile**: Compact design with emoji icon
- **Tablet**: Partial text + emoji
- **Desktop**: Full text labels with icons

## Dark Mode

All components fully support dark mode:
- Purple gradient buttons
- Blue borders
- Light text on dark backgrounds
- Smooth animations on hover

## Troubleshooting

❌ **Button is grayed out**
→ Enter your name in the name field first

❌ **Nothing happens when I click**
→ Make sure you have entered your name
→ Check browser console for errors (F12)

❌ **Cannot submit opinion**
→ Opinion text must not be empty
→ Check that database connection is working

❌ **Opinion doesn't appear**
→ Opinion is pending admin approval
→ Check modal - it should show "⏳ En attente"
→ Wait for admin to approve

---

**Database**: All opinions stored in `client_testimonials` table  
**Status**: ✅ Fully implemented and ready to use  
**API**: Uses Supabase REST endpoints with RLS enabled
