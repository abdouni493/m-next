-- ============================================
-- EXACT SQL TO RUN IN SUPABASE
-- ============================================
-- Copy and paste these commands one at a time into Supabase SQL Editor

-- STEP 1: Verify the products table structure
-- (This just checks, doesn't modify anything)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;


-- STEP 2: Add primary_image column if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS primary_image TEXT;


-- STEP 3: Update primary_image with first image from product_images
-- This sets the featured image from existing product images
UPDATE products p 
SET primary_image = (
  SELECT image_url 
  FROM product_images pi 
  WHERE pi.product_id = p.id 
  ORDER BY 
    CASE WHEN is_primary = true THEN 0 ELSE 1 END,
    display_order ASC,
    created_at ASC
  LIMIT 1
) 
WHERE primary_image IS NULL 
AND EXISTS (
  SELECT 1 FROM product_images 
  WHERE product_id = p.id
);


-- STEP 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_primary_image ON products(primary_image);


-- STEP 5: Verify the results - should see primary_image URLs
SELECT 
  id,
  name,
  primary_image,
  (SELECT COUNT(*) FROM product_images WHERE product_id = products.id) as total_images
FROM products
WHERE is_active = true
LIMIT 20;


-- OPTIONAL: If you want to update all products (even if they already have primary_image)
-- WARNING: Only run this if you want to refresh all primary images
-- UPDATE products p 
-- SET primary_image = (
--   SELECT image_url 
--   FROM product_images pi 
--   WHERE pi.product_id = p.id 
--   ORDER BY 
--     CASE WHEN is_primary = true THEN 0 ELSE 1 END,
--     display_order ASC,
--     created_at ASC
--   LIMIT 1
-- ) 
-- WHERE EXISTS (
--   SELECT 1 FROM product_images 
--   WHERE product_id = p.id
-- );


-- ============================================
-- HOW TO RUN IN SUPABASE:
-- ============================================
-- 1. Open your Supabase project
-- 2. Go to: SQL Editor (left menu)
-- 3. Create a new query
-- 4. Copy STEP 1 and run it (to verify)
-- 5. Copy STEP 2 and run it (to add column)
-- 6. Copy STEP 3 and run it (to populate data)
-- 7. Copy STEP 4 and run it (to add index)
-- 8. Copy STEP 5 and run it (to verify results)
--
-- Each step should show "Success" at the bottom
-- ============================================
