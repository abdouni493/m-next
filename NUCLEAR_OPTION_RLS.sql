-- NUCLEAR OPTION: Force ALL tables to be completely public
-- Copy and run this ENTIRE script

-- ============================================
-- STEP 1: Disable RLS on ALL tables
-- ============================================
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop every single policy on every table
-- ============================================

-- Offers table - drop all policies
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.offers;
DROP POLICY IF EXISTS "Enable read for all users" ON public.offers;
DROP POLICY IF EXISTS "Allow all" ON public.offers;
DROP POLICY IF EXISTS "authenticated users can read" ON public.offers;

-- Special Offers table
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.special_offers;
DROP POLICY IF EXISTS "Enable read for all users" ON public.special_offers;
DROP POLICY IF EXISTS "Allow all" ON public.special_offers;
DROP POLICY IF EXISTS "authenticated users can read" ON public.special_offers;

-- Products table
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.products;
DROP POLICY IF EXISTS "Enable read for all users" ON public.products;
DROP POLICY IF EXISTS "Allow all" ON public.products;
DROP POLICY IF EXISTS "authenticated users can read" ON public.products;

-- Website Settings table
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.website_settings;
DROP POLICY IF EXISTS "Enable read for all users" ON public.website_settings;
DROP POLICY IF EXISTS "Allow all" ON public.website_settings;
DROP POLICY IF EXISTS "authenticated users can read" ON public.website_settings;

-- Marks table
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.marks;
DROP POLICY IF EXISTS "Enable read for all users" ON public.marks;
DROP POLICY IF EXISTS "Allow all" ON public.marks;
DROP POLICY IF EXISTS "authenticated users can read" ON public.marks;

-- Connector Types table
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.connector_types;
DROP POLICY IF EXISTS "Enable read for all users" ON public.connector_types;
DROP POLICY IF EXISTS "Allow all" ON public.connector_types;
DROP POLICY IF EXISTS "authenticated users can read" ON public.connector_types;

-- Orders table
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Allow all" ON public.orders;

-- ============================================
-- STEP 3: Verify RLS is disabled
-- ============================================
SELECT tablename 
FROM pg_tables 
WHERE tablename IN ('offers', 'special_offers', 'products', 'website_settings', 'marks', 'connector_types', 'orders')
  AND schemaname = 'public'
ORDER BY tablename;

-- If RLS is fully disabled, you should see the tables listed above
-- If you see an error, something is still wrong
-- If you don't see the tables, they don't exist
