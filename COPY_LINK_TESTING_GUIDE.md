# Copy Link Feature - Testing Guide

## ✅ Pre-Testing Checklist

- [ ] Build completed successfully (0 errors)
- [ ] No TypeScript errors
- [ ] Bundle size stable (389.21 KB gzip)
- [ ] All files updated

---

## 🧪 Test Scenarios

### Test 1: Copy Link Functionality

**Objective:** Verify copy link generates correct URL

**Steps:**
1. Login to Website Manager
2. Navigate to "Offers" tab
3. Find any product offer
4. Hover over the product card
5. Click "📋 Copy Link" button

**Expected Results:**
- ✅ Toast appears: "📋 Copié - Lien copié - Le produit sera sélectionné automatiquement"
- ✅ URL copied to clipboard: `https://store.com/order?product_id={product_id}`
- ✅ No console errors

**Test Variations:**
- [ ] Test with Offer product
- [ ] Test with Special Offer product
- [ ] Test multiple products
- [ ] Test on mobile device
- [ ] Test on desktop

---

### Test 2: Product Auto-Selection

**Objective:** Verify product auto-selects when link is opened

**Steps:**
1. Copy a product link from Website Manager
2. Open the link in a new tab/browser
3. Observe the order page loading

**Expected Results:**
- ✅ Order page loads
- ✅ Product search field is HIDDEN (not shown)
- ✅ Product is displayed as "SELECTED PRODUCT"
- ✅ Product details show:
  - Product name
  - Product image
  - Original price
  - Offer price
  - Discount percentage
  - Quantity control

**Test Variations:**
- [ ] Direct open in same tab
- [ ] Open in new tab
- [ ] Open in incognito/private mode
- [ ] Open on mobile device
- [ ] Open on tablet
- [ ] Open on desktop

---

### Test 3: Cart Auto-Addition

**Objective:** Verify product automatically added to cart

**Steps:**
1. Open shared product link
2. Check browser developer tools (F12)
3. Go to Application tab
4. Check localStorage
5. Look for "cart" key

**Expected Results:**
- ✅ localStorage contains "cart" key
- ✅ Cart has 1 item
- ✅ Item properties:
  ```json
  {
    "product_id": "...",
    "product_name": "Solar Charger 50W",
    "price": 2500,
    "quantity": 1,
    "discount_percentage": 17
  }
  ```
- ✅ Navbar shows cart badge with "1" item
- ✅ Console shows: "✅ Product added to cart: ..."

**Test Variations:**
- [ ] Clear cache first, then open link
- [ ] Open link with existing cart
- [ ] Open same link twice (quantity should increase)
- [ ] Open different product links

---

### Test 4: Quantity Management

**Objective:** Verify quantity can be modified

**Steps:**
1. Open shared product link
2. Product is selected in order form
3. Look for quantity input field
4. Modify quantity: 1 → 3
5. Verify total price updates

**Expected Results:**
- ✅ Quantity input shows initial value "1"
- ✅ Can increase/decrease quantity
- ✅ Total price updates: 2500 → 7500 (for qty 3)
- ✅ Cart badge updates to show current cart value
- ✅ localStorage updates with new quantity

---

### Test 5: Checkout Process

**Objective:** Verify order can be placed with auto-selected product

**Steps:**
1. Open shared product link
2. Product is auto-selected
3. Fill customer information:
   - Full Name: "Test Customer"
   - Phone: "+213 6XX XXX XXX"
   - Address: "123 Test Street"
   - Wilaya: "Alger"
   - Delivery: "À Domicile"
4. Click "Place Order"
5. Verify order creation

**Expected Results:**
- ✅ All fields validated
- ✅ Order status shows "pending"
- ✅ Success message displayed
- ✅ Order ID generated and displayed
- ✅ Cart cleared after order
- ✅ Database contains order with correct items

---

### Test 6: Error Handling

**Objective:** Verify graceful error handling

**Steps:**
1. Open invalid link: `/order?product_id=invalid-id`
2. Observe behavior
3. Open link in new browser (no cache)
4. Try with product_id not in database

**Expected Results:**
- ✅ Page loads without crashing
- ✅ Product search shown (no auto-selected product)
- ✅ User can manually search for product
- ✅ No console errors
- ✅ No broken UI elements

---

### Test 7: Multiple Devices

**Objective:** Verify functionality across devices

**Steps:**
1. Desktop browser (Chrome, Firefox, Safari)
2. Mobile browser (iOS Safari, Android Chrome)
3. Tablet browser
4. Different screen sizes

**For Each Device:**
- [ ] Copy link on desktop
- [ ] Paste link on mobile (or scan QR)
- [ ] Verify product auto-selects
- [ ] Verify cart updates
- [ ] Verify responsive UI
- [ ] Complete order successfully

**Expected Results:**
- ✅ Works consistently across all devices
- ✅ Responsive design looks good
- ✅ No layout issues
- ✅ Touch controls work on mobile

---

### Test 8: Share Scenarios

**Objective:** Test real-world sharing scenarios

**Scenario 1: WhatsApp Share**
```
1. Copy product link from Website Manager
2. Open WhatsApp
3. Paste link in chat
4. Send to test user
5. Test user clicks link
6. Verify product auto-selected
```

