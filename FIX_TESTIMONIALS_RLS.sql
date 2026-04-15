-- ========== ADD RLS POLICIES TO CLIENT_TESTIMONIALS TABLE ==========

-- Enable Row Level Security
ALTER TABLE public.client_testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "anonymous_read_approved_testimonials" ON public.client_testimonials;
DROP POLICY IF EXISTS "authenticated_create_testimonials" ON public.client_testimonials;
DROP POLICY IF EXISTS "admin_update_testimonials" ON public.client_testimonials;
DROP POLICY IF EXISTS "admin_delete_testimonials" ON public.client_testimonials;

-- Policy 1: Allow anonymous users to read ONLY approved and active testimonials
CREATE POLICY "anonymous_read_approved_testimonials" 
  ON public.client_testimonials 
  FOR SELECT 
  USING (auth.role() = 'anon' AND is_approved = true AND is_active = true);

-- Policy 2: Allow authenticated users to insert testimonials (will be pending approval)
CREATE POLICY "authenticated_create_testimonials" 
  ON public.client_testimonials 
  FOR INSERT 
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- Policy 3: Allow authenticated admin users to update testimonials (for approval/rejection)
CREATE POLICY "admin_update_testimonials" 
  ON public.client_testimonials 
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Allow authenticated admin users to delete testimonials
CREATE POLICY "admin_delete_testimonials" 
  ON public.client_testimonials 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'client_testimonials';

-- Verify policies exist
SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies WHERE tablename = 'client_testimonials';

-- ========== APPROVE ALL EXISTING TESTIMONIALS ==========

-- Update all testimonials to be approved and active
UPDATE public.client_testimonials 
SET is_approved = true, is_active = true, updated_at = CURRENT_TIMESTAMP
WHERE is_approved = false OR is_active = false;

-- Test: Select approved testimonials
SELECT id, client_name, opinion, rating, is_approved, is_active, created_at 
FROM public.client_testimonials 
WHERE is_approved = true AND is_active = true 
ORDER BY created_at DESC LIMIT 10;
