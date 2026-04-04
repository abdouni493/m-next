-- ========================================
-- Migration: Fix Primary Image Display
-- ========================================
-- This migration ensures the primary_image column exists in the products table
-- and populates it with the first image from product_images table if empty

-- Step 1: Check if primary_image column exists, if not create it
-- NOTE: Run this in Supabase SQL Editor to check column existence
-- SELECT EXISTS (
--   SELECT 1 FROM information_schema.columns 
--   WHERE table_name = 'products' AND column_name = 'primary_image'
-- );

-- Step 2: Add primary_image column if it doesn't exist
-- Uncomment and run if column doesn't exist:
/*
ALTER TABLE products
ADD COLUMN IF NOT EXISTS primary_image TEXT;
*/

-- Step 3: Populate primary_image from product_images table where it's empty
-- This will get the first image marked as primary, or the first image if none marked as primary
UPDATE products p 
SET primary_image = (
  SELECT image_url 
  FROM product_images pi 
  WHERE pi.product_id = p.id 
  ORDER BY 
    CASE WHEN is_primary = true THEN 0 ELSE 1 END ASC,
    display_order ASC,
    created_at ASC
  LIMIT 1
) 
WHERE primary_image IS NULL 
AND EXISTS (
  SELECT 1 FROM product_images 
  WHERE product_id = p.id
);

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_primary_image ON products(primary_image);

-- Step 5: Verify the migration
SELECT 
  id,
  name,
  primary_image,
  (SELECT COUNT(*) FROM product_images WHERE product_id = products.id) as total_images
FROM products
LIMIT 20;

-- ========================================
-- INSTRUCTIONS:
-- ========================================
-- 1. Copy the SQL code above into Supabase SQL Editor
-- 2. Run Step 2 first (add column if needed)
-- 3. Run Step 3 (populate primary_image)
-- 4. Run Step 4 (create index for performance)
-- 5. Run Step 5 to verify the results
--
-- After running this migration:
-- - Images should appear on all cards
-- - Images should appear in detail view
-- - Images should appear in edit form
-- ========================================
