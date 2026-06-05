const MAX_WIDTH = 1600;
const MAX_THUMB_WIDTH = 800;
const QUALITY = 0.85;

/**
 * Compress an image file using Canvas API before uploading to Supabase.
 * Converts to WebP, resizes to max dimensions, preserves aspect ratio.
 */
export const compressImage = (
  file: File,
  maxWidth = MAX_WIDTH,
  quality = QUALITY,
): Promise<File> => {
  return new Promise((resolve) => {
    const supportsWebP = (() => {
      try {
        const c = document.createElement('canvas');
        return c.toDataURL('image/webp').startsWith('data:image/webp');
      } catch { return false; }
    })();
    const outputType = supportsWebP ? 'image/webp' : 'image/jpeg';
    const ext = supportsWebP ? 'webp' : 'jpg';

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          // Only use compressed version if it's actually smaller
          if (blob.size < file.size) {
            const baseName = file.name.replace(/\.[^.]+$/, '');
            resolve(new File([blob], `${baseName}.${ext}`, { type: outputType }));
          } else {
            resolve(file);
          }
        },
        outputType,
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
};

/** Compress for product cards / thumbnails (smaller output) */
export const compressThumbnail = (file: File): Promise<File> =>
  compressImage(file, MAX_THUMB_WIDTH, 0.80);

/**
 * Append Supabase Storage image-transform params to a storage URL.
 * Only works for files in public Supabase buckets.
 * Pass width=0 to skip resizing (full quality).
 */
export const getTransformUrl = (
  url: string | undefined | null,
  width: number,
  quality = 80,
): string => {
  if (!url) return '';
  // Already has params or is not a Supabase storage URL → return as-is
  if (!url.includes('/storage/v1/object/public/')) return url;
  // Supabase transform endpoint
  const transformUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  );
  const params = new URLSearchParams();
  if (width > 0) params.set('width', String(width));
  params.set('quality', String(quality));
  params.set('resize', 'contain');
  return `${transformUrl}?${params.toString()}`;
};

/** Sizes for different use-cases */
export const imgSrc = {
  /** Product card thumbnail on listing pages */
  card: (url: string | undefined | null) => getTransformUrl(url, 400, 78),
  /** Detail modal / full-size view */
  detail: (url: string | undefined | null) => getTransformUrl(url, 900, 85),
  /** Hero / landing banner (large) */
  hero: (url: string | undefined | null) => getTransformUrl(url, 1400, 80),
  /** Mini thumbnail (cart, testimonial avatar) */
  thumb: (url: string | undefined | null) => getTransformUrl(url, 200, 70),
};
