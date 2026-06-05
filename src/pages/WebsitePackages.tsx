import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getVisiblePackagesREST, getPackageDetails } from '@/lib/supabaseClient';
import { Search, ShoppingCart, Eye, Package as PackageIcon, X } from 'lucide-react';
import GlowCard from '@/components/website/GlowCard';
import ElectricBadge from '@/components/website/ElectricBadge';

interface Package {
  id: string;
  name: string;
  description: string;
  package_price: number;
  image_url?: string;
  discount_percentage?: number;
  total_products?: number;
  product_names?: string;
}

interface PackageItem {
  id: string;
  package_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_mark?: string;
  quantity: number;
  product_voltage?: string;
  product_amperage?: string;
  product_wattage?: string;
  custom_price?: number;
}

const translations = {
  en: {
    title: 'Our Exclusive Packages',
    subtitle: 'Get More, Save More — Curated Product Bundles',
    search: 'Search packages...',
    no_packages: 'No packages found',
    view_details: 'Details',
    add_to_cart: 'Commander ce Pack',
    price: 'Price',
    discount: 'Discount',
    items: 'Items',
    voltage: 'Voltage',
    amperage: 'Amperage',
    wattage: 'Wattage',
  },
  fr: {
    title: 'Nos Paquets Exclusifs',
    subtitle: 'Achetez Plus, Économisez Plus — Bundles Sélectionnés',
    search: 'Rechercher un paquet...',
    no_packages: 'Aucun paquet trouvé',
    view_details: 'Détails',
    add_to_cart: 'Commander ce Pack',
    price: 'Prix',
    discount: 'Remise',
    items: 'Articles',
    voltage: 'Voltage',
    amperage: 'Ampérage',
    wattage: 'Puissance',
  },
  ar: {
    title: 'حزمنا الحصرية',
    subtitle: 'اشتر أكثر، وفر أكثر — حزم منتجات مختارة',
    search: 'ابحث عن حزمة...',
    no_packages: 'لا توجد حزم',
    view_details: 'التفاصيل',
    add_to_cart: 'اطلب هذه الحزمة',
    price: 'السعر',
    discount: 'الخصم',
    items: 'منتجات',
    voltage: 'الجهد',
    amperage: 'التيار',
    wattage: 'القوة',
  },
};

