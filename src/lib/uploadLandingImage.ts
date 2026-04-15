import { supabase } from '@/lib/supabaseClient';

interface UploadResponse {
  success: boolean;
  publicUrl: string | null;
  error: string | null;
}

/**
 * Upload landing page image to Supabase Storage
 * 
 * Steps:
 * 1. Upload file to 'chargers' bucket with timestamp prefix
 * 2. Get public URL using getPublicUrl()
 * 3. Save URL to database using upsert
 * 4. Return success status and URL
 */
export const uploadLandingImage = async (file: File): Promise<UploadResponse> => {
  try {
    if (!file) {
      return { success: false, publicUrl: null, error: 'No file provided' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, publicUrl: null, error: 'Invalid file type. Please upload an image.' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, publicUrl: null, error: 'File size exceeds 5MB limit' };
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `landing_bg_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    console.log('📤 Uploading image to Supabase Storage:', fileName);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chargers')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    if (!uploadData) {
      throw new Error('Upload returned no data');
    }

    console.log('✅ File uploaded successfully:', uploadData.path);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('chargers')
      .getPublicUrl(uploadData.path);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('🔗 Public URL generated:', publicUrl);

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
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

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
