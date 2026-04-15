<!-- filepath: /DEPLOYMENT_CHECKLIST_WILAYA_PRICING.md -->

# ✅ Deployment Checklist - Wilaya Pricing System

## 📋 Pre-Deployment

- [ ] **Code Review Complete**: All changes reviewed and approved
- [ ] **Database Backup**: Backup your Supabase database
- [ ] **Test Environment**: Test on staging/development environment first
- [ ] **Git Commit**: Commit all changes to version control

```bash
git add .
git commit -m "feat: Add wilaya-based delivery pricing system"
git push origin develop
```

---

## 🔧 Step 1: Database Setup

### 1.1 Run SQL Migration
1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy content from: `DEPLOY_WILAYA_PRICING_SQL.sql`
4. Paste into SQL editor
5. Click **Run**
6. Verify success: "Wilaya Pricing Table Created Successfully ✅"

### 1.2 Verify Table Structure
Run verification query at bottom of `DEPLOY_WILAYA_PRICING_SQL.sql`:
```sql
SELECT 'delivery_agency_wilaya_prices table' as item,
  COUNT(*) as count,
  'EXISTS ✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'delivery_agency_wilaya_prices';
```

Expected Result: `count = 1`, `status = EXISTS ✅`

---

## 🚀 Step 2: Code Deployment

### 2.1 Build the Project
```bash
# Install dependencies (if needed)
npm install

# Build the project
npm run build

# Verify no build errors
# Should see: "Built successfully"
```

### 2.2 Run Tests (if available)
```bash
npm run test
```

### 2.3 Deploy to Production
```bash
# Using your deployment method (Vercel, Netlify, Docker, etc.)
# Example for Vercel:
vercel --prod

# Or deploy to your server:
# Follow your standard deployment process
```

---

## ✅ Step 3: Post-Deployment Verification

### 3.1 Check Database Connection
- [ ] Supabase Dashboard shows new table
- [ ] Indexes are created
- [ ] No errors in Supabase logs

### 3.2 Check Frontend Build
- [ ] No console errors in browser dev tools
- [ ] All pages load normally
- [ ] Dark mode works
- [ ] All languages work (Arabic, French, English)

### 3.3 Test Core Features

#### Test 1: Admin Panel Access
1. [ ] Navigate to Website Manager (Gestion Web)
2. [ ] Click "Delivery Management" tab
3. [ ] See "🚚 Delivery Management" header
4. [ ] Delivery agencies display correctly

#### Test 2: Add Wilaya Pricing
1. [ ] Click 💰 "Manage Prices" on any agency
2. [ ] Modal dialog opens
3. [ ] Can select wilaya from dropdown
4. [ ] Can enter home delivery price
5. [ ] Can enter office delivery price
6. [ ] Click "Add" button works
7. [ ] Price saved successfully
8. [ ] Toast notification appears

#### Test 3: View Configured Prices
1. [ ] After adding price, appears in "Configured Wilayas" section
2. [ ] Shows wilaya name
3. [ ] Shows both prices (home & office)
4. [ ] Edit button works
5. [ ] Delete button works

#### Test 4: Edit Existing Price
1. [ ] Click ✏️ edit button on wilaya price
2. [ ] Fields auto-populate with current values
3. [ ] Can modify prices
4. [ ] Click "Update" button
5. [ ] Price updates in list

#### Test 5: Delete Wilaya Price
1. [ ] Click 🗑️ delete button
2. [ ] Price removed from list
3. [ ] Confirmation toast appears

#### Test 6: Customer Order Flow
1. [ ] Navigate to product page
2. [ ] Add product to cart
3. [ ] Go to cart/order page
4. [ ] Select wilaya with configured price
5. [ ] Verify correct price displays
6. [ ] Change delivery type (Bureau/Domicile)
7. [ ] Verify correct price updates
8. [ ] Complete order

#### Test 7: Fallback Pricing
1. [ ] Select wilaya without configured price
2. [ ] Should show agency default price
3. [ ] Prices still calculate correctly
4. [ ] Order completes successfully

### 3.4 Test Multi-Language
- [ ] Switch to Arabic (العربية)
  - [ ] Modal titles in Arabic
  - [ ] Labels in Arabic
  - [ ] Buttons in Arabic
  - [ ] Layout is RTL (right-to-left)

- [ ] Switch to French (Français)
  - [ ] Modal titles in French
  - [ ] Labels in French
  - [ ] Buttons in French
  - [ ] Layout is LTR (left-to-right)

### 3.5 Test Responsive Design
- [ ] Test on mobile (375px width)
  - [ ] Modal fits screen
  - [ ] Can scroll if needed
  - [ ] Buttons are clickable
  - [ ] Text is readable

- [ ] Test on tablet (768px width)
  - [ ] Layout looks good
  - [ ] All elements visible

- [ ] Test on desktop (1024px+ width)
  - [ ] Modal displays nicely
  - [ ] Full feature visible

### 3.6 Test Dark Mode
- [ ] Activate dark mode in UI
- [ ] Modal colors are correct
- [ ] Text is readable
- [ ] Buttons are visible
- [ ] Borders are visible

### 3.7 Performance Check
- [ ] Page loads quickly
- [ ] No significant performance degradation
- [ ] Prices update instantly
- [ ] No lag when scrolling

---

## 🧪 Step 4: Edge Case Testing

### 4.1 Boundary Testing
- [ ] Enter 0 for prices (should work)
- [ ] Enter very large prices (10000.00)
- [ ] Enter decimal prices (299.99)
- [ ] All should work correctly

