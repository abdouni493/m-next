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
  Package as PackageIcon,
  FolderOpen,
  Download,
  Radio,
  Truck,
  DollarSign,
  MapIcon,
  Map,
  Smartphone,
  LinkIcon,
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
import { PageHero, formatDA } from '@/admin/ui';
import { uploadImage } from '@/lib/imageUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  supabase, 
  getProducts, 
  getWebsiteSettings, 
  updateWebsiteSettings, 
  getOffers, 
  createOffer, 
  updateOffer, 
  deleteOffer, 
  getSpecialOffers, 
  createSpecialOffer, 
  updateSpecialOffer, 
  deleteSpecialOffer,
  getPackages,
  getPackageItems,
  createPackage,
  updatePackage,
  deletePackage,
  addProductToPackage,
  removeProductFromPackage,
  updateSpecialOfferVisibility,
  getDeliveryAgencies,
  createDeliveryAgency,
  updateDeliveryAgency,
  deleteDeliveryAgency,
  toggleDeliveryAgencyVisibility,
  getWilayaPrices,
  upsertWilayaPrice,
  deleteWilayaPrice,
} from '@/lib/supabaseClient';

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
  show_price?: boolean;
  whatsapp_link?: string;
}

interface Package {
  id: string;
  name: string;
  description: string;
  package_price: number;
  image_url?: string;
  is_visible: boolean;
  discount_percentage?: number;
  discount_amount?: number;
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

interface DeliveryAgency {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  contact_phone?: string;
  contact_email?: string;
  price_domicile: number;
  price_bureau: number;
  is_active: boolean;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
}

// ========== ALGERIAN WILAYAS LIST ==========
const ALGERIAN_WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tiaret', 'Tizi Ouzou', 'Algiers', 'Djelfa',
  'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine',
  'Médéa', 'Mostaghanem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi',
  'Bordj Bou Arréridj', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras',
  'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Beni Saf',
  'Aïn Ousseltia', 'Béni Khellad', 'Boumerdès', 'Djanet', 'Draa Ben Stita', 'Grouz', 'In Guezzam',
  'In Salah', 'Ouled Djellal', 'Tamanghasset', 'Tamanrasset City', 'Touggourt', 'Tassili'
];

