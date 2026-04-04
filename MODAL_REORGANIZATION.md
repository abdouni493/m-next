# Charger Modal - Modal Section Reorganization

## Changes Made

### 1. **Section Reordering**

The "Add New Charger" modal sections have been reorganized for better user experience:

**NEW ORDER:**
1. 🖼️ **Product Images** (FIRST) - Upload images at the beginning
2. 📦 **Product Information** - Name, description
3. 🏢 **Brand & Connector** - Mark, connector type, supplier selection
4. ⚡ **Electrical Specs** - Voltage, wattage, amperage, model number
5. 📊 **Inventory** - Initial Qty, Current Qty, Min Qty
6. 💳 **Payment** (LAST) - Enhanced with tarification calculation

### 2. **Enhanced Payment Section**

The Payment section now includes:

#### **Tarification Calculation Box** (Read-only display)
Shows automatically calculated values:
- **Unit Price**: The purchase price per unit
- **Quantity**: Current quantity (auto-filled from Initial Qty)
- **Total Cost**: Automatically calculated as `Unit Price × Quantity`

#### **Payment Fields**
- **Unit Price**: Enter the cost per charger unit
- **Amount Paid**: Enter how much has been paid to the supplier

#### **Remaining Balance Display** (Dynamic color-coded)
- **Red background** (🔴) = Money still owed (Balance > 0)
- **Blue background** (🔵) = Fully paid or overpaid (Balance ≤ 0)
- Shows the remaining balance: `(Unit Price × Quantity) - Amount Paid`

#### **Selling Price Field**
- Enter the retail/selling price

### 3. **Automatic Quantity Auto-fill**

When you enter a value in **Initial Qty**, it automatically fills **Current Qty** with the same value:
- User types `10` in Initial Qty
- Current Qty automatically becomes `10`
- User can still manually change Current Qty if needed

### 4. **Real-time Calculations**

All calculations update in real-time as you type:
- Tarification total updates when you change unit price or quantity
- Remaining balance updates when you enter amount paid
- Color coding changes based on balance status

## Calculation Formulas

```
Total Cost = Unit Price × Current Quantity
Remaining Balance = (Unit Price × Current Quantity) - Amount Paid
```

## Color Coding in Payment Section

| Status | Background | Balance Value |
|--------|------------|---------------|
| Unpaid | Red (#FEE2E2) | > 0 |
| Paid/Overpaid | Blue (#DBEAFE) | ≤ 0 |

## User Flow

1. Upload product images
2. Enter product name and description
3. Select brand, connector type, and supplier
4. Fill in electrical specifications
5. Set initial quantity (current quantity auto-fills)
6. Enter unit price and calculate total cost
7. Track how much you've paid and see remaining balance
8. Enter selling price
9. Save charger

## Features

✅ Images upload moved to top (first section)  
✅ Payment section moved to bottom (last section)  
✅ Tarification calculation based on quantity × unit price  
✅ Dynamic balance calculation with color coding  
✅ Real-time updates as user types  
✅ Automatic current quantity fill from initial quantity  
✅ All labels bilingual (English/French)  

## Testing Checklist

- [ ] Images upload section appears first in modal
- [ ] Payment section appears last in modal
- [ ] Entering initial quantity auto-fills current quantity
- [ ] User can override current quantity if needed
- [ ] Entering unit price updates in tarification box
- [ ] Changing quantity updates total cost
- [ ] Amount paid field updates
- [ ] Rest/balance calculates correctly: (price × qty) - paid
- [ ] Balance is red when positive (unpaid)
- [ ] Balance is blue when zero or negative (paid)
- [ ] All values format to 2 decimal places
- [ ] Modal saves correctly with all data

## No Database Changes Needed

The existing database structure supports this reorganization. The `amount_paid` column already exists in the products table from the previous implementation.
