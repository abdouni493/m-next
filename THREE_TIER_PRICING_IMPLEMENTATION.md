# Three-Tier Pricing System & Client Management - Implementation Guide

## 📋 Summary of Changes Made

### ✅ **1. Database Schema Updates** 
**File**: `ADD_THREE_TIER_PRICING_SYSTEM.sql`

Created comprehensive SQL migration that includes:
- ✅ Added `selling_price_1`, `selling_price_2`, `selling_price_3` to `products` table
- ✅ Added `price_tier`, `client_type`, `notes` columns to `customers` table
- ✅ Added `price_tier` column to `cart_items`, `invoice_items`, `order_items` tables
- ✅ Created `price_tiers` table with predefined tiers (Normal, Revendeur, Gros)
- ✅ Created `client_summary` view for easy client statistics
- ✅ Created `client_purchase_history` view for tracking purchases
- ✅ Created function `get_product_price_for_client()` to calculate prices by tier
- ✅ Created trigger `sync_selling_price_trigger()` to keep selling_price in sync with selling_price_1

**To apply**: Run the SQL file in your Supabase SQL editor.

---

### ✅ **2. Clients Management Interface**
**File**: `src/pages/Clients.tsx`

New complete interface for managing clients with:
- ✅ Create new clients with name, phone, email
- ✅ Select price tier (1=Normal, 2=Revendeur, 3=Gros) 
- ✅ Client type selection (retail, wholesale, reseller)
- ✅ Edit client details
- ✅ Delete clients with confirmation
- ✅ View purchase history in modal
- ✅ Display client statistics (total purchases, total spent, last purchase date)
- ✅ Search by name or phone with live filtering

**Features**:
- Beautiful card-based UI showing client stats
- Price tier color-coded badges
- Purchase history timeline
- Form validation for required fields
- Toast notifications for actions

---

### ✅ **3. Inventory Interface Updates**
**File**: `src/pages/Inventory.tsx`

Updated product management with:
- ✅ Three-tier selling price inputs
  - Normal Price (100%) - selling_price_1 (Blue)
  - Revendeur Price (80%) - selling_price_2 (Amber)  
  - Gros Price (60%) - selling_price_3 (Green)
- ✅ Updated form state to include selling_price_1, selling_price_2, selling_price_3
- ✅ All form reset calls updated
- ✅ Database save operations updated to persist all three prices
- ✅ Form field labels updated to reflect price tier system

**Changes Made**:
- Added three price input fields with color-coded sections
- Each price shows the discount percentage below
- Prices are synchronized with backward-compatible `selling_price` field
- Form validation ensures correct data types

---

### ✅ **4. Sidebar Navigation**
**File**: `src/components/Layout/Sidebar.tsx`

- ✅ Added "Clients" menu item (👥) with route `/clients`
- ✅ Position: Between Inventory and Purchase Invoices

---

### ✅ **5. App Routing**
**File**: `src/App.tsx`

- ✅ Imported Clients component
- ✅ Added route: `<Route path="clients" element={<Clients />} />`

---

## 🚀 **Remaining Implementation Tasks**

### **TASK 1: Update Purchase Invoices Interface** 
**Location**: `src/pages/PurchaseInvoices.tsx`

**Changes Needed**:
```typescript
// 1. Update FormData interface to include three prices
interface FormData {
  selling_price_1: string;
  selling_price_2: string;
  selling_price_3: string;
  // ... other fields
}

// 2. Update form state initialization
const [formData, setFormData] = useState<FormData>({
  selling_price_1: '',
  selling_price_2: '',
  selling_price_3: '',
  // ... other fields
});

// 3. When inserting into database, include all three prices
const purchaseInvoiceData = {
  // ... existing fields
  items: JSON.stringify({
    product_id: selectedProduct.id,
    selling_price_1: parseFloat(formData.selling_price_1),
    selling_price_2: parseFloat(formData.selling_price_2),
    selling_price_3: parseFloat(formData.selling_price_3),
    // ... other item data
  })
};

// 4. Add three price input fields in the form UI (before Submit button)
// Use the same color-coded design as Inventory.tsx
```

**Visual Layout**:
```
┌─────────────────────────────────────────────────┐
│ 🏷️ Selling Prices (Three-Tier)                 │
├─────────────────────────────────────────────────┤
│ ┌──────────────┬──────────────┬──────────────┐  │
│ │ 💰 Normal    │ 🔄 Revendeur │ 📦 Gros      │  │
│ │ [1000.00]    │ [800.00]     │ [600.00]     │  │
│ │ 100%         │ -20%         │ -40%         │  │
│ └──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────┘
```

---

### **TASK 2: Update POS Interface for Client Search**
**Location**: `src/pages/POS.tsx` or `src/pages/POS_NEW.tsx`

**Changes Needed**:
```typescript
// 1. Add client search/selection state
const [selectedClient, setSelectedClient] = useState<any | null>(null);
const [clientSearchTerm, setClientSearchTerm] = useState('');
const [filteredClients, setFilteredClients] = useState<any[]>([]);
const [showClientSearch, setShowClientSearch] = useState(false);

// 2. Load clients on component mount
useEffect(() => {
  loadClients();
}, []);

const loadClients = async () => {
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('is_active', true);
  setFilteredClients(data || []);
};

// 3. Auto-search implementation
useEffect(() => {
  if (clientSearchTerm.trim()) {
    const filtered = filteredClients.filter(client =>
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.phone.includes(clientSearchTerm)
    );
    setFilteredClients(filtered);
  } else {
    loadClients();
  }
}, [clientSearchTerm]);

// 4. When client is selected, recalculate cart prices
const selectClient = (client: any) => {
  setSelectedClient(client);
  setShowClientSearch(false);
  recalculateCartWithClientPriceTier(client.price_tier);
};

// 5. Function to recalculate cart with client's price tier
const recalculateCartWithClientPriceTier = (priceTier: number) => {
  const updatedCart = cartItems.map(item => {
    const priceField = priceTier === 1 ? 'selling_price_1' 
                     : priceTier === 2 ? 'selling_price_2'
                     : 'selling_price_3';
    return {
      ...item,
      price_per_unit: item[priceField] || item.price_per_unit,
      price_tier: priceTier
    };
  });
  updateCart(updatedCart);
};

// 6. Add client search UI in POS form (at the top)
// Show:
// - Search input (by name or phone)
// - Auto-complete dropdown with matching clients
// - Selected client badge showing price tier
// - "Clear client" button
```

