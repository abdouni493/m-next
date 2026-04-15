-- ========== CREATE: Client Testimonials Table ==========
-- This table stores customer testimonials/reviews for display on the landing page

-- Drop existing table if it exists (for fresh install)
DROP TABLE IF EXISTS public.client_testimonials CASCADE;

-- Create the main testimonials table
CREATE TABLE public.client_testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_name character varying NOT NULL,
  client_email character varying,
  opinion text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT client_testimonials_pkey PRIMARY KEY (id)
);

-- Create indexes for performance
CREATE INDEX idx_client_testimonials_is_approved 
  ON public.client_testimonials(is_approved);

CREATE INDEX idx_client_testimonials_is_active 
  ON public.client_testimonials(is_active);

CREATE INDEX idx_client_testimonials_created_at 
  ON public.client_testimonials(created_at DESC);

-- Create a view for getting only approved testimonials
CREATE OR REPLACE VIEW approved_testimonials AS
SELECT 
  id,
  client_name,
  opinion,
  rating,
  created_at,
  updated_at
FROM public.client_testimonials
WHERE is_approved = true
AND is_active = true
ORDER BY created_at DESC;

-- Verification query
SELECT 
  'client_testimonials table created' as status,
  COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'client_testimonials';

-- Sample insert (optional - uncomment to add test data)
-- INSERT INTO public.client_testimonials (client_name, client_email, opinion, rating, is_approved)
-- VALUES 
--   ('أحمد محمد', 'ahmed@example.com', 'منتجات عالية الجودة وخدمة عملاء ممتازة! شكراً لكم', 5, true),
--   ('Fatima Benali', 'fatima@example.com', 'Excellent service and fast delivery! Highly recommended.', 5, true),
--   ('Jean Dubois', 'jean@example.com', 'Très satisfait de mes achats, produits de qualité et prix compétitifs.', 4, true);

-- ========== ENABLE RLS AND CREATE POLICIES ==========

-- Enable Row Level Security
ALTER TABLE public.client_testimonials ENABLE ROW LEVEL SECURITY;

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