interface WilayaPrice {
  id?: string;
  agency_id: string;
  wilaya_name: string;
  price_domicile: number;
  price_bureau: number;
  is_active?: boolean;
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

const translations = {
  en: {
    tabs: { offers: 'Boutique', special: 'Special Offers', packages: 'Packages', contacts: 'Contacts', settings: 'Settings' },
    offers: { create: 'Manage Products', search: 'Search products...', price: 'Offer Price', description: 'Description', create_btn: 'Create Offer' },
    special: { 
      create: 'Create New Special Offer',
      show_price: 'Show Price',
      no_show: 'Hide Price',
      description_req: 'Description (required when hiding price)',
      price_toggle: 'Choose price visibility',
      display: 'Display',
      dont_display: 'Don\'t Display',
      info: 'This offer will display on WhatsApp with contact button',
      create_btn: 'Create Special Offer'
    },
    packages: {
      create: 'Create New Package',
      add_products: 'Add Products to Package',
      package_name: 'Package Name',
      package_price: 'Package Price',
      search_product: 'Search and add products',
      products_added: 'Products in Package',
      remove: 'Remove',
      create_btn: 'Create Package',
      total_items: 'Items in Package',
    },
    contacts: { update: 'Update Contacts', save: 'Save Settings' },
    common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', close: 'Close', view: 'View Details', success: 'Success', error: 'Error' },
  },
  fr: {
    tabs: { offers: 'Boutique', special: 'Offres Spéciales', packages: 'Paquets', contacts: 'Contacts', settings: 'Paramètres' },
    offers: { create: 'Gérer les Produits', search: 'Recherchez des produits...', price: 'Prix de l\'offre', description: 'Description', create_btn: 'Créer l\'offre' },
    special: {
      create: 'Créer une nouvelle offre spéciale',
      show_price: 'Afficher le prix',
      no_show: 'Masquer le prix',
      description_req: 'Description (obligatoire si le prix est masqué)',
      price_toggle: 'Choisir la visibilité du prix',
      display: 'Afficher',
      dont_display: 'Ne pas afficher',
      info: 'Cette offre s\'affichera sur WhatsApp avec un bouton de contact',
      create_btn: 'Créer une offre spéciale',
    },
    packages: {
      create: 'Créer un nouveau paquet',
      add_products: 'Ajouter des produits au paquet',
      package_name: 'Nom du paquet',
      package_price: 'Prix du paquet',
      search_product: 'Recherchez et ajoutez des produits',
      products_added: 'Produits dans le paquet',
      remove: 'Supprimer',
      create_btn: 'Créer le paquet',
      total_items: 'Articles dans le paquet',
    },
    contacts: { update: 'Mettre à jour les contacts', save: 'Enregistrer les paramètres' },
    common: { save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', close: 'Fermer', view: 'Voir les détails', success: 'Succès', error: 'Erreur' },
  },
  ar: {
    tabs: { offers: 'المتجر', special: 'عروض خاصة', packages: 'الحزم', contacts: 'جهات الاتصال', settings: 'الإعدادات' },
    offers: { create: 'إدارة المنتجات', search: 'ابحث عن المنتجات...', price: 'سعر العرض', description: 'الوصف', create_btn: 'إنشاء عرض' },
    special: {
      create: 'إنشاء عرض خاص جديد',
      show_price: 'عرض السعر',
      no_show: 'إخفاء السعر',
      description_req: 'الوصف (مطلوب عند إخفاء السعر)',
      price_toggle: 'اختر رؤية السعر',
      display: 'عرض',
      dont_display: 'عدم العرض',
      info: 'سيتم عرض هذا العرض على WhatsApp مع زر الاتصال',
      create_btn: 'إنشاء عرض خاص',
    },
    packages: {
      create: 'إنشاء حزمة جديدة',
      add_products: 'إضافة منتجات إلى الحزمة',
      package_name: 'اسم الحزمة',
      package_price: 'سعر الحزمة',
      search_product: 'ابحث وأضف منتجات',
      products_added: 'المنتجات في الحزمة',
      remove: 'إزالة',
      create_btn: 'إنشاء الحزمة',
      total_items: 'العناصر في الحزمة',
    },
    contacts: { update: 'تحديث جهات الاتصال', save: 'حفظ الإعدادات' },
    common: { save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', close: 'إغلاق', view: 'عرض التفاصيل', success: 'نجاح', error: 'خطأ' },
  },
};

export default function Website_Enhanced() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage() as any;
  const t = translations[language as keyof typeof translations] || translations.en;

  // Tabs - Now includes packages
  const [activeTab, setActiveTab] = useState<'offers' | 'special' | 'packages' | 'delivery' | 'contacts' | 'settings'>('offers');

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

  // Special Offers with Price Visibility
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [selectedProductSpecial, setSelectedProductSpecial] = useState<Product | null>(null);
  const [editingSpecialOffer, setEditingSpecialOffer] = useState<SpecialOffer | null>(null);
  const [specialPrice, setSpecialPrice] = useState<string>('');
  const [originalPriceSpecial, setOriginalPriceSpecial] = useState<number>(0);
  const [discountAmountSpecial, setDiscountAmountSpecial] = useState<number>(0);
  const [discountPercentSpecial, setDiscountPercentSpecial] = useState<number>(0);
  const [specialOfferDescription, setSpecialOfferDescription] = useState<string>('');
  const [showSpecialPrice, setShowSpecialPrice] = useState<boolean>(true);
  const [showCreateSpecialDialog, setShowCreateSpecialDialog] = useState(false);
  const [showDeleteSpecialDialog, setShowDeleteSpecialDialog] = useState(false);
  const [selectedSpecialDelete, setSelectedSpecialDelete] = useState<string | null>(null);

  // Handler functions for special offers
  const handleSelectProductSpecial = (product: Product) => {
    setSelectedProductSpecial(product);
    setOriginalPriceSpecial(product.selling_price);
  };

  const handleSpecialPriceChange = (value: string) => {
    setSpecialPrice(value);
    const price = parseFloat(value) || 0;
    if (price < originalPriceSpecial) {
      const discount = originalPriceSpecial - price;
      const discountPercent = ((discount / originalPriceSpecial) * 100).toFixed(2);
      setDiscountAmountSpecial(parseFloat(discount.toFixed(2)));
      setDiscountPercentSpecial(parseFloat(discountPercent));
    } else {
      setDiscountAmountSpecial(0);
      setDiscountPercentSpecial(0);
    }
  };

  // Packages
  const [packages, setPackages] = useState<Package[]>([]);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageName, setPackageName] = useState<string>('');
  const [packagePrice, setPackagePrice] = useState<string>('');
  const [packageDescription, setPackageDescription] = useState<string>('');
  const [packageImage, setPackageImage] = useState<File | null>(null);
  const [packageImagePreview, setPackageImagePreview] = useState<string>('');
  const [selectedProductsPackage, setSelectedProductsPackage] = useState<{product: Product; quantity: number; customPrice: string}[]>([]);
  const [showCreatePackageDialog, setShowCreatePackageDialog] = useState(false);
  const [showEditPackageDialog, setShowEditPackageDialog] = useState(false);
  const [showDeletePackageDialog, setShowDeletePackageDialog] = useState(false);
  const [selectedPackageDelete, setSelectedPackageDelete] = useState<string | null>(null);
  const [showPackageDetails, setShowPackageDetails] = useState(false);

  // Delivery Agencies
  const [deliveryAgencies, setDeliveryAgencies] = useState<DeliveryAgency[]>([]);
  const [selectedDeliveryAgency, setSelectedDeliveryAgency] = useState<DeliveryAgency | null>(null);
  const [editingDeliveryAgency, setEditingDeliveryAgency] = useState<DeliveryAgency | null>(null);
  const [agencyName, setAgencyName] = useState<string>('');
  const [agencyDescription, setAgencyDescription] = useState<string>('');
  const [agencyPhone, setAgencyPhone] = useState<string>('');
  const [agencyEmail, setAgencyEmail] = useState<string>('');
  const [priceDomicile, setPriceDomicile] = useState<string>('');
  const [priceBureau, setPriceBureau] = useState<string>('');
  const [showCreateDeliveryDialog, setShowCreateDeliveryDialog] = useState(false);
  const [showDeleteDeliveryDialog, setShowDeleteDeliveryDialog] = useState(false);
  const [selectedDeliveryDelete, setSelectedDeliveryDelete] = useState<string | null>(null);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState<Package | null>(null);

  // Wilaya Pricing Management
  const [wilayaPricingAgencyId, setWilayaPricingAgencyId] = useState<string | null>(null);
  const [wilayaPricingAgencyName, setWilayaPricingAgencyName] = useState<string>('');
  const [wilayaPrices, setWilayaPrices] = useState<WilayaPrice[]>([]);
  const [showWilayaPricingDialog, setShowWilayaPricingDialog] = useState(false);
  const [selectedWilayaForEdit, setSelectedWilayaForEdit] = useState<string>('');
  const [wilayaPriceDomicile, setWilayaPriceDomicile] = useState<string>('');
  const [wilayaPriceBureau, setWilayaPriceBureau] = useState<string>('');
  const [editingWilayaPriceId, setEditingWilayaPriceId] = useState<string | null>(null);
  const [wilayaPricingSearchFilter, setWilayaPricingSearchFilter] = useState<string>('');

  // Website Settings
  const [settings, setSettings] = useState<WebsiteSettings>({
    store_name: '',
    slogan: '',
    description: '',
    logo_url: '',
    landing_page_image_url: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    phone_number: '',
    whatsapp_number: '',
    telegram_number: '',
    location: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [websiteSettings, setWebsiteSettings] = useState<any>({
    store_name: '',
    slogan: '',
    description: '',
    logo_url: '',
    landing_page_image_url: '',
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    phone_number: '',
    whatsapp_number: '',
    telegram_number: '',
    location: '',
  });
  const [landingPageImageFile, setLandingPageImageFile] = useState<File | null>(null);

  // Dialogs
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [selectedOfferDetails, setSelectedOfferDetails] = useState<Offer | null>(null);
  const [showSpecialDetails, setShowSpecialDetails] = useState(false);
  const [selectedSpecialDetails, setSelectedSpecialDetails] = useState<SpecialOffer | null>(null);
  const [loading, setLoading] = useState(false);

  // ========== FETCH DATA ==========
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsData, offersData, specialData, packagesData, packageItemsData, deliveryData, settingsData] = await Promise.all([
        getProducts(),
        getOffers(),
        getSpecialOffers(),
        getPackages(),
        getPackageItems(),
        getDeliveryAgencies(),
        getWebsiteSettings(),
      ]);

      setProducts(productsData);
      setOffers(offersData);
      setSpecialOffers(specialData);
      setPackages(packagesData);
      setPackageItems(packageItemsData);
      setDeliveryAgencies(deliveryData);
      setSettings(settingsData);
      setWebsiteSettings(settingsData);

      if (settingsData?.logo_url) {
        setLogoPreview(settingsData.logo_url);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ========== WEBSITE SETTINGS HANDLERS ==========
  const handleLogoUpload = async (file: File) => {
    try {
      if (!file) return;
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const { publicUrl } = await uploadImage(file, { folder: 'logos', preset: 'logo' });

      setWebsiteSettings({
        ...websiteSettings,
        logo_url: publicUrl,
      });

      toast({
        title: t.common.success,
        description: 'Logo uploaded successfully!',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : 'Failed to upload logo',
        variant: 'destructive',
      });
    }
  };

  const handleLandingPageImageUpload = async (file: File) => {
    try {
      if (!file) return;
      
      setLandingPageImageFile(file);

      // Upload to Supabase Storage
      const { publicUrl } = await uploadImage(file, { folder: 'landing', preset: 'hero' });

      setWebsiteSettings({
        ...websiteSettings,
        landing_page_image_url: publicUrl,
      });

      toast({
        title: t.common.success,
        description: 'Landing page background uploaded successfully!',
      });
    } catch (error) {
      console.error('Error uploading landing page background:', error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : 'Failed to upload landing page background',
        variant: 'destructive',
      });
    }
  };

  const handleSaveWebsiteSettings = async () => {
    try {
      // For contacts tab, don't require store_name and description
      if (activeTab === 'contacts') {
        // Contacts save - no validation needed, all fields are optional
      } else {
        // For settings tab, require store_name and description
        if (!websiteSettings.store_name || !websiteSettings.description) {
          toast({
            title: t.common.error,
            description: 'Please fill in all required fields',
            variant: 'destructive',
          });
          return;
        }
      }

      const settingsToSave = {
        store_name: websiteSettings.store_name || '',
        slogan: websiteSettings.slogan || '',
        description: websiteSettings.description || '',
        logo_url: websiteSettings.logo_url || '',
        landing_page_image_url: websiteSettings.landing_page_image_url || '',
        // Include all contact fields
        facebook_url: websiteSettings.facebook_url || '',
        instagram_url: websiteSettings.instagram_url || '',
        tiktok_url: websiteSettings.tiktok_url || '',
        phone_number: websiteSettings.phone_number || '',
        whatsapp_number: websiteSettings.whatsapp_number || '',
        telegram_number: websiteSettings.telegram_number || '',
        location: websiteSettings.location || '',
      };

      // Update in database
      const result = await updateWebsiteSettings(settingsToSave);
      
      if (result) {
        setSettings(result);
        setWebsiteSettings(result);
        toast({
          title: t.common.success,
          description: activeTab === 'contacts' 
            ? 'Contacts saved successfully!' 
            : 'Website settings saved successfully!',
        });
      }
    } catch (error) {
      console.error('Error saving website settings:', error);
      toast({
        title: t.common.error,
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  // Load website settings on mount
  useEffect(() => {
    if (settings.store_name) {
      setWebsiteSettings(settings);
    }
  }, [settings]);

  // ========== PACKAGE FUNCTIONS ==========
  const handleSelectProductForPackage = (product: Product) => {
    if (!selectedProductsPackage.find((p) => p.product.id === product.id)) {
      setSelectedProductsPackage([...selectedProductsPackage, { product, quantity: 1, customPrice: product.selling_price.toString() }]);
    }
  };

  const handleRemoveProductFromPackage = (productId: string) => {
    setSelectedProductsPackage(selectedProductsPackage.filter((p) => p.product.id !== productId));
  };

  const handleUpdateProductQuantity = (productId: string, quantity: number) => {
    setSelectedProductsPackage(
      selectedProductsPackage.map((p) =>
        p.product.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
      )
    );
  };

  const handleUpdateProductPrice = (productId: string, price: string) => {
    setSelectedProductsPackage(
      selectedProductsPackage.map((p) =>
        p.product.id === productId ? { ...p, customPrice: price } : p
      )
    );
  };

  const handlePackageImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPackageImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPackageImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ========== OFFER HANDLERS ==========
  const handleCreateOffer = async () => {
    if (!selectedProductOffer || !offerPrice) {
      toast({
        title: t.common.error,
        description: 'Please select a product and enter an offer price',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newOffer = {
        product_id: selectedProductOffer.id,
        product_name: selectedProductOffer.name,
        product_image: selectedProductOffer.primary_image,
        product_mark: selectedProductOffer.mark?.name,
        product_description: selectedProductOffer.description,
        original_price: selectedProductOffer.selling_price,
        offer_price: parseFloat(offerPrice),
        description: offerDescription,
        discount_percentage: Math.round(((selectedProductOffer.selling_price - parseFloat(offerPrice)) / selectedProductOffer.selling_price) * 100),
        is_visible: true,
      };

      await createOffer(newOffer);
      
      toast({
        title: t.common.success,
        description: 'Offer created successfully',
      });

      // Reset
      setShowCreateOfferDialog(false);
      setSelectedProductOffer(null);
      setOfferPrice('');
      setOfferDescription('');
      setSearchQuery('');
      fetchAllData();
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateOffer = async (offerId: string) => {
    if (!selectedProductOffer || !offerPrice) {
      toast({
        title: t.common.error,
        description: 'Please select a product and enter an offer price',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedOffer = {
        offer_price: parseFloat(offerPrice),
        description: offerDescription,
        discount_percentage: Math.round(((selectedProductOffer.selling_price - parseFloat(offerPrice)) / selectedProductOffer.selling_price) * 100),
      };

      await updateOffer(offerId, updatedOffer);

      toast({
        title: t.common.success,
        description: 'Offer updated successfully',
      });

      // Reset
      setShowCreateOfferDialog(false);
      setSelectedProductOffer(null);
      setOfferPrice('');
      setOfferDescription('');
      setSearchQuery('');
      setEditingOffer(null);
      fetchAllData();
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleCreatePackage = async () => {
    if (!packageName || !packagePrice || selectedProductsPackage.length === 0) {
      toast({
        title: t.common.error,
        description: 'Please fill all required fields and add at least one product',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newPackageData = {
        name: packageName,
        description: packageDescription,
        package_price: parseFloat(packagePrice),
        image_url: '',
        is_visible: true,
        is_active: true,
      };

      const createdPackage = await createPackage(newPackageData);

      // Upload package image if provided, now that we have the package ID
      let imageUrl = '';
      if (packageImage) {
        const uploaded = await uploadImage(packageImage, { folder: `packages/${createdPackage.id}`, preset: 'offer' });
        const filePath = uploaded.path;
        imageUrl = uploaded.publicUrl;

        // Update package with image URL
        await updatePackage(createdPackage.id, {
          image_url: imageUrl,
          storage_bucket_path: filePath,
        });
      }

      // Add products to package with quantity and custom price
      for (const item of selectedProductsPackage) {
        const customPrice = item.customPrice ? parseFloat(item.customPrice) : item.product.selling_price;
        await addProductToPackage(createdPackage.id, item.product, item.quantity, customPrice);
      }

      toast({
        title: t.common.success,
        description: `${t.packages.create} ${packageName}`,
      });

      // Reset
      setPackageName('');
      setPackagePrice('');
      setPackageDescription('');
      setSelectedProductsPackage([]);
      setPackageImage(null);
      setPackageImagePreview('');
      setShowCreatePackageDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePackage = async () => {
    if (!selectedPackageDelete) return;

    try {
      await deletePackage(selectedPackageDelete);
      toast({
        title: t.common.success,
        description: 'Package deleted',
      });
      setShowDeletePackageDialog(false);
      setSelectedPackageDelete(null);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setPackageName(pkg.name);
    setPackagePrice(pkg.package_price?.toString() || '');
    setPackageDescription(pkg.description || '');
    // Fetch package items for editing
    const items = packageItems.filter(item => item.package_id === pkg.id);
    const productsInPackage = items.map(item => ({
      product: {
        id: item.product_id,
        name: item.product_name || 'Unknown Product',
        selling_price: 0,
        mark: item.product_mark ? { name: item.product_mark } : null,
        voltage: item.product_voltage,
        amperage: item.product_amperage,
        wattage: item.product_wattage,
        primary_image: item.product_image,
      },
      quantity: item.quantity || 1,
      customPrice: (item.custom_price || 0).toString(),
    } as any));
    setSelectedProductsPackage(productsInPackage);
    setShowEditPackageDialog(true);
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage || !packageName || !packagePrice || selectedProductsPackage.length === 0) {
      toast({
        title: t.common.error,
        description: 'Please fill all required fields and add at least one product',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update package details
      await updatePackage(editingPackage.id, {
        name: packageName,
        description: packageDescription,
        package_price: parseFloat(packagePrice),
      });

      // Remove old items and add new ones
      const oldItems = packageItems.filter(item => item.package_id === editingPackage.id);
      for (const item of oldItems) {
        await removeProductFromPackage(item.id);
      }

      // Add new products
      for (const item of selectedProductsPackage) {
        const customPrice = item.customPrice ? parseFloat(item.customPrice) : item.product.selling_price;
        await addProductToPackage(editingPackage.id, item.product, item.quantity, customPrice);
      }

      toast({
        title: t.common.success,
        description: `Package updated`,
      });

      // Reset
      setEditingPackage(null);
      setPackageName('');
      setPackagePrice('');
      setPackageDescription('');
      setSelectedProductsPackage([]);
      setShowEditPackageDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleTogglePackageVisibility = async (pkg: Package) => {
    try {
      await updatePackage(pkg.id, { is_visible: !pkg.is_visible });
      toast({
        title: t.common.success,
      });
      fetchAllData();
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  // ========== DELIVERY AGENCY HANDLERS ==========
  const handleCreateDeliveryAgency = async () => {
    if (!agencyName || !priceDomicile || !priceBureau) {
      toast({
        title: t.common.error,
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newAgency = {
        name: agencyName,
        description: agencyDescription,
        price_domicile: parseFloat(priceDomicile),
        price_bureau: parseFloat(priceBureau),
        is_active: true,
        is_visible: true,
      };

      await createDeliveryAgency(newAgency);

      toast({
        title: t.common.success,
        description: 'Delivery agency created successfully',
      });

      // Reset
      setShowCreateDeliveryDialog(false);
      setAgencyName('');
      setAgencyDescription('');
      setPriceDomicile('');
      setPriceBureau('');
      fetchAllData();
    } catch (error) {
      console.error('Error creating delivery agency:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleEditDeliveryAgency = (agency: DeliveryAgency) => {
    setEditingDeliveryAgency(agency);
    setAgencyName(agency.name);
    setAgencyDescription(agency.description || '');
    setPriceDomicile(agency.price_domicile.toString());
    setPriceBureau(agency.price_bureau.toString());
    setShowCreateDeliveryDialog(true);
  };

  const handleUpdateDeliveryAgency = async () => {
    if (!editingDeliveryAgency || !agencyName || !priceDomicile || !priceBureau) {
      toast({
        title: t.common.error,
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateDeliveryAgency(editingDeliveryAgency.id, {
        name: agencyName,
        description: agencyDescription,
        price_domicile: parseFloat(priceDomicile),
        price_bureau: parseFloat(priceBureau),
      });

      toast({
        title: t.common.success,
        description: 'Delivery agency updated successfully',
      });

      // Reset
      setShowCreateDeliveryDialog(false);
      setEditingDeliveryAgency(null);
      setAgencyName('');
      setAgencyDescription('');
      setPriceDomicile('');
      setPriceBureau('');
      fetchAllData();
    } catch (error) {
      console.error('Error updating delivery agency:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDeliveryAgency = async () => {
    if (!selectedDeliveryDelete) return;

    try {
      await deleteDeliveryAgency(selectedDeliveryDelete);

      toast({
        title: t.common.success,
        description: 'Delivery agency deleted successfully',
      });

      setShowDeleteDeliveryDialog(false);
      setSelectedDeliveryDelete(null);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting delivery agency:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleToggleDeliveryVisibility = async (agency: DeliveryAgency) => {
    try {
      await toggleDeliveryAgencyVisibility(agency.id, agency.is_visible);
      toast({
        title: t.common.success,
      });
      fetchAllData();
    } catch (error) {
      console.error('Error toggling delivery agency visibility:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  // ========== WILAYA PRICING MANAGEMENT FUNCTIONS ==========
  const handleOpenWilayaPricingDialog = async (agency: DeliveryAgency) => {
    try {
      setWilayaPricingAgencyId(agency.id);
      setWilayaPricingAgencyName(agency.name);
      
      // Fetch existing wilaya prices
      const prices = await getWilayaPrices(agency.id);
      setWilayaPrices(prices);
      setShowWilayaPricingDialog(true);
      
      // Reset form
      setSelectedWilayaForEdit('');
      setWilayaPriceDomicile('');
      setWilayaPriceBureau('');
      setEditingWilayaPriceId(null);
      setWilayaPricingSearchFilter('');
    } catch (error) {
      console.error('Error opening wilaya pricing dialog:', error);
      toast({
        title: t.common.error,
        description: 'Failed to load wilaya prices',
        variant: 'destructive',
      });
    }
  };

  const handleSaveWilayaPrice = async () => {
    if (!wilayaPricingAgencyId || !selectedWilayaForEdit || !wilayaPriceDomicile || !wilayaPriceBureau) {
      toast({
        title: t.common.error,
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await upsertWilayaPrice(
        wilayaPricingAgencyId,
        selectedWilayaForEdit,
        parseFloat(wilayaPriceDomicile),
        parseFloat(wilayaPriceBureau)
      );

      toast({
        title: t.common.success,
        description: `Prices for ${selectedWilayaForEdit} saved successfully`,
      });

      // Refresh list
      const prices = await getWilayaPrices(wilayaPricingAgencyId);
      setWilayaPrices(prices);

      // Reset form
      setSelectedWilayaForEdit('');
      setWilayaPriceDomicile('');
      setWilayaPriceBureau('');
      setEditingWilayaPriceId(null);
    } catch (error) {
      console.error('Error saving wilaya price:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWilayaPrice = async (wilayaName: string) => {
    if (!wilayaPricingAgencyId) return;

    try {
      await deleteWilayaPrice(wilayaPricingAgencyId, wilayaName);

      toast({
        title: t.common.success,
        description: `Pricing for ${wilayaName} deleted`,
      });

      // Refresh list
      const prices = await getWilayaPrices(wilayaPricingAgencyId);
      setWilayaPrices(prices);

      // Reset form
      setSelectedWilayaForEdit('');
      setWilayaPriceDomicile('');
      setWilayaPriceBureau('');
      setEditingWilayaPriceId(null);
    } catch (error) {
      console.error('Error deleting wilaya price:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  const handleEditWilayaPrice = (price: WilayaPrice) => {
    setSelectedWilayaForEdit(price.wilaya_name);
    setWilayaPriceDomicile(price.price_domicile.toString());
    setWilayaPriceBureau(price.price_bureau.toString());
    setEditingWilayaPriceId(price.id || null);
  };

  // ========== SPECIAL OFFER PRICE VISIBILITY FUNCTION ==========
  const handleCreateSpecialOfferWithPriceToggle = async () => {
    if (!selectedProductSpecial && !editingSpecialOffer) return;

    try {
      if (editingSpecialOffer) {
        await updateSpecialOfferVisibility(editingSpecialOffer.id, showSpecialPrice, specialOfferDescription);
        toast({
          title: t.common.success,
          description: 'Special offer updated',
        });
      } else if (selectedProductSpecial) {
        const newSpecialOffer = {
          product_id: selectedProductSpecial.id,
          product_name: selectedProductSpecial.name,
          product_image: selectedProductSpecial.primary_image,
          product_mark: selectedProductSpecial.mark?.name,
          product_description: selectedProductSpecial.description,
          original_price: originalPriceSpecial,
          special_price: parseFloat(specialPrice),
          description: specialOfferDescription,
          show_price: showSpecialPrice,
        };

        await createSpecialOffer(newSpecialOffer);
        toast({
          title: t.common.success,
          description: 'Special offer created',
        });
      }

      // Reset
      setSelectedProductSpecial(null);
      setEditingSpecialOffer(null);
      setSpecialPrice('');
      setSpecialOfferDescription('');
      setShowSpecialPrice(true);
      setShowCreateSpecialDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error creating/updating special offer:', error);
      toast({
        title: t.common.error,
        variant: 'destructive',
      });
    }
  };

  // ========== RENDER ==========
  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <PageHero
          eyebrow={language === 'ar' ? 'المتجر الإلكتروني' : language === 'fr' ? 'Boutique en ligne' : 'Online store'}
          icon={Globe}
          title={language === 'ar' ? 'إدارة الموقع' : language === 'fr' ? 'Gestion Web' : 'Website Manager'}
          description={language === 'ar' ? 'تحكم كامل في عروضك والتواصل' : language === 'fr' ? 'Produits, offres, packs, contacts et livraison de votre boutique — au même endroit.' : 'Products, offers, packs, contacts and delivery for your store — in one place.'}
          actions={
            <Button variant="outline" onClick={() => window.open('/website-shop', '_blank')}>
              <Eye className="h-4 w-4" /> {language === 'ar' ? 'عرض المتجر' : language === 'fr' ? 'Voir la boutique' : 'View store'}
            </Button>
          }
          stats={[
            { label: language === 'fr' ? 'Produits' : language === 'ar' ? 'منتجات' : 'Products', value: products.length },
            { label: language === 'fr' ? 'Offres spéciales' : language === 'ar' ? 'عروض خاصة' : 'Special offers', value: specialOffers.length },
            { label: 'Packs', value: packages.length },
            { label: language === 'fr' ? 'Offres' : language === 'ar' ? 'عروض' : 'Offers', value: offers.length },
          ]}
        />

        {/* Tabs Navigation */}
        <div className="mb-6 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          <div className="flex min-w-max gap-1" role="tablist">
            {([
              ['offers', ShoppingBag, language === 'ar' ? 'المنتجات' : language === 'fr' ? 'Produits' : 'Products', products.length],
              ['special', Tag, language === 'ar' ? 'عروض خاصة' : language === 'fr' ? 'Offres spéciales' : 'Special offers', specialOffers.length],
              ['packages', PackageIcon, language === 'ar' ? 'باقات' : 'Packs', packages.length],
              ['contacts', Phone, language === 'ar' ? 'جهات الاتصال' : 'Contacts', null],
              ['delivery', Truck, language === 'ar' ? 'التوصيل' : language === 'fr' ? 'Livraison' : 'Delivery', null],
              ['settings', Settings, language === 'ar' ? 'الإعدادات' : language === 'fr' ? 'Paramètres' : 'Settings', null],
            ] as const).map(([key, Icon, label, count]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-[10px] px-4 text-sm font-semibold transition-colors ${
                  activeTab === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {count !== null && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${activeTab === key ? 'bg-[#C6F432] text-[#0B1220]' : 'bg-surface-2 text-foreground'}`}>{count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* BOUTIQUE TAB - PRODUCTS MANAGEMENT */}
          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{language === 'ar' ? 'جميع منتجات المتجر' : language === 'fr' ? 'Tous les produits de la boutique' : 'All store products'}</h2>
                  <p className="text-sm text-muted-foreground">{products.length} {language === 'fr' ? 'produits publiés' : 'products'}</p>
                </div>
              </div>

              {products.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-card rounded-2xl border-2 border-dashed border-border"
                >
                  <PackageIcon className="h-20 w-20 mx-auto mb-4 text-electric" />
                  <p className="text-2xl text-muted-foreground font-bold">
                    {language === 'ar' ? 'لا توجد منتجات' : language === 'fr' ? 'Aucun produit' : 'No products'}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                        {product.primary_image ? (
                          <img src={product.primary_image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><PackageIcon className="h-12 w-12 text-muted-foreground" /></div>
                        )}
                        {product.mark && (
                          <span className="absolute right-3 top-3 rounded-full bg-[#0B1220]/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{product.mark.name}</span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-tight text-foreground">{product.name}</h3>
                        {(product.voltage || product.wattage || product.amperage) && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {product.voltage ? <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold tabular-nums"><Zap className="h-3 w-3 text-electric" />{product.voltage}V</span> : null}
                            {product.wattage ? <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold tabular-nums"><Zap className="h-3 w-3 text-electric" />{product.wattage}W</span> : null}
                            {product.amperage ? <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold tabular-nums"><Zap className="h-3 w-3 text-electric" />{product.amperage}A</span> : null}
                          </div>
                        )}
                        <div className="mt-auto pt-4">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{language === 'fr' ? 'Prix boutique' : language === 'ar' ? 'السعر' : 'Store price'}</p>
                          <p className="font-sora text-xl font-bold tabular-nums text-foreground">{formatDA(product.selling_price)}</p>
                          <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-border pt-3">
                            <button
                              type="button"
                              onClick={() => {
                                const boutiquUrl = window.location.origin + '/website-shop/offers#product-' + product.id;
                                navigator.clipboard.writeText(boutiquUrl);
                                toast({ title: language === 'ar' ? 'تم نسخ الرابط' : language === 'fr' ? 'Lien copié' : 'Link copied' });
                              }}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-surface-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                            >
                              <Copy className="h-4 w-4" />{language === 'ar' ? 'نسخ' : language === 'fr' ? 'Lien' : 'Link'}
                            </button>
                            <button
                              type="button"
                              onClick={() => window.open('/website-shop/offers', '_blank')}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-electric/10 text-xs font-semibold text-electric transition-colors hover:bg-electric hover:text-white"
                            >
                              <Eye className="h-4 w-4" />{language === 'ar' ? 'عرض' : language === 'fr' ? 'Voir' : 'View'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { window.location.href = '/inventory'; }}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-volt text-xs font-semibold text-volt-foreground transition-colors hover:brightness-95"
                            >
                              <Edit2 className="h-4 w-4" />{language === 'ar' ? 'تحديث' : language === 'fr' ? 'Modifier' : 'Edit'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* PACKAGES TAB */}
          {activeTab === 'packages' && (
            <motion.div
              key="packages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Header */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">{language === 'ar' ? 'الباقات والحزم' : language === 'fr' ? 'Gestion des Packs' : 'Package Management'}</h2>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إنشء حزم منتجات مخصصة بأسعار جذابة' : language === 'fr' ? 'Créez des bundles de produits personnalisés' : 'Create custom product bundles'}</p>
              </div>

              {/* Create Package Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowCreatePackageDialog(true);
                  setEditingPackage(null);
                  setPackageName('');
                  setPackagePrice('');
                  setPackageDescription('');
                  setSelectedProductsPackage([]);
                }}
                className="w-full text-primary-foreground font-bold text-sm sm:text-lg h-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center gap-2 sm:gap-3 border-0 transition-all bg-primary"
              >
                <Plus className="h-5 sm:h-7 w-5 sm:w-7" />
                <span className="hidden sm:inline">+ {language === 'ar' ? 'حزمة جديدة' : language === 'fr' ? 'Nouveau Pack' : 'New Package'}</span>
                <span className="sm:hidden">{language === 'ar' ? 'جديدة' : language === 'fr' ? 'Nouveau' : 'New'}</span>
                <Sparkles className="hidden sm:block h-7 w-7" />
              </motion.button>

              {/* Packages Grid */}
              {packages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-24 rounded-2xl sm:rounded-2xl border-2 border-dashed border-border bg-card"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <PackageIcon className="h-16 sm:h-28 w-16 sm:w-28 mx-auto text-success" />
                  </motion.div>
                  <p className="text-xl sm:text-3xl font-bold text-foreground mb-2">
                    {language === 'ar' ? 'لا توجد حزم حالياً' : language === 'fr' ? 'Aucun pack créé' : 'No packages yet'}
                  </p>
                  <p className="text-sm sm:text-lg text-muted-foreground">
                    {language === 'ar' ? 'اضغط الزر أعلاه لإنشاء حزمة جديدة' : language === 'fr' ? 'Cliquez sur le bouton ci-dessus' : 'Click the button above'}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2 mb-4">
                  <p className="text-base sm:text-lg font-bold text-foreground">
                    {language === 'ar' ? `إجمالي: ${packages.length} حزمة` : language === 'fr' ? `Total: ${packages.length} pack` : `Total: ${packages.length} packages`}
                  </p>
                </div>
              )}

              {packages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {packages.map((pkg, idx) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -4 }}
                      className={`relative rounded-2xl sm:rounded-2xl border-2 sm:border-3 overflow-hidden shadow-sm sm:shadow-lg hover:shadow-md transition-all ${
                        !pkg.is_visible
                          ? 'opacity-50 border-border bg-surface-2'
                          : 'border-border bg-card'
                      }`}
                    >
                      {/* Top Badge */}
                      <div className="absolute top-0 left-0 right-0 text-primary-foreground px-3 sm:px-4 py-1 sm:py-2 flex justify-between items-center z-20 text-sm sm:text-base bg-primary">
                        <span className="font-bold">{language === 'ar' ? 'حزمة' : language === 'fr' ? 'Pack' : 'Package'}</span>
                        {!pkg.is_visible && <span className="text-xs sm:text-sm bg-destructive px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Hidden</span>}
                      </div>

                      {/* Discount Badge */}
                      {pkg.discount_percentage && (
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute top-10 sm:top-12 right-2 sm:right-3 text-primary-foreground px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold z-10 shadow-sm border-2 border-white bg-primary"
                        >
                          -{pkg.discount_percentage}%
                        </motion.div>
                      )}

                      {/* Image */}
                      <div className="mt-8 sm:mt-10">
                        {pkg.image_url ? (
                          <div className="h-32 sm:h-40 relative overflow-hidden bg-card">
                            <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="h-32 sm:h-40 flex items-center justify-center bg-card">
                            <PackageIcon className="h-12 sm:h-12 w-12 sm:w-16 text-success" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-6">
                        {/* Name */}
                        <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-1 line-clamp-2">{pkg.name}</h3>

                        {/* Product Count Badge */}
                        <div className="inline-block bg-success/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold text-success mb-3">
                          {language === 'ar' ? `${packages.filter(p => p.id === pkg.id).length} منتج` : language === 'fr' ? `${packages.filter(p => p.id === pkg.id).length} produit` : `1 package`}
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{pkg.description || '—'}</p>

                        {/* Price Section */}
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border border-border bg-card">
                          <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">{language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'}</div>
                          <div className="text-2xl sm:text-3xl font-bold text-success">
                            {pkg.package_price?.toFixed(2) || '0.00'} DZD
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          <motion.button
                            whileHover={{ scale: 1.08, y: -3 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              setSelectedPackageDetails(pkg);
                              setShowPackageDetails(true);
                            }}
                            className="text-primary-foreground font-bold py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm border border-border bg-primary"
                            title="View details"
                          >
                            
                            <span className="hidden sm:inline">{language === 'ar' ? 'عرض' : language === 'fr' ? 'Voir' : 'View'}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.08, y: -3 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleEditPackage(pkg)}
                            className="text-primary-foreground font-bold py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm border border-border bg-primary"
                            title="Edit package"
                          >
                            
                            <span className="hidden sm:inline">{language === 'ar' ? 'تعديل' : language === 'fr' ? 'Éditer' : 'Edit'}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.08, y: -3 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleTogglePackageVisibility(pkg)}
                            className={`font-bold py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm border-2 ${
                              pkg.is_visible
                                ? 'text-primary-foreground border-border bg-primary'
                                : 'text-primary-foreground border-border bg-primary'
                            }`}
                            title={pkg.is_visible ? 'Hide package' : 'Show package'}
                          >
                            {pkg.is_visible ? '' : ''}
                            <span className="hidden sm:inline">{pkg.is_visible ? (language === 'ar' ? 'إظهار' : language === 'fr' ? 'Afficher' : 'Show') : (language === 'ar' ? 'إخفاء' : language === 'fr' ? 'Masquer' : 'Hide')}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.08, y: -3 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              setSelectedPackageDelete(pkg.id);
                              setShowDeletePackageDialog(true);
                            }}
                            className="text-primary-foreground font-bold py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm border border-border bg-primary"
                            title="Delete package"
                          >
                            
                            <span className="hidden sm:inline">{language === 'ar' ? 'حذف' : language === 'fr' ? 'Supprimer' : 'Delete'}</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Create Package Dialog */}
              <Dialog open={showCreatePackageDialog} onOpenChange={setShowCreatePackageDialog}>
                <DialogContent className="w-[95vw] max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[90vh] border-2 sm:border-3 border-border rounded-2xl sm:rounded-2xl shadow-sm sm:shadow-md p-4 sm:p-6 overflow-y-auto flex flex-col bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-2xl sm:text-2xl flex items-center gap-2 sm:gap-3 text-success font-bold">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        
                      </motion.div>
                      <span className="line-clamp-1">{language === 'ar' ? 'إنشاء حزمة جديدة' : language === 'fr' ? 'Créer un nouveau Pack' : 'Create New Package'}</span>
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'قم بإنشاء حزمة منتجات جديدة مع اختيار المنتجات والسعر' : language === 'fr' ? 'Créez une nouvelle offre groupée de produits' : 'Create a new product package bundle'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                    {/* Step 1: Package Details */}
                    <div className="bg-surface-2 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border">
                      <h3 className="text-lg sm:text-xl font-bold text-success mb-3 sm:mb-4">{language === 'ar' ? 'بيانات الحزمة' : language === 'fr' ? 'Informations du Pack' : 'Package Details'}</h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {/* Package Name */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            {language === 'ar' ? 'اسم الحزمة' : language === 'fr' ? 'Nom du Pack' : 'Package Name'}
                          </Label>
                          <Input
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل اسم الحزمة' : language === 'fr' ? 'Nom du pack' : 'Package name'}
                            className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Package Price */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            {language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'}
                          </Label>
                          <Input
                            type="number"
                            value={packagePrice}
                            onChange={(e) => setPackagePrice(e.target.value)}
                            placeholder="0.00"
                            className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                          </Label>
                          <textarea
                            value={packageDescription}
                            onChange={(e) => setPackageDescription(e.target.value)}
                            placeholder={language === 'ar' ? 'وصف الحزمة' : language === 'fr' ? 'Description du pack' : 'Package description'}
                            className="w-full p-3 sm:p-4 border border-border rounded-lg sm:rounded-xl text-sm sm:text-base h-20 sm:h-24 resize-none font-semibold"
                          />
                        </div>

                        {/* Package Image Upload */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            {language === 'ar' ? 'صورة الحزمة' : language === 'fr' ? 'Image du Pack' : 'Package Image'}
                          </Label>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePackageImageChange}
                              className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 dark:file:bg-emerald-900 dark:file:text-emerald-300 cursor-pointer"
                            />
                            {packageImagePreview && (
                              <motion.img
                                src={packageImagePreview}
                                alt="Package preview"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-12 sm:h-12 w-12 sm:w-16 rounded-lg object-cover border border-border"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Search and Add Products */}
                    <div className="bg-surface-2 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border">
                      <h3 className="text-lg sm:text-xl font-bold text-electric mb-3 sm:mb-4">{language === 'ar' ? 'اختر المنتجات' : language === 'fr' ? 'Sélectionner les Produits' : 'Select Products'}</h3>
                      
                      <div className="space-y-3">
                        <Input
                          type="text"
                          placeholder={language === 'ar' ? 'ابحث عن منتج...' : language === 'fr' ? 'Rechercher un produit' : 'Search product...'}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl"
                        />

                        {/* Product Selection */}
                        {searchQuery && (
                          <div className="max-h-56 overflow-y-auto border-3 border-dashed border-border rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 bg-card">
                            {products
                              .filter(
                                (p) =>
                                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.mark?.name.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .length === 0 ? (
                              <p className="text-center text-muted-foreground py-4 text-sm">No products found</p>
                            ) : (
                              products
                                .filter(
                                  (p) =>
                                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    p.mark?.name.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((product) => (
                                  <motion.button
                                    key={product.id}
                                    onClick={() => handleSelectProductForPackage(product)}
                                    whileHover={{ x: 5, scale: 1.02 }}
                                    className="w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all border border-border bg-card"
                                  >
                                    <div className="font-bold text-sm sm:text-base text-electric">
                                      {product.name}
                                    </div>
                                    <div className="text-xs sm:text-sm text-electric">
                                      {product.mark?.name || 'N/A'} • {product.selling_price} DZD
                                    </div>
                                  </motion.button>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Selected Products */}
                    {selectedProductsPackage.length > 0 && (
                      <div className="bg-surface-2 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border">
                        <h3 className="text-lg sm:text-xl font-bold text-electric mb-3 sm:mb-4">
                          {language === 'ar' ? 'المنتجات المختارة' : language === 'fr' ? 'Produits Sélectionnés' : 'Selected Products'} ({selectedProductsPackage.length})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {selectedProductsPackage.map((item, idx) => (
                            <motion.div
                              key={item.product.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border shadow-sm bg-card"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm sm:text-base text-electric truncate">
                                    {item.product.name}
                                  </div>
                                  <div className="text-xs sm:text-sm text-electric truncate">
                                    {item.product.mark?.name || 'N/A'} • {item.product.selling_price} DZD
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.15, rotate: 10 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveProductFromPackage(item.product.id)}
                                  className="text-primary-foreground p-2 sm:p-3 rounded-lg shadow-sm transition-all flex-shrink-0 ml-2 bg-primary"
                                >
                                  
                                </motion.button>
                              </div>
                              
                              {/* Quantity and Price Inputs */}
                              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-border">
                                <div>
                                  <label className="text-xs sm:text-sm font-semibold text-electric block mb-1">
                                    {language === 'ar' ? 'الكمية' : language === 'fr' ? 'Quantité' : 'Quantity'}
                                  </label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateProductQuantity(item.product.id, parseInt(e.target.value))}
                                    className="h-8 sm:h-10 text-sm border border-border rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs sm:text-sm font-semibold text-electric block mb-1">
                                    {language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'} (DZD)
                                  </label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.customPrice}
                                    onChange={(e) => handleUpdateProductPrice(item.product.id, e.target.value)}
                                    className="h-8 sm:h-10 text-sm border border-border rounded-lg"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-border">
                    <Button
                      onClick={() => setShowCreatePackageDialog(false)}
                      className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all"
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={handleCreatePackage}
                      className="flex-1 text-primary-foreground font-bold text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 bg-primary"
                    >
                      <Plus className="h-5 sm:h-6 w-5 sm:w-6" />
                      <span className="hidden sm:inline">{language === 'ar' ? 'إنشاء الحزمة' : language === 'fr' ? 'Créer le Pack' : 'Create Package'}</span>
                      <span className="sm:hidden">{language === 'ar' ? 'إنشاء' : language === 'fr' ? 'Créer' : 'Create'}</span>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Package Dialog */}
              <Dialog open={showEditPackageDialog} onOpenChange={setShowEditPackageDialog}>
                <DialogContent className="w-[95vw] max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[90vh] border-2 sm:border-3 border-border rounded-2xl sm:rounded-2xl shadow-sm sm:shadow-md p-4 sm:p-6 overflow-y-auto flex flex-col bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-2xl sm:text-2xl flex items-center gap-2 sm:gap-3 text-warning font-bold">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        
                      </motion.div>
                      <span className="line-clamp-1">{language === 'ar' ? 'تعديل الحزمة' : language === 'fr' ? 'Modifier le Pack' : 'Edit Package'}</span>
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'قم بتعديل بيانات الحزمة والمنتجات' : language === 'fr' ? 'Modifiez les données du pack et les produits' : 'Edit package information and products'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                    {/* Step 1: Package Details */}
                    <div className="bg-surface-2 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-border">
                      <h3 className="text-lg sm:text-xl font-bold text-warning mb-3 sm:mb-4">{language === 'ar' ? 'بيانات الحزمة' : language === 'fr' ? 'Informations du Pack' : 'Package Details'}</h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {/* Package Name */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            {language === 'ar' ? 'اسم الحزمة' : language === 'fr' ? 'Nom du Pack' : 'Package Name'}
                          </Label>
                          <Input
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل اسم الحزمة' : language === 'fr' ? 'Nom du pack' : 'Package name'}
                            className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Package Price */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            {language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'}
                          </Label>
                          <Input
                            type="number"
                            value={packagePrice}
                            onChange={(e) => setPackagePrice(e.target.value)}
                            placeholder="0.00"
                            className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Package Description */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                          </Label>
                          <Input
                            value={packageDescription}
                            onChange={(e) => setPackageDescription(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل وصف الحزمة' : language === 'fr' ? 'Description du pack' : 'Package description'}
                            className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Product Selection */}
                    <div className="bg-surface-2 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border">
                      <h3 className="text-lg sm:text-xl font-bold text-electric mb-3 sm:mb-4">{language === 'ar' ? 'اختيار المنتجات' : language === 'fr' ? 'Sélectionner les Produits' : 'Select Products'}</h3>
                      
                      {/* Search Field */}
                      <div className="mb-4">
                        <Input
                          type="text"
                          placeholder={language === 'ar' ? 'ابحث عن منتج...' : language === 'fr' ? 'Rechercher un produit' : 'Search product name...'}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl w-full"
                        />
                      </div>

                      {/* Product Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {products
                          .filter(
                            (p) =>
                              p.name.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((product, idx) => (
                          <motion.button
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => {
                              const isSelected = selectedProductsPackage.some((p) => p.product.id === product.id);
                              if (isSelected) {
                                setSelectedProductsPackage(selectedProductsPackage.filter((p) => p.product.id !== product.id));
                              } else {
                                setSelectedProductsPackage([...selectedProductsPackage, { product, quantity: 1, customPrice: product.selling_price.toString() }]);
                              }
                            }}
                            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 text-left transition-all ${
                              selectedProductsPackage.some((p) => p.product.id === product.id)
                                ? 'bg-primary border-electric text-primary-foreground shadow-sm'
                                : 'bg-card border-border text-foreground hover:border-electric'
                            }`}
                          >
                            <div className="font-bold text-xs sm:text-sm truncate">{product.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{product.mark?.name || 'Charger'}</div>
                          </motion.button>
                        ))}
                      </div>
                      {products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <p className="text-center text-muted-foreground py-4 text-sm">{language === 'ar' ? 'لا توجد منتجات' : language === 'fr' ? 'Aucun produit' : 'No products found'}</p>
                      )}
                    </div>

                    {/* Step 3: Selected Products */}
                    {selectedProductsPackage.length > 0 && (
                      <div className="bg-surface-2 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border">
                        <h3 className="text-lg sm:text-xl font-bold text-electric mb-3 sm:mb-4">
                          {language === 'ar' ? 'المنتجات المختارة' : language === 'fr' ? 'Produits Sélectionnés' : 'Selected Products'} ({selectedProductsPackage.length})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {selectedProductsPackage.map((item, idx) => (
                            <motion.div
                              key={item.product.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border shadow-sm bg-card"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm sm:text-base text-electric truncate">
                                    {item.product.name}
                                  </div>
                                  <div className="text-xs sm:text-sm text-electric truncate">
                                    {item.product.mark?.name || 'N/A'} • {item.product.selling_price} DZD
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.15, rotate: 10 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveProductFromPackage(item.product.id)}
                                  className="text-primary-foreground p-2 sm:p-3 rounded-lg shadow-sm transition-all flex-shrink-0 ml-2 bg-primary"
                                >
                                  
                                </motion.button>
                              </div>
                              
                              {/* Quantity and Price Inputs */}
                              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-border">
                                <div>
                                  <label className="text-xs sm:text-sm font-semibold text-electric block mb-1">
                                    {language === 'ar' ? 'الكمية' : language === 'fr' ? 'Quantité' : 'Quantity'}
                                  </label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateProductQuantity(item.product.id, parseInt(e.target.value))}
                                    className="h-8 sm:h-10 text-sm border border-border rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs sm:text-sm font-semibold text-electric block mb-1">
                                    {language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'} (DZD)
                                  </label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.customPrice}
                                    onChange={(e) => handleUpdateProductPrice(item.product.id, e.target.value)}
                                    className="h-8 sm:h-10 text-sm border border-border rounded-lg"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-border">
                    <Button
                      onClick={() => setShowEditPackageDialog(false)}
                      className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all"
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={handleUpdatePackage}
                      className="flex-1 text-primary-foreground font-bold text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 bg-primary"
                    >
                      <Check className="h-5 sm:h-6 w-5 sm:w-6" />
                      <span className="hidden sm:inline">{language === 'ar' ? 'حفظ التغييرات' : language === 'fr' ? 'Sauvegarder' : 'Save Changes'}</span>
                      <span className="sm:hidden">{language === 'ar' ? 'حفظ' : language === 'fr' ? 'Sauvegarder' : 'Save'}</span>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Package Details Dialog */}
              {selectedPackageDetails && (
                <Dialog open={showPackageDetails} onOpenChange={setShowPackageDetails}>
                  <DialogContent className="max-w-2xl bg-card border border-border rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-3xl flex items-center gap-2 text-success">
                        <PackageIcon className="h-8 w-8" />
                        {selectedPackageDetails.name}
                      </DialogTitle>
                      <DialogDescription className="hidden">
                        {language === 'ar' ? 'تفاصيل الحزمة والمنتجات المضمنة' : language === 'fr' ? 'Détails du package et des produits inclus' : 'Package details and included products'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-6">
                      <div>
                        <h4 className="font-bold text-lg mb-2">{language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}</h4>
                        <p className="text-muted-foreground">{selectedPackageDetails.description}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-card">
                        <p className="text-2xl font-bold text-success">
                          {selectedPackageDetails.package_price} DZD
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-lg mb-3 flex items-center gap-2">{t.packages.products_added}</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {packageItems
                            .filter((item) => item.package_id === selectedPackageDetails.id)
                            .map((item) => (
                              <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 rounded-xl border border-border flex gap-4 items-start hover:shadow-md transition-all bg-card"
                              >
                                {item.product_image && (
                                  <img src={item.product_image} alt={item.product_name} className="h-20 w-20 object-cover rounded-lg flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-1">
                                    <div>
                                      <div className="font-bold text-foreground text-base">{item.product_name}</div>
                                      <div className="text-sm text-muted-foreground">{item.product_mark}</div>
                                    </div>
                                    <div className="rounded-lg px-3 py-2 flex-shrink-0 bg-primary text-primary-foreground">
                                      <div className="text-center">
                                        <p className="text-xs text-white font-semibold uppercase">Qty</p>
                                        <p className="text-xl font-bold text-white">{item.quantity || 1}</p>
                                      </div>
                                    </div>
                                  </div>
                                  {item.product_voltage && (
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                      {item.product_voltage && (
                                        <span className="text-xs bg-surface-2 text-electric px-2 py-1 rounded">{item.product_voltage}V</span>
                                      )}
                                      {item.product_amperage && (
                                        <span className="text-xs bg-surface-2 text-electric px-2 py-1 rounded">{item.product_amperage}A</span>
                                      )}
                                      {item.product_wattage && (
                                        <span className="text-xs bg-surface-2 text-warning px-2 py-1 rounded">{item.product_wattage}W</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button onClick={() => setShowPackageDetails(false)} className="bg-success hover:bg-success/90 text-white font-bold text-lg h-11 px-6 rounded-xl">
                        {t.common.close}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Delete Package Dialog */}
              <Dialog open={showDeletePackageDialog} onOpenChange={setShowDeletePackageDialog}>
                <DialogContent className="bg-surface-2 border border-border">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive text-2xl">
                      <AlertCircle className="h-7 w-7" />
                      {language === 'ar' ? 'تأكيد الحذف' : language === 'fr' ? 'Confirmer la suppression' : 'Confirm Delete'}
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'تأكيد حذف الحزمة من النظام' : language === 'fr' ? 'Confirmer la suppression du paquet' : 'Confirm package deletion'}
                    </DialogDescription>
                  </DialogHeader>

                  <p className="text-lg text-foreground">
                    {language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه الحزمة؟'
                      : language === 'fr'
                      ? 'Êtes-vous sûr de vouloir supprimer ce paquet?'
                      : 'Are you sure you want to delete this package?'}
                  </p>

                  <DialogFooter>
                    <Button onClick={() => setShowDeletePackageDialog(false)} className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.cancel}
                    </Button>
                    <Button onClick={handleDeletePackage} className="bg-destructive hover:bg-destructive/90 text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.delete}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* SPECIAL OFFERS TAB - WITH PRICE VISIBILITY TOGGLE */}
          {activeTab === 'special' && (
            <motion.div
              key="special"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Create Special Offer Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowCreateSpecialDialog(true);
                  setEditingSpecialOffer(null);
                  setSelectedProductSpecial(null);
                  setSpecialPrice('');
                  setSpecialOfferDescription('');
                  setShowSpecialPrice(true);
                  setSearchQuery('');
                  setOriginalPriceSpecial(0);
                }}
                className="w-full text-primary-foreground font-bold text-lg h-12 rounded-[12px] shadow-sm flex items-center justify-center gap-3 bg-primary"
              >
                <Plus className="h-6 w-6" />
                {t.special.create}
              </motion.button>

              {/* Special Offers Grid */}
              {specialOffers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-card rounded-2xl border-2 border-dashed border-border"
                >
                  <Tag className="h-20 w-20 mx-auto mb-4 text-electric" />
                  <p className="text-2xl text-muted-foreground font-bold">
                    {language === 'ar' ? 'لا توجد عروض خاصة' : language === 'fr' ? 'Aucune offre spéciale' : 'No special offers'}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {specialOffers.map((offer, idx) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`relative rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all ${
                        !offer.is_visible
                          ? 'opacity-60 border-border bg-surface-2'
                          : 'border-border bg-card'
                      }`}
                    >
                      {/* Image */}
                      {offer.product_image && (
                        <div className="h-40 relative overflow-hidden bg-card">
                          <img src={offer.product_image} alt={offer.product_name} className="w-full h-full object-cover" />
                          {offer.show_price && (
                            <div className="absolute bottom-0 right-0 bg-destructive text-white px-3 py-1 text-sm font-bold">
                              -{Math.round(offer.discount_percentage)}%
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-foreground mb-1">{offer.product_name}</h3>
                        <p className="text-xs text-electric font-semibold mb-3">{offer.product_mark}</p>

                        {/* Price Visibility Badge */}
                        <div className="mb-3">
                          <Badge className={`${offer.show_price ? 'bg-surface-2 text-success' : 'bg-surface-2 text-warning'}`}>
                            {offer.show_price ? '' + t.special.display : '' + t.special.dont_display}
                          </Badge>
                        </div>

                        {/* Price Display (if visible) */}
                        {offer.show_price && (
                          <div className="p-3 rounded-xl mb-4 bg-card">
                            <div className="text-sm text-muted-foreground line-through">
                              {offer.original_price} DZD
                            </div>
                            <div className="text-2xl font-bold text-destructive">
                              {offer.special_price} DZD
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {offer.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{offer.description}</p>
                        )}

                        {/* WhatsApp Button (if price hidden) */}
                        {!offer.show_price && (
                          <motion.a
                            href={offer.whatsapp_link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -2 }}
                            className="w-full bg-success hover:bg-success/90 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 mb-3 transition-colors"
                          >
                            <MessageCircle className="h-5 w-5" />
                            WhatsApp
                          </motion.a>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              setSelectedSpecialDetails(offer);
                              setShowSpecialDetails(true);
                            }}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 rounded-lg transition-colors"
                          >
                            {t.common.view}
                          </motion.button>
                          <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              setEditingSpecialOffer(offer);
                              setSelectedProductSpecial(undefined as any);
                              setOriginalPriceSpecial(offer.original_price);
                              setSpecialPrice(offer.special_price.toString());
                              setSpecialOfferDescription(offer.description || '');
                              setShowSpecialPrice(offer.show_price ?? true);
                              setShowCreateSpecialDialog(true);
                            }}
                            className="flex-1 bg-muted-foreground hover:bg-muted-foreground text-white font-bold py-2 rounded-lg transition-colors"
                          >
                            
                          </motion.button>
                          <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              setSelectedSpecialDelete(offer.id);
                              setShowDeleteSpecialDialog(true);
                            }}
                            className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold py-2 rounded-lg transition-colors"
                          >
                            
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Create Special Offer Dialog with Price Visibility */}
              <Dialog open={showCreateSpecialDialog} onOpenChange={setShowCreateSpecialDialog}>
                <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl sm:rounded-2xl p-4 sm:p-6 overflow-y-auto flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-3xl flex items-center gap-2 text-electric">
                      <Tag className="h-8 w-8" />
                      {t.special.create}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                    {/* Product Selection */}
                    {!editingSpecialOffer && (
                      <>
                        <div className="space-y-3">
                          <Label className="text-lg font-bold">{language === 'ar' ? 'ابحث عن المنتج' : language === 'fr' ? 'Rechercher un produit' : 'Search Product'}</Label>
                          <Input
                            type="text"
                            placeholder={t.special.create}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 text-base"
                          />
                        </div>

                        {/* Products Search Results */}
                        {searchQuery && (
                          <div className="max-h-48 overflow-y-auto border border-border rounded-xl p-3 space-y-2">
                            {products
                              .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.mark?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((product) => (
                                <motion.button
                                  key={product.id}
                                  onClick={() => handleSelectProductSpecial(product)}
                                  whileHover={{ x: 5 }}
                                  className="w-full text-left p-3 rounded-lg bg-surface-2 hover:bg-surface-2 transition-colors"
                                >
                                  <div className="font-bold text-electric">{product.name}</div>
                                  <div className="text-sm text-electric">{product.mark?.name} - {product.selling_price} DZD</div>
                                </motion.button>
                              ))}
                          </div>
                        )}

                        {selectedProductSpecial && (
                          <div className="p-4 bg-surface-2 rounded-xl border border-border">
                            <p className="font-bold text-electric">
                              {selectedProductSpecial.name}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Price Visibility Toggle */}
                    <div className="space-y-4">
                      <Label className="text-lg font-bold">{t.special.price_toggle}</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.button
                          whileHover={{ y: -2 }}
                          onClick={() => setShowSpecialPrice(true)}
                          className={`p-4 rounded-xl border-2 font-bold transition-all ${
                            showSpecialPrice
                              ? 'border-success bg-surface-2 text-success'
                              : 'border-border bg-surface-2 text-muted-foreground'
                          }`}
                        >
                          {t.special.display}
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -2 }}
                          onClick={() => setShowSpecialPrice(false)}
                          className={`p-4 rounded-xl border-2 font-bold transition-all ${
                            !showSpecialPrice
                              ? 'border-warning bg-surface-2 text-warning'
                              : 'border-border bg-surface-2 text-muted-foreground'
                          }`}
                        >
                          {t.special.dont_display}
                        </motion.button>
                      </div>
                    </div>

                    {/* Price Input (if showing price) */}
                    {showSpecialPrice && (
                      <div className="space-y-3">
                        <Label className="text-lg font-bold">{language === 'ar' ? 'السعر الخاص' : language === 'fr' ? 'Prix spécial' : 'Special Price'}</Label>
                        <Input
                          type="number"
                          value={specialPrice}
                          onChange={(e) => handleSpecialPriceChange(e.target.value)}
                          placeholder="0.00"
                          className="h-12 text-base"
                        />
                        {discountAmountSpecial > 0 && (
                          <div className="bg-surface-2 p-3 rounded-xl">
                            <p className="text-destructive font-bold">
                              {language === 'ar' ? 'الخصم' : language === 'fr' ? 'Remise' : 'Discount'}: {discountAmountSpecial} DZD ({discountPercentSpecial}%)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-3">
                      <Label className="text-lg font-bold">
                        {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                        {!showSpecialPrice && <span className="text-destructive"> *</span>}
                      </Label>
                      <p className="text-sm text-muted-foreground italic">{t.special.info}</p>
                      <textarea
                        value={specialOfferDescription}
                        onChange={(e) => setSpecialOfferDescription(e.target.value)}
                        placeholder={!showSpecialPrice ? t.special.description_req : 'Optional description...'}
                        className="w-full p-3 border border-border rounded-xl text-base h-24 resize-none"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={() => setShowCreateSpecialDialog(false)} className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={handleCreateSpecialOfferWithPriceToggle}
                      className="text-primary-foreground font-bold text-lg h-11 px-6 rounded-xl bg-primary"
                    >
                      {t.special.create_btn}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Special Offer Details Dialog */}
              {selectedSpecialDetails && (
                <Dialog open={showSpecialDetails} onOpenChange={setShowSpecialDetails}>
                  <DialogContent className="max-w-2xl bg-card border border-border rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-3xl flex items-center gap-2 text-electric">
                        <Tag className="h-8 w-8" />
                        {selectedSpecialDetails.product_name}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-6">
                      {selectedSpecialDetails.product_image && (
                        <img src={selectedSpecialDetails.product_image} alt={selectedSpecialDetails.product_name} className="w-full h-64 object-cover rounded-xl" />
                      )}

                      {selectedSpecialDetails.show_price && (
                        <div className="p-4 rounded-xl bg-card">
                          <p className="text-sm text-muted-foreground">Original Price</p>
                          <p className="text-3xl font-bold text-destructive line-through">{selectedSpecialDetails.original_price} DZD</p>
                          <p className="text-sm text-muted-foreground mt-2">Special Price</p>
                          <p className="text-4xl font-bold text-success">{selectedSpecialDetails.special_price} DZD</p>
                          <p className="text-lg font-bold text-destructive mt-2">Save {selectedSpecialDetails.discount_percentage}%</p>
                        </div>
                      )}

                      {!selectedSpecialDetails.show_price && (
                        <div className="bg-surface-2 border border-border p-4 rounded-xl">
                          <p className="font-bold text-warning mb-3">Price Hidden - Contact via WhatsApp</p>
                          <motion.a
                            href={selectedSpecialDetails.whatsapp_link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -2 }}
                            className="block w-full bg-success hover:bg-success/90 text-white font-bold py-3 rounded-lg text-center"
                          >
                            Contact on WhatsApp
                          </motion.a>
                        </div>
                      )}

                      {selectedSpecialDetails.description && (
                        <div>
                          <h4 className="font-bold text-lg mb-2">Description</h4>
                          <p className="text-muted-foreground">{selectedSpecialDetails.description}</p>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button onClick={() => setShowSpecialDetails(false)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-11 px-6 rounded-xl">
                        {t.common.close}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Delete Special Offer Dialog */}
              <Dialog open={showDeleteSpecialDialog} onOpenChange={setShowDeleteSpecialDialog}>
                <DialogContent className="bg-surface-2 border border-border">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive text-2xl">
                      <AlertCircle className="h-7 w-7" />
                      Confirm Delete
                    </DialogTitle>
                  </DialogHeader>

                  <p className="text-lg text-foreground">Are you sure you want to delete this special offer?</p>

                  <DialogFooter>
                    <Button onClick={() => setShowDeleteSpecialDialog(false)} className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={async () => {
                        if (selectedSpecialDelete) {
                          try {
                            await deleteSpecialOffer(selectedSpecialDelete);
                            toast({ title: t.common.success });
                            setShowDeleteSpecialDialog(false);
                            setSelectedSpecialDelete(null);
                            fetchAllData();
                          } catch (error) {
                            toast({ title: t.common.error, variant: 'destructive' });
                          }
                        }
                      }}
                      className="bg-destructive hover:bg-destructive/90 text-white font-bold text-lg h-11 px-6 rounded-xl"
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl overflow-hidden shadow-sm border border-border p-8 bg-primary text-primary-foreground"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-2xl shadow-sm bg-primary text-primary-foreground">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold text-foreground">
                      {language === 'ar' ? 'إدارة جهات الاتصال' : 'Gestion des Contacts'}
                    </h2>
                    <p className="text-muted-foreground mt-2">
                      {language === 'ar' ? 'أضف روابط وسائل التواصل الاجتماعي وبيانات الاتصال' : 'Ajoutez vos réseaux sociaux et informations de contact'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Social Media URLs Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border-2 border-electric rounded-2xl overflow-hidden shadow-sm p-0 bg-primary text-primary-foreground"
              >
                <div className="px-8 py-6 border-b-2 border-electric bg-primary text-primary-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <LinkIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {language === 'ar' ? 'روابط وسائل التواصل الاجتماعي' : 'Liens Réseaux Sociaux'}
                    </h3>
                  </div>
                  <p className="text-primary-foreground mt-2 ml-11">
                    {language === 'ar' ? 'أضف روابط الملفات الشخصية لديك على منصات التواصل' : 'Ajoutez les URLs de vos profils sociaux'}
                  </p>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Facebook */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <div className="bg-card rounded-2xl p-5 border border-border hover:border-electric hover:shadow-md transition-all duration-300">
                        <Label className="flex items-center gap-3 font-bold mb-3 p-3 bg-surface-2 rounded-xl text-electric">
                          <Facebook className="h-5 w-5" />
                          <span>Facebook</span>
                        </Label>
                        <Input
                          type="url"
                          placeholder="https://facebook.com/yourpage"
                          value={settings.facebook_url || ''}
                          onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                          className="border border-border h-12 rounded-xl focus:border-electric bg-card transition-all"
                        />
                      </div>
                    </motion.div>

                    {/* Instagram */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="bg-card rounded-2xl p-5 border border-border hover:border-electric hover:shadow-md transition-all duration-300">
                        <Label className="flex items-center gap-3 font-bold mb-3 p-3 bg-surface-2 rounded-xl text-electric">
                          <Instagram className="h-5 w-5" />
                          <span>Instagram</span>
                        </Label>
                        <Input
                          type="url"
                          placeholder="https://instagram.com/yourprofile"
                          value={settings.instagram_url || ''}
                          onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                          className="border border-border h-12 rounded-xl focus:border-electric bg-card transition-all"
                        />
                      </div>
                    </motion.div>

                    {/* TikTok */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <div className="bg-card rounded-2xl p-5 border-2 border-black/30 hover:border-black/60 hover:shadow-md transition-all duration-300">
                        <Label className="flex items-center gap-3 font-bold mb-3 p-3 bg-surface-2 rounded-xl text-foreground">
                          <Smartphone className="h-5 w-5" />
                          <span>TikTok</span>
                        </Label>
                        <Input
                          type="url"
                          placeholder="https://tiktok.com/@yourprofile"
                          value={settings.tiktok_url || ''}
                          onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                          className="border border-border h-12 rounded-xl focus:border-border bg-card transition-all"
                        />
                      </div>
                    </motion.div>

                    {/* Google Maps */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="bg-card rounded-2xl p-5 border border-border hover:border-destructive hover:shadow-md transition-all duration-300">
                        <Label className="flex items-center gap-3 font-bold mb-3 p-3 bg-surface-2 rounded-xl text-destructive">
                          <Map className="h-5 w-5" />
                          <span>{language === 'ar' ? 'خرائط Google' : 'Google Maps'}</span>
                        </Label>
                        <Input
                          type="url"
                          placeholder="https://maps.google.com/..."
                          value={settings.location || ''}
                          onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                          className="border border-border h-12 rounded-xl focus:border-destructive bg-card transition-all"
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Numbers Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="border-2 border-success rounded-2xl overflow-hidden shadow-sm p-0 bg-primary text-primary-foreground"
              >
                <div className="px-8 py-6 border-b-2 border-success bg-primary text-primary-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {language === 'ar' ? 'أرقام الاتصال' : 'Numéros de Contact'}
                    </h3>
                  </div>
                  <p className="text-primary-foreground mt-2 ml-11">
                    {language === 'ar' ? 'أضف أرقام الهاتف والتطبيقات الفورية' : 'Ajoutez vos numéros de téléphone et applications de messagerie'}
                  </p>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Number */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="bg-card rounded-2xl p-5 border border-border hover:border-success hover:shadow-md transition-all duration-300">
                        <Label className="flex items-center gap-3 font-bold mb-3 p-3 bg-surface-2 rounded-xl text-success">
                          <Phone className="h-5 w-5" />
                          <span>{language === 'ar' ? 'رقم الهاتف' : 'Téléphone'}</span>
                        </Label>
                        <Input
                          type="tel"
                          placeholder="+213 5XX XX XX XX"
                          value={settings.phone_number || ''}
                          onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                          className="border border-border h-12 rounded-xl focus:border-success bg-card transition-all"
                        />
                      </div>
                    </motion.div>

                    {/* WhatsApp */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 }}
                    >
                      <div className="bg-card rounded-2xl p-5 border border-border hover:border-success hover:shadow-md transition-all duration-300">
                        <Label className="flex items-center gap-3 font-bold mb-3 p-3 bg-surface-2 rounded-xl text-success">
                          <MessageCircle className="h-5 w-5" />
                          <span>WhatsApp</span>
                        </Label>
                        <Input
                          type="tel"
                          placeholder="+213 5XX XX XX XX"
                          value={settings.whatsapp_number || ''}
                          onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                          className="border border-border h-12 rounded-xl focus:border-success bg-card transition-all"
                        />
                      </div>
                    </motion.div>

                    {/* Telegram */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="bg-card rounded-2xl p-5 border border-border hover:border-electric hover:shadow-md transition-all duration-300">
                        <Label className="flex items-center gap-3 font-bold mb-3 p-3 bg-surface-2 rounded-xl text-electric">
                          <Send className="h-5 w-5" />
                          <span>Telegram</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="@yourusername or +213..."
                          value={settings.telegram_number || ''}
                          onChange={(e) => setSettings({ ...settings, telegram_number: e.target.value })}
                          className="border border-border h-12 rounded-xl focus:border-electric bg-card transition-all"
                        />
                      </div>
                    </motion.div>

                    {/* Location/Address */}
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 }}
                    >
                      <div className="bg-card rounded-2xl p-5 border border-border hover:border-electric hover:shadow-md transition-all duration-300">
                        <Label className="flex items-center gap-3 font-bold mb-3 p-3 bg-surface-2 rounded-xl text-electric">
                          <MapPin className="h-5 w-5" />
                          <span>{language === 'ar' ? 'العنوان' : 'Adresse'}</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder={language === 'ar' ? 'أدخل العنوان الكامل' : 'Entrez l\'adresse complète'}
                          value={settings.location || ''}
                          onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                          className="border border-border h-12 rounded-xl focus:border-electric bg-card transition-all"
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSaveWebsiteSettings()}
                  className="w-full text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-sm border-0 transition-all duration-300 bg-primary"
                >
                  <Check className="h-6 w-6" />
                  {language === 'ar' ? 'حفظ جميع معلومات الاتصال' : 'Sauvegarder tous les contacts'}
                </motion.button>
              </motion.div>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="bg-surface-2 border-l-4 border-electric rounded-xl p-6"
              >
                <div className="flex gap-4">
                  <AlertCircle className="h-6 w-6 text-electric flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-electric mb-2">
                      {language === 'ar' ? 'نصيحة' : 'Conseil'}
                    </h4>
                    <p className="text-electric text-sm">
                      {language === 'ar' 
                        ? 'تأكد من إدخال البيانات الصحيحة. تظهر هذه المعلومات على الموقع الإلكتروني الخاص بك ليتمكن العملاء من التواصل معك.'
                        : 'Assurez-vous d\'entrer les bonnes informations. Ces données apparaîtront sur votre site web pour que les clients puissent vous contacter.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* DELIVERY MANAGEMENT TAB */}
          {activeTab === 'delivery' && (
            <motion.div
              key="delivery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="rounded-2xl sm:rounded-2xl p-4 sm:p-8 text-primary-foreground shadow-sm sm:shadow-md bg-primary">
                <h2 className="text-2xl sm:text-2xl font-bold mb-2">{language === 'ar' ? 'إدارة التوصيل' : language === 'fr' ? 'Gestion de la Livraison' : 'Delivery Management'}</h2>
                <p className="text-base sm:text-lg opacity-90">{language === 'ar' ? 'إضافة وإدارة شركات التوصيل والأسعار' : language === 'fr' ? 'Ajoutez et gérez les agences de livraison' : 'Manage delivery agencies and prices'}</p>
              </div>

              {/* Create Delivery Agency Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowCreateDeliveryDialog(true);
                  setEditingDeliveryAgency(null);
                  setAgencyName('');
                  setAgencyDescription('');
                  setAgencyPhone('');
                  setAgencyEmail('');
                  setPriceDomicile('');
                  setPriceBureau('');
                }}
                className="w-full text-primary-foreground font-bold text-sm sm:text-lg h-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center gap-2 sm:gap-3 border-0 transition-all bg-primary"
              >
                <Plus className="h-5 sm:h-7 w-5 sm:w-7" />
                <span className="hidden sm:inline">+ {language === 'ar' ? 'شركة توصيل جديدة' : language === 'fr' ? 'Nouvelle Agence' : 'New Agency'}</span>
                <span className="sm:hidden">{language === 'ar' ? 'جديدة' : language === 'fr' ? 'Nouveau' : 'New'}</span>
              </motion.button>

              {/* Delivery Agencies Grid */}
              {deliveryAgencies.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-24 rounded-2xl sm:rounded-2xl border-2 border-dashed border-border bg-card"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <Truck className="h-16 sm:h-28 w-16 sm:w-28 mx-auto text-warning" />
                  </motion.div>
                  <p className="text-xl sm:text-3xl font-bold text-foreground mb-2">
                    {language === 'ar' ? 'لا توجد شركات توصيل حالياً' : language === 'fr' ? 'Aucune agence de livraison' : 'No delivery agencies yet'}
                  </p>
                  <p className="text-sm sm:text-lg text-muted-foreground">
                    {language === 'ar' ? 'اضغط الزر أعلاه لإضافة شركة توصيل' : language === 'fr' ? 'Cliquez sur le bouton ci-dessus' : 'Click the button above'}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {deliveryAgencies.map((agency, idx) => (
                    <motion.div
                      key={agency.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -4 }}
                      className={`relative rounded-2xl sm:rounded-2xl border-2 sm:border-3 overflow-hidden shadow-sm sm:shadow-lg hover:shadow-md transition-all p-4 sm:p-6 ${
                        !agency.is_visible
                          ? 'opacity-50 border-border bg-surface-2'
                          : 'border-border bg-card'
                      }`}
                    >
                      {/* Header Badge */}
                      <div className="absolute top-0 left-0 right-0 text-primary-foreground px-3 sm:px-4 py-2 flex justify-between items-center z-20 text-xs sm:text-sm bg-primary">
                        <span className="font-bold">{agency.name}</span>
                        {!agency.is_visible && <span className="text-xs bg-destructive px-2 rounded-full">Hidden</span>}
                      </div>

                      {/* Content */}
                      <div className="mt-12 sm:mt-14 space-y-3 sm:space-y-4">
                        {/* Description */}
                        {agency.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{agency.description}</p>
                        )}

                        {/* Contact Info */}
                        <div className="space-y-1 sm:space-y-2">
                          {agency.contact_phone && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span></span>
                              <span className="text-foreground">{agency.contact_phone}</span>
                            </div>
                          )}
                          {agency.contact_email && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span></span>
                              <span className="text-foreground">{agency.contact_email}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-4 gap-2 pt-3 sm:pt-4">
                          <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => handleOpenWilayaPricingDialog(agency)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-xl"
                            title="Manage Prices"
                          >
                            
                          </motion.button>
                          <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => handleEditDeliveryAgency(agency)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-xl"
                            title="Edit"
                          >
                            
                          </motion.button>
                          <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => handleToggleDeliveryVisibility(agency)}
                            className={`font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-xl ${
                              agency.is_visible
                                ? 'bg-success hover:bg-success/90 text-white'
                                : 'bg-muted-foreground hover:bg-muted-foreground text-white'
                            }`}
                            title={agency.is_visible ? 'Hide' : 'Show'}
                          >
                            {agency.is_visible ? '' : ''}
                          </motion.button>
                          <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              setSelectedDeliveryDelete(agency.id);
                              setShowDeleteDeliveryDialog(true);
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-xl"
                            title="Delete"
                          >
                            
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Create/Edit Delivery Agency Dialog */}
              <Dialog open={showCreateDeliveryDialog} onOpenChange={setShowCreateDeliveryDialog}>
                <DialogContent className="max-w-full w-full sm:max-w-2xl mx-auto border-2 sm:border-3 border-border rounded-2xl sm:rounded-2xl shadow-sm sm:shadow-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto bg-card">
                  <DialogHeader className="mb-4 sm:mb-6">
                    <DialogTitle className="text-2xl sm:text-2xl flex items-center gap-2 sm:gap-3 text-warning font-bold line-clamp-2">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex-shrink-0">
                        
                      </motion.div>
                      <span className="text-lg sm:text-3xl">
                        {editingDeliveryAgency ? `${language === 'ar' ? 'تعديل' : language === 'fr' ? 'Modifier' : 'Edit'}` : `${language === 'ar' ? 'شركة توصيل جديدة' : language === 'fr' ? 'Nouvelle Agence' : 'New Agency'}`}
                      </span>
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'إضافة أو تعديل شركة توصيل' : language === 'fr' ? 'Ajouter ou modifier une agence de livraison' : 'Add or edit delivery agency'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 sm:space-y-6 py-2 sm:py-4">
                    {/* Section 1: Basic Info */}
                    <div className="bg-surface-2 p-3 sm:p-6 rounded-lg sm:rounded-2xl border border-border">
                      <h3 className="text-base sm:text-lg font-bold text-warning mb-3 sm:mb-4">{language === 'ar' ? 'المعلومات الأساسية' : language === 'fr' ? 'Informations de Base' : 'Basic Info'}</h3>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {/* Agency Name */}
                        <div className="space-y-1 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                            {language === 'ar' ? 'اسم الشركة' : language === 'fr' ? 'Nom de l\'Agence' : 'Agency Name'}
                          </Label>
                          <Input
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            placeholder={language === 'ar' ? 'مثل: Yassir' : language === 'fr' ? 'Ex: Yassir' : 'E.g: Yassir'}
                            className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl font-semibold"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-1 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                            {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                          </Label>
                          <Input
                            value={agencyDescription}
                            onChange={(e) => setAgencyDescription(e.target.value)}
                            placeholder={language === 'ar' ? 'وصف الخدمة' : language === 'fr' ? 'Description du service' : 'Service description'}
                            className="h-10 sm:h-12 text-sm sm:text-base border border-border rounded-lg sm:rounded-xl font-semibold"
                          />
                        </div>
                      </div>
                    </div>


                  </div>

                  <DialogFooter className="flex gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-border mt-4 sm:mt-6">
                    <Button
                      onClick={() => {
                        setShowCreateDeliveryDialog(false);
                        setEditingDeliveryAgency(null);
                        setAgencyName('');
                        setAgencyDescription('');
                        setAgencyPhone('');
                        setAgencyEmail('');
                        setPriceDomicile('');
                        setPriceBureau('');
                      }}
                      className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold text-xs sm:text-base h-10 sm:h-12 px-3 sm:px-6 rounded-lg sm:rounded-xl transition-all"
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingDeliveryAgency) {
                          handleUpdateDeliveryAgency();
                        } else {
                          handleCreateDeliveryAgency();
                        }
                      }}
                      className="flex-1 text-primary-foreground font-bold text-xs sm:text-base h-10 sm:h-12 rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 sm:gap-2 bg-primary"
                    >
                      <span className="text-lg sm:text-xl">{editingDeliveryAgency ? '' : ''}</span>
                      <span className="hidden sm:inline">{editingDeliveryAgency ? language === 'ar' ? 'تحديث' : language === 'fr' ? 'Mettre à jour' : 'Update' : language === 'ar' ? 'إنشاء' : language === 'fr' ? 'Créer' : 'Create'}</span>
                      <span className="sm:hidden">{editingDeliveryAgency ? '' : ''}</span>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Delivery Agency Dialog */}
              <Dialog open={showDeleteDeliveryDialog} onOpenChange={setShowDeleteDeliveryDialog}>
                <DialogContent className="bg-surface-2 border border-border rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive text-2xl">
                      <AlertCircle className="h-7 w-7" />
                      {language === 'ar' ? 'تأكيد الحذف' : language === 'fr' ? 'Confirmer la suppression' : 'Confirm Delete'}
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'هل أنت متأكد من حذف شركة التوصيل؟' : language === 'fr' ? 'Êtes-vous sûr de supprimer cette agence?' : 'Confirm delete delivery agency'}
                    </DialogDescription>
                  </DialogHeader>

                  <p className="text-lg text-foreground">
                    {language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه شركة التوصيل؟'
                      : language === 'fr'
                      ? 'Êtes-vous sûr de vouloir supprimer cette agence de livraison?'
                      : 'Are you sure you want to delete this delivery agency?'}
                  </p>

                  <DialogFooter>
                    <Button onClick={() => setShowDeleteDeliveryDialog(false)} className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.cancel}
                    </Button>
                    <Button onClick={handleDeleteDeliveryAgency} className="bg-destructive hover:bg-destructive/90 text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.delete}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Wilaya Pricing Management Dialog */}
              <Dialog open={showWilayaPricingDialog} onOpenChange={setShowWilayaPricingDialog}>
                <DialogContent className="max-w-full w-full sm:max-w-4xl mx-auto border-2 sm:border-3 border-border rounded-2xl sm:rounded-2xl shadow-sm sm:shadow-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto bg-card">
                  <DialogHeader className="mb-4 sm:mb-6">
                    <DialogTitle className="text-2xl sm:text-2xl flex items-center gap-2 sm:gap-3 text-electric font-bold line-clamp-2">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex-shrink-0">
                        
                      </motion.div>
                      <span className="text-lg sm:text-3xl">
                        {language === 'ar' ? `تعديل الأسعار - ${wilayaPricingAgencyName}` : language === 'fr' ? `Gérer les Prix - ${wilayaPricingAgencyName}` : `Manage Prices - ${wilayaPricingAgencyName}`}
                      </span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3 sm:space-y-6 py-2 sm:py-4">
                    {/* Section 1: Add/Edit Wilaya Price */}
                    <div className="bg-surface-2 p-3 sm:p-6 rounded-lg sm:rounded-2xl border border-border">
                      <h3 className="text-base sm:text-lg font-bold text-electric mb-3 sm:mb-4">
                        {editingWilayaPriceId ? '' : ''} {language === 'ar' ? 'إضافة أو تعديل سعر ولاية' : language === 'fr' ? 'Ajouter ou Modifier un Prix' : 'Add or Edit Wilaya Price'}
                      </h3>

                      <div className="space-y-2 sm:space-y-3">
                        {/* Wilaya Selection */}
                        <div>
                          <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 mb-2">
                            <MapIcon className="h-4 w-4" />
                            {language === 'ar' ? 'اختر الولاية' : language === 'fr' ? 'Sélectionner une Wilaya' : 'Select Wilaya'}
                          </Label>
                          <div className="relative">
                            <Input
                              type="text"
                              placeholder={language === 'ar' ? 'ابحث عن ولاية...' : language === 'fr' ? 'Rechercher une wilaya...' : 'Search wilaya...'}
                              value={selectedWilayaForEdit}
                              onChange={(e) => setSelectedWilayaForEdit(e.target.value)}
                              disabled={editingWilayaPriceId !== null}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:border-electric focus:outline-none"
                              list="wilaya-options"
                            />
                            <datalist id="wilaya-options">
                              {ALGERIAN_WILAYAS.filter(w => 
                                !wilayaPrices.find(p => p.wilaya_name === w) || w === selectedWilayaForEdit
                              ).map(wilaya => (
                                <option key={wilaya} value={wilaya} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        {/* Price Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 mb-2">
                              {language === 'ar' ? 'سعر المنزل (DZD)' : language === 'fr' ? 'Prix Domicile (DZD)' : 'Home Delivery (DZD)'}
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={wilayaPriceDomicile}
                              onChange={(e) => setWilayaPriceDomicile(e.target.value)}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:border-electric focus:outline-none"
                            />
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 mb-2">
                              {language === 'ar' ? 'سعر المكتب (DZD)' : language === 'fr' ? 'Prix Bureau (DZD)' : 'Office Delivery (DZD)'}
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={wilayaPriceBureau}
                              onChange={(e) => setWilayaPriceBureau(e.target.value)}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:border-electric focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-2 sm:pt-3">
                          <Button
                            onClick={handleSaveWilayaPrice}
                            disabled={!selectedWilayaForEdit || !wilayaPriceDomicile || !wilayaPriceBureau}
                            className="bg-primary hover:bg-primary/90 disabled:bg-muted-foreground text-primary-foreground font-bold py-2 rounded-lg transition-colors"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {editingWilayaPriceId ? (language === 'ar' ? 'تحديث' : language === 'fr' ? 'Mettre à jour' : 'Update') : (language === 'ar' ? 'إضافة' : language === 'fr' ? 'Ajouter' : 'Add')}
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedWilayaForEdit('');
                              setWilayaPriceDomicile('');
                              setWilayaPriceBureau('');
                              setEditingWilayaPriceId(null);
                            }}
                            className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold py-2 rounded-lg transition-colors"
                          >
                            {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Clear'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Configured Wilayas */}
                    <div className="bg-surface-2 p-3 sm:p-6 rounded-lg sm:rounded-2xl border border-border">
                      <h3 className="text-base sm:text-lg font-bold text-electric mb-3 sm:mb-4">
                        {language === 'ar' ? 'الولايات المُعدّة' : language === 'fr' ? 'Wilayas Configurées' : 'Configured Wilayas'} ({wilayaPrices.length})
                      </h3>

                      {wilayaPrices.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          {language === 'ar' ? 'لا توجد ولايات مُعدّة بعد' : language === 'fr' ? 'Aucune wilaya configurée' : 'No wilayas configured yet'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {wilayaPrices.map((price) => (
                            <div key={`${price.agency_id}-${price.wilaya_name}`} className="bg-card p-3 rounded-lg border border-border flex items-center justify-between gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground text-sm sm:text-base">{price.wilaya_name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {price.price_domicile.toFixed(2)} DZD | {price.price_bureau.toFixed(2)} DZD
                                </p>
                              </div>
                              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                <Button
                                  onClick={() => handleEditWilayaPrice(price)}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-bold"
                                  title="Edit"
                                >
                                  
                                </Button>
                                <Button
                                  onClick={() => handleDeleteWilayaPrice(price.wilaya_name)}
                                  className="bg-destructive hover:bg-destructive/90 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-bold"
                                  title="Delete"
                                >
                                  
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Info Section */}
                    <div className="bg-surface-2 p-3 sm:p-4 rounded-lg border border-border">
                      <p className="text-xs sm:text-sm text-warning">
                        <strong>ℹ️ {language === 'ar' ? 'ملاحظة' : language === 'fr' ? 'Note' : 'Info'}:</strong> {language === 'ar' ? 'إذا لم تحدد سعراً لولاية معينة، سيتم استخدام السعر الافتراضي للوكالة' : language === 'fr' ? 'Si vous ne définissez pas de prix pour une wilaya, le prix par défaut de l\'agence sera utilisé' : 'If no price is set for a wilaya, the agency default price will be used'}
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button
                      onClick={() => setShowWilayaPricingDialog(false)}
                      className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold text-lg h-11 px-6 rounded-xl"
                    >
                      {language === 'ar' ? 'إغلاق' : language === 'fr' ? 'Fermer' : 'Close'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-0"
            >
              {/* Main Settings Container */}
              <div className="rounded-2xl overflow-hidden shadow-sm border border-border bg-primary text-primary-foreground">
                
                {/* Header Section with Preview */}
                <div className="relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 pointer-events-none bg-primary text-primary-foreground" />
                  <div className="absolute -right-40 -top-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
                  <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
                  
                  {/* Header Content */}
                  <div className="relative z-10 p-8 lg:p-12">
                    <div className="flex items-start justify-between gap-8 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 rounded-2xl shadow-sm bg-primary text-primary-foreground">
                            <Settings className="h-8 w-8 text-white" />
                          </div>
                          <h2 className="text-4xl font-bold text-foreground">
                            {language === 'ar' ? 'إعدادات الموقع' : language === 'fr' ? 'Paramètres du Site' : 'Website Settings'}
                          </h2>
                        </div>
                        <p className="text-muted-foreground text-lg">
                          {language === 'ar' ? 'إدارة معلومات متجرك والصور' : language === 'fr' ? 'Gérez les informations de votre magasin' : 'Manage your store information'}
                        </p>
                      </div>
                      
                      {/* Logo Preview in Header */}
                      {(websiteSettings?.logo_url) && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-32 h-32 rounded-2xl overflow-hidden border border-border shadow-sm backdrop-blur-sm"
                        >
                          <img
                            src={websiteSettings.logo_url}
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
                    className="p-8 rounded-2xl border border-electric shadow-sm bg-primary text-primary-foreground"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl"></span>
                      {language === 'ar' ? 'هوية المتجر' : language === 'fr' ? 'Identité du Magasin' : 'Store Identity'}
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Store Name */}
                      <div className="space-y-3">
                        <Label className="text-white font-bold text-base flex items-center gap-2">
                          <span></span>
                          {language === 'ar' ? 'اسم المتجر' : language === 'fr' ? 'Nom du Magasin' : 'Store Name'}
                        </Label>
                        <Input
                          type="text"
                          placeholder={language === 'ar' ? 'أدخل اسم متجرك' : language === 'fr' ? 'Entrez le nom du magasin' : 'Enter store name'}
                          value={websiteSettings?.store_name || ''}
                          onChange={(e) => setWebsiteSettings({ ...websiteSettings, store_name: e.target.value })}
                          className="h-12 bg-primary/50 border-2 border-electric text-white placeholder-muted-foreground rounded-xl text-lg font-semibold hover:border-border focus:border-border transition-all"
                        />
                        {websiteSettings?.store_name && (
                          <p className="text-sm text-electric">{language === 'ar' ? 'تم الإدخال' : language === 'fr' ? 'Rempli' : 'Filled'}</p>
                        )}
                      </div>

                      {/* Slogan */}
                      <div className="space-y-3">
                        <Label className="text-white font-bold text-base flex items-center gap-2">
                          <span></span>
                          {language === 'ar' ? 'الشعار' : language === 'fr' ? 'Slogan' : 'Slogan'}
                        </Label>
                        <Input
                          type="text"
                          placeholder={language === 'ar' ? 'شعارك المميز' : language === 'fr' ? 'Votre slogan unique' : 'Your unique slogan'}
                          value={websiteSettings?.slogan || ''}
                          onChange={(e) => setWebsiteSettings({ ...websiteSettings, slogan: e.target.value })}
                          className="h-12 bg-primary/50 border-2 border-electric text-white placeholder-muted-foreground rounded-xl text-lg font-semibold hover:border-border focus:border-border transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Section 2: Logo */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 rounded-2xl border border-warning shadow-sm bg-primary text-primary-foreground"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl"></span>
                      {language === 'ar' ? 'شعار المتجر' : language === 'fr' ? 'Logo du Magasin' : 'Store Logo'}
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      {/* Upload Area */}
                      <label className="lg:col-span-2 flex items-center justify-center h-64 border-3 border-dashed border-border bg-warning/5 rounded-2xl cursor-pointer hover:border-border hover:bg-warning/90 transition-all group">
                        <div className="flex flex-col items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="mb-4"
                          >
                            <Upload className="h-16 w-16 text-warning group-hover:text-warning transition-colors" />
                          </motion.div>
                          <p className="text-white font-bold text-lg text-center">
                            {language === 'ar' ? 'اختر أو اسحب شعار المتجر' : language === 'fr' ? 'Choisir ou glisser le logo' : 'Choose or drag logo'}
                          </p>
                          <p className="text-muted-foreground text-sm mt-2">PNG, JPG, GIF</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                        />
                      </label>

                      {/* Preview */}
                      {websiteSettings?.logo_url ? (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="h-64 rounded-2xl overflow-hidden border border-border shadow-sm flex items-center justify-center bg-primary text-primary-foreground"
                        >
                          <img
                            src={websiteSettings.logo_url}
                            alt="Logo Preview"
                            className="w-full h-full object-contain p-4"
                          />
                        </motion.div>
                      ) : (
                        <div className="h-64 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-primary/50">
                          <p className="text-muted-foreground text-center">
                            {language === 'ar' ? 'لا يوجد شعار محمل' : language === 'fr' ? 'Pas de logo' : 'No logo'}
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
                    className="p-8 rounded-2xl border border-electric shadow-sm bg-primary text-primary-foreground"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl"></span>
                      {language === 'ar' ? 'وصف الموقع' : language === 'fr' ? 'Description du Site' : 'Website Description'}
                    </h3>
                    
                    <textarea
                      placeholder={language === 'ar' ? 'اكتب وصف شامل لموقعك ومتجرك...' : language === 'fr' ? 'Décrivez votre magasin en détail...' : 'Describe your store...'}
                      value={websiteSettings?.description || ''}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, description: e.target.value })}
                      className="w-full h-40 bg-primary/50 border-2 border-electric text-white placeholder-muted-foreground rounded-xl p-4 text-lg font-semibold hover:border-border focus:border-border transition-all resize-none"
                    />
                    {websiteSettings?.description && (
                      <p className="text-sm text-electric mt-2">{language === 'ar' ? 'تم إدخال الوصف' : language === 'fr' ? 'Description saisie' : 'Description added'} ({websiteSettings.description.length} {language === 'ar' ? 'حرف' : language === 'fr' ? 'caractères' : 'chars'})</p>
                    )}
                  </motion.div>

                  {/* Section 4: Landing Page Background */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-8 rounded-2xl border border-electric shadow-sm bg-primary text-primary-foreground"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl"></span>
                      {language === 'ar' ? 'خلفية صفحة الهبوط' : language === 'fr' ? 'Fond Page Accueil' : 'Landing Page Background'}
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      {/* Upload Area */}
                      <label className="lg:col-span-2 flex items-center justify-center h-64 border-3 border-dashed border-border bg-primary/5 rounded-2xl cursor-pointer hover:border-border hover:bg-primary/90 transition-all group">
                        <div className="flex flex-col items-center justify-center">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="mb-4"
                          >
                            <Upload className="h-16 w-16 text-electric group-hover:text-electric transition-colors" />
                          </motion.div>
                          <p className="text-white font-bold text-lg text-center">
                            {language === 'ar' ? 'اختر أو اسحب صورة الخلفية' : language === 'fr' ? 'Choisir ou glisser le fond' : 'Choose or drag background'}
                          </p>
                          <p className="text-muted-foreground text-sm mt-2">PNG, JPG, GIF (Recommended: 1920x1080)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleLandingPageImageUpload(e.target.files[0])}
                        />
                      </label>

                      {/* Preview */}
                      {websiteSettings?.landing_page_image_url ? (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="h-64 rounded-2xl overflow-hidden border border-border shadow-sm flex items-center justify-center bg-primary text-primary-foreground"
                        >
                          <img
                            src={websiteSettings.landing_page_image_url}
                            alt="Landing Background Preview"
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ) : (
                        <div className="h-64 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-primary/50">
                          <p className="text-muted-foreground text-center">
                            {language === 'ar' ? 'لا يوجد خلفية محملة' : language === 'fr' ? 'Pas de fond' : 'No background'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Save Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveWebsiteSettings}
                    className="w-full text-primary-foreground px-8 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-sm border border-border transition-all bg-primary"
                  >
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                      <Check className="h-7 w-7" />
                    </motion.div>
                    {language === 'ar' ? 'حفظ جميع الإعدادات' : language === 'fr' ? 'Enregistrer les Paramètres' : 'Save All Settings'}
                  </motion.button>

                  {/* Info Box */}
                  <div className="bg-primary/10 border border-border rounded-xl p-4">
                    <p className="text-electric text-sm">
                      <span className="font-bold">ℹ️ {language === 'ar' ? 'ملاحظة:' : language === 'fr' ? 'Info:' : 'Note:'}</span> {language === 'ar' ? ' سيتم حفظ جميع الصور تلقائياً في السحابة' : language === 'fr' ? ' Toutes les images seront enregistrées dans le cloud' : ' All images will be saved to the cloud'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
