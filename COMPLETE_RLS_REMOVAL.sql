-- COMPLETE FIX: Remove ALL RLS policies and create open policies
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS on all tables
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (they might still be blocking)
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Step 3: Enable RLS back and create completely open policies
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.offers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.special_offers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.website_settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.marks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.connector_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.connector_types FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Done! All tables now allow public read/write access
