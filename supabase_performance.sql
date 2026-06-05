-- ============================================================
-- SUPABASE PERFORMANCE OPTIMIZATION
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. INDEXES — fastest single change for query speed
-- ============================================================

-- products
CREATE INDEX IF NOT EXISTS idx_products_is_active       ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_mark_id          ON products (mark_id);
CREATE INDEX IF NOT EXISTS idx_products_connector_type   ON products (connector_type_id);
CREATE INDEX IF NOT EXISTS idx_products_is_visible       ON products (is_visible);
CREATE INDEX IF NOT EXISTS idx_products_active_visible   ON products (is_active, is_visible);

-- product_images  ← most critical: every product detail modal hits this
CREATE INDEX IF NOT EXISTS idx_product_images_product_id  ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary      ON product_images (product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_order        ON product_images (product_id, display_order);

-- offers / special_offers
CREATE INDEX IF NOT EXISTS idx_offers_product_id          ON offers (product_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_visible          ON offers (is_visible);
CREATE INDEX IF NOT EXISTS idx_offers_visible_product     ON offers (is_visible, product_id);

CREATE INDEX IF NOT EXISTS idx_special_offers_product_id  ON special_offers (product_id);
CREATE INDEX IF NOT EXISTS idx_special_offers_is_visible  ON special_offers (is_visible);

-- packages
CREATE INDEX IF NOT EXISTS idx_packages_is_visible        ON packages (is_visible);
CREATE INDEX IF NOT EXISTS idx_package_items_package_id   ON package_items (package_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_status              ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at          ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone      ON orders (customer_phone);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id       ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id     ON order_items (product_id);

-- marks (brands)
CREATE INDEX IF NOT EXISTS idx_marks_name                 ON marks (name);

-- testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_is_approved   ON testimonials (is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_client_name   ON testimonials (client_name);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved_date ON testimonials (is_approved, created_at DESC);

-- website_settings (single-row table, index on id is enough — already PK)

-- delivery_agencies
CREATE INDEX IF NOT EXISTS idx_delivery_agencies_active   ON delivery_agencies (is_active, is_visible);

-- delivery_wilaya_prices  (for wilaya-specific pricing lookup)
CREATE INDEX IF NOT EXISTS idx_dwp_agency_wilaya          ON delivery_wilaya_prices (agency_id, wilaya_name, delivery_type);

-- ============================================================
-- 2. PRIMARY IMAGE — denormalize onto products table
--    Stores the primary image URL directly on the product row
--    so the website listing page needs ZERO joins to product_images
-- ============================================================

-- Add column if it doesn't exist yet
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS primary_image TEXT;

-- Backfill: set primary_image from product_images where is_primary = true
UPDATE products p
SET    primary_image = pi.image_url
FROM   product_images pi
WHERE  pi.product_id = p.id
  AND  pi.is_primary = true
  AND  (p.primary_image IS NULL OR p.primary_image = '');

-- Trigger: keep primary_image in sync whenever product_images changes
CREATE OR REPLACE FUNCTION sync_primary_image()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Recalculate from remaining rows
    UPDATE products
    SET primary_image = (
      SELECT image_url FROM product_images
      WHERE product_id = OLD.product_id AND is_primary = true
      ORDER BY display_order LIMIT 1
    )
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;

  -- INSERT or UPDATE: only act when is_primary flips to true
  IF NEW.is_primary = true THEN
    -- Clear any existing primary flag on siblings
    UPDATE product_images
    SET    is_primary = false
    WHERE  product_id = NEW.product_id
      AND  id <> NEW.id
      AND  is_primary = true;

    -- Write URL to products row
    UPDATE products
    SET    primary_image = NEW.image_url
    WHERE  id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_primary_image ON product_images;
CREATE TRIGGER trg_sync_primary_image
AFTER INSERT OR UPDATE OR DELETE ON product_images
FOR EACH ROW EXECUTE FUNCTION sync_primary_image();

-- ============================================================
-- 3. FAST VIEWS — replace slow per-request filtering
-- ============================================================

-- Visible products with primary image + brand + connector (used by website listing)
CREATE OR REPLACE VIEW visible_products AS
SELECT
  p.id,
  p.name,
  p.description,
  p.voltage,
  p.wattage,
  p.amperage,
  p.price,
  p.stock_quantity,
  p.is_visible,
  p.is_active,
  p.primary_image,
  m.name  AS mark_name,
  m.id    AS mark_id,
  m.logo_url AS mark_logo_url,
  ct.name AS connection_type,
  ct.id   AS connector_type_id
FROM products p
LEFT JOIN marks             m  ON m.id  = p.mark_id
LEFT JOIN connector_types   ct ON ct.id = p.connector_type_id
WHERE p.is_active  = true
  AND p.is_visible = true;

-- Visible offers with product data pre-joined
CREATE OR REPLACE VIEW visible_offers AS
SELECT
  o.*,
  p.primary_image AS product_image,
  m.name          AS product_mark,
  p.voltage, p.wattage, p.amperage,
  ct.name         AS connection_type
FROM offers o
JOIN products       p  ON p.id  = o.product_id
LEFT JOIN marks     m  ON m.id  = p.mark_id
LEFT JOIN connector_types ct ON ct.id = p.connector_type_id
WHERE o.is_visible = true;

-- Visible special offers with product data pre-joined
CREATE OR REPLACE VIEW visible_special_offers AS
SELECT
  so.*,
  p.primary_image AS product_image,
  m.name          AS product_mark,
  p.voltage, p.wattage, p.amperage,
  ct.name         AS connection_type
FROM special_offers so
JOIN products       p  ON p.id  = so.product_id
LEFT JOIN marks     m  ON m.id  = p.mark_id
LEFT JOIN connector_types ct ON ct.id = p.connector_type_id
WHERE so.is_visible = true;

-- Visible packages (no heavy join needed, just filter)
CREATE OR REPLACE VIEW visible_packages AS
SELECT * FROM packages WHERE is_visible = true;

-- ============================================================
-- 4. STORAGE — set long-lived Cache-Control on existing files
--    (new uploads already use 31536000 via the app fix)
-- ============================================================
-- You cannot set cache headers retroactively via SQL.
-- Do it in the Supabase Dashboard:
--   Storage → chargers bucket → Settings → Cache Control → 31536000
-- OR run via Supabase CLI:
--   supabase storage update bucket chargers --public --file-size-limit 10485760

-- ============================================================
-- 5. CONNECTION POOLING — add to supabase project settings
-- ============================================================
-- In Supabase Dashboard → Settings → Database → Connection Pooling:
--   Mode: Transaction   (best for serverless / edge)
--   Pool Size: 15

-- ============================================================
-- 6. STATISTICS — help query planner make better index choices
-- ============================================================
ANALYZE products;
ANALYZE product_images;
ANALYZE offers;
ANALYZE special_offers;
ANALYZE packages;
ANALYZE orders;
ANALYZE order_items;
ANALYZE testimonials;

-- ============================================================
-- 7. VACUUM — reclaim storage, reset bloat
-- ============================================================
VACUUM ANALYZE products;
VACUUM ANALYZE product_images;
VACUUM ANALYZE orders;

-- ============================================================
-- VERIFY: check index usage after running queries
-- ============================================================
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
-- FROM   pg_stat_user_indexes
-- WHERE  schemaname = 'public'
-- ORDER  BY idx_scan DESC;
