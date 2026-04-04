-- ============================================================================
-- COMPREHENSIVE RLS POLICY FIX FOR THE ENTIRE CHARGER DATABASE
-- ============================================================================
-- This SQL file fixes all Row-Level Security (RLS) policies across the 
-- database to use proper Supabase auth functions instead of incorrect JWT claims.
-- This solves the "Error saving charger" (42501) issue.
--
-- EXECUTION STEPS:
-- 1. Copy all content
-- 2. Go to: https://app.supabase.com/project/[your-project]/sql/new
-- 3. Paste the entire content
-- 4. Review and click RUN
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX PRODUCTS TABLE RLS POLICIES
-- ============================================================================
-- This is the PRIMARY fix for "Error saving charger"

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read products" ON public.products;
DROP POLICY IF EXISTS "Only admins can modify products" ON public.products;
DROP POLICY IF EXISTS "products_read_all" ON public.products;
DROP POLICY IF EXISTS "products_insert_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;

-- SELECT Policy: Everyone can read all products
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT 
  USING (true);

-- INSERT Policy: Allow authenticated users to insert products
-- THIS IS THE KEY FIX - Allows authenticated users to save chargers
CREATE POLICY "products_insert_authenticated" ON public.products
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Allow authenticated admins to update products
CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE Policy: Allow authenticated admins to delete products
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 2: FIX INVOICES TABLE RLS POLICIES
-- ============================================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read invoices" ON public.invoices;
DROP POLICY IF EXISTS "Only admins can modify invoices" ON public.invoices;
DROP POLICY IF EXISTS "invoices_read_all" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_authenticated" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;

-- SELECT Policy: Authenticated users can read invoices
CREATE POLICY "invoices_select_authenticated" ON public.invoices
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- INSERT Policy: Authenticated users can create invoices
CREATE POLICY "invoices_insert_authenticated" ON public.invoices
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Only admins can update invoices
CREATE POLICY "invoices_update_admin" ON public.invoices
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE Policy: Only admins can delete invoices
CREATE POLICY "invoices_delete_admin" ON public.invoices
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 3: FIX PAYMENTS TABLE RLS POLICIES
-- ============================================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read payments" ON public.payments;
DROP POLICY IF EXISTS "Only admins can modify payments" ON public.payments;
DROP POLICY IF EXISTS "payments_read_all" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_authenticated" ON public.payments;
DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;

-- SELECT Policy: Authenticated users can read payments
CREATE POLICY "payments_select_authenticated" ON public.payments
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- INSERT Policy: Authenticated users can create payments
CREATE POLICY "payments_insert_authenticated" ON public.payments
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Only admins can update payments
CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE Policy: Only admins can delete payments
CREATE POLICY "payments_delete_admin" ON public.payments
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 4: FIX CUSTOMERS TABLE RLS POLICIES
-- ============================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read customers" ON public.customers;
DROP POLICY IF EXISTS "Only admins can modify customers" ON public.customers;
DROP POLICY IF EXISTS "customers_read_all" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_authenticated" ON public.customers;
DROP POLICY IF EXISTS "customers_update_admin" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_admin" ON public.customers;

-- SELECT Policy: Authenticated users can read customers
CREATE POLICY "customers_select_authenticated" ON public.customers
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- INSERT Policy: Authenticated users can create customers
CREATE POLICY "customers_insert_authenticated" ON public.customers
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Only admins can update customers
CREATE POLICY "customers_update_admin" ON public.customers
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE Policy: Only admins can delete customers
CREATE POLICY "customers_delete_admin" ON public.customers
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 5: FIX SUPPLIERS TABLE RLS POLICIES
-- ============================================================================

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Only admins can modify suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_read_all" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_authenticated" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_admin" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete_admin" ON public.suppliers;

-- SELECT Policy: Authenticated users can read suppliers
CREATE POLICY "suppliers_select_authenticated" ON public.suppliers
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- INSERT Policy: Authenticated users can create suppliers
CREATE POLICY "suppliers_insert_authenticated" ON public.suppliers
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Only admins can update suppliers
CREATE POLICY "suppliers_update_admin" ON public.suppliers
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE Policy: Only admins can delete suppliers
CREATE POLICY "suppliers_delete_admin" ON public.suppliers
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 6: ENSURE CURRENT USER IS SET AS ADMIN
-- ============================================================================
-- This is crucial for the RLS policies to work correctly

UPDATE public.users 
SET role = 'admin', is_active = true 
WHERE email = (SELECT email FROM auth.users ORDER BY created_at ASC LIMIT 1);

-- If you need to target a specific email:
-- UPDATE public.users 
-- SET role = 'admin', is_active = true 
-- WHERE email = 'admin@admin.com';

-- ============================================================================
-- SECTION 7: VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the fix worked

-- Check all RLS policies on key tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('products', 'invoices', 'payments', 'customers', 'suppliers')
ORDER BY tablename, policyname;

-- Check that users are properly configured
SELECT 
  id, 
  email, 
  username, 
  role, 
  is_active,
  created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check that auth users exist
SELECT 
  id, 
  email, 
  created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================================================
-- SECTION 8: SUMMARY OF CHANGES
-- ============================================================================
/*
FIXED TABLES (6):
1. products - Now allows INSERT for authenticated users
2. invoices - Now allows INSERT for authenticated users
3. payments - Now allows INSERT for authenticated users
4. customers - Now allows INSERT for authenticated users
5. suppliers - Now allows INSERT for authenticated users
6. users - Data updated to ensure current user is admin

KEY IMPROVEMENTS:
✅ Replaced auth.jwt() ->> 'user_role' with auth.role() = 'authenticated'
✅ Added dedicated INSERT policies for authenticated users
✅ Separated SELECT/INSERT/UPDATE/DELETE into distinct policies
✅ Used auth.uid() with users table for admin role validation
✅ Updated user roles to ensure permissions work correctly

RESULT:
✅ Error 42501 (RLS policy violation) should be resolved
✅ "Error saving charger" should no longer occur
✅ Inventory, invoices, payments can now be created
✅ Security is maintained - destructive operations require admin role

NEXT STEPS IF STILL HAVING ISSUES:
1. Clear browser cache (Ctrl+Shift+R)
2. Sign out and sign back in
3. Check the verification queries above to confirm setup
4. Look at Supabase logs for more details
*/
