<!-- filepath: /WILAYA_PRICING_MANAGEMENT_GUIDE.md -->

# 💰 Wilaya-Based Pricing Management System - Complete Guide

## 📋 Overview

This feature allows you to set different delivery prices for each Algerian wilaya (province) for each delivery agency. Each wilaya can have different prices for:
- **🏠 Home Delivery (À Domicile)**
- **🏢 Office Delivery (Au Bureau)**

---

## ✨ Key Features

### 1. **Per-Wilaya Price Configuration**
- Set different prices for each of the 58 Algerian wilayas
- Independent pricing for home and office delivery types
- Override default agency prices on a per-wilaya basis

### 2. **Automatic Price Fallback**
- If no wilaya-specific price is configured, uses the agency's default price
- Seamless fallback system ensures prices are always available

### 3. **Real-time Updates**
- Changes apply immediately to the website
- Customers see the correct price for their selected wilaya
- No page refresh needed

### 4. **Multi-language Support**
- Arabic (العربية)
- French (Français)
- English

---

## 🚀 How to Use

### Step 1: Navigate to Delivery Management
1. Go to **Website Manager** (Gestion Web)
2. Click on the **Delivery Management** tab
3. You'll see all your delivery agencies as cards

### Step 2: Open Wilaya Pricing Management
1. Find the delivery agency card where you want to add wilaya pricing
2. Click the **💰 Manage Prices** button (first button in the action row)
3. A modal dialog will open showing:
   - Current agency name
   - List of all 58 Algerian wilayas
   - Currently configured wilaya prices

### Step 3: Add or Edit Wilaya Prices
**To add a new wilaya price:**
1. Select a wilaya from the dropdown list
2. Enter the **Home Delivery price** (🏠)
3. Enter the **Office Delivery price** (🏢)
4. Click the **➕ Add** button

**To edit an existing wilaya price:**
1. Find the wilaya in the "Configured Wilayas" list
2. Click the **✏️ Edit** button next to it
3. The fields will auto-populate with current values
4. Modify the prices as needed
5. Click the **✏️ Update** button

**To delete a wilaya price:**
1. Find the wilaya in the "Configured Wilayas" list
2. Click the **🗑️ Delete** button
3. The wilaya-specific pricing will be removed
4. The system will revert to using the agency's default price

### Step 4: Monitor Configured Wilayas
The "Configured Wilayas" section shows:
- **Wilaya name** (province)
- **Home delivery price** (🏠)
- **Office delivery price** (🏢)
- **Edit** and **Delete** buttons for each

---

## 📊 How Customers See It

### On the Order Page

1. **Customer selects a wilaya** (e.g., "Algiers")
2. **Customer selects delivery type** (Bureau or Domicile)
3. **System automatically fetches the correct price:**
   - If wilaya-specific price exists → Use it
   - If not → Use agency default price
4. **Price appears in the summary:**
   ```
   Products:    1,500.00 DZD
   Delivery:      250.00 DZD (Algiers - Home)
   ━━━━━━━━━━━━━━━━━━━━━━━
   TOTAL:       1,750.00 DZD
   ```

---

## 🗺️ List of All Algerian Wilayas

The system supports all 58 Algerian wilayas:

```
1. Adrar
2. Chlef
3. Laghouat
4. Oum El Bouaghi
5. Batna
6. Béjaïa
7. Biskra
8. Béchar
9. Blida
10. Bouira
11. Tamanrasset
12. Tébessa
13. Tiaret
14. Tizi Ouzou
15. Algiers
16. Djelfa
17. Jijel
18. Sétif
19. Saïda
20. Skikda
21. Sidi Bel Abbès
22. Annaba
23. Guelma
24. Constantine
25. Médéa
26. Mostaghanem
27. M'Sila
28. Mascara
29. Ouargla
30. Oran
31. El Bayadh
32. Illizi
33. Bordj Bou Arréridj
34. El Tarf
35. Tindouf
36. Tissemsilt
37. El Oued
38. Khenchela
39. Souk Ahras
40. Tipaza
41. Mila
42. Aïn Defla
43. Naâma
44. Aïn Témouchent
45. Ghardaïa
46. Relizane
47. Beni Saf
48. Aïn Ousseltia
49. Béni Khellad
50. Boumerdès
51. Djanet
52. Draa Ben Stita
53. Grouz
54. In Guezzam
55. In Salah
56. Ouled Djellal
57. Tamanghasset
58. Tamanrasset City
59. Touggourt
60. Tassili
```

---

## 💡 Use Cases & Examples

### Example 1: Distance-Based Pricing
**Yassir Livraison Agency:**
- **Algiers** (nearby): 200 DZD home, 150 DZD office
- **Oran** (far): 350 DZD home, 280 DZD office
- **Béjaïa** (mountain): 400 DZD home, 300 DZD office