**Scenario 2: Email Share**
```
1. Copy product link
2. Compose email
3. Paste link in message body
4. Send to test email
5. Check email on mobile/desktop
6. Click link from email
7. Verify product auto-selected
```

**Scenario 3: SMS Share**
```
1. Copy product link
2. Start SMS message
3. Paste link (may be truncated)
4. Send SMS
5. Receive on test phone
6. Click link (may use URL shortener)
7. Verify product auto-selected
```

**Scenario 4: Social Media**
```
1. Copy product link
2. Post on social media (Facebook, Instagram, etc.)
3. Click link from social media
4. Verify product auto-selected
5. Complete order
```

**Expected Results for All Scenarios:**
- ✅ Link works after sharing
- ✅ No URL shortening issues
- ✅ Product auto-selected in all cases
- ✅ Cart updates correctly
- ✅ Order completion works

---

### Test 9: Analytics & Logging

**Objective:** Verify console logging for debugging

**Steps:**
1. Open shared product link
2. Press F12 to open Developer Tools
3. Check Console tab
4. Look for log messages

**Expected Results:**
- ✅ Console shows: "✅ Product added to cart: {cartItem}"
- ✅ No error messages (unless intentional)
- ✅ No warning messages
- ✅ Network tab shows successful product fetch

---

### Test 10: Edge Cases

**Edge Case 1: Duplicate Product Clicks**
```
1. Open link
2. Product auto-added (qty: 1)
3. Click add to cart again
4. Result: quantity should increase, not duplicate
```

**Edge Case 2: Browser Back Button**
```
1. Open link with product selected
2. Fill customer info
3. Click browser back
4. Return to order page
5. Product should still be selected
```

**Edge Case 3: Tab Switch**
```
1. Open order page with product
2. Switch to another tab
3. Return to order page
4. Product should still be selected
```

**Edge Case 4: Page Refresh**
```
1. Open order page with product selected
2. Fill customer info partially
3. Press F5 to refresh
4. Product should reload from URL parameter
```

**Edge Case 5: Multiple Tabs**
```
1. Open 2 different product links in separate tabs
2. Add both to cart (verify Tab 1)
3. Switch to Tab 2
4. Both products should be in cart
5. Check cart count in navbar
```

---

## 📋 Test Results Template

```
Test Case: [Test Name]
Date: [Date]
Tester: [Name]
Environment: [Browser/Device]

Setup:
- [ ] Completed

Steps:
1. [ ] Step 1 completed
2. [ ] Step 2 completed
3. [ ] Step 3 completed

Expected Results:
- [ ] Result 1 verified
- [ ] Result 2 verified
- [ ] Result 3 verified

Actual Results:
[Describe what actually happened]

Status:
[ ] PASS
[ ] FAIL
[ ] BLOCKED

Issues Found:
[List any issues]

Notes:
[Additional notes]
```

---

## 🐛 Bug Report Template

If issues are found:

```
ISSUE TITLE: [Brief description]

SEVERITY: 
[ ] Critical (Order cannot be placed)
[ ] Major (Feature partially broken)
[ ] Minor (UI/UX issue)

ENVIRONMENT:
- Device: [Phone/Tablet/Desktop]
- Browser: [Chrome/Firefox/Safari/etc]
- OS: [iOS/Android/Windows/Mac]

REPRODUCTION STEPS:
1. [Step 1]
2. [Step 2]
3. [Step 3]

EXPECTED BEHAVIOR:
[What should happen]

ACTUAL BEHAVIOR:
[What actually happened]

SCREENSHOTS/VIDEOS:
[Attach if possible]

CONSOLE ERRORS:
[Any errors from F12]

RELATED ISSUE:
[Link to related issue if any]
```

---

## ✅ Sign-Off Checklist

- [ ] Test 1: Copy Link Functionality - PASS
- [ ] Test 2: Product Auto-Selection - PASS
- [ ] Test 3: Cart Auto-Addition - PASS
- [ ] Test 4: Quantity Management - PASS
- [ ] Test 5: Checkout Process - PASS
- [ ] Test 6: Error Handling - PASS
- [ ] Test 7: Multiple Devices - PASS
- [ ] Test 8: Share Scenarios - PASS
- [ ] Test 9: Analytics & Logging - PASS
- [ ] Test 10: Edge Cases - PASS

**Overall Status:** 
- [ ] ✅ ALL TESTS PASSED
- [ ] ⚠️ SOME TESTS FAILED (list below)
- [ ] ❌ CRITICAL ISSUES FOUND (list below)

**Issues/Notes:**
```
[List any issues found]
```

**Tester Sign-Off:**
- Tested by: ________________
- Date: ________________
- Approved: ________________

---

## 🚀 Deployment Checklist

After testing is complete:

- [ ] All tests passed
- [ ] No critical issues
- [ ] Build verified
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Team notified
- [ ] Ready for production

**Deployment Date:** ________________
**Deployed By:** ________________
**Status:** ✅ LIVE / ⏳ PENDING

---

**Testing Guide Version:** 1.0
**Last Updated:** April 14, 2026
**Status:** READY FOR TESTING
