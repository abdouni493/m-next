import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMunicipalitiesForWilaya, getAllWilayas } from '@/data/algerian-municipalities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { createOrderREST, getVisibleDeliveryAgencies, getDeliveryPriceForWilaya, getTestimonialsByName, createTestimonial, updateTestimonial, deleteTestimonial } from '@/lib/supabaseClient';
import { ArrowLeft, Trash2, ShoppingCart, Check, MapPin, User, Package, Truck, MessageSquare, Edit2, Plus, AlertCircle, X, Zap } from 'lucide-react';
import GlowCard from '@/components/website/GlowCard';

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

const ALGERIAN_WILAYAS = getAllWilayas();

const inputStyle = {
  background: '#0F172A',
  color: '#F1F5F9',
  border: '1px solid rgba(0,212,255,0.15)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};

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

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_wilaya: '',
    client_municipality: '',
    delivery_agency_id: '',
    delivery_type: 'domicile',
  });

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    const fetchAgencies = async () => {
      try {
        const agencies = await getVisibleDeliveryAgencies();
        setDeliveryAgencies(agencies || []);
        if (agencies && agencies.length > 0) {
          setFormData(prev => ({ ...prev, delivery_agency_id: agencies[0].id }));
        }
      } catch (error) { console.error('Error fetching delivery agencies:', error); }
    };
    fetchAgencies();
  }, []);

  const handleRemoveItem = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.product_id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    const updatedCart = cartItems.map(item => item.product_id === productId ? { ...item, quantity } : item);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const loadUserTestimonials = async (clientName: string) => {
    if (!clientName.trim()) return;
    setLoadingTestimonials(true);
    try {
      const testimonials = await getTestimonialsByName(clientName);
      setUserTestimonials(testimonials || []);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast({ title: language === 'ar' ? 'خطأ' : 'Erreur', description: language === 'ar' ? 'فشل في تحميل آرائك' : 'Impossible de charger vos avis', variant: 'destructive' });
    } finally { setLoadingTestimonials(false); }
  };

  const handleOpenTestimonials = async () => {
    if (formData.client_name.trim()) {
      await loadUserTestimonials(formData.client_name);
      setShowTestimonialsModal(true);
    } else {
      toast({ title: language === 'ar' ? 'تنبيه' : 'Attention', description: language === 'ar' ? 'الرجاء إدخال اسمك أولاً' : 'Veuillez d\'abord entrer votre nom', variant: 'destructive' });
    }
  };

  const handleSubmitTestimonial = async () => {
    if (!testimonialOpinion.trim()) {
      toast({ title: language === 'ar' ? 'تنبيه' : 'Attention', description: language === 'ar' ? 'الرجاء إدخال رأيك' : 'Veuillez entrer votre avis', variant: 'destructive' });
      return;
    }
    setSubmittingTestimonial(true);
    try {
      if (editingTestimonial) {
        await updateTestimonial(editingTestimonial.id, testimonialOpinion, testimonialRating);
        toast({ title: '✅', description: language === 'ar' ? 'تم تحديث رأيك' : 'Avis mis à jour' });
      } else {
        await createTestimonial(formData.client_name, testimonialOpinion, testimonialRating);
        toast({ title: '✅', description: language === 'ar' ? 'تم استقبال رأيك' : 'Avis enregistré' });
      }
      setTestimonialOpinion(''); setTestimonialRating(5); setEditingTestimonial(null); setShowTestimonialForm(false);
      await loadUserTestimonials(formData.client_name);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast({ title: language === 'ar' ? 'خطأ' : 'Erreur', description: language === 'ar' ? 'فشل في إرسال الرأي' : 'Erreur lors de l\'envoi', variant: 'destructive' });
    } finally { setSubmittingTestimonial(false); }
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialOpinion(testimonial.opinion);
    setTestimonialRating(testimonial.rating || 5);
    setShowTestimonialForm(true);
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (!confirm(language === 'ar' ? 'هل تريد حذف هذا الرأي؟' : 'Êtes-vous sûr?')) return;
    try {
      await deleteTestimonial(testimonialId);
      toast({ title: '✅', description: language === 'ar' ? 'تم حذف رأيك' : 'Avis supprimé' });
      await loadUserTestimonials(formData.client_name);
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({ title: language === 'ar' ? 'خطأ' : 'Erreur', description: language === 'ar' ? 'فشل في حذف الرأي' : 'Erreur lors de la suppression', variant: 'destructive' });
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const selectedAgency = deliveryAgencies.find(a => a.id === formData.delivery_agency_id);

  const getDeliveryPrice = async () => {
    if (!selectedAgency) return 0;
    const cacheKey = `${selectedAgency.id}-${formData.client_wilaya}-${formData.delivery_type}`;
    if (deliveryPriceCache.has(cacheKey)) return deliveryPriceCache.get(cacheKey) || 0;
    try {
      if (formData.client_wilaya) {
        const wilayaPrice = await getDeliveryPriceForWilaya(selectedAgency.id, formData.client_wilaya, formData.delivery_type as 'bureau' | 'domicile');
        setDeliveryPriceCache(prev => new Map(prev).set(cacheKey, wilayaPrice));
        return wilayaPrice;
      }
    } catch (error) { console.error('Error fetching wilaya-specific price:', error); }
    const defaultPrice = formData.delivery_type === 'bureau' ? selectedAgency.price_bureau : selectedAgency.price_domicile;
    setDeliveryPriceCache(prev => new Map(prev).set(cacheKey, defaultPrice));
    return defaultPrice;
  };

  const [deliveryPrice, setDeliveryPrice] = useState(0);
  useEffect(() => {
    const updatePrice = async () => { const price = await getDeliveryPrice(); setDeliveryPrice(price); };
    updatePrice();
  }, [selectedAgency?.id, formData.client_wilaya, formData.delivery_type]);

  const finalTotal = total + deliveryPrice;
  const itemCount = cartItems.length;
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinueShopping = () => {
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));
    setOrderPlaced(false); setOrderDetails(null); setCartItems([]);
    navigate('/website-shop');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) { alert(language === 'ar' ? 'السلة فارغة' : 'Votre panier est vide'); return; }
    if (!formData.client_name || !formData.client_phone || !formData.client_wilaya || !formData.client_municipality || !formData.delivery_agency_id) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs obligatoires'); return;
    }
    setLoading(true);
    try {
      const orderData = {
        customer_name: formData.client_name,
        customer_phone: formData.client_phone,
        customer_wilaya: formData.client_wilaya,
        customer_address: `${formData.client_municipality}, ${formData.client_wilaya}`,
        delivery_agency_id: formData.delivery_agency_id,
        delivery_type: formData.delivery_type,
        delivery_price: deliveryPrice,
        status: 'pending',
        total_price: finalTotal,
      };
      const order = await createOrderREST(orderData, cartItems);
      setOrderDetails({
        id: order.id,
        order_number: order.id.substring(0, 8).toUpperCase(),
        customer_name: formData.client_name,
        customer_phone: formData.client_phone,
        customer_wilaya: formData.client_wilaya,
        customer_address: `${formData.client_municipality}, ${formData.client_wilaya}`,
        delivery_agency_name: selectedAgency?.name || '',
        delivery_type: formData.delivery_type,
        items: cartItems,
        subtotal: total,
        delivery_price: deliveryPrice,
        total_price: finalTotal,
        created_at: new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'fr-FR'),
      });
      setOrderPlaced(true);
    } catch (error) {
      console.error('Error placing order:', error);
      alert(language === 'ar' ? 'حدث خطأ في الطلب' : 'Une erreur est survenue');
    } finally { setLoading(false); }
  };

  // ======= SUCCESS SCREEN =======
  if (orderPlaced && orderDetails) {
    return (
      <div style={{ background: '#020817', color: '#F1F5F9', minHeight: '100vh' }} className={isRTL ? 'rtl' : 'ltr'}>
        {/* Confetti particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(20)].map((_, i) => (
            <motion.div key={i}
              initial={{ y: -20, x: `${5 + i * 4.5}vw`, opacity: 0 }}
              animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 3 + (i % 4) * 0.5, delay: i * 0.15, ease: 'linear' }}
              className="absolute w-2 h-2 rounded-sm"
              style={{ background: ['#00D4FF', '#7C3AED', '#FF6B35', '#10B981', '#F59E0B'][i % 5], top: 0 }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 space-y-6">
          {/* Animated check */}
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="flex justify-center"
          >
            <div className="relative w-28 h-28">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full"
                style={{ border: '2px solid transparent', borderTopColor: '#10B981', borderRightColor: '#00D4FF' }}
              />
              <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)' }}>
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Check className="w-12 h-12" style={{ color: '#10B981' }} strokeWidth={3} />
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
            <h1 className="font-grotesk font-black text-3xl mb-2">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #10B981, #00D4FF)' }}>
                🎉 {language === 'ar' ? 'شكراً لطلبك!' : 'Merci pour votre Commande!'}
              </span>
            </h1>
            <p className="text-sm" style={{ color: '#64748B' }}>{language === 'ar' ? 'سيتم التواصل معك قريباً للتأكيد' : 'Nous vous contacterons bientôt pour confirmation'}</p>
          </motion.div>

          {/* Order number */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <GlowCard glowColor="cyan" className="text-center p-6">
              <p className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>📋 {language === 'ar' ? 'رقم الطلب' : 'N° de Commande'}</p>
              <motion.p animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="font-grotesk font-black text-5xl tracking-widest" style={{ color: '#00D4FF' }}>
                {orderDetails.order_number}
              </motion.p>
              <p className="text-xs mt-2" style={{ color: '#64748B' }}>⏰ {orderDetails.created_at}</p>
            </GlowCard>
          </motion.div>

          {/* Customer info */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <GlowCard glowColor="violet" className="p-5">
              <h2 className="font-grotesk font-bold text-base mb-4 flex items-center gap-2" style={{ color: '#7C3AED' }}>
                <User className="w-4 h-4" /> {language === 'ar' ? 'بيانات العميل' : 'Infos Client'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: language === 'ar' ? 'الاسم' : 'Nom', value: orderDetails.customer_name, color: '#7C3AED' },
                  { label: language === 'ar' ? 'الهاتف' : 'Téléphone', value: orderDetails.customer_phone, color: '#00D4FF' },
                  { label: language === 'ar' ? 'الولاية' : 'Wilaya', value: orderDetails.customer_wilaya, color: '#10B981' },
                  { label: language === 'ar' ? 'التسليم' : 'Livraison', value: orderDetails.delivery_type === 'bureau' ? '🏢 Bureau' : '🏠 Domicile', color: '#FF6B35' },
                ].map(info => (
                  <div key={info.label} className="p-3 rounded-xl" style={{ background: 'rgba(30,58,95,0.3)', border: `1px solid ${info.color}22` }}>
                    <p className="text-xs mb-1" style={{ color: '#64748B' }}>{info.label}</p>
                    <p className="font-bold text-sm" style={{ color: info.color }}>{info.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <p className="text-xs mb-1" style={{ color: '#64748B' }}>📍 {language === 'ar' ? 'العنوان' : 'Adresse'}</p>
                <p className="font-bold text-sm" style={{ color: '#10B981' }}>{orderDetails.customer_address}</p>
              </div>
            </GlowCard>
          </motion.div>

          {/* Items */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <GlowCard glowColor="orange" className="p-5">
              <h2 className="font-grotesk font-bold text-base mb-4 flex items-center gap-2" style={{ color: '#FF6B35' }}>
                <Package className="w-4 h-4" /> {language === 'ar' ? 'المنتجات' : 'Produits'} ({orderDetails.items.length})
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {orderDetails.items.map((item: any, idx: number) => (
                  <div key={`${item.product_id}-${idx}`} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(255,107,53,0.1)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#F1F5F9' }}>{item.name}</p>
                      <p className="text-xs" style={{ color: '#64748B' }}>x{item.quantity} × {(item.price || 0).toFixed(2)} DZD</p>
                    </div>
                    <span className="font-grotesk font-bold text-sm" style={{ color: '#FF6B35' }}>{(item.price * item.quantity).toFixed(2)} DZD</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          </motion.div>

          {/* Totals */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(16,185,129,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div className="space-y-2 mb-4 text-sm" style={{ color: '#94A3B8' }}>
                <div className="flex justify-between"><span>{language === 'ar' ? 'المنتجات' : 'Sous-total'}</span><span>{orderDetails.subtotal.toFixed(2)} DZD</span></div>
                <div className="flex justify-between"><span>🚚 {language === 'ar' ? 'التوصيل' : 'Livraison'}</span><span>{orderDetails.delivery_price.toFixed(2)} DZD</span></div>
              </div>
              <div className="flex justify-between items-baseline pt-3" style={{ borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="font-grotesk font-bold text-lg" style={{ color: '#F1F5F9' }}>{language === 'ar' ? 'المجموع النهائي' : 'TOTAL FINAL'}</span>
                <span className="font-grotesk font-black text-3xl" style={{ color: '#10B981' }}>{orderDetails.total_price.toFixed(2)} DZD</span>
              </div>
            </div>
          </motion.div>

          {/* Continue shopping */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(16,185,129,0.3)' }} whileTap={{ scale: 0.98 }}
              onClick={handleContinueShopping}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-grotesk font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
            >
              <ShoppingCart className="w-5 h-5" />
              {language === 'ar' ? '🛒 استمرار التسوق' : '🛒 Continuer les Achats'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ======= MAIN CART =======
  return (
    <div style={{ background: '#020817', color: '#F1F5F9', minHeight: '100vh' }} className={isRTL ? 'rtl' : 'ltr'}>

      {/* Sticky header */}
      <div className="sticky top-0 z-40" style={{ background: 'rgba(2,8,23,0.95)', borderBottom: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/website-shop')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: '#00D4FF' }} />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-grotesk font-black text-xl" style={{ color: '#F1F5F9' }}>
              🛒 {language === 'ar' ? 'سلتي' : 'Mon Panier'}
            </h1>
            <p className="text-xs" style={{ color: '#64748B' }}>{language === 'ar' ? 'اكمل تسوقك' : 'Finalisez votre commande'}</p>
          </div>
          {itemCount > 0 && (
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #EF4444)' }}>
              <ShoppingCart className="w-3.5 h-3.5" /> {itemCount}
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Empty cart */}
        {cartItems.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 rounded-2xl max-w-lg mx-auto"
            style={{ border: '2px dashed rgba(0,212,255,0.1)', background: 'rgba(0,212,255,0.01)' }}>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ShoppingCart className="w-20 h-20 mx-auto mb-4" style={{ color: 'rgba(0,212,255,0.2)' }} />
            </motion.div>
            <h2 className="font-grotesk font-bold text-2xl mb-2" style={{ color: '#64748B' }}>
              {language === 'ar' ? 'سلتك فارغة' : 'Votre panier est vide'}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#1E3A5F' }}>
              {language === 'ar' ? 'ابدأ التسوق واضف منتجات مميزة' : 'Commencez vos achats'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/website-shop/offers')}
                className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}
              >⚡ {language === 'ar' ? 'عروضنا' : 'Nos Offres'}</motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/website-shop/special-offers')}
                className="px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,107,53,0.08)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }}
              >🔥 {language === 'ar' ? 'عروض خاصة' : 'Offres Spéciales'}</motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* Cart items */}
            <div className="xl:col-span-2 space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <Package className="w-5 h-5" style={{ color: '#00D4FF' }} />
                <h2 className="font-grotesk font-bold text-lg" style={{ color: '#F1F5F9' }}>
                  {language === 'ar' ? '📦 المنتجات' : '📦 Produits'} — {itemCount} {language === 'ar' ? 'منتج' : 'article'} · {totalQuantity} {language === 'ar' ? 'وحدة' : 'unité'}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cartItems.map((item, idx) => (
                  <motion.div key={`${item.product_id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                    <GlowCard glowColor="cyan" className="flex flex-col h-full p-4 space-y-3">
                      {/* Image */}
                      <div className="h-36 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(0,212,255,0.04)' }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain p-2" />
                        ) : (
                          <ShoppingCart className="w-10 h-10" style={{ color: 'rgba(0,212,255,0.2)' }} />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-sm line-clamp-2 mb-1" style={{ color: '#F1F5F9' }}>{item.name}</h3>
                        {item.product_mark && <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.15)' }}>🏷️ {item.product_mark}</span>}
                      </div>

                      {/* Specs */}
                      {(item.voltage || item.wattage || item.amperage) && (
                        <div className="flex gap-1.5 flex-wrap">
                          {item.voltage && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.06)', color: '#00D4FF' }}>⚡{item.voltage}V</span>}
                          {item.wattage && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.06)', color: '#F59E0B' }}>💡{item.wattage}W</span>}
                          {item.amperage && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.06)', color: '#7C3AED' }}>🔌{item.amperage}A</span>}
                        </div>
                      )}

                      {/* Price */}
                      <div className="text-center py-2 rounded-xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                        <span className="font-grotesk font-black text-xl" style={{ color: '#F59E0B' }}>{(item.price || 0).toFixed(2)}</span>
                        <span className="text-xs ml-1" style={{ color: '#64748B' }}>DZD</span>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center justify-center gap-2 py-1 rounded-lg" style={{ background: 'rgba(30,58,95,0.4)' }}>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>−</motion.button>
                        <input type="number" value={item.quantity}
                          onChange={e => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          className="w-10 text-center text-sm font-bold bg-transparent outline-none" min="1"
                          style={{ color: '#F1F5F9' }} />
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF' }}>+</motion.button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-grotesk font-bold text-sm" style={{ color: '#F1F5F9' }}>{(item.price * item.quantity).toFixed(2)} DZD</span>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                          <Trash2 className="w-3 h-3" /> {language === 'ar' ? 'حذف' : 'Retirer'}
                        </motion.button>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right panel: summary + form */}
            <div className="space-y-5">
              {/* Summary */}
              <GlowCard glowColor="cyan" className="p-5">
                <h2 className="font-grotesk font-bold text-base mb-4 flex items-center gap-2" style={{ color: '#00D4FF' }}>
                  <Zap className="w-4 h-4" /> {language === 'ar' ? 'الملخص' : 'Résumé'}
                </h2>
                <div className="space-y-2 text-sm mb-4 pb-4" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                  <div className="flex justify-between" style={{ color: '#94A3B8' }}>
                    <span>{language === 'ar' ? 'المنتجات' : 'Articles'}</span><span>{itemCount} ({totalQuantity})</span>
                  </div>
                  <div className="flex justify-between" style={{ color: '#94A3B8' }}>
                    <span>{language === 'ar' ? 'الإجمالي' : 'Sous-total'}</span><span>{total.toFixed(2)} DZD</span>
                  </div>
                  <div className="flex justify-between" style={{ color: '#94A3B8' }}>
                    <span>🚚 {language === 'ar' ? 'التوصيل' : 'Livraison'}</span><span>{deliveryPrice.toFixed(2)} DZD</span>
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-base" style={{ color: '#F1F5F9' }}>TOTAL</span>
                  <div>
                    <span className="font-grotesk font-black text-3xl" style={{ color: '#10B981' }}>{finalTotal.toFixed(2)}</span>
                    <span className="text-sm ml-1" style={{ color: '#64748B' }}>DZD</span>
                  </div>
                </div>
              </GlowCard>

              {/* Form */}
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}>
                  <User className="w-4 h-4" style={{ color: '#7C3AED' }} />
                  <h2 className="font-grotesk font-bold text-base" style={{ color: '#F1F5F9' }}>{language === 'ar' ? '👤 بيانات التسليم' : '👤 Infos Livraison'}</h2>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#64748B' }}>👤 {language === 'ar' ? 'الاسم الكامل *' : 'Nom complet *'}</label>
                  <div className="flex gap-2">
                    <input name="client_name" required placeholder={language === 'ar' ? 'أدخل اسمك' : 'Entrez votre nom'}
                      value={formData.client_name} onChange={handleFormChange}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = '#7C3AED')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.15)')}
                    />
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      type="button" onClick={handleOpenTestimonials} disabled={!formData.client_name.trim()}
                      className="px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1 whitespace-nowrap flex-shrink-0 disabled:opacity-40"
                      style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.2)' }}>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{language === 'ar' ? 'آرائي' : 'Avis'}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#64748B' }}>📱 {language === 'ar' ? 'رقم الهاتف *' : 'Téléphone *'}</label>
                  <input name="client_phone" required placeholder="+213..."
                    value={formData.client_phone} onChange={handleFormChange}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#00D4FF')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.15)')}
                  />
                </div>

                {/* Wilaya */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#64748B' }}>🗺️ {language === 'ar' ? 'الولاية *' : 'Wilaya *'}</label>
                  <Select value={formData.client_wilaya} onValueChange={(v) => setFormData(prev => ({ ...prev, client_wilaya: v, client_municipality: '' }))}>
                    <SelectTrigger style={{ ...inputStyle, cursor: 'pointer' }}>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الولاية' : 'Choisir une wilaya'} />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#0F172A', border: '1px solid rgba(0,212,255,0.15)' }}>
                      {ALGERIAN_WILAYAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Municipality */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#64748B' }}>📍 {language === 'ar' ? 'البلدية *' : 'Commune *'}</label>
                  <Select value={formData.client_municipality} onValueChange={(v) => setFormData(prev => ({ ...prev, client_municipality: v }))} disabled={!formData.client_wilaya}>
                    <SelectTrigger style={{ ...inputStyle, cursor: formData.client_wilaya ? 'pointer' : 'not-allowed', opacity: formData.client_wilaya ? 1 : 0.5 }}>
                      <SelectValue placeholder={!formData.client_wilaya ? (language === 'ar' ? 'اختر ولاية أولاً' : 'Wilaya d\'abord') : (language === 'ar' ? 'اختر بلدية' : 'Choisir commune')} />
                    </SelectTrigger>
                    <SelectContent style={{ background: '#0F172A', border: '1px solid rgba(0,212,255,0.15)' }}>
                      {formData.client_wilaya && getMunicipalitiesForWilaya(formData.client_wilaya).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Delivery agency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1" style={{ color: '#64748B' }}>
                    <Truck className="w-3 h-3" /> {language === 'ar' ? 'وكالة التسليم *' : 'Agence *'}
                  </label>
                  {formData.client_wilaya ? (
                    <Select value={formData.delivery_agency_id} onValueChange={(v) => setFormData(prev => ({ ...prev, delivery_agency_id: v }))}>
                      <SelectTrigger style={{ ...inputStyle, cursor: 'pointer' }}>
                        <SelectValue placeholder={language === 'ar' ? 'اختر الوكالة' : 'Choisir agence'} />
                      </SelectTrigger>
                      <SelectContent style={{ background: '#0F172A', border: '1px solid rgba(0,212,255,0.15)' }}>
                        {deliveryAgencies.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} — {deliveryPrice.toFixed(2)} DZD
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.15)', color: '#FF6B35' }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {language === 'ar' ? 'اختر الولاية أولاً' : 'Choisissez d\'abord une wilaya'}
                    </div>
                  )}
                </div>

                {/* Delivery type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#64748B' }}>🚚 {language === 'ar' ? 'نوع التسليم *' : 'Type de Livraison *'}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'bureau', emoji: '🏢', label: language === 'ar' ? 'مكتب' : 'Bureau', color: '#00D4FF' },
                      { value: 'domicile', emoji: '🏠', label: language === 'ar' ? 'منزل' : 'Domicile', color: '#10B981' },
                    ].map(opt => (
                      <motion.button key={opt.value} whileTap={{ scale: 0.97 }} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, delivery_type: opt.value }))}
                        className="relative p-4 rounded-xl text-center font-semibold text-sm transition-all"
                        style={{
                          background: formData.delivery_type === opt.value ? `${opt.color}12` : 'rgba(30,58,95,0.3)',
                          border: `2px solid ${formData.delivery_type === opt.value ? opt.color : 'rgba(30,58,95,0.6)'}`,
                          color: formData.delivery_type === opt.value ? opt.color : '#64748B',
                        }}
                      >
                        <div className="text-2xl mb-1">{opt.emoji}</div>
                        <div className="text-xs">{opt.label}</div>
                        {formData.delivery_type === opt.value && (
                          <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5" style={{ color: opt.color }} />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <motion.button type="submit" disabled={loading}
                  whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 24px rgba(0,212,255,0.3)' } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-grotesk font-bold text-white text-base disabled:opacity-60"
                  style={{ background: loading ? 'rgba(30,58,95,0.5)' : 'linear-gradient(135deg, #00D4FF, #7C3AED)' }}
                >
                  {loading ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}
                      className="w-5 h-5 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                      {language === 'ar' ? 'جاري...' : 'Traitement...'}</>
                  ) : (
                    <><Check className="w-5 h-5" /> {language === 'ar' ? '✅ تأكيد الطلب' : '✅ Confirmer'}</>
                  )}
                </motion.button>

                <p className="text-center text-xs" style={{ color: '#1E3A5F' }}>🔒 {language === 'ar' ? 'بيانات آمنة' : 'Données sécurisées'}</p>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Testimonials modal */}
      <AnimatePresence>
        {showTestimonialsModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTestimonialsModal(false)}
              className="fixed inset-0 z-40" style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(6px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[560px] z-50 rounded-2xl flex flex-col overflow-hidden"
              style={{ background: '#0F172A', border: '1px solid rgba(124,58,237,0.25)', maxHeight: '80vh' }}>
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" style={{ color: '#7C3AED' }} />
                  <h2 className="font-grotesk font-bold text-lg" style={{ color: '#F1F5F9' }}>{language === 'ar' ? '💬 آرائي' : '💬 Mes avis'}</h2>
                </div>
                <button onClick={() => setShowTestimonialsModal(false)} style={{ color: '#64748B' }}><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingTestimonials ? (
                  <div className="text-center py-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 rounded-full mx-auto" style={{ border: '2px solid rgba(124,58,237,0.1)', borderTopColor: '#7C3AED' }} />
                  </div>
                ) : userTestimonials.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm mb-4" style={{ color: '#64748B' }}>{language === 'ar' ? 'لا توجد آراء' : 'Aucun avis'}</p>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { setShowTestimonialsModal(false); setShowTestimonialForm(true); }}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold mx-auto"
                      style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.2)' }}>
                      <Plus className="w-4 h-4" /> {language === 'ar' ? 'إضافة رأي' : 'Ajouter un avis'}
                    </motion.button>
                  </div>
                ) : userTestimonials.map(t => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(124,58,237,0.12)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <span key={i} className={i < (t.rating || 5) ? '' : 'opacity-20'}>⭐</span>)}</div>
                      <div className="flex items-center gap-2">
                        {t.is_approved ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>✅</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>⏳</span>}
                        <span className="text-xs" style={{ color: '#64748B' }}>{new Date(t.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>"{t.opinion}"</p>
                    <div className="flex gap-2 pt-1">
                      <motion.button whileHover={{ scale: 1.03 }} onClick={() => handleEditTestimonial(t)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(0,212,255,0.08)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.15)' }}>
                        <Edit2 className="w-3 h-3" /> {language === 'ar' ? 'تعديل' : 'Modifier'}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.03 }} onClick={() => handleDeleteTestimonial(t.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <Trash2 className="w-3 h-3" /> {language === 'ar' ? 'حذف' : 'Supprimer'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-3 p-5" style={{ borderTop: '1px solid rgba(124,58,237,0.12)' }}>
                <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowTestimonialsModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(30,58,95,0.5)', color: '#94A3B8' }}>
                  {language === 'ar' ? 'إغلاق' : 'Fermer'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} onClick={() => { setShowTestimonialsModal(false); setShowTestimonialForm(true); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}>
                  <Plus className="w-4 h-4" /> {language === 'ar' ? 'رأي جديد' : 'Nouvel avis'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Testimonial form modal */}
      <AnimatePresence>
        {showTestimonialForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTestimonialForm(false)}
              className="fixed inset-0 z-40" style={{ background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(6px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-96 z-50 rounded-2xl overflow-hidden"
              style={{ background: '#0F172A', border: '1px solid rgba(124,58,237,0.25)' }}>
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" style={{ color: '#7C3AED' }} />
                  <h2 className="font-grotesk font-bold text-base" style={{ color: '#F1F5F9' }}>
                    {editingTestimonial ? (language === 'ar' ? 'تعديل الرأي' : 'Modifier l\'avis') : (language === 'ar' ? 'رأي جديد' : 'Nouvel avis')}
                  </h2>
                </div>
                <button onClick={() => setShowTestimonialForm(false)} style={{ color: '#64748B' }}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: '#64748B' }}>⭐ {language === 'ar' ? 'التقييم' : 'Note'}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setTestimonialRating(star)} className="text-2xl transition-transform hover:scale-110">
                        {star <= testimonialRating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: '#64748B' }}>💬 {language === 'ar' ? 'رأيك' : 'Votre avis'}</label>
                  <textarea value={testimonialOpinion} onChange={e => setTestimonialOpinion(e.target.value)}
                    placeholder={language === 'ar' ? 'شارك رأيك...' : 'Partagez votre avis...'}
                    rows={4} className="w-full rounded-xl p-3 text-sm resize-none outline-none"
                    style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid rgba(124,58,237,0.2)' }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>{testimonialOpinion.length} {language === 'ar' ? 'حرف' : 'caractères'}</p>
                </div>
              </div>
              <div className="flex gap-3 p-5" style={{ borderTop: '1px solid rgba(124,58,237,0.12)' }}>
                <motion.button whileHover={{ scale: 1.02 }} disabled={submittingTestimonial}
                  onClick={() => { setShowTestimonialForm(false); setEditingTestimonial(null); setTestimonialOpinion(''); setTestimonialRating(5); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(30,58,95,0.5)', color: '#94A3B8' }}>
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitTestimonial} disabled={submittingTestimonial || !testimonialOpinion.trim()}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}>
                  {submittingTestimonial ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}
                      className="w-4 h-4 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  ) : <><Check className="w-4 h-4" /> {language === 'ar' ? 'إرسال' : 'Envoyer'}</>}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
