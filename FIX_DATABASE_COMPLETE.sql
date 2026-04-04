-- ============================================================================
-- COMPLETE DATABASE FIX FOR FINALIZE ORDER
-- ============================================================================
-- PURPOSE: Remove broken triggers so finalize order works
-- TIME: Copy & paste all below, click RUN in Supabase SQL Editor
-- ============================================================================

-- STEP 1: DROP ALL BROKEN TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_finalize_order ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_order_on_finalize ON orders CASCADE;
DROP TRIGGER IF EXISTS finalize_order_trigger ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_delivery ON orders CASCADE;
DROP TRIGGER IF EXISTS on_order_finalized ON orders CASCADE;

-- STEP 2: DROP ALL BROKEN FUNCTIONS
-- ============================================================================
DROP FUNCTION IF EXISTS finalize_order_deduct_inventory() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory() CASCADE;
DROP FUNCTION IF EXISTS on_order_finalized() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory_on_delivery() CASCADE;

-- ============================================================================
-- STEP 3: VERIFY - Check if triggers are removed
-- ============================================================================
-- Run this query - should return NO ROWS if everything is clean
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'order_items', 'products')
ORDER BY trigger_name;

-- Result: If empty, you're good! ✅

-- ============================================================================
-- OPTIONAL: View your orders table structure
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- ============================================================================
-- OPTIONAL: View your products table structure (especially inventory columns)
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Should have: quantity_on_hand (NOT "stock")

-- ============================================================================
-- OPTIONAL: Check your orders
-- ============================================================================
SELECT 
  id,
  customer_name,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
