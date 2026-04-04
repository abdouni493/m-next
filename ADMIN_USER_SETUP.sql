-- ===================================================================
-- COMPLETE SQL SETUP FOR ADMIN ACCOUNT
-- ===================================================================
-- This file contains all the SQL you need to set up your admin account
-- Follow the instructions step by step

-- ===================================================================
-- STEP 1: CREATE ADMIN USER IN SUPABASE AUTH
-- ===================================================================
-- DO NOT RUN THIS SQL - Use Supabase Dashboard instead:
-- 
-- 1. Go to: https://app.supabase.com/project/[YOUR-PROJECT-ID]/auth/users
-- 2. Click "Add user"
-- 3. Email: admin@admin.com
-- 4. Password: admin123
-- 5. Check "Auto confirm user"
-- 6. Click "Create user"
-- 7. COPY the UUID that appears
-- 8. Replace [PASTE_UUID_HERE] below with your copied UUID

-- ===================================================================
-- STEP 2: CREATE ADMIN USER PROFILE
-- ===================================================================
-- After you create the auth user, run THIS SQL in Supabase SQL Editor:
--
-- Copy the UUID from step 1, then replace [PASTE_UUID_HERE] below:

INSERT INTO public.users (
  id,
  email,
  username,
  role,
  phone,
  is_active,
  created_at,
  updated_at
) VALUES (
  '1f6c9610-89ab-460d-b3b3-84100b2d3a6f',  -- <- REPLACE WITH YOUR UUID FROM STEP 1
  'admin@admin.com',
  'admin',
  'admin',
  NULL,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ===================================================================
-- STEP 3: VERIFY ADMIN USER WAS CREATED
-- ===================================================================
-- Run this to confirm:

SELECT 
  id,
  email,
  username,
  role,
  is_active,
  created_at
FROM public.users
WHERE email = 'admin@admin.com';

-- Expected output:
-- ┌─────────────────────────────────────────┬──────────────────────┬──────────┬────────┬───────────┐
-- │ id                                      │ email                │ username │ role   │ is_active │
-- ├─────────────────────────────────────────┼──────────────────────┼──────────┼────────┼───────────┤
-- │ [your-uuid]                             │ admin@admin.com      │ admin    │ admin  │ true      │
-- └─────────────────────────────────────────┴──────────────────────┴──────────┴────────┴───────────┘

-- ===================================================================
-- STEP 4: VIEW ALL ADMIN USERS (Optional)
-- ===================================================================
-- See all users with admin role:

SELECT 
  id,
  email,
  username,
  role,
  is_active,
  created_at,
  updated_at
FROM public.users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ===================================================================
-- STEP 5: UPDATE USER ROLE (If needed)
-- ===================================================================
-- If you created a user but need to change their role to admin:

UPDATE public.users
SET role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@admin.com';

-- ===================================================================
-- STEP 6: RESET ADMIN PASSWORD (If needed)
-- ===================================================================
-- To change password, use Supabase Dashboard:
-- 1. Go to: Auth → Users
-- 2. Click on admin@admin.com
-- 3. Click "Reset password"
-- 4. Send password reset email

-- OR delete and recreate the user (see below)

-- ===================================================================
-- STEP 7: DELETE USER (If needed)
-- ===================================================================
-- To delete the admin user profile from database:

DELETE FROM public.users
WHERE email = 'admin@admin.com';

-- To delete from auth, use Supabase Dashboard:
-- 1. Go to: https://app.supabase.com/project/[ID]/auth/users
-- 2. Find admin@admin.com
-- 3. Click the three dots (...)
-- 4. Click "Delete user"

-- ===================================================================
-- REFERENCE: USER ROLES IN DATABASE
-- ===================================================================
-- Available roles:
-- - 'admin' - Full system access
-- - 'employee' - Limited access

-- Check role constraints:
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users';

-- ===================================================================
-- REFERENCE: CREATE MULTIPLE ADMIN USERS
-- ===================================================================
-- If you need multiple admin accounts, create them this way:

-- First create in Auth Dashboard (Steps 1-3 above for each user)
-- Then run this for each user's UUID:

-- INSERT INTO public.users (id, email, username, role, is_active, created_at, updated_at)
-- VALUES (
--   '[SECOND_UUID]',
--   'admin2@admin.com',
--   'admin2',
--   'admin',
--   true,
--   CURRENT_TIMESTAMP,
--   CURRENT_TIMESTAMP
-- );

-- ===================================================================
-- REFERENCE: CREATE EMPLOYEE USER
-- ===================================================================
-- To create a regular employee (non-admin), use role = 'employee':

-- INSERT INTO public.users (id, email, username, role, is_active, created_at, updated_at)
-- VALUES (
--   '[EMPLOYEE_UUID]',
--   'employee@example.com',
--   'employee',
--   'employee',  -- This user has limited access
--   true,
--   CURRENT_TIMESTAMP,
--   CURRENT_TIMESTAMP
-- );

-- ===================================================================
-- COMPLETE SETUP SUMMARY
-- ===================================================================
--
-- 1. ✅ Create .env.local with new Supabase credentials
-- 2. ✅ Deploy DATABASE_SCHEMA_FIXED.sql to Supabase
-- 3. ✅ Create auth user via Supabase Dashboard (admin@admin.com / admin123)
-- 4. ✅ Copy UUID from step 3
-- 5. ✅ Run the INSERT INTO users statement (replace [PASTE_UUID_HERE])
-- 6. ✅ Verify with SELECT statement
-- 7. ✅ Start app: npm run dev
-- 8. ✅ Login: admin@admin.com / admin123
--
-- Your admin account is ready! 🎉

-- ===================================================================
-- TROUBLESHOOTING
-- ===================================================================
--
-- Problem: "insert or update on table 'users' violates foreign key constraint"
-- Solution: Make sure the UUID exists in auth.users first (Supabase Dashboard)
--
-- Problem: "duplicate key value violates unique constraint 'users_email_key'"
-- Solution: The user already exists. Delete first, then recreate.
--
-- Problem: Can't login with admin@admin.com
-- Solution: 
--   1. Check if user exists in auth.users (Dashboard)
--   2. Check if user profile exists in users table (run Step 4)
--   3. Verify password is correct (admin123)
--
-- Problem: Login works but user doesn't have admin role
-- Solution: Run the UPDATE statement from Step 5
--
-- ===================================================================
