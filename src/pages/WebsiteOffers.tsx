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
import { getAllProductsREST } from '@/lib/supabaseClient';
import { Search, Zap, ShoppingCart } from 'lucide-react';

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

export default function WebsiteOffers() {
  const { language, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getAllProductsREST();
        const visibleProducts = data.filter((p: any) => p.is_active);
        setProducts(visibleProducts);
        setFilteredProducts(visibleProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, selectedBrand);
  };

  const handleBrandFilter = (brand: string) => {
    setSelectedBrand(brand === selectedBrand ? '' : brand);
    applyFilters(searchQuery, brand === selectedBrand ? '' : brand);
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

  const getAllBrands = () => {
    const brands = [...new Set(products
      .map(p => p.product_mark)
      .filter(Boolean)
    )].sort() as string[];
    return brands;
  };

  const handleAddToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.product_id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
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
    const existingItem = cart.find((item: any) => item.product_id === product.id);
    if (!existingItem) {
      handleAddToCart(product);
    }
    navigate(`/website-shop/order`);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
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
          {language === 'ar' ? '🛍️ متجرنا' : '🛍️ Notre Boutique'}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {language === 'ar' ? 'اكتشف جميع شواحننا عالية الجودة' : 'Découvrez tous nos chargeurs de haute qualité'}
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

      {/* Brand Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <span className="text-2xl">🏷️</span>
            {language === 'ar' ? 'تصفية حسب الماركة' : 'Filtrer par Marque'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {language === 'ar' ? 'اختر من جميع الماركات المتاحة' : 'Sélectionnez parmi toutes les marques disponibles'}
          </p>
        </div>

        {/* Brand Pills */}
        <div className="flex flex-wrap gap-3 justify-center px-4">
          {/* Reset Filter Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setSelectedBrand('');
              applyFilters(searchQuery, '');
            }}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
              selectedBrand === ''
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {language === 'ar' ? '✨ الكل' : '✨ Tous'}
          </motion.button>

          {/* Individual Brand Buttons */}
          {getAllBrands().map((brand) => (
            <motion.button
              key={brand}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleBrandFilter(brand)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                selectedBrand === brand
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {brand}
            </motion.button>
          ))}
        </div>

        {/* Active Filter Display */}
        {selectedBrand && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm py-2 px-4">
              🏷️ {language === 'ar' ? 'منتجات' : 'Produits'} {selectedBrand}: {filteredProducts.length} {language === 'ar' ? 'عنصر' : 'produit'}
            </Badge>
          </motion.div>
        )}
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
          {/* Products Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover="hover"
                className="group relative cursor-pointer"
                onClick={() => handleViewDetails(product)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-300" />
                
                <div className="relative bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-2xl overflow-hidden h-full flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300">
                  {/* Product Image */}
                  <div className="relative h-72 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center overflow-hidden w-full">
                    {product.primary_image ? (
                      <motion.img
                        src={product.primary_image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.12 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Zap className="h-20 w-20 text-slate-300" />
                      </motion.div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Brand */}
                    <Badge variant="outline" className="w-fit mb-3 text-xs font-bold border-blue-300 bg-blue-50 dark:bg-blue-900/30">
                      🏷️ {product.product_mark || 'Charger'}
                    </Badge>

                    {/* Product Name */}
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2">
                        📝 {product.description}
                      </p>
                    )}

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 text-center border border-blue-200 dark:border-blue-700">
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚡ V</div>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{product.voltage ? `${product.voltage}` : 'N/A'}</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-2 text-center border border-yellow-200 dark:border-yellow-700">
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔌 W</div>
                        <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{product.wattage ? `${product.wattage}` : 'N/A'}</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2 text-center border border-purple-200 dark:border-purple-700">
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚙️ A</div>
                        <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{product.amperage ? `${product.amperage}` : 'N/A'}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2 text-center border border-green-200 dark:border-green-700">
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔧 T</div>
                        <div className="text-sm font-bold text-green-600 dark:text-green-400 truncate">{product.connection_type || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-3 mb-3 border-2 border-green-200 dark:border-green-700">
                      <div className="flex items-baseline gap-2 justify-center">
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {product.selling_price.toFixed(2)}
                        </span>
                        <span className="text-base text-slate-600 dark:text-slate-400 font-semibold">
                          DZD
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto pt-3 min-h-12">
                      <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg py-2 px-3 text-sm transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                        >
                          🛒 Panier
                        </Button>
                      </motion.div>
                      <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                        <Button
                          onClick={() => handleViewDetails(product)}
                          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg py-2 px-3 text-sm transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                          variant="default"
                        >
                          👁️ Voir
                        </Button>
                      </motion.div>
                      <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                        <Button
                          onClick={() => handleOrder(product)}
                          className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg py-2 px-3 text-sm transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                        >
                          🚀 Cmd
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Zap className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-2">
                {language === 'ar' ? 'لا توجد منتجات' : 'Aucun produit trouvé'}
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
              {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
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
                {selectedProduct.primary_image ? (
                  <img
                    src={selectedProduct.primary_image}
                    alt={selectedProduct.name}
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
                {/* Brand */}
                {selectedProduct.product_mark && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border-l-4 border-blue-500"
                  >
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                      🏷️ Marque
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedProduct.product_mark}
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
                    ⚡ Spécifications Électriques
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50 rounded-lg p-3 border-2 border-blue-200 dark:border-blue-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">⚡ Voltage</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedProduct.voltage ? `${selectedProduct.voltage}V` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/50 rounded-lg p-3 border-2 border-purple-200 dark:border-purple-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">⚙️ Ampérage</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedProduct.amperage ? `${selectedProduct.amperage}A` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-900/50 rounded-lg p-3 border-2 border-yellow-200 dark:border-yellow-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">🔌 Puissance</div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{selectedProduct.wattage ? `${selectedProduct.wattage}W` : 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 rounded-lg p-3 border-2 border-green-200 dark:border-green-700">
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">🔧 Connexion</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedProduct.connection_type || 'N/A'}</div>
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
                    📝 Description
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                    {selectedProduct.description || 'Aucune description disponible'}
                  </p>
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
                      Prix
                    </p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                        {selectedProduct.selling_price.toFixed(2)}
                      </span>
                      <span className="text-xl text-slate-600 dark:text-slate-400 font-bold">
                        DZD
                      </span>
                    </div>
                  </div>
                </motion.div>
                <div className="flex gap-3 pt-4">
                  <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={() => handleAddToCart(selectedProduct)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      🛒 Ajouter au Panier
                    </Button>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                    <Button
                      onClick={() => handleOrder(selectedProduct)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      🚀 Acheter Maintenant
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
