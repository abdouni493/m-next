-- ============================================================================
-- CHARGER SELLING SYSTEM - DATABASE SCHEMA UPDATE
-- ============================================================================
-- This SQL creates all necessary tables and updates for a professional
-- mobile charger and accessory inventory management system
-- ============================================================================

-- 1. Create Marks (Brands) Table
CREATE TABLE IF NOT EXISTS marks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  country VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marks_name ON marks(name);
CREATE INDEX IF NOT EXISTS idx_marks_active ON marks(is_active);

-- 2. Create Connector Types Table
CREATE TABLE IF NOT EXISTS connector_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_emoji VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connector_types_name ON connector_types(name);

-- 3. Insert Common Connector Types
INSERT INTO connector_types (name, description, icon_emoji) VALUES
  ('USB-C', 'Universal Serial Bus Type-C', '🔌'),
  ('Lightning', 'Apple Lightning Connector', '⚡'),
  ('Micro USB', 'Micro USB Type-B', '🔗'),
  ('USB-A', 'Standard USB Type-A', '🔌'),
  ('Proprietary', 'Custom/Proprietary Connector', '🔧'),
  ('USB-B', 'USB Type-B', '🔌'),
  ('Mini USB', 'Mini USB Type-B', '🔌')
ON CONFLICT (name) DO NOTHING;

-- 4. Create Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, display_order);

-- 5. Update Products Table with Charger-Specific Fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS mark_id UUID REFERENCES marks(id),
ADD COLUMN IF NOT EXISTS connector_type_id UUID REFERENCES connector_types(id),
ADD COLUMN IF NOT EXISTS voltage DECIMAL(5,1) DEFAULT 5.0,  -- 5V, 9V, 12V, etc.
ADD COLUMN IF NOT EXISTS wattage DECIMAL(5,1) DEFAULT 18.0,  -- 18W, 20W, 30W, etc.
ADD COLUMN IF NOT EXISTS amperage DECIMAL(5,2) DEFAULT 3.6,  -- 3.6A, 4A, 5A, etc.
ADD COLUMN IF NOT EXISTS model_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS quantity_initial INTEGER DEFAULT 0,  -- Initial purchase quantity
ADD COLUMN IF NOT EXISTS quantity_actual INTEGER DEFAULT 0,  -- Current quantity on hand
ADD COLUMN IF NOT EXISTS quantity_minimal INTEGER DEFAULT 5;  -- Minimum alert level

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_mark_id ON products(mark_id);
CREATE INDEX IF NOT EXISTS idx_products_connector_type_id ON products(connector_type_id);
CREATE INDEX IF NOT EXISTS idx_products_voltage ON products(voltage);
CREATE INDEX IF NOT EXISTS idx_products_wattage ON products(wattage);
CREATE INDEX IF NOT EXISTS idx_products_model_number ON products(model_number);

-- 6. Create Purchase Invoices Table (if not exists)
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  items JSONB NOT NULL,  -- Array of {product_id, quantity, unit_price, total_price}
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'pending', 'paid', 'overdue')) DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(invoice_date);

