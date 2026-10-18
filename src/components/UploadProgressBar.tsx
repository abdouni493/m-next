import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ImageUp } from 'lucide-react';
import { subscribeUploadProgress } from '@/lib/imageUpload';

/** Floating progress pill shown while any image is being compressed/uploaded. */
export function UploadProgressBar() {
  const [progress, setProgress] = useState<number | null>(null);
  useEffect(() => subscribeUploadProgress(setProgress), []);

  return (
    <AnimatePresence>
      {progress !== null && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-[100] w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-elegant backdrop-blur-xl"
          role="status"
          aria-live="polite"
        >
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <ImageUp className="h-4 w-4 text-primary" />
            <span>Optimizing &amp; uploading…</span>
            <span className="ml-auto tabular-nums text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-primary"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.25 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
