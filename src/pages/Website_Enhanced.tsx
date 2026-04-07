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

interface WebsiteSettings {
  store_name: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
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
    tabs: { offers: 'Offers', special: 'Special Offers', packages: 'Packages', contacts: 'Contacts', settings: 'Settings' },
    offers: { create: 'Create New Offer', search: 'Search products...', price: 'Offer Price', description: 'Description', create_btn: 'Create Offer' },
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
    tabs: { offers: 'Offres', special: 'Offres Spéciales', packages: 'Paquets', contacts: 'Contacts', settings: 'Paramètres' },
    offers: { create: 'Créer une nouvelle offre', search: 'Recherchez des produits...', price: 'Prix de l\'offre', description: 'Description', create_btn: 'Créer l\'offre' },
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
    tabs: { offers: 'العروض', special: 'عروض خاصة', packages: 'الحزم', contacts: 'جهات الاتصال', settings: 'الإعدادات' },
    offers: { create: 'إنشاء عرض جديد', search: 'ابحث عن المنتجات...', price: 'سعر العرض', description: 'الوصف', create_btn: 'إنشاء عرض' },
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
  const [selectedProductsPackage, setSelectedProductsPackage] = useState<Product[]>([]);
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

  // Website Settings
  const [settings, setSettings] = useState<WebsiteSettings>({
    store_name: '',
    slogan: '',
    description: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

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

  // ========== PACKAGE FUNCTIONS ==========
  const handleSelectProductForPackage = (product: Product) => {
    if (!selectedProductsPackage.find((p) => p.id === product.id)) {
      setSelectedProductsPackage([...selectedProductsPackage, product]);
    }
  };

  const handleRemoveProductFromPackage = (productId: string) => {
    setSelectedProductsPackage(selectedProductsPackage.filter((p) => p.id !== productId));
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
        is_visible: true,
        is_active: true,
      };

      const createdPackage = await createPackage(newPackageData);

      // Add products to package
      for (const product of selectedProductsPackage) {
        await addProductToPackage(createdPackage.id, product);
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
      id: item.product_id,
      name: item.product_name,
      selling_price: 0,
      mark: { name: item.product_mark },
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
      for (const product of selectedProductsPackage) {
        await addProductToPackage(editingPackage.id, product);
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
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {language === 'ar' ? '🌐 إدارة الموقع' : language === 'fr' ? '🌐 Gestion Web' : '🌐 Website Manager'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {language === 'ar' ? 'تحكم كامل في عروضك والتواصل' : language === 'fr' ? 'Contrôle complet de vos offres' : 'Complete control over your offers'}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 mb-8 overflow-x-auto pb-2"
        >
          <motion.button
            onClick={() => setActiveTab('offers')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'offers'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-400'
            }`}
          >
            🎁 {language === 'ar' ? 'عروض' : language === 'fr' ? 'Offres' : 'Offers'}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('special')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'special'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 hover:border-purple-400'
            }`}
          >
            ⭐ {language === 'ar' ? 'عروض خاصة' : language === 'fr' ? 'Spéciales' : 'Special'}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('packages')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'packages'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 hover:border-cyan-400'
            }`}
          >
            📦 {language === 'ar' ? 'باقات' : language === 'fr' ? 'Packs' : 'Packages'}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('contacts')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'contacts'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400'
            }`}
          >
            📱 {language === 'ar' ? 'جهات الاتصال' : language === 'fr' ? 'Contacts' : 'Contacts'}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('delivery')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'delivery'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 hover:border-orange-400'
            }`}
          >
            🚚 {language === 'ar' ? 'التوصيل' : language === 'fr' ? 'Livraison' : 'Delivery'}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('settings')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-lg'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-400'
            }`}
          >
            ⚙️ {language === 'ar' ? 'الإعدادات' : language === 'fr' ? 'Paramètres' : 'Settings'}
          </motion.button>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* OFFERS TAB */}
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
                onClick={() => {
                  setShowCreateOfferDialog(true);
                  setEditingOffer(null);
                  setSelectedProductOffer(null);
                  setOfferPrice('');
                  setOfferDescription('');
                  setSearchQuery('');
                }}
                className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-xl"
              >
                <Plus className="h-6 w-6" />
                <Sparkles className="h-6 w-6" />
                ✨ {language === 'ar' ? 'عرض جديد' : language === 'fr' ? 'Nouvelle Offre' : 'New Offer'}
              </motion.button>

              {offers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-emerald-300 dark:border-emerald-700"
                >
                  <ShoppingBag className="h-20 w-20 mx-auto mb-4 text-emerald-400" />
                  <p className="text-2xl text-slate-600 dark:text-slate-400 font-bold">
                    {language === 'ar' ? '🛍️ لا توجد عروض' : language === 'fr' ? '🛍️ Aucune offre' : '🛍️ No offers yet'}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offers.map((offer) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -10 }}
                      className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 overflow-hidden shadow-xl hover:shadow-2xl transition-all"
                    >
                      {/* Image */}
                      <div className="relative h-40 bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 overflow-hidden flex items-center justify-center">
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
                          <Badge className="absolute top-3 right-3 bg-red-500 text-white text-lg px-3 py-1">
                            🔥 -{offer.discount_percentage}%
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{offer.product_name}</h3>
                          {offer.product_mark && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">🏷️ {offer.product_mark}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                          <span className="text-2xl font-bold text-green-600">💰 {offer.offer_price?.toFixed(2) || 0} DZD</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingOffer(offer);
                              setOfferPrice(offer.offer_price?.toString() || '');
                              setShowCreateOfferDialog(true);
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOfferDelete(offer.id);
                              setShowDeleteOfferDialog(true);
                            }}
                            className="flex-1 bg-red-500 hover:bg-red-600"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Create/Edit Offer Dialog */}
              <Dialog open={showCreateOfferDialog} onOpenChange={setShowCreateOfferDialog}>
                <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800 dark:to-slate-900 border-2 border-emerald-300 dark:border-emerald-600 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-3xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        ✨
                      </motion.div>
                      {editingOffer ? `✏️ ${language === 'ar' ? 'تعديل العرض' : language === 'fr' ? 'Modifier l\'Offre' : 'Edit Offer'}` : `🎉 ${language === 'ar' ? 'عرض جديد' : language === 'fr' ? 'Créer une nouvelle offre' : 'Create New Offer'}`}
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'إنشاء أو تعديل عرض على منتج' : language === 'fr' ? 'Créer ou modifier une offre' : 'Create or edit an offer'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 max-h-[70vh] overflow-y-auto">
                    {/* Step 1: Product Selection */}
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-emerald-300 dark:border-emerald-700">
                      <h3 className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 mb-3 sm:mb-4">🔍 {language === 'ar' ? 'اختر المنتج' : language === 'fr' ? 'Sélectionner le Produit' : 'Select Product'}</h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            📝 {language === 'ar' ? 'ابحث عن المنتج' : language === 'fr' ? 'Rechercher' : 'Search Product'}
                          </Label>
                          <Input
                            type="text"
                            placeholder={language === 'ar' ? 'ابحث عن المنتج...' : language === 'fr' ? 'Recherchez des produits...' : 'Search products...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-emerald-300 dark:border-emerald-600 rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Product Search Results */}
                        {searchQuery && (
                          <div className="max-h-48 overflow-y-auto border-2 border-emerald-300 dark:border-emerald-600 rounded-xl p-2 sm:p-3 space-y-2 bg-white dark:bg-slate-700">
                            {products
                              .filter((p) => !editingOffer || p.id !== editingOffer.product_id)
                              .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.mark?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((product) => (
                                <motion.button
                                  key={product.id}
                                  onClick={() => {
                                    setSelectedProductOffer(product);
                                    setOfferPrice(product.selling_price.toString());
                                    setSearchQuery('');
                                  }}
                                  whileHover={{ x: 5 }}
                                  className="w-full text-left p-2 sm:p-3 rounded-lg bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900 dark:to-cyan-900 hover:from-emerald-200 hover:to-cyan-200 dark:hover:from-emerald-800 dark:hover:to-cyan-800 transition-colors border-l-4 border-emerald-500"
                                >
                                  <div className="font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">📦 {product.name}</div>
                                  <div className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">{product.mark?.name} • 💰 {product.selling_price} DZD</div>
                                </motion.button>
                              ))}
                            {products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                              <div className="p-3 text-center text-slate-500 dark:text-slate-400 text-sm">
                                {language === 'ar' ? '❌ لم يتم العثور على منتجات' : language === 'fr' ? '❌ Aucun produit trouvé' : '❌ No products found'}
                              </div>
                            )}
                          </div>
                        )}

                        {selectedProductOffer && (
                          <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-xl border-2 border-emerald-300 dark:border-emerald-600 animate-pulse">
                            <p className="font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
                              ✅ {selectedProductOffer.name} <span className="block text-emerald-700 dark:text-emerald-300">{selectedProductOffer.mark?.name}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Price & Description */}
                    {selectedProductOffer && (
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-blue-300 dark:border-blue-700">
                        <h3 className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300 mb-3 sm:mb-4">💰 {language === 'ar' ? 'السعر والوصف' : language === 'fr' ? 'Prix et Description' : 'Price & Description'}</h3>
                        
                        <div className="space-y-3 sm:space-y-4">
                          {/* Original Price */}
                          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-slate-300 dark:border-slate-600">
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold mb-1">📊 {language === 'ar' ? 'السعر الأصلي' : language === 'fr' ? 'Prix Original' : 'Original Price'}</div>
                            <div className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white line-through opacity-75">{selectedProductOffer.selling_price.toFixed(2)} DZD</div>
                          </div>

                          {/* Offer Price */}
                          <div className="space-y-2">
                            <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                              🔥 {language === 'ar' ? 'سعر العرض' : language === 'fr' ? 'Prix de l\'Offre' : 'Offer Price'}
                            </Label>
                            <Input
                              type="number"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              placeholder="0.00"
                              className="h-10 sm:h-12 text-sm sm:text-base border-2 border-blue-300 dark:border-blue-600 rounded-lg sm:rounded-xl"
                            />
                            {offerPrice && (
                              <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-bold">
                                💵 {language === 'ar' ? 'توفير:' : language === 'fr' ? 'Économie:' : 'Save:'} {(selectedProductOffer.selling_price - parseFloat(offerPrice)).toFixed(2)} DZD ({Math.round(((selectedProductOffer.selling_price - parseFloat(offerPrice)) / selectedProductOffer.selling_price) * 100)}%)
                              </div>
                            )}
                          </div>

                          {/* Offer Description */}
                          <div className="space-y-2">
                            <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                              📝 {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                            </Label>
                            <Input
                              value={offerDescription}
                              onChange={(e) => setOfferDescription(e.target.value)}
                              placeholder={language === 'ar' ? 'وصف العرض' : language === 'fr' ? 'Description de l\'offre' : 'Offer description'}
                              className="h-10 sm:h-12 text-sm sm:text-base border-2 border-blue-300 dark:border-blue-600 rounded-lg sm:rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                    <Button
                      onClick={() => {
                        setShowCreateOfferDialog(false);
                        setSelectedProductOffer(null);
                        setOfferPrice('');
                        setOfferDescription('');
                        setSearchQuery('');
                        setEditingOffer(null);
                      }}
                      className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all"
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedProductOffer && offerPrice) {
                          if (editingOffer) {
                            handleUpdateOffer(editingOffer.id);
                          } else {
                            handleCreateOffer();
                          }
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-5 w-5" />
                      <span className="hidden sm:inline">{editingOffer ? '✨ Update Offer' : '✨ Create Offer'}</span>
                      <span className="sm:hidden">{editingOffer ? '✏️' : '✨'}</span>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
              <div className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-lg sm:shadow-xl">
                <h2 className="text-2xl sm:text-4xl font-black mb-2">📦 {language === 'ar' ? 'الباقات والحزم' : language === 'fr' ? 'Gestion des Packs' : 'Package Management'}</h2>
                <p className="text-base sm:text-lg opacity-90">{language === 'ar' ? '✨ إنشء حزم منتجات مخصصة بأسعار جذابة' : language === 'fr' ? '✨ Créez des bundles de produits personnalisés' : '✨ Create custom product bundles'}</p>
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
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black text-sm sm:text-lg h-12 sm:h-16 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center gap-2 sm:gap-3 border-2 border-white/20 transition-all"
              >
                <Plus className="h-5 sm:h-7 w-5 sm:w-7" />
                <span className="hidden sm:inline">📦 + {language === 'ar' ? 'حزمة جديدة' : language === 'fr' ? 'Nouveau Pack' : 'New Package'}</span>
                <span className="sm:hidden">📦 {language === 'ar' ? 'جديدة' : language === 'fr' ? 'Nouveau' : 'New'}</span>
                <Sparkles className="hidden sm:block h-7 w-7" />
              </motion.button>

              {/* Packages Grid */}
              {packages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-24 bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl sm:rounded-3xl border-4 border-dashed border-emerald-300 dark:border-emerald-700"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <PackageIcon className="h-16 sm:h-28 w-16 sm:w-28 mx-auto text-emerald-400" />
                  </motion.div>
                  <p className="text-xl sm:text-3xl font-black text-slate-700 dark:text-slate-200 mb-2">
                    {language === 'ar' ? '📦 لا توجد حزم حالياً' : language === 'fr' ? '📦 Aucun pack créé' : '📦 No packages yet'}
                  </p>
                  <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400">
                    {language === 'ar' ? '👆 اضغط الزر أعلاه لإنشاء حزمة جديدة' : language === 'fr' ? '👆 Cliquez sur le bouton ci-dessus' : '👆 Click the button above'}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2 mb-4">
                  <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
                    📊 {language === 'ar' ? `إجمالي: ${packages.length} حزمة` : language === 'fr' ? `Total: ${packages.length} pack` : `Total: ${packages.length} packages`}
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
                      className={`relative rounded-2xl sm:rounded-3xl border-2 sm:border-3 overflow-hidden shadow-md sm:shadow-lg hover:shadow-xl transition-all ${
                        !pkg.is_visible
                          ? 'opacity-50 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'
                          : 'border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {/* Top Badge */}
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-3 sm:px-4 py-1 sm:py-2 flex justify-between items-center z-20 text-sm sm:text-base">
                        <span className="font-bold">📦 {language === 'ar' ? 'حزمة' : language === 'fr' ? 'Pack' : 'Package'}</span>
                        {!pkg.is_visible && <span className="text-xs sm:text-sm bg-red-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">🚫 Hidden</span>}
                      </div>

                      {/* Discount Badge */}
                      {pkg.discount_percentage && (
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute top-10 sm:top-12 right-2 sm:right-3 bg-gradient-to-br from-red-500 to-orange-500 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-black z-10 shadow-lg border-2 border-white"
                        >
                          🔥 -{pkg.discount_percentage}%
                        </motion.div>
                      )}

                      {/* Image */}
                      <div className="mt-8 sm:mt-10">
                        {pkg.image_url ? (
                          <div className="h-32 sm:h-40 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
                            <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="h-32 sm:h-40 bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900 dark:to-cyan-900 flex items-center justify-center">
                            <PackageIcon className="h-12 sm:h-16 w-12 sm:w-16 text-emerald-500 dark:text-emerald-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-6">
                        {/* Name */}
                        <h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white mb-1 line-clamp-2">{pkg.name}</h3>

                        {/* Product Count Badge */}
                        <div className="inline-block bg-emerald-100 dark:bg-emerald-900 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-3">
                          📦 {language === 'ar' ? `${packages.filter(p => p.id === pkg.id).length} منتج` : language === 'fr' ? `${packages.filter(p => p.id === pkg.id).length} produit` : `1 package`}
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 sm:mb-4 line-clamp-2">{pkg.description || '—'}</p>

                        {/* Price Section */}
                        <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border-2 border-emerald-200 dark:border-emerald-700">
                          <div className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold mb-1">💰 {language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'}</div>
                          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-300">
                            {pkg.package_price?.toFixed(2) || '0.00'} DZD
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedPackageDetails(pkg);
                              setShowPackageDetails(true);
                            }}
                            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
                            title="View details"
                          >
                            <Eye className="h-4 sm:h-5 w-4 sm:w-5" />
                            <span className="hidden sm:inline">{language === 'ar' ? 'عرض' : language === 'fr' ? 'Voir' : 'View'}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditPackage(pkg)}
                            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
                            title="Edit package"
                          >
                            <Edit2 className="h-4 sm:h-5 w-4 sm:w-5" />
                            <span className="hidden sm:inline">{language === 'ar' ? 'تعديل' : language === 'fr' ? 'Éditer' : 'Edit'}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleTogglePackageVisibility(pkg)}
                            className={`font-bold py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm ${
                              pkg.is_visible
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                                : 'bg-gradient-to-br from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white'
                            }`}
                            title={pkg.is_visible ? 'Hide package' : 'Show package'}
                          >
                            {pkg.is_visible ? <Eye className="h-4 sm:h-5 w-4 sm:w-5" /> : <EyeOff className="h-4 sm:h-5 w-4 sm:w-5" />}
                            <span className="hidden sm:inline">{pkg.is_visible ? '👁️' : '🚫'}</span>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedPackageDelete(pkg.id);
                              setShowDeletePackageDialog(true);
                            }}
                            className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all shadow-md hover:shadow-lg flex flex-col sm:flex-row items-center justify-center gap-1 text-xs sm:text-sm"
                            title="Delete package"
                          >
                            <Trash2 className="h-4 sm:h-5 w-4 sm:w-5" />
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
                <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800 dark:to-slate-900 border-2 sm:border-3 border-emerald-300 dark:border-emerald-600 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-2xl sm:text-4xl flex items-center gap-2 sm:gap-3 text-emerald-600 dark:text-emerald-400 font-black">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        📦
                      </motion.div>
                      <span className="line-clamp-1">{language === 'ar' ? 'إنشاء حزمة جديدة' : language === 'fr' ? 'Créer un nouveau Pack' : 'Create New Package'}</span>
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'قم بإنشاء حزمة منتجات جديدة مع اختيار المنتجات والسعر' : language === 'fr' ? 'Créez une nouvelle offre groupée de produits' : 'Create a new product package bundle'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 max-h-[70vh] overflow-y-auto">
                    {/* Step 1: Package Details */}
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-emerald-300 dark:border-emerald-700">
                      <h3 className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 mb-3 sm:mb-4">📋 {language === 'ar' ? 'بيانات الحزمة' : language === 'fr' ? 'Informations du Pack' : 'Package Details'}</h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {/* Package Name */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            📝 {language === 'ar' ? 'اسم الحزمة' : language === 'fr' ? 'Nom du Pack' : 'Package Name'}
                          </Label>
                          <Input
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل اسم الحزمة' : language === 'fr' ? 'Nom du pack' : 'Package name'}
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-emerald-300 dark:border-emerald-600 rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Package Price */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            💰 {language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'}
                          </Label>
                          <Input
                            type="number"
                            value={packagePrice}
                            onChange={(e) => setPackagePrice(e.target.value)}
                            placeholder="0.00"
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-emerald-300 dark:border-emerald-600 rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            📖 {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                          </Label>
                          <textarea
                            value={packageDescription}
                            onChange={(e) => setPackageDescription(e.target.value)}
                            placeholder={language === 'ar' ? 'وصف الحزمة' : language === 'fr' ? 'Description du pack' : 'Package description'}
                            className="w-full p-3 sm:p-4 border-2 border-emerald-300 dark:border-emerald-600 rounded-lg sm:rounded-xl dark:bg-slate-700 dark:text-white text-sm sm:text-base h-20 sm:h-24 resize-none font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Search and Add Products */}
                    <div className="bg-cyan-100 dark:bg-cyan-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-cyan-300 dark:border-cyan-700">
                      <h3 className="text-lg sm:text-xl font-black text-cyan-700 dark:text-cyan-300 mb-3 sm:mb-4">🔍 {language === 'ar' ? 'اختر المنتجات' : language === 'fr' ? 'Sélectionner les Produits' : 'Select Products'}</h3>
                      
                      <div className="space-y-3">
                        <Input
                          type="text"
                          placeholder={language === 'ar' ? '🔍 ابحث عن منتج...' : language === 'fr' ? '🔍 Rechercher un produit' : '🔍 Search product...'}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-10 sm:h-12 text-sm sm:text-base border-2 border-cyan-300 dark:border-cyan-600 rounded-lg sm:rounded-xl"
                        />

                        {/* Product Selection */}
                        {searchQuery && (
                          <div className="max-h-56 overflow-y-auto border-3 border-dashed border-cyan-300 dark:border-cyan-700 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 bg-white dark:bg-slate-800">
                            {products
                              .filter(
                                (p) =>
                                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  p.mark?.name.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .length === 0 ? (
                              <p className="text-center text-slate-500 py-4 text-sm">❌ No products found</p>
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
                                    className="w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-100 to-emerald-100 dark:from-cyan-900 dark:to-emerald-900 hover:from-cyan-200 hover:to-emerald-200 dark:hover:from-cyan-800 dark:hover:to-emerald-800 transition-all border-2 border-cyan-300 dark:border-cyan-700"
                                  >
                                    <div className="font-bold text-sm sm:text-base text-cyan-900 dark:text-cyan-100">
                                      ✅ {product.name}
                                    </div>
                                    <div className="text-xs sm:text-sm text-cyan-700 dark:text-cyan-300">
                                      {product.mark?.name} • 💰 {product.selling_price} DZD
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
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-purple-300 dark:border-purple-700">
                        <h3 className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-300 mb-3 sm:mb-4">
                          ✅ {language === 'ar' ? 'المنتجات المختارة' : language === 'fr' ? 'Produits Sélectionnés' : 'Selected Products'} ({selectedProductsPackage.length})
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedProductsPackage.map((product, idx) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 rounded-lg sm:rounded-xl border-2 border-purple-300 dark:border-purple-600 shadow-md"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm sm:text-base text-purple-900 dark:text-purple-100 truncate">
                                  📦 {product.name}
                                </div>
                                <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 truncate">
                                  {product.mark?.name} • 💰 {product.selling_price} DZD
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.15, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRemoveProductFromPackage(product.id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 sm:p-3 rounded-lg shadow-md transition-all flex-shrink-0 ml-2"
                              >
                                ❌
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                    <Button
                      onClick={() => setShowCreatePackageDialog(false)}
                      className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all"
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={handleCreatePackage}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Plus className="h-5 sm:h-6 w-5 sm:w-6" />
                      <span className="hidden sm:inline">{language === 'ar' ? '✨ إنشاء الحزمة' : language === 'fr' ? '✨ Créer le Pack' : '✨ Create Package'}</span>
                      <span className="sm:hidden">✨ {language === 'ar' ? 'إنشاء' : language === 'fr' ? 'Créer' : 'Create'}</span>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Package Dialog */}
              <Dialog open={showEditPackageDialog} onOpenChange={setShowEditPackageDialog}>
                <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl bg-gradient-to-br from-white to-amber-50 dark:from-slate-800 dark:to-slate-900 border-2 sm:border-3 border-amber-300 dark:border-amber-600 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-2xl sm:text-4xl flex items-center gap-2 sm:gap-3 text-amber-600 dark:text-amber-400 font-black">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        ✏️
                      </motion.div>
                      <span className="line-clamp-1">{language === 'ar' ? 'تعديل الحزمة' : language === 'fr' ? 'Modifier le Pack' : 'Edit Package'}</span>
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'قم بتعديل بيانات الحزمة والمنتجات' : language === 'fr' ? 'Modifiez les données du pack et les produits' : 'Edit package information and products'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 max-h-[70vh] overflow-y-auto">
                    {/* Step 1: Package Details */}
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-amber-300 dark:border-amber-700">
                      <h3 className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300 mb-3 sm:mb-4">📋 {language === 'ar' ? 'بيانات الحزمة' : language === 'fr' ? 'Informations du Pack' : 'Package Details'}</h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {/* Package Name */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            📝 {language === 'ar' ? 'اسم الحزمة' : language === 'fr' ? 'Nom du Pack' : 'Package Name'}
                          </Label>
                          <Input
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل اسم الحزمة' : language === 'fr' ? 'Nom du pack' : 'Package name'}
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-amber-300 dark:border-amber-600 rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Package Price */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            💰 {language === 'ar' ? 'السعر' : language === 'fr' ? 'Prix' : 'Price'}
                          </Label>
                          <Input
                            type="number"
                            value={packagePrice}
                            onChange={(e) => setPackagePrice(e.target.value)}
                            placeholder="0.00"
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-amber-300 dark:border-amber-600 rounded-lg sm:rounded-xl"
                          />
                        </div>

                        {/* Package Description */}
                        <div className="space-y-2">
                          <Label className="text-sm sm:text-base font-bold flex items-center gap-2">
                            📝 {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                          </Label>
                          <Input
                            value={packageDescription}
                            onChange={(e) => setPackageDescription(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل وصف الحزمة' : language === 'fr' ? 'Description du pack' : 'Package description'}
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-amber-300 dark:border-amber-600 rounded-lg sm:rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Product Selection */}
                    <div className="bg-cyan-100 dark:bg-cyan-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-cyan-300 dark:border-cyan-700">
                      <h3 className="text-lg sm:text-xl font-black text-cyan-700 dark:text-cyan-300 mb-3 sm:mb-4">🔍 {language === 'ar' ? 'اختيار المنتجات' : language === 'fr' ? 'Sélectionner les Produits' : 'Select Products'}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {products.map((product, idx) => (
                          <motion.button
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => {
                              const isSelected = selectedProductsPackage.some((p) => p.id === product.id);
                              if (isSelected) {
                                setSelectedProductsPackage(selectedProductsPackage.filter((p) => p.id !== product.id));
                              } else {
                                setSelectedProductsPackage([...selectedProductsPackage, product]);
                              }
                            }}
                            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 text-left transition-all ${
                              selectedProductsPackage.some((p) => p.id === product.id)
                                ? 'bg-cyan-500 dark:bg-cyan-600 border-cyan-600 dark:border-cyan-500 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-700 border-cyan-300 dark:border-cyan-600 text-slate-800 dark:text-white hover:border-cyan-500'
                            }`}
                          >
                            <div className="font-bold text-xs sm:text-sm truncate">{product.name}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">{product.mark?.name}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Selected Products */}
                    {selectedProductsPackage.length > 0 && (
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-purple-300 dark:border-purple-700">
                        <h3 className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-300 mb-3 sm:mb-4">
                          ✅ {language === 'ar' ? 'المنتجات المختارة' : language === 'fr' ? 'Produits Sélectionnés' : 'Selected Products'} ({selectedProductsPackage.length})
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedProductsPackage.map((product, idx) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 rounded-lg sm:rounded-xl border-2 border-purple-300 dark:border-purple-600 shadow-md"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm sm:text-base text-purple-900 dark:text-purple-100 truncate">
                                  📦 {product.name}
                                </div>
                                <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 truncate">
                                  {product.mark?.name} • 💰 {product.selling_price} DZD
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.15, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRemoveProductFromPackage(product.id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-2 sm:p-3 rounded-lg shadow-md transition-all flex-shrink-0 ml-2"
                              >
                                ❌
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                    <Button
                      onClick={() => setShowEditPackageDialog(false)}
                      className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all"
                    >
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={handleUpdatePackage}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Check className="h-5 sm:h-6 w-5 sm:w-6" />
                      <span className="hidden sm:inline">{language === 'ar' ? '✨ حفظ التغييرات' : language === 'fr' ? '✨ Sauvegarder' : '✨ Save Changes'}</span>
                      <span className="sm:hidden">✨ {language === 'ar' ? 'حفظ' : language === 'fr' ? 'Sauvegarder' : 'Save'}</span>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Package Details Dialog */}
              {selectedPackageDetails && (
                <Dialog open={showPackageDetails} onOpenChange={setShowPackageDetails}>
                  <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-600 rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-3xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
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
                        <p className="text-slate-600 dark:text-slate-300">{selectedPackageDetails.description}</p>
                      </div>

                      <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900 dark:to-cyan-900 p-4 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                          💰 {selectedPackageDetails.package_price} DZD
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-lg mb-3">{t.packages.products_added}</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {packageItems
                            .filter((item) => item.package_id === selectedPackageDetails.id)
                            .map((item) => (
                              <div key={item.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-slate-300 dark:border-slate-600 flex gap-3">
                                {item.product_image && (
                                  <img src={item.product_image} alt={item.product_name} className="h-16 w-16 object-cover rounded-lg" />
                                )}
                                <div className="flex-1">
                                  <div className="font-bold text-slate-800 dark:text-white">{item.product_name}</div>
                                  <div className="text-sm text-slate-600 dark:text-slate-300">{item.product_mark}</div>
                                  {item.product_voltage && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400">⚡ {item.product_voltage}V</div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button onClick={() => setShowPackageDetails(false)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
                        {t.common.close}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Delete Package Dialog */}
              <Dialog open={showDeletePackageDialog} onOpenChange={setShowDeletePackageDialog}>
                <DialogContent className="bg-red-50 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 text-2xl">
                      <AlertCircle className="h-7 w-7" />
                      {language === 'ar' ? 'تأكيد الحذف' : language === 'fr' ? 'Confirmer la suppression' : 'Confirm Delete'}
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'تأكيد حذف الحزمة من النظام' : language === 'fr' ? 'Confirmer la suppression du paquet' : 'Confirm package deletion'}
                    </DialogDescription>
                  </DialogHeader>

                  <p className="text-lg text-slate-700 dark:text-slate-300">
                    {language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه الحزمة؟'
                      : language === 'fr'
                      ? 'Êtes-vous sûr de vouloir supprimer ce paquet?'
                      : 'Are you sure you want to delete this package?'}
                  </p>

                  <DialogFooter>
                    <Button onClick={() => setShowDeletePackageDialog(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.cancel}
                    </Button>
                    <Button onClick={handleDeletePackage} className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
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
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg h-14 rounded-2xl shadow-lg flex items-center justify-center gap-3"
              >
                <Plus className="h-6 w-6" />
                👑 {t.special.create}
              </motion.button>

              {/* Special Offers Grid */}
              {specialOffers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-700"
                >
                  <Tag className="h-20 w-20 mx-auto mb-4 text-purple-400" />
                  <p className="text-2xl text-slate-600 dark:text-slate-400 font-bold">
                    {language === 'ar' ? '⭐ لا توجد عروض خاصة' : language === 'fr' ? '⭐ Aucune offre spéciale' : '⭐ No special offers'}
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
                      className={`relative rounded-2xl border-2 overflow-hidden shadow-lg hover:shadow-2xl transition-all ${
                        !offer.is_visible
                          ? 'opacity-60 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'
                          : 'border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {/* Image */}
                      {offer.product_image && (
                        <div className="h-40 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
                          <img src={offer.product_image} alt={offer.product_name} className="w-full h-full object-cover" />
                          {offer.show_price && (
                            <div className="absolute bottom-0 right-0 bg-red-500 text-white px-3 py-1 text-sm font-bold">
                              -{Math.round(offer.discount_percentage)}%
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{offer.product_name}</h3>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-3">{offer.product_mark}</p>

                        {/* Price Visibility Badge */}
                        <div className="mb-3">
                          <Badge className={`${offer.show_price ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'}`}>
                            {offer.show_price ? '💰 ' + t.special.display : '🔒 ' + t.special.dont_display}
                          </Badge>
                        </div>

                        {/* Price Display (if visible) */}
                        {offer.show_price && (
                          <div className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 p-3 rounded-xl mb-4">
                            <div className="text-sm text-slate-600 dark:text-slate-300 line-through">
                              {offer.original_price} DZD
                            </div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-300">
                              {offer.special_price} DZD
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {offer.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">{offer.description}</p>
                        )}

                        {/* WhatsApp Button (if price hidden) */}
                        {!offer.show_price && (
                          <motion.a
                            href={offer.whatsapp_link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 mb-3 transition-colors"
                          >
                            <MessageCircle className="h-5 w-5" />
                            WhatsApp
                          </motion.a>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                              setSelectedSpecialDetails(offer);
                              setShowSpecialDetails(true);
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors"
                          >
                            {t.common.view}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                              setEditingSpecialOffer(offer);
                              setSelectedProductSpecial(undefined as any);
                              setOriginalPriceSpecial(offer.original_price);
                              setSpecialPrice(offer.special_price.toString());
                              setSpecialOfferDescription(offer.description || '');
                              setShowSpecialPrice(offer.show_price ?? true);
                              setShowCreateSpecialDialog(true);
                            }}
                            className="flex-1 bg-slate-400 hover:bg-slate-500 text-white font-bold py-2 rounded-lg transition-colors"
                          >
                            ✏️
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                              setSelectedSpecialDelete(offer.id);
                              setShowDeleteSpecialDialog(true);
                            }}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-colors"
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Create Special Offer Dialog with Price Visibility */}
              <Dialog open={showCreateSpecialDialog} onOpenChange={setShowCreateSpecialDialog}>
                <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-3xl flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <Tag className="h-8 w-8" />
                      {t.special.create}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6 py-6">
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
                          <div className="max-h-48 overflow-y-auto border-2 border-slate-300 dark:border-slate-600 rounded-xl p-3 space-y-2">
                            {products
                              .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.mark?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((product) => (
                                <motion.button
                                  key={product.id}
                                  onClick={() => handleSelectProductSpecial(product)}
                                  whileHover={{ x: 5 }}
                                  className="w-full text-left p-3 rounded-lg bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                >
                                  <div className="font-bold text-purple-900 dark:text-purple-100">{product.name}</div>
                                  <div className="text-sm text-purple-700 dark:text-purple-300">{product.mark?.name} - {product.selling_price} DZD</div>
                                </motion.button>
                              ))}
                          </div>
                        )}

                        {selectedProductSpecial && (
                          <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-xl border-2 border-purple-300 dark:border-purple-600">
                            <p className="font-bold text-purple-900 dark:text-purple-100">
                              ✅ {selectedProductSpecial.name}
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
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setShowSpecialPrice(true)}
                          className={`p-4 rounded-xl border-2 font-bold transition-all ${
                            showSpecialPrice
                              ? 'border-green-500 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                              : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          💰 {t.special.display}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setShowSpecialPrice(false)}
                          className={`p-4 rounded-xl border-2 font-bold transition-all ${
                            !showSpecialPrice
                              ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
                              : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          🔒 {t.special.dont_display}
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
                          <div className="bg-red-100 dark:bg-red-900 p-3 rounded-xl">
                            <p className="text-red-900 dark:text-red-100 font-bold">
                              💰 {language === 'ar' ? 'الخصم' : language === 'fr' ? 'Remise' : 'Discount'}: {discountAmountSpecial} DZD ({discountPercentSpecial}%)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-3">
                      <Label className="text-lg font-bold">
                        {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                        {!showSpecialPrice && <span className="text-red-500"> *</span>}
                      </Label>
                      <p className="text-sm text-slate-600 dark:text-slate-300 italic">{t.special.info}</p>
                      <textarea
                        value={specialOfferDescription}
                        onChange={(e) => setSpecialOfferDescription(e.target.value)}
                        placeholder={!showSpecialPrice ? t.special.description_req : 'Optional description...'}
                        className="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white text-base h-24 resize-none"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={() => setShowCreateSpecialDialog(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.cancel}
                    </Button>
                    <Button
                      onClick={handleCreateSpecialOfferWithPriceToggle}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg h-11 px-6 rounded-xl"
                    >
                      {t.special.create_btn}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Special Offer Details Dialog */}
              {selectedSpecialDetails && (
                <Dialog open={showSpecialDetails} onOpenChange={setShowSpecialDetails}>
                  <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-3xl flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Tag className="h-8 w-8" />
                        {selectedSpecialDetails.product_name}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-6">
                      {selectedSpecialDetails.product_image && (
                        <img src={selectedSpecialDetails.product_image} alt={selectedSpecialDetails.product_name} className="w-full h-64 object-cover rounded-xl" />
                      )}

                      {selectedSpecialDetails.show_price && (
                        <div className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 p-4 rounded-xl">
                          <p className="text-sm text-slate-600 dark:text-slate-300">Original Price</p>
                          <p className="text-3xl font-bold text-red-600 dark:text-red-300 line-through">{selectedSpecialDetails.original_price} DZD</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Special Price</p>
                          <p className="text-4xl font-bold text-green-600 dark:text-green-300">{selectedSpecialDetails.special_price} DZD</p>
                          <p className="text-lg font-bold text-red-600 dark:text-red-300 mt-2">Save {selectedSpecialDetails.discount_percentage}%</p>
                        </div>
                      )}

                      {!selectedSpecialDetails.show_price && (
                        <div className="bg-yellow-50 dark:bg-yellow-900 border-2 border-yellow-300 dark:border-yellow-600 p-4 rounded-xl">
                          <p className="font-bold text-yellow-900 dark:text-yellow-100 mb-3">🔒 Price Hidden - Contact via WhatsApp</p>
                          <motion.a
                            href={selectedSpecialDetails.whatsapp_link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-center"
                          >
                            📱 Contact on WhatsApp
                          </motion.a>
                        </div>
                      )}

                      {selectedSpecialDetails.description && (
                        <div>
                          <h4 className="font-bold text-lg mb-2">Description</h4>
                          <p className="text-slate-600 dark:text-slate-300">{selectedSpecialDetails.description}</p>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button onClick={() => setShowSpecialDetails(false)} className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
                        {t.common.close}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Delete Special Offer Dialog */}
              <Dialog open={showDeleteSpecialDialog} onOpenChange={setShowDeleteSpecialDialog}>
                <DialogContent className="bg-red-50 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 text-2xl">
                      <AlertCircle className="h-7 w-7" />
                      Confirm Delete
                    </DialogTitle>
                  </DialogHeader>

                  <p className="text-lg text-slate-700 dark:text-slate-300">Are you sure you want to delete this special offer?</p>

                  <DialogFooter>
                    <Button onClick={() => setShowDeleteSpecialDialog(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
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
                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg h-11 px-6 rounded-xl"
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
              className="space-y-6 max-w-2xl mx-auto"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-blue-300 dark:border-blue-700 shadow-lg">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">📱 {language === 'ar' ? 'معلومات الاتصال' : language === 'fr' ? 'Informations de Contact' : 'Contact Information'}</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-bold">{language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Numéro de Téléphone' : 'Phone Number'}</Label>
                    <Input type="tel" placeholder="+213 XXX XXX XXX" className="h-12 text-base" />
                  </div>
                  <div>
                    <Label className="text-lg font-bold">{language === 'ar' ? 'عنوان البريد الإلكتروني' : language === 'fr' ? 'Adresse Email' : 'Email Address'}</Label>
                    <Input type="email" placeholder="contact@example.com" className="h-12 text-base" />
                  </div>
                  <div>
                    <Label className="text-lg font-bold">{language === 'ar' ? 'رقم الواتساب' : language === 'fr' ? 'Numéro WhatsApp' : 'WhatsApp Number'}</Label>
                    <Input type="tel" placeholder="+213 XXX XXX XXX" className="h-12 text-base" />
                  </div>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg h-12">
                    {t.common.save}
                  </Button>
                </div>
              </div>
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
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-lg sm:shadow-xl">
                <h2 className="text-2xl sm:text-4xl font-black mb-2">🚚 {language === 'ar' ? 'إدارة التوصيل' : language === 'fr' ? 'Gestion de la Livraison' : 'Delivery Management'}</h2>
                <p className="text-base sm:text-lg opacity-90">{language === 'ar' ? '✨ إضافة وإدارة شركات التوصيل والأسعار' : language === 'fr' ? '✨ Ajoutez et gérez les agences de livraison' : '✨ Manage delivery agencies and prices'}</p>
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
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black text-sm sm:text-lg h-12 sm:h-16 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center gap-2 sm:gap-3 border-2 border-white/20 transition-all"
              >
                <Plus className="h-5 sm:h-7 w-5 sm:w-7" />
                <span className="hidden sm:inline">🚚 + {language === 'ar' ? 'شركة توصيل جديدة' : language === 'fr' ? 'Nouvelle Agence' : 'New Agency'}</span>
                <span className="sm:hidden">🚚 {language === 'ar' ? 'جديدة' : language === 'fr' ? 'Nouveau' : 'New'}</span>
              </motion.button>

              {/* Delivery Agencies Grid */}
              {deliveryAgencies.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-24 bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl sm:rounded-3xl border-4 border-dashed border-orange-300 dark:border-orange-700"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <Truck className="h-16 sm:h-28 w-16 sm:w-28 mx-auto text-orange-400" />
                  </motion.div>
                  <p className="text-xl sm:text-3xl font-black text-slate-700 dark:text-slate-200 mb-2">
                    {language === 'ar' ? '🚚 لا توجد شركات توصيل حالياً' : language === 'fr' ? '🚚 Aucune agence de livraison' : '🚚 No delivery agencies yet'}
                  </p>
                  <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400">
                    {language === 'ar' ? '👆 اضغط الزر أعلاه لإضافة شركة توصيل' : language === 'fr' ? '👆 Cliquez sur le bouton ci-dessus' : '👆 Click the button above'}
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
                      className={`relative rounded-2xl sm:rounded-3xl border-2 sm:border-3 overflow-hidden shadow-md sm:shadow-lg hover:shadow-xl transition-all p-4 sm:p-6 ${
                        !agency.is_visible
                          ? 'opacity-50 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'
                          : 'border-orange-300 dark:border-orange-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {/* Header Badge */}
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 sm:px-4 py-2 flex justify-between items-center z-20 text-xs sm:text-sm">
                        <span className="font-bold">🚚 {agency.name}</span>
                        {!agency.is_visible && <span className="text-xs bg-red-600 px-2 rounded-full">🚫 Hidden</span>}
                      </div>

                      {/* Content */}
                      <div className="mt-12 sm:mt-14 space-y-3 sm:space-y-4">
                        {/* Description */}
                        {agency.description && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{agency.description}</p>
                        )}

                        {/* Contact Info */}
                        <div className="space-y-1 sm:space-y-2">
                          {agency.contact_phone && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span>📱</span>
                              <span className="text-slate-700 dark:text-slate-300">{agency.contact_phone}</span>
                            </div>
                          )}
                          {agency.contact_email && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span>✉️</span>
                              <span className="text-slate-700 dark:text-slate-300">{agency.contact_email}</span>
                            </div>
                          )}
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 p-2 sm:p-3 rounded-lg">
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🏠 {language === 'ar' ? 'منزل' : language === 'fr' ? 'Domicile' : 'Home'}</div>
                            <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-300">{agency.price_domicile.toFixed(2)} DZD</div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800 p-2 sm:p-3 rounded-lg">
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">🏢 {language === 'ar' ? 'مكتب' : language === 'fr' ? 'Bureau' : 'Office'}</div>
                            <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-300">{agency.price_bureau.toFixed(2)} DZD</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2 pt-3 sm:pt-4">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleEditDeliveryAgency(agency)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="hidden sm:inline">✏️</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleToggleDeliveryVisibility(agency)}
                            className={`font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm ${
                              agency.is_visible
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : 'bg-slate-400 hover:bg-slate-500 text-white'
                            }`}
                            title={agency.is_visible ? 'Hide' : 'Show'}
                          >
                            {agency.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            <span className="hidden sm:inline">{agency.is_visible ? '👁️' : '🚫'}</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={() => {
                              setSelectedDeliveryDelete(agency.id);
                              setShowDeleteDeliveryDialog(true);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">🗑️</span>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Create/Edit Delivery Agency Dialog */}
              <Dialog open={showCreateDeliveryDialog} onOpenChange={setShowCreateDeliveryDialog}>
                <DialogContent className="max-w-full w-full sm:max-w-2xl mx-auto bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-900 border-2 sm:border-3 border-orange-300 dark:border-orange-600 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="mb-4 sm:mb-6">
                    <DialogTitle className="text-2xl sm:text-4xl flex items-center gap-2 sm:gap-3 text-orange-600 dark:text-orange-400 font-black line-clamp-2">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex-shrink-0">
                        🚚
                      </motion.div>
                      <span className="text-lg sm:text-3xl">
                        {editingDeliveryAgency ? `✏️ ${language === 'ar' ? 'تعديل' : language === 'fr' ? 'Modifier' : 'Edit'}` : `${language === 'ar' ? 'شركة توصيل جديدة' : language === 'fr' ? 'Nouvelle Agence' : 'New Agency'}`}
                      </span>
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'إضافة أو تعديل شركة توصيل' : language === 'fr' ? 'Ajouter ou modifier une agence de livraison' : 'Add or edit delivery agency'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 sm:space-y-6 py-2 sm:py-4">
                    {/* Section 1: Basic Info */}
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 sm:p-6 rounded-lg sm:rounded-2xl border-2 border-orange-300 dark:border-orange-700">
                      <h3 className="text-base sm:text-lg font-black text-orange-700 dark:text-orange-300 mb-3 sm:mb-4">📋 {language === 'ar' ? 'المعلومات الأساسية' : language === 'fr' ? 'Informations de Base' : 'Basic Info'}</h3>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {/* Agency Name */}
                        <div className="space-y-1 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                            🏢 {language === 'ar' ? 'اسم الشركة' : language === 'fr' ? 'Nom de l\'Agence' : 'Agency Name'}
                          </Label>
                          <Input
                            value={agencyName}
                            onChange={(e) => setAgencyName(e.target.value)}
                            placeholder={language === 'ar' ? 'مثل: Yassir' : language === 'fr' ? 'Ex: Yassir' : 'E.g: Yassir'}
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-orange-300 dark:border-orange-600 rounded-lg sm:rounded-xl font-semibold"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-1 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                            📝 {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
                          </Label>
                          <Input
                            value={agencyDescription}
                            onChange={(e) => setAgencyDescription(e.target.value)}
                            placeholder={language === 'ar' ? 'وصف الخدمة' : language === 'fr' ? 'Description du service' : 'Service description'}
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-orange-300 dark:border-orange-600 rounded-lg sm:rounded-xl font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Prices */}
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-3 sm:p-6 rounded-lg sm:rounded-2xl border-2 border-purple-300 dark:border-purple-700">
                      <h3 className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300 mb-3 sm:mb-4">💰 {language === 'ar' ? 'الأسعار' : language === 'fr' ? 'Tarifs' : 'Prices'}</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {/* Price Domicile */}
                        <div className="space-y-1 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                            🏠 {language === 'ar' ? 'سعر المنزل' : language === 'fr' ? 'Prix Domicile' : 'Home Price'}
                          </Label>
                          <Input
                            type="number"
                            value={priceDomicile}
                            onChange={(e) => setPriceDomicile(e.target.value)}
                            placeholder="0.00"
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-blue-300 dark:border-blue-600 rounded-lg sm:rounded-xl font-semibold"
                          />
                        </div>

                        {/* Price Bureau */}
                        <div className="space-y-1 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                            🏢 {language === 'ar' ? 'سعر المكتب' : language === 'fr' ? 'Prix Bureau' : 'Office Price'}
                          </Label>
                          <Input
                            type="number"
                            value={priceBureau}
                            onChange={(e) => setPriceBureau(e.target.value)}
                            placeholder="0.00"
                            className="h-10 sm:h-12 text-sm sm:text-base border-2 border-purple-300 dark:border-purple-600 rounded-lg sm:rounded-xl font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-slate-200 dark:border-slate-700 mt-4 sm:mt-6">
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
                      className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-xs sm:text-base h-10 sm:h-12 px-3 sm:px-6 rounded-lg sm:rounded-xl transition-all"
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
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xs sm:text-base h-10 sm:h-12 rounded-lg sm:rounded-xl transition-all shadow-lg flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <span className="text-lg sm:text-xl">{editingDeliveryAgency ? '💾' : '✨'}</span>
                      <span className="hidden sm:inline">{editingDeliveryAgency ? language === 'ar' ? 'تحديث' : language === 'fr' ? 'Mettre à jour' : 'Update' : language === 'ar' ? 'إنشاء' : language === 'fr' ? 'Créer' : 'Create'}</span>
                      <span className="sm:hidden">{editingDeliveryAgency ? '✏️' : '✨'}</span>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Delivery Agency Dialog */}
              <Dialog open={showDeleteDeliveryDialog} onOpenChange={setShowDeleteDeliveryDialog}>
                <DialogContent className="bg-red-50 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 text-2xl">
                      <AlertCircle className="h-7 w-7" />
                      {language === 'ar' ? 'تأكيد الحذف' : language === 'fr' ? 'Confirmer la suppression' : 'Confirm Delete'}
                    </DialogTitle>
                    <DialogDescription className="hidden">
                      {language === 'ar' ? 'هل أنت متأكد من حذف شركة التوصيل؟' : language === 'fr' ? 'Êtes-vous sûr de supprimer cette agence?' : 'Confirm delete delivery agency'}
                    </DialogDescription>
                  </DialogHeader>

                  <p className="text-lg text-slate-700 dark:text-slate-300">
                    {language === 'ar'
                      ? 'هل أنت متأكد من حذف هذه شركة التوصيل؟'
                      : language === 'fr'
                      ? 'Êtes-vous sûr de vouloir supprimer cette agence de livraison?'
                      : 'Are you sure you want to delete this delivery agency?'}
                  </p>

                  <DialogFooter>
                    <Button onClick={() => setShowDeleteDeliveryDialog(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.cancel}
                    </Button>
                    <Button onClick={handleDeleteDeliveryAgency} className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg h-11 px-6 rounded-xl">
                      {t.common.delete}
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
              className="space-y-6 max-w-2xl mx-auto"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-slate-300 dark:border-slate-700 shadow-lg">
                <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-6">⚙️ {language === 'ar' ? 'الإعدادات' : language === 'fr' ? 'Paramètres' : 'Settings'}</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-bold">{language === 'ar' ? 'اسم الموقع' : language === 'fr' ? 'Nom du Site' : 'Website Name'}</Label>
                    <Input placeholder="M NEXT TECH" className="h-12 text-base" />
                  </div>
                  <div>
                    <Label className="text-lg font-bold">{language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}</Label>
                    <textarea className="w-full h-24 p-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700" placeholder="Your website description" />
                  </div>
                  <Button className="w-full bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg h-12">
                    {t.common.save}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
