-- ============================================================================
-- COMPLETE FIX FOR PRODUCTS RLS POLICIES AND USER ROLES
-- ============================================================================
-- This SQL file fixes the Row-Level Security (RLS) policies on the products 
-- table to allow INSERT/UPDATE/DELETE operations while maintaining security.
-- ============================================================================

-- ============================================================================
-- STEP 1: DISABLE AND RE-ENABLE RLS ON PRODUCTS TABLE
-- ============================================================================
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES ON PRODUCTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Everyone can read products" ON public.products;
DROP POLICY IF EXISTS "Only admins can modify products" ON public.products;
DROP POLICY IF EXISTS "products_read_all" ON public.products;
DROP POLICY IF EXISTS "products_insert_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_update_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_delete_authenticated" ON public.products;

-- ============================================================================
-- STEP 3: CREATE NEW RLS POLICIES FOR PRODUCTS
-- ============================================================================

-- SELECT Policy: Everyone can read all products
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT 
  USING (true);

-- INSERT Policy: Allow authenticated users to insert products
-- This is the key fix for the "Error saving charger" issue
CREATE POLICY "products_insert_authenticated" ON public.products
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE Policy: Allow authenticated users who are admin to update products
CREATE POLICY "products_update_admin" ON public.products
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE Policy: Allow authenticated users who are admin to delete products
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
-- STEP 4: ENSURE CURRENT USER IS ADMIN
-- ============================================================================
-- IMPORTANT: Replace 'YOUR_AUTH_UUID' with your actual auth user UUID
-- You can find this by running:
-- SELECT id, email FROM auth.users LIMIT 1;

-- First, get your current user ID and update the user record:
UPDATE public.users 
SET role = 'admin', is_active = true 
WHERE email = (SELECT email FROM auth.users LIMIT 1);

-- If that doesn't work, you can manually insert/update with a specific UUID:
-- UPDATE public.users 
-- SET role = 'admin', is_active = true 
-- WHERE id = 'YOUR_UUID_HERE';

-- ============================================================================
-- STEP 5: VERIFY THE SETUP
-- ============================================================================

-- Check all RLS policies on products table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- Check current user
SELECT 
  id, 
  email, 
  username, 
  role, 
  is_active 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check auth users
SELECT 
  id, 
  email, 
  created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
