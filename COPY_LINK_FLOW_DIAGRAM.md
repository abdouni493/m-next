# Copy Link Feature - Flow Diagram

## 🔄 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCT VIEWING (Website Manager)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Product Card                                                             │
│  ┌──────────────────────────────────┐                                    │
│  │ 📱 Solar Charger 50W             │                                    │
│  │ Brand: XYZ                       │                                    │
│  │ Price: 3000 DZD                 │                                    │
│  │ Discount: 17% (2500 DZD)        │                                    │
│  ├──────────────────────────────────┤                                    │
│  │ [View] [Show/Hide] [📋 Copy] [×]│                                    │
│  └──────────────────────────────────┘                                    │
│                   ↓                                                        │
│              User Clicks                                                   │
│          "📋 Copy Link Button"                                            │
│                   ↓                                                        │
│  Toast: "Link copied - Product will be selected automatically"            │
│  Clipboard: https://store.com/order?product_id=550e8400-e29b-41d4-a716  │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         LINK SHARING                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  User pastes link to:                                                     │
│  ┌──────────────┐  ┌──────────┐  ┌───────┐  ┌──────────┐  ┌──────────┐  │
│  │  WhatsApp 💬  │  │ Email 📧 │  │ SMS 📞 │  │ Twitter 𝕏 │  │ Others...│  │
│  └──────────────┘  └──────────┘  └───────┘  └──────────┘  └──────────┘  │
│                                                                            │
│  Friend/Customer receives link                                            │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    LINK CLICK (Customer)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Customer clicks link                                                     │
│     ↓                                                                      │
│  Browser opens: https://store.com/order?product_id=550e8400-e29b...      │
│     ↓                                                                      │
│  WebsiteOrder.tsx loads                                                   │
│     ↓                                                                      │
│  useEffect hook runs:                                                     │
│  1. Read URL parameters                                                   │
│  2. Get product_id from URL                                               │
│  3. Fetch all products (offers + special offers)                          │
│  4. Search for product_id match                                           │
│  5. Call addProductToCart()                                               │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              PRODUCT AUTO-SELECTION & CART ADDITION                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  addProductToCart() function:                                             │
│                                                                            │
│  ┌─ Get existing cart from localStorage                                   │
│  │                                                                         │
│  ├─ Create cart item from product:                                        │
│  │  {                                                                      │
│  │    id: "product-xyz",                                                  │
│  │    product_id: "product-xyz",                                          │
│  │    product_name: "Solar Charger 50W",                                  │
│  │    product_image: "https://...",                                       │
│  │    price: 2500,                                                        │
│  │    quantity: 1,                                                        │
│  │    discount_percentage: 17                                             │
│  │  }                                                                      │
│  │                                                                         │
│  ├─ Check if product already in cart                                      │
│  │  └─ Yes: Update quantity ← quantity += 1                               │
│  │  └─ No:  Add new item                                                  │
│  │                                                                         │
│  ├─ Save updated cart to localStorage                                     │
│  │                                                                         │
│  └─ Dispatch 'cartUpdated' event                                          │
│     └─ Navbar updates cart count                                          │
│        └─ Shows badge with item count                                     │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  ORDER PAGE - PRODUCT SELECTED                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 🛒 ORDER INTERFACE                                               │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │                                                                    │   │
│  │ ✅ SELECTED PRODUCT:                                             │   │
│  │ ┌────────────────────────────────────────────────────────────┐   │   │
│  │ │ [Image] Solar Charger 50W                                  │   │   │
│  │ │         Brand: XYZ                                         │   │   │
│  │ │         Original Price: 3000 DZD                          │   │   │
│  │ │         Offer Price: 2500 DZD (17% discount)             │   │   │
│  │ │         Quantity: [1] ← Can change                         │   │   │
│  │ └────────────────────────────────────────────────────────────┘   │   │
│  │                                                                    │   │
│  │ 📋 CUSTOMER INFO:                                                │   │
│  │ ┌────────────────────────────────────────────────────────────┐   │   │
│  │ │ Full Name:      [________________]                          │   │   │
│  │ │ Phone:          [________________]                          │   │   │
│  │ │ Address:        [________________]                          │   │   │
│  │ │ Wilaya:         [Select Wilaya ▼]                          │   │   │
│  │ │ Delivery Type:  ○ Bureau  ○ Domicile                       │   │   │
│  │ └────────────────────────────────────────────────────────────┘   │   │
│  │                                                                    │   │
│  │ TOTAL: 2500 DZD (1 × 2500)                                        │   │
│  │                                                                    │   │
│  │ [←Back]  [Place Order →]                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Status: ✅ Ready to checkout                                            │
│  Cart: 🛒 1 item                                                          │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      CUSTOMER ACTIONS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Option 1: Adjust Quantity                                                │
│  [1] → [5]                                                                │
│  TOTAL: 12500 DZD (5 × 2500)                                             │
│                                                                            │
│  Option 2: Continue Shopping                                              │
│  [Add More Products]                                                      │
│  Cart now has: 6 items                                                    │
│                                                                            │
│  Option 3: Place Order                                                    │
│  Fill customer info → Click [Place Order →]                             │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   ORDER CONFIRMATION                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ✅ ORDER CREATED SUCCESSFULLY                                            │
│                                                                            │
│  Order ID: #12345                                                         │
│  Date: April 14, 2026                                                     │
│  Customer: Ahmed Mohamed                                                  │
│  Phone: +213 6XX XXX XXX                                                  │
│  Address: 123 Rue Street, Alger                                           │
│  Delivery: À Domicile                                                     │
│                                                                            │
│  Items:                                                                    │
│  1. Solar Charger 50W × 1  →  2500 DZD                                    │
│                                                                            │
│  TOTAL: 2500 DZD                                                          │
│  Delivery: 300 DZD                                                        │
│  FINAL PRICE: 2800 DZD                                                    │
│                                                                            │
│  Status: PENDING (Awaiting confirmation)                                  │
│                                                                            │
│  Cart cleared ✅                                                          │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Comparison: Before vs After

