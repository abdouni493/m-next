-- ===================================================================
-- CREATE ADMIN USER ACCOUNT
-- Email: admin@admin.com
-- Password: admin123
-- Role: admin
-- ===================================================================

-- IMPORTANT: Follow these steps:
-- 1. Run this SQL in your Supabase SQL Editor (NOT recommended for production)
-- 2. OR use the Supabase Auth Dashboard to manually create the user
-- 3. OR use Supabase Admin API (recommended for production)

-- ===================================================================
-- METHOD 1: MANUAL CREATION (RECOMMENDED - Most Secure)
-- ===================================================================
-- 1. Go to: https://app.supabase.com/project/[your-project-id]/auth/users
-- 2. Click "Add user" button
-- 3. Enter:
--    Email: admin@admin.com
--    Password: admin123
--    Auto confirm user: YES
-- 4. Then run the SQL below to create the user profile

-- ===================================================================
-- METHOD 2: SQL - CREATE USER PROFILE (After auth user is created)
-- ===================================================================
-- First, get the UUID of the created user from Supabase Auth
-- Then replace 'YOUR_UUID_HERE' with the actual user ID

INSERT INTO public.users (
  id,
  email,
  username,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'YOUR_UUID_HERE',  -- Replace with actual UUID from auth.users
  'admin@admin.com',
  'admin',
  'admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ===================================================================
-- METHOD 3: COMPLETE SQL (If you have direct access to auth.users)
-- ===================================================================
-- NOTE: This method requires Supabase service role key or direct DB access
-- DO NOT run this directly - use auth dashboard instead

-- Insert into auth.users (requires special permissions):
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   role,
--   aud,
--   confirmation_token,
--   recovery_token,
--   email_change_token_new,
--   email_change,
--   last_sign_in_at,
--   raw_app_meta_data,
--   raw_user_meta_data,
--   is_super_admin,
--   is_sso_user
-- ) VALUES (
--   gen_random_uuid(),
--   'admin@admin.com',
--   crypt('admin123', gen_salt('bf')),
--   CURRENT_TIMESTAMP,
--   CURRENT_TIMESTAMP,
--   CURRENT_TIMESTAMP,
--   'authenticated',
--   'authenticated',
--   '',
--   '',
--   '',
--   '',
--   CURRENT_TIMESTAMP,
--   '{"provider":"email","providers":["email"]}',
--   '{}',
--   false,
--   false
-- );

-- ===================================================================
-- QUICKEST METHOD: Use Supabase Auth API in your App
-- ===================================================================
-- Run this in your browser console while logged in as admin:
-- 
-- import { signUp } from '@/lib/supabaseClient';
-- await signUp('admin@admin.com', 'admin123', 'admin');
--
-- Then manually set the role to 'admin' in the dashboard

-- ===================================================================
-- VERIFY ADMIN USER WAS CREATED
-- ===================================================================
-- Run this query to confirm:
SELECT id, email, username, role, is_active, created_at 
FROM public.users 
WHERE email = 'admin@admin.com';

-- Expected output:
-- id          | email           | username | role  | is_active | created_at
-- [UUID]      | admin@admin.com | admin    | admin | true      | [timestamp]

-- ===================================================================
-- USEFUL: List all admin users
-- ===================================================================
SELECT id, email, username, role, is_active, created_at 
FROM public.users 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ===================================================================
-- USEFUL: Update user role to admin
-- ===================================================================
-- If you created the user but need to change role:
UPDATE public.users 
SET role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@admin.com';

-- ===================================================================
-- USEFUL: Delete admin user (if needed)
-- ===================================================================
-- DELETE FROM public.users WHERE email = 'admin@admin.com';
-- NOTE: This only deletes the profile. To delete from auth, use Supabase Dashboard

-- ===================================================================
-- END OF ADMIN USER SETUP
-- ===================================================================
