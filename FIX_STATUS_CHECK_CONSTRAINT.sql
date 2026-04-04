-- Check current status values in database
SELECT DISTINCT status
FROM public.orders;

-- Drop the old check constraint if it exists
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add correct check constraint with all valid status values
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'on_delivery', 'delivered', 'cancelled'));

-- Verify by checking a few orders
SELECT id, status FROM public.orders LIMIT 5;
