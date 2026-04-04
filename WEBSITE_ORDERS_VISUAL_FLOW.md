# Website Orders Flow - Complete Visual Guide

## 🔄 Order Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER JOURNEY                                                │
└─────────────────────────────────────────────────────────────────┘

1. PRODUCT SEARCH & SELECTION
   ├─ User opens: /website-shop/order
   ├─ Product search panel appears
   ├─ User searches for charger (e.g., "teste")
   └─ User selects product from list
       └─ Search panel closes
       └─ Product summary displays

2. PRODUCT REVIEW
   ├─ Charger image & name displayed
   ├─ Brand, description shown
   ├─ Specs visible: Voltage, Wattage, Amperage, Type
   ├─ Original price shown (crossed out)
   ├─ Final price shown (green highlight)
   ├─ Quantity selector (+ / -)
   ├─ Total calculation updates
   └─ "Change Product" button available

3. ORDER FORM COMPLETION
   ├─ Full Name: "Youssef Abdouni"
   ├─ Phone: "+213791366612"
   ├─ Address: "street taher yakoubi"
   ├─ Wilaya: "Béchar" (dropdown)
   ├─ Delivery Type: "À Domicile" or "Au Bureau"
   └─ All fields marked as required (*)

4. ORDER SUBMISSION
   ├─ User clicks "Commander" button
   ├─ Form validation checks
   └─ ✅ IF VALID:
       ├─ [NEW] Save order to orders table
       │   └─ customer_name, customer_phone, etc.
       ├─ [NEW] Save items to order_items table
       │   └─ product_id, quantity, price, etc.
       └─ Show thank you page
   └─ ❌ IF INVALID:
       └─ Show error alert

5. THANK YOU PAGE
   ├─ Animated celebrations
   ├─ Order number: #39419945
   ├─ All customer details displayed
   ├─ Product details + quantity
   ├─ Total amount: 2000.00 DZD
   ├─ Message: "Notre équipe vous contactera..."
   ├─ "🏠 Accueil" button → /website-shop
   ├─ "🛍️ Continuer les Achats" button → /website-shop/offers
   ├─ NO auto-redirect (manual control)
   └─ User can stay to read and take screenshot

┌─────────────────────────────────────────────────────────────────┐
│ DATABASE STORAGE - [NEW]                                        │
└─────────────────────────────────────────────────────────────────┘

orders table
├─ id: 550e8400-e29b-41d4-a716-446655440000
├─ customer_name: "Youssef Abdouni"
├─ customer_phone: "+213791366612"
├─ customer_address: "street taher yakoubi"
├─ customer_wilaya: "Béchar"
├─ delivery_type: "domicile"
├─ status: "pending" ← Can change to: confirmed, on_delivery, delivered, cancelled
├─ total_price: 2000.00
├─ final_price: 2000.00
├─ created_at: 2026-04-03 10:30:00
└─ updated_at: 2026-04-03 10:30:00

order_items table
├─ id: 660e8400-e29b-41d4-a716-446655440001
├─ order_id: 550e8400-e29b-41d4-a716-446655440000 ← Links to order
├─ product_id: 770e8400-e29b-41d4-a716-446655440002
├─ product_name: "teste"
├─ product_image: "https://..."
├─ product_mark: "Brand Name"
├─ quantity: 1
├─ price_per_unit: 2000.00
├─ line_total: 2000.00
└─ from_offer: true

┌─────────────────────────────────────────────────────────────────┐
│ ADMIN MANAGEMENT - Commands Page                                │
└─────────────────────────────────────────────────────────────────┘

Commands.tsx: getOrders() queries orders table
  ↓
