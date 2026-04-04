# Quick Setup Guide - Supplier Selection & Payment Tracking

## What Was Added?

Added to the **"Add New Charger"** modal in Inventory:

1. **Supplier Dropdown** - Select which supplier the charger is from
2. **Amount Paid Field** - Track how much has been paid to the supplier
3. **Rest/Balance Display** - Automatically shows how much is still owed (or overpaid)

## How to Use

### 1. Create a New Charger

Click the "Add New Charger" button in the Inventory interface.

### 2. Fill in Basic Info
- Product Name *
- Description
- Mark *
- Connector Type *

### 3. **NEW: Select Supplier**
- Choose from dropdown list of existing suppliers
- This is optional (leave blank if not applicable)

### 4. **NEW: Enter Payment Info**
- **Purchase Price** * - Cost of the charger
- **Amount Paid** - How much you've paid so far
- **Rest/Balance** - Automatically calculated:
  - Red box = Money still owed
  - Green box = Already paid in full (or overpaid)

### 5. Complete Remaining Sections
- Electrical Specs
- Inventory
- Images
- Selling Price
- Save

## Before It Works

**IMPORTANT:** Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Add the columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
```

## Color Guide

| Section | Color | Purpose |
|---------|-------|---------|
| 🏢 Supplier | Indigo | Select supplier from dropdown |
| 💳 Payment | Rose/Pink | Enter purchase price & amount paid |
| Rest (Red) | Red background | Shows unpaid balance |
| Rest (Green) | Green background | Shows fully paid/overpaid |

## Formula

```
Rest/Balance = Purchase Price - Amount Paid
```

- If Rest > 0 → Red (still owe money)
- If Rest ≤ 0 → Green (paid in full or overpaid)

## Examples

| Purchase | Amount Paid | Rest | Color |
|----------|-------------|------|-------|
| $100 | $0 | $100 | 🔴 Red |
| $100 | $50 | $50 | 🔴 Red |
| $100 | $100 | $0 | 🟢 Green |
| $100 | $120 | -$20 | 🟢 Green |

## Troubleshooting

### Suppliers dropdown is empty
- Make sure suppliers are created in the Suppliers interface
- Check that suppliers are marked as active (is_active = true)

### Can't save charger with amount_paid
- Run the SQL migration to add the column to database
- Check database connection is working

### Rest calculation not updating
- Make sure you enter both Purchase Price and Amount Paid
- Clear the form and try again if there are issues

## Bilingual Support

The interface supports English and French. Labels automatically translate based on your language setting:
- Supplier / Fournisseur
- Purchase Price / Prix d'Achat
- Amount Paid / Montant Payé
- Rest/Balance / Reste/Solde
