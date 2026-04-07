import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getWebsiteSettingsREST, getOffersREST, getSpecialOffersREST } from '@/lib/supabaseClient';
import { ChevronRight, Zap, Flame, ShoppingCart, Eye } from 'lucide-react';

interface Offer {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_mark?: string;
  product_description?: string;
  voltage?: string | number;
  amperage?: string | number;
  wattage?: string | number;
  connection_type?: string;
  model_number?: string;
  original_price: number;
  offer_price: number;
  discount_percentage: number;
  is_visible: boolean;
}

interface SpecialOffer {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_mark?: string;
  product_description?: string;
  voltage?: string | number;
  amperage?: string | number;
  wattage?: string | number;
  connection_type?: string;
  model_number?: string;
  original_price: number;
  special_price: number;
  discount_percentage: number;
  is_visible: boolean;
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
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartNotification, setCartNotification] = useState<string | null>(null);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use REST API instead of Supabase client to bypass auth issues
        const [settingsData, offersData, specialOffersData] = await Promise.all([
          getWebsiteSettingsREST(),
          getOffersREST(),
          getSpecialOffersREST(),
        ]);

        setSettings(settingsData || {
          store_name: 'Chargeur Store',
          slogan: 'Quality Chargers at Best Prices'
        });
        
        // Get all visible offers
        const visibleOffers = (offersData || []).filter((o: any) => o.is_visible);
        setAllOffers(visibleOffers);
        
        // Debug: log all offers
        console.log('📦 All visible offers:', visibleOffers);
        console.log('📦 Total offers count:', visibleOffers.length);
        
        // Extract unique brands from ALL offers
        const brands = Array.from(new Set(
          visibleOffers
            .map((o: any) => o.product_mark || o.products?.mark?.name)
            .filter((mark: any) => mark && mark.trim() !== '')
        )).sort() as string[];
        
        console.log('🏷️ Brands found:', brands);
        console.log('🏷️ Total brands:', brands.length);
        
        setAvailableBrands(brands);
        
        // Show first 3 offers for initial load
        setOffers(visibleOffers.slice(0, 3));
        setSpecialOffers((specialOffersData || []).filter((o: any) => o.is_visible).slice(0, 3));
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

  // Handle Brand Filter - Show ALL offers for selected brand (COMPLETE FIX)
  const handleBrandClick = (brand: string | null) => {
    setSelectedBrand(brand);
    
    if (brand === null) {
      // Show all offers (up to first 3 for initial load)
      setOffers(allOffers.slice(0, 3));
    } else {
      // Show ALL offers for the selected brand (NO LIMITS)
      const filtered = allOffers.filter(o => {
        const mark = o.product_mark || o.product_mark;
        return mark === brand;
      });
      
      // Debug: log what we found
      console.log(`🏷️ Brand "${brand}" found ${filtered.length} offers:`, filtered);
      
      // Set ALL filtered offers - NO slice limit
      setOffers(filtered.length > 0 ? filtered : []);
    }
  };

  // Handle Add to Cart
  const handleAddToCart = (offer: Offer | SpecialOffer) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart - if so, increase quantity instead of adding duplicate
    const existingItem = cart.find((item: any) => item.product_id === offer.product_id);
    
    if (existingItem) {
      // Increase quantity instead of adding duplicate
      existingItem.quantity += 1;
    } else {
      // Add new item only if not in cart
      cart.push({
        id: offer.id,
        product_id: offer.product_id,
        name: offer.product_name,
        price: 'offer_price' in offer ? offer.offer_price : offer.special_price,
        quantity: 1,
        image: offer.product_image,
        from_offer: true
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Trigger cart update event for navbar
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Show success notification
    setCartNotification(offer.product_name);
    setTimeout(() => setCartNotification(null), 3000);
  };

  // Handle View Details
  const handleViewDetails = (offer: Offer | SpecialOffer) => {
    // Navigate to offers page with the selected offer
    navigate('/website-shop/offers');
  };

  // Handle Order
  const handleOrder = (offer: Offer | SpecialOffer) => {
    // Add to cart if not already there
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.product_id === offer.product_id);
    if (!existingItem) {
      handleAddToCart(offer);
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

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 text-white py-20 px-4 rounded-3xl shadow-2xl"
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-black leading-tight"
          >
            ⚡ {settings?.store_name || 'Charger Shop'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-blue-50"
          >
            {settings?.slogan || 'Best Chargers for Your Devices'}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-blue-100"
          >
            {settings?.description || 'Premium quality chargers at unbeatable prices'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 justify-center flex-wrap"
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
        </div>
      </motion.section>

      {/* Featured Offers */}
      {!loading && offers.length > 0 && (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              💰 {language === 'ar' ? 'العروض المميزة' : 'Offres Mises en Avant'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {language === 'ar' ? 'اكتشف أفضل الأسعار اليوم' : 'Découvrez nos meilleures offres du jour'}
            </p>
          </div>

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap justify-between items-center px-4 py-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'تصفية حسب الماركة:' : 'Filtrer par Marque:'}
                </h3>
                {selectedBrand && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full"
                  >
                    {language === 'ar' ? `✅ ${offers.length} عروض` : `✅ ${offers.length} offres`}
                  </motion.div>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 py-4 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl border-2 border-blue-200 dark:border-blue-700">
                {/* All Brands Button */}
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBrandClick(null)}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
                    selectedBrand === null
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400'
                  }`}
                >
                  {language === 'ar' ? '⭐ الكل' : '⭐ Tous'}
                </motion.button>

                {/* Individual Brand Buttons */}
                {availableBrands.map((brand, index) => (
                  <motion.button
                    key={brand}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    onClick={() => handleBrandClick(brand)}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
                      selectedBrand === brand
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400'
                    }`}
                  >
                    🏷️ {brand}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Offers Grid - WITH COMPLETE REDESIGN */}
          <motion.div
            key={`offers-grid-${selectedBrand || 'all'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers && offers.length > 0 ? (
                offers.map((offer, idx) => (
                  <motion.div
                    key={`${offer.id}-${idx}`}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                    className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-blue-100 dark:border-blue-700 flex flex-col h-full"
                  >
                {/* Badge */}
                <div className="px-4 pt-4 flex justify-between items-center">
                  {offer.discount_percentage > 0 && (
                    <Badge className="bg-gradient-to-r from-orange-400 to-red-400 text-white">
                      -{offer.discount_percentage}%
                    </Badge>
                  )}
                </div>

                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 mx-4 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {offer.product_image ? (
                    <motion.img
                      src={offer.product_image}
                      alt={offer.product_name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.12 }}
                    />
                  ) : (
                    <Zap className="h-16 w-16 text-slate-300" />
                  )}
                </div>

                {/* Brand */}
                <Badge variant="outline" className="mx-4 w-fit text-xs font-bold border-blue-300 bg-blue-50 dark:bg-blue-900/30">
                  🏷️ {offer.product_mark || 'Charger'}
                </Badge>

                {/* Product Name */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 mx-4 line-clamp-2">
                  {offer.product_name}
                </h3>

                {/* Description */}
                {offer.product_description && (
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mx-4 mb-2">
                    📝 {offer.product_description}
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
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{offer.voltage ? `${offer.voltage}V` : 'N/A'}</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-1.5 text-center border border-purple-200 dark:border-purple-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔌 {language === 'ar' ? 'القوة' : 'Wattage'}</div>
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{offer.wattage ? `${offer.wattage}W` : 'N/A'}</div>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-1.5 text-center border border-pink-200 dark:border-pink-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚙️ {language === 'ar' ? 'التيار' : 'Ampérage'}</div>
                    <div className="text-xs font-bold text-pink-600 dark:text-pink-400">{offer.amperage ? `${offer.amperage}A` : 'N/A'}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-1.5 text-center border border-green-200 dark:border-green-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔧 {language === 'ar' ? 'الوصلة' : 'Connexion'}</div>
                    <div className="text-xs font-bold text-green-600 dark:text-green-400 truncate">{offer.connection_type || 'N/A'}</div>
                  </div>
                </div>

                {/* Price */}
                <div className="mx-4 mb-3">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {offer.original_price.toFixed(2)} DZD
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 px-4 pb-4 mt-auto">
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleAddToCart(offer)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg py-2 text-xs"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'سلة' : 'Panier'}
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleViewDetails(offer)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg py-2 text-xs"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'عرض' : 'Voir'}
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleOrder(offer)}
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
                    {language === 'ar' ? 'لا توجد عروض' : 'Aucune Offre'}
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                    {language === 'ar' 
                      ? `للأسف، لم نجد أي عروض لماركة "${selectedBrand}". حاول اختيار ماركة أخرى أو عرض جميع العروض المتاحة.`
                      : `Désolé, aucune offre trouvée pour la marque "${selectedBrand}". Essayez de sélectionner une autre marque ou consultez toutes les offres disponibles.`}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleBrandClick(null)}
                    className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
                  >
                    {language === 'ar' ? '⭐ عرض جميع العروض' : '⭐ Voir Toutes les Offres'}
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
              {language === 'ar' ? 'عرض جميع العروض' : 'Voir Toutes les Offres'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.section>
      )}

      {/* Featured Special Offers */}
      {!loading && specialOffers.length > 0 && (
        <motion.section
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-600">
              🔥 {language === 'ar' ? 'عروض خاصة حصرية' : 'Offres Spéciales Exclusives'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {language === 'ar' ? 'عروض محدودة الوقت' : 'Offres à Durée Limitée'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialOffers.map((offer) => (
              <motion.div
                key={offer.id}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all border-2 border-red-200 dark:border-red-700 flex flex-col"
              >
                {/* Badge */}
                <div className="px-4 pt-4 flex justify-between items-center">
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
                    👑 -{offer.discount_percentage}%
                  </Badge>
                </div>

                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 mx-4 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {offer.product_image ? (
                    <motion.img
                      src={offer.product_image}
                      alt={offer.product_name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.12 }}
                    />
                  ) : (
                    <Flame className="h-16 w-16 text-slate-300" />
                  )}
                </div>

                {/* Brand */}
                <Badge variant="outline" className="mx-4 w-fit text-xs font-bold border-red-300 bg-red-50 dark:bg-red-900/30">
                  🏷️ {offer.product_mark || 'Charger'}
                </Badge>

                {/* Product Name */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 mx-4 line-clamp-2">
                  {offer.product_name}
                </h3>

                {/* Description */}
                {offer.product_description && (
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mx-4 mb-2">
                    📝 {offer.product_description}
                  </p>
                )}

                {/* Specs Section Header */}
                <div className="mx-4 mb-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">⚡ {language === 'ar' ? 'المواصفات' : 'Spécifications'}</p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-1.5 mx-4 mb-3">
                  <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-1.5 text-center border border-red-200 dark:border-red-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚡ {language === 'ar' ? 'الفولت' : 'Voltage'}</div>
                    <div className="text-xs font-bold text-red-600 dark:text-red-400">{offer.voltage ? `${offer.voltage}V` : 'N/A'}</div>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-900/30 rounded-lg p-1.5 text-center border border-rose-200 dark:border-rose-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔌 {language === 'ar' ? 'القوة' : 'Wattage'}</div>
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400">{offer.wattage ? `${offer.wattage}W` : 'N/A'}</div>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-1.5 text-center border border-pink-200 dark:border-pink-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚙️ {language === 'ar' ? 'التيار' : 'Ampérage'}</div>
                    <div className="text-xs font-bold text-pink-600 dark:text-pink-400">{offer.amperage ? `${offer.amperage}A` : 'N/A'}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-1.5 text-center border border-orange-200 dark:border-orange-700">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔧 {language === 'ar' ? 'الوصلة' : 'Connexion'}</div>
                    <div className="text-xs font-bold text-orange-600 dark:text-orange-400 truncate">{offer.connection_type || 'N/A'}</div>
                  </div>
                </div>

                {/* Price */}
                <div className="mx-4 mb-3">
                  <p className="text-sm line-through text-slate-500 mb-1">
                    {offer.original_price.toFixed(2)} DZD
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {offer.special_price.toFixed(2)} DZD
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 px-4 pb-4 mt-auto">
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleAddToCart(offer)}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg py-2 text-xs"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'سلة' : 'Panier'}
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleViewDetails(offer)}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-lg py-2 text-xs"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'عرض' : 'Voir'}
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleOrder(offer)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg py-2 text-xs"
                    >
                      {language === 'ar' ? '📦 طلب' : '📦 Commande'}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-6"
              size="lg"
              onClick={() => (window.location.href = '/website-shop/special-offers')}
            >
              {language === 'ar' ? 'عرض جميع العروض الخاصة' : 'Voir Toutes les Offres Spéciales'}
              <Flame className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.section>
      )}

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
