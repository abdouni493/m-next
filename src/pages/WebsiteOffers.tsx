import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getOffersREST } from '@/lib/supabaseClient';
import { Search, Zap, ShoppingCart, Eye, Bolt, Plug, Gauge } from 'lucide-react';

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
  description?: string;
}

export default function WebsiteOffers() {
  const { language, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const data = await getOffersREST();
        const visibleOffers = data.filter((o: any) => o.is_visible);
        setOffers(visibleOffers);
        setFilteredOffers(visibleOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = offers.filter(offer =>
      offer.product_name.toLowerCase().includes(query.toLowerCase()) ||
      offer.product_mark?.toLowerCase().includes(query.toLowerCase()) ||
      offer.product_description?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOffers(filtered);
  };

  const handleAddToCart = (offer: Offer) => {
    // Store in cart with complete product info
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.product_id === offer.product_id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        product_id: offer.product_id,
        name: offer.product_name,
        product_name: offer.product_name,
        price: offer.offer_price,
        quantity: 1,
        image: offer.product_image,
        product_image: offer.product_image,
        mark: offer.product_mark,
        product_mark: offer.product_mark,
        description: offer.product_description,
        product_description: offer.product_description,
        voltage: offer.voltage,
        wattage: offer.wattage,
        amperage: offer.amperage,
        connection_type: offer.connection_type,
        from_offer: true,
        offer_id: offer.id
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Trigger cart update event for navbar
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Show success notification
    setCartNotification(offer.product_name);
    setTimeout(() => setCartNotification(null), 3000);
  };

  const handleOrder = (offer: Offer) => {
    // Add to cart if not already there
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.product_id === offer.product_id);
    if (!existingItem) {
      handleAddToCart(offer);
    }
    // Navigate to cart
    navigate(`/website-shop/order`);
  };

  const handleViewDetails = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDetails(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
    hover: {
      y: -10,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-12 space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          {language === 'ar' ? '⚡ العروض الخاصة' : '⚡ Nos Offres Spéciales'}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {language === 'ar' ? 'اكتشف أفضل أسعارنا على شواحن عالية الجودة' : 'Découvrez nos meilleures prix sur des chargeurs de haute qualité'}
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative max-w-md mx-auto"
      >
        <Search className={`absolute top-3 h-5 w-5 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
        <Input
          placeholder={language === 'ar' ? '🔍 ابحث عن شاحن...' : '🔍 Rechercher un chargeur...'}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 focus:border-purple-500 py-6 text-lg`}
        />
      </motion.div>

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
      )}      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-12 w-12 rounded-full border-4 border-blue-200 dark:border-blue-700 border-t-blue-600"
          />
        </div>
      ) : (
        <>
          {/* Offers Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                variants={itemVariants}
                whileHover="hover"
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-300" />
                
                <div className="relative bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-8 h-full flex flex-col overflow-hidden">
                  {/* Discount Badge */}
                  {offer.discount_percentage > 0 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="absolute top-3 right-3 z-10"
                  >
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1 animate-pulse">
                      🔥 -{offer.discount_percentage}%
                    </Badge>
                  </motion.div>
                  )}

                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    {offer.product_image ? (
                      <motion.img
                        src={offer.product_image}
                        alt={offer.product_name}
                        className="max-w-full max-h-full object-contain"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Zap className="h-16 w-16 text-slate-300" />
                      </motion.div>
                    )}
                  </div>

                  {/* Brand - Always Show */}
                  <Badge variant="outline" className="w-fit mb-2 text-xs font-bold border-blue-300 bg-blue-50 dark:bg-blue-900/30">
                    🏷️ {offer.product_mark || 'Charger'}
                  </Badge>

                  {/* Product Name */}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 line-clamp-2">
                    {offer.product_name}
                  </h3>

                  {/* Description */}
                  {offer.product_description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-1 italic">
                      📝 {offer.product_description}
                    </p>
                  )}

                  {/* Specs Section Header */}
                  <div className="mb-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">⚡ {language === 'ar' ? 'المواصفات الكهربائية' : 'Spécifications Électriques'}</p>
                  </div>

                  {/* Specs Grid - Always Show */}
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-1.5 text-center border border-blue-200 dark:border-blue-700">
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚡ {language === 'ar' ? 'الفولت' : 'Voltage'}</div>
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{offer.voltage ? `${offer.voltage}V` : 'N/A'}</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-1.5 text-center border border-yellow-200 dark:border-yellow-700">
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔌 {language === 'ar' ? 'القوة' : 'Wattage'}</div>
                      <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{offer.wattage ? `${offer.wattage}W` : 'N/A'}</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-1.5 text-center border border-purple-200 dark:border-purple-700">
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚙️ {language === 'ar' ? 'التيار' : 'Amperage'}</div>
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{offer.amperage ? `${offer.amperage}A` : 'N/A'}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-1.5 text-center border border-green-200 dark:border-green-700">
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔧 {language === 'ar' ? 'الوصلة' : 'Connexion'}</div>
                      <div className="text-xs font-bold text-green-600 dark:text-green-400 truncate">{offer.connection_type || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Price - Only Real Price */}
                  {(offer.offer_price !== undefined && offer.offer_price !== null) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-2 mb-2 border-2 border-green-200 dark:border-green-700">
                    <div className="flex items-baseline gap-2 justify-center">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {offer.discount_percentage > 0 
                          ? (offer.offer_price || 0).toFixed(2)
                          : (offer.original_price || 0).toFixed(2)
                        }
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
                        {language === 'ar' ? 'دج' : 'DZD'}
                      </span>
                    </div>
                    <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">
                      {offer.discount_percentage > 0
                        ? (language === 'ar' ? '✅ السعر النهائي' : '✅ Prix Final')
                        : (language === 'ar' ? '💰 السعر' : '💰 Prix')
                      }
                    </p>
                  </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto pt-4 min-h-12">
                    <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                      <Button
                        onClick={() => handleAddToCart(offer)}
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg py-2 px-4 text-base transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        {language === 'ar' ? '🛒 سلة' : '🛒 Panier'}
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                      <Button
                        onClick={() => handleViewDetails(offer)}
                        className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg py-2 px-4 text-base transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                        variant="default"
                      >
                        {language === 'ar' ? '👁️ عرض' : '👁️ Voir'}
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                      <Button
                        onClick={() => handleOrder(offer)}
                        className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg py-2 px-4 text-base transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        {language === 'ar' ? '🚀 طلب' : '🚀 Commande'}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredOffers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Zap className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-2">
                {language === 'ar' ? 'لا توجد عروض' : 'Aucune offre trouvée'}
              </h3>
              <p className="text-slate-500 dark:text-slate-500">
                {language === 'ar' ? 'حاول البحث عن منتج آخر' : 'Essayez une autre recherche'}
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-700 rounded-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {selectedOffer?.product_name}
            </DialogTitle>
          </DialogHeader>

          {selectedOffer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6"
            >
              {/* Image */}
              <motion.div
                className="flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-2xl min-h-96 border-2 border-purple-200 dark:border-purple-700 p-4"
                whileHover={{ scale: 1.02 }}
              >
                {selectedOffer.product_image ? (
                  <img
                    src={selectedOffer.product_image}
                    alt={selectedOffer.product_name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity }}>
                    <Zap className="h-48 w-48 text-slate-300" />
                  </motion.div>
                )}
              </motion.div>

              {/* Details */}
              <div className="space-y-6 overflow-y-auto max-h-96 pr-2">
                {/* Brand & Mark */}
                {selectedOffer.product_mark && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border-l-4 border-blue-500"
                  >
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                      🏷️ {language === 'ar' ? 'الماركة' : 'Marque'}
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedOffer.product_mark}
                    </p>
                  </motion.div>
                )}

                {/* Specifications */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-3">
                    ⚡ {language === 'ar' ? 'المواصفات الكهربائية' : 'Spécifications Électriques'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 rounded-lg p-3 border-2 border-blue-200 dark:border-blue-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">⚡ {language === 'ar' ? 'الفولت' : 'Voltage'}</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedOffer.voltage ? `${selectedOffer.voltage}V` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/50 rounded-lg p-3 border-2 border-purple-200 dark:border-purple-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">⚙️ {language === 'ar' ? 'التيار' : 'Ampérage'}</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedOffer.amperage ? `${selectedOffer.amperage}A` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/50 rounded-lg p-3 border-2 border-yellow-200 dark:border-yellow-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">🔌 {language === 'ar' ? 'القوة' : 'Puissance'}</div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{selectedOffer.wattage ? `${selectedOffer.wattage}W` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 rounded-lg p-3 border-2 border-green-200 dark:border-green-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">� {language === 'ar' ? 'الوصلة' : 'Connexion'}</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedOffer.connection_type || 'N/A'}</div>
                    </div>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-600"
                >
                  <p className="font-bold text-slate-900 dark:text-white mb-2">
                    📝 {language === 'ar' ? 'الوصف' : 'Description'}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedOffer.product_description || (language === 'ar' ? 'لا يوجد وصف' : 'Aucune description disponible')}
                  </p>
                </motion.div>

                {/* Pricing & Discount */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-700"
                >
                  <p className="font-bold text-slate-900 dark:text-white mb-2">
                    💰 {language === 'ar' ? 'السعر' : 'Prix'}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'السعر الأصلي' : 'Prix Original'}: <span className="font-semibold text-slate-900 dark:text-white">{selectedOffer.original_price ? selectedOffer.original_price.toFixed(2) : 'N/A'} DZD</span>
                    </p>
                  </div>
                </motion.div>

                {/* Pricing */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 border-2 border-green-200 dark:border-green-700"
                >
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'السعر النهائي' : 'Prix Final'}
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                        {selectedOffer.offer_price.toFixed(2)}
                      </span>
                      <span className="text-xl text-slate-600 dark:text-slate-400 font-bold">
                        {language === 'ar' ? 'دج' : 'DZD'}
                      </span>
                    </div>
                  </div>
                </motion.div>
                <div className="flex gap-3 pt-4">
                  <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={() => handleAddToCart(selectedOffer)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      🛒 {language === 'ar' ? 'إضافة للسلة' : 'Ajouter au Panier'}
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={() => handleOrder(selectedOffer)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      🚀 {language === 'ar' ? 'شراء الآن' : 'Acheter Maintenant'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
