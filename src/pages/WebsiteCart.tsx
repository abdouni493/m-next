import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { createOrderREST, getVisibleDeliveryAgencies, getDeliveryPriceForWilaya, getTestimonialsByName, createTestimonial, updateTestimonial, deleteTestimonial } from '@/lib/supabaseClient';
import { ArrowLeft, Trash2, ShoppingCart, Check, MapPin, User, Package, Truck, MessageSquare, Edit2, Plus, AlertCircle, X } from 'lucide-react';

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

interface DeliveryAgency {
  id: string;
  name: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  price_domicile: number;
  price_bureau: number;
  is_active: boolean;
  is_visible: boolean;
}

interface Testimonial {
  id: string;
  client_name: string;
  opinion: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  is_approved?: boolean;
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryAgencies, setDeliveryAgencies] = useState<DeliveryAgency[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [deliveryPriceCache, setDeliveryPriceCache] = useState<Map<string, number>>(new Map());

  // Testimonials state
  const [userTestimonials, setUserTestimonials] = useState<Testimonial[]>([]);
  const [showTestimonialsModal, setShowTestimonialsModal] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialOpinion, setTestimonialOpinion] = useState('');
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_wilaya: '',
    client_address: '',
    delivery_agency_id: '',
    delivery_type: 'domicile'
  });

  // Load cart and delivery agencies from database
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    
    // Fetch delivery agencies
    const fetchAgencies = async () => {
      try {
        const agencies = await getVisibleDeliveryAgencies();
        setDeliveryAgencies(agencies || []);
        if (agencies && agencies.length > 0) {
          setFormData(prev => ({ ...prev, delivery_agency_id: agencies[0].id }));
        }
      } catch (error) {
        console.error('Error fetching delivery agencies:', error);
      }
    };
    
    fetchAgencies();
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

  // ========== TESTIMONIALS HANDLERS ==========

  // Load user testimonials
  const loadUserTestimonials = async (clientName: string) => {
    if (!clientName.trim()) return;
    setLoadingTestimonials(true);
    try {
      const testimonials = await getTestimonialsByName(clientName);
      setUserTestimonials(testimonials || []);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل آرائك' : 'Impossible de charger vos avis',
        variant: 'destructive',
      });
    } finally {
      setLoadingTestimonials(false);
    }
  };

  // Open testimonials modal
  const handleOpenTestimonials = async () => {
    if (formData.client_name.trim()) {
      await loadUserTestimonials(formData.client_name);
      setShowTestimonialsModal(true);
    } else {
      toast({
        title: language === 'ar' ? 'تنبيه' : 'Attention',
        description: language === 'ar' ? 'الرجاء إدخال اسمك أولاً' : 'Veuillez d\'abord entrer votre nom',
        variant: 'destructive',
      });
    }
  };

  // Submit testimonial (create or update)
  const handleSubmitTestimonial = async () => {
    if (!testimonialOpinion.trim()) {
      toast({
        title: language === 'ar' ? 'تنبيه' : 'Attention',
        description: language === 'ar' ? 'الرجاء إدخال رأيك' : 'Veuillez entrer votre avis',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingTestimonial(true);
    try {
      if (editingTestimonial) {
        // Update existing testimonial
        await updateTestimonial(editingTestimonial.id, testimonialOpinion, testimonialRating);
        toast({
          title: language === 'ar' ? '✅ تم' : '✅ Succès',
          description: language === 'ar' ? 'تم تحديث رأيك' : 'Votre avis a été mis à jour',
        });
      } else {
        // Create new testimonial
        await createTestimonial(formData.client_name, testimonialOpinion, testimonialRating);
        toast({
          title: language === 'ar' ? '✅ شكراً!' : '✅ Merci!',
          description: language === 'ar' ? 'تم استقبال رأيك' : 'Votre avis a été enregistré',
        });
      }

      // Reset form and reload testimonials
      setTestimonialOpinion('');
      setTestimonialRating(5);
      setEditingTestimonial(null);
      setShowTestimonialForm(false);
      await loadUserTestimonials(formData.client_name);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إرسال الرأي' : 'Erreur lors de l\'envoi',
        variant: 'destructive',
      });
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  // Edit testimonial
  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialOpinion(testimonial.opinion);
    setTestimonialRating(testimonial.rating || 5);
    setShowTestimonialForm(true);
  };

  // Delete testimonial
  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (!confirm(language === 'ar' ? 'هل تريد حذف هذا الرأي؟' : 'Êtes-vous sûr?')) return;

    try {
      await deleteTestimonial(testimonialId);
      toast({
        title: language === 'ar' ? '✅ تم' : '✅ Succès',
        description: language === 'ar' ? 'تم حذف رأيك' : 'Votre avis a été supprimé',
      });
      await loadUserTestimonials(formData.client_name);
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف الرأي' : 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  // Calculate totals with delivery
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Get selected delivery agency
  const selectedAgency = deliveryAgencies.find(a => a.id === formData.delivery_agency_id);
  
  // Calculate delivery price with wilaya-specific pricing support
  const getDeliveryPrice = async () => {
    if (!selectedAgency) return 0;
    
    // Create cache key
    const cacheKey = `${selectedAgency.id}-${formData.client_wilaya}-${formData.delivery_type}`;
    
    // Return from cache if available
    if (deliveryPriceCache.has(cacheKey)) {
      return deliveryPriceCache.get(cacheKey) || 0;
    }
    
    try {
      // Try to get wilaya-specific price
      if (formData.client_wilaya) {
        console.log(`🔍 Fetching delivery price for agency ${selectedAgency.id}, wilaya ${formData.client_wilaya}, type ${formData.delivery_type}`);
        const wilayaPrice = await getDeliveryPriceForWilaya(
          selectedAgency.id,
          formData.client_wilaya,
          formData.delivery_type as 'bureau' | 'domicile'
        );
        
        console.log(`✅ Got wilaya-specific price: ${wilayaPrice}`);
        // Cache the result
        setDeliveryPriceCache(prev => new Map(prev).set(cacheKey, wilayaPrice));
        return wilayaPrice;
      }
    } catch (error) {
      console.error('❌ Error fetching wilaya-specific price:', error);
    }
    
    // Fallback to agency default price
    const defaultPrice = formData.delivery_type === 'bureau' 
      ? selectedAgency.price_bureau 
      : selectedAgency.price_domicile;
    
    console.log(`📦 Using default agency price: ${defaultPrice}`);
    setDeliveryPriceCache(prev => new Map(prev).set(cacheKey, defaultPrice));
    return defaultPrice;
  };
  
  // Calculate delivery price (will be computed in async manner)
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  
  useEffect(() => {
    const updatePrice = async () => {
      const price = await getDeliveryPrice();
      setDeliveryPrice(price);
    };
    updatePrice();
  }, [selectedAgency?.id, formData.client_wilaya, formData.delivery_type]);
  
  const finalTotal = total + deliveryPrice;
  
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

    if (!formData.client_name || !formData.client_phone || !formData.client_wilaya || !formData.client_address || !formData.delivery_agency_id) {
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
        delivery_agency_id: formData.delivery_agency_id,
        delivery_type: formData.delivery_type,
        delivery_price: deliveryPrice,
        status: 'pending',
        total_price: finalTotal
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
        delivery_agency_id: formData.delivery_agency_id,
        delivery_agency_name: selectedAgency?.name || '',
        delivery_type: formData.delivery_type,
        items: cartItems,
        subtotal: total,
        delivery_price: deliveryPrice,
        total_price: finalTotal,
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
      <div className={`min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-green-950 dark:to-slate-900 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Animated Background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 overflow-hidden pointer-events-none"
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: window.innerHeight + 100, opacity: 0, x: Math.random() * 100 - 50 }}
              animate={{ y: -100, opacity: [0, 1, 0], x: Math.random() * 100 - 50 }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className="absolute left-1/4 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-sm"
              style={{ left: `${15 + i * 10}%` }}
            />
          ))}
        </motion.div>

        {/* Main Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-gradient-to-r from-green-900 via-emerald-800 to-teal-900 dark:from-slate-900 dark:via-green-950 dark:to-slate-900 backdrop-blur-xl border-b-4 border-green-600 dark:border-emerald-500 shadow-2xl"
        >
          <div className="max-w-4xl mx-auto px-4 py-6 text-center">
            <motion.h1
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl md:text-4xl font-black text-white drop-shadow-lg"
            >
              🎉 {language === 'ar' ? 'شكراً لطلبك!' : 'Merci pour votre Commande!'}
            </motion.h1>
            <p className="text-green-100 text-sm md:text-base mt-2">{language === 'ar' ? '✨ سيتم معالجة طلبك في أسرع وقت' : '✨ Nous traiterons votre commande rapidement'}</p>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8 relative z-10">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-30 blur-2xl"
              />
              <div className="relative w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Check className="w-16 h-16 text-white" strokeWidth={3} />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Order Number */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-green-950/30 rounded-3xl border-4 border-green-300 dark:border-green-700 p-8 shadow-xl text-center"
          >
            <p className="text-base text-slate-600 dark:text-slate-300 font-semibold mb-3">
              {language === 'ar' ? '📋 رقم طلبك' : '📋 Votre Numéro de Commande'}
            </p>
            <motion.p
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl font-black text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text font-mono"
            >
              {orderDetails.order_number}
            </motion.p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 font-medium">
              ⏰ {orderDetails.created_at}
            </p>
          </motion.div>

          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-slate-800 rounded-3xl border-3 border-blue-300 dark:border-blue-700 p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? '👤 بيانات العميل' : '👤 Informations Client'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">👤 {language === 'ar' ? 'الاسم' : 'Nom'}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{orderDetails.customer_name}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">📱 {language === 'ar' ? 'الهاتف' : 'Téléphone'}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{orderDetails.customer_phone}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">🗺️ {language === 'ar' ? 'الولاية' : 'Wilaya'}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{orderDetails.customer_wilaya}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">{orderDetails.delivery_type === 'bureau' ? '🏢' : '🏠'} {language === 'ar' ? 'نوع التسليم' : 'Livraison'}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {orderDetails.delivery_type === 'bureau' 
                    ? (language === 'ar' ? '🏢 مكتب' : '🏢 Bureau')
                    : (language === 'ar' ? '🏠 منزل' : '🏠 Domicile')
                  }
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-green-200 dark:border-green-700 mt-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">📍 {language === 'ar' ? 'العنوان' : 'Adresse'}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{orderDetails.customer_address}</p>
            </div>
          </motion.div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/30 dark:to-slate-800 rounded-3xl border-3 border-orange-300 dark:border-orange-700 p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? '📦 المنتجات المطلوبة' : '📦 Produits Commandés'}
              </h2>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {orderDetails.items.map((item: any, index: number) => (
                <motion.div
                  key={`${item.product_id}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-orange-200 dark:border-orange-700"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.name}</h3>
                      <div className="flex gap-3 flex-wrap text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {language === 'ar' ? 'الكمية:' : 'Quantité:'} <span className="font-bold text-blue-600 dark:text-blue-400">{item.quantity}</span>
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {language === 'ar' ? 'السعر:' : 'Prix:'} <span className="font-bold text-green-600 dark:text-green-400">{(item.price || 0).toFixed(2)} DZD</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-3 border border-green-300 dark:border-green-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                        {language === 'ar' ? 'المجموع' : 'Total'}
                      </p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {(item.price * item.quantity).toFixed(2)} DZD
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Pricing Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-900 dark:via-emerald-900 dark:to-teal-900 rounded-3xl p-8 text-white shadow-2xl border-4 border-green-400 dark:border-green-700"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <ShoppingCart className="w-7 h-7" />
              {language === 'ar' ? '💰 ملخص الدفع' : '💰 Résumé du Paiement'}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b-2 border-green-400/50">
                <span className="font-semibold text-base">{language === 'ar' ? 'عدد المنتجات:' : 'Nombre articles:'}</span>
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="bg-white/20 text-white font-bold px-4 py-2 rounded-lg"
                >
                  {orderDetails.items.length}
                </motion.span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b-2 border-green-400/50">
                <span className="font-semibold text-base">{language === 'ar' ? 'الكمية الإجمالية:' : 'Quantité totale:'}</span>
                <span className="bg-white/20 font-bold px-4 py-2 rounded-lg">
                  {orderDetails.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b-2 border-green-400/50">
                <span className="font-semibold text-base">{language === 'ar' ? 'المنتجات (بدون توصيل):' : 'Sous-total:'}</span>
                <span className="font-semibold">{orderDetails.subtotal.toFixed(2)} DZD</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b-2 border-green-400/50">
                <span className="font-semibold text-base">{language === 'ar' ? 'رسوم التوصيل:' : 'Frais livraison:'}</span>
                <span className="text-green-100 font-semibold">{orderDetails.delivery_price.toFixed(2)} DZD</span>
              </div>
              <div className="flex justify-between items-baseline gap-4 pt-2">
                <span className="text-2xl font-bold">{language === 'ar' ? 'المجموع النهائي:' : 'TOTAL FINAL:'}</span>
                <div className="text-right">
                  <div className="text-4xl font-black drop-shadow-lg">{orderDetails.total_price.toFixed(2)}</div>
                  <div className="text-lg font-bold">DZD</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delivery Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/30 dark:to-slate-800 rounded-3xl border-3 border-indigo-300 dark:border-indigo-700 p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? '🚚 معلومات التسليم' : '🚚 Infos Livraison'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">🏢 {language === 'ar' ? 'وكالة التسليم' : 'Agence'}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{orderDetails.delivery_agency_name}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">📦 {language === 'ar' ? 'نوع التسليم' : 'Type livraison'}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {orderDetails.delivery_type === 'bureau' 
                    ? (language === 'ar' ? '🏢 من المكتب' : '🏢 Au Bureau')
                    : (language === 'ar' ? '🏠 للمنزل' : '🏠 À Domicile')
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Continue Shopping Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinueShopping}
              className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold py-4 md:py-5 rounded-2xl text-lg transition-all duration-200 shadow-xl flex items-center justify-center gap-3 group"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </motion.div>
              {language === 'ar' ? '🛒 استمرار التسوق' : '🛒 Continuer les Achats'}
            </motion.button>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
              {language === 'ar' ? '✨ تصفح المزيد من المنتجات والعروض الحصرية' : '✨ Découvrez d\'autres produits et offres'}
            </p>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-slate-800 rounded-3xl border-3 border-yellow-300 dark:border-yellow-700 p-6 text-center"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
              ❓ {language === 'ar' ? 'هل تحتاج مساعدة؟' : 'Besoin d\'aide?'}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {language === 'ar' 
                ? 'سيتم التواصل معك قريباً عبر رقم الهاتف المسجل للتأكيد والتفاصيل الإضافية'
                : 'Nous vous contacterons sur le numéro fourni pour confirmer et discuter des détails'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ⏱️ {language === 'ar' ? 'يرجى الانتظار من فضلك...' : 'Veuillez attendre...'}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header - Fixed/Sticky with Navy Bar */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 backdrop-blur-xl border-b-4 border-blue-600 dark:border-blue-500 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/website-shop')}
            className="hover:bg-blue-700/50 dark:hover:bg-blue-900/50 rounded-lg h-10 w-10 p-0 flex-shrink-0 flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <motion.h1 
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-2xl md:text-3xl font-black text-white drop-shadow-lg truncate"
            >
              🛒 {language === 'ar' ? 'سلتي' : 'Mon Panier'}
            </motion.h1>
            <p className="text-xs md:text-sm text-blue-100">{language === 'ar' ? '✨ اكمل تسوقك بكل سهولة' : '✨ Finalisez votre commande'}</p>
          </div>
          {itemCount > 0 && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-sm md:text-base px-4 py-2 rounded-full shadow-lg flex-shrink-0 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              <span>{itemCount}</span>
            </motion.div>
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

                {/* Pricing Breakdown */}
                <div className="space-y-2 md:space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center text-green-100 text-sm md:text-base">
                    <span className="font-semibold">{language === 'ar' ? 'المنتجات:' : 'Sous-total:'}</span>
                    <span className="font-bold">{total.toFixed(2)} {language === 'ar' ? 'دج' : 'DZD'}</span>
                  </div>

                  {/* Delivery Fee */}
                  {deliveryAgencies.length > 0 && (
                    <div className="flex justify-between items-center text-green-100 text-sm md:text-base">
                      <span className="font-semibold">
                        {language === 'ar' ? '🚚 التسليم:' : '🚚 Livraison:'}
                      </span>
                      <span className="font-bold">
                        {deliveryPrice.toFixed(2)} {language === 'ar' ? 'دج' : 'DZD'}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="my-2 md:my-3 border-t border-green-400" />

                  {/* Total */}
                  <div className="flex justify-between items-center text-green-50">
                    <span className="text-base md:text-lg font-bold">{language === 'ar' ? 'المجموع النهائي:' : 'TOTAL:'}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl md:text-4xl font-bold">{finalTotal.toFixed(2)}</span>
                      <span className="text-xl md:text-2xl font-bold">{language === 'ar' ? 'دج' : 'DZD'}</span>
                    </div>
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
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <Input
                          name="client_name"
                          placeholder={language === 'ar' ? 'أدخل اسمك' : 'Entrez votre nom'}
                          value={formData.client_name}
                          onChange={handleFormChange}
                          className="border border-blue-200 dark:border-blue-700 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm"
                          required
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleOpenTestimonials}
                        disabled={!formData.client_name.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-3 md:px-4 py-2 rounded-lg flex items-center gap-1 md:gap-2 whitespace-nowrap text-xs md:text-sm h-10"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">{language === 'ar' ? 'آرائي' : 'Mes avis'}</span>
                        <span className="sm:hidden">💬</span>
                      </motion.button>
                    </div>
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

                  {/* Delivery Agency Selection */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <Truck className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                      {language === 'ar' ? '🏢 وكالة التسليم *' : '🏢 Agence de Livraison *'}
                    </label>
                    {formData.client_wilaya ? (
                      <Select value={formData.delivery_agency_id} onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_agency_id: value }))}>
                        <SelectTrigger className="border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm bg-blue-50 dark:bg-blue-900/20">
                          <SelectValue placeholder={language === 'ar' ? 'اختر وكالة التسليم' : 'Choisir une agence'} />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryAgencies.map(agency => (
                            <SelectItem key={agency.id} value={agency.id}>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">{agency.name}</span>
                                <span className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-1">
                                  {formData.delivery_type === 'bureau' ? '🏢' : '🏠'} {deliveryPrice.toFixed(2)} DZD
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="border-2 border-orange-300 dark:border-orange-600 rounded-lg p-3 bg-orange-50 dark:bg-orange-900/20">
                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {language === 'ar' ? '⚠️ اختر الولاية أولاً لعرض أسعار التسليم' : '⚠️ Choisissez d\'abord une wilaya'}
                        </p>
                      </div>
                    )}
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

      {/* ========== TESTIMONIALS MODAL ========== */}
      <Dialog open={showTestimonialsModal} onOpenChange={setShowTestimonialsModal}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-2 border-blue-300 dark:border-blue-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              {language === 'ar' ? '💬 آرائي' : '💬 Mes avis'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? `آرائك من ${formData.client_name} - يمكنك تعديل أو حذف أي رأي`
                : `Vos avis de ${formData.client_name} - Modifier ou supprimer`
              }
            </DialogDescription>
          </DialogHeader>

          {/* Testimonials List */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto py-4">
            {loadingTestimonials ? (
              <div className="text-center py-8">
                <p className="text-slate-500">{language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}</p>
              </div>
            ) : userTestimonials.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">
                  {language === 'ar' ? 'لا توجد آراء حالياً' : 'Aucun avis pour le moment'}
                </p>
                <Button
                  onClick={() => { setShowTestimonialsModal(false); setShowTestimonialForm(true); }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إضافة رأي' : 'Ajouter un avis'}
                </Button>
              </div>
            ) : (
              userTestimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3"
                >
                  {/* Header with Stars and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < (testimonial.rating || 5) ? 'text-lg' : 'text-lg opacity-30'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      {testimonial.is_approved && (
                        <Badge className="bg-green-500 text-white text-xs">✅ {language === 'ar' ? 'موافق عليه' : 'Approuvé'}</Badge>
                      )}
                      {!testimonial.is_approved && (
                        <Badge className="bg-yellow-500 text-white text-xs">⏳ {language === 'ar' ? 'قيد المراجعة' : 'En attente'}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(testimonial.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                    </span>
                  </div>

                  {/* Opinion Text */}
                  <p className="text-slate-700 dark:text-slate-300 text-sm">"{testimonial.opinion}"</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleEditTestimonial(testimonial)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold h-9 text-sm rounded-lg flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      {language === 'ar' ? 'تعديل' : 'Modifier'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteTestimonial(testimonial.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-9 text-sm rounded-lg flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      {language === 'ar' ? 'حذف' : 'Supprimer'}
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setShowTestimonialsModal(false)}
              className="bg-slate-500 hover:bg-slate-600 text-white font-bold"
            >
              {language === 'ar' ? 'إغلاق' : 'Fermer'}
            </Button>
            <Button
              onClick={() => { setShowTestimonialsModal(false); setShowTestimonialForm(true); }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'رأي جديد' : 'Nouvel avis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== TESTIMONIAL FORM DIALOG ========== */}
      <Dialog open={showTestimonialForm} onOpenChange={setShowTestimonialForm}>
        <DialogContent className="max-w-md bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-2 border-blue-300 dark:border-blue-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              {editingTestimonial 
                ? (language === 'ar' ? '✏️ تعديل الرأي' : '✏️ Modifier l\'avis')
                : (language === 'ar' ? '➕ رأي جديد' : '➕ Nouvel avis')
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Rating Selector */}
            <div>
              <Label className="font-bold mb-2 block">
                ⭐ {language === 'ar' ? 'التقييم' : 'Note'}
              </Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setTestimonialRating(star)}
                    className="text-3xl transition-transform hover:scale-125"
                  >
                    {star <= testimonialRating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {/* Opinion Text Area */}
            <div>
              <Label className="font-bold mb-2 block">
                💬 {language === 'ar' ? 'رأيك' : 'Votre avis'}
              </Label>
              <textarea
                value={testimonialOpinion}
                onChange={(e) => setTestimonialOpinion(e.target.value)}
                placeholder={language === 'ar' ? 'شارك رأيك هنا...' : 'Partagez votre avis ici...'}
                className="w-full border-2 border-blue-300 dark:border-blue-600 rounded-lg p-3 dark:bg-slate-700 dark:text-white text-sm min-h-[100px] focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                {testimonialOpinion.length} {language === 'ar' ? 'حرف' : 'caractères'}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                setShowTestimonialForm(false);
                setEditingTestimonial(null);
                setTestimonialOpinion('');
                setTestimonialRating(5);
              }}
              disabled={submittingTestimonial}
              className="bg-slate-500 hover:bg-slate-600 text-white font-bold"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button
              onClick={handleSubmitTestimonial}
              disabled={submittingTestimonial || !testimonialOpinion.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {submittingTestimonial ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {language === 'ar' ? 'جاري...' : 'Envoi...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {language === 'ar' ? 'إرسال' : 'Envoyer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
