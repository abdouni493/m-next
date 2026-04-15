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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOffersREST, getSpecialOffersREST, createOrderREST, getDeliveryAgenciesForWilaya, supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Zap, ShoppingCart, Check, MapPin, Phone, User } from 'lucide-react';

interface Product {
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
  offer_price?: number;
  special_price?: number;
  discount_percentage: number;
  is_special?: boolean;
}

interface DeliveryAgency {
  id: string;
  name: string;
  logo_url?: string;
  contact_phone?: string;
  contact_email?: string;
  wilaya_price?: {
    price_domicile: number;
    price_bureau: number;
  };
}

// List of Algerian Wilayas
const ALGERIAN_WILAYAS = [
  'Adrar',
  'Chlef',
  'Laghouat',
  'Oum El Bouaghi',
  'Batna',
  'Béjaïa',
  'Biskra',
  'Béchar',
  'Blida',
  'Bouira',
  'Tamanrasset',
  'Tébessa',
  'Tlemcen',
  'Tiaret',
  'Tizi Ouzou',
  'Alger',
  'Djelfa',
  'Jijel',
  'Sétif',
  'Saïda',
  'Skikda',
  'Sidi Bel Abbès',
  'Annaba',
  'Guelma',
  'Constantine',
  'Médéa',
  'Mostaganem',
  'M\'Sila',
  'Mascara',
  'Ouargla',
  'Oran',
  'El Bayadh',
  'Illizi',
  'Bordj Bou Arréridj',
  'Boumerdès',
  'El Taref',
  'Tindouf',
  'Tissemsilt',
  'El Oued',
  'Khenchela',
  'Souk Ahras',
  'Tipasa',
  'Mila',
  'Aïn Defla',
  'Naama',
  'Aïn Témouchent',
  'Ghardaïa',
  'Relizane',
  'Draa Ben Stita',
  'Djanet',
  'El M\'Ghair',
  'El Menia',
  'Ouled Djellal',
  'Béni Abbès',
  'In Salah',
  'In Guezzam',
  'Touggourt',
  'Temassasin',
];

const DELIVERY_OPTIONS = [
  { id: 'bureau', label_fr: 'Au Bureau (Retrait)', label_ar: 'من المكتب (استلام)', emoji: '🏢' },
  { id: 'domicile', label_fr: 'À Domicile (Livraison)', label_ar: 'توصيل للمنزل', emoji: '🏠' },
];

