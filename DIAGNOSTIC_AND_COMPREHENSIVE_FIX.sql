-- ============================================================================
-- DIAGNOSTIC: CHECK ALL TRIGGERS AND FUNCTIONS
-- ============================================================================
-- Run this to see what triggers/functions STILL EXIST in your database
-- ============================================================================

-- Show ALL triggers on ALL tables
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
ORDER BY event_object_table, trigger_name;

-- Show ALL functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- COMPREHENSIVE TRIGGER REMOVAL (if diagnostic shows triggers still exist)
-- ============================================================================
-- Copy and run this ONLY if the diagnostic above shows triggers still exist

-- Drop ALL triggers on orders table
DROP TRIGGER IF EXISTS trigger_finalize_order ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_order_on_finalize ON orders CASCADE;
DROP TRIGGER IF EXISTS finalize_order_trigger ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_delivery ON orders CASCADE;
DROP TRIGGER IF EXISTS on_order_finalized ON orders CASCADE;
DROP TRIGGER IF EXISTS update_order_on_finalize ON orders CASCADE;
DROP TRIGGER IF EXISTS after_order_update ON orders CASCADE;
DROP TRIGGER IF EXISTS check_order_status ON orders CASCADE;

-- Drop ALL triggers on order_items table
DROP TRIGGER IF EXISTS trigger_inventory_update ON order_items CASCADE;
DROP TRIGGER IF EXISTS inventory_trigger ON order_items CASCADE;
DROP TRIGGER IF EXISTS update_inventory ON order_items CASCADE;

-- Drop ALL triggers on products table
DROP TRIGGER IF EXISTS update_product_stock ON products CASCADE;
DROP TRIGGER IF EXISTS stock_update ON products CASCADE;

-- Drop ALL functions that might be used by triggers
DROP FUNCTION IF EXISTS finalize_order_deduct_inventory() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory() CASCADE;
DROP FUNCTION IF EXISTS on_order_finalized() CASCADE;
DROP FUNCTION IF EXISTS deduct_order_inventory_on_delivery() CASCADE;
DROP FUNCTION IF EXISTS update_product_on_order() CASCADE;
DROP FUNCTION IF EXISTS handle_order_finalize() CASCADE;
DROP FUNCTION IF EXISTS check_order() CASCADE;

-- ============================================================================
-- VERIFY - Run this to confirm ALL triggers are gone
-- ============================================================================

SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'order_items', 'products')
ORDER BY event_object_table, trigger_name;

-- Expected result: (0 rows) - meaning NO triggers exist
