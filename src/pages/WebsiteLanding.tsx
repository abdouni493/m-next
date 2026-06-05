import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getWebsiteSettingsREST, getAllProductsREST, getApprovedTestimonials, createTestimonial } from '@/lib/supabaseClient';
import { ChevronRight, Zap, Flame, ShoppingCart, Eye, X, Upload, Loader, AlertCircle, Truck, Shield, Star } from 'lucide-react';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { uploadLandingImage, deleteLandingImage } from '@/lib/uploadLandingImage';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import GlowCard from '@/components/website/GlowCard';
import ElectricBadge from '@/components/website/ElectricBadge';
import FloatingParticles from '@/components/website/FloatingParticles';

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

// Animated counter component
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const { ref, isInView } = useScrollReveal();
  const count = useMotionValue(0);
  const rounded = useSpring(count, { stiffness: 80, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) count.set(target);
  }, [isInView, target, count]);

  useEffect(() => rounded.on('change', v => setDisplay(Math.round(v))), [rounded]);

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  );
}

export default function WebsiteLanding() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { settings: websiteSettings, imageUrl, loading: settingsLoading, refetch: refetchSettings } = useWebsiteSettings();
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
  const [showUploadUI, setShowUploadUI] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statsReveal = useScrollReveal();
  const productsReveal = useScrollReveal();
  const whyReveal = useScrollReveal();
  const testimonialsReveal = useScrollReveal();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [settingsData, productsData, testimonialsData] = await Promise.all([
          getWebsiteSettingsREST(),
          getAllProductsREST(),
          getApprovedTestimonials(),
        ]);
        setSettings(settingsData || { store_name: 'Chargeur Store', slogan: 'Quality Chargers at Best Prices' });
        const visible = (productsData || []).filter((p: any) => p.is_active);
        setAllProducts(visible);
        const brands = Array.from(new Set(visible.map((p: any) => p.product_mark).filter(Boolean))).sort() as string[];
        setAvailableBrands(brands);
        setProducts(visible.slice(0, 3));
        setTestimonials(testimonialsData || []);
      } catch {
        setSettings({ store_name: 'Chargeur Store', slogan: 'Quality Chargers at Best Prices' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadLandingImage(file);
      if (result.success) {
        await refetchSettings();
        setShowUploadUI(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageUrl) return;
    setDeleting(true);
    setUploadError(null);
    try {
      const result = await deleteLandingImage(imageUrl);
      if (result.success) await refetchSettings();
      else setUploadError(result.error || 'Deletion failed');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(false);
    }
  };

  const handleBrandClick = (brand: string | null) => {
    setSelectedBrand(brand);
    if (brand === null) {
      setProducts(allProducts.slice(0, 3));
    } else {
      const filtered = allProducts.filter(p => p.product_mark === brand);
      setProducts(filtered);
    }
  };

  const handleAddToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.product_id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: product.id, product_id: product.id, name: product.name, price: product.selling_price, quantity: 1, image: product.primary_image, from_offer: false });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    setCartNotification(product.name);
    setTimeout(() => setCartNotification(null), 3000);
  };

  const handleViewDetails = () => navigate('/website-shop/offers');

  const handleOrder = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.find((i: any) => i.product_id === product.id)) handleAddToCart(product);
    navigate('/website-shop/order');
  };

  const handleSubmitTestimonial = async () => {
    if (!testimonialName.trim() || !testimonialOpinion.trim()) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs');
      return;
    }
    setSubmittingTestimonial(true);
    try {
      const t = await createTestimonial(testimonialName, testimonialOpinion, testimonialRating);
      if (t) {
        setTestimonials([t, ...testimonials]);
        setTestimonialName(''); setTestimonialOpinion(''); setTestimonialRating(5);
        setShowTestimonialModal(false);
        alert(language === 'ar' ? 'شكراً! سيتم مراجعة رأيك وعرضه قريباً' : 'Merci! Votre avis sera publié après modération');
      }
    } catch {
      alert(language === 'ar' ? 'حدث خطأ' : 'Une erreur est survenue');
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  const featureCards = [
    { icon: <Zap className="w-7 h-7" />, color: '#00D4FF', title: language === 'ar' ? 'جودة عالية' : 'Qualité Premium', desc: language === 'ar' ? 'شواحن مختبرة ومضمونة' : 'Chargeurs testés et garantis' },
    { icon: <Truck className="w-7 h-7" />, color: '#7C3AED', title: language === 'ar' ? 'توصيل سريع' : 'Livraison Rapide', desc: language === 'ar' ? 'إلى جميع ولايات الجزائر' : 'Dans toute l\'Algérie' },
    { icon: <Shield className="w-7 h-7" />, color: '#FF6B35', title: language === 'ar' ? 'ضمان كامل' : 'Garantie Totale', desc: language === 'ar' ? 'خدمة ما بعد البيع مضمونة' : 'Service après-vente assuré' },
  ];

  const stats = [
    { value: 359, suffix: '+', label: language === 'ar' ? 'منتج' : 'Produits' },
    { value: 100, suffix: '%', label: language === 'ar' ? 'جودة' : 'Qualité' },
    { value: 58, suffix: '', label: language === 'ar' ? 'ولاية' : 'Wilayas' },
    { value: 24, suffix: '/7', label: language === 'ar' ? 'دعم' : 'Support' },
  ];

  return (
    <div style={{ background: '#020817', color: '#F1F5F9' }} className="min-h-screen">

      {/* Cart toast */}
      <AnimatePresence>
        {cartNotification && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -30, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
          >
            ✅ {cartNotification} {language === 'ar' ? 'أضيف للسلة' : 'ajouté au panier'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden px-4">
        <FloatingParticles />

        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,212,255,0.07) 0%, transparent 70%)' }} />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text side */}
          <div className={isRTL ? 'text-right' : ''}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <ElectricBadge color="cyan">
                {language === 'ar' ? 'الأفضل في الجزائر' : 'N°1 en Algérie'}
              </ElectricBadge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-grotesk font-black leading-tight mb-6"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#F1F5F9' }}
            >
              {language === 'ar' ? (
                <>
                  الشاحن{' '}
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }}>
                    الأفضل
                  </span>{' '}
                  لسيارتك
                </>
              ) : (
                <>
                  Le Chargeur{' '}
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }}>
                    Parfait
                  </span>{' '}
                  pour Votre Voiture
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg mb-10 leading-relaxed"
              style={{ color: '#64748B', maxWidth: '480px' }}
            >
              {settings?.slogan || websiteSettings?.slogan || 'Quality Chargers at Best Prices'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(0,212,255,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/website-shop/offers')}
                className="relative flex items-center gap-2 px-7 py-4 rounded-xl font-grotesk font-bold text-base overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #00D4FF, #0098BB)', color: '#020817', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
              >
                <motion.span
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <ShoppingCart className="w-5 h-5" />
                {language === 'ar' ? 'اكتشف البوتيك' : 'Découvrir la Boutique'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, borderColor: '#FF6B35', boxShadow: '0 0 20px rgba(255,107,53,0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/website-shop/special-offers')}
                className="flex items-center gap-2 px-7 py-4 rounded-xl font-grotesk font-bold text-base transition-all duration-200"
                style={{ background: 'rgba(255,107,53,0.08)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.3)' }}
              >
                <Flame className="w-5 h-5" />
                {language === 'ar' ? 'عروض خاصة' : 'Offres Spéciales'}
              </motion.button>
            </motion.div>
          </div>

          {/* Visual side — animated orb (CSS-based, no Three.js needed for hero since it's decorative) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center relative"
            style={{ height: '420px' }}
          >
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute w-80 h-80 rounded-full"
              style={{ border: '1px solid rgba(0,212,255,0.2)' }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="absolute w-64 h-64 rounded-full"
              style={{ border: '1px dashed rgba(124,58,237,0.3)' }}
            />
            {/* Center glow orb */}
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-44 h-44 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(0,212,255,0.25) 0%, rgba(124,58,237,0.15) 50%, transparent 70%)',
                boxShadow: '0 0 60px rgba(0,212,255,0.4), 0 0 120px rgba(0,212,255,0.15)',
              }}
            >
              <Zap className="w-16 h-16" style={{ color: '#00D4FF', filter: 'drop-shadow(0 0 10px #00D4FF)' }} />
            </motion.div>
            {/* Orbiting dots */}
            {[0, 120, 240].map((deg, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{ background: i === 0 ? '#00D4FF' : i === 1 ? '#7C3AED' : '#FF6B35' }}
                animate={{ rotate: [deg, deg + 360] }}
                transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'linear' }}
                transformTemplate={({ rotate }) => `rotate(${rotate}) translateX(140px) rotate(-${rotate})`}
              />
            ))}
          </motion.div>
        </div>

        {/* Hero background image support */}
        {imageUrl && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08 }}
          />
        )}

        {/* Upload UI */}
        <AnimatePresence>
          {showUploadUI && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(2,8,23,0.9)' }}
            >
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="rounded-2xl p-8 w-full max-w-md"
                style={{ background: '#0F172A', border: '1px solid rgba(0,212,255,0.2)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-grotesk font-bold text-xl" style={{ color: '#F1F5F9' }}>
                    {language === 'ar' ? 'رفع صورة' : 'Image Hero'}
                  </h2>
                  <button onClick={() => setShowUploadUI(false)} style={{ color: '#64748B' }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {uploadError && (
                  <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {uploadError}
                  </div>
                )}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4 rounded-xl p-8 text-center cursor-pointer transition-all"
                  style={{ border: '2px dashed rgba(0,212,255,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#00D4FF')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)')}
                >
                  <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: '#00D4FF' }} />
                  <p className="text-sm" style={{ color: '#64748B' }}>PNG, JPG up to 5MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={uploading || deleting} className="hidden" />
                {imageUrl && (
                  <div className="mb-4">
                    <img src={imageUrl} alt="Current" className="w-full h-24 object-cover rounded-lg mb-2" />
                    <button onClick={handleDeleteImage} disabled={deleting || uploading}
                      className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      {deleting ? <><Loader className="w-4 h-4 animate-spin" /> Suppression...</> : <><X className="w-4 h-4" /> {language === 'ar' ? 'حذف الصورة' : 'Supprimer'}</>}
                    </button>
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading || deleting}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #00D4FF, #0098BB)', color: '#020817' }}
                >
                  {uploading ? <><Loader className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> {language === 'ar' ? 'اختر صورة' : 'Choisir'}</>}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ===== STATS BAR ===== */}
      <section ref={statsReveal.ref} className="py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={statsReveal.isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s, i) => (
            <GlowCard key={i} className="p-6 text-center">
              <div className="font-grotesk font-black text-3xl mb-1" style={{ color: '#00D4FF' }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-sm font-medium" style={{ color: '#64748B' }}>{s.label}</div>
            </GlowCard>
          ))}
        </motion.div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      {!loading && allProducts.length > 0 && (
        <section ref={productsReveal.ref} className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={productsReveal.isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <h2 className="font-grotesk font-black text-3xl md:text-4xl mb-3">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }}>
                  ⚡ {language === 'ar' ? 'منتجات مميزة' : 'Produits Vedettes'}
                </span>
              </h2>
              <div className="w-16 h-1 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }} />
            </motion.div>

            {/* Brand filter */}
            {availableBrands.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={productsReveal.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-wrap gap-2 justify-center mb-8"
              >
                <button
                  onClick={() => handleBrandClick(null)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    background: selectedBrand === null ? 'rgba(0,212,255,0.15)' : 'rgba(30,58,95,0.4)',
                    color: selectedBrand === null ? '#00D4FF' : '#64748B',
                    border: `1px solid ${selectedBrand === null ? 'rgba(0,212,255,0.4)' : 'rgba(30,58,95,0.6)'}`,
                  }}
                >
                  {language === 'ar' ? '⭐ الكل' : '⭐ Tous'}
                </button>
                {availableBrands.map((brand, i) => {
                  const brandProduct = allProducts.find(p => p.product_mark === brand);
                  const logoUrl = (brandProduct as any)?.brand_logo || null;
                  return (
                    <motion.button
                      key={brand}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleBrandClick(brand)}
                      title={brand}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                      style={{
                        background: selectedBrand === brand ? 'rgba(0,212,255,0.15)' : 'rgba(30,58,95,0.4)',
                        color: selectedBrand === brand ? '#00D4FF' : '#64748B',
                        border: `1px solid ${selectedBrand === brand ? 'rgba(0,212,255,0.4)' : 'rgba(30,58,95,0.6)'}`,
                      }}
                    >
                      {logoUrl && <img src={logoUrl} alt={brand} className="w-4 h-4 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />}
                      🏷️ {brand}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* Products grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedBrand || 'all'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {products.length > 0 ? products.map((product) => (
                  <GlowCard key={product.id} className="flex flex-col h-full">
                    {/* Image */}
                    <div
                      className="relative h-52 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))' }}
                    >
                      {product.primary_image ? (
                        <motion.img
                          src={product.primary_image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.08 }}
                          transition={{ duration: 0.4 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Zap className="w-16 h-16" style={{ color: '#1E3A5F' }} />
                        </div>
                      )}
                      {/* Brand badge */}
                      {product.product_mark && (
                        <div className="absolute top-3 left-3">
                          <ElectricBadge color="cyan">{product.product_mark}</ElectricBadge>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-grotesk font-bold text-base mb-2 line-clamp-2" style={{ color: '#F1F5F9' }}>
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: '#64748B' }}>{product.description}</p>
                      )}

                      {/* Specs chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.voltage && (
                          <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                            ⚡ {product.voltage}V
                          </span>
                        )}
                        {product.amperage && (
                          <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: 'rgba(124,58,237,0.08)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.2)' }}>
                            🔌 {product.amperage}A
                          </span>
                        )}
                        {product.wattage && (
                          <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                            💡 {product.wattage}W
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mb-5 mt-auto">
                        <span className="font-grotesk font-black text-2xl" style={{ color: '#F59E0B' }}>
                          {product.selling_price.toLocaleString()} DZD
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleAddToCart(product)}
                          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all"
                          style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'سلة' : 'Panier'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={handleViewDetails}
                          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all"
                          style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.25)' }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'عرض' : 'Voir'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.04, boxShadow: '0 0 15px rgba(255,107,53,0.4)' }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleOrder(product)}
                          className="flex items-center justify-center py-2 rounded-lg text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #FF6B35, #EF4444)' }}
                        >
                          {language === 'ar' ? '📦 طلب' : '📦 Commander'}
                        </motion.button>
                      </div>
                    </div>
                  </GlowCard>
                )) : (
                  <div className="col-span-3 py-20 text-center rounded-2xl" style={{ border: '2px dashed rgba(0,212,255,0.15)', background: 'rgba(0,212,255,0.02)' }}>
                    <Zap className="w-16 h-16 mx-auto mb-4" style={{ color: '#1E3A5F' }} />
                    <p className="text-lg font-semibold mb-4" style={{ color: '#64748B' }}>
                      {language === 'ar' ? 'لا توجد منتجات' : 'Aucun produit trouvé'}
                    </p>
                    <button onClick={() => handleBrandClick(null)}
                      className="px-6 py-2 rounded-xl text-sm font-bold"
                      style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }}
                    >
                      {language === 'ar' ? 'عرض الكل' : 'Voir tous'}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* View all button */}
            <div className="text-center mt-10">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(0,212,255,0.3)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/website-shop/offers')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-grotesk font-bold text-base"
                style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}
              >
                {language === 'ar' ? 'عرض جميع المنتجات' : 'Voir Tous Les Chargeurs'}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </section>
      )}

      {/* ===== WHY US ===== */}
      <section ref={whyReveal.ref} className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={whyReveal.isInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-12"
          >
            <h2 className="font-grotesk font-black text-3xl md:text-4xl mb-3">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }}>
                {language === 'ar' ? 'لماذا تختارنا؟' : 'Pourquoi Nous Choisir?'}
              </span>
            </h2>
            <div className="w-16 h-1 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={whyReveal.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <GlowCard glowColor={i === 0 ? 'cyan' : i === 1 ? 'violet' : 'orange'} className="p-7 h-full">
                  {/* Top border accent */}
                  <div className="h-0.5 absolute top-0 left-0 right-0 rounded-t-2xl" style={{ background: card.color }} />
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: `rgba(${card.color === '#00D4FF' ? '0,212,255' : card.color === '#7C3AED' ? '124,58,237' : '255,107,53'},0.12)` }}>
                    <span style={{ color: card.color }}>{card.icon}</span>
                  </div>
                  <h3 className="font-grotesk font-bold text-lg mb-2" style={{ color: '#F1F5F9' }}>{card.title}</h3>
                  <p className="text-sm" style={{ color: '#64748B' }}>{card.desc}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section ref={testimonialsReveal.ref} className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={testimonialsReveal.isInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-12"
          >
            <Star className="w-10 h-10 mx-auto mb-4" style={{ color: '#F59E0B' }} />
            <h2 className="font-grotesk font-black text-3xl md:text-4xl mb-3">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #F59E0B, #FF6B35)' }}>
                {language === 'ar' ? 'آراء عملائنا' : 'Ce que Disent Nos Clients'}
              </span>
            </h2>
            <div className="w-16 h-1 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, #F59E0B, #FF6B35)' }} />
          </motion.div>

          {/* Share review button */}
          <div className="flex justify-center mb-10">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowTestimonialModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              + {language === 'ar' ? 'شارك رأيك' : 'Partagez votre avis'}
            </motion.button>
          </div>

          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {testimonials.slice(0, 6).map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={testimonialsReveal.isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    <GlowCard className="p-6 h-full flex flex-col">
                      {/* Stars */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(t.rating || 5)].map((_, s) => (
                          <Star key={s} className="w-4 h-4 fill-current" style={{ color: '#F59E0B' }} />
                        ))}
                      </div>
                      {/* Quote */}
                      <div className="text-4xl font-serif mb-2" style={{ color: 'rgba(0,212,255,0.15)' }}>"</div>
                      <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: '#94A3B8' }}>{t.opinion}</p>
                      {/* Author */}
                      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: '#F1F5F9' }}>{t.client_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-2xl">😊</span>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl" style={{ border: '2px dashed rgba(0,212,255,0.1)', background: 'rgba(0,212,255,0.01)' }}>
              <p className="text-lg mb-4" style={{ color: '#64748B' }}>
                {language === 'ar' ? 'لا توجد آراء بعد' : 'Aucun avis pour l\'instant'}
              </p>
              <button onClick={() => setShowTestimonialModal(true)}
                className="px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.25)' }}
              >
                {language === 'ar' ? 'أضف رأيك' : 'Ajouter votre avis'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonial modal */}
      <AnimatePresence>
        {showTestimonialModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTestimonialModal(false)}
              className="fixed inset-0 z-40" style={{ background: 'rgba(2,8,23,0.8)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-lg rounded-2xl p-8" style={{ background: '#0F172A', border: '1px solid rgba(0,212,255,0.2)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-grotesk font-bold text-xl" style={{ color: '#F1F5F9' }}>
                    {language === 'ar' ? 'شارك رأيك' : 'Partagez votre avis'}
                  </h3>
                  <button onClick={() => setShowTestimonialModal(false)} style={{ color: '#64748B' }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#94A3B8' }}>
                      {language === 'ar' ? 'اسمك' : 'Votre nom'}
                    </label>
                    <input
                      type="text" value={testimonialName} onChange={e => setTestimonialName(e.target.value)}
                      placeholder={language === 'ar' ? 'اسمك...' : 'Votre nom...'}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid rgba(0,212,255,0.15)' }}
                      onFocus={e => (e.target.style.borderColor = '#00D4FF')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.15)')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#94A3B8' }}>
                      {language === 'ar' ? 'التقييم' : 'Note'}
                    </label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(r => (
                        <button key={r} onClick={() => setTestimonialRating(r)} className="text-2xl transition-transform hover:scale-110">
                          <Star className={`w-6 h-6 ${r <= testimonialRating ? 'fill-current' : ''}`} style={{ color: r <= testimonialRating ? '#F59E0B' : '#1E3A5F' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#94A3B8' }}>
                      {language === 'ar' ? 'رأيك' : 'Votre avis'}
                    </label>
                    <textarea
                      value={testimonialOpinion} onChange={e => setTestimonialOpinion(e.target.value)}
                      placeholder={language === 'ar' ? 'تجربتك...' : 'Votre expérience...'}
                      rows={4} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                      style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid rgba(0,212,255,0.15)' }}
                      onFocus={e => (e.target.style.borderColor = '#00D4FF')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.15)')}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowTestimonialModal(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'rgba(30,41,59,0.8)', color: '#64748B', border: '1px solid rgba(30,58,95,0.6)' }}
                    >
                      {language === 'ar' ? 'إلغاء' : 'Annuler'}
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitTestimonial} disabled={submittingTestimonial}
                      className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{ background: 'linear-gradient(135deg, #00D4FF, #0098BB)', color: '#020817' }}
                    >
                      {submittingTestimonial ? (language === 'ar' ? 'إرسال...' : 'Envoi...') : (language === 'ar' ? 'إرسال' : 'Envoyer')}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))', border: '1px solid rgba(0,212,255,0.15)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
          <h2 className="font-grotesk font-black text-3xl mb-4 relative" style={{ color: '#F1F5F9' }}>
            {language === 'ar' ? 'جاهز للطلب؟' : 'Prêt à Commander?'}
          </h2>
          <p className="mb-8 relative" style={{ color: '#64748B' }}>
            {language === 'ar' ? 'توصيل سريع إلى جميع ولايات الجزائر' : 'Livraison rapide dans toute l\'Algérie'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,212,255,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/website-shop/offers')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-grotesk font-bold text-base relative"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #0098BB)', color: '#020817' }}
          >
            {language === 'ar' ? 'تصفح المتجر' : 'Parcourir la Boutique'}
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </section>
    </div>
  );
}
