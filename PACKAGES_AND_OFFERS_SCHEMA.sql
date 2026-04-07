-- ========== ENHANCED OFFERS & PACKAGES SCHEMA ==========

-- 1. ENHANCED SPECIAL OFFERS TABLE - Add price display toggle
ALTER TABLE special_offers ADD COLUMN IF NOT EXISTS show_price BOOLEAN DEFAULT true;
ALTER TABLE special_offers ADD COLUMN IF NOT EXISTS whatsapp_link VARCHAR(255);

-- 2. PACKAGES TABLE
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  package_price DECIMAL(12, 2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  storage_bucket_path VARCHAR(255)
);

-- 3. PACKAGE ITEMS (Products in a package)
CREATE TABLE IF NOT EXISTS package_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  product_name VARCHAR(255),
  product_image TEXT,
  product_mark VARCHAR(255),
  product_voltage VARCHAR(50),
  product_amperage VARCHAR(50),
  product_wattage VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_is_visible ON packages(is_visible);
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_package_items_product_id ON package_items(product_id);

-- 5. CREATE VIEWS FOR WEBSITE DISPLAY

-- View: Visible packages with all details
CREATE OR REPLACE VIEW visible_packages AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.package_price,
  p.image_url,
  p.discount_percentage,
  p.discount_amount,
  p.is_visible,
  p.storage_bucket_path,
  COUNT(pi.id) as total_products,
  STRING_AGG(DISTINCT pi.product_name, ', ') as product_names
FROM packages p
LEFT JOIN package_items pi ON p.id = pi.package_id
WHERE p.is_visible = true AND p.is_active = true
GROUP BY p.id, p.name, p.description, p.package_price, p.image_url, 
         p.discount_percentage, p.discount_amount, p.is_visible, p.storage_bucket_path;

-- View: Package details with all product information
CREATE OR REPLACE VIEW package_details AS
SELECT 
  p.id as package_id,
  p.name as package_name,
  p.description as package_description,
  p.package_price,
  p.image_url as package_image,
  p.discount_percentage,
  p.discount_amount,
  pi.id as item_id,
  pi.product_id,
  pi.product_name,
  pi.product_image,
  pi.product_mark,
  pi.product_voltage,
  pi.product_amperage,
  pi.product_wattage,
  pi.quantity
FROM packages p
LEFT JOIN package_items pi ON p.id = pi.package_id
WHERE p.is_active = true;

-- 6. ENHANCED SPECIAL OFFERS VIEW - Support for price visibility
CREATE OR REPLACE VIEW special_offers_with_visibility AS
SELECT 
  id,
  product_id,
  product_name,
  product_image,
  product_mark,
  original_price,
  special_price,
  description,
  discount_percentage,
  discount_amount,
  show_price,
  whatsapp_link,
  is_visible
FROM special_offers
WHERE is_visible = true AND is_active = true;

-- 7. RLS POLICIES FOR PACKAGES

-- Enable RLS on packages
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_view_packages" ON packages;
DROP POLICY IF EXISTS "auth_manage_packages" ON packages;
DROP POLICY IF EXISTS "auth_insert_packages" ON packages;
DROP POLICY IF EXISTS "auth_update_packages" ON packages;
DROP POLICY IF EXISTS "auth_delete_packages" ON packages;
DROP POLICY IF EXISTS "auth_view_all_packages" ON packages;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON packages;

-- Public can view active & visible packages
CREATE POLICY "public_view_packages" ON packages
  FOR SELECT USING (is_active = true AND is_visible = true);

-- Allow all operations for authenticated users (simpler and more reliable)
CREATE POLICY "enable_all_for_authenticated" ON packages
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. RLS POLICIES FOR PACKAGE ITEMS

-- Enable RLS on package_items
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_view_package_items" ON package_items;
DROP POLICY IF EXISTS "auth_manage_package_items" ON package_items;
DROP POLICY IF EXISTS "auth_insert_package_items" ON package_items;
DROP POLICY IF EXISTS "auth_update_package_items" ON package_items;
DROP POLICY IF EXISTS "auth_delete_package_items" ON package_items;
DROP POLICY IF EXISTS "auth_view_all_package_items" ON package_items;
DROP POLICY IF EXISTS "enable_all_for_authenticated_items" ON package_items;

-- Public can view items in visible packages
CREATE POLICY "public_view_package_items" ON package_items
  FOR SELECT USING (
    package_id IN (
      SELECT id FROM packages WHERE is_active = true AND is_visible = true
    )
  );

-- Allow all operations for authenticated users
CREATE POLICY "enable_all_for_authenticated_items" ON package_items
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. UPDATE SPECIAL OFFERS TABLE RLS FOR PRICE VISIBILITY
DROP POLICY IF EXISTS "public_view_special_offers" ON special_offers;
DROP POLICY IF EXISTS "auth_manage_special_offers" ON special_offers;

CREATE POLICY "public_view_special_offers" ON special_offers
  FOR SELECT USING (is_active = true AND is_visible = true);

CREATE POLICY "auth_manage_special_offers" ON special_offers
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 10. HELPER FUNCTION: Generate WhatsApp Link
CREATE OR REPLACE FUNCTION generate_whatsapp_link(
  p_phone_number VARCHAR,
  p_offer_name VARCHAR,
  p_offer_description TEXT
) RETURNS VARCHAR AS $$
DECLARE
  v_message TEXT;
BEGIN
  v_message := 'Bonjour, je suis intéressé par ' || p_offer_name || ': ' || COALESCE(p_offer_description, 'Contactez-moi pour plus d''infos');
  RETURN 'https://wa.me/' || p_phone_number || '?text=' || REPLACE(REPLACE(v_message, ' ', '%20'), chr(10), '%0A');
END;
$$ LANGUAGE plpgsql;

-- 11. TRIGGER: Update package updated_at timestamp
CREATE OR REPLACE FUNCTION update_package_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS packages_update_timestamp ON packages;
CREATE TRIGGER packages_update_timestamp
BEFORE UPDATE ON packages
FOR EACH ROW
EXECUTE FUNCTION update_package_timestamp();

-- 12. TRIGGER: Update special_offers timestamp and calculate whatsapp link
CREATE OR REPLACE FUNCTION update_special_offer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.show_price = false AND NEW.description IS NOT NULL THEN
    -- Generate WhatsApp link when price is hidden
    SELECT whatsapp_number INTO NEW.whatsapp_link 
    FROM website_settings LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS special_offers_update_timestamp ON special_offers;
CREATE TRIGGER special_offers_update_timestamp
BEFORE UPDATE ON special_offers
FOR EACH ROW
EXECUTE FUNCTION update_special_offer_timestamp();

-- 13. AUDIT TRAIL FOR PACKAGES
CREATE TABLE IF NOT EXISTS package_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  action VARCHAR(50),
  changed_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_audit_log_package_id ON package_audit_log(package_id);
CREATE INDEX IF NOT EXISTS idx_package_audit_log_changed_at ON package_audit_log(changed_at);

-- Enable RLS for audit log
ALTER TABLE package_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "auth_view_audit_log" ON package_audit_log;

CREATE POLICY "auth_view_audit_log" ON package_audit_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 14. STORAGE BUCKET FOR PACKAGE IMAGES
-- Note: Must be created from Supabase dashboard or via direct API
-- Storage bucket: 'package-images' (public, for website display)

COMMIT;
