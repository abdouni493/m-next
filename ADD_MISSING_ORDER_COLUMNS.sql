-- Add missing timestamp columns to orders table
-- These columns are needed for order status tracking

-- Add confirmed_at column if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Add delivery_started_at column if it doesn't exist  
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_started_at TIMESTAMP;

-- Add delivered_at column if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Add cancelled_at column if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Add items_count column if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0;

-- Add thumbnail_image column if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS thumbnail_image VARCHAR(255);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;