### Example 2: Regional Coverage
**DZ Express Agency:**
- Only covers certain wilayas → Set prices for those only
- Customer in uncovered wilaya → Uses default price (to indicate unavailability or special handling)

### Example 3: Seasonal Pricing
- Can quickly adjust prices by editing existing wilaya prices
- No need to create new agencies
- Prices update in real-time for customers

---

## 📱 UI Overview

### Delivery Agency Card
```
┌─────────────────────────────────┐
│  🚚 Yassir Livraison           │
├─────────────────────────────────┤
│  Description                    │
│  📱 Phone                       │
│  ✉️ Email                       │
│                                 │
│  🏠 Domicile: 300.00 DZD       │
│  🏢 Bureau: 200.00 DZD         │
│                                 │
│  [💰] [✏️] [👁️] [🗑️]          │
│  Manage Prices | Edit | Toggle | Delete
└─────────────────────────────────┘
```

### Wilaya Pricing Dialog
```
┌────────────────────────────────────────┐
│  💰 Manage Prices - Yassir Livraison   │
├────────────────────────────────────────┤
│                                        │
│  📍 Select Wilaya                      │
│  [Wilaya Search/Dropdown           ▼] │
│                                        │
│  🏠 Home Delivery (DZD)                │
│  [_________ 300.00 _________]          │
│                                        │
│  🏢 Office Delivery (DZD)              │
│  [_________ 200.00 _________]          │
│                                        │
│  [✓ Add] [Clear]                      │
│                                        │
│  ──────────────────────────────────   │
│  📍 Configured Wilayas (3)             │
│                                        │
│  • Algiers    🏠 200.00 | 🏢 150.00    │
│    [✏️ Edit] [🗑️ Delete]              │
│  • Oran       🏠 350.00 | 🏢 280.00    │
│    [✏️ Edit] [🗑️ Delete]              │
│  • Béjaïa     🏠 400.00 | 🏢 300.00    │
│    [✏️ Edit] [🗑️ Delete]              │
│                                        │
│  [Close]                              │
└────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Database Schema
```sql
CREATE TABLE delivery_agency_wilaya_prices (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL (FK to delivery_agencies),
  wilaya_name VARCHAR NOT NULL,
  price_domicile NUMERIC NOT NULL,
  price_bureau NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_id, wilaya_name)
);
```

### API Functions Available
1. **`getWilayaPrices(agencyId)`** - Fetch all wilaya prices for an agency
2. **`getWilayaPrice(agencyId, wilayaName)`** - Get price for specific wilaya
3. **`upsertWilayaPrice(...)`** - Add or update wilaya price
4. **`deleteWilayaPrice(agencyId, wilayaName)`** - Remove wilaya price
5. **`getDeliveryPriceForWilaya(...)`** - Get price with automatic fallback

### Frontend Integration
- State management in `Website_Enhanced.tsx`
- Real-time price fetching in `WebsiteCart.tsx`
- Automatic caching for performance
- Multi-language support throughout

---

## ⚙️ Configuration Tips

### Best Practices
1. **Set base prices first**: Configure agency default prices before wilaya-specific prices
2. **Use consistent naming**: Ensure wilaya names match exactly (case-sensitive)
3. **Document pricing strategy**: Keep notes on why certain prices are set
4. **Test thoroughly**: Add test orders to verify prices are calculated correctly
5. **Monitor usage**: Check order data to see which wilayas get the most orders

### Performance Optimization
- Prices are cached in browser memory
- Database queries are minimal
- Results update instantly when wilaya or delivery type changes
- No page reload needed

### Troubleshooting

**Q: Price doesn't update when I change wilaya?**
- A: Wait a moment for the async price fetch to complete
- Ensure you've configured a price for that wilaya or check the default

**Q: How do I know which wilayas have prices configured?**
- A: Open the wilaya pricing dialog - configured wilayas are listed at the bottom

**Q: Can I use the same price for all wilayas?**
- A: Yes - just use the agency default prices. Don't configure wilaya-specific prices.

**Q: How do I temporarily disable wilaya pricing?**
- A: Delete all wilaya prices for that agency. System will revert to defaults.

---

## 📞 Support

For issues or questions about wilaya pricing:
1. Check that all field values are entered correctly
2. Verify wilaya name spelling matches exactly
3. Ensure prices are positive numbers
4. Clear browser cache if prices don't update
5. Test on a different browser/device

---

## 🎉 Summary

The Wilaya Pricing Management system provides:
- ✅ Flexible, per-region delivery pricing
- ✅ Easy management through intuitive UI
- ✅ Automatic price fallback for unconfigured wilayas
- ✅ Real-time updates for customers
- ✅ Multi-language support
- ✅ Comprehensive audit trail
- ✅ Zero downtime configuration

**Start offering location-based delivery pricing today! 💰🚚**
