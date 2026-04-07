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
import { getSpecialOffersREST } from '@/lib/supabaseClient';
import { Search, Zap, ShoppingCart, Eye, Crown } from 'lucide-react';

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
  special_price?: number;
  offer_price?: number;
  discount_percentage: number;
  is_visible: boolean;
  description?: string;
}

export default function WebsiteSpecialOffers() {
  const { language, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<SpecialOffer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<SpecialOffer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const data = await getSpecialOffersREST();
        const visibleOffers = data.filter((o: any) => o.is_visible);
        setOffers(visibleOffers);
        setFilteredOffers(visibleOffers);
      } catch (error) {
        console.error('Error fetching special offers:', error);
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

  const handleAddToCart = (offer: SpecialOffer) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.product_id === offer.product_id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        product_id: offer.product_id,
        name: offer.product_name,
        product_name: offer.product_name,
        price: offer.special_price || offer.offer_price,
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
    
    setCartNotification(offer.product_name);
    setTimeout(() => setCartNotification(null), 3000);
  };

  const handleOrder = (offer: SpecialOffer) => {
    // Add to cart if not already there
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.product_id === offer.product_id);
    if (!existingItem) {
      handleAddToCart(offer);
    }
    // Navigate to cart
    navigate(`/website-shop/order`);
  };

  const handleViewDetails = (offer: SpecialOffer) => {
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
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
          {language === 'ar' ? '👑 العروض الحصرية' : '👑 Offres Exclusives'}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {language === 'ar' ? 'اغتنم الفرصة - عروض محدودة الوقت على شواحن متميزة' : 'Saisissez l\'occasion - Offres limitées sur des chargeurs premium'}
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
          placeholder={language === 'ar' ? '🔍 ابحث عن شاحن حصري...' : '🔍 Rechercher une offre...'}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className={`${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-slate-800 border-2 border-red-200 dark:border-red-700 focus:border-pink-500 py-6 text-lg`}
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
            className="h-12 w-12 rounded-full border-4 border-red-200 dark:border-red-700 border-t-red-600"
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
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-300" />
                
                <div className="relative bg-white dark:bg-slate-800 border-2 border-red-200 dark:border-red-700 rounded-2xl overflow-hidden h-full flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300">
                  {/* Premium Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="absolute top-3 left-3 z-10"
                  >
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 animate-bounce">
                      👑 {language === 'ar' ? 'حصري' : 'PREMIUM'}
                    </Badge>
                  </motion.div>

                  {/* Discount Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                    className="absolute top-3 right-3 z-10"
                  >
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1 animate-pulse">
                      👑 -{offer.discount_percentage}%
                    </Badge>
                  </motion.div>

                  {/* Product Image - Full Screen */}
                  <div className="relative h-72 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 flex items-center justify-center overflow-hidden w-full">
                    {offer.product_image ? (
                      <motion.img
                        src={offer.product_image}
                        alt={offer.product_name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.12 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0], y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Crown className="h-20 w-20 text-slate-300" />
                      </motion.div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Brand - Always Show */}
                    <Badge variant="outline" className="w-fit mb-3 text-xs font-bold border-red-300 bg-red-50 dark:bg-red-900/30">
                      🏆 {offer.product_mark || 'Charger'}
                    </Badge>

                    {/* Product Name */}
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 line-clamp-2">
                      {offer.product_name}
                    </h3>

                    {/* Description - Bold and Bigger */}
                    {offer.product_description && (
                      <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-3">
                        📝 {offer.product_description}
                      </p>
                    )}

                    {/* Specs Section Header */}
                    <div className="mb-3">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">⚡ {language === 'ar' ? 'المواصفات الكهربائية' : 'Spécifications Électriques'}</p>
                    </div>

                    {/* Specs Grid - Always Show */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/50 rounded-lg p-2 text-center border border-red-200 dark:border-red-700">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">⚡ {language === 'ar' ? 'الفولت' : 'Voltage'}</div>
                        <div className="text-sm font-bold text-red-600 dark:text-red-400">{offer.voltage ? `${offer.voltage}V` : 'N/A'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-900/50 rounded-lg p-2 text-center border border-rose-200 dark:border-rose-700">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">🔌 {language === 'ar' ? 'القوة' : 'Wattage'}</div>
                        <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{offer.wattage ? `${offer.wattage}W` : 'N/A'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-900/50 rounded-lg p-2 text-center border border-pink-200 dark:border-pink-700">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">⚙️ {language === 'ar' ? 'التيار' : 'Amperage'}</div>
                        <div className="text-sm font-bold text-pink-600 dark:text-pink-400">{offer.amperage ? `${offer.amperage}A` : 'N/A'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/50 rounded-lg p-2 text-center border border-orange-200 dark:border-orange-700">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">🔧 {language === 'ar' ? 'الوصلة' : 'Connexion'}</div>
                        <div className="text-sm font-bold text-orange-600 dark:text-orange-400 truncate">{offer.connection_type || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Price - Only Real Price */}
                    {(offer.offer_price !== undefined && offer.offer_price !== null) && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-3 mb-3 border-2 border-red-200 dark:border-red-700">
                      <div className="flex items-baseline gap-2 justify-center">
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {(offer.offer_price || 0).toFixed(2)}
                        </span>
                        <span className="text-base text-slate-600 dark:text-slate-400 font-semibold">
                          {language === 'ar' ? 'دج' : 'DZD'}
                        </span>
                      </div>
                      <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold">
                        {language === 'ar' ? '✅ السعر النهائي الحصري' : '✅ Prix Final Exclusif'}
                      </p>
                    </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto pt-3 min-h-12">
                    <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                      <Button
                        onClick={() => handleAddToCart(offer)}
                        className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg py-2 px-4 text-base transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        {language === 'ar' ? '🛒 سلة' : '🛒 Panier'}
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                      <Button
                        onClick={() => handleViewDetails(offer)}
                        className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-lg py-2 px-4 text-base transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        {language === 'ar' ? '👁️ عرض' : '👁️ Voir'}
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                      <Button
                        onClick={() => handleOrder(offer)}
                        className="w-full h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold rounded-lg py-2 px-4 text-base transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        {language === 'ar' ? '🚀 طلب' : '🚀 Commande'}
                      </Button>
                    </motion.div>
                    </div>
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
              <Crown className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-2">
                {language === 'ar' ? 'لا توجد عروض حصرية' : 'Aucune offre exclusive trouvée'}
              </h3>
              <p className="text-slate-500 dark:text-slate-500">
                {language === 'ar' ? 'عد قريبا للحصول على عروض جديدة' : 'Revenez bientôt pour de nouvelles offres'}
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-800 border-2 border-red-200 dark:border-red-700 rounded-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              👑 {selectedOffer?.product_name}
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
                className="flex items-center justify-center bg-gradient-to-br from-red-100 via-pink-100 to-rose-100 dark:from-red-900/30 dark:via-pink-900/30 dark:to-rose-900/30 rounded-2xl min-h-96 border-2 border-red-200 dark:border-red-700 p-4"
                whileHover={{ scale: 1.02 }}
              >
                {selectedOffer.product_image ? (
                  <img
                    src={selectedOffer.product_image}
                    alt={selectedOffer.product_name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <motion.div animate={{ rotate: [0, 360], y: [0, -20, 0] }} transition={{ duration: 20, repeat: Infinity }}>
                    <Crown className="h-48 w-48 text-slate-300" />
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
                    className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-4 border-l-4 border-red-500"
                  >
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                      🏆 {language === 'ar' ? 'الماركة المميزة' : 'Marque Premium'}
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
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
                    ⚡ {language === 'ar' ? 'المواصفات الكهربائية المتقدمة' : 'Spécifications Électriques Avancées'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/50 rounded-lg p-3 border-2 border-red-200 dark:border-red-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">⚡ {language === 'ar' ? 'الفولت' : 'Voltage'}</div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{selectedOffer.voltage ? `${selectedOffer.voltage}V` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-900/50 rounded-lg p-3 border-2 border-pink-200 dark:border-pink-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">⚙️ {language === 'ar' ? 'التيار' : 'Ampérage'}</div>
                      <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{selectedOffer.amperage ? `${selectedOffer.amperage}A` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-900/50 rounded-lg p-3 border-2 border-rose-200 dark:border-rose-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">🔌 {language === 'ar' ? 'القوة' : 'Puissance'}</div>
                      <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{selectedOffer.wattage ? `${selectedOffer.wattage}W` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/50 rounded-lg p-3 border-2 border-orange-200 dark:border-orange-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">� {language === 'ar' ? 'الوصلة' : 'Connexion'}</div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{selectedOffer.connection_type || 'N/A'}</div>
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
                    📝 {language === 'ar' ? 'الوصف التفصيلي' : 'Description Détaillée'}
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
                  className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-4 border-2 border-red-200 dark:border-red-700"
                >
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'السعر النهائي الحصري' : 'Prix Final Exclusif'}
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                        {selectedOffer.offer_price.toFixed(2)}
                      </span>
                      <span className="text-xl text-slate-600 dark:text-slate-400 font-bold">
                        {language === 'ar' ? 'دج' : 'DZD'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={() => handleAddToCart(selectedOffer)}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      🛒 {language === 'ar' ? 'إضافة للسلة' : 'Ajouter au Panier'}
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={() => handleOrder(selectedOffer)}
                      className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold py-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      🚀 {language === 'ar' ? 'اشتري الآن' : 'Acheter Maintenant'}
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
