-- ========== WEBSITE MANAGEMENT SCHEMA ==========

-- 1. Website Settings Table
CREATE TABLE IF NOT EXISTS website_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  slogan VARCHAR(500),
  description TEXT,
  logo_url TEXT,
  logo_data BYTEA,
  facebook_url VARCHAR(500),
  instagram_url VARCHAR(500),
  tiktok_url VARCHAR(500),
  snapchat_url VARCHAR(500),
  location VARCHAR(500),
  phone_number VARCHAR(20),
  whatsapp_number VARCHAR(20),
  telegram_number VARCHAR(20),
  currency VARCHAR(10) DEFAULT 'DZD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT one_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid OR id IS NOT NULL)
);

-- Insert default row
INSERT INTO website_settings (id, store_name, slogan, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Mon Magasin', 'Votre partenaire de confiance', 'Bienvenue sur notre boutique en ligne')
ON CONFLICT (id) DO NOTHING;

-- 2. Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  original_price DECIMAL(10, 2) NOT NULL,
  offer_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  offer_type VARCHAR(50) DEFAULT 'regular', -- 'regular' or 'special'
  discount_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    ROUND(((original_price - offer_price) / original_price) * 100, 2)
  ) STORED,
  discount_amount DECIMAL(10, 2) GENERATED ALWAYS AS (
    ROUND(original_price - offer_price, 2)
  ) STORED,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  product_name VARCHAR(255),
  product_image TEXT,
  product_mark VARCHAR(255),
  product_description TEXT
);

-- Create index for offers
CREATE INDEX idx_offers_product_id ON offers(product_id);
CREATE INDEX idx_offers_is_visible ON offers(is_visible);
CREATE INDEX idx_offers_is_active ON offers(is_active);

-- 3. Special Offers Table (inherits from offers, but with different properties)
CREATE TABLE IF NOT EXISTS special_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  original_price DECIMAL(10, 2) NOT NULL,
  special_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  discount_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    ROUND(((original_price - special_price) / original_price) * 100, 2)
  ) STORED,
  discount_amount DECIMAL(10, 2) GENERATED ALWAYS AS (
    ROUND(original_price - special_price, 2)
  ) STORED,
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  product_name VARCHAR(255),
  product_image TEXT,
  product_mark VARCHAR(255),
  product_description TEXT
);

-- Create index for special offers
CREATE INDEX idx_special_offers_product_id ON special_offers(product_id);
CREATE INDEX idx_special_offers_is_visible ON special_offers(is_visible);
CREATE INDEX idx_special_offers_is_active ON special_offers(is_active);

-- ========== VIEWS FOR WEBSITE DISPLAY ==========

-- View for visible offers with product details
CREATE OR REPLACE VIEW visible_offers AS
SELECT 
  o.id,
  o.product_id,
  o.product_name,
  o.product_mark,
  o.product_image,
  o.product_description,
  o.original_price,
  o.offer_price,
  o.description,
  o.discount_percentage,
  o.discount_amount,
  o.start_date,
  o.end_date,
  'offer' as offer_type
FROM offers o
WHERE is_visible = true AND is_active = true
  AND (end_date IS NULL OR end_date > NOW());

-- View for visible special offers with product details
CREATE OR REPLACE VIEW visible_special_offers AS
SELECT 
  so.id,
  so.product_id,
  so.product_name,
  so.product_mark,
  so.product_image,
  so.product_description,
  so.original_price,
  so.special_price as offer_price,
  so.description,
  so.discount_percentage,
  so.discount_amount,
  so.start_date,
  so.end_date,
  'special' as offer_type
FROM special_offers so
WHERE is_visible = true AND is_active = true
  AND (end_date IS NULL OR end_date > NOW());

-- Combined view for all offers
CREATE OR REPLACE VIEW all_visible_offers AS
SELECT * FROM visible_offers
UNION ALL
SELECT * FROM visible_special_offers;

-- ========== RLS POLICIES ==========

-- Enable RLS
ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

-- Website Settings Policies (allow all authenticated users to read, admins to write)
CREATE POLICY "Allow all users to read website settings"
  ON website_settings FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to update website settings"
  ON website_settings FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Offers Policies
CREATE POLICY "Allow all users to read visible offers"
  ON offers FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to create offers"
  ON offers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update their offers"
  ON offers FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete their offers"
  ON offers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Special Offers Policies
CREATE POLICY "Allow all users to read visible special offers"
  ON special_offers FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to create special offers"
  ON special_offers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update their special offers"
  ON special_offers FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete their special offers"
  ON special_offers FOR DELETE
  USING (auth.role() = 'authenticated');

-- ========== FUNCTIONS ==========

-- Function to calculate discount
CREATE OR REPLACE FUNCTION calculate_discount(original DECIMAL, new_price DECIMAL)
RETURNS TABLE(discount_amount DECIMAL, discount_percentage DECIMAL) AS $$
BEGIN
  RETURN QUERY SELECT 
    ROUND(original - new_price, 2),
    ROUND(((original - new_price) / original) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update website_settings updated_at timestamp
CREATE OR REPLACE FUNCTION update_website_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for website_settings
CREATE TRIGGER update_website_settings_updated_at
BEFORE UPDATE ON website_settings
FOR EACH ROW
EXECUTE FUNCTION update_website_settings_timestamp();

-- Function to update offers updated_at timestamp
CREATE OR REPLACE FUNCTION update_offers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for offers
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION update_offers_timestamp();

-- Function to update special_offers updated_at timestamp
CREATE OR REPLACE FUNCTION update_special_offers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for special_offers
CREATE TRIGGER update_special_offers_updated_at
BEFORE UPDATE ON special_offers
FOR EACH ROW
EXECUTE FUNCTION update_special_offers_timestamp();
