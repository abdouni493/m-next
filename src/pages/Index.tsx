import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { getWebsiteSettings, getProducts, getOffers, getSpecialOffers } from '@/lib/supabaseClient';
import { ChevronDown, ShoppingBag, Star, Zap, ArrowRight, Heart, Eye, Sparkles, Rocket, Shield, Clock } from 'lucide-react';

interface WebsiteSettings {
  store_name?: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
  landing_page_image_url?: string;
}

const Index = () => {
  const { language, t } = useLanguage();
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, productsData, offersData] = await Promise.all([
          getWebsiteSettings(),
          getProducts(),
          getOffers(),
        ]);

        console.log('🎨 ===== DEEP ANALYSIS: LANDING PAGE DATA =====');
        console.log('📊 Settings:', settingsData);
        console.log('🖼️ Background Image URL:', settingsData?.landing_page_image_url);
        console.log('📐 URL Type:', typeof settingsData?.landing_page_image_url);
        console.log('✅ URL exists?', !!settingsData?.landing_page_image_url);
        console.log('📦 Products:', productsData?.length, 'items');
        console.log('🎁 Offers:', offersData?.length, 'items');
        console.log('🎨 ===== END ANALYSIS =====');

        setSettings(settingsData);
        setFeaturedProducts(productsData?.slice(0, 6) || []);
        setOffers(offersData?.slice(0, 3) || []);
      } catch (error) {
        console.error('❌ Error loading landing page data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-10">
        {/* Background Image (if available) */}
        {settings?.landing_page_image_url && (
          <>
            <div className="absolute inset-0 z-0 bg-black">
              <img
                src={settings.landing_page_image_url}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                onLoad={() => console.log('✅ BACKGROUND IMAGE LOADED:', settings.landing_page_image_url)}
                onError={(e) => {
                  console.error('❌ BACKGROUND IMAGE FAILED TO LOAD:', settings.landing_page_image_url);
                  console.error('Error event:', e);
                }}
              />
              {/* Lighter, more transparent overlay for better image visibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" />
            </div>
          </>
        )}

        {/* Animated Background Gradient (if no image) */}
        {!settings?.landing_page_image_url && (
          <motion.div
            className="absolute inset-0 z-0"
            animate={{
              background: [
                'linear-gradient(135deg, #1e1b4b 0%, #5b21b6 50%, #1e1b4b 100%)',
                'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #5b21b6 100%)',
                'linear-gradient(135deg, #1e1b4b 0%, #5b21b6 50%, #1e1b4b 100%)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        )}

        {/* Animated Orbs */}
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/* Logo */}
          {settings?.logo_url && (
            <motion.div variants={itemVariants} className="mb-8 flex justify-center">
              <motion.img
                src={settings.logo_url}
                alt="Logo"
                className="h-24 w-auto rounded-2xl shadow-2xl border-2 border-cyan-400/50 backdrop-blur-sm"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            </motion.div>
          )}

          {/* Store Name */}
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {settings?.store_name || 'Welcome'}
              </span>
            </h1>
            <motion.div
              className="h-1.5 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full mx-auto"
              initial={{ width: 0 }}
              animate={{ width: 200 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </motion.div>

          {/* Slogan */}
          {settings?.slogan && (
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-3xl font-bold text-gray-200 mb-6 leading-relaxed"
            >
              ✨ {settings.slogan}
            </motion.p>
          )}

          {/* Description */}
          {settings?.description && (
            <motion.p
              variants={itemVariants}
              className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              {settings.description}
            </motion.p>
          )}

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <motion.a
              href="/shop"
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl font-bold text-lg flex items-center gap-3 shadow-2xl border border-cyan-300/50 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ x: [-100, 100] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <ShoppingBag className="h-6 w-6 relative z-10" />
              <span className="relative z-10">
                {language === 'ar' ? 'تسوق الآن' : language === 'fr' ? 'Magasinez Maintenant' : 'Shop Now'}
              </span>
            </motion.a>

            <motion.a
              href="#offers"
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 border-2 border-white/50 rounded-xl font-bold text-lg hover:bg-white/10 backdrop-blur-sm transition-all shadow-lg"
            >
              {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'Découvrir' : 'Discover'}
            </motion.a>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-sm text-gray-400">
              {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'Découvrez plus' : 'Scroll to explore'}
            </span>
            <ChevronDown className="h-6 w-6 text-cyan-400 animate-pulse" />
          </motion.div>
        </motion.div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section className="py-20 px-4 relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20"
        >
          {[
            { icon: Rocket, title: language === 'ar' ? 'سريع' : language === 'fr' ? 'Rapide' : 'Fast', desc: language === 'ar' ? 'توصيل سريع' : language === 'fr' ? 'Livraison rapide' : 'Quick delivery' },
            { icon: Shield, title: language === 'ar' ? 'آمن' : language === 'fr' ? 'Sûr' : 'Secure', desc: language === 'ar' ? 'دفع آمن' : language === 'fr' ? 'Paiement sécurisé' : 'Secure payment' },
            { icon: Sparkles, title: language === 'ar' ? 'جودة' : language === 'fr' ? 'Qualité' : 'Quality', desc: language === 'ar' ? 'منتجات عالية الجودة' : language === 'fr' ? 'Produits de qualité' : 'Premium products' },
            { icon: Clock, title: language === 'ar' ? '24/7' : language === 'fr' ? '24/7' : '24/7', desc: language === 'ar' ? 'دعم العملاء' : language === 'fr' ? 'Support client' : 'Customer support' },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border border-purple-500/30 rounded-2xl p-6 text-center backdrop-blur-sm hover:border-purple-400/50 transition-all"
            >
              <feature.icon className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ========== OFFERS SECTION ========== */}
      {offers.length > 0 && (
        <section id="offers" className="py-24 px-4 relative">
          <div className="absolute inset-0 z-0">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/2 left-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"
            />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  🔥 {language === 'ar' ? 'عروض حصرية' : language === 'fr' ? 'Offres Exclusives' : 'Exclusive Offers'}
                </span>
              </h2>
              <p className="text-gray-400">{language === 'ar' ? 'أفضل الأسعار والعروض' : language === 'fr' ? 'Les meilleures offres du jour' : 'Best prices and offers'}</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="group relative bg-gradient-to-br from-red-950/40 to-pink-950/40 border border-red-500/40 rounded-2xl overflow-hidden shadow-xl hover:shadow-red-500/30 transition-all backdrop-blur-sm"
                >
                  {offer.product_image && (
                    <div className="relative h-48 overflow-hidden">
                      <motion.img
                        whileHover={{ scale: 1.2 }}
                        src={offer.product_image}
                        alt={offer.product_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg"
                      >
                        -{offer.discount_percentage}%
                      </motion.div>
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3">{offer.product_name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 line-through">{offer.original_price} DA</span>
                      <span className="text-3xl font-black text-transparent bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text">
                        {offer.offer_price} DA
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg"
                    >
                      <Zap className="h-5 w-5" />
                      {language === 'ar' ? 'اشتر الآن' : language === 'fr' ? 'Acheter' : 'Buy Now'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ========== PRODUCTS SECTION ========== */}
      {featuredProducts.length > 0 && (
        <section className="py-24 px-4 relative">
          <div className="absolute inset-0 z-0">
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-1/2 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
            />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  ⭐ {language === 'ar' ? 'منتجات مختارة' : language === 'fr' ? 'Produits en Vedette' : 'Featured Products'}
                </span>
              </h2>
              <p className="text-gray-400">{language === 'ar' ? 'أفضل اختيارتنا لك' : language === 'fr' ? 'Nos meilleurs choix pour vous' : 'Our best picks for you'}</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={containerVariants}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {featuredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-xl hover:shadow-cyan-500/40 transition-all backdrop-blur-sm"
                >
                  {product.primary_image && (
                    <div className="relative h-56 overflow-hidden">
                      <motion.img
                        whileHover={{ scale: 1.15 }}
                        src={product.primary_image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="absolute inset-0 m-auto w-fit bg-cyan-500/80 backdrop-blur-sm p-4 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-6 w-6" />
                      </motion.button>
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-2xl font-black text-cyan-400">{product.selling_price} DA</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:shadow-lg"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      {language === 'ar' ? 'أضف إلى السلة' : language === 'fr' ? 'Ajouter' : 'Add to Cart'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-center mt-16"
            >
              <motion.a
                href="/shop"
                whileHover={{ scale: 1.08 }}
                className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg flex items-center gap-3 shadow-2xl border border-cyan-300/50 hover:shadow-3xl transition-all"
              >
                {language === 'ar' ? 'شاهد جميع المنتجات' : language === 'fr' ? 'Voir Tous les Produits' : 'View All Products'}
                <ArrowRight className="h-6 w-6" />
              </motion.a>
            </motion.div>
          </div>
        </section>
      )}

      {/* ========== NEWSLETTER SECTION ========== */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-purple-500/30 rounded-3xl p-12 text-center backdrop-blur-sm"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {language === 'ar' ? 'اشترك في النشرة الإخبارية' : language === 'fr' ? 'Abonnez-vous à notre newsletter' : 'Subscribe to Our Newsletter'}
            </h2>
            <p className="text-gray-300 mb-8">
              {language === 'ar' ? 'احصل على أحدث العروض والأخبار' : language === 'fr' ? 'Recevez les dernières offres et actualités' : 'Get the latest offers and news'}
            </p>
            <div className="flex gap-4 flex-col sm:flex-row">
              <input
                type="email"
                placeholder={language === 'ar' ? 'بريدك الإلكتروني' : language === 'fr' ? 'Votre email' : 'Your email'}
                className="flex-1 px-6 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold whitespace-nowrap"
              >
                {language === 'ar' ? 'اشترك' : language === 'fr' ? 'S\'abonner' : 'Subscribe'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-t border-purple-500/20 py-12 px-4 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-3 text-white">{settings?.store_name || 'Store'}</h3>
            <p className="text-gray-400 mb-4">
              © 2026 {settings?.store_name || 'Store'} - {language === 'ar' ? 'جميع الحقوق محفوظة' : language === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}
            </p>
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-sm text-gray-500"
            >
              {language === 'ar' ? 'تم تطويره بواسطة فريقنا بكل ❤️' : language === 'fr' ? 'Conçu avec ❤️ par notre équipe' : 'Designed with ❤️ by our team'}
            </motion.p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