export default function WebsitePackages() {
  const { language, isRTL } = useLanguage() as any;
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const t = translations[language as keyof typeof translations] || translations.fr;

  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const data = await getVisiblePackagesREST();
        setPackages(data);
        setFilteredPackages(data);
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    const results = packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.product_names?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPackages(results);
  }, [searchQuery, packages]);

  const handleViewDetails = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowDetails(true);
    setLoadingItems(true);
    try {
      const items = await getPackageDetails(pkg.id);
      setPackageItems(items);
    } catch (error) {
      console.error('Error fetching package items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleAddToCart = (pkg: Package) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{"packages":[]}');
    cart.packages = cart.packages || [];
    cart.packages.push({ id: pkg.id, name: pkg.name, price: pkg.package_price, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/website-shop/checkout');
  };

  return (
    <div style={{ background: '#020817', color: '#F1F5F9', minHeight: '100vh' }} className={isRTL ? 'rtl' : 'ltr'}>

      {/* Emerald-themed page header */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(16,185,129,0.1) 0%, transparent 60%)' }} />

        {/* Animated floating dots (emerald) */}
        {[...Array(5)].map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full pointer-events-none"
            style={{ width: `${3 + i * 2}px`, height: `${3 + i * 2}px`, left: `${12 + i * 18}%`, top: '60%', background: i % 2 === 0 ? '#10B981' : '#34D399', filter: 'blur(1px)' }}
            animate={{ y: [0, -40, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
          />
        ))}

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-bold"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}
              animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 16px rgba(16,185,129,0.3)', '0 0 0px rgba(16,185,129,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <PackageIcon className="w-4 h-4" />
              {language === 'ar' ? 'حزم حصرية' : 'Packs Exclusifs'}
            </motion.div>

            <h1 className="font-grotesk font-black text-4xl md:text-5xl mb-3">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #10B981, #34D399, #00D4FF)' }}>
                📦 {t.title}
              </span>
            </h1>
            <p className="text-base" style={{ color: '#64748B' }}>{t.subtitle}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 space-y-8">

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative max-w-lg mx-auto">
          <Search className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 pointer-events-none" style={{ color: '#10B981' }} />
          <input
            placeholder={t.search}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#0F172A', color: '#F1F5F9', border: '1px solid rgba(16,185,129,0.2)' }}
            onFocus={e => (e.target.style.borderColor = '#10B981')}
            onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
          />
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full"
              style={{ border: '2px solid rgba(16,185,129,0.1)', borderTopColor: '#10B981' }}
            />
          </div>
        ) : filteredPackages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 rounded-2xl"
            style={{ border: '2px dashed rgba(16,185,129,0.1)', background: 'rgba(16,185,129,0.01)' }}
          >
            <PackageIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(16,185,129,0.2)' }} />
            <h3 className="font-grotesk font-bold text-xl mb-2" style={{ color: '#64748B' }}>{t.no_packages}</h3>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg, i) => (
              <motion.div key={pkg.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <GlowCard glowColor="emerald" className="flex flex-col h-full relative">

                  {/* Image */}
                  <div className="relative h-52 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(0,212,255,0.05))' }}>
                    {pkg.image_url ? (
                      <motion.img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover"
                        whileHover={{ scale: 1.08 }} transition={{ duration: 0.4 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PackageIcon className="w-16 h-16" style={{ color: 'rgba(16,185,129,0.25)' }} />
                      </div>
                    )}
                    {/* Discount badge */}
                    {pkg.discount_percentage && (
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-black text-white"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      >
                        -{Math.round(pkg.discount_percentage)}%
                      </motion.div>
                    )}
                    {/* Items count */}
                    {pkg.total_products && (
                      <div className="absolute bottom-3 left-3">
                        <ElectricBadge color="emerald">📦 {pkg.total_products} {t.items}</ElectricBadge>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-grotesk font-bold text-lg mb-2 line-clamp-2" style={{ color: '#F1F5F9' }}>{pkg.name}</h3>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: '#64748B' }}>{pkg.description}</p>

                    {/* Product names preview */}
                    {pkg.product_names && (
                      <div className="mb-3 p-3 rounded-xl text-xs" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <span className="font-semibold" style={{ color: '#10B981' }}>
                          {language === 'ar' ? 'يتضمن: ' : 'Inclut: '}
                        </span>
                        <span style={{ color: '#94A3B8' }} className="line-clamp-2">{pkg.product_names}</span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="mt-auto mb-4 p-3 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <span className="font-grotesk font-black text-2xl" style={{ color: '#10B981' }}>
                        💰 {pkg.package_price.toLocaleString()} DZD
                      </span>
                      {pkg.discount_percentage && (
                        <p className="text-xs mt-1" style={{ color: '#34D399' }}>💚 -{Math.round(pkg.discount_percentage)}% de remise</p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => handleViewDetails(pkg)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        <Eye className="w-4 h-4" />
                        {t.view_details}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 16px rgba(16,185,129,0.45)' }} whileTap={{ scale: 0.96 }}
                        onClick={() => handleAddToCart(pkg)}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {t.add_to_cart}
                      </motion.button>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetails && selectedPackage && (
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
              style={{ background: '#0F172A', border: '1px solid rgba(16,185,129,0.3)', maxWidth: '900px', margin: 'auto' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-center gap-3">
                  <PackageIcon className="w-5 h-5 flex-shrink-0" style={{ color: '#10B981' }} />
                  <h2 className="font-grotesk font-bold text-lg line-clamp-1" style={{ color: '#F1F5F9' }}>{selectedPackage.name}</h2>
                </div>
                <button onClick={() => setShowDetails(false)} style={{ color: '#64748B' }}><X className="w-5 h-5" /></button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {selectedPackage.image_url && (
                  <div className="h-56 rounded-xl overflow-hidden">
                    <img src={selectedPackage.image_url} alt={selectedPackage.name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{selectedPackage.description}</p>
                </div>

                <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span className="font-grotesk font-black text-3xl" style={{ color: '#10B981' }}>
                    💰 {selectedPackage.package_price.toLocaleString()} DZD
                  </span>
                  {selectedPackage.discount_percentage && (
                    <p className="text-sm mt-1" style={{ color: '#34D399' }}>💚 -{Math.round(selectedPackage.discount_percentage)}%</p>
                  )}
                </div>

                {/* Package items */}
                <div>
                  <h3 className="font-grotesk font-bold text-base mb-3 flex items-center gap-2" style={{ color: '#10B981' }}>
                    <PackageIcon className="w-4 h-4" />
                    {t.items} ({packageItems.length})
                  </h3>

                  {loadingItems ? (
                    <div className="flex justify-center py-6">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 rounded-full"
                        style={{ border: '2px solid rgba(16,185,129,0.1)', borderTopColor: '#10B981' }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {packageItems.map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                          className="flex gap-4 items-center p-4 rounded-xl"
                          style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(16,185,129,0.1)' }}
                        >
                          {item.product_image && (
                            <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate" style={{ color: '#F1F5F9' }}>{item.product_name}</p>
                            {item.product_mark && <p className="text-xs mb-1" style={{ color: '#64748B' }}>{item.product_mark}</p>}
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.product_voltage && <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.15)' }}>⚡ {item.product_voltage}V</span>}
                              {item.product_amperage && <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(124,58,237,0.08)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.15)' }}>🔌 {item.product_amperage}A</span>}
                              {item.product_wattage && <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.15)' }}>💡 {item.product_wattage}W</span>}
                            </div>
                          </div>
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center"
                            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <span className="text-xs" style={{ color: '#64748B' }}>x</span>
                            <span className="font-grotesk font-bold text-sm" style={{ color: '#10B981' }}>{item.quantity || 1}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDetails(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: 'rgba(30,58,95,0.5)', color: '#94A3B8', border: '1px solid rgba(30,58,95,0.8)' }}
                >
                  {language === 'ar' ? 'إغلاق' : 'Fermer'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(16,185,129,0.4)' }} whileTap={{ scale: 0.98 }}
                  onClick={() => { handleAddToCart(selectedPackage); setShowDetails(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t.add_to_cart}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
