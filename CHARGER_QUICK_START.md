# ⚡ Charger System - Quick Reference Card

## 🚀 Getting Started (5 Minutes)

### 1. Deploy Database Schema
```
1. Open Supabase Dashboard
2. SQL Editor → New Query
3. Copy-paste: CHARGER_DATABASE_SCHEMA_FINAL.sql
4. Click "Run"
5. Wait for success ✅
```

### 2. Restart App
```
Terminal: Ctrl+C (stop current)
Terminal: npm run dev
```

### 3. Login
```
Email: admin@chargers.com
Password: (your admin password)
```

---

## 📋 Main Features

### 🔧 Inventory Management
**Path:** Dashboard → Inventory

**Add Charger:**
1. Click "Add Charger"
2. Fill Name, Brand, Type, Specs
3. Add images (JPG/PNG)
4. Set prices and quantities
5. Save

**Fields:**
- Name * | Mark * | Connector Type *
- Voltage (V) | Wattage (W) | Amperage (A)
- Model Number | Purchase Price * | Selling Price *
- Initial Qty * | Current Qty | Min Qty *
- Images (optional)

**Specs Hints:**
- **Voltage:** 5V, 9V, 12V, 20V, 25V
- **Wattage:** 18W, 20W, 30W, 45W, 65W, 100W
- **Amperage:** 2.0A, 3.6A, 4.0A, 5.0A

---

### 👥 Suppliers
**Path:** Dashboard → Suppliers

**Add Supplier:**
1. Click "Add Supplier"
2. Enter company name
3. Add contact info
4. Save

**Required Fields:**
- Company Name *

**Optional Fields:**
- Contact Person
- Email | Phone | Address
- City | Country
- Tax ID | Bank Account

---

### 📑 Purchase Invoices
**Path:** Dashboard → Purchase Invoices

**Create Invoice:**
1. Click "New Invoice"
2. Select Supplier *
3. Set Invoice Date *
4. Search for chargers
5. Click product from dropdown
6. Set Quantity, Price
7. Click "Add Item"
8. Review totals
9. Add discount (optional)
10. Save

**Status Options:**
- Draft (new)
- Pending (waiting payment)
- Paid (completed)
- Overdue (past due date)

---

## 🎯 Key Shortcuts

| Action | Keys |
|--------|------|
| Search Products | Ctrl+F (in page) |
| Add New Item | Ctrl+N (or click button) |
| Save Form | Ctrl+S or click Save |
| Refresh Data | F5 |

---

## 📊 Data Entry Tips

### Pricing Examples
```
USB-C 20W Charger:
├─ Purchase: $8.50
├─ Selling: $18.99
└─ Margin: 123% profit

Lightning Charger:
├─ Purchase: $7.20
├─ Selling: $15.99
└─ Margin: 122% profit
```

### Quantity Management
```
Product: USB-C 20W
├─ Initial Qty: 50 (ordered)
├─ Current Qty: 45 (on hand)
└─ Min Qty: 10 ⚠️ Alert when below

Alert Triggers:
Current (45) > Min (10) = ✅ OK
Current (8) ≤ Min (10) = 🚨 LOW STOCK
```

---

## 🖼️ Image Management

### Supported Formats
- JPG, JPEG, PNG
- Max file size: 10 MB
- Recommended: 1200x1200px

### How to Upload
1. Add Charger
2. Click image upload area
3. Select multiple images
4. First image = primary (shown in list)
5. Others in detail view

### Storage Location
- Bucket: "chargers"
- Auto-generated: filename with timestamp
- Public URL: auto-generated for display

---

## 🔍 Search & Filter

### Inventory Search
- Search by: Name, Mark/Brand, Description
- Filter by: Mark dropdown
- Result: Real-time as you type

### Supplier Search
- Search by: Name, Email, City
- Result: Live filtering

### Invoice Search
- Search by: Invoice Number, Supplier
- Filter by: Status

---

## ⚙️ Database Setup (Technical)

### Tables
```
marks ..................... Charger brands
connector_types ........... USB-C, Lightning, etc.
products (updated) ........ Chargers with specs
product_images ............ Storage links
purchase_invoices ......... Buy orders
sales_invoices ............ Sales records
```

### Key Fields in Products
```
✅ Standard: name, description, barcode
✅ Charger-specific:
   - voltage (5-240V)
   - wattage (18-240W)
   - amperage (2-10A)
   - connector_type_id
   - mark_id
   - model_number
✅ Inventory:
   - quantity_actual
   - quantity_minimal
   - quantity_initial
```

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Images not showing | Clear cache (Ctrl+Shift+Del) + Refresh (F5) |
| Can't save charger | Check all * required fields filled |
| Product not in search | Verify product is_active = true in DB |
| Low stock not alerting | Check quantity_actual ≤ quantity_minimal |
| Supplier not appearing | Verify is_active = true in DB |
| Invoice calculation wrong | Reload page after discount change |

---

## 📱 Keyboard Shortcuts (Browser)

```
F12 ........... Open Developer Tools (debug errors)
Ctrl+F ....... Find on page
Ctrl+Shift+Delete ... Clear cache/cookies
F5 ........... Refresh page
Escape ....... Close modal dialogs
Tab .......... Navigate form fields
Enter ........ Submit form
```

---

## 💡 Best Practices

### Inventory
- ✅ Set realistic minimum quantities
- ✅ Upload clear product images
- ✅ Keep model numbers accurate
- ✅ Update prices regularly

### Suppliers
- ✅ Save complete contact info
- ✅ Keep Tax ID current
- ✅ Update payment methods

### Invoices
- ✅ Set due dates (30-60 days typical)
- ✅ Add notes for special conditions
- ✅ Track payment status
- ✅ Archive paid invoices

---

## 📞 Support

**Database Issues:** Check Supabase Dashboard
- URL: https://app.supabase.com
- Select project: pzzngzaljrfrbteclexi

**Connection Issues:** 
- Restart: npm run dev
- Check: .env.local has correct credentials

**Feature Requests:**
- Contact development team
- Include: Current vs. desired behavior

---

## 🎓 Tutorial Videos

Would be helpful to create:
1. Adding your first charger (3 min)
2. Managing suppliers (2 min)
3. Creating purchase invoice (4 min)
4. Bulk image upload (2 min)
5. Invoice filtering & search (2 min)

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Can login with admin account
- [ ] Inventory page loads
- [ ] Can add a charger
- [ ] Image upload works
- [ ] Charger appears in list
- [ ] Can add a supplier
- [ ] Can create an invoice
- [ ] Prices calculate correctly
- [ ] Low stock alerts trigger
- [ ] Search/filter works

---

## 📊 Typical Workflow

```
Daily:
  1. Check low stock alerts (Inventory page)
  2. Create purchase invoices for reorders
  3. Update sales/quantities

Weekly:
  1. Review supplier payments
  2. Analyze sales reports
  3. Plan new products

Monthly:
  1. Financial reconciliation
  2. Inventory audit
  3. Supplier performance review
```

---

## 🔗 Quick Links

| Item | Link |
|------|------|
| Supabase Project | https://app.supabase.com/project/pzzngzaljrfrbteclexi |
| App Local | http://localhost:5000 |
| Storage Bucket | chargers |
| Documentation | CHARGER_IMPLEMENTATION_GUIDE.md |

---

**Last Updated:** 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready

Need help? Check the full guide: **CHARGER_IMPLEMENTATION_GUIDE.md**
