import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface WebsiteSettings {
  id: string;
  store_name: string;
  slogan: string;
  description: string;
  logo_url: string | null;
  landing_page_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UseWebsiteSettingsReturn {
  settings: WebsiteSettings | null;
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch website settings and landing page image
 * 
 * Key features:
 * - Fetches landing_page_image_url from database
 * - Handles loading and error states
 * - Provides refetch function to reload data after upload
 * - Uses .select() and .single() for precise queries
 */
export const useWebsiteSettings = (): UseWebsiteSettingsReturn => {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('website_settings')
        .select('id, store_name, slogan, description, logo_url, landing_page_image_url, created_at, updated_at')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (!data) {
        throw new Error('No website settings found');
      }

      setSettings(data as WebsiteSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch website settings';
      setError(errorMessage);
      console.error('Error fetching website settings:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    imageUrl: settings?.landing_page_image_url || null,
    loading,
    error,
    refetch: fetchSettings,
  };
};
