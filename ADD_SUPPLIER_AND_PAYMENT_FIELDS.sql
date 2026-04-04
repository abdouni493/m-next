-- Add supplier_id and amount_paid columns to products table if they don't exist

-- Add supplier_id column (foreign key to suppliers table)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- Add amount_paid column (for tracking payment amount)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Set permissions for these columns
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Ensure RLS policies allow authenticated users to insert/update these fields
-- If you have existing policies, make sure they don't restrict these columns
