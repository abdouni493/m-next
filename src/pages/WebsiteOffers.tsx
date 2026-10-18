import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getAllProductsREST, getProductImages, getMarks } from '@/lib/supabaseClient';
import { Search, Zap, ShoppingCart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import GlowCard from '@/components/website/GlowCard';
import ElectricBadge from '@/components/website/ElectricBadge';
import { imgSrc } from '@/lib/imageUtils';

interface Product {
  id: string;
  name: string;
  description?: string;
  primary_image?: string;
  product_mark?: string;
  voltage?: number;
  amperage?: number;
  wattage?: number;
  connection_type?: string;
  selling_price: number;
  is_active: boolean;
  quantity_on_hand?: number;
  brand_logo?: string;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  file_path: string;
  display_order: number;
  is_primary: boolean;
}

interface Mark {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
}

export default function WebsiteOffers() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [marks, setMarks] = useState<Mark[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const productsData = await getAllProductsREST();
        const visibleProducts = productsData.filter((p: any) => p.is_active);
        setProducts(visibleProducts);
        setFilteredProducts(visibleProducts);
        const marksData = await getMarks();
        setMarks(marksData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, selectedBrand);
  };

  const handleBrandFilter = (brand: string) => {
    const next = brand === selectedBrand ? '' : brand;
    setSelectedBrand(next);
    applyFilters(searchQuery, next);
  };

  const applyFilters = (query: string, brand: string) => {
    const filtered = products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.product_mark?.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase());
      const matchesBrand = !brand || product.product_mark?.toLowerCase() === brand.toLowerCase();
      return matchesSearch && matchesBrand;
    });
    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.product_id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        product_name: product.name,
        price: product.selling_price,
        quantity: 1,
        image: product.primary_image,
        product_image: product.primary_image,
        mark: product.product_mark,
        product_mark: product.product_mark,
        description: product.description,
        product_description: product.description,
        voltage: product.voltage,
        wattage: product.wattage,
        amperage: product.amperage,
        connection_type: product.connection_type,
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    setCartNotification(product.name);
    setTimeout(() => setCartNotification(null), 3000);
  };

  const handleOrder = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.find((item: any) => item.product_id === product.id)) handleAddToCart(product);
    navigate('/website-shop/order');
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetails(true);
    setCurrentImageIndex(0);
    loadProductImages(product.id);
  };

  const loadProductImages = async (productId: string) => {
    setImagesLoading(true);
    try {
      const images = await getProductImages(productId);
      setProductImages(images);
      setCurrentImageIndex(0);
    } catch {
      setProductImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  const goToPreviousImage = () => setCurrentImageIndex(p => (p === 0 ? productImages.length - 1 : p - 1));
  const goToNextImage = () => setCurrentImageIndex(p => (p === productImages.length - 1 ? 0 : p + 1));

  return (
    <div style={{ background: '#0A0918', color: '#F1F5F9', minHeight: '100vh' }} className={isRTL ? 'rtl' : 'ltr'}>

      {/* Page header banner */}
      <div className="relative py-16 px-4 overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.06) 0%, transparent 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-grotesk font-black text-4xl md:text-5xl mb-3">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #8B5CF6, #EC4899)' }}>
                🛍️ {language === 'ar' ? 'بوتيكنا' : 'Notre Boutique'}
              </span>
            </h1>
            <p className="text-base" style={{ color: '#64748B' }}>
              {language === 'ar' ? 'اكتشف جميع شواحننا عالية الجودة' : 'Découvrez tous nos chargeurs de haute qualité'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 space-y-8">

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative max-w-lg mx-auto">
          <Search className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 pointer-events-none" style={{ color: '#8B5CF6' }} />
          <input
            placeholder={language === 'ar' ? '🔍 ابحث عن شاحن...' : '🔍 Rechercher un chargeur...'}
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#13112A', color: '#F1F5F9', border: '1px solid rgba(139,92,246,0.2)' }}
            onFocus={e => (e.target.style.borderColor = '#8B5CF6')}
            onBlur={e => (e.target.style.borderColor = 'rgba(139,92,246,0.2)')}
          />
        </motion.div>

        {/* Brand filter */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-grotesk font-bold text-sm uppercase tracking-widest" style={{ color: '#8B5CF6' }}>
              {language === 'ar' ? '🏷️ تصفية بالماركة' : '🏷️ Filtrer par Marque'}
            </h3>
            {selectedBrand && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                ✅ {filteredProducts.length} {language === 'ar' ? 'منتج' : 'produits'}
              </motion.span>
            )}
          </div>

          <div
            className="flex flex-wrap gap-2 p-4 rounded-2xl"
            style={{ background: 'rgba(19,17,42,0.6)', border: '1px solid rgba(139,92,246,0.1)' }}
          >
            {/* All */}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { setSelectedBrand(''); applyFilters(searchQuery, ''); }}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: selectedBrand === '' ? 'rgba(139,92,246,0.15)' : 'rgba(30,58,95,0.4)',
                color: selectedBrand === '' ? '#8B5CF6' : '#64748B',
                border: `1px solid ${selectedBrand === '' ? 'rgba(139,92,246,0.4)' : 'rgba(30,58,95,0.6)'}`,
              }}
            >
              ⭐ {language === 'ar' ? 'الكل' : 'Tous'}
            </motion.button>

            {marks.map((mark, i) => (
              <motion.button
                key={mark.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => handleBrandFilter(mark.name)}
                title={mark.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all relative overflow-hidden"
                style={{
                  background: selectedBrand === mark.name ? 'rgba(139,92,246,0.15)' : 'rgba(30,58,95,0.4)',
                  color: selectedBrand === mark.name ? '#8B5CF6' : '#64748B',
                  border: `1px solid ${selectedBrand === mark.name ? 'rgba(139,92,246,0.4)' : 'rgba(30,58,95,0.6)'}`,
                }}
              >
                {mark.logo_url && (
                  <img src={mark.logo_url} alt={mark.name} className="w-4 h-4 object-contain rounded"
                    onError={e => (e.currentTarget.style.display = 'none')} />
                )}
                🏷️ {mark.name}
              </motion.button>
            ))}
          </div>
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
              style={{ border: '2px solid rgba(139,92,246,0.1)', borderTopColor: '#8B5CF6' }}
            />
          </div>
        ) : (
          <>
            {/* Products grid */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <GlowCard className="flex flex-col h-full cursor-pointer" onClick={() => handleViewDetails(product)}>
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(236,72,153,0.04))' }}
                    >
                      {product.primary_image ? (
                        <motion.img
                          src={imgSrc.card(product.primary_image)} alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy" decoding="async"
                          whileHover={{ scale: 1.08 }} transition={{ duration: 0.4 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Zap className="w-14 h-14" style={{ color: '#2E2A5A' }} />
                        </div>
                      )}
                      {product.product_mark && (
                        <div className="absolute top-3 left-3">
                          <ElectricBadge color="cyan">{product.product_mark}</ElectricBadge>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-grotesk font-bold text-base mb-2 line-clamp-2" style={{ color: '#F1F5F9' }}>
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: '#64748B' }}>{product.description}</p>
                      )}

                      {/* Specs chips */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {product.voltage && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                            ⚡ {product.voltage}V
                          </span>
                        )}
                        {product.amperage && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(236,72,153,0.08)', color: '#EC4899', border: '1px solid rgba(236,72,153,0.2)' }}>
                            🔌 {product.amperage}A
                          </span>
                        )}
                        {product.wattage && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                            💡 {product.wattage}W
                          </span>
                        )}
                        {product.connection_type && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            🔧 {product.connection_type}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="mb-4 mt-auto">
                        <span className="font-grotesk font-black text-2xl" style={{ color: '#F59E0B' }}>
                          {product.selling_price.toLocaleString()} DZD
                        </span>
                      </div>

                      {/* Buttons */}
                      <div className="grid grid-cols-3 gap-2" onClick={e => e.stopPropagation()}>
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => handleAddToCart(product)}
                          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'سلة' : 'Panier'}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => handleViewDetails(product)}
                          className="flex items-center justify-center py-2 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(236,72,153,0.1)', color: '#EC4899', border: '1px solid rgba(236,72,153,0.25)' }}
                        >
                          👁️ {language === 'ar' ? 'عرض' : 'Voir'}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 12px rgba(249,115,22,0.4)' }} whileTap={{ scale: 0.96 }}
                          onClick={() => handleOrder(product)}
                          className="flex items-center justify-center py-2 rounded-lg text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}
                        >
                          📦 {language === 'ar' ? 'طلب' : 'Cmd'}
                        </motion.button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </motion.div>

            {/* Empty state */}
            {filteredProducts.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-24 rounded-2xl"
                style={{ border: '2px dashed rgba(139,92,246,0.1)', background: 'rgba(139,92,246,0.01)' }}
              >
                <Zap className="w-16 h-16 mx-auto mb-4" style={{ color: '#2E2A5A' }} />
                <h3 className="font-grotesk font-bold text-xl mb-2" style={{ color: '#64748B' }}>
                  {language === 'ar' ? 'لا توجد منتجات' : 'Aucun produit trouvé'}
                </h3>
                <p className="text-sm mb-6" style={{ color: '#2E2A5A' }}>
                  {language === 'ar' ? 'جرب بحثاً آخر' : 'Essayez une autre recherche'}
                </p>
                <button onClick={() => { setSearchQuery(''); setSelectedBrand(''); setFilteredProducts(products); }}
                  className="px-6 py-3 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  {language === 'ar' ? 'إعادة تعيين' : 'Réinitialiser'}
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Product detail modal */}
      <AnimatePresence>
        {showDetails && selectedProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 z-40" style={{ background: 'rgba(10,9,24,0.85)', backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-4 sm:inset-8 z-50 rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#13112A', border: '1px solid rgba(139,92,246,0.2)', maxWidth: '900px', margin: 'auto' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                <h2 className="font-grotesk font-bold text-lg line-clamp-1 pr-4" style={{ color: '#F1F5F9' }}>
                  {selectedProduct.name}
                </h2>
                <button onClick={() => setShowDetails(false)}
                  className="p-2 rounded-lg flex-shrink-0 transition-all"
                  style={{ color: '#64748B' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F1F5F9')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image gallery */}
                  <div className="rounded-xl overflow-hidden flex flex-col gap-3" style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
                    <div className="h-64 flex items-center justify-center relative p-4">
                      {imagesLoading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                          className="w-10 h-10 rounded-full"
                          style={{ border: '2px solid rgba(139,92,246,0.1)', borderTopColor: '#8B5CF6' }}
                        />
                      ) : productImages.length > 0 ? (
                        <img src={imgSrc.detail(productImages[currentImageIndex].image_url)} alt={selectedProduct.name} className="max-w-full max-h-full object-contain rounded-lg" loading="lazy" decoding="async" />
                      ) : selectedProduct.primary_image ? (
                        <img src={imgSrc.detail(selectedProduct.primary_image)} alt={selectedProduct.name} className="max-w-full max-h-full object-contain rounded-lg" loading="lazy" decoding="async" />
                      ) : (
                        <Zap className="w-20 h-20" style={{ color: '#2E2A5A' }} />
                      )}
                    </div>
                    {productImages.length > 1 && (
                      <div className="flex items-center justify-between px-4 pb-4">
                        <button onClick={goToPreviousImage} className="p-2 rounded-lg transition-all" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-1">
                          {productImages.map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                              className="rounded-full transition-all"
                              style={{ width: idx === currentImageIndex ? '20px' : '8px', height: '8px', background: idx === currentImageIndex ? '#8B5CF6' : 'rgba(139,92,246,0.2)' }}
                            />
                          ))}
                        </div>
                        <button onClick={goToNextImage} className="p-2 rounded-lg transition-all" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {selectedProduct.product_mark && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', borderLeft: '3px solid #8B5CF6' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#64748B' }}>🏷️ {language === 'ar' ? 'الماركة' : 'Marque'}</p>
                        <p className="font-grotesk font-bold text-lg" style={{ color: '#8B5CF6' }}>{selectedProduct.product_mark}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>
                        ⚡ {language === 'ar' ? 'المواصفات' : 'Spécifications'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Voltage', value: selectedProduct.voltage ? `${selectedProduct.voltage}V` : 'N/A', color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)' },
                          { label: 'Ampérage', value: selectedProduct.amperage ? `${selectedProduct.amperage}A` : 'N/A', color: '#EC4899', bg: 'rgba(236,72,153,0.06)' },
                          { label: 'Puissance', value: selectedProduct.wattage ? `${selectedProduct.wattage}W` : 'N/A', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
                          { label: 'Connexion', value: selectedProduct.connection_type || 'N/A', color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
                        ].map(spec => (
                          <div key={spec.label} className="p-3 rounded-xl" style={{ background: spec.bg, border: `1px solid ${spec.color}22` }}>
                            <p className="text-xs mb-1" style={{ color: '#64748B' }}>{spec.label}</p>
                            <p className="font-grotesk font-bold text-lg" style={{ color: spec.color }}>{spec.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedProduct.description && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(30,58,95,0.6)' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: '#64748B' }}>📝 Description</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#94A3B8' }}>{selectedProduct.description}</p>
                      </div>
                    )}

                    <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <span className="font-grotesk font-black text-3xl" style={{ color: '#F59E0B' }}>
                        {selectedProduct.selling_price.toLocaleString()} DZD
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => { handleAddToCart(selectedProduct); setShowDetails(false); }}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                        style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {language === 'ar' ? 'أضف للسلة' : 'Ajouter au Panier'}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(249,115,22,0.4)' }} whileTap={{ scale: 0.98 }}
                        onClick={() => handleOrder(selectedProduct)}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                        style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}
                      >
                        🚀 {language === 'ar' ? 'اطلب الآن' : 'Commander'}
                      </motion.button>
                    </div>
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
