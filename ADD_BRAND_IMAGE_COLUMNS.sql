-- ============================================
-- SQL: Add Brand Image Upload Support
-- ============================================
-- This script adds image upload capability to the marks (brands) table
-- and creates necessary storage structure in Supabase

-- Step 1: Add new columns to marks table for image storage
-- =========================================================

ALTER TABLE public.marks
ADD COLUMN logo_file_path text,
ADD COLUMN logo_uploaded_by uuid,
ADD COLUMN logo_uploaded_at timestamp with time zone DEFAULT now(),
ADD COLUMN is_logo_uploaded boolean DEFAULT false;

-- Add foreign key for uploaded_by (reference to users table)
ALTER TABLE public.marks
ADD CONSTRAINT marks_logo_uploaded_by_fkey 
FOREIGN KEY (logo_uploaded_by) REFERENCES public.users(id) 
ON DELETE SET NULL;

-- Step 2: Create index for faster queries
-- =========================================

CREATE INDEX idx_marks_is_logo_uploaded ON public.marks(is_logo_uploaded);
CREATE INDEX idx_marks_logo_uploaded_at ON public.marks(logo_uploaded_at DESC);

-- Step 3: Update existing marks to have is_logo_uploaded = true if logo_url exists
-- ===================================================================================

UPDATE public.marks 
SET is_logo_uploaded = true 
WHERE logo_url IS NOT NULL AND logo_url != '';

-- Step 4: Add comment for documentation
-- ======================================

COMMENT ON COLUMN public.marks.logo_file_path IS 'Storage path of the brand logo in Supabase storage bucket (format: /marks/{mark_id}/{filename})';
COMMENT ON COLUMN public.marks.logo_uploaded_by IS 'User ID of the person who uploaded the logo';
COMMENT ON COLUMN public.marks.logo_uploaded_at IS 'Timestamp when the logo was last uploaded';
COMMENT ON COLUMN public.marks.is_logo_uploaded IS 'Flag indicating if logo has been uploaded (true = has logo, false = no logo)';

-- Step 5: Verify the changes
-- ===========================

-- Run this query to verify the changes:
-- SELECT id, name, logo_url, logo_file_path, is_logo_uploaded, logo_uploaded_at FROM public.marks LIMIT 10;
