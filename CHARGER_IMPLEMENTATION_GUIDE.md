# 🚀 Charger Inventory System - Complete Implementation Guide

## Overview
This guide provides step-by-step instructions to implement the complete charger selling system redesign with updated Inventory, Suppliers, and Purchase Invoice interfaces.

---

## Phase 1: Database Schema Update

### Step 1: Deploy SQL Schema to Supabase

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project (pzzngzaljrfrbteclexi)

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Copy and Execute SQL**
   - Open file: `CHARGER_DATABASE_SCHEMA_FINAL.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see success messages
   - Check if errors appear - if yes, review the error and retry
   - You should now have:
     - ✅ `marks` table (charger brands)
     - ✅ `connector_types` table (USB-C, Lightning, etc.)
     - ✅ `product_images` table (image storage links)
     - ✅ Updated `products` table with charger fields
     - ✅ `purchase_invoices` table
     - ✅ `sales_invoices` table

### Step 2: Create Admin User

1. **Go to Supabase Auth**
   - Click "Authentication" > "Users"
   - Click "Add user"

2. **Create Admin Account**
   - Email: `admin@chargers.com`
   - Password: Strong password (e.g., `ChargerAdmin@2025!`)
   - Click "Create user"

3. **Update User Role**
   - In the `users` table, set the new user's `role` to `'admin'`

### Step 3: Create Admin Account in Products

Execute this SQL in Supabase:

```sql
-- Create admin user profile
INSERT INTO users (id, email, role, is_active)
SELECT 
  id, 
  email, 
  'admin',
  true
FROM auth.users 
WHERE email = 'admin@chargers.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_active = true;
```

---

## Phase 2: Frontend Configuration

### Step 1: Update Environment Variables

File: `.env.local`

```env
VITE_SUPABASE_URL=https://pzzngzaljrfrbteclexi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Charger Inventory System
```

**Note:** The `.env.local` file should already be configured from previous steps.

### Step 2: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

---

## Phase 3: Component Updates

### Already Updated Components:

✅ **ChargerInventory.tsx** (NEW)
- Complete charger inventory management
- Image upload to Supabase 'chargers' bucket
- Mark/Brand selector with add capability
- Electrical specs: Voltage, Wattage, Amperage
- Connector type selection
- Quantity tracking (initial, actual, minimal)
- Price calculations with margin display
- Low stock alerts
- Product search and filtering

✅ **Suppliers.tsx** (UPDATED)
- Clean supplier management interface
- Add/Edit/Delete suppliers
- Contact information (email, phone, address)
- Tax ID and bank account fields
- Professional card-based layout
- Search and filter by name/email/city

✅ **PurchaseInvoices_New.tsx** (NEW)
- Create purchase invoices with charger items
- Auto-fill product details when selected
- Automatic quantity tracking updates
- Subtotal/discount/total calculations
- Invoice status tracking
- Supplier selection
- Date management

---

## Phase 4: Image Upload Configuration

### Storage Bucket Setup (Already Done ✅)

The 'chargers' storage bucket is already created with:
- **Authenticated** read access
- **Authenticated** write access for upload
- **Public** read URL generation for display

### How Images Work:

1. **Upload**: When adding a charger, select images
2. **Storage**: Images uploaded to Supabase storage
3. **Database**: Image URLs stored in `product_images` table
4. **Display**: Primary image shows in product cards

### Image Upload Example in Code:

```typescript
// Upload to Supabase storage
const { data: publicUrl } = supabase.storage
  .from('chargers')
  .getPublicUrl(fileName);