**UI Layout**:
```
┌─────────────────────────────────────────────────┐
│ 🔍 SEARCH CLIENT                               │
│ ┌───────────────────────────────────────────┐  │
│ │ Search by name or phone...                │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ Suggestions:                                    │
│ ├─ Ahmed Smith (📱 555-1234) [Normal]        │
│ ├─ Mohammed Inc (📱 555-5678) [Revendeur]    │
│ └─ Trading Co (📱 555-9999) [Gros]           │
│                                                 │
│ Selected: 👤 Ahmed Smith - Tier 1 (Normal)    │
│ [✖️ Clear]                                    │
└─────────────────────────────────────────────────┘
```

---

### **TASK 3: Update Cart Display in POS**
**Location**: `src/pages/POS.tsx`

Show which price tier is being used:
```
Cart Item Row:
[Image] Product Name
Price: 1000 DA (Normal Tier) / 800 DA (Revendeur) / 600 DA (Gros)
Qty: 2
Subtotal: 2000 DA ✓ (or 1600 or 1200)
```

---

## 📊 **Database Schema Reference**

### **Products Table (Updated Columns)**
```sql
selling_price_1 NUMERIC -- Normal price (100%)
selling_price_2 NUMERIC -- Revendeur price (-20%)
selling_price_3 NUMERIC -- Gros price (-40%)
selling_price NUMERIC  -- Synced with selling_price_1 (backward compatible)
```

### **Customers Table (New Columns)**
```sql
price_tier INTEGER (1, 2, or 3) DEFAULT 1
client_type VARCHAR (retail, wholesale, reseller)
notes TEXT
```

### **Price Tiers Table**
```
ID | Name       | Description                  | Discount %
1  | Normal     | Normal Selling Price         | 0%
2  | Revendeur  | Reseller Price               | 20%
3  | Gros       | Wholesale Price              | 40%
```

---

## 🎯 **Feature Workflow**

### **Adding a Product**:
1. Admin goes to Inventory → Add Charger
2. Fills in product details
3. Enters three prices:
   - Normal: 1000 DA
   - Revendeur: 800 DA (auto-calculated as -20%)
   - Gros: 600 DA (auto-calculated as -40%)
4. Saves product

### **Creating a Client**:
1. Admin goes to Clients → Add New Client
2. Enters: Name, Phone, Email (optional)
3. Selects Price Tier: Normal / Revendeur / Gros
4. Selects Client Type: Retail / Wholesale / Reseller
5. Adds optional notes
6. Saves client

### **Using POS with Client**:
1. Cashier starts POS
2. **NEW**: Searches and selects a client (by name or phone)
3. Adds products to cart
4. Prices automatically adjust based on client's tier:
   - If client tier is 2 (Revendeur) → all products use selling_price_2
   - If client tier is 3 (Gros) → all products use selling_price_3
5. Invoice generates with correct prices
6. Sale is recorded with client reference

### **Viewing Client History**:
1. Admin goes to Clients
2. Clicks "History" button on any client card
3. Modal shows all purchases by that client
4. Displays invoice numbers, dates, amounts, status

---

## 🔧 **API Functions Created**

### **PostgreSQL Function**:
```sql
get_product_price_for_client(product_id UUID, client_id UUID) → NUMERIC
```
**Usage**: Select the correct price for a product based on client's tier

### **Views Created**:
1. `client_summary` - Stats for all clients
2. `client_purchase_history` - Purchase records with items

---

## ✨ **Testing Checklist**

- [ ] SQL migration runs without errors
- [ ] Inventory page shows three price inputs
- [ ] Can create/edit products with three prices
- [ ] Clients page appears in sidebar
- [ ] Can create new clients
- [ ] Can select clients and view their details
- [ ] Can see purchase history for a client
- [ ] Can edit/delete clients
- [ ] POS page has client search
- [ ] Client selection changes cart prices
- [ ] Invoices save with correct pricing based on client tier

---

## 📝 **Notes**

- The `selling_price` column is kept for backward compatibility and is auto-synced with `selling_price_1`
- A trigger ensures `selling_price = selling_price_1` when products are updated
- Default discounts are 20% for Revendeur and 40% for Gros (can be customized)
- All three prices must be set when creating/editing products
- Clients inherit one price tier that applies to all their purchases

---

## 🚀 **Next Steps**

1. ✅ Run `ADD_THREE_TIER_PRICING_SYSTEM.sql` in Supabase
2. ✅ Verify Inventory page shows three price inputs
3. ✅ Verify Clients page is accessible
4. ⏳ Update PurchaseInvoices.tsx with three prices
5. ⏳ Update POS.tsx with client search and price recalculation
6. ⏳ Test complete workflow end-to-end
7. ⏳ Deploy to production

---

**Created**: 2026-04-06
**Status**: Database + Inventory + Clients interfaces complete
**Remaining**: PurchaseInvoices + POS updates
