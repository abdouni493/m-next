-- ========== DELIVERY AGENCIES MANAGEMENT ==========

-- Create delivery_agencies table
CREATE TABLE IF NOT EXISTS delivery_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  price_domicile DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_bureau DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create delivery_prices view for easy access
CREATE OR REPLACE VIEW delivery_agencies_with_prices AS
SELECT
  id,
  name,
  description,
  logo_url,
  contact_phone,
  contact_email,
  price_domicile,
  price_bureau,
  (price_domicile + price_bureau) / 2 as average_price,
  is_active,
  is_visible,
  created_at,
  updated_at
FROM delivery_agencies
WHERE is_active = true AND is_visible = true
ORDER BY name;

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_delivery_agencies_active ON delivery_agencies(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_agencies_visible ON delivery_agencies(is_visible);
CREATE INDEX IF NOT EXISTS idx_delivery_agencies_name ON delivery_agencies(name);

-- ========== ROW LEVEL SECURITY (RLS) ==========

-- Enable RLS on delivery_agencies
ALTER TABLE delivery_agencies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_view_delivery_agencies" ON delivery_agencies;
DROP POLICY IF EXISTS "enable_all_for_authenticated_agencies" ON delivery_agencies;

-- Public can view visible agencies
CREATE POLICY "public_view_delivery_agencies" ON delivery_agencies
  FOR SELECT USING (is_active = true AND is_visible = true);

-- Authenticated users can do all operations
CREATE POLICY "enable_all_for_authenticated_agencies" ON delivery_agencies
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========== ORDERS TABLE UPDATE ==========

-- Add delivery_agency_id to orders table if it doesn't exist
ALTER TABLE IF EXISTS orders
ADD COLUMN IF NOT EXISTS delivery_agency_id UUID REFERENCES delivery_agencies(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS orders
ADD COLUMN IF NOT EXISTS delivery_type TEXT CHECK (delivery_type IN ('domicile', 'bureau', 'pickup')) DEFAULT 'domicile';

ALTER TABLE IF EXISTS orders
ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10, 2) DEFAULT 0;

-- ========== AUDIT LOG ==========

CREATE TABLE IF NOT EXISTS delivery_agencies_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES delivery_agencies(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  changes JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_audit_agency ON delivery_agencies_audit_log(agency_id);
CREATE INDEX IF NOT EXISTS idx_delivery_audit_date ON delivery_agencies_audit_log(created_at);

-- ========== SAMPLE DATA (optional) ==========

-- Uncomment to add sample delivery agencies
/*
INSERT INTO delivery_agencies (name, description, contact_phone, contact_email, price_domicile, price_bureau, is_active, is_visible)
VALUES
  ('Yassir Livraison', '🚗 Service rapide et fiable', '+213 XXX XXX XXX', 'contact@yassir.com', 300.00, 200.00, true, true),
  ('DZ Express', '📦 Livraison nationale', '+213 XXX XXX XXX', 'info@dzexpress.com', 350.00, 250.00, true, true),
  ('CourierDz', '🏍️ Coursier express', '+213 XXX XXX XXX', 'support@courierdz.com', 250.00, 150.00, true, true);
*/
