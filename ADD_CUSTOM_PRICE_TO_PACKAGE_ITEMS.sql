-- Add custom_price column to package_items table
ALTER TABLE package_items ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10, 2);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_package_items_custom_price ON package_items(custom_price);
