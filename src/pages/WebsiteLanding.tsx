import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getWebsiteSettingsREST, getAllProductsREST, getApprovedTestimonials, createTestimonial } from '@/lib/supabaseClient';
import { ChevronRight, Zap, Flame, ShoppingCart, Eye, X, Upload, Loader, AlertCircle } from 'lucide-react';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { uploadLandingImage, deleteLandingImage } from '@/lib/uploadLandingImage';

interface Testimonial {
  id: string;
  client_name: string;
  opinion: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  primary_image?: string;
  product_mark?: string;
  description?: string;
  voltage?: string | number;
  amperage?: string | number;
  wattage?: string | number;
  connection_type?: string;
  model_number?: string;
  selling_price: number;
  is_active: boolean;
}

interface WebsiteSettings {
  store_name?: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
}

export default function WebsiteLanding() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use custom hook to fetch settings with image
  const { settings: websiteSettings, imageUrl, loading: settingsLoading, error: settingsError, refetch: refetchSettings } = useWebsiteSettings();
  
  // Legacy state for other data
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartNotification, setCartNotification] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialName, setTestimonialName] = useState('');
  const [testimonialOpinion, setTestimonialOpinion] = useState('');
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  
  // Image upload state
  const [showUploadUI, setShowUploadUI] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use REST API instead of Supabase client to bypass auth issues
        const [settingsData, productsData, testimonialsData] = await Promise.all([
          getWebsiteSettingsREST(),
          getAllProductsREST(),
          getApprovedTestimonials(),
        ]);

        setSettings(settingsData || {
          store_name: 'Chargeur Store',
          slogan: 'Quality Chargers at Best Prices'
        });
        
        // Get all active products (visible on website)
        const visibleProducts = (productsData || []).filter((p: any) => p.is_active);
        setAllProducts(visibleProducts);
        
        // Debug: log all products
        console.log('📦 All visible products:', visibleProducts);
        console.log('📦 Total products count:', visibleProducts.length);
        
        // Extract unique brands from ALL products
        const brands = Array.from(new Set(
          visibleProducts
            .map((p: any) => p.product_mark)
            .filter((mark: any) => mark && mark.trim() !== '')
        )).sort() as string[];
        
        console.log('🏷️ Brands found:', brands);
        console.log('🏷️ Total brands:', brands.length);
        
        setAvailableBrands(brands);
        
        // Show first 3 products for initial load
        setProducts(visibleProducts.slice(0, 3));
        
        // Set testimonials from database
        setTestimonials(testimonialsData || []);
      } catch (error) {
        console.error('Error fetching website data:', error);
        // Show default values even if data fetch fails
        setSettings({
          store_name: 'Chargeur Store',
          slogan: 'Quality Chargers at Best Prices'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        await refetchSettings();
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
        await refetchSettings();
      } else {
        setUploadError(result.error || 'Deletion failed');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(false);
    }
  };

  // Handle Brand Filter - Show ALL products for selected brand
  const handleBrandClick = (brand: string | null) => {
    setSelectedBrand(brand);
    
    if (brand === null) {
      // Show all products (up to first 3 for initial load)
      setProducts(allProducts.slice(0, 3));
    } else {
      // Show ALL products for the selected brand (NO LIMITS)
      const filtered = allProducts.filter(p => {
        const mark = p.product_mark || p.product_mark;
        return mark === brand;
      });
      
      // Debug: log what we found
      console.log(`🏷️ Brand "${brand}" found ${filtered.length} products:`, filtered);
      
      // Set ALL filtered products - NO slice limit
      setProducts(filtered.length > 0 ? filtered : []);
    }
  };

  // Handle Submit Testimonial
  const handleSubmitTestimonial = async () => {
    if (!testimonialName.trim() || !testimonialOpinion.trim()) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs');
      return;
    }

    setSubmittingTestimonial(true);
    try {
      const newTestimonial = await createTestimonial(
        testimonialName,
        testimonialOpinion,
        testimonialRating
      );
      
      if (newTestimonial) {
        // Add the new testimonial to the list
        setTestimonials([newTestimonial, ...testimonials]);
        
        // Reset form
        setTestimonialName('');
        setTestimonialOpinion('');
        setTestimonialRating(5);
        setShowTestimonialModal(false);
        
        // Show success message
        alert(language === 'ar' 
          ? 'شكراً! سيتم مراجعة رأيك وعرضه قريباً' 
          : 'Merci! Votre avis sera publié après modération');
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      alert(language === 'ar' ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'Une erreur est survenue, veuillez réessayer');
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  // Handle Add to Cart
  const handleAddToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart - if so, increase quantity instead of adding duplicate
    const existingItem = cart.find((item: any) => item.product_id === product.id);
    
    if (existingItem) {
      // Increase quantity instead of adding duplicate
      existingItem.quantity += 1;
    } else {
      // Add new item only if not in cart
      cart.push({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: product.selling_price,
        quantity: 1,
        image: product.primary_image,
        from_offer: false
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Trigger cart update event for navbar
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Show success notification
    setCartNotification(product.name);
    setTimeout(() => setCartNotification(null), 3000);
  };

  // Handle View Details
  const handleViewDetails = (product: Product) => {
    // Navigate to boutique page with the selected product
    navigate('/website-shop/offers');
  };

  // Handle Order
  const handleOrder = (product: Product) => {
    // Add to cart if not already there
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.product_id === product.id);
    if (!existingItem) {
      handleAddToCart(product);
    }
    // Navigate to cart
    navigate(`/website-shop/order`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="space-y-12">
      {/* Cart Notification Toast */}
      {cartNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg font-semibold"
        >
          ✅ {cartNotification} {language === 'ar' ? 'تمت إضافتها للسلة' : 'ajouté au panier'}
        </motion.div>
      )}

      {/* Hero Section - WITH BACKGROUND IMAGE SUPPORT */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full min-h-screen md:min-h-96 flex items-center justify-center overflow-hidden rounded-3xl shadow-2xl"
        style={imageUrl ? {
          backgroundImage: `url('${imageUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 z-10" />

        {/* Upload UI Modal */}
        {showUploadUI && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-0 left-0 right-0 bottom-0 bg-black/80 z-50 flex items-center justify-center p-4 rounded-3xl"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{language === 'ar' ? 'رفع صورة البطل' : 'Télécharger l\'image'}</h2>
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
                <p className="text-gray-700 font-medium mb-1">{language === 'ar' ? 'انقر للتحميل' : 'Cliquez pour télécharger'}</p>
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
                  <p className="text-sm font-medium text-gray-700 mb-3">{language === 'ar' ? 'الصورة الحالية' : 'Image actuelle'}</p>
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
                        {language === 'ar' ? 'جاري الحذف...' : 'Suppression...'}
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        {language === 'ar' ? 'حذف الصورة' : 'Supprimer l\'image'}
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
                    {language === 'ar' ? 'جاري التحميل...' : 'Téléchargement...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {language === 'ar' ? 'اختر صورة' : 'Choisir une image'}
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Hero Content */}
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center mb-8 sm:mb-12 max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
              ⚡ {settings?.store_name || websiteSettings?.store_name || 'Charger Shop'}
            </h1>
            <div className="h-1 w-20 sm:w-24 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-6 sm:mb-8 rounded-full" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-blue-200 font-light mb-4 text-center max-w-2xl"
          >
            {settings?.slogan || websiteSettings?.slogan || 'Best Chargers for Your Devices'}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base sm:text-lg text-gray-300 mb-10 sm:mb-12 text-center max-w-2xl leading-relaxed"
          >
            {settings?.description || websiteSettings?.description || 'Premium quality chargers at unbeatable prices'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center mb-12 sm:mb-16"
          >
            <Button
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg px-8 py-6"
              size="lg"
              onClick={() => (window.location.href = '/website-shop/offers')}
            >
              {language === 'ar' ? 'تصفح العروض' : 'Voir les Offres'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              className="bg-blue-100 text-blue-600 hover:bg-blue-200 font-bold text-lg px-8 py-6"
              size="lg"
              onClick={() => (window.location.href = '/website-shop/special-offers')}
            >
              {language === 'ar' ? 'عروض خاصة' : 'Offres Spéciales'}
              <Flame className="ml-2 h-5 w-5" />
            </Button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 15px 35px rgba(168, 85, 247, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg transition-all"
              onClick={() => (window.location.href = '/website-shop/packages')}
            >
              <span className="flex items-center gap-2">
                {language === 'ar' ? '📦 حزم مميزة' : '📦 Packs Spéciaux'}
                <Flame className="h-5 w-5" />
              </span>
            </motion.button>
          </motion.div>

          {/* Admin Upload Button - Hidden in production */}
          {process.env.NODE_ENV === 'development' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => setShowUploadUI(!showUploadUI)}
              className="px-6 py-2 bg-gray-800/50 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700/70 hover:text-white transition-all text-sm font-medium"
            >
              {showUploadUI ? (language === 'ar' ? 'إلغاء' : 'Annuler') : (language === 'ar' ? '📸 رفع صورة' : '📸 Uploader')}
            </motion.button>
          )}
        </div>

        {/* Floating Elements - Decorative */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl z-0"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl z-0"
        />
      </motion.section>

      {/* Featured Products */}
      {!loading && products.length > 0 && (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              🛍️ {language === 'ar' ? 'الشواحن المتاحة' : 'Nos Chargeurs'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {language === 'ar' ? 'استكشف مجموعتنا الكاملة من الشواحن' : 'Découvrez notre collection complète de chargeurs'}
            </p>
          </div>

          {/* Brand Filter - Modern Circular Design */}
          {availableBrands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Header with Counter */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {language === 'ar' ? '🏷️ تصفية حسب الماركة' : '🏷️ Filtrer par Marque'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {language === 'ar' ? 'اختر من جميع العلامات التجارية المتاحة' : 'Sélectionnez parmi toutes les marques disponibles'}
                  </p>
                </div>
                {selectedBrand && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                  >
                    ✅ {language === 'ar' ? `${products.length} شاحن` : `${products.length} produits`}
                  </motion.div>
                )}
              </div>
              
              {/* Brand Squares Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 py-6 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900/50 dark:via-blue-950/30 dark:to-purple-950/30 rounded-3xl border-2 border-blue-200 dark:border-blue-700/50 backdrop-blur-sm w-full">
                {/* All Brands Square */}
                <motion.button
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBrandClick(null)}
                  className={`flex flex-col items-center justify-center w-full h-16 sm:h-20 rounded-lg transition-all duration-300 overflow-hidden relative group ${
                    selectedBrand === null
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl ring-2 ring-blue-400'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-lg border-2 border-slate-200 dark:border-slate-600 hover:shadow-xl hover:border-blue-400'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl">⭐</span>
                  <span className="text-xs font-bold text-center px-1 hidden sm:block">
                    {language === 'ar' ? 'الكل' : 'All'}
                  </span>
                </motion.button>

                {/* Individual Brand Squares */}
                {availableBrands.map((brand, index) => {
                  // Try to find brand logo from products data
                  const brandProduct = allProducts.find(p => p.product_mark === brand);
                  const logoUrl = brandProduct && (brandProduct as any).brand_logo ? (brandProduct as any).brand_logo : null;

                  return (
                    <motion.button
                      key={brand}
                      whileHover={{ scale: 1.08, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03, type: 'spring', damping: 12 }}
                      onClick={() => handleBrandClick(brand)}
                      className={`flex items-center justify-center w-full h-16 sm:h-20 rounded-lg transition-all duration-300 relative group overflow-hidden ${
                        selectedBrand === brand
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl ring-2 ring-blue-400'
                          : 'bg-white dark:bg-slate-800 shadow-lg border-2 border-slate-200 dark:border-slate-600 hover:shadow-xl hover:border-blue-400'
                      }`}
                      title={brand}
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={brand}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl">🏷️</span>
                      )}
                      
                      {/* Hover Overlay with Brand Name */}
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                        <span className="text-white text-xs font-bold text-center px-2 line-clamp-2">
                          {brand}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Products Grid - WITH COMPLETE REDESIGN */}
          <motion.div
            key={`products-grid-${selectedBrand || 'all'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products && products.length > 0 ? (
                products.map((product, idx) => (
                  <motion.div
                    key={`${product.id}-${idx}`}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                    onClick={() => handleViewDetails(product)}
                    className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-blue-100 dark:border-blue-700 flex flex-col h-full cursor-pointer"
                  >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 mx-4 rounded-xl mb-3 flex items-center justify-center overflow-hidden mt-4">
                  {product.primary_image ? (
                    <motion.img
                      src={product.primary_image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.12 }}
                    />
                  ) : (
                    <Zap className="h-16 w-16 text-slate-300" />
                  )}
                </div>

                {/* Brand */}
                <Badge variant="outline" className="mx-4 w-fit text-xs font-bold border-blue-300 bg-blue-50 dark:bg-blue-900/30">
                  🏷️ {product.product_mark || 'Charger'}
                </Badge>

                {/* Product Name */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 mx-4 line-clamp-2">
                  {product.name}
                </h3>

                {/* Description */}
                {product.description && (
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mx-4 mb-2 break-words whitespace-pre-wrap">
                    📝 {product.description}
                  </p>
                )}

                {/* Specs Section Header */}
                <div className="mx-4 mb-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">⚡ {language === 'ar' ? 'المواصفات' : 'Spécifications'}</p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-1.5 mx-4 mb-3">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-1.5 text-center border border-blue-200 dark:border-blue-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚡ {language === 'ar' ? 'الفولت' : 'Voltage'}</div>
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{product.voltage ? `${product.voltage}V` : 'N/A'}</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-1.5 text-center border border-purple-200 dark:border-purple-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔌 {language === 'ar' ? 'القوة' : 'Wattage'}</div>
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{product.wattage ? `${product.wattage}W` : 'N/A'}</div>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-1.5 text-center border border-pink-200 dark:border-pink-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚙️ {language === 'ar' ? 'التيار' : 'Ampérage'}</div>
                    <div className="text-xs font-bold text-pink-600 dark:text-pink-400">{product.amperage ? `${product.amperage}A` : 'N/A'}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-1.5 text-center border border-green-200 dark:border-green-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔧 {language === 'ar' ? 'الوصلة' : 'Connexion'}</div>
                    <div className="text-xs font-bold text-green-600 dark:text-green-400 truncate">{product.connection_type || 'N/A'}</div>
                  </div>
                </div>

                {/* Price */}
                <div className="mx-4 mb-3">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {product.selling_price.toFixed(2)} DZD
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 px-4 pb-4 mt-auto">
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg py-2 text-xs"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'سلة' : 'Panier'}
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleViewDetails(product)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg py-2 text-xs"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'عرض' : 'Voir'}
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleOrder(product)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg py-2 text-xs"
                    >
                      {language === 'ar' ? '📦 طلب' : '📦 Commande'}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
                ))
              ) : (
                // No Results Message - FULL WIDTH, CENTERED
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="col-span-1 md:col-span-2 lg:col-span-3 py-24 text-center space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-600"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-7xl"
                  >
                    🔍
                  </motion.div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {language === 'ar' ? 'لا توجد منتجات' : 'Aucun Produit'}
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                    {language === 'ar' 
                      ? `للأسف، لم نجد أي منتجات لماركة "${selectedBrand}". حاول اختيار ماركة أخرى أو عرض جميع المنتجات المتاحة.`
                      : `Désolé, aucun produit trouvé pour la marque "${selectedBrand}". Essayez de sélectionner une autre marque ou consultez tous les produits disponibles.`}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleBrandClick(null)}
                    className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
                  >
                    {language === 'ar' ? '⭐ عرض جميع المنتجات' : '⭐ Voir Tous les Produits'}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>

          <div className="text-center">
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-lg px-8 py-6"
              size="lg"
              onClick={() => (window.location.href = '/website-shop/offers')}
            >
              {language === 'ar' ? 'عرض جميع الشواحن' : 'Voir Tous Les Chargeurs'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.section>
      )}

      {/* ========== TESTIMONIALS SECTION - PREMIUM DESIGN ========== */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-16 mt-20 relative overflow-hidden"
      >
        {/* Background Gradient Blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-blue-400/20 rounded-full blur-3xl opacity-50" />

        {/* Main Container */}
        <div className="relative z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black rounded-3xl p-12 md:p-16 border border-slate-700/50 backdrop-blur-sm shadow-2xl">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            <motion.div
              animate={{ rotateY: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <span className="text-6xl filter drop-shadow-lg">⭐</span>
            </motion.div>
            
            <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              {language === 'ar' ? 'ما يقول عملاؤنا' : language === 'fr' ? 'Ce que disent nos clients' : 'What Our Customers Say'}
            </h2>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              {language === 'ar' 
                ? 'اكتشف تجارب العملاء الفعلية مع منتجاتنا وخدماتنا'
                : 'Découvrez les expériences réelles de nos clients avec nos produits et services'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTestimonialModal(true)}
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg overflow-hidden"
            >
              <span>+</span>
              {language === 'ar' ? 'شارك رأيك' : language === 'fr' ? 'Partagez votre avis' : 'Share Your Review'}
            </motion.button>
          </div>

          {/* Testimonials Grid - Dynamic from Database */}
          {testimonials && testimonials.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {testimonials.map((testimonial, index) => (
                    <motion.div
                      key={testimonial.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ delay: index * 0.1, type: 'spring', stiffness: 80, damping: 15 }}
                      whileHover={{ y: -15, transition: { duration: 0.3 } }}
                      className="group relative"
                    >
                      {/* Card */}
                      <div className="h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-xl overflow-hidden relative">
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300" />

                        <div className="relative z-10">
                          {/* Stars */}
                          <div className="flex items-center gap-1 mb-6">
                            {[...Array(testimonial.rating || 5)].map((_, i) => (
                              <motion.span
                                key={i}
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 150 }}
                                className="text-2xl text-yellow-400"
                              >
                                ★
                              </motion.span>
                            ))}
                          </div>

                          {/* Quote Icon */}
                          <div className="text-4xl text-purple-400/30 mb-4 font-serif">"</div>

                          {/* Opinion Text */}
                          <p className="text-slate-300 text-lg mb-6 leading-relaxed line-clamp-5 group-hover:line-clamp-none transition-all duration-300 min-h-[6rem]">
                            {testimonial.opinion}
                          </p>

                          {/* Divider */}
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-6" />

                          {/* Author Info */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white text-base group-hover:text-purple-400 transition-colors">
                                {testimonial.client_name}
                              </p>
                              <p className="text-slate-500 text-xs mt-1">
                                {new Date(testimonial.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            {/* Emoji Animation */}
                            <motion.div
                              animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.1 }}
                              className="text-3xl"
                            >
                              😊
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* View All CTA */}
              {testimonials.length > 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="text-center mt-16"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-bold text-lg rounded-xl shadow-2xl overflow-hidden"
                  >
                    <span className="relative z-10">{language === 'ar' ? `شاهد جميع الآراء (${testimonials.length})` : `Voir tous les avis (${testimonials.length})`}</span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </motion.div>
              )}
            </>
          ) : (
            // No Testimonials Message
            <div className="text-center py-20">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                💭
              </motion.div>
              <p className="text-xl text-slate-400 mb-6">
                {language === 'ar' 
                  ? 'لا توجد آراء حتى الآن. كن الأول في مشاركة رأيك!'
                  : 'Aucun avis pour l\'instant. Soyez le premier à partager votre expérience!'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTestimonialModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg"
              >
                <span>✨</span>
                {language === 'ar' ? 'أضف رأيك الآن' : 'Ajouter votre avis'}
              </motion.button>
            </div>
          )}

      {/* Testimonial Form Modal */}
      <AnimatePresence mode="wait">
        {showTestimonialModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTestimonialModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-lg bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
                {/* Close Button */}
                <button
                  onClick={() => setShowTestimonialModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>

                {/* Modal Header */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {language === 'ar' ? 'شارك رأيك معنا' : 'Partagez votre avis'}
                </h3>
                <p className="text-slate-400 mb-6">
                  {language === 'ar' 
                    ? 'أخبرنا عن تجربتك مع منتجاتنا'
                    : 'Aidez-nous à améliorer nos services'}
                </p>

                {/* Form */}
                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      {language === 'ar' ? 'اسمك' : 'Votre nom'}
                    </label>
                    <input
                      type="text"
                      value={testimonialName}
                      onChange={(e) => setTestimonialName(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل اسمك' : 'Entrez votre nom'}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  {/* Rating Field */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      {language === 'ar' ? 'التقييم' : 'Note'}
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <motion.button
                          key={rating}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setTestimonialRating(rating)}
                          className={`text-3xl transition-all ${
                            rating <= testimonialRating
                              ? 'text-yellow-400 scale-110'
                              : 'text-slate-500 hover:text-yellow-400'
                          }`}
                        >
                          ★
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Opinion Field */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      {language === 'ar' ? 'رأيك' : 'Votre avis'}
                    </label>
                    <textarea
                      value={testimonialOpinion}
                      onChange={(e) => setTestimonialOpinion(e.target.value)}
                      placeholder={language === 'ar' ? 'شارك تجربتك معنا...' : 'Partagez votre expérience...'}
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowTestimonialModal(false)}
                      className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Annuler'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmitTestimonial}
                      disabled={submittingTestimonial}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all"
                    >
                      {submittingTestimonial 
                        ? (language === 'ar' ? 'جاري الإرسال...' : 'Envoi...')
                        : (language === 'ar' ? 'إرسال' : 'Envoyer')}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-900 dark:to-blue-900 text-white py-16 px-4 rounded-3xl text-center space-y-6"
      >
        <h2 className="text-4xl font-black">
          {language === 'ar' ? 'جاهز للطلب؟' : 'Prêt à Passer Commande?'}
        </h2>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
          {language === 'ar'
            ? 'استمتع بتوصيل سريع وآمن إلى جميع أنحاء الجزائر'
            : 'Profitez de la livraison rapide et sécurisée dans toute l\'Algérie'}
        </p>
        <Button
          className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg px-8 py-6"
          size="lg"
          onClick={() => (window.location.href = '/website-shop/offers')}
        >
          {language === 'ar' ? 'تصفح المتجر الآن' : 'Parcourir la Boutique'}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.section>
    </div>
  );
}
