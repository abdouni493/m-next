import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Tag,
  MessageSquare,
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Upload,
  Facebook,
  Instagram,
  MapPin,
  Phone,
  MessageCircle,
  Send,
  Globe,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase, getProducts, getWebsiteSettings, updateWebsiteSettings, getOffers, createOffer, updateOffer, deleteOffer, getSpecialOffers, createSpecialOffer, updateSpecialOffer, deleteSpecialOffer, getApprovedTestimonials, createTestimonial, deleteTestimonial } from '@/lib/supabaseClient';

interface Product {
  id: string;
  name: string;
  primary_image?: string;
  mark?: { id: string; name: string };
  description?: string;
  selling_price: number;
  voltage?: number;
  wattage?: number;
  amperage?: number;
}

interface Offer {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_mark?: string;
  product_description?: string;
  original_price: number;
  offer_price: number;
  description?: string;
  discount_percentage: number;
  is_visible: boolean;
}

interface SpecialOffer {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_mark?: string;
  product_description?: string;
  original_price: number;
  special_price: number;
  description?: string;
  discount_percentage: number;
  is_visible: boolean;
}

interface WebsiteSettings {
  store_name: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
  landing_page_image_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  snapchat_url?: string;
  location?: string;
  phone_number?: string;
  whatsapp_number?: string;
  telegram_number?: string;
}

interface Testimonial {
  id: string;
  client_name: string;
  opinion: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export default function Website() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  // Tabs
  const [activeTab, setActiveTab] = useState<'offers' | 'special' | 'contacts' | 'settings'>('offers');

