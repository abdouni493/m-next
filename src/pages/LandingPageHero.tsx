import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { uploadLandingImage, deleteLandingImage } from '@/lib/uploadLandingImage';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader, AlertCircle } from 'lucide-react';

/**
 * Modern Landing Page Component
 * 
 * Features:
 * - Full-screen hero section with background image
 * - Responsive design with Tailwind CSS
 * - Smooth animations with Framer Motion
 * - Proper state management for image fetching
 * - Admin image upload functionality
 * - Error handling and loading states
 */

export default function LandingPageComponent() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom hook to fetch settings
  const { settings, imageUrl, loading, error, refetch } = useWebsiteSettings();

  // Local state for image operations
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadUI, setShowUploadUI] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, type: 'spring' as const, damping: 12, stiffness: 100 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1, type: 'spring' as const, damping: 12, stiffness: 100 },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, delay: 0.5 },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.95 },
  };

  // Handle image upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const result = await uploadLandingImage(file);

      if (result.success) {
        // Success - refetch to get updated image
        await refetch();
        setShowUploadUI(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async () => {
    if (!imageUrl) return;

    setDeleting(true);
    setUploadError(null);

    try {
      const result = await deleteLandingImage(imageUrl);

      if (result.success) {
        // Success - refetch to clear image
        await refetch();
      } else {
        setUploadError(result.error || 'Deletion failed');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(false);
    }
  };

  // Determine background - No background image on section, we'll display it separately
  const backgroundStyle = {
    backgroundColor: '#1a1a1a',
  };

  const storeName = settings?.store_name || 'M NEXT TECH';
  const slogan = settings?.slogan || 'Your Trusted Partner';
  const description = settings?.description || 'Premium Charging Solutions';

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section - Two Column Layout */}
      <section
        className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
        style={backgroundStyle}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-0" />

        {/* Background Image - Centered Container */}
        {imageUrl && (
          <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
            <div className="w-full h-full max-w-6xl flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Hero background"
                className="w-full h-full object-contain md:object-cover rounded-none md:rounded-2xl shadow-2xl"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                }}
              />
            </div>
          </div>
        )}

        {/* Upload UI - Admin Panel */}
        {showUploadUI && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-0 left-0 right-0 bottom-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Hero Image</h2>
                <button
                  onClick={() => setShowUploadUI(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={uploading || deleting}
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Error Message */}
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                </motion.div>
              )}

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                <p className="text-gray-700 font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading || deleting}
                className="hidden"
              />

              {/* Current Image Preview */}
              {imageUrl && (
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Current Image</p>
                  <img
                    src={imageUrl}
                    alt="Current hero"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <button
                    onClick={handleDeleteImage}
                    disabled={deleting || uploading}
                    className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Delete Current Image
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || deleting}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Choose Image
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Content - Overlay Text */}
        <motion.div
          className="relative z-[5] w-full h-full flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 md:py-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile: Stack content, Desktop: Side by side with image */}
          <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            {/* Text Content */}
            <div className="flex-1 text-center md:text-left">
              {/* Main Heading */}
              <motion.div
                variants={titleVariants}
                className="mb-4 sm:mb-8"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 tracking-tight leading-tight">
                  {storeName}
                </h1>
                <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto md:mx-0 rounded-full" />
              </motion.div>

              {/* Slogan */}
              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg md:text-xl text-blue-200 font-light mb-3 md:mb-4"
              >
                {slogan}
              </motion.p>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="text-sm sm:text-base text-gray-300 mb-6 md:mb-8 leading-relaxed"
              >
                {description}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start"
              >
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => navigate('/website-shop')}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300 text-sm sm:text-base"
                >
                  🛒 Shop Now
                </motion.button>

                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => navigate('/website-shop/offers')}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300 text-sm sm:text-base"
                >
                  ✨ View Offers
                </motion.button>
              </motion.div>

              {/* Admin Upload Button - Hidden in production, shown for testing */}
              {process.env.NODE_ENV === 'development' && (
                <motion.button
                  variants={itemVariants}
                  onClick={() => setShowUploadUI(!showUploadUI)}
                  className="mt-6 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700/70 hover:text-white transition-all text-xs sm:text-sm font-medium"
                >
                  {showUploadUI ? 'Cancel' : 'Upload Hero Image'}
                </motion.button>
              )}
            </div>

            {/* Hidden on mobile, visible on desktop - separates image display */}
            {imageUrl && (
              <div className="hidden md:flex flex-1 items-center justify-center">
                {/* Image is rendered above in the background container */}
              </div>
            )}
          </div>
        </motion.div>

        {/* Floating Elements - Decorative - Behind content */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-3xl z-0"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 right-10 w-28 h-28 sm:w-40 sm:h-40 bg-blue-600/10 rounded-full blur-3xl z-0"
        />

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-30"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-white text-sm">Loading...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-8 right-8 bg-red-500/20 border border-red-400 text-red-100 px-6 py-4 rounded-lg max-w-md"
          >
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </section>
    </div>
  );
}