📦 Gestion des Commandes
  ├─ Search bar: Filter by name/phone
  ├─ Status tabs:
  │   ├─ All
  │   ├─ Pending (🔴 NEW ORDERS)
  │   ├─ Confirmed (🟡 READY)
  │   ├─ On Delivery (🟠 IN TRANSIT)
  │   ├─ Delivered (🟢 COMPLETE)
  │   └─ Cancelled (⚫ CANCELLED)
  │
  └─ Order Cards (FOR EACH ORDER):
      ├─ 👤 Customer: "Youssef Abdouni"
      ├─ 📞 Phone: "+213791366612"
      ├─ 📍 Address: "street taher yakoubi"
      ├─ 🗺️  Wilaya: "Béchar"
      ├─ 🚚 Delivery: "À Domicile"
      ├─ 🛍️  Product: "teste" (image shown)
      ├─ 💰 Total: "2000.00 DZD"
      ├─ 📅 Created: "2026-04-03 10:30"
      └─ Action Buttons:
          ├─ "📋 View Details" → Modal with full info
          ├─ "✏️ Edit" → Modify customer/product
          ├─ "🗑️ Delete" → Delete with confirmation
          ├─ "✅ Confirm" → If status = pending
          ├─ "🚚 Start Delivery" → If status = confirmed
          ├─ "📦 Finalize" → If status = on_delivery
          │    └─ Add to revenue ✅
          │    └─ Deduct from inventory ✅
          └─ "❌ Cancel" → Any status

┌─────────────────────────────────────────────────────────────────┐
│ ORDER STATUS LIFECYCLE                                          │
└─────────────────────────────────────────────────────────────────┘

pending
  │
  ├─ [User created order] ✅
  │
  └─ Click "✅ Confirm"
       ↓
   confirmed
      │
      ├─ [Order confirmed by admin]
      │
      └─ Click "🚚 Start Delivery"
           ↓
       on_delivery
          │
          ├─ [Order on its way to customer]
          │
          └─ Click "📦 Finalize"
               ↓
           delivered
              │
              ├─ [Order delivered to customer]
              ├─ Revenue: +2000.00 DZD
              ├─ Inventory: -1 unit
              └─ [Complete]

       OR at any point:
           └─ Click "❌ Cancel"
               ↓
           cancelled
              │
              └─ [Order cancelled, inventory restored]

┌─────────────────────────────────────────────────────────────────┐
│ DATABASE QUERIES FOR TESTING                                    │
└─────────────────────────────────────────────────────────────────┘

-- 1. See all orders
SELECT * FROM public.orders ORDER BY created_at DESC;

-- 2. See order with items
SELECT 
  o.*, 
  oi.product_name, 
  oi.quantity,
  oi.price_per_unit
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
ORDER BY o.created_at DESC;

-- 3. Count orders by status
SELECT status, COUNT(*) FROM public.orders GROUP BY status;

-- 4. Total revenue
SELECT SUM(final_price) FROM public.orders WHERE status = 'delivered';

-- 5. Orders by wilaya
SELECT customer_wilaya, COUNT(*) FROM public.orders GROUP BY customer_wilaya;

┌─────────────────────────────────────────────────────────────────┐
│ KEY IMPROVEMENTS                                                │
└─────────────────────────────────────────────────────────────────┘

✅ Orders NOW saved to database
✅ Orders NOW appear in Admin Commands
✅ Admin can NOW manage order status
✅ Revenue tracking NOW possible
✅ Customer data NOW stored for follow-up
✅ Product selection NOW flexible (search before ordering)
✅ Thank you page NOW persists (manual control, no auto-redirect)
✅ Multi-language support (AR/FR)
✅ Mobile responsive
✅ Dark mode compatible

┌─────────────────────────────────────────────────────────────────┐
│ RELATED FILES                                                   │
└─────────────────────────────────────────────────────────────────┘

Modified:
- src/pages/WebsiteOrder.tsx
  └─ Added order saving to handlePlaceOrder()

Already working:
- src/pages/Commands.tsx
  └─ Already queries orders table correctly
  
- src/lib/supabaseClient.ts
  └─ createOrder() function already exists
  └─ getOrders() function already exists

Database:
- orders table (already exists)
- order_items table (already exists)
