-- ============================================================
-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR
-- ============================================================
-- Project: zpbgthdmzgelzilipunw
-- Purpose: Fix 404 errors and enable order management system
-- Time to run: < 2 seconds
-- ============================================================

-- ============================================================
-- 1. WEBSITE SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.website_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  store_name character varying NOT NULL DEFAULT 'Chargeur Store',
  slogan character varying,
  description text,
  logo_url text,
  logo_data bytea,
  facebook_url character varying,
  instagram_url character varying,
  tiktok_url character varying,
  snapchat_url character varying,
  location character varying,
  phone_number character varying,
  whatsapp_number character varying,
  telegram_number character varying,
  currency character varying DEFAULT 'DZD',
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "website_settings_public_read" ON public.website_settings;
CREATE POLICY "website_settings_public_read" ON public.website_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "website_settings_auth_update" ON public.website_settings;
CREATE POLICY "website_settings_auth_update" ON public.website_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 2. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name character varying NOT NULL,
  customer_phone character varying NOT NULL,
  customer_email character varying,
  customer_address text NOT NULL,
  customer_wilaya character varying NOT NULL,
  delivery_type character varying NOT NULL CHECK (delivery_type IN ('bureau', 'domicile')),
  status character varying NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'on_delivery', 'delivered', 'cancelled')),
  total_price numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  final_price numeric NOT NULL DEFAULT 0,
  confirmed_at timestamp without time zone,
  delivery_started_at timestamp without time zone,
  delivered_at timestamp without time zone,
  cancelled_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  notes text,
  admin_notes text,
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_public_read" ON public.orders;
CREATE POLICY "orders_public_read" ON public.orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "orders_auth_insert" ON public.orders;
CREATE POLICY "orders_auth_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_auth_update" ON public.orders;
CREATE POLICY "orders_auth_update" ON public.orders
  FOR UPDATE USING (true);

-- ============================================================
-- 3. ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name character varying NOT NULL,
  product_image character varying,
  product_mark character varying,
  product_description text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_per_unit numeric NOT NULL,
  line_total numeric NOT NULL,
  from_offer boolean DEFAULT false,
  offer_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_public_read" ON public.order_items;
CREATE POLICY "order_items_public_read" ON public.order_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "order_items_auth_insert" ON public.order_items;
CREATE POLICY "order_items_auth_insert" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 4. ENSURE PRODUCTS TABLE HAS PRIMARY_IMAGE
-- ============================================================
ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS primary_image text;

CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

-- ============================================================
-- 5. ENSURE SHOPPING CARTS TABLES EXIST
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shopping_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name character varying NOT NULL,
  product_image character varying,
  product_mark character varying,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_per_unit numeric NOT NULL,
  from_offer boolean DEFAULT false,
  offer_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.shopping_carts(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_shopping_carts_session_id ON public.shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_carts_public" ON public.shopping_carts;
CREATE POLICY "shopping_carts_public" ON public.shopping_carts
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cart_items_public" ON public.cart_items;
CREATE POLICY "cart_items_public" ON public.cart_items
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. INSERT DEFAULT WEBSITE SETTINGS
-- ============================================================
INSERT INTO public.website_settings (id, store_name, currency, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Chargeur Store',
  'DZD',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. VERIFY ALL TABLES EXIST
-- ============================================================
SELECT 
  schemaname,
  tablename,
  'Table exists ✅' as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('website_settings', 'orders', 'order_items', 'products', 'shopping_carts', 'cart_items')
ORDER BY tablename;
