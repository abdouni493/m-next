-- ========== FIX TESTIMONIALS RLS - OPTION 1: DISABLE RLS ENTIRELY ==========
-- This makes client_testimonials work like other tables (products, offers, etc.)

-- First, approve all testimonials
UPDATE public.client_testimonials 
SET is_approved = true, is_active = true, updated_at = CURRENT_TIMESTAMP
WHERE is_approved = false OR is_active = false;

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "admin_delete_testimonials" ON public.client_testimonials;
DROP POLICY IF EXISTS "admin_update_testimonials" ON public.client_testimonials;
DROP POLICY IF EXISTS "anonymous_read_approved_testimonials" ON public.client_testimonials;
DROP POLICY IF EXISTS "authenticated_create_testimonials" ON public.client_testimonials;

-- DISABLE RLS completely (matches other tables)
ALTER TABLE public.client_testimonials DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'client_testimonials';

-- Test: Select ALL testimonials (now fully accessible)
SELECT id, client_name, opinion, rating, is_approved, is_active, created_at 
FROM public.client_testimonials 
ORDER BY created_at DESC;
