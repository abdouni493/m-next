# Charger Modal - Supplier Selection & Payment Tracking Implementation

## Summary
Added comprehensive supplier selection and payment tracking features to the charger/product creation modal in Inventory.tsx.

## Changes Made

### 1. **Added Supplier State Management**
- Added `Supplier` interface with `id` and `name` properties
- Added `suppliers` state to store loaded suppliers from database
- Created `loadSuppliers()` function to load active suppliers
- Called `loadSuppliers()` in the main useEffect hook

### 2. **Added Payment Fields to Form State**
- Added `amount_paid: ''` field to the form data state
- Updated form reset to include this field

### 3. **Updated Database Insert Logic**
- Added `amount_paid: parseFloat(formData.amount_paid) || 0` to the products insert query

### 4. **Added UI Sections to Modal**

#### **Supplier Selection Section (Indigo Gradient)**
- Located after Connector Type selection
- Dropdown to select from existing suppliers
- Non-required field (users can skip if no supplier)
- Color-coded with indigo/blue theme: 🏢 Supplier

#### **Payment Calculation Section (Rose Gradient)**
- Located after Connector Type, before Electrical Specs
- Three-column layout with:
  1. **Purchase Price** (💰) - Required field, accepts decimal values
  2. **Amount Paid** (💵) - Optional field, accepts decimal values
  3. **Rest/Balance** (📊) - Read-only calculated display
     - Shows difference between Purchase Price and Amount Paid
     - **Red background** if balance is positive (money still owed)
     - **Green background** if balance is zero or negative (fully paid or overpaid)
     - Formula: `Purchase Price - Amount Paid`

### 5. **Bilingual Support**
- All labels include translations for English and French
- Supplier: "Supplier" / "Fournisseur"
- Payment section labels translated
- Rest/Balance: "Rest/Balance" / "Reste/Solde"

## Database Requirements

**Note:** You must run the following SQL in Supabase to add the necessary columns:

```sql
-- Add supplier_id and amount_paid columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
```

A file named `ADD_SUPPLIER_AND_PAYMENT_FIELDS.sql` has been created in the project root for reference.

## Features

✅ **Supplier Selection**
- Dropdown loads suppliers from database
- Suppliers marked as `is_active = true`
- Sorted alphabetically by name
- Optional field (users can leave blank)

✅ **Payment Tracking**
- Input field for purchase price (required)
- Input field for amount paid (optional)
- Real-time calculation of remaining balance
- Color-coded display:
  - **Red (bg-red-50)** = Money still owed
  - **Green (bg-green-50)** = Fully paid or overpaid

✅ **Automatic Calculation**
- Rest = Purchase Price - Amount Paid
- Updates in real-time as user types
- Displays with 2 decimal places (e.g., 123.45)

## UI/UX Design

**Color Scheme:**
- Supplier section: Indigo gradient (from-indigo-50 to-indigo-100)
- Payment section: Rose gradient (from-rose-50 to-rose-100)
- Text colors match section theme (text-indigo-900, text-rose-900)
- Borders use matching colors (border-indigo-300, border-rose-300)

**Layout:**
- Supplier selection: Full-width dropdown
- Payment section: 3-column grid layout
- Rest display: Non-editable div styled to show balance status

**Icons:**
- 🏢 Supplier
- 💳 Payment header
- 💰 Purchase Price
- 💵 Amount Paid
- 📊 Rest/Balance

## Testing Checklist

- [ ] RLS policies for suppliers deployed to Supabase (run the SQL migration)
- [ ] Open charger modal - suppliers dropdown loads without errors
- [ ] Select a supplier from dropdown - field updates correctly
- [ ] Enter purchase price and amount paid - Rest calculation updates
- [ ] Enter purchase price only - Rest shows full amount owed (red)
- [ ] Enter amount paid = purchase price - Rest shows 0 (green)
- [ ] Enter amount paid > purchase price - Rest shows negative (green for overpaid)
- [ ] Save charger with supplier selected - data saves to database
- [ ] Save charger with payment info - amount_paid saves correctly
- [ ] Refresh page - charger loads with supplier and payment data
- [ ] No compilation errors in console

## Next Steps

1. **Deploy Database Migration**: Run the SQL in Supabase to add `supplier_id` and `amount_paid` columns
2. **Deploy RLS Policies**: Ensure suppliers table has proper RLS policies allowing authenticated users to read/write
3. **Test Supplier Selection**: Create a charger with supplier selection
4. **Test Payment Tracking**: Create chargers with various payment amounts
5. **Verify Data Persistence**: Check that data is saved and loads correctly on page refresh

## Files Modified

- **src/pages/Inventory.tsx**
  - Added Supplier interface
  - Added suppliers state
  - Added loadSuppliers() function
  - Added supplier selection dropdown UI
  - Added payment calculation section with amount_paid field
  - Updated form reset to include amount_paid
  - Updated database insert to save amount_paid

## Files Created

- **ADD_SUPPLIER_AND_PAYMENT_FIELDS.sql** - Migration file with SQL commands to add necessary database columns