### BEFORE (Old Method)
```
1. Customer views website
2. Searches for product manually
3. Clicks "Add to Cart"
4. Proceeds to checkout
5. Fills customer info
6. Places order

⏱️ Time: ~5-10 minutes
🔍 Friction: High (must search)
```

### AFTER (With Copy Link Feature)
```
1. Store owner clicks "Copy Link"
2. Shares link via WhatsApp/Email
3. Customer clicks link
4. Product is auto-selected ✅
5. Product in cart ✅
6. Proceeds to checkout
7. Fills customer info
8. Places order

⏱️ Time: ~2-3 minutes
🔍 Friction: Low (pre-selected)
```

---

## 📊 Key Differences

| Aspect | Old Way | New Way |
|--------|---------|---------|
| Link Format | `?offer=id` | `/order?product_id=id` |
| Page Navigation | Root page | Order page directly |
| Product Selection | Manual | Automatic ✅ |
| Cart Addition | Manual | Automatic ✅ |
| User Steps | 5-6 steps | 3-4 steps |
| Time to Order | ~10 min | ~3 min |
| Friction | High | Low |

---

## 🎯 Use Cases

### Use Case 1: WhatsApp Marketing
```
Store sends: "Check out this deal! https://store.com/order?product_id=xyz"
Customer receives → Clicks → Product selected → Checkout → Order placed
```

### Use Case 2: Email Campaign
```
Store sends: "Last 10 units available! https://store.com/order?product_id=abc"
Customer receives → Clicks → Product selected → Quick purchase
```

### Use Case 3: Social Media
```
Post: "Hot deal today: https://store.com/order?product_id=def"
Customer shares → Friends click → Product selected → Viral sales
```

### Use Case 4: Direct Messaging
```
Sales rep: "This charger is perfect for you! https://store.com/order?product_id=ghi"
Customer: "Thanks! Ordering now..."
```

---

**Flow Diagram Complete** ✅
**Last Updated:** April 14, 2026
