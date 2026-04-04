-- ============================================================
-- COMPLETELY DISABLE ALL RLS POLICIES
-- ============================================================
-- This removes ALL Row Level Security - everything is accessible

-- Disable RLS on all tables
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_carts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on key tables
DROP POLICY IF EXISTS "website_settings_public_read" ON public.website_settings;
DROP POLICY IF EXISTS "website_settings_auth_update" ON public.website_settings;
DROP POLICY IF EXISTS "orders_public_read" ON public.orders;
DROP POLICY IF EXISTS "orders_auth_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_auth_update" ON public.orders;
DROP POLICY IF EXISTS "orders_auth_delete" ON public.orders;
DROP POLICY IF EXISTS "order_items_public_read" ON public.order_items;
DROP POLICY IF EXISTS "order_items_auth_insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items_auth_update" ON public.order_items;
DROP POLICY IF EXISTS "order_items_auth_delete" ON public.order_items;
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "shopping_carts_public" ON public.shopping_carts;
DROP POLICY IF EXISTS "cart_items_public" ON public.cart_items;

-- Verify all RLS is disabled
SELECT 
  schemaname,
  tablename,
  'RLS DISABLED ✅' as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