  // Common
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Offers
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedProductOffer, setSelectedProductOffer] = useState<Product | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerDescription, setOfferDescription] = useState<string>('');
  const [showCreateOfferDialog, setShowCreateOfferDialog] = useState(false);
  const [showDeleteOfferDialog, setShowDeleteOfferDialog] = useState(false);
  const [selectedOfferDelete, setSelectedOfferDelete] = useState<string | null>(null);

  // Special Offers
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [selectedProductSpecial, setSelectedProductSpecial] = useState<Product | null>(null);
  const [editingSpecialOffer, setEditingSpecialOffer] = useState<SpecialOffer | null>(null);
  const [specialPrice, setSpecialPrice] = useState<string>('');
  const [originalPriceSpecial, setOriginalPriceSpecial] = useState<number>(0);
  const [discountAmountSpecial, setDiscountAmountSpecial] = useState<number>(0);
  const [discountPercentSpecial, setDiscountPercentSpecial] = useState<number>(0);
  const [specialOfferDescription, setSpecialOfferDescription] = useState<string>('');
  const [showCreateSpecialDialog, setShowCreateSpecialDialog] = useState(false);
  const [showDeleteSpecialDialog, setShowDeleteSpecialDialog] = useState(false);
  const [selectedSpecialDelete, setSelectedSpecialDelete] = useState<string | null>(null);

  // Website Settings
  const [settings, setSettings] = useState<WebsiteSettings>({
    store_name: '',
    slogan: '',
    description: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [landingPageImagePreview, setLandingPageImagePreview] = useState<string>('');
  const [landingPageImageFile, setLandingPageImageFile] = useState<File | null>(null);

  // Testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialName, setTestimonialName] = useState('');
  const [testimonialOpinion, setTestimonialOpinion] = useState('');
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [showDeleteTestimonialDialog, setShowDeleteTestimonialDialog] = useState(false);
  const [selectedTestimonialDelete, setSelectedTestimonialDelete] = useState<string | null>(null);

  // Dialogs
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [selectedOfferDetails, setSelectedOfferDetails] = useState<Offer | null>(null);
  const [showSpecialDetails, setShowSpecialDetails] = useState(false);
  const [selectedSpecialDetails, setSelectedSpecialDetails] = useState<SpecialOffer | null>(null);


  // Loading states
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
    fetchTestimonials();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsData, offersData, specialOffersData, settingsData] = await Promise.all([
        getProducts(),
        getOffers(),
        getSpecialOffers(),
        getWebsiteSettings(),
      ]);

      setProducts(productsData || []);
      setOffers(offersData || []);
      setSpecialOffers(specialOffersData || []);
      setSettings(settingsData || {
        store_name: '',
        slogan: '',
        description: '',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل البيانات' : 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestimonials = async () => {
    setLoadingTestimonials(true);
    try {
      console.log('🔍 Fetching approved testimonials...');
      const data = await getApprovedTestimonials();
      console.log('✅ Testimonials fetched:', data);
      setTestimonials(data || []);
    } catch (error) {
      console.error('❌ Error fetching testimonials:', error);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const handleSubmitTestimonial = async () => {
    if (!testimonialName.trim() || !testimonialOpinion.trim()) {
      toast({
        title: language === 'ar' ? '⚠️ تنبيه' : '⚠️ Attention',
        description: language === 'ar' ? 'يجب ملء جميع الحقول' : 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingTestimonial(true);
    try {
      await createTestimonial(testimonialName, testimonialOpinion, testimonialRating);
      
      toast({
        title: language === 'ar' ? '✅ شكراً!' : '✅ Merci!',
        description: language === 'ar' ? '✅ تم استقبال تعليقك بنجاح! سيتم عرضه بعد مراجعة الإدارة' : '✅ Votre avis a été reçu! Il apparaîtra après approbation de l\'administrateur.',
      });

      // Reset form
      setTestimonialName('');
      setTestimonialOpinion('');
      setTestimonialRating(5);
      setShowTestimonialDialog(false);
      
      // Reload testimonials
      await fetchTestimonials();
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إرسال التعليق' : 'Erreur lors de l\'envoi',
        variant: 'destructive',
      });
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  const handleDeleteTestimonial = async () => {
    if (!selectedTestimonialDelete) return;

    try {
      await deleteTestimonial(selectedTestimonialDelete);
      toast({
        title: language === 'ar' ? '✅ تم' : '✅ Succès',
        description: language === 'ar' ? 'تم حذف الرأي' : 'Avis supprimé',
      });
      setShowDeleteTestimonialDialog(false);
      setSelectedTestimonialDelete(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف الرأي' : 'Impossible de supprimer l\'avis',
        variant: 'destructive',
      });
    }
  };

  // Filtered products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mark?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ========== OFFERS FUNCTIONS ==========
  const handleSelectProductOffer = (product: Product) => {
    setSelectedProductOffer(product);
    setOfferPrice(product.selling_price.toString());
    setOfferDescription('');
  };

  const handleCreateOffer = async () => {
    if (!selectedProductOffer && !editingOffer) return;

    try {
      if (editingOffer) {
        // Edit existing offer
        await updateOffer(editingOffer.id, {
          offer_price: parseFloat(offerPrice),
          description: offerDescription,
        });
        toast({
          title: language === 'ar' ? '✅ تم' : '✅ Succès',
          description: language === 'ar' ? 'تم تحديث العرض' : 'Offre mise à jour',
        });
      } else if (selectedProductOffer) {
        // Create new offer
        const newOffer = {
          product_id: selectedProductOffer.id,
          product_name: selectedProductOffer.name,
          product_image: selectedProductOffer.primary_image,
          product_mark: selectedProductOffer.mark?.name,
          product_description: selectedProductOffer.description,
          original_price: selectedProductOffer.selling_price,
          offer_price: parseFloat(offerPrice),
          description: offerDescription,
        };

        await createOffer(newOffer);
        toast({
          title: language === 'ar' ? '✅ تم' : '✅ Succès',
          description: language === 'ar' ? 'تم إنشاء العرض بنجاح' : 'Offre créée avec succès',
        });
      }

      // Reset
      setSelectedProductOffer(null);
      setEditingOffer(null);
      setOfferPrice('');
      setOfferDescription('');
      setShowCreateOfferDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error creating/updating offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إنشاء/تحديث العرض' : 'Impossible de créer/mettre à jour l\'offre',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOffer = async () => {
    if (!selectedOfferDelete) return;

    try {
      await deleteOffer(selectedOfferDelete);
      toast({
        title: language === 'ar' ? '✅ تم' : '✅ Succès',
        description: language === 'ar' ? 'تم حذف العرض' : 'Offre supprimée',
      });
      setShowDeleteOfferDialog(false);
      setSelectedOfferDelete(null);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف العرض' : 'Impossible de supprimer l\'offre',
        variant: 'destructive',
      });
    }
  };

  const handleToggleOfferVisibility = async (offer: Offer) => {
    try {
      await updateOffer(offer.id, { is_visible: !offer.is_visible });
      toast({
        title: language === 'ar' ? '✅ تم' : '✅ Succès',
        description: language === 'ar' ? 'تم تحديث الحالة' : 'Statut mis à jour',
      });
      fetchAllData();
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  const copyOfferLink = (offer: Offer) => {
    const link = `${window.location.origin}/order?product_id=${offer.product_id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: language === 'ar' ? '📋 تم النسخ' : '📋 Copié',
      description: language === 'ar' ? 'تم نسخ الرابط - سيتم تحديد المنتج تلقائياً عند فتحه' : 'Lien copié - Le produit sera sélectionné automatiquement',
    });
  };

  // ========== SPECIAL OFFERS FUNCTIONS ==========
  const handleSelectProductSpecial = (product: Product) => {
    setSelectedProductSpecial(product);
    setOriginalPriceSpecial(product.selling_price);
    setSpecialPrice(product.selling_price.toString());
  };

  const handleSpecialPriceChange = (newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      setSpecialPrice(newPrice);
      const discount = originalPriceSpecial - price;
      const percentage = (discount / originalPriceSpecial) * 100;
      setDiscountAmountSpecial(parseFloat(discount.toFixed(2)));
      setDiscountPercentSpecial(parseFloat(percentage.toFixed(2)));
    }
  };

  const handleCreateSpecialOffer = async () => {
    if (!selectedProductSpecial && !editingSpecialOffer) return;

    try {
      if (editingSpecialOffer) {
        // Edit existing special offer
        await updateSpecialOffer(editingSpecialOffer.id, {
          special_price: parseFloat(specialPrice),
          original_price: originalPriceSpecial,
          description: specialOfferDescription,
        });
        toast({
          title: language === 'ar' ? '✅ تم' : '✅ Succès',
          description: language === 'ar' ? 'تم تحديث العرض الخاص' : 'Offre spéciale mise à jour',
        });
      } else if (selectedProductSpecial) {
        // Create new special offer
        const newSpecialOffer = {
          product_id: selectedProductSpecial.id,
          product_name: selectedProductSpecial.name,
          product_image: selectedProductSpecial.primary_image,
          product_mark: selectedProductSpecial.mark?.name,
          product_description: selectedProductSpecial.description,
          original_price: originalPriceSpecial,
          special_price: parseFloat(specialPrice),
          description: specialOfferDescription,
        };

        await createSpecialOffer(newSpecialOffer);
        toast({
          title: language === 'ar' ? '✅ تم' : '✅ Succès',
          description: language === 'ar' ? 'تم إنشاء العرض الخاص' : 'Offre spéciale créée avec succès',
        });
      }

      // Reset
      setSelectedProductSpecial(null);
      setEditingSpecialOffer(null);
      setSpecialPrice('');
      setSpecialOfferDescription('');
      setShowCreateSpecialDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error creating/updating special offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSpecialOffer = async () => {
    if (!selectedSpecialDelete) return;

    try {
      await deleteSpecialOffer(selectedSpecialDelete);
      toast({
        title: language === 'ar' ? '✅ تم' : '✅ Succès',
        description: language === 'ar' ? 'تم حذف العرض الخاص' : 'Offre spéciale supprimée',
      });
      setShowDeleteSpecialDialog(false);
      setSelectedSpecialDelete(null);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting special offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSpecialVisibility = async (offer: SpecialOffer) => {
    try {
      await updateSpecialOffer(offer.id, { is_visible: !offer.is_visible });
      toast({
        title: language === 'ar' ? '✅ تم' : '✅ Succès',
      });
      fetchAllData();
    } catch (error) {
      console.error('Error updating special offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  const copySpecialLink = (offer: SpecialOffer) => {
    const link = `${window.location.origin}/order?product_id=${offer.product_id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: language === 'ar' ? '📋 تم النسخ' : '📋 Copié',
      description: language === 'ar' ? 'تم نسخ الرابط - سيتم تحديد المنتج تلقائياً عند فتحه' : 'Lien copié - Le produit sera sélectionné automatiquement',
    });
  };

  // ========== SETTINGS FUNCTIONS ==========
  const handleLogoUpload = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLandingPageImageUpload = (file: File) => {
    setLandingPageImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLandingPageImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    try {
      const settingsToUpdate: any = {
        store_name: settings.store_name || 'Mon Magasin',
        slogan: settings.slogan,
        description: settings.description,
        facebook_url: settings.facebook_url,
        instagram_url: settings.instagram_url,
        tiktok_url: settings.tiktok_url,
        snapchat_url: settings.snapchat_url,
        location: settings.location,
        phone_number: settings.phone_number,
        whatsapp_number: settings.whatsapp_number,
        telegram_number: settings.telegram_number,
        updated_at: new Date().toISOString(),
      };

      // Upload logo if changed
      if (logoFile) {
        try {
          const fileName = `logo_${Date.now()}_${logoFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from('chargers')
            .upload(fileName, logoFile);

          if (uploadError) {
            console.warn('Storage upload warning:', uploadError);
          } else {
            const { data: publicUrl } = supabase.storage
              .from('chargers')
              .getPublicUrl(fileName);

            if (publicUrl?.publicUrl) {
              settingsToUpdate.logo_url = publicUrl.publicUrl;
            }
          }
        } catch (storageError) {
          console.warn('Storage error (continuing):', storageError);
        }
      }

      // Upload landing page image if changed
      if (landingPageImageFile) {
        try {
          const fileName = `landing_bg_${Date.now()}_${landingPageImageFile.name}`;
          const { error: uploadError } = await supabase.storage
            .from('chargers')
            .upload(fileName, landingPageImageFile);

          if (uploadError) {
            console.warn('Storage upload warning:', uploadError);
          } else {
            const { data: publicUrl } = supabase.storage
              .from('chargers')
              .getPublicUrl(fileName);

            if (publicUrl?.publicUrl) {
              settingsToUpdate.landing_page_image_url = publicUrl.publicUrl;
            }
          }
        } catch (storageError) {
          console.warn('Storage error (continuing):', storageError);
        }
      }

      const result = await updateWebsiteSettings(settingsToUpdate);
      
      if (result) {
        setSettings(result);
      }

      toast({
        title: language === 'ar' ? '✅ تم' : '✅ Succès',
        description: language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Paramètres sauvegardés avec succès',
      });
      setLogoFile(null);
      setLogoPreview('');
      setLandingPageImageFile(null);
      setLandingPageImagePreview('');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      let errorMsg = language === 'ar' ? 'فشل في حفظ الإعدادات' : 'Erreur lors de la sauvegarde';
      
      if (error?.message?.includes('Bucket not found')) {
        errorMsg = language === 'ar' ? 'قاعدة البيانات غير موجودة. تم حفظ الإعدادات بدون صورة' : 'Bucket non trouvé. Paramètres sauvegardés sans image';
      }
      
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6 ${
        isRTL ? 'rtl' : 'ltr'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* ========== HEADER ========== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-cover shadow-lg" />
            ) : (
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                <Globe className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {settings.store_name || (language === 'ar' ? '🌐 إدارة الموقع' : '🌐 Gestion Web')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {settings.slogan || (language === 'ar' ? 'تحكم كامل في عروضك والتواصل' : 'Contrôle complet de vos offres')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ========== TABS NAVIGATION ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 mb-8 flex-wrap"
        >
          {[
            { id: 'offers' as const, label: language === 'ar' ? 'العروض' : 'Offres', icon: '🎁', color: 'from-blue-500 to-cyan-500' },
            { id: 'special' as const, label: language === 'ar' ? 'عروض خاصة' : 'Spéciales', icon: '⭐', color: 'from-purple-500 to-pink-500' },
            { id: 'contacts' as const, label: language === 'ar' ? 'التواصل' : 'Contacts', icon: '📱', color: 'from-green-500 to-teal-500' },
            { id: 'settings' as const, label: language === 'ar' ? 'الإعدادات' : 'Paramètres', icon: '⚙️', color: 'from-orange-500 to-red-500' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-lg ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white`
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* ========== TESTIMONIALS SECTION - PREMIUM DESIGN ========== */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 mt-20 relative overflow-hidden"
        >
          {/* Background Gradient Blobs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-blue-400/20 rounded-full blur-3xl opacity-50" />

          {/* Main Container */}
          <div className="relative z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black rounded-3xl p-12 md:p-16 border border-slate-700/50 backdrop-blur-sm shadow-2xl">
            
            {/* Header Section */}
            <div className="text-center mb-16">
              <motion.div
                animate={{ rotateY: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <span className="text-6xl filter drop-shadow-lg">⭐</span>
              </motion.div>
              
              <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                {language === 'ar' ? 'ما يقول عملاؤنا' : language === 'fr' ? 'Ce que disent nos clients' : 'What Our Customers Say'}
              </h2>
              
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
                {language === 'ar' 
                  ? 'اكتشف تجارب العملاء الفعلية مع منتجاتنا وخدماتنا'
                  : 'Découvrez les expériences réelles de nos clients avec nos produits et services'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTestimonialDialog(true)}
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg overflow-hidden"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                {language === 'ar' ? 'شارك رأيك' : language === 'fr' ? 'Partagez votre avis' : 'Share Your Review'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg"
              >
                <MessageSquare className="h-5 w-5" />
                {language === 'ar' ? 'آرائي' : '💬 Mes avis'}
              </motion.button>
            </div>

            {/* Testimonials Grid */}
            {loadingTestimonials ? (
              <div className="text-center py-20">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <span className="text-5xl">⭐</span>
                </motion.div>
                <p className="text-slate-400 text-lg">{language === 'ar' ? 'جاري تحميل الآراء...' : 'Chargement des avis...'}</p>
              </div>
            ) : testimonials.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50"
              >
                <span className="text-6xl mb-4 inline-block">💭</span>
                <p className="text-slate-300 text-xl font-semibold">
                  {language === 'ar' ? '✨ كن أول من يشارك رأيه معنا!' : '✨ Soyez le premier à nous partager votre avis!'}
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  {language === 'ar' ? 'نحب أن نسمع من عملائنا' : 'Nous aimerions entendre de vous'}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.12,
                      type: 'spring',
                      stiffness: 80,
                      damping: 15
                    }}
                    whileHover={{ y: -15, transition: { duration: 0.3 } }}
                    className="group relative"
                  >
                    {/* Card */}
                    <div className="h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-xl overflow-hidden relative">
                      
                      {/* Gradient Overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300"
                      />

                      <div className="relative z-10">
                        {/* Stars */}
                        <motion.div
                          className="flex items-center gap-1 mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.12 + 0.1 }}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <motion.span
                              key={i}
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ 
                                delay: index * 0.12 + 0.1 + i * 0.05,
                                type: 'spring',
                                stiffness: 150
                              }}
                              className={`text-2xl ${i < (testimonial.rating || 5) ? 'text-yellow-400' : 'text-slate-600'}`}
                            >
                              ★
                            </motion.span>
                          ))}
                        </motion.div>

                        {/* Quote Icon */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.12 + 0.15 }}
                          className="text-4xl text-purple-400/30 mb-4 font-serif"
                        >
                          "
                        </motion.div>

                        {/* Opinion Text */}
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.12 + 0.2 }}
                          className="text-slate-300 text-lg mb-6 leading-relaxed line-clamp-5 group-hover:line-clamp-none transition-all duration-300 min-h-[6rem]"
                        >
                          {testimonial.opinion}
                        </motion.p>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-6" />

                        {/* Author Info */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.12 + 0.25 }}
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="flex-1">
                            <p className="font-bold text-white text-base group-hover:text-purple-400 transition-colors">
                              {testimonial.client_name}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                              {new Date(testimonial.created_at).toLocaleDateString(
                                language === 'ar' ? 'ar-DZ' : 'fr-FR',
                                { month: 'short', day: 'numeric', year: 'numeric' }
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Delete Button */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedTestimonialDelete(testimonial.id);
                                setShowDeleteTestimonialDialog(true);
                              }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors duration-300"
                              title={language === 'ar' ? 'حذف' : 'Supprimer'}
                            >
                              <Trash2 size={18} />
                            </motion.button>

                            {/* Emoji Animation */}
                            <motion.div
                              animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.15 }}
                              className="text-3xl"
                            >
                              😊
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* View All CTA */}
            {testimonials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center mt-16"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-bold text-lg rounded-xl shadow-2xl overflow-hidden"
                >
                  <span className="relative z-10">{language === 'ar' ? `شاهد جميع الآراء (${testimonials.length})` : `Voir tous les avis (${testimonials.length})`}</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* ========== CONTENT ========== */}
        <AnimatePresence mode="wait">
          {/* ========== OFFERS TAB ========== */}
          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowCreateOfferDialog(true)}
                className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-xl"
              >
                <Plus className="h-6 w-6" />
                <Sparkles className="h-6 w-6" />
                {language === 'ar' ? '✨ إنشاء عرض جديد' : '✨ Nouvelle Offre'}
              </motion.button>

              {offers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-blue-300 dark:border-blue-700"
                >
                  <ShoppingBag className="h-20 w-20 mx-auto mb-4 text-blue-400" />
                  <p className="text-2xl text-slate-600 dark:text-slate-400 font-bold">
                    {language === 'ar' ? '🛍️ لا توجد عروض حالياً' : '🛍️ Aucune offre'}
                  </p>
                  <p className="text-slate-500 mt-2">{language === 'ar' ? 'ابدأ بإنشاء عرضك الأول!' : 'Créez votre première offre!'}</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offers.map((offer) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -10 }}
                      className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-200 dark:border-blue-700 overflow-hidden shadow-xl hover:shadow-2xl transition-all"
                    >
                      {/* Image */}
                      <div className="relative h-40 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 overflow-hidden flex items-center justify-center">
                        {offer.product_image ? (
                          <img
                            src={offer.product_image}
                            alt={offer.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-16 w-16 text-slate-400" />
                        )}
                        {offer.discount_percentage > 0 && (
                          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-lg px-3 py-1 border-2 border-yellow-200">
                            🔥 -{offer.discount_percentage}%
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                            {offer.product_name}
                          </h3>
                          {offer.product_mark && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                              🏷️ {offer.product_mark}
                            </p>
                          )}
                        </div>

                        {/* Prices */}
                        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            💰 {offer.offer_price.toFixed(2)} DZD
                          </span>
                          {offer.discount_percentage > 0 && (
                            <span className="text-sm line-through text-slate-500">
                              {offer.original_price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingOffer(offer);
                              setOfferPrice(offer.offer_price.toString());
                              setOfferDescription(offer.description || '');
                              setShowCreateOfferDialog(true);
                            }}
                            className="flex-1 font-bold bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleToggleOfferVisibility(offer)}
                            className={`flex-1 font-bold ${
                              offer.is_visible
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gray-500 hover:bg-gray-600'
                            } text-white`}
                          >
                            {offer.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => copyOfferLink(offer)}
                            className="flex-1 font-bold bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOfferDelete(offer.id);
                              setShowDeleteOfferDialog(true);
                            }}
                            className="flex-1 font-bold bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ========== SPECIAL OFFERS TAB ========== */}
          {activeTab === 'special' && (
            <motion.div
              key="special"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowCreateSpecialDialog(true)}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white px-8 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-xl"
              >
                <Plus className="h-6 w-6" />
                <Award className="h-6 w-6" />
                {language === 'ar' ? '👑 عرض خاص جديد' : '👑 Offre Spéciale'}
              </motion.button>

              {specialOffers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-700"
                >
                  <Tag className="h-20 w-20 mx-auto mb-4 text-purple-400" />
                  <p className="text-2xl text-slate-600 dark:text-slate-400 font-bold">
                    {language === 'ar' ? '⭐ لا توجد عروض خاصة' : '⭐ Aucune offre spéciale'}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {specialOffers.map((offer) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -10 }}
                      className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-200 dark:border-purple-700 overflow-hidden shadow-xl hover:shadow-2xl transition-all"
                    >
                      {/* Image */}
                      <div className="relative h-40 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 overflow-hidden flex items-center justify-center">
                        {offer.product_image ? (
                          <img
                            src={offer.product_image}
                            alt={offer.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Tag className="h-16 w-16 text-slate-400" />
                        )}
                        {offer.discount_percentage > 0 && (
                          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-red-400 to-pink-400 text-white text-lg px-3 py-1 border-2 border-red-200 font-bold">
                            👑 -{offer.discount_percentage}%
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                            {offer.product_name}
                          </h3>
                          {offer.product_mark && (
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                              🏷️ {offer.product_mark}
                            </p>
                          )}
                        </div>

                        {/* Prices */}
                        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                            💎 {offer.special_price.toFixed(2)} DZD
                          </span>
                          {offer.discount_percentage > 0 && (
                            <span className="text-sm line-through text-slate-500">
                              {offer.original_price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingSpecialOffer(offer);
                              setSpecialPrice(offer.special_price.toString());
                              setOriginalPriceSpecial(offer.original_price);
                              setSpecialOfferDescription(offer.description || '');
                              setShowCreateSpecialDialog(true);
                            }}
                            className="flex-1 font-bold bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleToggleSpecialVisibility(offer)}
                            className={`flex-1 font-bold ${
                              offer.is_visible
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gray-500 hover:bg-gray-600'
                            } text-white`}
                          >
                            {offer.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => copySpecialLink(offer)}
                            className="flex-1 font-bold bg-pink-500 hover:bg-pink-600 text-white"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSpecialDelete(offer.id);
                              setShowDeleteSpecialDialog(true);
                            }}
                            className="flex-1 font-bold bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ========== CONTACTS TAB ========== */}
          {activeTab === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Social Media Section */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      {language === 'ar' ? '📱 وسائل التواصل' : '📱 Réseaux Sociaux'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Facebook, label: 'Facebook', url: 'facebook_url', placeholder: 'https://facebook.com/...', color: 'bg-blue-100 text-blue-600' },
                      { icon: Instagram, label: 'Instagram', url: 'instagram_url', placeholder: 'https://instagram.com/...', color: 'bg-pink-100 text-pink-600' },
                      { icon: MessageCircle, label: 'TikTok', url: 'tiktok_url', placeholder: 'https://tiktok.com/...', color: 'bg-black/10 dark:bg-white/10 text-slate-600' },
                    ].map(({ icon: Icon, label, url, placeholder, color }) => (
                      <div key={url}>
                        <Label className={`flex items-center gap-2 font-bold mb-2 p-2 rounded-lg ${color}`}>
                          <Icon className="h-5 w-5" />
                          {label}
                        </Label>
                        <Input
                          type="url"
                          placeholder={placeholder}
                          value={(settings as any)[url] || ''}
                          onChange={(e) => setSettings({ ...settings, [url]: e.target.value })}
                          className="border-2 border-blue-200 dark:border-blue-700 h-12 rounded-xl"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Contact Information Section */}
                <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-2 border-green-300 dark:border-green-700 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      {language === 'ar' ? '☎️ معلومات الاتصال' : '☎️ Informations'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Phone, label: language === 'ar' ? 'الهاتف' : 'Téléphone', key: 'phone_number', placeholder: '+213...', color: 'bg-green-100 text-green-600' },
                      { icon: MessageCircle, label: 'WhatsApp', key: 'whatsapp_number', placeholder: '+213...', color: 'bg-green-100 text-green-600' },
                      { icon: Send, label: 'Telegram', key: 'telegram_number', placeholder: '@username', color: 'bg-blue-100 text-blue-600' },
                      { icon: MapPin, label: language === 'ar' ? 'الموقع' : 'Localisation', key: 'location', placeholder: language === 'ar' ? 'العنوان' : 'Adresse', color: 'bg-red-100 text-red-600' },
                    ].map(({ icon: Icon, label, key, placeholder, color }) => (
                      <div key={key}>
                        <Label className={`flex items-center gap-2 font-bold mb-2 p-2 rounded-lg ${color}`}>
                          <Icon className="h-5 w-5" />
                          {label}
                        </Label>
                        <Input
                          type={key.includes('number') ? 'tel' : 'text'}
                          placeholder={placeholder}
                          value={(settings as any)[key] || ''}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                          className="border-2 border-green-200 dark:border-green-700 h-12 rounded-xl"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSaveSettings()}
                className="w-full bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 hover:from-green-600 hover:via-teal-600 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-xl"
              >
                <Check className="h-6 w-6" />
                {language === 'ar' ? '✅ حفظ جميع البيانات' : '✅ Sauvegarder'}
              </motion.button>
            </motion.div>
          )}

          {/* ========== SETTINGS TAB ========== */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-0"
            >
              {/* Main Settings Container */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50">
                
                {/* Header Section with Preview */}
                <div className="relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none" />
                  <div className="absolute -right-40 -top-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
                  <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
                  
                  {/* Header Content */}
                  <div className="relative z-10 p-8 lg:p-12">
                    <div className="flex items-start justify-between gap-8 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                            <Settings className="h-8 w-8 text-white" />
                          </div>
                          <h2 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            {language === 'ar' ? 'إعدادات الموقع' : 'Paramètres du Site'}
                          </h2>
                        </div>
                        <p className="text-slate-400 text-lg">
                          {language === 'ar' ? '⚙️ إدارة معلومات متجرك والصور' : '⚙️ Gérez les informations de votre magasin'}
                        </p>
                      </div>
                      
                      {/* Logo Preview in Header */}
                      {(logoPreview || settings.logo_url) && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-cyan-400/50 shadow-xl backdrop-blur-sm"
                        >
                          <img
                            src={logoPreview || settings.logo_url}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings Content */}
                <div className="relative z-10 p-8 lg:p-12 space-y-8">
                  
                  {/* Section 1: Store Identity */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 p-8 rounded-2xl border border-cyan-500/30 shadow-lg"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl">🏪</span>
                      {language === 'ar' ? 'هوية المتجر' : 'Identité du Magasin'}
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Store Name */}
                      <div className="space-y-3">
                        <Label className="text-white font-bold text-base flex items-center gap-2">
                          <span>🏷️</span>
                          {language === 'ar' ? 'اسم المتجر' : 'Nom du Magasin'}
                        </Label>
                        <Input
                          type="text"
                          placeholder={language === 'ar' ? 'أدخل اسم متجرك' : 'Entrez le nom du magasin'}
                          value={settings.store_name || ''}
                          onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                          className="h-12 bg-slate-900/50 border-2 border-cyan-500/50 text-white placeholder-slate-500 rounded-xl text-lg font-semibold hover:border-cyan-400/70 focus:border-cyan-400 transition-all"
                        />
                        {settings.store_name && (
                          <p className="text-sm text-cyan-400">✓ {language === 'ar' ? 'تم الإدخال' : 'Rempli'}</p>
                        )}
                      </div>

                      {/* Slogan */}
                      <div className="space-y-3">
                        <Label className="text-white font-bold text-base flex items-center gap-2">
                          <span>✨</span>
                          {language === 'ar' ? 'الشعار' : 'Slogan'}
                        </Label>
                        <Input
                          type="text"
                          placeholder={language === 'ar' ? 'شعارك المميز' : 'Votre slogan unique'}
                          value={settings.slogan || ''}
                          onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                          className="h-12 bg-slate-900/50 border-2 border-purple-500/50 text-white placeholder-slate-500 rounded-xl text-lg font-semibold hover:border-purple-400/70 focus:border-purple-400 transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Section 2: Logo */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 p-8 rounded-2xl border border-orange-500/30 shadow-lg"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl">🖼️</span>
                      {language === 'ar' ? 'شعار المتجر' : 'Logo du Magasin'}
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      {/* Upload Area */}
                      <label className="lg:col-span-2 flex items-center justify-center h-64 border-3 border-dashed border-orange-400/50 bg-orange-500/5 rounded-2xl cursor-pointer hover:border-orange-400 hover:bg-orange-500/10 transition-all group">
                        <div className="flex flex-col items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="mb-4"
                          >
                            <Upload className="h-16 w-16 text-orange-400 group-hover:text-orange-300 transition-colors" />
                          </motion.div>
                          <p className="text-white font-bold text-lg text-center">
                            {language === 'ar' ? '📤 اختر أو اسحب شعار المتجر' : '📤 Choisir ou glisser le logo'}
                          </p>
                          <p className="text-slate-400 text-sm mt-2">PNG, JPG, GIF</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                        />
                      </label>

                      {/* Preview */}
                      {(logoPreview || settings.logo_url) ? (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="h-64 rounded-2xl overflow-hidden border-2 border-orange-400/50 shadow-xl bg-gradient-to-br from-orange-600/20 to-red-600/20 flex items-center justify-center"
                        >
                          <img
                            src={logoPreview || settings.logo_url}
                            alt="Logo Preview"
                            className="w-full h-full object-contain p-4"
                          />
                        </motion.div>
                      ) : (
                        <div className="h-64 rounded-2xl border-2 border-dashed border-slate-500/30 flex items-center justify-center bg-slate-900/50">
                          <p className="text-slate-500 text-center">
                            {language === 'ar' ? 'لا يوجد شعار محمل' : 'Pas de logo'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Section 3: Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 p-8 rounded-2xl border border-blue-500/30 shadow-lg"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl">📝</span>
                      {language === 'ar' ? 'وصف الموقع' : 'Description du Site'}
                    </h3>
                    
                    <textarea
                      placeholder={language === 'ar' ? 'اكتب وصف شامل لموقعك ومتجرك...' : 'Décrivez votre magasin en détail...'}
                      value={settings.description || ''}
                      onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                      className="w-full h-40 bg-slate-900/50 border-2 border-blue-500/50 text-white placeholder-slate-500 rounded-xl p-4 text-lg font-semibold hover:border-blue-400/70 focus:border-blue-400 transition-all resize-none"
                    />
                    {settings.description && (
                      <p className="text-sm text-blue-400 mt-2">✓ {language === 'ar' ? 'تم إدخال الوصف' : 'Description saisie'} ({settings.description.length} {language === 'ar' ? 'حرف' : 'caractères'})</p>
                    )}
                  </motion.div>

                  {/* Section 4: Landing Page Image */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 p-8 rounded-2xl border border-purple-500/30 shadow-lg"
                  >
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                      <span className="text-3xl">🎨</span>
                      {language === 'ar' ? 'صورة الصفحة الرئيسية' : 'Image de la Page d\'accueil'}
                    </h3>
                    <p className="text-slate-400 mb-6">
                      {language === 'ar' ? '📌 الخلفية التي ستظهر على الصفحة الأولى من موقعك' : '📌 Image de fond pour votre page d\'accueil'}
                    </p>
                    
                    {/* Description Display */}
                    {settings.description && (
                      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-l-4 border-purple-400 p-6 rounded-xl mb-6 backdrop-blur-sm">
                        <p className="text-sm font-bold text-purple-300 mb-2">
                          {language === 'ar' ? '📄 الوصف الذي سيظهر على الخلفية:' : '📄 Texte sur la page:'}
                        </p>
                        <p className="text-white leading-relaxed">
                          {settings.description}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      {/* Upload Area */}
                      <label className="lg:col-span-2 flex items-center justify-center h-64 border-3 border-dashed border-purple-400/50 bg-purple-500/5 rounded-2xl cursor-pointer hover:border-purple-400 hover:bg-purple-500/10 transition-all group">
                        <div className="flex flex-col items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="mb-4"
                          >
                            <Upload className="h-16 w-16 text-purple-400 group-hover:text-purple-300 transition-colors" />
                          </motion.div>
                          <p className="text-white font-bold text-lg text-center">
                            {language === 'ar' ? '📤 اختر أو اسحب صورة الخلفية' : '📤 Choisir ou glisser l\'image'}
                          </p>
                          <p className="text-slate-400 text-sm mt-2">PNG, JPG, GIF</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {language === 'ar' ? '(صور عريضة 16:9 أفضل)' : '(Format 16:9 recommandé)'}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleLandingPageImageUpload(e.target.files[0])}
                        />
                      </label>

                      {/* Preview */}
                      {(landingPageImagePreview || settings.landing_page_image_url) ? (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="h-64 rounded-2xl overflow-hidden border-2 border-purple-400/50 shadow-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center"
                        >
                          <img
                            src={landingPageImagePreview || settings.landing_page_image_url}
                            alt="Landing Page Preview"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ) : (
                        <div className="h-64 rounded-2xl border-2 border-dashed border-slate-500/30 flex items-center justify-center bg-slate-900/50">
                          <p className="text-slate-500 text-center">
                            {language === 'ar' ? 'لا توجد صورة محملة' : 'Pas d\'image'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Save Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSaveSettings()}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white px-8 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-2xl border border-cyan-400/30 transition-all"
                  >
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                      <Check className="h-7 w-7" />
                    </motion.div>
                    {language === 'ar' ? '💾 حفظ جميع الإعدادات' : '💾 Enregistrer les Paramètres'}
                  </motion.button>

                  {/* Info Box */}
                  <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                    <p className="text-blue-300 text-sm">
                      <span className="font-bold">ℹ️ {language === 'ar' ? 'ملاحظة:' : 'Info:'}</span> {language === 'ar' ? ' سيتم حفظ جميع الصور تلقائياً في السحابة' : ' Toutes les images seront enregistrées dans le cloud'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========== DIALOGS ========== */}

      {/* Create Offer Dialog */}
      <Dialog open={showCreateOfferDialog} onOpenChange={setShowCreateOfferDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900">
          <DialogHeader>
            <DialogTitle className="text-3xl flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              {language === 'ar' ? '🎁 عرض جديد' : '🎁 Nouvelle Offre'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {language === 'ar' ? '✨ اختر منتج وحدد السعر' : '✨ Choisissez un produit'}
            </DialogDescription>
          </DialogHeader>

          {!selectedProductOffer ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder={language === 'ar' ? '🔍 ابحث...' : '🔍 Rechercher...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 border-blue-300 h-12 rounded-xl text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    onClick={() => handleSelectProductOffer(product)}
                    whileHover={{ scale: 1.05 }}
                    className="p-4 border-2 border-blue-300 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  >
                    {product.primary_image && (
                      <img
                        src={product.primary_image}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                    )}
                    <p className="font-bold text-sm truncate">{product.name}</p>
                    {product.mark && (
                      <div className="flex items-center gap-2 mt-1">
                        {(product.mark as any).logo_url && (
                          <img
                            src={(product.mark as any).logo_url}
                            alt={product.mark.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        )}
                        <p className="text-xs text-blue-600">🏷️ {product.mark.name}</p>
                      </div>
                    )}
                    <p className="text-green-600 font-bold mt-2">💰 {product.selling_price.toFixed(2)} DZD</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl border-2 border-blue-300">
                {selectedProductOffer.primary_image && (
                  <img
                    src={selectedProductOffer.primary_image}
                    alt={selectedProductOffer.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div>
                  <p className="font-bold text-lg">✅ {selectedProductOffer.name}</p>
                  {selectedProductOffer.mark && (
                    <p className="text-sm text-blue-600">🏷️ {selectedProductOffer.mark.name}</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-blue-300">
                <Label className="font-bold text-lg mb-3 flex items-center gap-2">
                  💰 {language === 'ar' ? 'سعر العرض' : 'Prix Offre'}
                </Label>
                <Input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="border-2 border-blue-300 h-12 rounded-xl text-lg font-bold"
                />
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-blue-300">
                <Label className="font-bold text-lg mb-3 flex items-center gap-2">
                  📝 {language === 'ar' ? 'الوصف' : 'Description'}
                </Label>
                <textarea
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  className="w-full border-2 border-blue-300 rounded-xl p-3 dark:bg-slate-700 dark:text-white text-lg"
                  rows={3}
                  placeholder={language === 'ar' ? 'وصف العرض...' : 'Description...'}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedProductOffer(null)}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-12 rounded-xl"
                >
                  {language === 'ar' ? '← رجوع' : '← Retour'}
                </Button>
                <Button
                  onClick={handleCreateOffer}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg h-12 rounded-xl"
                >
                  ✅ {language === 'ar' ? 'إنشاء' : 'Créer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Special Offer Dialog */}
      <Dialog open={showCreateSpecialDialog} onOpenChange={setShowCreateSpecialDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900">
          <DialogHeader>
            <DialogTitle className="text-3xl flex items-center gap-2">
              <Award className="h-8 w-8 text-purple-600" />
              {language === 'ar' ? '👑 عرض خاص' : '👑 Offre Spéciale'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {language === 'ar' ? '✨ حدد منتج واسعر خاص' : '✨ Offre premium'}
            </DialogDescription>
          </DialogHeader>

          {!selectedProductSpecial ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder={language === 'ar' ? '🔍 ابحث...' : '🔍 Rechercher...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 border-purple-300 h-12 rounded-xl text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    onClick={() => handleSelectProductSpecial(product)}
                    whileHover={{ scale: 1.05 }}
                    className="p-4 border-2 border-purple-300 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
                  >
                    {product.primary_image && (
                      <img
                        src={product.primary_image}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                    )}
                    <p className="font-bold text-sm truncate">{product.name}</p>
                    {product.mark && (
                      <div className="flex items-center gap-2 mt-1">
                        {(product.mark as any).logo_url && (
                          <img
                            src={(product.mark as any).logo_url}
                            alt={product.mark.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        )}
                        <p className="text-xs text-purple-600">🏷️ {product.mark.name}</p>
                      </div>
                    )}
                    <p className="text-green-600 font-bold mt-2">💰 {product.selling_price.toFixed(2)} DZD</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl border-2 border-purple-300">
                {selectedProductSpecial.primary_image && (
                  <img
                    src={selectedProductSpecial.primary_image}
                    alt={selectedProductSpecial.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div>
                  <p className="font-bold text-lg">✅ {selectedProductSpecial.name}</p>
                  {selectedProductSpecial.mark && (
                    <p className="text-sm text-purple-600">🏷️ {selectedProductSpecial.mark.name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-purple-300">
                  <Label className="font-bold text-lg mb-3 flex items-center gap-2">
                    💵 {language === 'ar' ? 'السعر الأصلي' : 'Prix Original'}
                  </Label>
                  <div className="text-3xl font-bold text-purple-600">
                    {originalPriceSpecial.toFixed(2)} DZD
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-purple-300">
                  <Label className="font-bold text-lg mb-3 flex items-center gap-2">
                    💎 {language === 'ar' ? 'السعر الخاص' : 'Prix Spécial'}
                  </Label>
                  <Input
                    type="number"
                    value={specialPrice}
                    onChange={(e) => handleSpecialPriceChange(e.target.value)}
                    className="border-2 border-purple-300 h-12 rounded-xl text-lg font-bold"
                  />
                </div>
              </div>

              {discountAmountSpecial > 0 && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border-2 border-green-300">
                  <div>
                    <p className="text-sm font-bold text-green-700">🎯 {language === 'ar' ? 'المبلغ المخصوم' : 'Réduction'}</p>
                    <p className="text-3xl font-bold text-green-600">{discountAmountSpecial.toFixed(2)} DZD</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-700">📊 {language === 'ar' ? 'النسبة' : 'Pourcentage'}</p>
                    <p className="text-3xl font-bold text-green-600">{discountPercentSpecial.toFixed(2)}%</p>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-purple-300">
                <Label className="font-bold text-lg mb-3 flex items-center gap-2">
                  📝 {language === 'ar' ? 'الوصف' : 'Description'}
                </Label>
                <textarea
                  value={specialOfferDescription}
                  onChange={(e) => setSpecialOfferDescription(e.target.value)}
                  className="w-full border-2 border-purple-300 rounded-xl p-3 dark:bg-slate-700 dark:text-white text-lg"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedProductSpecial(null)}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-12 rounded-xl"
                >
                  {language === 'ar' ? '← رجوع' : '← Retour'}
                </Button>
                <Button
                  onClick={handleCreateSpecialOffer}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg h-12 rounded-xl"
                >
                  👑 {language === 'ar' ? 'إنشاء' : 'Créer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Testimonial Submission Dialog */}
      <Dialog open={showTestimonialDialog} onOpenChange={setShowTestimonialDialog}>
        <DialogContent className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-2 border-blue-300 dark:border-blue-700 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">⭐</span>
              {language === 'ar' ? 'شارك رأيك' : language === 'fr' ? 'Partagez votre avis' : 'Share Your Review'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'ساعدنا بتقييمك وتعليقك' : language === 'fr' ? 'Aidez-nous avec votre avis' : 'Help us improve with your feedback'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name Input */}
            <div>
              <Label className="font-bold mb-2 block">
                👤 {language === 'ar' ? 'اسمك' : 'Votre nom'}
              </Label>
              <Input
                type="text"
                placeholder={language === 'ar' ? 'أدخل اسمك' : 'Votre nom'}
                value={testimonialName}
                onChange={(e) => setTestimonialName(e.target.value)}
                className="border-2 border-blue-300 dark:border-blue-600 rounded-lg text-base"
              />
            </div>

            {/* Opinion Input */}
            <div>
              <Label className="font-bold mb-2 block">
                💬 {language === 'ar' ? 'تعليقك' : 'Votre avis'}
              </Label>
              <textarea
                placeholder={language === 'ar' ? 'شارك رأيك وتجربتك...' : 'Partagez votre avis...'}
                value={testimonialOpinion}
                onChange={(e) => setTestimonialOpinion(e.target.value)}
                className="w-full border-2 border-blue-300 dark:border-blue-600 rounded-lg p-3 dark:bg-slate-700 dark:text-white text-base min-h-[100px]"
              />
            </div>

            {/* Rating */}
            <div>
              <Label className="font-bold mb-2 block">
                ⭐ {language === 'ar' ? 'التقييم' : 'Note'}
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setTestimonialRating(star)}
                    className="text-3xl transition-transform hover:scale-125"
                  >
                    <span className={star <= testimonialRating ? '⭐' : '☆'}>
                      {star <= testimonialRating ? '⭐' : '☆'}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {language === 'ar' ? `تقييمك: ${testimonialRating} نجوم` : `Votre note: ${testimonialRating} étoiles`}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              onClick={() => setShowTestimonialDialog(false)}
              disabled={submittingTestimonial}
              className="bg-slate-500 hover:bg-slate-600 text-white font-bold h-11 rounded-xl"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button
              onClick={handleSubmitTestimonial}
              disabled={submittingTestimonial || !testimonialName.trim() || !testimonialOpinion.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold h-11 rounded-xl disabled:opacity-50"
            >
              {submittingTestimonial ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  {language === 'ar' ? 'جاري الإرسال...' : 'Envoi...'}
                </>
              ) : (
                <>
                  <span>✅ </span>
                  {language === 'ar' ? 'إرسال' : 'Envoyer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Offer Dialog */}
      <Dialog open={showDeleteOfferDialog} onOpenChange={setShowDeleteOfferDialog}>
        <DialogContent className="bg-red-50 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-2xl">
              <AlertCircle className="h-7 w-7" />
              {language === 'ar' ? '⚠️ حذف العرض' : '⚠️ Supprimer'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {language === 'ar' ? 'هل أنت متأكد؟ لا يمكن التراجع!' : 'Action irréversible!'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button onClick={() => setShowDeleteOfferDialog(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button onClick={handleDeleteOffer} className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
              {language === 'ar' ? '🗑️ حذف' : '🗑️ Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Special Offer Dialog */}
      <Dialog open={showDeleteSpecialDialog} onOpenChange={setShowDeleteSpecialDialog}>
        <DialogContent className="bg-red-50 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-2xl">
              <AlertCircle className="h-7 w-7" />
              {language === 'ar' ? '⚠️ حذف العرض الخاص' : '⚠️ Supprimer'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {language === 'ar' ? 'هل أنت متأكد؟ لا يمكن التراجع!' : 'Action irréversible!'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button onClick={() => setShowDeleteSpecialDialog(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button onClick={handleDeleteSpecialOffer} className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
              {language === 'ar' ? '🗑️ حذف' : '🗑️ Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Testimonial Dialog */}
      <Dialog open={showDeleteTestimonialDialog} onOpenChange={setShowDeleteTestimonialDialog}>
        <DialogContent className="bg-red-50 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-2xl">
              <AlertCircle className="h-7 w-7" />
              {language === 'ar' ? '⚠️ حذف الرأي' : '⚠️ Supprimer l\'avis'}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {language === 'ar' ? 'هل أنت متأكد؟ لا يمكن التراجع!' : 'Action irréversible!'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button onClick={() => setShowDeleteTestimonialDialog(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button onClick={handleDeleteTestimonial} className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
              {language === 'ar' ? '🗑️ حذف' : '🗑️ Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