export default function WebsiteOrder() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderStatus, setOrderStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info' | null;
    message: string;
    itemsCount?: number;
  }>({ type: null, message: '' });
  
  // Delivery related states
  const [deliveryAgencies, setDeliveryAgencies] = useState<DeliveryAgency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<DeliveryAgency | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    wilaya: '',
    deliveryType: 'domicile',
    deliveryAgency: '',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productId = searchParams.get('product_id');
        const isSpecial = searchParams.get('special') === 'true';

        // Fetch both offers and special offers
        const [offers, specialOffers] = await Promise.all([
          getOffersREST(),
          getSpecialOffersREST(),
        ]);

        const allOffers = [
          ...offers.map(o => ({ ...o, is_special: false })),
          ...specialOffers.map(o => ({ ...o, is_special: true })),
        ];

        setAllProducts(allOffers);
        setFilteredProducts(allOffers);

        // If product_id in URL, select it and add to cart
        if (productId) {
          const found = allOffers.find(o => o.product_id === productId || o.id === productId);
          if (found) {
            setProduct(found);
            setShowProductSearch(false);
            
            // Automatically add to cart with quantity 1
            addProductToCart(found, 1);
          }
        } else {
          // Show product search by default if no product selected
          setShowProductSearch(true);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  // Fetch delivery agencies when wilaya changes
  useEffect(() => {
    const fetchDeliveryAgencies = async () => {
      if (!formData.wilaya) {
        setDeliveryAgencies([]);
        setSelectedAgency(null);
        setDeliveryPrice(0);
        return;
      }

      setLoadingAgencies(true);
      try {
        const agencies = await getDeliveryAgenciesForWilaya(formData.wilaya);
        setDeliveryAgencies(agencies);
        
        // Reset agency selection when wilaya changes
        setSelectedAgency(null);
        setFormData(prev => ({ ...prev, deliveryAgency: '' }));
        setDeliveryPrice(0);
      } catch (error) {
        console.error('Error fetching delivery agencies:', error);
        setDeliveryAgencies([]);
      } finally {
        setLoadingAgencies(false);
      }
    };

    fetchDeliveryAgencies();
  }, [formData.wilaya]);

  const handleProductSearch = (query: string) => {
    setProductSearchQuery(query);
    if (query.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(p =>
        p.product_name.toLowerCase().includes(query.toLowerCase()) ||
        p.product_mark?.toLowerCase().includes(query.toLowerCase()) ||
        p.product_description?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const handleSelectProduct = (selectedProduct: Product) => {
    setProduct(selectedProduct);
    setShowProductSearch(false);
    setProductSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWilayaChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      wilaya: value,
    }));
  };

  const handleDeliveryAgencyChange = (agencyId: string) => {
    const agency = deliveryAgencies.find(a => a.id === agencyId);
    if (agency && agency.wilaya_price) {
      setSelectedAgency(agency);
      setFormData(prev => ({ ...prev, deliveryAgency: agencyId }));
      // Set default price based on delivery type
      const price = formData.deliveryType === 'bureau' 
        ? agency.wilaya_price.price_bureau 
        : agency.wilaya_price.price_domicile;
      setDeliveryPrice(price);
    }
  };

  const handleDeliveryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryType: value,
    }));
    
    // Update price based on selected delivery type and agency
    if (selectedAgency && selectedAgency.wilaya_price) {
      const price = value === 'bureau' 
        ? selectedAgency.wilaya_price.price_bureau 
        : selectedAgency.wilaya_price.price_domicile;
      setDeliveryPrice(price);
    }
  };

  const addProductToCart = (prod: Product, qty: number) => {
    try {
      // Get existing cart items from localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Create cart item from product
      const cartItem = {
        id: prod.product_id || prod.id,
        product_id: prod.product_id || prod.id,
        product_name: prod.product_name,
        product_image: prod.product_image,
        product_mark: prod.product_mark,
        price: prod.is_special ? prod.special_price : prod.offer_price,
        original_price: prod.original_price,
        quantity: qty,
        discount_percentage: prod.discount_percentage,
        product_description: prod.product_description,
      };
      
      // Check if product already exists in cart
      const existingIndex = existingCart.findIndex((item: any) => item.product_id === cartItem.product_id);
      
      if (existingIndex > -1) {
        // Update quantity if product already in cart
        existingCart[existingIndex].quantity += qty;
      } else {
        // Add new item to cart
        existingCart.push(cartItem);
      }
      
      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Dispatch event to update cart display
      window.dispatchEvent(new Event('cartUpdated'));
      
      console.log('✅ Product added to cart:', cartItem);
    } catch (error) {
      console.error('❌ Error adding product to cart:', error);
    }
  };

  const finalPrice = product ? (product.is_special ? product.special_price : product.offer_price) : 0;
  const subtotal = (finalPrice || 0) * quantity;
  const totalPrice = subtotal + deliveryPrice;

  const handlePlaceOrder = async () => {
    if (!formData.fullName || !formData.phone || !formData.address || !formData.wilaya || !formData.deliveryAgency) {
      const errorMsg = language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis';
      setOrderStatus({ type: 'error', message: errorMsg });
      console.error('❌ Validation Error: Missing required fields');
      return;
    }

    // Get cart items from localStorage
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (!cartItems || cartItems.length === 0) {
      const errorMsg = language === 'ar' ? 'السلة فارغة' : 'Votre panier est vide';
      setOrderStatus({ type: 'error', message: errorMsg });
      console.error('❌ Validation Error: Cart is empty');
      return;
    }

    setIsPlacingOrder(true);
    setOrderStatus({ type: 'info', message: language === 'ar' ? 'جاري معالجة الطلب...' : 'Traitement de la commande...' });

    try {
      // Calculate total from all cart items
      const subtotalPrice = cartItems.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
      const discountAmount = 0;
      const finalTotalPrice = subtotalPrice + deliveryPrice - discountAmount;
      
      // Create order in database
      const orderData = {
        customer_name: formData.fullName,
        customer_phone: formData.phone,
        customer_email: null,
        customer_address: formData.address,
        customer_wilaya: formData.wilaya,
        delivery_type: formData.deliveryType,
        delivery_agency_id: formData.deliveryAgency,
        delivery_price: deliveryPrice,
        status: 'pending',
        total_price: subtotalPrice,
        discount_amount: discountAmount,
        final_price: finalTotalPrice,
        notes: '',
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📝 Creating order with data:', orderData);
      setOrderStatus({ type: 'info', message: language === 'ar' ? 'إنشاء الطلب...' : 'Création de la commande...' });
      
      const savedOrder = await createOrderREST(orderData, cartItems);
      
      if (!savedOrder || !savedOrder.id) {
        throw new Error('Order creation failed - no ID returned');
      }
      
      console.log('✅ Order created with ID:', savedOrder.id);
      setOrderStatus({ type: 'info', message: language === 'ar' ? 'تم إنشاء الطلب وحفظ المنتجات بنجاح!' : 'Commande créée et produits enregistrés!' });

      // Verify items were actually saved
      const { data: verifyItems, error: verifyError } = await supabase
        .from('order_items')
        .select('id, product_name, quantity')
        .eq('order_id', savedOrder.id);

      if (verifyError) {
        console.error('❌ Error verifying items:', verifyError);
      } else {
        const itemsCount = verifyItems?.length || 0;
        console.log(`✅ VERIFICATION: Order has ${itemsCount} item(s)`);
        
        if (itemsCount === 0) {
          console.warn('⚠️ WARNING: Items were saved but verification found 0 items!');
          const warningMsg = language === 'ar' 
            ? '⚠️ تحذير: تم إنشاء الطلب لكن لم يتم العثور على المنتجات' 
            : '⚠️ Attention: Commande créée mais aucun produit trouvé';
          setOrderStatus({ 
            type: 'warning', 
            message: warningMsg,
            itemsCount: 0
          });
        } else {
          console.log(`✅ SUCCESS: Order created with ${itemsCount} item(s)`);
          const successMsg = language === 'ar' 
            ? `✅ تم إنشاء الطلب بنجاح مع ${itemsCount} منتج(ات)` 
            : `✅ Commande créée avec succès (${itemsCount} article(s))`;
          setOrderStatus({ 
            type: 'success', 
            message: successMsg,
            itemsCount: itemsCount
          });
          
          // Clear cart after successful order
          localStorage.removeItem('cart');
          window.dispatchEvent(new Event('cartUpdated'));
        }
      }

      // Try to update inventory for all items
      try {
        for (const item of cartItems) {
          const { data: currentProduct } = await supabase
            .from('products')
            .select('quantity_actual')
            .eq('id', item.product_id)
            .single();

          if (currentProduct) {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                quantity_actual: (currentProduct.quantity_actual || 0) - (item.quantity || 1),
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.product_id);

            if (updateError) {
              console.warn('⚠️ Warning: Inventory update failed for product', item.product_id);
            } else {
              console.log('✅ Inventory updated for product:', item.product_id);
            }
          }
        }
      } catch (inventoryError) {
        console.warn('⚠️ Warning: Could not update inventory:', inventoryError);
      }

      // Mark as placed after successful verification
      setTimeout(() => {
        setOrderPlaced(true);
      }, 2000);

    } catch (error) {
      console.error('❌ Error placing order:', error);
      const errorMsg = error instanceof Error ? error.message : (language === 'ar' ? 'حدث خطأ في وضع الطلب' : 'Erreur lors de la commande');
      setOrderStatus({ type: 'error', message: `❌ ${errorMsg}` });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          {language === 'ar' ? 'المنتج غير موجود' : 'Produit non trouvé'}
        </h1>
        <Button
          onClick={() => navigate('/website-shop/offers')}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
        >
          {language === 'ar' ? 'العودة للعروض' : 'Retour aux offres'}
        </Button>
      </div>
    );
  }

  if (orderPlaced) {
    const orderNumber = `#${Date.now().toString().slice(-8)}`;

    return (
      <div className={`min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Animated Background Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 overflow-hidden pointer-events-none"
        >
          {/* Floating particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: window.innerHeight, opacity: 0 }}
              animate={{ y: -100, opacity: [0, 1, 0] }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className="absolute left-1/4 w-3 h-3 bg-green-400 rounded-full"
              style={{ left: `${20 + i * 12}%` }}
            />
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-2xl w-full"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-20 blur-xl"
              />
              <div className="relative w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Check className="w-16 h-16 text-white" strokeWidth={3} />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Main Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
              {language === 'ar' ? '🎉 شكراً لك!' : '🎉 Merci!'}
            </h1>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {language === 'ar' 
                ? 'تم استقبال طلبك بنجاح' 
                : 'Votre Commande a été Reçue'}
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'ar'
                ? 'نشكرك على ثقتك بنا! سيتم التواصل معك قريباً عبر رقم الهاتف المسجل للتأكيد النهائي على طلبك وتفاصيل الدفع والتوصيل.'
                : 'Merci de votre confiance! Nous vous contacterons bientôt sur le numéro fourni pour confirmer votre commande et discuter des détails de paiement et de livraison.'}
            </p>
          </motion.div>

          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border-2 border-green-200 dark:border-green-900 overflow-hidden mb-8"
          >
            {/* Order Number Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-6 text-white">
              <p className="text-sm font-semibold opacity-90 mb-1">
                {language === 'ar' ? 'رقم الطلب' : 'Numéro de Commande'}
              </p>
              <p className="text-3xl font-black">{orderNumber}</p>
            </div>

            {/* Order Details */}
            <div className="px-8 py-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                {language === 'ar' ? '📋 تفاصيل طلبك' : '📋 Détails de Votre Commande'}
              </h3>

              <div className="space-y-4 mb-6">
                {/* Customer Info */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-2xl">👤</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'الاسم' : 'Nom'}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">{formData.fullName}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-2xl">📞</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">{formData.phone}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-2xl">📍</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'العنوان' : 'Adresse'}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">{formData.address}</p>
                  </div>
                </div>

                {/* Wilaya */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-2xl">🗺️</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'الولاية' : 'Wilaya'}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">{formData.wilaya}</p>
                  </div>
                </div>

                {/* Delivery Type */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-2xl">{formData.deliveryType === 'bureau' ? '🏢' : '🏠'}</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'نوع التوصيل' : 'Type de Livraison'}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {DELIVERY_OPTIONS.find(d => d.id === formData.deliveryType)?.[language === 'ar' ? 'label_ar' : 'label_fr']}
                    </p>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex items-start gap-4">
                  <div className="text-2xl">📦</div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'المنتج' : 'Produit'}
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white">{product.product_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'ar' ? 'الكمية' : 'Quantité'}: <span className="font-semibold">{quantity} × {finalPrice?.toFixed(2)} DZD</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {language === 'ar' ? 'المبلغ الإجمالي' : 'Montant Total'}
                </p>
                <p className="text-4xl font-black text-green-600 dark:text-green-400">
                  {totalPrice.toFixed(2)} <span className="text-lg">DZD</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-8"
          >
            <div className="flex gap-4">
              <div className="text-3xl">📞</div>
              <div>
                <p className="font-bold text-blue-900 dark:text-blue-300 mb-2">
                  {language === 'ar' ? 'سنتواصل معك قريباً' : 'Nous vous Contacterons Bientôt'}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {language === 'ar'
                    ? 'فريقنا سيتصل بك خلال الساعات القادمة للتأكد من التفاصيل وترتيب الدفع والتوصيل. تأكد من توفر رقم الهاتف المسجل.'
                    : 'Notre équipe vous contactera dans les prochaines heures pour confirmer les détails et organiser le paiement et la livraison. Assurez-vous que le numéro enregistré est disponible.'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              onClick={() => navigate('/website-shop')}
              variant="outline"
              className="flex-1 border-2 border-slate-300 dark:border-slate-600 h-12 text-base font-bold hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {language === 'ar' ? '🏠 الصفحة الرئيسية' : '🏠 Accueil'}
            </Button>
            <Button
              onClick={() => navigate('/website-shop/offers')}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg h-12"
            >
              {language === 'ar' ? '🛍️ متابعة التسوق' : '🛍️ Continuer les Achats'}
            </Button>
          </motion.div>

          {/* Auto-redirect message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6"
          >
            {language === 'ar'
              ? 'اختر زر العودة للمتابعة'
              : 'Cliquez sur Retour pour continuer'}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 py-12 space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="hover:bg-blue-100 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          {language === 'ar' ? '📦 صفحة الطلب' : '📦 Passer Commande'}
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Selection / Search */}
        {showProductSearch && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-blue-200 dark:border-blue-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {language === 'ar' ? '🔍 اختر المنتج' : '🔍 Sélectionner le Produit'}
              </h3>
              <Input
                placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Rechercher un produit...'}
                value={productSearchQuery}
                onChange={(e) => handleProductSearch(e.target.value)}
                className="border-2 border-slate-300 dark:border-slate-600 mb-4"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <motion.button
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      whileHover={{ scale: 1.02 }}
                      className="w-full p-3 text-left bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-400 transition-all"
                    >
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{p.product_name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{p.product_mark || 'Charger'}</p>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">
                        {p.is_special ? p.special_price : p.offer_price} DZD
                      </p>
                    </motion.button>
                  ))
                ) : (
                  <p className="text-center text-slate-600 dark:text-slate-400 py-4">
                    {language === 'ar' ? 'لا توجد منتجات' : 'Aucun produit trouvé'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Product Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xl border-2 border-blue-200 dark:border-blue-700">
            {/* Product Image */}
            <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center overflow-hidden">
              {product.product_image ? (
                <motion.img
                  src={product.product_image}
                  alt={product.product_name}
                  className="max-w-full max-h-full object-contain"
                  whileHover={{ scale: 1.1 }}
                />
              ) : (
                <Zap className="h-16 w-16 text-slate-300" />
              )}
            </div>

            {/* Product Details */}
            <div className="p-6 space-y-4">
              <Badge className="w-fit bg-blue-500 hover:bg-blue-600">
                {product.is_special ? '🔥 Spécial' : '⚡ Offre'}
              </Badge>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {product.product_name}
              </h2>

              <Badge variant="outline" className="w-fit border-blue-300 bg-blue-50 dark:bg-blue-900/30">
                🏷️ {product.product_mark || 'Charger'}
              </Badge>

              {product.product_description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                  📝 {product.product_description}
                </p>
              )}

              {/* Specs */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">⚡ {language === 'ar' ? 'المواصفات' : 'Spécifications'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 text-center border border-blue-200">
                    <div className="text-xs text-slate-600 font-bold">⚡ {language === 'ar' ? 'الفولت' : 'Voltage'}</div>
                    <div className="text-sm font-bold text-blue-600">{product.voltage ? `${product.voltage}V` : 'N/A'}</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2 text-center border border-purple-200">
                    <div className="text-xs text-slate-600 font-bold">⚡ {language === 'ar' ? 'الواط' : 'Wattage'}</div>
                    <div className="text-sm font-bold text-purple-600">{product.wattage ? `${product.wattage}W` : 'N/A'}</div>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/30 rounded-lg p-2 text-center border border-pink-200">
                    <div className="text-xs text-slate-600 font-bold">⚡ {language === 'ar' ? 'الأمبير' : 'Ampérage'}</div>
                    <div className="text-sm font-bold text-pink-600">{product.amperage ? `${product.amperage}A` : 'N/A'}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-2 text-center border border-orange-200">
                    <div className="text-xs text-slate-600 font-bold">🔧 {language === 'ar' ? 'النوع' : 'Type'}</div>
                    <div className="text-sm font-bold text-orange-600">{product.connection_type || 'Standard'}</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 dark:text-white font-bold">{language === 'ar' ? 'الكمية:' : 'Quantité:'}</span>
                  <div className="flex items-center gap-2 border border-slate-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      −
                    </button>
                    <span className="px-4 font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-700">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {language === 'ar' ? 'الإجمالي:' : 'Total:'}
                  </span>
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {totalPrice.toFixed(2)} DZD
                  </span>
                </div>
              </div>

              {/* Change Product Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProductSearch(true)}
                className="w-full py-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2"
              >
                🔄 {language === 'ar' ? 'تغيير المنتج' : 'Changer le produit'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Order Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-purple-200 dark:border-purple-700 p-8">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
              {language === 'ar' ? '👤 معلومات التوصيل' : '👤 Informations de Livraison'}
            </h2>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {language === 'ar' ? 'الاسم الكامل *' : 'Nom Complet *'}
                </label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Votre nom complet'}
                  className="border-2 border-slate-300 dark:border-slate-600 py-6 text-base"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {language === 'ar' ? 'رقم الهاتف *' : 'Téléphone *'}
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={language === 'ar' ? '+213 6 XX XX XX XX' : '+213 6 XX XX XX XX'}
                  className="border-2 border-slate-300 dark:border-slate-600 py-6 text-base"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {language === 'ar' ? 'العنوان *' : 'Adresse *'}
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={language === 'ar' ? 'شارع، رقم البناء، إلخ' : 'Rue, numéro, etc'}
                  className="border-2 border-slate-300 dark:border-slate-600 py-6 text-base"
                />
              </div>

              {/* Wilaya */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {language === 'ar' ? 'الولاية *' : 'Wilaya *'}
                </label>
                <Select value={formData.wilaya} onValueChange={handleWilayaChange}>
                  <SelectTrigger className="border-2 border-slate-300 dark:border-slate-600 h-12">
                    <SelectValue placeholder={language === 'ar' ? 'اختر ولاية' : 'Sélectionner une wilaya'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    {ALGERIAN_WILAYAS.map(wilaya => (
                      <SelectItem key={wilaya} value={wilaya}>
                        {wilaya}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Agency Selection */}
              {formData.wilaya && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    🚐 {language === 'ar' ? 'وكالة التوصيل *' : 'Agence de Livraison *'}
                  </label>
                  
                  {loadingAgencies ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : deliveryAgencies.length === 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg text-center">
                      <p className="text-yellow-700 dark:text-yellow-300 font-semibold">
                        {language === 'ar' ? 'لا توجد وكالات متاحة لهذه الولاية' : 'Aucune agence disponible pour cette wilaya'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {deliveryAgencies.map(agency => (
                        <motion.button
                          key={agency.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDeliveryAgencyChange(agency.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.deliveryAgency === agency.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {agency.logo_url && (
                                  <img src={agency.logo_url} alt={agency.name} className="h-6 w-6 object-contain" />
                                )}
                                {agency.name}
                              </div>
                              {agency.contact_phone && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  📞 {agency.contact_phone}
                                </div>
                              )}
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              formData.deliveryAgency === agency.id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-slate-300'
                            }`}>
                              {formData.deliveryAgency === agency.id && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Delivery Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  🚚 {language === 'ar' ? 'نوع التوصيل *' : 'Type de Livraison *'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DELIVERY_OPTIONS.map(option => {
                    const price = option.id === 'bureau' 
                      ? selectedAgency?.wilaya_price?.price_bureau || 0 
                      : selectedAgency?.wilaya_price?.price_domicile || 0;
                    
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => handleDeliveryChange(option.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={!selectedAgency}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          !selectedAgency 
                            ? 'opacity-50 cursor-not-allowed'
                            : formData.deliveryType === option.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.emoji}</div>
                        <div className="font-bold text-slate-900 dark:text-white mb-2">
                          {language === 'ar' ? option.label_ar : option.label_fr}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {price.toFixed(2)} DZD
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.deliveryType === option.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-300'
                        }`}>
                          {formData.deliveryType === option.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                {language === 'ar' ? '📋 ملخص الطلب' : '📋 Résumé de la Commande'}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>{product.product_name}</span>
                  <span>x{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'سعر الوحدة:' : 'Prix unitaire:'}</span>
                  <span>{finalPrice?.toFixed(2)} DZD</span>
                </div>
                <div className="flex justify-between font-semibold text-base">
                  <span>{language === 'ar' ? 'المنتجات:' : 'Produits:'}</span>
                  <span className="text-blue-600 dark:text-blue-400">{subtotal.toFixed(2)} DZD</span>
                </div>
                
                {deliveryPrice > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        📦 {selectedAgency?.name}
                        <span className="text-xs text-slate-500">({formData.deliveryType === 'bureau' ? language === 'ar' ? 'من المكتب' : 'Au Bureau' : language === 'ar' ? 'للمنزل' : 'À Domicile'})</span>
                      </span>
                      <span>{deliveryPrice.toFixed(2)} DZD</span>
                    </div>
                  </>
                )}
                
                <div className="border-t border-slate-300 dark:border-slate-600 pt-3 mt-3 flex justify-between font-bold text-base">
                  <span>{language === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="text-green-600 dark:text-green-400">{totalPrice.toFixed(2)} DZD</span>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {orderStatus.type && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg p-4 border-2 flex items-start gap-3 ${
                  orderStatus.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600'
                    : orderStatus.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600'
                    : orderStatus.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600'
                    : 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                }`}
              >
                <span className="text-2xl mt-0.5">
                  {orderStatus.type === 'success'
                    ? '✅'
                    : orderStatus.type === 'error'
                    ? '❌'
                    : orderStatus.type === 'warning'
                    ? '⚠️'
                    : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <p
                    className={`font-semibold text-sm ${
                      orderStatus.type === 'success'
                        ? 'text-green-800 dark:text-green-200'
                        : orderStatus.type === 'error'
                        ? 'text-red-800 dark:text-red-200'
                        : orderStatus.type === 'warning'
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    {orderStatus.message}
                  </p>
                  {orderStatus.itemsCount !== undefined && (
                    <p className="text-xs mt-1 opacity-75">
                      {language === 'ar'
                        ? `عدد المنتجات: ${orderStatus.itemsCount}`
                        : `Nombre de produits: ${orderStatus.itemsCount}`}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1 border-2 border-slate-300 dark:border-slate-600 h-12 text-base"
                disabled={isPlacingOrder}
              >
                {language === 'ar' ? '← العودة' : '← Retour'}
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className={`flex-1 ${
                  isPlacingOrder
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                } text-white font-bold text-lg h-12 transition-all`}
              >
                {isPlacingOrder ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    {language === 'ar' ? 'جاري المعالجة...' : 'Traitement...'}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2 inline" />
                    {language === 'ar' ? '✓ تأكيد الطلب' : '✓ Confirmer la Commande'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
