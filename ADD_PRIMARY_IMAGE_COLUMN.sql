-- Add primary_image column to products table (if it doesn't exist)
-- This is needed to store the primary image URL for quick access

-- 1. Add the column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image TEXT DEFAULT NULL;

-- 2. Create a comment for documentation
COMMENT ON COLUMN products.primary_image IS 'URL of the primary/featured image for the product from chargers bucket';

-- 3. Populate existing products with their primary image from product_images table
-- Get the first image marked as primary, or the first image chronologically
UPDATE products p
SET primary_image = (
  SELECT image_url 
  FROM product_images pi 
  WHERE pi.product_id = p.id 
  ORDER BY CASE WHEN is_primary THEN 0 ELSE 1 END, display_order ASC, created_at ASC 
  LIMIT 1
)
WHERE primary_image IS NULL AND EXISTS (
  SELECT 1 FROM product_images WHERE product_id = p.id
);

-- 4. Verify the update
SELECT id, name, primary_image, (SELECT COUNT(*) FROM product_images WHERE product_id = products.id) as image_count
FROM products
LIMIT 10;

-- Done! Now the primary_image column is ready for direct updates from the application.
