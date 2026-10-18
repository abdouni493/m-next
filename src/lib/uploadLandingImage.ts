import { supabase } from '@/lib/supabaseClient';
import { uploadImage } from '@/lib/imageUpload';

interface UploadResponse {
  success: boolean;
  publicUrl: string | null;
  error: string | null;
}

/**
 * Upload landing page image to Supabase Storage
 * 
 * Steps:
 * 1. Compress and upload file to 'chargers' bucket (landing/ folder)
 * 2. Get public URL using getPublicUrl()
 * 3. Save URL to database using upsert
 * 4. Return success status and URL
 */
export const uploadLandingImage = async (file: File): Promise<UploadResponse> => {
  try {
    if (!file) {
      return { success: false, publicUrl: null, error: 'No file provided' };
    }

    const { publicUrl } = await uploadImage(file, { bucket: 'chargers', folder: 'landing', preset: 'hero' });

    // Save URL to database
    const { error: dbError } = await supabase
      .from('website_settings')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        landing_page_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      throw new Error(`Failed to save URL to database: ${dbError.message}`);
    }

    console.log('💾 Image URL saved to database');

    return { success: true, publicUrl, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during upload';
    console.error('❌ Image upload error:', errorMessage);
    return { success: false, publicUrl: null, error: errorMessage };
  }
};

/**
 * Delete landing page image from Supabase Storage
 */
export const deleteLandingImage = async (imageUrl: string): Promise<UploadResponse> => {
  try {
    if (!imageUrl) {
      return { success: false, publicUrl: null, error: 'No image URL provided' };
    }

    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/chargers/landing_bg_...
    const marker = '/object/public/chargers/';
    const fileName = imageUrl.includes(marker)
      ? decodeURIComponent(imageUrl.split(marker)[1].split('?')[0])
      : imageUrl.split('/').pop();

    if (!fileName) {
      return { success: false, publicUrl: null, error: 'Invalid image URL format' };
    }

    console.log('🗑️ Deleting image from storage:', fileName);

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('chargers')
      .remove([fileName]);

    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`);
    }

    // Clear URL from database
    const { error: dbError } = await supabase
      .from('website_settings')
      .update({ landing_page_image_url: null, updated_at: new Date().toISOString() })
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (dbError) {
      throw new Error(`Failed to clear URL from database: ${dbError.message}`);
    }

    console.log('✅ Image deleted successfully');

    return { success: true, publicUrl: null, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during deletion';
    console.error('❌ Image deletion error:', errorMessage);
    return { success: false, publicUrl: null, error: errorMessage };
  }
};
