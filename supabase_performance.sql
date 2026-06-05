-- ============================================================
-- SUPABASE PERFORMANCE OPTIMIZATION — CORRECTED FOR YOUR SCHEMA
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. INDEXES
-- ============================================================

-- products  (no is_visible column on this table — only is_active)
CREATE INDEX IF NOT EXISTS idx_products_is_active       ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_mark_id         ON products (mark_id);
CREATE INDEX IF NOT EXISTS idx_products_connector_type  ON products (connector_type_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id     ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id     ON products (supplier_id);

-- product_images  ← most critical: every product detail modal hits this
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary    ON product_images (product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_order      ON product_images (product_id, display_order);

-- offers
CREATE INDEX IF NOT EXISTS idx_offers_product_id        ON offers (product_id);
CREATE INDEX IF NOT EXISTS idx_offers_is_visible        ON offers (is_visible);
CREATE INDEX IF NOT EXISTS idx_offers_visible_product   ON offers (is_visible, product_id);

-- special_offers
CREATE INDEX IF NOT EXISTS idx_special_offers_product_id ON special_offers (product_id);
CREATE INDEX IF NOT EXISTS idx_special_offers_is_visible ON special_offers (is_visible);

-- packages
CREATE INDEX IF NOT EXISTS idx_packages_is_visible      ON packages (is_visible);
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items (package_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_status            ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at        ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone    ON orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_agency   ON orders (delivery_agency_id);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id     ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id   ON order_items (product_id);

-- marks (brands)
CREATE INDEX IF NOT EXISTS idx_marks_name               ON marks (name);
CREATE INDEX IF NOT EXISTS idx_marks_is_active          ON marks (is_active);

-- client_testimonials  (your table is called client_testimonials, not testimonials)
CREATE INDEX IF NOT EXISTS idx_testimonials_is_approved  ON client_testimonials (is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_client_name  ON client_testimonials (client_name);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved_dt  ON client_testimonials (is_approved, created_at DESC);

-- delivery_agencies
CREATE INDEX IF NOT EXISTS idx_delivery_agencies_active  ON delivery_agencies (is_active, is_visible);

-- delivery_agency_wilaya_prices  (correct table name)
--   columns: delivery_id, wilaya_code, wilaya_name, price_domicile, price_bureau
CREATE INDEX IF NOT EXISTS idx_dawp_delivery_wilaya      ON delivery_agency_wilaya_prices (delivery_id, wilaya_name);
CREATE INDEX IF NOT EXISTS idx_dawp_delivery_code        ON delivery_agency_wilaya_prices (delivery_id, wilaya_code);

-- invoices / invoice_items
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id      ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status           ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at       ON invoices (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id  ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id  ON invoice_items (product_id);

-- inventory_transactions
CREATE INDEX IF NOT EXISTS idx_inv_tx_product_id         ON inventory_transactions (product_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created_at         ON inventory_transactions (created_at DESC);

-- caisse_transactions
CREATE INDEX IF NOT EXISTS idx_caisse_type_date          ON caisse_transactions (transaction_type, transaction_date DESC);

-- ============================================================
-- 2. PRIMARY IMAGE — backfill + keep in sync via trigger
--    products.primary_image already exists in your schema ✓
-- ============================================================

-- Backfill any products that are missing their primary_image
UPDATE products p
SET    primary_image = pi.image_url
FROM   product_images pi
WHERE  pi.product_id = p.id
  AND  pi.is_primary = true
  AND  (p.primary_image IS NULL OR p.primary_image = '');

-- Trigger function: keeps primary_image on products in sync
CREATE OR REPLACE FUNCTION sync_primary_image()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products
    SET primary_image = (
      SELECT image_url FROM product_images
      WHERE product_id = OLD.product_id AND is_primary = true
      ORDER BY display_order ASC LIMIT 1
    )
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;

  IF NEW.is_primary = true THEN
    -- Clear other primary flags on siblings
    UPDATE product_images
    SET    is_primary = false
    WHERE  product_id = NEW.product_id
      AND  id <> NEW.id
      AND  is_primary = true;

    -- Write URL directly to products row (eliminates join on listing)
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
-- 3. OPTIMIZED VIEWS  (matching your actual column names)
-- ============================================================

-- Active products with primary image + brand + connector
-- NOTE: products has no is_visible — filtered only by is_active
CREATE OR REPLACE VIEW visible_products AS
SELECT
  p.id,
  p.name,
  p.description,
  p.voltage,
  p.wattage,
  p.amperage,
  p.selling_price                AS price,
  p.quantity_on_hand             AS stock_quantity,
  p.quantity_available,
  p.is_active,
  p.primary_image,
  p.model_number,
  m.name     AS mark_name,
  m.id       AS mark_id,
  m.logo_url AS mark_logo_url,
  ct.name    AS connection_type,
  ct.id      AS connector_type_id
FROM products p
LEFT JOIN marks           m  ON m.id  = p.mark_id
LEFT JOIN connector_types ct ON ct.id = p.connector_type_id
WHERE p.is_active = true;

-- Visible offers with product data pre-joined (no extra query needed)
CREATE OR REPLACE VIEW visible_offers_full AS
SELECT
  o.id,
  o.product_id,
  o.original_price,
  o.offer_price,
  o.description,
  o.is_visible,
  o.discount_percentage,
  o.start_date,
  o.end_date,
  o.product_name,
  o.product_image,
  o.product_mark,
  o.product_description,
  o.created_at,
  p.primary_image           AS product_primary_image,
  p.voltage, p.wattage, p.amperage,
  m.name                    AS mark_resolved,
  ct.name                   AS connection_type
FROM offers o
JOIN products       p  ON p.id  = o.product_id
LEFT JOIN marks     m  ON m.id  = p.mark_id
LEFT JOIN connector_types ct ON ct.id = p.connector_type_id
WHERE o.is_visible = true
  AND o.is_active  = true;

-- Visible special offers with product data pre-joined
CREATE OR REPLACE VIEW visible_special_offers_full AS
SELECT
  so.id,
  so.product_id,
  so.original_price,
  so.special_price,
  so.description,
  so.is_visible,
  so.discount_percentage,
  so.start_date,
  so.end_date,
  so.product_name,
  so.product_image,
  so.product_mark,
  so.product_description,
  so.created_at,
  p.primary_image           AS product_primary_image,
  p.voltage, p.wattage, p.amperage,
  m.name                    AS mark_resolved,
  ct.name                   AS connection_type
FROM special_offers so
JOIN products       p  ON p.id  = so.product_id
LEFT JOIN marks     m  ON m.id  = p.mark_id
LEFT JOIN connector_types ct ON ct.id = p.connector_type_id
WHERE so.is_visible = true
  AND so.is_active  = true;

-- Visible packages
CREATE OR REPLACE VIEW visible_packages AS
SELECT * FROM packages
WHERE is_visible = true
  AND is_active  = true;

-- Approved testimonials (ready for website display)
CREATE OR REPLACE VIEW approved_testimonials AS
SELECT id, client_name, opinion, rating, created_at
FROM   client_testimonials
WHERE  is_approved = true
  AND  is_active   = true
ORDER  BY created_at DESC;

-- ============================================================
-- 4. STATISTICS  — let query planner pick the best index
-- ============================================================
ANALYZE products;
ANALYZE product_images;
ANALYZE offers;
ANALYZE special_offers;
ANALYZE packages;
ANALYZE package_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE client_testimonials;
ANALYZE delivery_agencies;
ANALYZE delivery_agency_wilaya_prices;
ANALYZE invoices;
ANALYZE invoice_items;
ANALYZE marks;

-- ============================================================
-- 5. VACUUM  — reclaim storage bloat
-- ============================================================
VACUUM ANALYZE products;
VACUUM ANALYZE product_images;
VACUUM ANALYZE orders;
VACUUM ANALYZE order_items;
VACUUM ANALYZE client_testimonials;

-- ============================================================
-- VERIFY indexes were created
-- ============================================================
SELECT
  tablename,
  indexname,
  idx_scan   AS times_used
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
