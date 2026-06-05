import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getSpecialOffersREST } from '@/lib/supabaseClient';
import { Search, Zap, ShoppingCart, X, Flame, MessageCircle } from 'lucide-react';
import GlowCard from '@/components/website/GlowCard';
import ElectricBadge from '@/components/website/ElectricBadge';
import { imgSrc } from '@/lib/imageUtils';

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
  show_price?: boolean;
  description?: string;
}

export default function WebsiteSpecialOffers() {
  const { language, isRTL } = useLanguage();
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
        const visible = data.filter((o: any) => o.is_visible);
        setOffers(visible);
        setFilteredOffers(visible);
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
    setFilteredOffers(offers.filter(o =>
      o.product_name.toLowerCase().includes(query.toLowerCase()) ||
      o.product_mark?.toLowerCase().includes(query.toLowerCase()) ||
      o.product_description?.toLowerCase().includes(query.toLowerCase())
    ));
  };

  const handleAddToCart = (offer: SpecialOffer) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.product_id === offer.product_id);
    if (existing) {
      existing.quantity += 1;
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
        offer_id: offer.id,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    setCartNotification(offer.product_name);
    setTimeout(() => setCartNotification(null), 3000);
  };

  const handleOrder = (offer: SpecialOffer) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.find((i: any) => i.product_id === offer.product_id)) handleAddToCart(offer);
    navigate('/website-shop/order');
  };

  const handleViewDetails = (offer: SpecialOffer) => {
    setSelectedOffer(offer);
    setShowDetails(true);
  };

  const displayPrice = (offer: SpecialOffer) => offer.offer_price ?? offer.special_price;

  return (
    <div style={{ background: '#020817', color: '#F1F5F9', minHeight: '100vh' }} className={isRTL ? 'rtl' : 'ltr'}>

      {/* Fire-themed page header */}
      <div className="relative py-16 px-4 overflow-hidden">
        {/* Fire radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(255,107,53,0.12) 0%, transparent 60%)' }} />
        {/* Animated fire particles (CSS) */}
        {[...Array(6)].map((_, i) => (
          <motion.div key={i}
            className="absolute bottom-0 rounded-full pointer-events-none"
            style={{ width: `${4 + i * 3}px`, height: `${4 + i * 3}px`, left: `${10 + i * 15}%`, background: i % 2 === 0 ? '#FF6B35' : '#F59E0B', filter: 'blur(2px)' }}
            animate={{ y: [0, -80, -160], opacity: [0.8, 0.4, 0] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
          />
        ))}

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Flame className="w-12 h-12 mx-auto" style={{ color: '#FF6B35', filter: 'drop-shadow(0 0 8px #FF6B35)' }} />
            </motion.div>
            <h1 className="font-grotesk font-black text-4xl md:text-5xl mb-3">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #FF6B35, #F59E0B, #EF4444)' }}>
                🔥 {language === 'ar' ? 'عروض خاصة' : 'Offres Spéciales'}
              </span>
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }}
              />
              <p className="text-sm font-semibold" style={{ color: '#FF6B35' }}>
                {language === 'ar' ? 'عروض محدودة!' : 'Offres Limitées !'}
              </p>
            </div>
            <p className="text-base" style={{ color: '#64748B' }}>
              {language === 'ar' ? 'اغتنم الفرصة — خصومات حصرية على شواحن مميزة' : 'Saisissez l\'occasion — Remises exclusives sur des chargeurs premium'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 space-y-8">

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative max-w-lg mx-auto">
          <Search className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 pointer-events-none" style={{ color: '#FF6B35' }} />
          <input
            placeholder={language === 'ar' ? '🔍 ابحث عن عرض...' : '🔍 Rechercher une offre...'}
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#0F172A', color: '#F1F5F9', border: '1px solid rgba(255,107,53,0.2)' }}
            onFocus={e => (e.target.style.borderColor = '#FF6B35')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,107,53,0.2)')}
          />
        </motion.div>

        {/* Cart toast */}
        <AnimatePresence>
          {cartNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-24 left-1/2 z-50 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
            >
              ✅ {cartNotification} {language === 'ar' ? 'أضيف للسلة' : 'ajouté au panier'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full"
              style={{ border: '2px solid rgba(255,107,53,0.1)', borderTopColor: '#FF6B35' }}
            />
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredOffers.map((offer, i) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlowCard glowColor="orange" className="flex flex-col h-full relative cursor-pointer" onClick={() => handleViewDetails(offer)}>
                    {/* Animated fire border */}
                    <div className="absolute inset-0 rounded-2xl pointer-events-none fire-border" style={{ border: '1px solid #FF6B35', opacity: 0.5 }} />

                    {/* PROMO ribbon */}
                    {offer.discount_percentage > 0 && (
                      <div className="absolute top-4 right-0 z-10 overflow-hidden" style={{ width: '80px' }}>
                        <div className="text-xs font-black text-white text-center py-1 px-2 rotate-0"
                          style={{ background: 'linear-gradient(135deg, #EF4444, #FF6B35)', borderRadius: '4px 0 0 4px' }}
                        >
                          -{offer.discount_percentage}%
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-56 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.05), rgba(239,68,68,0.05))' }}>
                      {offer.product_image ? (
                        <motion.img src={imgSrc.card(offer.product_image)} alt={offer.product_name}
                          className="w-full h-full object-cover"
                          loading="lazy" decoding="async"
                          whileHover={{ scale: 1.08 }} transition={{ duration: 0.4 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Flame className="w-14 h-14" style={{ color: 'rgba(255,107,53,0.3)' }} />
                        </div>
                      )}
                      {offer.product_mark && (
                        <div className="absolute top-3 left-3">
                          <ElectricBadge color="orange">{offer.product_mark}</ElectricBadge>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-grotesk font-bold text-base mb-2 line-clamp-2" style={{ color: '#F1F5F9' }}>
                        {offer.product_name}
                      </h3>
                      {offer.product_description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: '#64748B' }}>{offer.product_description}</p>
                      )}

                      {/* Specs */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {offer.voltage && <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(255,107,53,0.08)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }}>⚡ {offer.voltage}V</span>}
                        {offer.amperage && <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>🔌 {offer.amperage}A</span>}
                        {offer.wattage && <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>💡 {offer.wattage}W</span>}
                      </div>

                      {/* Price */}
                      <div className="mb-4 mt-auto">
                        {offer.show_price === false ? (
                          <p className="text-sm font-semibold" style={{ color: '#64748B' }}>
                            📞 {language === 'ar' ? 'تواصل للسعر' : 'Contactez-nous'}
                          </p>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            {offer.original_price > 0 && (
                              <span className="text-sm line-through" style={{ color: '#64748B' }}>
                                {offer.original_price.toLocaleString()} DZD
                              </span>
                            )}
                            {displayPrice(offer) != null && (
                              <span className="font-grotesk font-black text-2xl" style={{ color: '#FF6B35' }}>
                                {(displayPrice(offer) as number).toLocaleString()} DZD
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="grid grid-cols-3 gap-2" onClick={e => e.stopPropagation()}>
                        {offer.show_price === false ? (
                          <>
                            <a href={`https://wa.me/`} target="_blank" rel="noopener noreferrer"
                              className="col-span-3 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white"
                              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                            >
                              <MessageCircle className="w-4 h-4" />
                              {language === 'ar' ? 'تواصل معنا' : 'Contactez-nous'}
                            </a>
                          </>
                        ) : (
                          <>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              onClick={() => handleAddToCart(offer)}
                              className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold"
                              style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.25)' }}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              {language === 'ar' ? 'سلة' : 'Panier'}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                              onClick={() => handleViewDetails(offer)}
                              className="flex items-center justify-center py-2 rounded-lg text-xs font-bold"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                              👁️ {language === 'ar' ? 'عرض' : 'Voir'}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 14px rgba(255,107,53,0.5)' }} whileTap={{ scale: 0.96 }}
                              onClick={() => handleOrder(offer)}
                              className="flex items-center justify-center py-2 rounded-lg text-xs font-bold text-white"
                              style={{ background: 'linear-gradient(135deg, #FF6B35, #EF4444)' }}
                            >
                              📦 {language === 'ar' ? 'طلب' : 'Cmd'}
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </motion.div>

            {/* Empty */}
            {filteredOffers.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-24 rounded-2xl"
                style={{ border: '2px dashed rgba(255,107,53,0.1)', background: 'rgba(255,107,53,0.01)' }}
              >
                <Flame className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(255,107,53,0.2)' }} />
                <h3 className="font-grotesk font-bold text-xl mb-2" style={{ color: '#64748B' }}>
                  {language === 'ar' ? 'لا توجد عروض حالياً' : 'Aucune offre disponible'}
                </h3>
                <p className="text-sm" style={{ color: '#1E3A5F' }}>
                  {language === 'ar' ? 'عد قريباً للحصول على عروض جديدة' : 'Revenez bientôt pour de nouvelles offres'}
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {showDetails && selectedOffer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 z-40" style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-4 sm:inset-8 z-50 rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#0F172A', border: '1px solid rgba(255,107,53,0.3)', maxWidth: '900px', margin: 'auto' }}
            >
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,107,53,0.15)' }}>
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 flex-shrink-0" style={{ color: '#FF6B35' }} />
                  <h2 className="font-grotesk font-bold text-lg line-clamp-1" style={{ color: '#F1F5F9' }}>
                    {selectedOffer.product_name}
                  </h2>
                </div>
                <button onClick={() => setShowDetails(false)} style={{ color: '#64748B' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="h-64 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.15)' }}
                  >
                    {selectedOffer.product_image ? (
                      <img src={imgSrc.detail(selectedOffer.product_image)} alt={selectedOffer.product_name} className="max-w-full max-h-full object-contain p-4" loading="lazy" decoding="async" />
                    ) : (
                      <Flame className="w-20 h-20" style={{ color: 'rgba(255,107,53,0.2)' }} />
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {selectedOffer.product_mark && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,107,53,0.05)', borderLeft: '3px solid #FF6B35' }}>
                        <p className="text-xs mb-1" style={{ color: '#64748B' }}>🏷️ Marque</p>
                        <p className="font-grotesk font-bold text-lg" style={{ color: '#FF6B35' }}>{selectedOffer.product_mark}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Voltage', value: selectedOffer.voltage ? `${selectedOffer.voltage}V` : 'N/A', color: '#FF6B35' },
                        { label: 'Ampérage', value: selectedOffer.amperage ? `${selectedOffer.amperage}A` : 'N/A', color: '#EF4444' },
                        { label: 'Puissance', value: selectedOffer.wattage ? `${selectedOffer.wattage}W` : 'N/A', color: '#F59E0B' },
                        { label: 'Connexion', value: selectedOffer.connection_type || 'N/A', color: '#10B981' },
                      ].map(s => (
                        <div key={s.label} className="p-3 rounded-xl" style={{ background: 'rgba(30,58,95,0.3)', border: `1px solid ${s.color}22` }}>
                          <p className="text-xs mb-1" style={{ color: '#64748B' }}>{s.label}</p>
                          <p className="font-grotesk font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedOffer.product_description && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(30,58,95,0.6)' }}>
                        <p className="text-xs mb-1" style={{ color: '#64748B' }}>📝 Description</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{selectedOffer.product_description}</p>
                      </div>
                    )}

                    {/* Price section */}
                    {selectedOffer.show_price !== false && displayPrice(selectedOffer) != null && (
                      <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)' }}>
                        {selectedOffer.original_price > 0 && (
                          <p className="text-sm line-through mb-1" style={{ color: '#64748B' }}>
                            {selectedOffer.original_price.toLocaleString()} DZD
                          </p>
                        )}
                        <span className="font-grotesk font-black text-3xl" style={{ color: '#FF6B35' }}>
                          {(displayPrice(selectedOffer) as number).toLocaleString()} DZD
                        </span>
                        {selectedOffer.discount_percentage > 0 && (
                          <div className="mt-1">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                              -{selectedOffer.discount_percentage}% {language === 'ar' ? 'خصم' : 'de remise'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedOffer.show_price === false ? (
                      <a href="https://wa.me/" target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white w-full"
                        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {language === 'ar' ? 'تواصل للسعر' : 'Contactez-nous pour le prix'}
                      </a>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => { handleAddToCart(selectedOffer); setShowDetails(false); }}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                          style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' }}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {language === 'ar' ? 'أضف للسلة' : 'Ajouter'}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(255,107,53,0.4)' }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleOrder(selectedOffer)}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                          style={{ background: 'linear-gradient(135deg, #FF6B35, #EF4444)' }}
                        >
                          🚀 {language === 'ar' ? 'اطلب الآن' : 'Commander'}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