### 4.2 Error Handling
- [ ] Leave fields empty → Error message
- [ ] Try to add same wilaya twice → Error or update
- [ ] Network error simulation → Graceful handling
- [ ] Try invalid numbers → Error message

### 4.3 Data Persistence
- [ ] Add price for wilaya
- [ ] Refresh page
- [ ] Price still there ✓
- [ ] Logout and login
- [ ] Price still there ✓
- [ ] Check database directly
- [ ] Record exists ✓

---

## 📊 Step 5: Data Validation

### 5.1 Check Database Records
```sql
-- Run this to verify data was saved
SELECT 
  agency_id,
  wilaya_name,
  price_domicile,
  price_bureau,
  created_at
FROM public.delivery_agency_wilaya_prices
ORDER BY created_at DESC
LIMIT 5;
```

Expected: Should show your test records

### 5.2 Verify Data Relationships
```sql
-- Check foreign key relationships
SELECT 
  dawp.id,
  da.name as agency_name,
  dawp.wilaya_name,
  dawp.price_domicile
FROM public.delivery_agency_wilaya_prices dawp
JOIN public.delivery_agencies da ON dawp.agency_id = da.id
LIMIT 5;
```

Expected: All records show valid agency relationships

---

## 🔍 Step 6: Final Inspection

### 6.1 Code Quality Check
- [ ] No console errors
- [ ] No warning messages
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Response times acceptable

### 6.2 User Experience Check
- [ ] Intuitive UI
- [ ] Clear instructions
- [ ] Helpful error messages
- [ ] Responsive to user actions
- [ ] Smooth animations

### 6.3 Security Check
- [ ] Cannot access admin without auth
- [ ] Cannot modify others' prices
- [ ] Database properly restricted
- [ ] No sensitive data exposed

### 6.4 Documentation Check
- [ ] User guide available
- [ ] Admin knows how to use feature
- [ ] Team trained on feature
- [ ] Documentation is clear

---

## 📢 Step 7: Go-Live

### 7.1 Announce Feature
```
Subject: New Feature - Wilaya-Based Delivery Pricing

Hi Team,

We've launched a new feature for managing delivery prices by wilaya (province).

What's New:
✅ Set different prices for each Algerian wilaya
✅ Independent pricing for home and office delivery
✅ Easy management from Website Manager
✅ Automatic fallback to agency defaults

How to Use:
1. Website Manager → Delivery Management
2. Click 💰 on any agency card
3. Select wilaya and set prices
4. Prices update automatically for customers

Questions? Contact: [Your Contact Info]
```

### 7.2 Train Admin Team
- [ ] Show how to add wilaya pricing
- [ ] Show how to edit prices
- [ ] Show how to delete prices
- [ ] Answer questions
- [ ] Do a practice run

### 7.3 Monitor Usage
- [ ] Check for errors in logs
- [ ] Monitor order flow
- [ ] Verify prices are correct
- [ ] Gather user feedback

---

## 🛑 Step 8: Rollback Plan (If Needed)

### If Critical Issues Found:

**Option 1: Disable Feature (Keep Code)**
```
1. Hide 💰 button in UI
2. Keep database table (no data loss)
3. Customers still get default prices
4. Fix issues in development
5. Re-enable when ready
```

**Option 2: Full Rollback**
```sql
-- This safely removes the feature without data loss
DROP TABLE IF EXISTS public.delivery_agency_wilaya_prices CASCADE;
DROP VIEW IF EXISTS delivery_prices_with_wilaya_fallback CASCADE;
```

**Step-by-step:**
1. [ ] Stop receiving new orders (if critical)
2. [ ] Revert code to previous version
3. [ ] Run rollback SQL (if needed)
4. [ ] Verify system works normally
5. [ ] Investigate root cause
6. [ ] Fix and re-test
7. [ ] Re-deploy when ready

---

## ✨ Post-Launch Monitoring (First Week)

### Daily Checks
- [ ] No database errors
- [ ] Prices calculating correctly
- [ ] Orders completing successfully
- [ ] No user complaints
- [ ] Performance acceptable

### Weekly Review
- [ ] Analyze pricing patterns
- [ ] Check database growth
- [ ] Review user feedback
- [ ] Performance metrics
- [ ] Make adjustments if needed

---

## 📋 Sign-Off Checklist

### Before Going Live
- [ ] Database migration complete
- [ ] Code deployed successfully
- [ ] All tests passing
- [ ] Team trained
- [ ] Documentation ready
- [ ] Backup confirmed
- [ ] No critical errors

### Go-Live Approval
- [ ] Product Owner: ___________________
- [ ] Tech Lead: ___________________
- [ ] QA Lead: ___________________
- [ ] Date: ___________________

### Post-Launch
- [ ] Feature monitoring enabled
- [ ] Support team notified
- [ ] Users informed
- [ ] First week review scheduled

---

## 🎉 Success Criteria

Feature is successful when:
- ✅ All functionality working as designed
- ✅ No critical errors
- ✅ Team comfortable using feature
- ✅ Users understand how to use it
- ✅ Prices calculating correctly
- ✅ Orders completing successfully
- ✅ System performs well
- ✅ No data loss

---

## 📞 Support Contacts

**For Technical Issues:**
- Backend Support: [Contact]
- Frontend Support: [Contact]
- Database Support: [Contact]

**For User Questions:**
- Admin Training: [Contact]
- Sales Support: [Contact]
- Technical Support: [Contact]

---

## 📝 Notes

```
[Space for additional notes during deployment]




```

---

**🚀 Ready to Deploy! Good Luck! 🚀**

Last Updated: [Current Date]
Deployed By: [Your Name]
Deployment Time: [Time]
