-- QUICK FIX: Remove all RLS policies - allows public access without authentication
-- This fixes JWT expired 401 errors on the website
-- Run this in your Supabase SQL editor immediately

-- ============================================
-- STEP 1: DISABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================
-- Offers policies
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.offers;
DROP POLICY IF EXISTS "Enable read for all users" ON public.offers;

-- Special Offers policies  
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.special_offers;
DROP POLICY IF EXISTS "Enable read for all users" ON public.special_offers;

-- Products policies
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.products;
DROP POLICY IF EXISTS "Enable read for all users" ON public.products;

-- Website Settings policies
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.website_settings;
DROP POLICY IF EXISTS "Enable read for all users" ON public.website_settings;

-- Marks policies
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.marks;
DROP POLICY IF EXISTS "Enable read for all users" ON public.marks;

-- Connector Types policies
DROP POLICY IF EXISTS "Enable read for unauthenticated users" ON public.connector_types;
DROP POLICY IF EXISTS "Enable read for all users" ON public.connector_types;

-- Orders policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read for all users" ON public.orders;

-- ============================================
-- STEP 3: VERIFY ALL RLS IS DISABLED
-- ============================================
-- Check if RLS is disabled on key tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('offers', 'special_offers', 'products', 'website_settings', 'marks', 'connector_types', 'orders')
ORDER BY tablename;