-- 7. Create Sales Invoices Table (if not exists)
CREATE TABLE IF NOT EXISTS sales_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID,
  invoice_date DATE NOT NULL,
  items JSONB NOT NULL,  -- Array of {product_id, quantity, unit_price, total_price}
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(20) CHECK (status IN ('draft', 'pending', 'paid', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;

-- 8. Marks RLS Policies
CREATE POLICY marks_read_all ON marks FOR SELECT
  USING (is_active = true);

CREATE POLICY marks_insert_authenticated ON marks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY marks_update_authenticated ON marks FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 9. Connector Types RLS Policies
CREATE POLICY connector_types_read_all ON connector_types FOR SELECT
  USING (is_active = true);

CREATE POLICY connector_types_insert_authenticated ON connector_types FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 10. Product Images RLS Policies
CREATE POLICY product_images_read_all ON product_images FOR SELECT
  USING (true);

CREATE POLICY product_images_insert_authenticated ON product_images FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY product_images_delete_admin ON product_images FOR DELETE
  USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 11. Purchase Invoices RLS Policies
CREATE POLICY purchase_invoices_read_authenticated ON purchase_invoices FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY purchase_invoices_insert_authenticated ON purchase_invoices FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY purchase_invoices_update_admin ON purchase_invoices FOR UPDATE
  USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 12. Sales Invoices RLS Policies
CREATE POLICY sales_invoices_read_authenticated ON sales_invoices FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY sales_invoices_insert_authenticated ON sales_invoices FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY sales_invoices_update_admin ON sales_invoices FOR UPDATE
  USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- HELPER VIEWS AND FUNCTIONS
-- ============================================================================

-- View: Products with related data
CREATE OR REPLACE VIEW products_with_details AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.barcode,
  m.name as mark_name,
  ct.name as connector_type_name,
  p.voltage,
  p.wattage,
  p.amperage,
  p.model_number,
  p.quantity_initial,
  p.quantity_actual,
  p.quantity_minimal,
  p.purchase_price,
  p.selling_price,
  ROUND(((p.selling_price - p.purchase_price) / p.purchase_price * 100)::numeric, 2) as margin_percent,
  p.supplier_id,
  s.name as supplier_name,
  p.is_active,
  (SELECT image_url FROM product_images 
   WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image,
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN marks m ON p.mark_id = m.id
LEFT JOIN connector_types ct ON p.connector_type_id = ct.id
LEFT JOIN suppliers s ON p.supplier_id = s.id;

-- View: Low Stock Products Alert
CREATE OR REPLACE VIEW low_stock_alert AS
SELECT 
  id,
  name,
  quantity_actual,
  quantity_minimal,
  (quantity_minimal - quantity_actual) as units_needed,
  purchase_price,
  (quantity_minimal - quantity_actual) * purchase_price as estimated_cost
FROM products
WHERE is_active = true 
  AND quantity_actual <= quantity_minimal
ORDER BY (quantity_minimal - quantity_actual) DESC;

-- Function: Calculate invoice margin
CREATE OR REPLACE FUNCTION calculate_invoice_margin(items JSONB)
RETURNS DECIMAL AS $$
DECLARE
  total_cost DECIMAL := 0;
  total_revenue DECIMAL := 0;
  item JSONB;
BEGIN
  FOR item IN SELECT jsonb_array_elements(items)
  LOOP
    total_cost := total_cost + ((item->>'unit_price')::DECIMAL * (item->>'quantity')::INTEGER);
  END LOOP;
  
  -- For sales invoices, we'd need selling prices
  -- This is a basic template
  RETURN CASE WHEN total_cost = 0 THEN 0 
    ELSE ROUND(((total_revenue - total_cost) / total_cost * 100)::numeric, 2)
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA VALIDATION AND SETUP
-- ============================================================================

-- Verify tables were created
SELECT 
  'Marks' as table_name, COUNT(*) as row_count 
FROM marks
UNION ALL
SELECT 'Connector Types', COUNT(*) FROM connector_types
UNION ALL
SELECT 'Product Images', COUNT(*) FROM product_images;

-- Show connector types available
SELECT id, name, description, icon_emoji 
FROM connector_types 
WHERE is_active = true
ORDER BY name;

-- ============================================================================
-- USEFUL QUERIES FOR TESTING
-- ============================================================================

-- List all products with charger details
-- SELECT * FROM products_with_details ORDER BY name;

-- Check low stock products
-- SELECT * FROM low_stock_alert;

-- Count products by mark
-- SELECT mark_name, COUNT(*) as product_count 
-- FROM products_with_details 
-- WHERE is_active = true
-- GROUP BY mark_name
-- ORDER BY product_count DESC;

-- Count products by connector type
-- SELECT connector_type_name, COUNT(*) as product_count 
-- FROM products_with_details 
-- WHERE is_active = true
-- GROUP BY connector_type_name
-- ORDER BY product_count DESC;

-- Show purchase invoices summary
-- SELECT 
--   DATE(invoice_date) as date,
--   COUNT(*) as invoice_count,
--   SUM(total_amount) as total_amount
-- FROM purchase_invoices
-- GROUP BY DATE(invoice_date)
-- ORDER BY date DESC;

-- ============================================================================
-- END OF SCHEMA UPDATES
-- ============================================================================
-- To deploy this script to Supabase:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Click "New Query"
-- 3. Copy and paste this entire script
-- 4. Click "Run"
-- 5. Verify success by checking for any error messages
-- ============================================================================
