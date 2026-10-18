export type ImagePreset = 'product' | 'offer' | 'hero' | 'logo' | 'carrier' | 'favicon' | 'default';

/** Max edge in px / target weight in MB for each kind of image. */
export const IMAGE_PRESETS: Record<ImagePreset, { maxWidthOrHeight: number; maxSizeMB: number }> = {
  product: { maxWidthOrHeight: 1080, maxSizeMB: 150 / 1024 },
  offer: { maxWidthOrHeight: 1200, maxSizeMB: 200 / 1024 },
  hero: { maxWidthOrHeight: 1920, maxSizeMB: 350 / 1024 },
  logo: { maxWidthOrHeight: 512, maxSizeMB: 120 / 1024 },
  carrier: { maxWidthOrHeight: 320, maxSizeMB: 60 / 1024 },
  favicon: { maxWidthOrHeight: 256, maxSizeMB: 40 / 1024 },
  default: { maxWidthOrHeight: 1280, maxSizeMB: 400 / 1024 },
};

const SKIP_BELOW_BYTES = 60 * 1024;
const PASSTHROUGH_TYPES = ['image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];

let webpSupport: boolean | null = null;
const canEncodeWebP = (): boolean => {
  if (webpSupport !== null) return webpSupport;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    webpSupport = c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
};

export interface CompressOptions {
  preset?: ImagePreset;
  /** 0–100 */
  onProgress?: (percent: number) => void;
}

/**
 * Compress an image in a Web Worker before upload.
 * Returns the original file when compression is not worth it or fails.
 */
export async function compressImageFile(file: File, { preset = 'default', onProgress }: CompressOptions = {}): Promise<File> {
  const lowerName = file.name.toLowerCase();
  if (PASSTHROUGH_TYPES.includes(file.type) || lowerName.endsWith('.svg') || lowerName.endsWith('.ico')) {
    onProgress?.(100);
    return file;
  }
  if (file.size < SKIP_BELOW_BYTES) {
    onProgress?.(100);
    return file;
  }

  const useWebP = canEncodeWebP();
  const fileType = useWebP ? 'image/webp' : 'image/jpeg';
  const ext = useWebP ? 'webp' : 'jpg';
  const { maxSizeMB, maxWidthOrHeight } = IMAGE_PRESETS[preset];

  try {
    const { default: imageCompression } = await import('browser-image-compression');
    const blob = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      initialQuality: 0.75,
      useWebWorker: true,
      alwaysKeepResolution: false,
      fileType,
      onProgress,
    });
    if (blob.size >= file.size) return file;
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.${ext}`, { type: fileType, lastModified: Date.now() });
  } catch (err) {
    console.warn('Image compression failed, uploading original:', err);
    onProgress?.(100);
    return file;
  }
}

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
