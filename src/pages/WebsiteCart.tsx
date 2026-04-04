import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { createOrderREST } from '@/lib/supabaseClient';
import { ArrowLeft, Trash2, ShoppingCart, Check, MapPin, User, Package } from 'lucide-react';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  from_offer: boolean;
  product_mark?: string;
  product_description?: string;
  voltage?: string;
  wattage?: string;
  amperage?: string;
  connection_type?: string;
}

// List of Algerian Wilayas
const ALGERIAN_WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tiaret', 'Tizi Ouzou', 'Algiers', 'Djelfa',
  'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine',
  'Médéa', 'Mostaghanem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi',
  'Bordj Bou Arréridj', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras',
  'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Beni Saf'
];

export default function WebsiteCart() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_wilaya: '',
    client_address: '',
    delivery_type: 'domicile'
  });

  // Load cart from localStorage
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  }, []);

  // Remove item from cart
  const handleRemoveItem = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.product_id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // Update quantity
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    const updatedCart = cartItems.map(item =>
      item.product_id === productId ? { ...item, quantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Calculate totals
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.length;
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handle form change
  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    // Clear cart from localStorage
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));
    // Reset form
    setOrderPlaced(false);
    setOrderDetails(null);
    setCartItems([]);
    // Navigate to shop
    navigate('/website-shop');
  };

  // Handle checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert(language === 'ar' ? 'السلة فارغة' : 'Votre panier est vide');
      return;
    }

    if (!formData.client_name || !formData.client_phone || !formData.client_wilaya || !formData.client_address) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Create single order for all items together
      const orderData = {
        customer_name: formData.client_name,
        customer_phone: formData.client_phone,
        customer_wilaya: formData.client_wilaya,
        customer_address: formData.client_address,
        delivery_type: formData.delivery_type,
        status: 'pending',
        total_price: total
      };

      // Create the order using REST API with cart items
      const order = await createOrderREST(orderData, cartItems);

      // Store order details for display
      setOrderDetails({
        id: order.id,
        order_number: order.id.substring(0, 8).toUpperCase(),
        customer_name: formData.client_name,
        customer_phone: formData.client_phone,
        customer_wilaya: formData.client_wilaya,
        customer_address: formData.client_address,
        delivery_type: formData.delivery_type,
        items: cartItems,
        total_price: total,
        created_at: new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR')
      });

      setOrderPlaced(true);
    } catch (error) {
      console.error('Error placing order:', error);
      alert(language === 'ar' ? 'حدث خطأ في الطلب' : 'Une erreur est survenue lors du placement de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced && orderDetails) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Success Header */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-green-600">
              {language === 'ar' ? '✅ تم الطلب بنجاح!' : '✅ Commande réussie!'}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {language === 'ar' ? 'شكراً لك على طلبك. سنتواصل معك قريباً!' : 'Merci pour votre commande. Nous vous contacterons bientôt!'}
            </p>
          </motion.div>

          {/* Order Number */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-green-200 dark:border-green-700 p-6 shadow-lg text-center"
          >
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {language === 'ar' ? 'رقم الطلب' : 'Numéro de Commande'}
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono">
              #{orderDetails.order_number}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {orderDetails.created_at}
            </p>
          </motion.div>

          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-blue-700 p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              {language === 'ar' ? '👤 بيانات العميل' : '👤 Données Client'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  {language === 'ar' ? '👤 الاسم' : '👤 Nom'}
                </p>
                <p className="font-bold text-slate-900 dark:text-white">{orderDetails.customer_name}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  {language === 'ar' ? '📱 الهاتف' : '📱 Téléphone'}
                </p>
                <p className="font-bold text-slate-900 dark:text-white">{orderDetails.customer_phone}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  {language === 'ar' ? '🗺️ الولاية' : '🗺️ Wilaya'}
                </p>
                <p className="font-bold text-slate-900 dark:text-white">{orderDetails.customer_wilaya}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  {language === 'ar' ? '🚚 نوع التسليم' : '🚚 Livraison'}
                </p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {orderDetails.delivery_type === 'bureau' 
                    ? (language === 'ar' ? '🏢 مكتب' : '🏢 Bureau')
                    : (language === 'ar' ? '🏠 منزل' : '🏠 Domicile')
                  }
                </p>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700 mt-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                {language === 'ar' ? '📍 العنوان' : '📍 Adresse'}
              </p>
              <p className="font-bold text-slate-900 dark:text-white">{orderDetails.customer_address}</p>
            </div>
          </motion.div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-blue-700 p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              {language === 'ar' ? '📦 المنتجات المطلوبة' : '📦 Produits Commandés'}
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {orderDetails.items.map((item: CartItem, index: number) => (
                <div key={`${item.product_id}-${index}`} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.name}</h3>
                      <div className="flex gap-3 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {language === 'ar' ? 'الكمية:' : 'Quantité:'} <span className="font-bold text-blue-600">{item.quantity}</span>
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {language === 'ar' ? 'السعر:' : 'Prix:'} <span className="font-bold text-green-600">{(item.price || 0).toFixed(2)} DZD</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {language === 'ar' ? 'المجموع' : 'Total'}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {(item.price * item.quantity).toFixed(2)} DZD
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-green-400">
                <span className="font-semibold">{language === 'ar' ? 'عدد المنتجات:' : 'Nombre articles:'}</span>
                <Badge className="bg-white text-green-600 font-bold">{orderDetails.items.length}</Badge>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-green-400">
                <span className="font-semibold">{language === 'ar' ? 'الكمية الإجمالية:' : 'Quantité totale:'}</span>
                <Badge className="bg-white text-green-600 font-bold">
                  {orderDetails.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)}
                </Badge>
              </div>
              <div className="flex justify-between items-baseline gap-4 pt-2">
                <span className="text-lg font-bold">{language === 'ar' ? 'المجموع النهائي:' : 'Total Final:'}</span>
                <div className="text-right">
                  <div className="text-3xl font-bold">{orderDetails.total_price.toFixed(2)}</div>
                  <div className="text-sm font-semibold">DZD</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Continue Shopping Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinueShopping}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {language === 'ar' ? '🛒 استمرار التسوق' : '🛒 Continuer les Achats'}
            </motion.button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
              {language === 'ar' ? '🔒 سيتم مسح السلة عند الضغط على الزر' : '🔒 Le panier sera vidé en cliquant'}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header - Fixed/Sticky on Mobile */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-blue-200 dark:border-blue-700 shadow-md"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/website-shop')}
            className="hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg h-10 w-10 p-0 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              {language === 'ar' ? '🛒 السلة' : '🛒 Mon Panier'}
            </h1>
          </div>
          {itemCount > 0 && (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm px-3 py-1 flex-shrink-0">
              {itemCount}
            </Badge>
          )}
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-8">

        {cartItems.length === 0 ? (
          // Empty Cart State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 md:py-20 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl border-2 border-dashed border-blue-300 dark:border-blue-700 shadow-lg mx-auto max-w-2xl"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShoppingCart className="w-20 h-20 md:w-24 md:h-24 mx-auto text-blue-300 dark:text-blue-700 mb-4 md:mb-6" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3">
              {language === 'ar' ? 'سلتك فارغة' : 'Votre panier est vide'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg mb-6 md:mb-8 px-4">
              {language === 'ar' ? 'ابدأ التسوق واضف بعض المنتجات المميزة' : 'Commencez vos achats et découvrez nos produits'}
            </p>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center px-4">
              <Button
                onClick={() => navigate('/website-shop/offers')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 md:px-8 py-3 text-base md:text-lg font-bold rounded-lg shadow-lg w-full md:w-auto"
              >
                {language === 'ar' ? '⚡ عروضنا' : '⚡ Nos Offres'}
              </Button>
              <Button
                onClick={() => navigate('/website-shop/special-offers')}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 md:px-8 py-3 text-base md:text-lg font-bold rounded-lg shadow-lg w-full md:w-auto"
              >
                {language === 'ar' ? '👑 عروض حصرية' : '👑 Offres Exclusives'}
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* ====== PRODUCTS SECTION ====== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-4 md:space-y-6"
            >
              {/* Section Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                  <h2 className="text-xl md:text-2xl font-bold">
                    {language === 'ar' ? '📦 المنتجات' : '📦 Vos Produits'}
                  </h2>
                </div>
                <p className="text-blue-100 text-sm md:text-base">
                  {itemCount} {language === 'ar' ? 'منتج' : 'article'} • {totalQuantity} {language === 'ar' ? 'وحدة' : 'unité'}
                </p>
              </div>

              {/* Product Items - Grid Layout */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={`${item.product_id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover="hover"
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-300" />
                    
                    <div className="relative bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4 h-full flex flex-col overflow-hidden">
                      {/* Product Image */}
                      <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <motion.img
                            src={item.image}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain p-2"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          />
                        ) : (
                          <ShoppingCart className="h-12 w-12 text-slate-300" />
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-2 line-clamp-2">
                        {item.name}
                      </h3>

                      {/* Brand Badge */}
                      {item.product_mark && (
                        <Badge variant="outline" className="w-fit mb-2 text-xs font-bold border-blue-300 bg-blue-50 dark:bg-blue-900/30">
                          🏷️ {item.product_mark}
                        </Badge>
                      )}

                      {/* Description */}
                      {item.product_description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-1 italic">
                          📝 {item.product_description}
                        </p>
                      )}

                      {/* Specs Section */}
                      {(item.voltage || item.wattage || item.amperage || item.connection_type) && (
                        <>
                          <div className="mb-2">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">⚡ {language === 'ar' ? 'المواصفات' : 'Spécifications'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-1 mb-3">
                            {item.voltage && (
                              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-1.5 text-center border border-blue-200 dark:border-blue-700">
                                <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚡ {language === 'ar' ? 'الفولت' : 'Voltage'}</div>
                                <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{item.voltage}V</div>
                              </div>
                            )}
                            {item.wattage && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-1.5 text-center border border-yellow-200 dark:border-yellow-700">
                                <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔌 {language === 'ar' ? 'القوة' : 'Wattage'}</div>
                                <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{item.wattage}W</div>
                              </div>
                            )}
                            {item.amperage && (
                              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-1.5 text-center border border-purple-200 dark:border-purple-700">
                                <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">⚙️ {language === 'ar' ? 'التيار' : 'Amperage'}</div>
                                <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{item.amperage}A</div>
                              </div>
                            )}
                            {item.connection_type && (
                              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-1.5 text-center border border-green-200 dark:border-green-700">
                                <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🔧 {language === 'ar' ? 'الوصلة' : 'Connexion'}</div>
                                <div className="text-xs font-bold text-green-600 dark:text-green-400 truncate">{item.connection_type}</div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Price Section */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-2 mb-3 border-2 border-green-200 dark:border-green-700">
                        <div className="flex items-baseline gap-1 justify-center">
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {(item.price || 0).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            {language === 'ar' ? 'دج' : 'DZD'}
                          </span>
                        </div>
                        <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">
                          {language === 'ar' ? '💰 السعر' : '💰 Prix'}
                        </p>
                      </div>

                      {/* Quantity Control */}
                      <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                          className="h-6 w-6 p-0 rounded text-xs"
                        >
                          −
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          className="w-10 h-6 text-center text-xs font-bold border-0 bg-transparent"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                          className="h-6 w-6 p-0 rounded text-xs"
                        >
                          +
                        </Button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-center mb-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                          {language === 'ar' ? 'المجموع' : 'Total'}
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {(item.price * item.quantity).toFixed(2)} {language === 'ar' ? 'دج' : 'DZD'}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg py-2 text-xs transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        {language === 'ar' ? '🗑️ حذف' : '🗑️ Retirer'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ====== CLIENT INFORMATION & CHECKOUT SECTION ====== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-6"
            >
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl md:rounded-2xl p-5 md:p-6 text-white shadow-lg">
                <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                  <Check className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                  {language === 'ar' ? '📊 الملخص' : '📊 Résumé'}
                </h2>

                {/* Summary Details */}
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-green-400">
                  <div className="flex justify-between items-center text-green-50 text-sm md:text-base">
                    <span className="font-semibold">{language === 'ar' ? 'المنتجات:' : 'Articles:'}</span>
                    <Badge className="bg-white text-green-600 font-bold px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm">{itemCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-green-50 text-sm md:text-base">
                    <span className="font-semibold">{language === 'ar' ? 'الكمية:' : 'Quantité:'}</span>
                    <Badge className="bg-white text-green-600 font-bold px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm">{totalQuantity}</Badge>
                  </div>
                </div>

                {/* Total */}
                <div className="space-y-1 md:space-y-2">
                  <p className="text-green-100 text-xs md:text-sm font-semibold">{language === 'ar' ? 'المجموع النهائي' : 'Total TTC'}</p>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-3xl md:text-4xl font-bold">{total.toFixed(2)}</span>
                    <span className="text-xl md:text-2xl font-bold text-green-50">{language === 'ar' ? 'دج' : 'DZD'}</span>
                  </div>
                </div>
              </div>

              {/* Client Information Form */}
              <form onSubmit={handleCheckout} className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg space-y-5 md:space-y-6">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
                  {language === 'ar' ? '👤 بيانات التسليم' : '👤 Infos Livraison'}
                </h2>

                {/* Form Fields */}
                <div className="space-y-3 md:space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === 'ar' ? '👤 الاسم الكامل *' : '👤 Nom complet *'}
                    </label>
                    <Input
                      name="client_name"
                      placeholder={language === 'ar' ? 'أدخل اسمك' : 'Entrez votre nom'}
                      value={formData.client_name}
                      onChange={handleFormChange}
                      className="border border-blue-200 dark:border-blue-700 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === 'ar' ? '📱 رقم الهاتف *' : '📱 Téléphone *'}
                    </label>
                    <Input
                      name="client_phone"
                      placeholder={language === 'ar' ? '+213...' : '+33...'}
                      value={formData.client_phone}
                      onChange={handleFormChange}
                      className="border border-blue-200 dark:border-blue-700 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm"
                      required
                    />
                  </div>

                  {/* Wilaya */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                      {language === 'ar' ? '🗺️ الولاية *' : '🗺️ Wilaya *'}
                    </label>
                    <Select value={formData.client_wilaya} onValueChange={(value) => setFormData(prev => ({ ...prev, client_wilaya: value }))}>
                      <SelectTrigger className="border border-blue-200 dark:border-blue-700 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm">
                        <SelectValue placeholder={language === 'ar' ? 'اختر الولاية' : 'Choisir une wilaya'} />
                      </SelectTrigger>
                      <SelectContent>
                        {ALGERIAN_WILAYAS.map(wilaya => (
                          <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === 'ar' ? '📍 العنوان *' : '📍 Adresse *'}
                    </label>
                    <Input
                      name="client_address"
                      placeholder={language === 'ar' ? 'شارع، رقم البيت...' : 'Rue, numéro...'}
                      value={formData.client_address}
                      onChange={handleFormChange}
                      className="border border-blue-200 dark:border-blue-700 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm"
                      required
                    />
                  </div>

                  {/* Delivery Type */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      {language === 'ar' ? '🚚 نوع التسليم *' : '🚚 Type de Livraison *'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Bureau Option */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, delivery_type: 'bureau' }))}
                        className={`relative p-4 rounded-lg border-2 transition-all text-center font-semibold ${
                          formData.delivery_type === 'bureau'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">🏢</span>
                          <span className="text-sm">{language === 'ar' ? 'مكتب' : 'Bureau'}</span>
                        </div>
                        {formData.delivery_type === 'bureau' && (
                          <Check className="absolute top-2 right-2 w-4 h-4 text-blue-600" />
                        )}
                      </motion.button>

                      {/* Domicile Option */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, delivery_type: 'domicile' }))}
                        className={`relative p-4 rounded-lg border-2 transition-all text-center font-semibold ${
                          formData.delivery_type === 'domicile'
                            ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-green-400'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">🏠</span>
                          <span className="text-sm">{language === 'ar' ? 'منزل' : 'Domicile'}</span>
                        </div>
                        {formData.delivery_type === 'domicile' && (
                          <Check className="absolute top-2 right-2 w-4 h-4 text-green-600" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-3 md:py-4 rounded-lg text-base md:text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full" />
                      <span className="text-sm md:text-base">{language === 'ar' ? 'جاري...' : 'Traitement...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-sm md:text-base">{language === 'ar' ? '✅ تأكيد الطلب' : '✅ Confirmer'}</span>
                    </>
                  )}
                </motion.button>

                {/* Security Badge */}
                <div className="text-center text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
                  <span>🔒</span>
                  {language === 'ar' ? 'بيانات آمنة' : 'Données sécurisées'}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
