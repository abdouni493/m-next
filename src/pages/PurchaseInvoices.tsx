import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  description?: string;
  mark?: { id: string; name: string };
  mark_id?: string;
  connector_type?: { id: string; name: string };
  connector_type_id?: string;
  voltage: number;
  wattage: number;
  amperage: number;
  model_number?: string;
  quantity_initial: number;
  quantity_actual: number;
  quantity_minimal: number;
  purchase_price: number;
  selling_price: number;
  primary_image?: string;
  margin?: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface Mark {
  id: string;
  name: string;
}

interface ConnectorType {
  id: string;
  name: string;
}

interface FormData {
  product_id?: string;
  quantity_initial: string;
  quantity_actual: string;
  quantity_minimal: string;
  purchase_price: string;
  selling_price: string;
  mark_id: string;
  connector_type_id: string;
  supplier_id: string;
  voltage: string;
  wattage: string;
  amperage: string;
  description: string;
  model_number: string;
  amount_paid: string;
  images: File[];
}

export default function PurchaseInvoices() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  // Loading & UI States
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState<'search' | 'form'>('search'); // search for product or form to fill

  // Data States
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [connectorTypes, setConnectorTypes] = useState<ConnectorType[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chargerImages, setChargerImages] = useState<Array<{ id: string; image_url: string; file_path: string; display_order: number; is_primary: boolean }>>([]); // Store existing product images

  // Form States
  const [formData, setFormData] = useState<FormData>({
    product_id: '',
    quantity_initial: '',
    quantity_actual: '',
    quantity_minimal: '',
    purchase_price: '',
    selling_price: '',
    mark_id: '',
    connector_type_id: '',
    supplier_id: '',
    voltage: '',
    wattage: '',
    amperage: '',
    description: '',
    model_number: '',
    amount_paid: '',
    images: [],
  });

  const [showAddMarkModal, setShowAddMarkModal] = useState(false);
  const [newMarkName, setNewMarkName] = useState('');
  const [showAddConnectorModal, setShowAddConnectorModal] = useState(false);
  const [newConnectorName, setNewConnectorName] = useState('');

  // Load initial data
  useEffect(() => {
    loadSuppliers();
    loadMarks();
    loadConnectorTypes();
    loadInvoices();
  }, []);

  // Search products
  useEffect(() => {
    if (searchTerm.trim()) {
      searchProducts();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const getText = (key: string): string => {
    const translations: { [key: string]: { [key: string]: string } } = {
      en: {
        title: '🚚 Purchase Management',
        new_purchase: '➕ New Purchase',
        total_invoices: 'Total Invoices',
        paid_invoices: 'Paid Invoices',
        pending_invoices: 'Pending Invoices',
        total_amount: 'Total Amount',
        recent_invoices: 'Recent Invoices',
        showing_invoices: 'Showing latest {count} of {total} invoices',
        no_invoices: 'No invoices yet',
        start_creating: 'Start by creating a new purchase invoice',
        search_charger: '🔍 Search Chargers...',
        no_results: '❌ No chargers found',
        mark: '🏷️ Mark',
        connector: '🔌 Connector Type',
        voltage: '⚡ Voltage (V)',
        wattage: '🔌 Wattage (W)',
        amperage: '⚙️ Amperage (A)',
        model: '📱 Model Number',
        initial_qty: '📦 Initial Quantity',
        actual_qty: '📊 Actual Quantity',
        minimal_qty: '⚠️ Minimal Quantity',
        purchase_price: '💵 Purchase Price',
        selling_price: '💰 Selling Price',
        supplier: '🚚 Supplier',
        amount_paid: '💳 Amount Paid',
        total_rest: '💰 Rest to Pay',
        save: '💾 Save Purchase',
        cancel: '❌ Cancel',
        loading: '⏳ Loading...',
        error: '❌ Error',
        success: '✅ Success',
        add_new_mark: '➕ Add New Mark',
        add_new_connector: '➕ Add Connector Type',
        description: '📝 Description (Optional)',
        images: '🖼️ Product Images',
        upload_images: '📤 Upload Images',
        search_by_name_mark: '🔍 Search by name or mark...',
        select_product_first: 'Please select a charger first',
        charger_selected: 'Charger selected successfully',
        purchase_created: 'Purchase created successfully',
        purchase_updated: 'Product updated successfully',
        delete_image: 'Delete image',
      },
      fr: {
        title: '🚚 Gestion des Achats',
        new_purchase: '➕ Nouvel Achat',
        total_invoices: 'Total des factures',
        paid_invoices: 'Factures payées',
        pending_invoices: 'Factures en attente',
        total_amount: 'Montant total',
        recent_invoices: 'Factures récentes',
        showing_invoices: 'Affichage des {count} dernières sur {total} factures',
        no_invoices: 'Aucune facture',
        start_creating: 'Commencez par créer une nouvelle facture d\'achat',
        search_charger: '🔍 Rechercher des chargeurs...',
        no_results: '❌ Aucun chargeur trouvé',
        mark: '🏷️ Marque',
        connector: '🔌 Type de connecteur',
        voltage: '⚡ Tension (V)',
        wattage: '🔌 Puissance (W)',
        amperage: '⚙️ Intensité (A)',
        model: '📱 Numéro de modèle',
        initial_qty: '📦 Quantité initiale',
        actual_qty: '📊 Quantité actuelle',
        minimal_qty: '⚠️ Quantité minimale',
        purchase_price: '💵 Prix d\'achat',
        selling_price: '💰 Prix de vente',
        supplier: '🚚 Fournisseur',
        amount_paid: '💳 Montant payé',
        total_rest: '💰 Reste à payer',
        save: '💾 Sauvegarder l\'achat',
        cancel: '❌ Annuler',
        loading: '⏳ Chargement...',
        error: '❌ Erreur',
        success: '✅ Succès',
        add_new_mark: '➕ Ajouter une nouvelle marque',
        add_new_connector: '➕ Ajouter un type de connecteur',
        description: '📝 Description (optionnel)',
        images: '🖼️ Images du produit',
        upload_images: '📤 Télécharger des images',
        search_by_name_mark: '🔍 Rechercher par nom ou marque...',
        select_product_first: 'Veuillez d\'abord sélectionner un chargeur',
        charger_selected: 'Chargeur sélectionné avec succès',
        purchase_created: 'Achat créé avec succès',
        purchase_updated: 'Produit mis à jour avec succès',
        delete_image: 'Supprimer l\'image',
      },
      ar: {
        title: '🚚 إدارة الشراء',
        new_purchase: '➕ شراء جديد',
        total_invoices: 'إجمالي الفواتير',
        paid_invoices: 'فواتير مدفوعة',
        pending_invoices: 'فواتير معلقة',
        total_amount: 'المجموع',
        recent_invoices: 'الفواتير الأخيرة',
        showing_invoices: 'عرض آخر {count} من أصل {total} فاتورة',
        no_invoices: 'لا توجد فواتير',
        start_creating: 'ابدأ بإنشاء فاتورة شراء جديدة',
        search_charger: '🔍 البحث عن الشواحن...',
        no_results: '❌ لم يتم العثور على شواحن',
        mark: '🏷️ العلامة',
        connector: '🔌 نوع الموصل',
        voltage: '⚡ الجهد (V)',
        wattage: '🔌 القوة (W)',
        amperage: '⚙️ التيار (A)',
        model: '📱 رقم الموديل',
        initial_qty: '📦 الكمية الأولية',
        actual_qty: '📊 الكمية الحالية',
        minimal_qty: '⚠️ الحد الأدنى للكمية',
        purchase_price: '💵 سعر الشراء',
        selling_price: '💰 سعر البيع',
        supplier: '🚚 المورد',
        amount_paid: '💳 المبلغ المدفوع',
        total_rest: '💰 الباقي',
        save: '💾 حفظ الشراء',
        cancel: '❌ إلغاء',
        loading: '⏳ جاري التحميل...',
        error: '❌ خطأ',
        success: '✅ نجاح',
        add_new_mark: '➕ إضافة علامة جديدة',
        add_new_connector: '➕ إضافة نوع موصل',
        description: '📝 الوصف (اختياري)',
        images: '🖼️ صور المنتج',
        upload_images: '📤 تحميل الصور',
        search_by_name_mark: '🔍 البحث بالاسم أو العلامة...',
        select_product_first: 'يرجى تحديد شاحن أولاً',
        charger_selected: 'تم تحديد الشاحن بنجاح',
        purchase_created: 'تم إنشاء الشراء بنجاح',
        purchase_updated: 'تم تحديث المنتج بنجاح',
        delete_image: 'حذف الصورة',
      },
    };

    return translations[language]?.[key] || key;
  };

  const loadSuppliers = async () => {
    try {
      const { data } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadMarks = async () => {
    try {
      const { data } = await supabase
        .from('marks')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setMarks(data || []);
    } catch (error) {
      console.error('Error loading marks:', error);
    }
  };

  const loadConnectorTypes = async () => {
    try {
      const { data } = await supabase
        .from('connector_types')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setConnectorTypes(data || []);
    } catch (error) {
      console.error('Error loading connector types:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('type', 'purchase')
        .order('invoice_date', { ascending: false });
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const searchProducts = async () => {
    try {
      const searchLower = searchTerm.toLowerCase();
      const { data } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          mark_id,
          connector_type_id,
          voltage,
          wattage,
          amperage,
          model_number,
          quantity_initial,
          quantity_actual,
          quantity_minimal,
          purchase_price,
          selling_price,
          primary_image,
          marks(id, name),
          connector_types(id, name)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${searchLower}%,description.ilike.%${searchLower}%`)
        .limit(10);

      if (data) {
        const mapped = data.map((p: any) => ({
          ...p,
          mark: p.marks,
          connector_type: p.connector_types,
          margin: ((p.selling_price - p.purchase_price) / p.purchase_price) * 100,
        }));
        setSearchResults(mapped);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_id: product.id,
      quantity_initial: product.quantity_initial.toString(),
      quantity_actual: product.quantity_actual.toString(),
      quantity_minimal: product.quantity_minimal.toString(),
      purchase_price: product.purchase_price.toString(),
      selling_price: product.selling_price.toString(),
      mark_id: product.mark_id || '',
      connector_type_id: product.connector_type_id || '',
      supplier_id: '',
      voltage: product.voltage.toString(),
      wattage: product.wattage.toString(),
      amperage: product.amperage.toString(),
      description: product.description || '',
      model_number: product.model_number || '',
      amount_paid: '0',
      images: [],
    });

    // Fetch product images
    try {
      const { data: images } = await supabase
        .from('product_images')
        .select('id, image_url, file_path, display_order, is_primary')
        .eq('product_id', product.id)
        .order('display_order', { ascending: true });
      setChargerImages(images || []);
    } catch (error) {
      console.error('Error loading product images:', error);
      setChargerImages([]);
    }

    setStep('form');
    toast({
      title: getText('charger_selected'),
      description: getText('charger_selected'),
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({
      ...formData,
      images: [...formData.images, ...files],
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleRemoveExistingImage = async (imageId: string) => {
    if (!selectedProduct) return;
    try {
      // Delete from database
      await supabase.from('product_images').delete().eq('id', imageId);
      // Update the chargerImages state
      setChargerImages(chargerImages.filter((img) => img.id !== imageId));
      toast({
        title: getText('success'),
        description: language === 'ar' ? 'تم حذف الصورة' : 'Image deleted',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: getText('error'),
        description: language === 'ar' ? 'خطأ في حذف الصورة' : 'Error deleting image',
        variant: 'destructive',
      });
    }
  };

  const handleAddMark = async () => {
    if (!newMarkName.trim()) return;
    try {
      const { data } = await supabase
        .from('marks')
        .insert([{ name: newMarkName, is_active: true }])
        .select()
        .single();
      if (data) {
        setMarks([...marks, data]);
        setFormData({ ...formData, mark_id: data.id });
        setNewMarkName('');
        setShowAddMarkModal(false);
      }
    } catch (error) {
      console.error('Error adding mark:', error);
    }
  };

  const handleAddConnectorType = async () => {
    if (!newConnectorName.trim()) return;
    try {
      const { data } = await supabase
        .from('connector_types')
        .insert([{ name: newConnectorName, is_active: true }])
        .select()
        .single();
      if (data) {
        setConnectorTypes([...connectorTypes, data]);
        setFormData({ ...formData, connector_type_id: data.id });
        setNewConnectorName('');
        setShowAddConnectorModal(false);
      }
    } catch (error) {
      console.error('Error adding connector type:', error);
    }
  };

  const uploadImages = async (productId: string) => {
    if (formData.images.length === 0) return;

    try {
      for (let i = 0; i < formData.images.length; i++) {
        const file = formData.images[i];
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${productId}/${timestamp}-${i}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from('chargers')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('chargers')
          .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;

        if (i === 0) {
          await supabase
            .from('products')
            .update({ primary_image: publicUrl })
            .eq('id', productId);
        }

        await supabase.from('product_images').insert([
          {
            product_id: productId,
            image_url: publicUrl,
            file_path: fileName,
            display_order: i,
            is_primary: i === 0,
          },
        ]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleSavePurchase = async () => {
    if (!selectedProduct || !formData.supplier_id) {
      toast({
        title: getText('error'),
        description: getText('select_product_first'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const quantityInitial = parseInt(formData.quantity_initial) || 0;
      const quantityActual = parseInt(formData.quantity_actual) || 0;
      const purchasePrice = parseFloat(formData.purchase_price) || 0;
      const sellingPrice = parseFloat(formData.selling_price) || 0;
      const amountPaid = parseFloat(formData.amount_paid) || 0;

      // Update product with new information
      await supabase.from('products').update({
        mark_id: formData.mark_id || null,
        connector_type_id: formData.connector_type_id || null,
        voltage: parseFloat(formData.voltage) || 0,
        wattage: parseFloat(formData.wattage) || 0,
        amperage: parseFloat(formData.amperage) || 0,
        model_number: formData.model_number,
        description: formData.description,
        quantity_initial: selectedProduct.quantity_initial + quantityInitial,
        quantity_actual: selectedProduct.quantity_actual + quantityActual,
        quantity_minimal: parseInt(formData.quantity_minimal) || 0,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
      }).eq('id', selectedProduct.id);

      // Create invoice
      const invoiceNumber = `PUR-${Date.now()}`;
      const { data: invoiceData } = await supabase
        .from('invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            type: 'purchase',
            supplier_id: formData.supplier_id,
            subtotal: purchasePrice * (quantityInitial || 1),
            discount_amount: 0,
            total_amount: purchasePrice * (quantityInitial || 1),
            amount_paid: amountPaid,
            status: amountPaid >= purchasePrice * (quantityInitial || 1) ? 'paid' : 'pending',
            payment_date: amountPaid > 0 ? new Date().toISOString() : null,
            invoice_date: new Date().toISOString(),
            notes: '',
          },
        ])
        .select()
        .single();

      if (invoiceData) {
        await supabase.from('invoice_items').insert([
          {
            invoice_id: invoiceData.id,
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            quantity: quantityInitial,
            unit_price: purchasePrice,
            total_price: purchasePrice * quantityInitial,
          },
        ]);
      }

      // Upload images if any
      if (formData.images.length > 0) {
        await uploadImages(selectedProduct.id);
      }

      toast({
        title: getText('success'),
        description: getText('purchase_created'),
      });

      // Reset
      setStep('search');
      setSearchTerm('');
      setSelectedProduct(null);
      setFormData({
        product_id: '',
        quantity_initial: '',
        quantity_actual: '',
        quantity_minimal: '',
        purchase_price: '',
        selling_price: '',
        mark_id: '',
        connector_type_id: '',
        supplier_id: '',
        voltage: '',
        wattage: '',
        amperage: '',
        description: '',
        model_number: '',
        amount_paid: '',
        images: [],
      });
      setShowCreateDialog(false);
      loadInvoices();
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast({
        title: getText('error'),
        description: getText('error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = selectedProduct ? parseFloat(formData.purchase_price) * parseInt(formData.quantity_initial) : 0;
  const amountPaid = parseFloat(formData.amount_paid) || 0;
  const restToPay = Math.max(0, totalPrice - amountPaid);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header with Statistics */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">
              {getText('title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {language === 'ar' ? 'إدارة فواتير الشراء والمخزون' : 'Manage purchase invoices and inventory'}
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => {
                setShowCreateDialog(true);
                setStep('search');
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {getText('new_purchase')}
            </Button>
          </motion.div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl border border-blue-200 dark:border-blue-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{getText('total_invoices')}</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{invoices.length}</p>
              </div>
              <div className="text-5xl opacity-50">📋</div>
            </div>
          </motion.div>

          {/* Paid Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-xl border border-green-200 dark:border-green-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{getText('paid_invoices')}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{invoices.filter(inv => inv.status === 'paid').length}</p>
              </div>
              <div className="text-5xl opacity-50">✅</div>
            </div>
          </motion.div>

          {/* Pending Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{getText('pending_invoices')}</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{invoices.filter(inv => inv.status === 'pending').length}</p>
              </div>
              <div className="text-5xl opacity-50">⏳</div>
            </div>
          </motion.div>

          {/* Total Amount */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl border border-purple-200 dark:border-purple-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{getText('total_amount')}</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">💵 {invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toFixed(2)}</p>
              </div>
              <div className="text-5xl opacity-50">💰</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Create Purchase Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold">{getText('new_purchase')}</h2>
                <button
                  onClick={() => {
                    setShowCreateDialog(false);
                    setStep('search');
                  }}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  ❌
                </button>
              </div>

              <div className="p-8">
                {step === 'search' ? (
                  // Search Step
                  <div className="space-y-6">
                    <div>
                      <Label className="text-lg font-semibold">{getText('search_by_name_mark')}</Label>
                      <Input
                        placeholder={getText('search_charger')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-3 p-4 text-lg"
                      />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="grid gap-4">
                        {searchResults.map((product) => (
                          <motion.div
                            key={product.id}
                            className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => handleSelectProduct(product)}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex gap-4">
                              {product.primary_image && (
                                <img
                                  src={product.primary_image}
                                  alt={product.name}
                                  className="w-24 h-24 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{product.name}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {product.mark?.name && `🏷️ ${product.mark.name}`}
                                  {product.connector_type?.name && ` • 🔌 ${product.connector_type.name}`}
                                </p>
                                <p className="text-sm mt-2">
                                  ⚡ {product.voltage}V • 🔌 {product.wattage}W • ⚙️ {product.amperage}A
                                </p>
                                <p className="text-lg font-bold text-blue-600 mt-2">💵 {product.purchase_price}</p>
                              </div>
                              <Badge className="h-fit bg-blue-500">➜ {language === 'ar' ? 'اختيار' : 'Select'}</Badge>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {searchTerm && searchResults.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-3xl mb-2">📭</p>
                        <p>{getText('no_results')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Form Step
                  <div className="space-y-6">
                    {selectedProduct && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-2 border-blue-200">
                        <p className="font-bold text-lg">
                          ✅ {language === 'ar' ? 'تم تحديد' : 'Selected'}: <span className="text-blue-600">{selectedProduct.name}</span>
                        </p>
                        <button
                          onClick={() => setStep('search')}
                          className="text-sm text-blue-600 hover:underline mt-2"
                        >
                          {language === 'ar' ? 'تغيير المنتج' : 'Change Product'}
                        </button>
                      </motion.div>
                    )}

                    {/* Images Upload Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0 }}
                      className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200"
                    >
                      <h3 className="text-lg font-bold text-cyan-900 mb-4">🖼️ {language === 'ar' ? 'صور المنتج' : 'Product Images'}</h3>
                      
                      {/* Current Images Preview */}
                      {chargerImages.length > 0 && (
                        <div className="mb-4 p-4 bg-white dark:bg-slate-700 rounded-lg border border-cyan-300 dark:border-cyan-600">
                          <p className="text-xs font-semibold text-cyan-700 mb-3">📸 {language === 'ar' ? 'الصور الحالية' : 'Current Images'}</p>
                          <div className="grid grid-cols-4 gap-2">
                            {chargerImages.map((image) => (
                              <div key={image.id} className="relative group">
                                <img
                                  src={image.image_url}
                                  alt="Product image"
                                  className="w-full h-20 object-cover rounded-lg border border-cyan-300"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(image.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-lg rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold"
                                    title={getText('delete_image')}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload Section */}
                      <div className="border-2 border-dashed border-cyan-300 dark:border-cyan-600 rounded-lg p-6 text-center bg-white dark:bg-slate-700 mb-4">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageSelect}
                          id="imageInput"
                          className="hidden"
                        />
                        <label htmlFor="imageInput" className="cursor-pointer block">
                          <p className="text-cyan-900 font-semibold">
                            {formData.images.length > 0
                              ? `✅ ${formData.images.length} ${language === 'ar' ? 'صورة محددة' : 'image(s) selected'}`
                              : language === 'ar'
                              ? '📤 اضغط لتحديد الصور'
                              : '📤 Click to select images'}
                          </p>
                        </label>
                      </div>

                      {/* New Images Preview */}
                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg border border-cyan-300"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="bg-red-500 hover:bg-red-600 text-white text-lg rounded-full w-8 h-8 flex items-center justify-center transition-colors font-bold"
                                  title={getText('delete_image')}
                                >
                                  🗑️
                                </button>
                              </div>
                              <p className="text-xs text-cyan-700 mt-1 truncate">{image.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    {/* Product Info Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
                    >
                      <h3 className="text-lg font-bold text-blue-900 mb-4">📦 {language === 'ar' ? 'معلومات المنتج' : 'Product Information'}</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-blue-900">
                            🏷️ {language === 'ar' ? 'اسم المنتج' : 'Product Name'}
                          </label>
                          <input
                            type="text"
                            value={selectedProduct?.name || ''}
                            disabled
                            className="w-full px-4 py-2 border border-blue-300 rounded-lg bg-slate-100 text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-blue-900">
                            📝 {language === 'ar' ? 'الوصف' : 'Description'}
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Brand & Connector Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
                    >
                      <h3 className="text-lg font-bold text-purple-900 mb-4">🏢 {language === 'ar' ? 'الماركة والموصل' : 'Brand & Connector'}</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-purple-900">
                            🏷️ {language === 'ar' ? 'الماركة' : 'Mark / Brand'}
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={formData.mark_id}
                              onChange={(e) => setFormData({ ...formData, mark_id: e.target.value })}
                              className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                              <option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>
                              {marks.map((mark) => (
                                <option key={mark.id} value={mark.id}>
                                  {mark.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              onClick={() => setShowAddMarkModal(true)}
                              variant="outline"
                              className="px-3 border-purple-300 text-purple-600 hover:bg-purple-100"
                            >
                              ➕
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-purple-900">
                            🔗 {language === 'ar' ? 'نوع الموصل' : 'Connector Type'}
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={formData.connector_type_id}
                              onChange={(e) => setFormData({ ...formData, connector_type_id: e.target.value })}
                              className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                              <option value="">{language === 'ar' ? 'اختر' : 'Select'}</option>
                              {connectorTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              onClick={() => setShowAddConnectorModal(true)}
                              variant="outline"
                              className="px-3 border-purple-300 text-purple-600 hover:bg-purple-100"
                            >
                              ➕
                            </Button>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-semibold mb-2 text-indigo-900">
                            🚚 {language === 'ar' ? 'المورد' : 'Supplier'}
                          </label>
                          <select
                            value={formData.supplier_id}
                            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                            className="w-full px-4 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="">{language === 'ar' ? 'اختر المورد' : 'Select Supplier'}</option>
                            {suppliers.map((supplier) => (
                              <option key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>

                    {/* Electrical Specs Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200"
                    >
                      <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-300 mb-4">⚡ {language === 'ar' ? 'المواصفات الكهربائية' : 'Electrical Specs'}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-300">⚡ {language === 'ar' ? 'الجهد' : 'Voltage'} (V)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.voltage}
                            onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                            className="w-full px-4 py-2 border border-yellow-300 dark:border-yellow-600 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-300">🔌 {language === 'ar' ? 'القدرة' : 'Wattage'} (W)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.wattage}
                            onChange={(e) => setFormData({ ...formData, wattage: e.target.value })}
                            className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-yellow-900">⚙️ {language === 'ar' ? 'التيار' : 'Amperage'} (A)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.amperage}
                            onChange={(e) => setFormData({ ...formData, amperage: e.target.value })}
                            className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-semibold mb-2 text-yellow-900">📱 {language === 'ar' ? 'رقم الموديل' : 'Model Number'}</label>
                        <input
                          type="text"
                          value={formData.model_number}
                          onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                          className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white"
                        />
                      </div>
                    </motion.div>

                    {/* Inventory Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200"
                    >
                      <h3 className="text-lg font-bold text-green-900 mb-4">📊 {language === 'ar' ? 'المخزون' : 'Inventory'}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-green-900">📦 {language === 'ar' ? 'الكمية الأولية' : 'Initial Qty'}</label>
                          <input
                            type="number"
                            value={formData.quantity_initial}
                            onChange={(e) => setFormData({ ...formData, quantity_initial: e.target.value, quantity_actual: e.target.value })}
                            className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-green-900">📊 {language === 'ar' ? 'الكمية الفعلية' : 'Actual Qty'}</label>
                          <input
                            type="number"
                            value={formData.quantity_actual}
                            onChange={(e) => setFormData({ ...formData, quantity_actual: e.target.value })}
                            className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-green-900">⚠️ {language === 'ar' ? 'الحد الأدنى' : 'Minimal Qty'}</label>
                          <input
                            type="number"
                            value={formData.quantity_minimal}
                            onChange={(e) => setFormData({ ...formData, quantity_minimal: e.target.value })}
                            className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                          />
                        </div>
                      </div>
                    </motion.div>

                    {/* Payment & Pricing Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200"
                    >
                      <h3 className="text-lg font-bold text-orange-900 mb-4">💳 {language === 'ar' ? 'السعر والدفع' : 'Payment & Pricing'}</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-orange-900">💵 {language === 'ar' ? 'سعر الشراء' : 'Purchase Price'}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.purchase_price}
                            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                            className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-orange-900">🏷️ {language === 'ar' ? 'سعر البيع' : 'Selling Price'}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.selling_price}
                            onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                            className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="border-2 border-emerald-300 bg-emerald-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'السعر الإجمالي' : 'Total Price'}</p>
                            <p className="text-2xl font-bold text-emerald-600">💵 {totalPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2 text-orange-900">{language === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid'}</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.amount_paid}
                              onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                              className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                            />
                          </div>
                        </div>
                        <div className="text-right border-t border-emerald-300 pt-3">
                          <p className="text-sm text-slate-600 mb-1">{language === 'ar' ? 'المتبقي' : 'Balance Remaining'}</p>
                          <p className={`text-2xl font-bold ${restToPay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            💰 {restToPay.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <Button
                        onClick={handleSavePurchase}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3"
                      >
                        {loading ? getText('loading') : getText('save')}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCreateDialog(false);
                          setStep('search');
                        }}
                        variant="outline"
                        className="flex-1 py-3"
                      >
                        {getText('cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Mark Modal */}
      {showAddMarkModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">{getText('add_new_mark')}</h3>
            <Input
              placeholder={language === 'ar' ? 'اسم العلامة' : 'Mark Name'}
              value={newMarkName}
              onChange={(e) => setNewMarkName(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddMark}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {language === 'ar' ? 'إضافة' : 'Add'}
              </Button>
              <Button
                onClick={() => setShowAddMarkModal(false)}
                variant="outline"
                className="flex-1"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add Connector Type Modal */}
      {showAddConnectorModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">{getText('add_new_connector')}</h3>
            <Input
              placeholder={language === 'ar' ? 'نوع الموصل' : 'Connector Type'}
              value={newConnectorName}
              onChange={(e) => setNewConnectorName(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddConnectorType}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {language === 'ar' ? 'إضافة' : 'Add'}
              </Button>
              <Button
                onClick={() => setShowAddConnectorModal(false)}
                variant="outline"
                className="flex-1"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Invoices List */}
      {/* Recent Invoices Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">📦 {getText('recent_invoices')}</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {getText('showing_invoices').replace('{count}', Math.min(10, invoices.length).toString()).replace('{total}', invoices.length.toString())}
            </p>
          </div>
          <div className="text-5xl opacity-30">📊</div>
        </div>

        {invoices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-2xl text-slate-400">📭 {getText('no_invoices')}</p>
            <p className="text-slate-500 mt-2">{getText('start_creating')}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.slice(0, 10).map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className={`border-2 overflow-hidden hover:shadow-xl transition-all h-full ${
                  invoice.status === 'paid' 
                    ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-900/10 dark:to-green-900/5' 
                    : 'border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-yellow-50/50 dark:from-yellow-900/10 dark:to-yellow-900/5'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{language === 'ar' ? 'فاتورة رقم' : 'Invoice #'}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{invoice.invoice_number}</p>
                      </div>
                      <Badge className={`px-3 py-1 font-bold ${
                        invoice.status === 'paid' 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      }`}>
                        {invoice.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span>📅</span>
                        <span className="text-sm">{new Date(invoice.invoice_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span>🏪</span>
                        <span className="text-sm">{invoice.store_name || 'Unknown Store'}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">{language === 'ar' ? 'المجموع' : 'Total Amount'}</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        💵 {parseFloat(invoice.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {invoices.length > 10 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Button
              variant="outline"
              className="px-6 py-3 font-bold"
              onClick={() => {
                // Can add navigation to full invoices list here
              }}
            >
              📋 {language === 'ar' ? `عرض جميع الفواتير (${invoices.length})` : `View all invoices (${invoices.length})`}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
