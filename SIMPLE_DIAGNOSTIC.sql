-- ============================================================================
-- SIMPLE DIAGNOSTIC - CHECK WHAT TRIGGERS EXIST
-- ============================================================================
-- Run this in Supabase SQL Editor

SELECT 
  trigger_name,
  event_object_table,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('orders', 'order_items', 'products')
ORDER BY event_object_table, trigger_name;

-- Expected: (0 rows) = triggers are gone ✅
-- If you see triggers listed: Copy their names and tell me