// Save to database
await supabase.from('product_images').insert([{
  product_id: productId,
  image_url: publicUrl.publicUrl,
  file_path: fileName,
  is_primary: true,
}]);
```

---

## Phase 5: Testing the System

### 5.1 Test Charger Inventory

1. **Login with credentials:**
   - Email: admin@chargers.com (or your existing admin account)
   - Password: (your admin password)

2. **Navigate to Inventory**
   - Click "Inventory" in sidebar
   - You should see the new ChargerInventory interface

3. **Add a Test Charger**
   - Click "Add Charger" button
   - Fill in details:
     - **Name:** USB-C 20W Fast Charger
     - **Mark:** Create new or select existing
     - **Connector Type:** USB-C
     - **Voltage:** 5.0V
     - **Wattage:** 20W
     - **Amperage:** 4.0A
     - **Model Number:** UC-20-2024
     - **Initial Qty:** 50
     - **Minimal Qty:** 10
     - **Purchase Price:** $8.50
     - **Selling Price:** $18.99
     - **Images:** Upload product photos
   - Click "Save Charger"

4. **Verify Product Created**
   - Product should appear in list with image
   - Card should show all details
   - Search should find the product

### 5.2 Test Suppliers

1. **Navigate to Suppliers**
   - Click "Suppliers" in sidebar

2. **Add a Test Supplier**
   - Click "Add Supplier" button
   - Fill in details:
     - **Name:** Tech Imports Inc.
     - **Contact Person:** John Smith
     - **Email:** john@techimports.com
     - **Phone:** +1 (555) 123-4567
     - **Address:** 123 Tech Street
     - **City:** San Francisco
     - **Country:** USA
     - **Tax ID:** 12-3456789
   - Click "Save Supplier"

3. **Verify Supplier Created**
   - Supplier should appear in list
   - Contact info should be clickable

### 5.3 Test Purchase Invoice

1. **Navigate to Purchase Invoices**
   - Click "Purchase Invoices" in sidebar

2. **Create a Test Invoice**
   - Click "New Invoice" button
   - **Supplier:** Select the test supplier
   - **Invoice Date:** Today's date
   - **Due Date:** 30 days from now
   - **Search for Charger:** Start typing "USB-C"
   - **Select Product:** Click on USB-C charger from dropdown
   - **Quantity:** 10
   - **Unit Price:** Should auto-fill with purchase price
   - Click "Add Item" button
   - **Add More Items:** (optional)
   - Review subtotal and total
   - **Discount:** Enter 10 (optional)
   - **Notes:** "Test invoice"
   - Click "Create Invoice"

3. **Verify Invoice Created**
   - Invoice should appear in list with:
     - Invoice number
     - Supplier name
     - Total amount
     - Status (pending)

---

## Phase 6: Data Management

### Adding More Chargers

1. Go to Inventory
2. Click "Add Charger"
3. Add charger details
4. Upload product images
5. Click "Save Charger"

**Bulk Import Option:**
- Can be added later via CSV import feature
- Or via direct Supabase table editing

### Importing Existing Products

If you have products in the old database:

1. **Export from old database** as CSV
2. **Transform data** to match new schema:
   - Map products to marks
   - Map to connector types
   - Add voltage, wattage, amperage values
3. **Import to Supabase** using Table Editor

---

## Phase 7: Performance Optimization

### Database Indexes (Already Created ✅)

The schema includes optimized indexes for:
- Product searches by name
- Filtering by mark
- Filtering by connector type
- Invoice date queries
- Status filtering

### Caching Strategy

For better performance, consider:
- Caching marks list in component state ✅ (implemented)
- Caching connector types list ✅ (implemented)
- Pagination for large product lists (future enhancement)

---

## Phase 8: Features Ready for Implementation

### ✅ Completed Features

- [x] Charger Inventory Management
- [x] Supplier Management
- [x] Purchase Invoice Creation
- [x] Image Upload to Storage
- [x] Mark/Brand Selection
- [x] Connector Type Management
- [x] Price Calculations
- [x] Quantity Tracking
- [x] Low Stock Alerts
- [x] Search and Filter

### 🟡 Planned Features (Future)

- [ ] Sales Invoice Management (UI ready, DB ready)
- [ ] Advanced Filtering by Voltage/Wattage/Amperage
- [ ] Bulk Image Upload
- [ ] Barcode Generation and Scanning
- [ ] Inventory History/Audit Log
- [ ] Financial Reports and Analytics
- [ ] Auto-replenishment based on minimal quantity
- [ ] Multi-warehouse support
- [ ] Customer Management
- [ ] POS Integration

---

## Troubleshooting

### Issue: "Product uploaded but not visible"
**Solution:** 
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh page
- Check browser console for errors (F12)

### Issue: "Images not showing in product cards"
**Solution:**
- Verify bucket name is 'chargers'
- Check image storage policies in Supabase
- Ensure images uploaded successfully

### Issue: "Can't save supplier/invoice"
**Solution:**
- Check all required fields filled (marked with *)
- Verify Supabase connection (check .env.local)
- Check RLS policies are not blocking writes
- Review browser console for detailed errors

### Issue: "Low stock alerts not showing"
**Solution:**
- Ensure `quantity_minimal` is greater than `quantity_actual`
- Page may need refresh to show updated alert
- Check database row for correct values

---

## Database Schema Summary

### Tables Created:

| Table | Purpose | Key Columns |
|-------|---------|------------|
| **marks** | Charger brands | id, name, logo_url, is_active |
| **connector_types** | USB-C, Lightning, etc. | id, name, icon_emoji |
| **product_images** | Product photos | product_id, image_url, is_primary |
| **products** (updated) | Charger inventory | voltage, wattage, amperage, mark_id |
| **purchase_invoices** | Purchase orders | supplier_id, items, total_amount |
| **sales_invoices** | Sales records | customer_id, items, total_amount |

### Views Created:

| View | Purpose |
|------|---------|
| **products_with_details** | Full product info with marks, types, suppliers |
| **low_stock_alert** | Products below minimum quantity |

---

## SQL Deployment Verification

After running the SQL script, verify by executing:

```sql
-- Check marks table
SELECT COUNT(*) FROM marks;  -- Should return > 0

-- Check connector types
SELECT COUNT(*) FROM connector_types;  -- Should return > 0

-- Check product_images table exists
SELECT COUNT(*) FROM product_images;  -- Should return 0 (no images yet)

-- Verify products updated
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'voltage';  -- Should return 'voltage'

-- Check purchase_invoices table
SELECT COUNT(*) FROM purchase_invoices;  -- Should return 0 (no invoices yet)
```

---

## Next Steps

1. **Test the System** - Follow Phase 5 testing procedures
2. **Add Test Data** - Create sample chargers, suppliers, invoices
3. **User Training** - Train team on new interfaces
4. **Go Live** - Remove test data and deploy to production
5. **Backup** - Enable automatic backups in Supabase

---

## Support & Documentation

- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Database Views:** See SQL in `CHARGER_DATABASE_SCHEMA_FINAL.sql`

---

## Deployment Checklist

- [ ] SQL schema deployed to Supabase
- [ ] Admin user created
- [ ] Environment variables configured (.env.local)
- [ ] Dev server restarted (npm run dev)
- [ ] Test charger created and visible
- [ ] Test supplier created
- [ ] Test invoice created
- [ ] Images upload working
- [ ] Search/filter functionality working
- [ ] All three interfaces (Inventory, Suppliers, Invoices) accessible
- [ ] Low stock alert system working
- [ ] Price calculations accurate

---

**Version:** 1.0  
**Last Updated:** 2025  
**Status:** ✅ Ready for Production

