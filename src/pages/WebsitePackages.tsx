import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getVisiblePackagesREST, getPackageDetails } from '@/lib/supabaseClient';
import { Search, ShoppingCart, Eye, Package as PackageIcon, ChevronDown, MessageCircle } from 'lucide-react';

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
    title: '📦 Our Exclusive Packages',
    subtitle: 'Get More, Save More - Curated Product Bundles',
    search: 'Search packages...',
    no_packages: 'No packages found',
    view_details: 'View Package Details',
    add_to_cart: 'Add to Cart',
    contact: 'Contact via WhatsApp',
    price: 'Price',
    discount: 'Discount',
    items: 'Items in Package',
    product_specs: 'Product Specifications',
    voltage: 'Voltage',
    amperage: 'Amperage',
    wattage: 'Wattage',
  },
  fr: {
    title: '📦 Nos Paquets Exclusifs',
    subtitle: 'Acheter Plus, Économiser Plus - Bundles de Produits Sélectionnés',
    search: 'Rechercher des paquets...',
    no_packages: 'Aucun paquet trouvé',
    view_details: 'Voir les Détails du Paquet',
    add_to_cart: 'Ajouter au Panier',
    contact: 'Contacter via WhatsApp',
    price: 'Prix',
    discount: 'Remise',
    items: 'Articles dans le Paquet',
    product_specs: 'Spécifications du Produit',
    voltage: 'Voltage',
    amperage: 'Ampérage',
    wattage: 'Puissance',
  },
  ar: {
    title: '📦 حزمنا الحصرية',
    subtitle: 'اشتر أكثر، وفر أكثر - حزم المنتجات المختارة',
    search: 'ابحث عن الحزم...',
    no_packages: 'لم يتم العثور على حزم',
    view_details: 'عرض تفاصيل الحزمة',
    add_to_cart: 'أضف إلى السلة',
    contact: 'تواصل عبر WhatsApp',
    price: 'السعر',
    discount: 'الخصم',
    items: 'العناصر في الحزمة',
    product_specs: 'مواصفات المنتج',
    voltage: 'الجهد',
    amperage: 'التيار',
    wattage: 'القوة',
  },
};

export default function WebsitePackages() {
  const { language, isRTL } = useLanguage() as any;
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const t = translations[language as keyof typeof translations] || translations.en;

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
    // Store package in cart
    const cart = JSON.parse(localStorage.getItem('cart') || '{"packages":[]}');
    cart.packages = cart.packages || [];
    cart.packages.push({
      id: pkg.id,
      name: pkg.name,
      price: pkg.package_price,
      quantity: 1,
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    // Navigate to checkout or cart page
    navigate('/website-shop/checkout');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">{t.subtitle}</p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 text-base rounded-2xl border-2 border-emerald-300 focus:border-emerald-500"
            />
          </div>
        </motion.div>

        {/* Packages Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="h-12 w-12 border-4 border-emerald-300 border-t-emerald-600 rounded-full"
            />
          </div>
        ) : filteredPackages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-emerald-300 dark:border-emerald-700"
          >
            <PackageIcon className="h-20 w-20 mx-auto mb-4 text-emerald-400" />
            <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-2">{t.no_packages}</h3>
            <p className="text-slate-500 dark:text-slate-500">
              {language === 'ar' ? 'عد قريبا للحصول على حزم جديدة' : language === 'fr' ? 'Revenez bientôt pour de nouveaux paquets' : 'Come back soon for new packages'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-slate-200 dark:border-slate-700"
              >
                {/* Image */}
                {pkg.image_url ? (
                  <div className="h-48 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
                    <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900 dark:to-cyan-900 flex items-center justify-center">
                    <PackageIcon className="h-20 w-20 text-emerald-400 opacity-50" />
                  </div>
                )}

                {/* Discount Badge */}
                {pkg.discount_percentage && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg"
                  >
                    -{Math.round(pkg.discount_percentage)}%
                  </motion.div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">{pkg.name}</h3>

                  {/* Product Count Badge */}
                  <Badge className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 text-sm">
                    📦 {pkg.total_products || 0} {t.items}
                  </Badge>

                  {/* Description */}
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">{pkg.description}</p>

                  {/* Product List Preview */}
                  {pkg.product_names && (
                    <div className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-semibold mb-1">📋 {language === 'ar' ? 'يتضمن:' : language === 'fr' ? 'Inclut:' : 'Includes:'}</p>
                      <p className="line-clamp-2">{pkg.product_names}</p>
                    </div>
                  )}

                  {/* Price Section */}
                  <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900 dark:to-cyan-900 p-4 rounded-xl mb-6">
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-300">
                      💰 {pkg.package_price} DZD
                    </p>
                    {pkg.discount_percentage && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">
                        💚 Save {Math.round(pkg.discount_percentage)}%
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleViewDetails(pkg)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="h-5 w-5" />
                      {t.view_details}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToCart(pkg)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {t.add_to_cart}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Package Details Dialog */}
        {selectedPackage && (
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-3xl bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-600 rounded-3xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-3xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <PackageIcon className="h-8 w-8" />
                  {selectedPackage.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-6">
                {/* Image */}
                {selectedPackage.image_url && (
                  <img src={selectedPackage.image_url} alt={selectedPackage.name} className="w-full h-64 object-cover rounded-2xl" />
                )}

                {/* Description */}
                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Description</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-lg">{selectedPackage.description}</p>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900 dark:to-cyan-900 p-6 rounded-2xl">
                  <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-300 mb-2">
                    💰 {selectedPackage.package_price} DZD
                  </p>
                  {selectedPackage.discount_percentage && (
                    <p className="text-lg text-emerald-700 dark:text-emerald-200">
                      💚 Save {Math.round(selectedPackage.discount_percentage)}%
                    </p>
                  )}
                </div>

                {/* Items in Package */}
                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <PackageIcon className="h-6 w-6" />
                    {t.items} ({packageItems.length})
                  </h4>

                  {loadingItems ? (
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="h-8 w-8 border-4 border-emerald-300 border-t-emerald-600 rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {packageItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-650 rounded-xl border-2 border-slate-300 dark:border-slate-600"
                        >
                          <div className="flex gap-4 items-start">
                            {item.product_image && (
                              <img src={item.product_image} alt={item.product_name} className="h-24 w-24 object-cover rounded-lg" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-bold text-slate-800 dark:text-white text-lg">{item.product_name}</h5>
                                  {item.product_mark && (
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">{item.product_mark}</p>
                                  )}
                                </div>
                                <div className="bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-600 dark:to-green-700 rounded-lg px-3 py-2 ml-2">
                                  <div className="text-center">
                                    <p className="text-xs text-white font-semibold uppercase tracking-wide">Qty</p>
                                    <p className="text-2xl font-bold text-white">{item.quantity || 1}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Specifications */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.product_voltage && (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs">
                                    ⚡ {item.product_voltage}V
                                  </Badge>
                                )}
                                {item.product_amperage && (
                                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 text-xs">
                                    🔌 {item.product_amperage}A
                                  </Badge>
                                )}
                                {item.product_wattage && (
                                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 text-xs">
                                    ⚙️ {item.product_wattage}W
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                >
                  {language === 'ar' ? 'إغلاق' : language === 'fr' ? 'Fermer' : 'Close'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    handleAddToCart(selectedPackage);
                    setShowDetails(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {t.add_to_cart}
                </motion.button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
