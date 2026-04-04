-- ===================================================================
-- CHARGER SELLING SYSTEM - DATABASE SCHEMA UPDATES
-- For: Inventory & Purchase Management System
-- ===================================================================

-- ===================================================================
-- 1. CREATE MARKS (BRANDS) TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for marks
CREATE INDEX IF NOT EXISTS idx_marks_name ON marks(name);
CREATE INDEX IF NOT EXISTS idx_marks_is_active ON marks(is_active);

-- Enable RLS for marks
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 2. CREATE CONNECTOR TYPES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.connector_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for connector types
CREATE INDEX IF NOT EXISTS idx_connector_types_name ON connector_types(name);
CREATE INDEX IF NOT EXISTS idx_connector_types_is_active ON connector_types(is_active);

-- Enable RLS for connector types
ALTER TABLE connector_types ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 3. UPDATE PRODUCTS TABLE WITH CHARGER-SPECIFIC FIELDS
-- ===================================================================
-- Add new columns to products table

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS mark_id uuid REFERENCES public.marks(id),
ADD COLUMN IF NOT EXISTS connector_type_id uuid REFERENCES public.connector_types(id),
ADD COLUMN IF NOT EXISTS voltage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS wattage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amperage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS model_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS quantity_initial INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_minimal INT DEFAULT 0;

-- Add index for mark_id
CREATE INDEX IF NOT EXISTS idx_products_mark_id ON products(mark_id);
CREATE INDEX IF NOT EXISTS idx_products_connector_type_id ON products(connector_type_id);
CREATE INDEX IF NOT EXISTS idx_products_voltage ON products(voltage);
CREATE INDEX IF NOT EXISTS idx_products_wattage ON products(wattage);

-- ===================================================================
-- 4. CREATE PRODUCT IMAGES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  bucket_name VARCHAR(255) DEFAULT 'chargers',
  file_path TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for product_images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(display_order);

-- Enable RLS for product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 5. INSERT DEFAULT CONNECTOR TYPES (EXAMPLES)
-- ===================================================================
INSERT INTO public.connector_types (name, description, is_active)
VALUES 
  ('USB-C', 'USB Type-C connector', true),
  ('Lightning', 'Apple Lightning connector', true),
  ('Micro USB', 'Micro USB connector', true),
  ('USB-A', 'Standard USB-A connector', true),
  ('Proprietary', 'Proprietary connector', true)
ON CONFLICT (name) DO NOTHING;

-- ===================================================================
-- 6. UPDATE INVOICES FOR CHARGER PURCHASES
-- ===================================================================
-- Invoices table already has all necessary fields
-- No changes needed - invoice items will reference products with new fields

-- ===================================================================
-- 7. VERIFICATION QUERIES
-- ===================================================================
-- Check marks table
-- SELECT * FROM public.marks;

-- Check connector_types table
-- SELECT * FROM public.connector_types;

-- Check updated products table with new charger fields
-- SELECT id, name, mark_id, connector_type_id, voltage, wattage, amperage, 
--        model_number, quantity_initial, quantity_actual, quantity_minimal,
--        purchase_price, selling_price
-- FROM public.products;

-- Check product images
-- SELECT * FROM public.product_images;

-- ===================================================================
-- 8. USEFUL QUERIES FOR INVENTORY MANAGEMENT
-- ===================================================================

-- Get all chargers with their marks and connector types
-- SELECT 
--   p.id,
--   p.name,
--   m.name as mark,
--   ct.name as connector_type,
--   p.voltage,
--   p.wattage,
--   p.amperage,
--   p.model_number,
--   p.quantity_actual,
--   p.quantity_minimal,
--   p.purchase_price,
--   p.selling_price,
--   COUNT(pi.id) as image_count
-- FROM products p
-- LEFT JOIN marks m ON p.mark_id = m.id
-- LEFT JOIN connector_types ct ON p.connector_type_id = ct.id
-- LEFT JOIN product_images pi ON p.id = pi.product_id
-- GROUP BY p.id, m.name, ct.name;

-- Get products with low stock
-- SELECT p.id, p.name, p.quantity_actual, p.quantity_minimal, m.name as mark
-- FROM products p
-- LEFT JOIN marks m ON p.mark_id = m.id
-- WHERE p.quantity_actual <= p.quantity_minimal;

-- Get primary image for each product
-- SELECT DISTINCT ON (product_id)
--   product_id,
--   image_url,
--   file_path
-- FROM product_images
-- WHERE is_primary = true OR display_order = 1
-- ORDER BY product_id, display_order ASC;

-- ===================================================================
-- 9. ENABLE ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- Allow all authenticated users to view marks
CREATE POLICY "Allow authenticated to view marks"
  ON marks
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage marks
CREATE POLICY "Allow admins to manage marks"
  ON marks
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Allow all authenticated users to view connector types
CREATE POLICY "Allow authenticated to view connector_types"
  ON connector_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage connector types
CREATE POLICY "Allow admins to manage connector_types"
  ON connector_types
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Allow all authenticated users to view product images
CREATE POLICY "Allow authenticated to view product_images"
  ON product_images
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage product images
CREATE POLICY "Allow admins to manage product_images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ===================================================================
-- END OF CHARGER SYSTEM SCHEMA UPDATES
-- ===================================================================
