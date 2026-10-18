import { supabase } from '@/lib/supabaseClient';
import { compressImageFile, formatBytes, type ImagePreset } from '@/utils/media';
import { toast } from 'sonner';

export interface UploadImageOptions {
  bucket?: string;
  folder?: string;
  preset?: ImagePreset;
  /** 0–100 across compression (0–60) and upload (60–100) */
  onProgress?: (percent: number) => void;
  /** Show the "4.8 MB → 140 KB (−97%)" toast. Default true. */
  notify?: boolean;
}

export interface UploadImageResult {
  publicUrl: string;
  path: string;
  originalSize: number;
  finalSize: number;
}

// Global progress store so a single bar (UploadProgressBar) can show any upload.
type Listener = (p: number | null) => void;
const listeners = new Set<Listener>();
let current: number | null = null;
const setGlobalProgress = (p: number | null) => { current = p; listeners.forEach((l) => l(p)); };
export const subscribeUploadProgress = (l: Listener) => { listeners.add(l); l(current); return () => { listeners.delete(l); }; };

const randomName = (ext: string) =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

export const compressionSummary = (before: number, after: number) => {
  const pct = before > 0 ? Math.round((1 - after / before) * 100) : 0;
  return `${formatBytes(before)} → ${formatBytes(after)} (${pct > 0 ? '−' : ''}${Math.abs(pct)}%)`;
};

/** Compress then upload an image to Supabase Storage. Throws on failure. */
export async function uploadImage(file: File, options: UploadImageOptions = {}): Promise<UploadImageResult> {
  const { bucket = 'chargers', folder = 'misc', preset = 'default', notify = true } = options;
  const isBatch = (options as { _batch?: boolean })._batch;
  const onProgress = (p: number) => { options.onProgress?.(p); if (!isBatch) setGlobalProgress(p); };
  try {
    return await doUpload(file, bucket, folder, preset, notify, onProgress);
  } finally {
    if (!isBatch) setTimeout(() => setGlobalProgress(null), 400);
  }
}

async function doUpload(file: File, bucket: string, folder: string, preset: ImagePreset, notify: boolean, onProgress: (p: number) => void): Promise<UploadImageResult> {
  if (!file.type.startsWith('image/') && !/\.(ico|svg)$/i.test(file.name)) {
    throw new Error('Invalid file type. Please choose an image.');
  }

  onProgress(0);
  const compressed = await compressImageFile(file, {
    preset,
    onProgress: (p) => onProgress(Math.round(p * 0.6)),
  });

  const ext = (compressed.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder.replace(/^\/+|\/+$/g, '')}/${randomName(ext)}`;
  onProgress(65);

  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    cacheControl: '31536000',
    upsert: false,
    contentType: compressed.type || undefined,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Upload failed: no public URL returned');
  onProgress(100);

  if (notify) toast.success(compressionSummary(file.size, compressed.size));
  return { publicUrl: data.publicUrl, path, originalSize: file.size, finalSize: compressed.size };
}

/** Upload several images in order with one shared progress value. */
export async function uploadImages(files: File[], options: UploadImageOptions = {}): Promise<UploadImageResult[]> {
  const { onProgress, notify = true, ...rest } = options;
  const results: UploadImageResult[] = [];
  try {
    for (let i = 0; i < files.length; i++) {
      const r = await uploadImage(files[i], {
        ...rest,
        notify: false,
        _batch: true,
        onProgress: (p) => {
          const total = Math.round(((i + p / 100) / files.length) * 100);
          onProgress?.(total);
          setGlobalProgress(total);
        },
      } as UploadImageOptions);
      results.push(r);
    }
  } finally {
    setTimeout(() => setGlobalProgress(null), 400);
  }
  if (notify && results.length) {
    const before = results.reduce((s, r) => s + r.originalSize, 0);
    const after = results.reduce((s, r) => s + r.finalSize, 0);
    toast.success(`${results.length} image${results.length > 1 ? 's' : ''}: ${compressionSummary(before, after)}`);
  }
  return results;
}
