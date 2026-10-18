import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
  X,
  Eye,
  LayoutGrid,
  List,
  RefreshCw,
  BatteryCharging,
  Boxes,
  Package,
  Banknote,
  AlertTriangle,
  Zap,
  Plug,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatCard, EmptyState, formatDA, formatCompactDA } from '@/admin/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { uploadImage, uploadImages as uploadImageFiles } from '@/lib/imageUpload';

interface Charger {
  id: string;
  name: string;
  mark?: { name: string; id: string };
  connector_type?: { name: string; id: string };
  mark_id?: string;
  connector_type_id?: string;
  voltage: number;
  wattage: number;
  amperage: number;
  model_number?: string;
  quantity_actual: number;
  quantity_initial?: number;
  quantity_minimal: number;
  purchase_price: number;
  selling_price: number;
  description?: string;
  primary_image?: string;
  margin: number;
}

interface Mark {
  id: string;
  name: string;
}

interface ConnectorType {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

const Inventory = () => {
  const { language } = useLanguage();
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [connectorTypes, setConnectorTypes] = useState<ConnectorType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMark, setFilterMark] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [showAddMarkModal, setShowAddMarkModal] = useState(false);
  const [showAddConnectorModal, setShowAddConnectorModal] = useState(false);
  const [newMarkName, setNewMarkName] = useState('');
  const [newConnectorName, setNewConnectorName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chargerToDelete, setChargerToDelete] = useState<string | null>(null);
  const [newMarkImage, setNewMarkImage] = useState<File | null>(null);
  const [brandImagePreview, setBrandImagePreview] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [showBrandOptionsModal, setShowBrandOptionsModal] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingBrandName, setEditingBrandName] = useState('');
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingChargerId, setEditingChargerId] = useState<string | null>(null);
  const [chargerImages, setChargerImages] = useState<Array<{ id?: string; image_url: string; file_path?: string; display_order?: number; is_primary: boolean }>>([]);
  const [primaryImageId, setPrimaryImageId] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try { return localStorage.getItem('inventory:view') === 'table' ? 'table' : 'grid'; } catch { return 'grid'; }
  });
  const [sortKey, setSortKey] = useState<'name' | 'quantity_actual' | 'purchase_price' | 'selling_price' | 'margin'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { try { localStorage.setItem('inventory:view', viewMode); } catch { /* ignore */ } }, [viewMode]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mark_id: '',
    connector_type_id: '',
    voltage: '',
    wattage: '',
    amperage: '',
    model_number: '',
    purchase_price: '',
    selling_price: '',
    selling_price_1: '',
    selling_price_2: '',
    selling_price_3: '',
    images: [] as File[],
  });

  // Load data
  useEffect(() => {
    loadChargers();
    loadMarks();
    loadConnectorTypes();
    loadSuppliers();
  }, []);

  // Auto-refresh charger data every 30 seconds when detail modal is open
  useEffect(() => {
    if (!selectedCharger) return;

    const interval = setInterval(() => {
      refreshChargerData(selectedCharger.id);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedCharger]);

  const loadChargers = async () => {
    try {
      setLoading(true);
      // OPTIMIZED: Use single query with joins instead of N+1 queries
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          voltage,
          wattage,
          amperage,
          model_number,
          quantity_actual,
          quantity_minimal,
          purchase_price,
          selling_price,
          mark_id,
          connector_type_id,
          primary_image,
          marks(id, name),
          connector_types(id, name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map data directly without additional queries
      const enrichedChargers = (data || []).map((charger: any) => {
        const margin =
          ((charger.selling_price - charger.purchase_price) /
            charger.purchase_price) *
          100;

        return {
          id: charger.id,
          name: charger.name,
          description: charger.description,
          voltage: charger.voltage,
          wattage: charger.wattage,
          amperage: charger.amperage,
          model_number: charger.model_number,
          quantity_actual: charger.quantity_actual,
          quantity_minimal: charger.quantity_minimal,
          purchase_price: charger.purchase_price,
          selling_price: charger.selling_price,
          mark_id: charger.mark_id,
          connector_type_id: charger.connector_type_id,
          primary_image: charger.primary_image,
          mark: charger.marks,
          connector_type: charger.connector_types,
          margin: isNaN(margin) ? 0 : margin,
        };
      });

      setChargers(enrichedChargers);
      
      // If a charger is currently selected, update it with fresh data
      if (selectedCharger) {
        const updatedCharger = enrichedChargers.find(c => c.id === selectedCharger.id);
        if (updatedCharger) {
          setSelectedCharger(updatedCharger);
        }
      }
    } catch (error) {
      console.error('Error loading chargers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarks = async () => {
    try {
      const { data, error } = await supabase
        .from('marks')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMarks(data || []);
    } catch (error) {
      console.error('Error loading marks:', error);
    }
  };

  const loadConnectorTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('connector_types')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setConnectorTypes(data || []);
    } catch (error) {
      console.error('Error loading connector types:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      console.log('Loading suppliers...');
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading suppliers:', error);
        setSuppliers([]);
        return;
      }
      
      console.log('Suppliers loaded:', data);
      setSuppliers(data || []);
    } catch (error) {
      console.error('Exception loading suppliers:', error);
      setSuppliers([]);
    }
  };

  // Refresh a single product (used when viewing details)
  const refreshChargerData = async (chargerId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          voltage,
          wattage,
          amperage,
          model_number,
          quantity_actual,
          quantity_minimal,
          purchase_price,
          selling_price,
          mark_id,
          connector_type_id,
          primary_image,
          marks(id, name),
          connector_types(id, name)
        `)
        .eq('id', chargerId)
        .single();

      if (error) throw error;

      if (data) {
        const margin =
          ((data.selling_price - data.purchase_price) /
            data.purchase_price) *
          100;

        const refreshedCharger: Charger = {
          id: data.id,
          name: data.name,
          description: data.description,
          voltage: data.voltage,
          wattage: data.wattage,
          amperage: data.amperage,
          model_number: data.model_number,
          quantity_actual: data.quantity_actual,
          quantity_minimal: data.quantity_minimal,
          purchase_price: data.purchase_price,
          selling_price: data.selling_price,
          mark_id: data.mark_id,
          connector_type_id: data.connector_type_id,
          primary_image: data.primary_image,
          mark: data.marks ? (Array.isArray(data.marks) ? data.marks[0] : data.marks) : undefined,
          connector_type: data.connector_types ? (Array.isArray(data.connector_types) ? data.connector_types[0] : data.connector_types) : undefined,
          margin: isNaN(margin) ? 0 : margin,
        };

        // Update the selected charger if viewing it
        if (selectedCharger?.id === chargerId) {
          setSelectedCharger(refreshedCharger);
        }

        // Update in the chargers list
        setChargers(prev => prev.map(c => c.id === chargerId ? refreshedCharger : c));
      }
    } catch (error) {
      console.error('Error refreshing charger data:', error);
    }
  };

  const handleAddMark = async () => {
    setNewMarkName('');
    setNewMarkImage(null);
    setBrandImagePreview(null);
    setIsEditingBrand(false);
    setEditingBrandId(null);
    setShowAddMarkModal(true);
  };

  const handleBrandImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewMarkImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBrandImage = () => {
    setNewMarkImage(null);
    setBrandImagePreview(null);
  };

  const handleEditBrand = (brandId: string, brandName: string) => {
    setEditingBrandId(brandId);
    setEditingBrandName(brandName);
    setIsEditingBrand(true);
    setNewMarkName(brandName);
    setNewMarkImage(null);
    
    // Load existing brand image if it has one
    const brand = marks.find(m => m.id === brandId);
    console.log('Loading brand for edit:', { brandId, brandName, brand });
    
    if (brand) {
      const logoUrl = (brand as any).logo_url;
      console.log('Brand logo_url field:', logoUrl);
      
      if (logoUrl && logoUrl.trim() !== '') {
        console.log('Setting brand image preview:', logoUrl);
        // Verify the URL is valid by checking if it's a proper Supabase URL
        if (logoUrl.includes('supabase') || logoUrl.startsWith('http')) {
          setBrandImagePreview(logoUrl);
        } else {
          console.warn('Invalid image URL format:', logoUrl);
          setBrandImagePreview(null);
        }
      } else {
        console.log('No logo_url found for brand');
        setBrandImagePreview(null);
      }
    } else {
      console.warn('Brand not found in marks array');
      setBrandImagePreview(null);
    }
    
    setShowBrandOptionsModal(false);
    setShowAddMarkModal(true);
  };

  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this brand?' : 'Êtes-vous sûr de vouloir supprimer cette marque?')) return;

    try {
      const { error } = await supabase
        .from('marks')
        .delete()
        .eq('id', selectedBrand);

      if (error) throw error;
      toast(language === 'en' ? 'Brand deleted successfully!' : 'Marque supprimée avec succès!');
      setMarks(marks.filter((m) => m.id !== selectedBrand));
      setSelectedBrand('');
      setFormData({ ...formData, mark_id: '' });
      setShowBrandOptionsModal(false);
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast(language === 'en' ? 'Error deleting brand' : 'Erreur lors de la suppression de la marque');
    }
  };

  const handleAddConnectorType = async () => {
    setNewConnectorName('');
    setShowAddConnectorModal(true);
  };

  const handleDeleteConnector = async () => {
    const connectorId = formData.connector_type_id;
    if (!connectorId) return;
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this connector type?' : 'Êtes-vous sûr de vouloir supprimer ce type de connecteur?')) return;

    try {
      const { error } = await supabase
        .from('connector_types')
        .delete()
        .eq('id', connectorId);

      if (error) throw error;
      toast(language === 'en' ? 'Connector type deleted successfully!' : 'Type de connecteur supprimé avec succès!');
      setConnectorTypes(connectorTypes.filter((c) => c.id !== connectorId));
      setFormData({ ...formData, connector_type_id: '' });
    } catch (error) {
      console.error('Error deleting connector type:', error);
      toast(language === 'en' ? 'Error deleting connector type' : 'Erreur lors de la suppression du type de connecteur');
    }
  };

  const handleSaveNewMark = async () => {
    if (!newMarkName.trim()) {
      toast(language === 'en' ? 'Please enter a mark name' : 'Veuillez entrer le nom de la marque');
      return;
    }

    try {
      let logoPath = null;
      let logoUrl = null;

      // Upload image if selected
      if (newMarkImage) {
        const brandId = editingBrandId || 'temp';
        const { publicUrl, path: filePath } = await uploadImage(newMarkImage, { folder: `marks/${brandId}`, preset: 'logo' });

        logoPath = filePath;
        logoUrl = publicUrl;
        
        console.log('Image uploaded successfully:', { logoPath, logoUrl });
      }

      if (isEditingBrand && editingBrandId) {
        // Update existing brand
        const updateData: any = { name: newMarkName };
        if (logoPath) {
          updateData.logo_file_path = logoPath;
          updateData.logo_url = logoUrl;
          updateData.is_logo_uploaded = true;
          updateData.logo_uploaded_at = new Date().toISOString();
        }

        console.log('Updating brand:', { editingBrandId, updateData });

        const { error } = await supabase
          .from('marks')
          .update(updateData)
          .eq('id', editingBrandId);

        if (error) throw error;
        setMarks(marks.map((m) => (m.id === editingBrandId ? { ...m, ...updateData } : m)));
          } else {
        // Create new brand
        const insertData = {
          name: newMarkName,
          is_active: true,
          logo_file_path: logoPath,
          logo_url: logoUrl,
          is_logo_uploaded: !!logoPath,
          logo_uploaded_at: logoPath ? new Date().toISOString() : null,
        };

        console.log('Creating new brand:', insertData);

        const { data, error } = await supabase
          .from('marks')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;
        
        console.log('Brand created successfully:', data);
        setMarks([...marks, data]);
        setFormData({ ...formData, mark_id: data.id });
      }

      setNewMarkName('');
      setNewMarkImage(null);
      setBrandImagePreview(null);
      setIsEditingBrand(false);
      setEditingBrandId(null);
      setShowAddMarkModal(false);
    } catch (error) {
      console.error('Error saving mark:', error);
      toast(language === 'en' ? 'Error saving mark' : 'Erreur lors de l\'enregistrement de la marque');
    }
  };

  const handleSaveNewConnector = async () => {
    if (!newConnectorName.trim()) {
      toast('Please enter a connector type name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('connector_types')
        .insert([{ name: newConnectorName, is_active: true }])
        .select()
        .single();

      if (error) throw error;
      setConnectorTypes([...connectorTypes, data]);
      setFormData({ ...formData, connector_type_id: data.id });
      setNewConnectorName('');
      setShowAddConnectorModal(false);
      toast('Connector type added successfully!');
    } catch (error) {
      console.error('Error adding connector type:', error);
      toast('Error adding connector type');
    }
  };

  const handleDeleteCharger = async (chargerId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', chargerId);
      if (error) {
        // Referenced by sales / invoices / orders (FK 23503) or blocked by RLS: archive instead so history stays intact.
        const { error: archiveError } = await supabase.from('products').update({ is_active: false }).eq('id', chargerId);
        if (archiveError) throw archiveError;
        toast.success(language === 'en' ? 'Product archived (it is used in sales history)' : "Produit archivé (il est utilisé dans l'historique des ventes)");
      } else {
        toast.success(language === 'en' ? 'Product deleted' : 'Produit supprimé');
      }
      setChargers((prev) => prev.filter((c) => c.id !== chargerId));
      setSelectedCharger(null);
      setShowDeleteConfirm(false);
      setChargerToDelete(null);
      loadChargers();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(language === 'en' ? 'Could not delete the product' : 'Suppression impossible', { description: (error as { message?: string })?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        images: Array.from(e.target.files),
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: updatedImages,
    });
  };

  const handleDeleteExistingImage = async (index: number) => {
    const imageToDelete = chargerImages[index];
    if (!imageToDelete) return;

    const confirmMsg = language === 'en' 
      ? 'Are you sure you want to delete this image?' 
      : 'Êtes-vous sûr de vouloir supprimer cette image?';
    if (!window.confirm(confirmMsg)) return;

    setDeletingImageIndex(index);
    try {
      // Delete from storage if file_path exists
      if (imageToDelete.file_path) {
        const { error: storageError } = await supabase.storage
          .from('chargers')
          .remove([imageToDelete.file_path]);
        if (storageError) {
          console.warn('Storage delete warning:', storageError);
        }
      }

      // Delete from product_images table
      if (imageToDelete.id) {
        const { error: dbError } = await supabase
          .from('product_images')
          .delete()
          .eq('id', imageToDelete.id);
        if (dbError) {
          console.error('DB delete error:', dbError);
          throw dbError;
        }
      }

      // Update local state
      const updatedImages = chargerImages.filter((_, i) => i !== index);
      setChargerImages(updatedImages);
      setSelectedImageIndex(null);

      // Adjust primaryImageId
      if (primaryImageId === index) {
        // Deleted the primary image — set new primary to first remaining
        setPrimaryImageId(updatedImages.length > 0 ? 0 : null);
        // Also update the product's primary_image in DB if there are remaining images
        if (editingChargerId && updatedImages.length > 0) {
          await supabase
            .from('products')
            .update({ primary_image: updatedImages[0].image_url })
            .eq('id', editingChargerId);
          // Mark the new first image as primary in product_images
          if (updatedImages[0].id) {
            await supabase
              .from('product_images')
              .update({ is_primary: true })
              .eq('id', updatedImages[0].id);
          }
        } else if (editingChargerId && updatedImages.length === 0) {
          await supabase
            .from('products')
            .update({ primary_image: null })
            .eq('id', editingChargerId);
        }
      } else if (primaryImageId !== null && primaryImageId > index) {
        setPrimaryImageId(primaryImageId - 1);
      }

      console.log('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast(language === 'en' ? 'Error deleting image' : 'Erreur lors de la suppression de l\'image');
    } finally {
      setDeletingImageIndex(null);
    }
  };

  const uploadImages = async (productId: string) => {
    if (formData.images.length === 0) return null;

    let primaryImageUrl: string | null = null;

    try {
      console.log(`Starting image upload for product ${productId}. Total images: ${formData.images.length}`);
      
      const uploaded = await uploadImageFiles(formData.images, { folder: productId, preset: 'product' });
      const userId = (await supabase.auth.getUser()).data?.user?.id;

      for (let i = 0; i < uploaded.length; i++) {
        const isPrimary = i === primaryImageId || (primaryImageId === null && i === 0);
        const publicUrl = uploaded[i].publicUrl;
        const fileName = uploaded[i].path;
        if (isPrimary) primaryImageUrl = publicUrl;

        // 4. Also save to product_images table for record keeping
        const { error: dbError } = await supabase
          .from('product_images')
          .insert([
            {
              product_id: productId,
              image_url: publicUrl,
              file_path: fileName,
              display_order: i,
              is_primary: isPrimary,
              uploaded_by: userId,
            },
          ]);

        if (dbError) {
          console.warn(`Database save warning for image ${i + 1}:`, dbError);
          // Continue anyway - image is in storage
        } else {
          console.log(`Image ${i + 1} saved to product_images table`);
        }
      }
      
      console.log('All images uploaded to bucket!');
      return primaryImageUrl;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  /** Insert/update that drops columns the database does not have (PGRST204) instead of failing. */
  const writeProduct = async (payload: Record<string, unknown>, id?: string) => {
    let body = { ...payload };
    for (let i = 0; i < 6; i++) {
      const res = id
        ? await supabase.from('products').update(body).eq('id', id).select()
        : await supabase.from('products').insert([body]).select().single();
      const missing = res.error?.message?.match(/'([^']+)' column/)?.[1];
      if (res.error && missing && missing in body) {
        delete (body as Record<string, unknown>)[missing];
        continue;
      }
      return res;
    }
    return id
      ? await supabase.from('products').update(body).eq('id', id).select()
      : await supabase.from('products').insert([body]).select().single();
  };

  const handleSaveCharger = async () => {
    if (saving) return;
    if (!formData.name.trim()) {
      toast.error(language === 'en' ? 'Product name is required' : 'Le nom du produit est obligatoire');
      return;
    }
    setSaving(true);
    try {

      // If editing mode, update existing product
      if (isEditingMode && editingChargerId) {
        let primaryImageUrl: string | null = null;

        // Update existing images' primary status if primaryImageId changed
        if (chargerImages.length > 0 && primaryImageId !== null) {
          try {
            console.log(`Updating primary image status for existing images...`);
            // Set all existing images to not primary first
            for (let i = 0; i < chargerImages.length; i++) {
              const { error: updateError } = await supabase
                .from('product_images')
                .update({ is_primary: i === primaryImageId })
                .eq('id', chargerImages[i].id);
              
              if (updateError) {
                console.warn(`Warning updating image ${i}:`, updateError);
              }
            }
            // Set the primary image URL from the selected existing image
            if (primaryImageId < chargerImages.length) {
              primaryImageUrl = chargerImages[primaryImageId].image_url;
              console.log(`Updated primary image to index ${primaryImageId}: ${primaryImageUrl}`);
            }
          } catch (error) {
            console.error('Error updating existing image primary status:', error);
          }
        }

        // Upload new images if any are provided
        if (formData.images.length > 0) {
          try {
            console.log(`Starting to upload ${formData.images.length} new images during edit...`);
            const newPrimaryImageUrl = await uploadImages(editingChargerId);
            if (newPrimaryImageUrl) {
              primaryImageUrl = newPrimaryImageUrl;
            }
            console.log('All new images uploaded successfully!');
          } catch (imageError) {
            console.error('Image upload failed:', imageError);
            toast(`Image upload failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
            return;
          }
        }

        // Update product basic info
        let updateData: any = {
          name: formData.name,
          description: formData.description,
          mark_id: formData.mark_id || null,
          connector_type_id: formData.connector_type_id || null,
          voltage: parseFloat(formData.voltage) || 0,
          wattage: parseFloat(formData.wattage) || 0,
          amperage: parseFloat(formData.amperage) || 0,
          model_number: formData.model_number,
          purchase_price: parseFloat(formData.purchase_price) || 0,
          selling_price: parseFloat(formData.selling_price_1) || 0,
          selling_price_1: parseFloat(formData.selling_price_1) || 0,
          selling_price_2: parseFloat(formData.selling_price_2) || 0,
          selling_price_3: parseFloat(formData.selling_price_3) || 0,
        };

        // If primary image was determined, update it
        if (primaryImageUrl) {
          updateData.primary_image = primaryImageUrl;
        }

        const { error } = await writeProduct(updateData, editingChargerId);

        if (error) throw error;
        toast.success(language === 'en' ? 'Charger updated' : 'Chargeur mis à jour');

        setIsEditingMode(false);
        setEditingChargerId(null);
        setChargerImages([]);
        setPrimaryImageId(null);
        setFormData({
          name: '',
          description: '',
          mark_id: '',
          connector_type_id: '',
          voltage: '',
          wattage: '',
          amperage: '',
          model_number: '',
          purchase_price: '',
          selling_price: '',
          selling_price_1: '',
          selling_price_2: '',
          selling_price_3: '',
          images: [],
        });
        setShowAddModal(false);
        loadChargers();
        return;
      }

      // Otherwise, create new product
      const { data, error } = await writeProduct({
            name: formData.name,
            description: formData.description,
            mark_id: formData.mark_id || null,
            connector_type_id: formData.connector_type_id || null,
            voltage: parseFloat(formData.voltage) || 0,
            wattage: parseFloat(formData.wattage) || 0,
            amperage: parseFloat(formData.amperage) || 0,
            model_number: formData.model_number,
            quantity_initial: 0,
            quantity_actual: 0,
            quantity_minimal: 0,
            purchase_price: parseFloat(formData.purchase_price) || 0,
            selling_price: parseFloat(formData.selling_price_1) || 0,
            selling_price_1: parseFloat(formData.selling_price_1) || 0,
            selling_price_2: parseFloat(formData.selling_price_2) || 0,
            selling_price_3: parseFloat(formData.selling_price_3) || 0,
            is_active: true,
          });

      if (error) throw error;

      console.log('Product created successfully:', data);

      // Upload images if any are provided
      if (formData.images.length > 0) {
        try {
          console.log(`Starting to upload ${formData.images.length} images...`);
          const primaryImageUrl = await uploadImages(data.id);
          console.log('All images uploaded successfully!');

          // Update product with primary image URL
          if (primaryImageUrl) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ primary_image: primaryImageUrl })
              .eq('id', data.id);

            if (updateError) {
              console.error('Failed to update primary image:', updateError);
            } else {
              console.log('Product updated with primary image URL:', primaryImageUrl);
            }
          }
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          // Product was saved, but images failed - show warning
          toast(`Charger saved but image upload failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
          setShowAddModal(false);
          loadChargers();
          return;
        }
      }

      setFormData({
        name: '',
        description: '',
        mark_id: '',
        connector_type_id: '',
        voltage: '',
        wattage: '',
        amperage: '',
        model_number: '',
        purchase_price: '',
        selling_price: '',
        selling_price_1: '',
        selling_price_2: '',
        selling_price_3: '',
        images: [],
      });

      toast.success(language === 'en' ? 'Charger created' : 'Chargeur créé');
      setShowAddModal(false);
      loadChargers();
    } catch (error) {
      console.error('Error saving charger:', error);
      const errorMessage = (error as { message?: string })?.message || 'Unknown error';
      toast.error(language === 'en' ? 'Could not save the charger' : "Impossible d'enregistrer le chargeur", { description: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setIsEditingMode(false);
    setEditingChargerId(null);
    setSelectedImageIndex(null);
    setDeletingImageIndex(null);
    setChargerImages([]);
    setPrimaryImageId(null);
    setFormData({
      name: '', description: '', mark_id: '', connector_type_id: '', voltage: '', wattage: '', amperage: '', model_number: '',
      purchase_price: '', selling_price: '', selling_price_1: '', selling_price_2: '', selling_price_3: '', images: [],
    });
  };

  const openCreate = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openDetails = (charger: Charger) => {
    refreshChargerData(charger.id);
    setSelectedCharger(charger);
    supabase
      .from('product_images')
      .select('id, image_url, file_path, display_order, is_primary')
      .eq('product_id', charger.id)
      .order('display_order', { ascending: true })
      .then(({ data }) => { if (data) setChargerImages(data); });
  };

  const openEdit = async (charger: Charger) => {
    setIsEditingMode(true);
    setEditingChargerId(charger.id);
    setSelectedImageIndex(null);
    setDeletingImageIndex(null);
    setFormData({
      name: charger.name,
      description: charger.description || '',
      mark_id: charger.mark_id || '',
      connector_type_id: charger.connector_type_id || '',
      voltage: String(charger.voltage ?? ''),
      wattage: String(charger.wattage ?? ''),
      amperage: String(charger.amperage ?? ''),
      model_number: charger.model_number || '',
      purchase_price: String(charger.purchase_price ?? ''),
      selling_price: String(charger.selling_price ?? ''),
      selling_price_1: String(charger.selling_price ?? ''),
      selling_price_2: String(charger.selling_price ?? ''),
      selling_price_3: String(charger.selling_price ?? ''),
      images: [],
    });
    setShowAddModal(true);
    const { data: existingImages } = await supabase
      .from('product_images')
      .select('id, image_url, file_path, display_order, is_primary')
      .eq('product_id', charger.id)
      .order('display_order', { ascending: true });
    if (existingImages && existingImages.length > 0) {
      setChargerImages(existingImages);
      const primaryIdx = existingImages.findIndex((img) => img.is_primary);
      setPrimaryImageId(primaryIdx !== -1 ? primaryIdx : 0);
    } else {
      setChargerImages([]);
      setPrimaryImageId(null);
    }
  };

  const askDelete = (charger: Charger) => {
    setChargerToDelete(charger.id);
    setShowDeleteConfirm(true);
  };

  const q = searchTerm.trim().toLowerCase();
  const filteredChargers = chargers
    .filter((charger) => {
      const matchesSearch = !q ||
        (charger.name || '').toLowerCase().includes(q) ||
        (charger.description || '').toLowerCase().includes(q) ||
        (charger.model_number || '').toLowerCase().includes(q) ||
        (charger.mark?.name || '').toLowerCase().includes(q);
      const matchesFilter = !filterMark || charger.mark?.name === filterMark;
      const qty = Number(charger.quantity_actual) || 0;
      const min = Number(charger.quantity_minimal) || 0;
      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'out' && qty <= 0)
        || (stockFilter === 'low' && qty > 0 && qty <= min)
        || (stockFilter === 'ok' && qty > min);
      return matchesSearch && matchesFilter && matchesStock;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '') * dir;
      return ((Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0)) * dir;
    });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc'); }
  };

  const lowStockChargers = chargers.filter((c) => (Number(c.quantity_actual) || 0) > 0 && c.quantity_actual <= c.quantity_minimal).length;
  const outOfStockChargers = chargers.filter((c) => (Number(c.quantity_actual) || 0) <= 0).length;
  const totalUnits = chargers.reduce((s, c) => s + (Number(c.quantity_actual) || 0), 0);
  const stockValue = chargers.reduce((s, c) => s + (Number(c.quantity_actual) || 0) * (Number(c.purchase_price) || 0), 0);
  const stockStatus = (c: Charger) => {
    const qty = Number(c.quantity_actual) || 0;
    if (qty <= 0) return { label: language === 'en' ? 'Out of stock' : 'Rupture', cls: 'bg-destructive/10 text-destructive', text: 'text-destructive', dot: 'bg-destructive' };
    if (qty <= (Number(c.quantity_minimal) || 0)) return { label: language === 'en' ? 'Low stock' : 'Stock faible', cls: 'bg-warning/15 text-warning', text: 'text-warning', dot: 'bg-warning' };
    return { label: language === 'en' ? 'In stock' : 'En stock', cls: 'bg-success/15 text-success', text: 'text-success', dot: 'bg-success' };
  };
  const SortIcon = ({ k }: { k: typeof sortKey }) => (sortKey === k ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />);

  const renderActions = (charger: Charger, compact?: boolean) => (
    <div className={compact ? 'flex items-center justify-end gap-1' : 'grid grid-cols-3 gap-1.5'}>
      <button type="button" onClick={() => openDetails(charger)} title={language === 'en' ? 'View details' : 'Voir les détails'}
        className={compact ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground' : 'inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-surface-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground'}>
        <Eye className="h-4 w-4" />{!compact && (language === 'en' ? 'View' : 'Voir')}
      </button>
      <button type="button" onClick={() => openEdit(charger)} title={language === 'en' ? 'Edit' : 'Modifier'}
        className={compact ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-electric/10 hover:text-electric' : 'inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-electric/10 text-xs font-semibold text-electric transition-colors hover:bg-electric hover:text-white'}>
        <Edit2 className="h-4 w-4" />{!compact && (language === 'en' ? 'Edit' : 'Modifier')}
      </button>
      <button type="button" onClick={() => askDelete(charger)} title={language === 'en' ? 'Delete' : 'Supprimer'}
        className={compact ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive' : 'inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-destructive/10 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white'}>
        <Trash2 className="h-4 w-4" />{!compact && (language === 'en' ? 'Delete' : 'Suppr.')}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero header — same ink panel as the login screen */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-[#0B1220] p-6 text-white shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#C6F432]/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-[#9AA3B5]">
              <BatteryCharging className="h-4 w-4 text-[#C6F432]" /> Catalogue
            </span>
            <h1 className="mt-3 font-sora text-2xl font-bold tracking-tight md:text-[30px]">
              {language === 'en' ? 'Charger Inventory' : 'Gestion du Stock Chargeurs'}
            </h1>
            <p className="mt-1 text-sm text-[#9AA3B5]">
              {language === 'en'
                ? `${chargers.length} products • ${lowStockChargers + outOfStockChargers} stock alerts`
                : `${chargers.length} produits • ${lowStockChargers + outOfStockChargers} alertes de stock`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadChargers}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {language === 'en' ? 'Refresh' : 'Actualiser'}
            </button>
            <button type="button" onClick={openCreate}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#C6F432] px-5 text-sm font-bold text-[#0B1220] transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-4 w-4" /> {language === 'en' ? 'New charger' : 'Nouveau chargeur'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={language === 'en' ? 'Products' : 'Produits'} value={chargers.length} icon={Boxes} loading={loading && !chargers.length} />
        <StatCard label={language === 'en' ? 'Units in stock' : 'Unités en stock'} value={totalUnits.toLocaleString('fr-FR')} icon={Package} loading={loading && !chargers.length} />
        <StatCard label={language === 'en' ? 'Stock value (cost)' : 'Valeur du stock (achat)'} value={formatCompactDA(stockValue)} icon={Banknote} loading={loading && !chargers.length} />
        <StatCard label={language === 'en' ? 'Alerts' : 'Alertes'} value={<span className={lowStockChargers + outOfStockChargers ? 'text-destructive' : ''}>{lowStockChargers + outOfStockChargers}</span>}
          hint={`${outOfStockChargers} ${language === 'en' ? 'out' : 'rupture'} · ${lowStockChargers} ${language === 'en' ? 'low' : 'faible'}`} icon={AlertTriangle} loading={loading && !chargers.length} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'en' ? 'Search by name, brand, model…' : 'Rechercher par nom, marque, modèle…'}
            className="h-10 w-full rounded-[10px] border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/30" />
          {searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <select value={filterMark} onChange={(e) => setFilterMark(e.target.value)}
          className="h-10 rounded-[10px] border border-border bg-background px-3 text-sm text-foreground focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/30 lg:w-48">
          <option value="">{language === 'en' ? 'All brands' : 'Toutes les marques'}</option>
          {marks.map((mark) => <option key={mark.id} value={mark.name}>{mark.name}</option>)}
        </select>
        <div className="flex flex-wrap gap-1 rounded-[12px] border border-border bg-background p-1">
          {([
            ['all', language === 'en' ? 'All' : 'Tous'],
            ['ok', language === 'en' ? 'In stock' : 'En stock'],
            ['low', language === 'en' ? 'Low' : 'Faible'],
            ['out', language === 'en' ? 'Out' : 'Rupture'],
          ] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setStockFilter(k)}
              className={`h-8 rounded-[8px] px-3 text-xs font-semibold transition-colors ${stockFilter === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'}`}>{label}</button>
          ))}
        </div>
        <div className="flex gap-1 rounded-[12px] border border-border bg-background p-1" role="tablist" aria-label="Affichage">
          <button type="button" role="tab" onClick={() => setViewMode('grid')} aria-selected={viewMode === 'grid'}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-xs font-semibold ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-2'}`}><LayoutGrid className="h-4 w-4" />{language === 'en' ? 'Cards' : 'Cartes'}</button>
          <button type="button" role="tab" onClick={() => setViewMode('table')} aria-selected={viewMode === 'table'}
            className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-xs font-semibold ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-2'}`}><List className="h-4 w-4" />{language === 'en' ? 'Table' : 'Tableau'}</button>
        </div>
      </div>

      {loading && chargers.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : filteredChargers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card">
          <EmptyState icon={BatteryCharging} title={language === 'en' ? 'No chargers found' : 'Aucun chargeur trouvé'}
            text={language === 'en' ? 'Change the filters or add a new charger.' : 'Modifiez les filtres ou ajoutez un nouveau chargeur.'}
            action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> {language === 'en' ? 'New charger' : 'Nouveau chargeur'}</Button>} />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredChargers.map((charger) => {
            const st = stockStatus(charger);
            const margin = Number(charger.margin) || 0;
            const min = Number(charger.quantity_minimal) || 0;
            const qty = Number(charger.quantity_actual) || 0;
            const fill = Math.min(100, min > 0 ? (qty / (min * 3)) * 100 : qty > 0 ? 100 : 0);
            return (
              <motion.div key={charger.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <button type="button" onClick={() => openDetails(charger)} className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
                  {charger.primary_image ? (
                    <img src={charger.primary_image} alt={charger.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <BatteryCharging className="h-10 w-10" /><span className="text-xs">{language === 'en' ? 'No image' : "Pas d'image"}</span>
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur ${st.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}
                  </span>
                  {charger.mark && <span className="absolute right-3 top-3 rounded-full bg-[#0B1220]/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{charger.mark.name}</span>}
                </button>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-tight text-foreground">{charger.name}</h3>
                  {charger.model_number && <p className="mt-0.5 truncate text-xs text-muted-foreground">{charger.model_number}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {([['V', charger.voltage], ['W', charger.wattage], ['A', charger.amperage]] as const).map(([u, v]) => (
                      <span key={u} className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold tabular-nums text-foreground"><Zap className="h-3 w-3 text-electric" />{v || 0}{u}</span>
                    ))}
                    {charger.connector_type && <span className="inline-flex items-center gap-1 rounded-md bg-electric/10 px-2 py-1 text-xs font-semibold text-electric"><Plug className="h-3 w-3" />{charger.connector_type.name}</span>}
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{language === 'en' ? 'Price' : 'Prix de vente'}</p>
                        <p className="font-sora text-xl font-bold tabular-nums text-foreground">{formatDA(charger.selling_price)}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">{language === 'en' ? 'Cost' : 'Achat'} {formatDA(charger.purchase_price)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${margin >= 0 ? 'bg-volt text-volt-foreground' : 'bg-destructive/10 text-destructive'}`}>{margin >= 0 ? '+' : ''}{margin.toFixed(0)}%</span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Stock</span>
                        <span className="font-semibold tabular-nums">{qty} <span className="font-normal text-muted-foreground">/ min {min}</span></span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${st.dot}`} style={{ width: `${fill}%` }} /></div>
                    </div>
                    <div className="mt-4 border-t border-border pt-3">{renderActions(charger)}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3"><button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 hover:text-foreground">{language === 'en' ? 'Product' : 'Produit'}<SortIcon k="name" /></button></th>
                  <th className="px-4 py-3">{language === 'en' ? 'Brand' : 'Marque'}</th>
                  <th className="px-4 py-3">{language === 'en' ? 'Specs' : 'Caractéristiques'}</th>
                  <th className="px-4 py-3 text-right"><button type="button" onClick={() => toggleSort('quantity_actual')} className="inline-flex items-center gap-1 hover:text-foreground">Stock<SortIcon k="quantity_actual" /></button></th>
                  <th className="px-4 py-3 text-right"><button type="button" onClick={() => toggleSort('purchase_price')} className="inline-flex items-center gap-1 hover:text-foreground">{language === 'en' ? 'Cost' : 'Achat'}<SortIcon k="purchase_price" /></button></th>
                  <th className="px-4 py-3 text-right"><button type="button" onClick={() => toggleSort('selling_price')} className="inline-flex items-center gap-1 hover:text-foreground">{language === 'en' ? 'Price' : 'Vente'}<SortIcon k="selling_price" /></button></th>
                  <th className="px-4 py-3 text-right"><button type="button" onClick={() => toggleSort('margin')} className="inline-flex items-center gap-1 hover:text-foreground">Marge<SortIcon k="margin" /></button></th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredChargers.map((charger) => {
                  const st = stockStatus(charger);
                  const margin = Number(charger.margin) || 0;
                  return (
                    <tr key={charger.id} className="transition-colors hover:bg-surface-2/60">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => openDetails(charger)} className="flex items-center gap-3 text-left">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-2">
                            {charger.primary_image ? <img src={charger.primary_image} alt="" loading="lazy" className="h-full w-full object-cover" /> : <BatteryCharging className="h-5 w-5 text-muted-foreground" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[260px] truncate font-semibold text-foreground">{charger.name}</span>
                            {charger.model_number && <span className="block truncate text-xs text-muted-foreground">{charger.model_number}</span>}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">{charger.mark ? <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold">{charger.mark.name}</span> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-muted-foreground">{charger.voltage || 0}V · {charger.wattage || 0}W · {charger.amperage || 0}A{charger.connector_type ? ` · ${charger.connector_type.name}` : ''}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{charger.quantity_actual ?? 0}<span className="font-normal text-muted-foreground"> / {charger.quantity_minimal ?? 0}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-muted-foreground">{formatDA(charger.purchase_price)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{formatDA(charger.selling_price)}</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${margin >= 0 ? 'text-success' : 'text-destructive'}`}>{margin.toFixed(0)}%</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</span></td>
                      <td className="px-4 py-3">{renderActions(charger, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{filteredChargers.length} / {chargers.length} {language === 'en' ? 'products' : 'produits'}</div>
        </div>
      )}

      {/* Add Charger Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-sm"
          >
            <div className="sticky top-0 p-6 border-b border-border flex justify-between items-center bg-card">
              <h2 className="font-sora text-2xl font-bold text-foreground">
                {isEditingMode 
                  ? (language === 'en' ? 'Edit Charger' : 'Modifier Chargeur')
                  : (language === 'en' ? 'Add New Charger' : 'Ajouter Nouveau Chargeur')}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditingMode(false);
                  setEditingChargerId(null);
                  setSelectedImageIndex(null);
                  setDeletingImageIndex(null);
                  setChargerImages([]);
                  setPrimaryImageId(null);
                  setFormData({
                    name: '',
                    description: '',
                    mark_id: '',
                    connector_type_id: '',
                    voltage: '',
                    wattage: '',
                    amperage: '',
                    model_number: '',
                    purchase_price: '',
                    selling_price: '',
                    selling_price_1: '',
                    selling_price_2: '',
                    selling_price_3: '',
                    images: [] as File[],
                  });
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Images Upload Section - FIRST */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <h3 className="text-lg font-bold text-electric mb-4">{language === 'en' ? 'Product Images' : 'Images du Produit'}</h3>
                
                {/* Existing Images Gallery (when editing) */}
                {isEditingMode && editingChargerId && chargerImages.length > 0 && (
                  <div className="mb-4 p-4 bg-card rounded-lg border border-border">
                    <p className="text-xs font-semibold text-electric mb-3">{language === 'en' ? 'Existing Images - Click to select, then delete or set primary' : 'Images Existantes - Cliquez pour sélectionner, puis supprimer ou définir comme principale'} ({chargerImages.length})</p>
                    <div className="grid grid-cols-3 gap-3">
                      {chargerImages.map((imageObj, index) => {
                        const isPrimary = index === primaryImageId || (primaryImageId === null && index === 0);
                        const isSelected = selectedImageIndex === index;
                        const isDeleting = deletingImageIndex === index;
                        
                        return (
                          <div
                            key={imageObj.id || index}
                            className={`relative rounded-lg overflow-hidden shadow-sm transition-all duration-200 cursor-pointer ${
                              isSelected 
                                ? 'ring-4 ring-ring ring-offset-2 scale-105 shadow-sm' 
                                : isPrimary 
                                  ? 'ring-4 ring-ring shadow-sm' 
                                  : 'ring-2 ring-ring hover:ring-ring hover:shadow-md hover:scale-[1.03]'
                            } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                            onClick={() => {
                              setSelectedImageIndex(isSelected ? null : index);
                            }}
                          >
                            {/* Primary badge */}
                            {isPrimary && (
                              <div className="absolute top-2 left-2 bg-warning text-black px-2 py-0.5 rounded-full text-[10px] font-bold z-20 shadow-sm">
                                PRIMARY
                              </div>
                            )}

                            {/* Image */}
                            <img
                              src={imageObj.image_url}
                              alt={`Image ${index + 1}`}
                              className="w-full h-28 object-cover transition-transform duration-300"
                            />

                            {/* Selected overlay with action buttons */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 z-10 animate-in fade-in duration-200">
                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExistingImage(index);
                                  }}
                                  className="bg-destructive hover:bg-destructive/90 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95"
                                  title={language === 'en' ? 'Delete this image' : 'Supprimer cette image'}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                                {/* Set as primary button (only if not already primary) */}
                                {!isPrimary && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPrimaryImageId(index);
                                      setSelectedImageIndex(null);
                                    }}
                                    className="bg-warning hover:bg-warning/90 text-black rounded-full px-3 py-1.5 flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95 text-xs font-bold"
                                    title={language === 'en' ? 'Set as primary' : 'Définir comme principale'}
                                  >
                                    {language === 'en' ? 'Primary' : 'Principale'}
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Deleting spinner */}
                            {isDeleting && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Upload Section */}
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-card mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    id="imageInput"
                    className="hidden"
                  />
                  <label htmlFor="imageInput" className="cursor-pointer block">
                    <ImageIcon className="w-12 h-12 text-electric mx-auto mb-3" />
                    <p className="text-electric font-semibold">
                      {formData.images.length > 0
                        ? `${formData.images.length} ${language === 'en' ? 'new image(s) selected' : 'nouvelle(s) image(s) sélectionnée(s)'}`
                        : language === 'en'
                        ? 'Click to select images'
                        : 'Cliquez pour sélectionner des images'}
                    </p>
                    <p className="text-xs text-electric mt-2">
                      {isEditingMode ? (language === 'en' ? 'Add more images to existing ones' : 'Ajoutez plus d\'images aux existantes') : (language === 'en' ? 'Select one or more images' : 'Sélectionnez une ou plusieurs images')}
                    </p>
                  </label>
                </div>

                {/* Image Preview Section */}
                {formData.images.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-electric mb-3">{language === 'en' ? 'New Images - Select which one is primary' : 'Nouvelles Images - Sélectionnez laquelle est principale'}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {formData.images.map((image, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPrimaryImageId(index)}
                          className="relative group rounded-lg overflow-hidden border-4 transition-all hover:shadow-md hover:scale-105 cursor-pointer"
                          style={{borderColor: index === primaryImageId || (primaryImageId === null && index === 0) ? '#06b6d4' : '#cbd5e1'}}
                          title={language === 'en' ? 'Click to set as primary image' : 'Cliquez pour définir comme image principale'}
                        >
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover transition-transform duration-300"
                          />
                          {(index === primaryImageId || (primaryImageId === null && index === 0)) && (
                            <>
                              <div className="absolute inset-0 bg-primary bg-opacity-20 border-2 border-border rounded-lg flex items-center justify-center">
                                <div className="text-4xl"></div>
                              </div>
                              <div className="absolute top-2 right-2 bg-warning text-black px-2 py-1 rounded text-xs font-bold z-10">PRIMARY</div>
                            </>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                              className="bg-destructive hover:bg-destructive/90 text-white text-xl rounded-full w-10 h-10 flex items-center justify-center transition-colors font-bold"
                              title={language === 'en' ? 'Delete image' : 'Supprimer image'}
                            >
                              
                            </button>
                          </div>
                          <p className="absolute inset-0 text-xs text-white/80 flex items-start justify-start p-2 rounded-lg pointer-events-none truncate bg-card">{image.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Product Info Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <h3 className="text-lg font-bold text-electric mb-4">{language === 'en' ? 'Product Information' : 'Informations du Produit'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-electric">
                      {language === 'en' ? 'Product Name' : 'Nom du Produit'} *
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'e.g., USB-C Charger' : 'Ex: Chargeur USB-C'}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-card text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-electric">
                      {language === 'en' ? 'Description' : 'Description'}
                    </label>
                    <textarea
                      placeholder={language === 'en' ? 'Optional details about the charger...' : 'Détails optionnels...'}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-card text-foreground"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Mark & Connector Section - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <h3 className="text-lg font-bold text-electric mb-5">{language === 'en' ? 'Brand & Connector' : 'Marque & Connecteur'}</h3>
                
                {/* Streamlined Grid: 1 column on mobile, 2 columns on tablet+ */}
                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  
                  {/* Brand / Mark Field */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-electric">
                      {language === 'en' ? 'Mark / Brand' : 'Marque'} *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.mark_id}
                        onChange={(e) => {
                          setFormData({ ...formData, mark_id: e.target.value });
                          setSelectedBrand(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card text-sm text-foreground"
                      >
                        <option value="">{language === 'en' ? 'Select Mark' : 'Sélectionnez Marque'}</option>
                        {marks.map((mark) => (
                          <option key={mark.id} value={mark.id}>
                            {mark.name}
                          </option>
                        ))}
                      </select>
                      {formData.mark_id && (
                        <>
                          <Button
                            onClick={() => {
                              const brand = marks.find((m) => m.id === formData.mark_id);
                              if (brand) handleEditBrand(brand.id, brand.name);
                            }}
                            variant="outline"
                            className="px-2.5 py-2 border-border text-electric hover:bg-surface-2 flex-shrink-0"
                            title={language === 'en' ? 'Edit brand' : 'Modifier la marque'}
                          >
                            
                          </Button>
                          <Button
                            onClick={handleDeleteBrand}
                            variant="outline"
                            className="px-2.5 py-2 border-border text-destructive hover:bg-surface-2 flex-shrink-0"
                            title={language === 'en' ? 'Delete brand' : 'Supprimer la marque'}
                          >
                            
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={handleAddMark}
                        variant="outline"
                        className="px-2.5 py-2 border-border text-electric hover:bg-surface-2 flex-shrink-0"
                        title={language === 'en' ? 'Add new brand' : 'Ajouter nouvelle marque'}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Connector Type Field */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-electric">
                      {language === 'en' ? 'Connector Type' : 'Type de Connecteur'} *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.connector_type_id}
                        onChange={(e) =>
                          setFormData({ ...formData, connector_type_id: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card text-sm text-foreground"
                      >
                        <option value="">{language === 'en' ? 'Select Type' : 'Sélectionnez Type'}</option>
                        {connectorTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      {formData.connector_type_id && (
                        <>
                          <Button
                            onClick={() => setFormData({ ...formData, connector_type_id: '' })}
                            variant="outline"
                            className="px-2.5 py-2 border-border text-electric hover:bg-surface-2 flex-shrink-0"
                            title={language === 'en' ? 'Clear selection' : 'Effacer la sélection'}
                          >
                            
                          </Button>
                          <Button
                            onClick={handleDeleteConnector}
                            variant="outline"
                            className="px-2.5 py-2 border-border text-destructive hover:bg-surface-2 flex-shrink-0"
                            title={language === 'en' ? 'Delete connector type' : 'Supprimer le type de connecteur'}
                          >
                            
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={handleAddConnectorType}
                        variant="outline"
                        className="px-2.5 py-2 border-border text-electric hover:bg-surface-2 flex-shrink-0"
                        title={language === 'en' ? 'Add new connector' : 'Ajouter nouveau connecteur'}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Electrical Specs Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <h3 className="text-lg font-bold text-warning mb-4">{language === 'en' ? 'Electrical Specs' : 'Spécifications Électriques'}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-warning">Voltage</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="5V"
                      value={formData.voltage}
                      onChange={(e) =>
                        setFormData({ ...formData, voltage: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-warning">Wattage</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="20W"
                      value={formData.wattage}
                      onChange={(e) =>
                        setFormData({ ...formData, wattage: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-warning">Amperage</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="4A"
                      value={formData.amperage}
                      onChange={(e) =>
                        setFormData({ ...formData, amperage: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card text-foreground"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2 text-warning">{language === 'en' ? 'Model Number' : 'Numéro de Modèle'}</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.model_number}
                    onChange={(e) =>
                      setFormData({ ...formData, model_number: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card text-foreground"
                  />
                </div>
              </motion.div>

              {/* Pricing Section - Only Selling Prices */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <h3 className="text-lg font-bold text-destructive mb-4">{language === 'en' ? 'Selling Prices' : 'Prix de Vente'}</h3>
                <p className="text-sm text-destructive mb-4">{language === 'en' ? 'Set different prices for different customer types' : 'Définissez des prix différents pour les différents types de clients'}</p>
                
                {/* Selling Prices - Three Tier System */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Price 1 - Normal */}
                  <div className="p-3 bg-surface-2 border border-border rounded-lg">
                    <label className="block text-xs font-semibold mb-2 text-electric">{language === 'en' ? 'Normal Price' : 'Prix Normal'} *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.selling_price_1}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          selling_price_1: e.target.value,
                          selling_price: e.target.value // Keep in sync for backward compatibility
                        })
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card font-bold text-sm text-foreground"
                    />
                  </div>

                  {/* Price 2 - Revendeur (Reseller) */}
                  <div className="p-3 bg-surface-2 border border-border rounded-lg">
                    <label className="block text-xs font-semibold mb-2 text-warning">{language === 'en' ? 'Revendeur Price' : 'Prix Revendeur'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.selling_price_2}
                      onChange={(e) =>
                        setFormData({ ...formData, selling_price_2: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card font-bold text-sm text-foreground"
                    />
                  </div>

                  {/* Price 3 - Wholesale */}
                  <div className="p-3 bg-surface-2 border border-border rounded-lg">
                    <label className="block text-xs font-semibold mb-2 text-success">{language === 'en' ? 'Wholesale Price' : 'Prix Gros'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.selling_price_3}
                      onChange={(e) =>
                        setFormData({ ...formData, selling_price_3: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring bg-card font-bold text-sm text-foreground"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={handleSaveCharger}
                  disabled={saving}
                  className="flex-1 text-primary-foreground rounded-[10px] h-12 font-bold text-base bg-primary"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditingMode 
                    ? (language === 'en' ? 'Update' : 'Mettre à Jour')
                    : (language === 'en' ? 'Save Charger' : 'Enregistrer')}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditingMode(false);
                    setFormData({
                      name: '',
                      description: '',
                      mark_id: '',
                      connector_type_id: '',
                      voltage: '',
                      wattage: '',
                      amperage: '',
                      model_number: '',
                      purchase_price: '',
                      selling_price: '',
                      selling_price_1: '',
                      selling_price_2: '',
                      selling_price_3: '',
                      images: [],
                    });
                  }}
                  variant="outline"
                  className="flex-1 rounded-lg h-12 font-bold text-base"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCharger && (
        <div className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-sm"
          >
            {/* Header */}
            <div className="sticky top-0 p-6 border-b border-border flex justify-between items-center bg-card">
              <h2 className="font-sora text-2xl font-bold text-foreground">
                {selectedCharger.name}
              </h2>
              <button
                onClick={() => setSelectedCharger(null)}
                className="text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-lg p-2 transition"
              >
                
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Image Gallery Section */}
              {(selectedCharger.primary_image || chargerImages.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <h3 className="text-lg font-bold text-electric mb-4">{language === 'en' ? 'Product Images' : 'Images du Produit'} ({chargerImages.length})</h3>
                  {chargerImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {chargerImages.map((imageObj, index) => {
                        // Handle both string URLs and objects
                        const imageUrl = typeof imageObj === 'string' ? imageObj : imageObj.image_url;
                        const isPrimary = typeof imageObj === 'object' ? imageObj.is_primary : false;
                        
                        return (
                          <div key={index} className="rounded-lg overflow-hidden border-4 shadow-sm relative" style={{borderColor: isPrimary ? '#06b6d4' : '#cbd5e1'}}>
                            {isPrimary && <div className="absolute top-2 right-2 bg-warning text-black px-2 py-1 rounded text-xs font-bold z-10">PRIMARY</div>}
                            <img
                              src={imageUrl}
                              alt={`${selectedCharger.name} - Image ${index + 1}`}
                              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                console.warn(`Failed to load image: ${imageUrl}`);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : selectedCharger.primary_image ? (
                    <img
                      src={selectedCharger.primary_image}
                      alt={selectedCharger.name}
                      className="w-full h-80 object-cover rounded-lg border-2 border-border"
                      onError={(e) => {
                        console.warn(`Failed to load image: ${selectedCharger.primary_image}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                </motion.div>
              )}

              {/* Basic Info Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <h3 className="text-lg font-bold text-electric mb-4">{language === 'en' ? 'Product Information' : 'Informations du Produit'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-card rounded-lg">
                    <label className="block text-xs font-semibold text-electric mb-1">{language === 'en' ? 'Product Name' : 'Nom du Produit'}</label>
                    <p className="text-electric font-semibold">{selectedCharger.name}</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg">
                    <label className="block text-xs font-semibold text-electric mb-1">{language === 'en' ? 'Brand' : 'Marque'}</label>
                    <p className="text-electric font-semibold">{selectedCharger.mark?.name || '-'}</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg">
                    <label className="block text-xs font-semibold text-electric mb-1">{language === 'en' ? 'Connector Type' : 'Type de Connecteur'}</label>
                    <p className="text-electric font-semibold">{selectedCharger.connector_type?.name || '-'}</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg">
                    <label className="block text-xs font-semibold text-electric mb-1">{language === 'en' ? 'Model Number' : 'Numéro de Modèle'}</label>
                    <p className="text-electric font-semibold">{selectedCharger.model_number || '-'}</p>
                  </div>
                </div>

                {selectedCharger.description && (
                  <div className="mt-4 p-3 bg-card rounded-lg">
                    <label className="block text-xs font-semibold text-electric mb-1">{language === 'en' ? 'Description' : 'Description'}</label>
                    <p className="text-electric">{selectedCharger.description}</p>
                  </div>
                )}
              </motion.div>

              {/* Technical Specs Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <h3 className="text-lg font-bold text-electric mb-4">{language === 'en' ? 'Technical Specifications' : 'Spécifications Techniques'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-electric">Voltage</p>
                    <p className="text-lg font-bold text-electric">{selectedCharger.voltage}V</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-electric">Wattage</p>
                    <p className="text-lg font-bold text-electric">{selectedCharger.wattage}W</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-electric">Amperage</p>
                    <p className="text-lg font-bold text-electric">{selectedCharger.amperage}A</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-electric">Margin</p>
                    <p className="text-lg font-bold text-electric">{selectedCharger.margin.toFixed(1)}%</p>
                  </div>
                </div>
              </motion.div>

              {/* Stock & Pricing Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <h3 className="text-lg font-bold text-success mb-4">{language === 'en' ? 'Stock & Pricing' : 'Stock & Tarification'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-success">{language === 'en' ? 'Initial Stock' : 'Stock Initial'}</p>
                    <p className="text-lg font-bold text-success">{selectedCharger.quantity_initial || selectedCharger.quantity_actual}</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-success">{language === 'en' ? 'Current Stock' : 'Stock Actuel'}</p>
                    <p className="text-lg font-bold text-success">{selectedCharger.quantity_actual}</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-success">{language === 'en' ? 'Min Stock' : 'Stock Min'}</p>
                    <p className="text-lg font-bold text-success">{selectedCharger.quantity_minimal}</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-success">{language === 'en' ? 'Buy Price' : 'Prix Achat'}</p>
                    <p className="text-lg font-bold text-success">{selectedCharger.purchase_price.toFixed(0)} DA</p>
                  </div>

                  <div className="p-3 bg-card rounded-lg text-center">
                    <p className="text-xs font-semibold text-success">{language === 'en' ? 'Sell Price' : 'Prix Vente'}</p>
                    <p className="text-lg font-bold text-success">{selectedCharger.selling_price.toFixed(0)} DA</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={async () => {
                    setIsEditingMode(true);
                    setEditingChargerId(selectedCharger.id);
                    setFormData({
                      name: selectedCharger.name,
                      description: selectedCharger.description || '',
                      mark_id: selectedCharger.mark?.id || selectedCharger.mark_id || '',
                      connector_type_id: selectedCharger.connector_type?.id || selectedCharger.connector_type_id || '',
                      voltage: selectedCharger.voltage.toString(),
                      wattage: selectedCharger.wattage.toString(),
                      amperage: selectedCharger.amperage.toString(),
                      model_number: selectedCharger.model_number || '',
                      purchase_price: selectedCharger.purchase_price.toString(),
                      selling_price: selectedCharger.selling_price.toString(),
                      selling_price_1: selectedCharger.selling_price.toString(),
                      selling_price_2: '0',
                      selling_price_3: '0',
                      images: [],
                    });
                    // Load existing images for this product
                    const { data: existingImages } = await supabase
                      .from('product_images')
                      .select('id, image_url, file_path, display_order, is_primary')
                      .eq('product_id', selectedCharger.id)
                      .order('display_order', { ascending: true });
                    if (existingImages && existingImages.length > 0) {
                      setChargerImages(existingImages);
                      // Find and set the primary image ID
                      const primaryIdx = existingImages.findIndex(img => img.is_primary);
                      if (primaryIdx !== -1) {
                        setPrimaryImageId(primaryIdx);
                      } else {
                        setPrimaryImageId(0);
                      }
                    } else {
                      setChargerImages([]);
                      setPrimaryImageId(null);
                    }
                    setSelectedCharger(null);
                    setShowAddModal(true);
                  }}
                  className="flex-1 bg-success hover:bg-success/90 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-base"
                >
                  <Edit2 className="w-5 h-5" />
                  {language === 'en' ? 'Edit' : 'Modifier'}
                </button>
                <button
                  onClick={() => setSelectedCharger(null)}
                  className="flex-1 bg-muted-foreground hover:bg-muted-foreground text-white py-3 px-4 rounded-lg font-bold transition-colors"
                >
                  {language === 'en' ? 'Close' : 'Fermer'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Mark Modal */}
      {showAddMarkModal && (
        <div className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-2xl max-w-lg w-full shadow-sm max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-border rounded-t-2xl sticky top-0 z-10 bg-primary text-primary-foreground">
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                {language === 'en' ? (isEditingBrand ? 'Edit Brand' : 'Add New Brand') : (isEditingBrand ? 'Modifier Marque' : 'Ajouter Nouvelle Marque')}
              </h2>
              <p className="text-primary-foreground text-sm mt-2">
                {language === 'en' ? 'Create or edit a charger brand with logo' : 'Créez ou modifiez une marque avec logo'}
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-bold mb-3 text-foreground flex items-center gap-2">
                  <span className="text-lg"></span>
                  {language === 'en' ? 'Brand Name' : 'Nom de la Marque'} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g., Apple, Samsung...' : 'Ex: Apple, Samsung...'}
                  value={newMarkName}
                  onChange={(e) => setNewMarkName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveNewMark()}
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-electric bg-card font-semibold text-foreground transition-all"
                  autoFocus
                />
              </div>

              {/* Brand Logo Upload */}
              <div>
                <label className="block text-sm font-bold mb-3 text-foreground flex items-center gap-2">
                  <span className="text-lg"></span>
                  {language === 'en' ? 'Brand Logo' : 'Logo de la Marque'} <span className="text-muted-foreground">({language === 'en' ? 'Optional' : 'Optionnel'})</span>
                </label>
                
                {!brandImagePreview ? (
                  <div 
                    className="border-3 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group bg-card"
                    onClick={() => document.getElementById('brandImageInput')?.click()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBrandImageSelect}
                      className="hidden"
                      id="brandImageInput"
                    />
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform"></div>
                    <p className="text-electric font-bold text-lg">
                      {language === 'en' ? 'Click to upload logo' : 'Cliquez pour télécharger le logo'}
                    </p>
                    <p className="text-xs text-electric mt-2 font-medium">PNG, JPG, WebP (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-border rounded-xl p-6 flex items-center justify-center min-h-[140px] relative overflow-hidden bg-card">
                      <img 
                        src={brandImagePreview} 
                        alt="Preview" 
                        className="max-h-[120px] max-w-[120px] object-contain drop-shadow-lg hover:scale-105 transition-transform"
                        crossOrigin="anonymous"
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', brandImagePreview);
                          (e.target as HTMLImageElement).style.display = 'block';
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', brandImagePreview);
                          console.error('Error details:', (e.target as HTMLImageElement).naturalWidth);
                          // Show error message in the container
                          const container = (e.target as HTMLImageElement).parentElement;
                          if (container) {
                            container.innerHTML = '<p class="text-red-600 font-semibold text-sm">Unable to load image</p>';
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-success text-white text-xs font-bold px-2 py-1 rounded-full"></div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => document.getElementById('brandImageInput')?.click()}
                        className="flex-1 px-4 py-2 bg-surface-2 text-electric hover:bg-surface-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        {language === 'en' ? 'Change' : 'Changer'}
                      </button>
                      <button
                        onClick={handleRemoveBrandImage}
                        className="flex-1 px-4 py-2 bg-surface-2 text-destructive hover:bg-surface-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        {language === 'en' ? 'Remove' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t-2 border-border">
                <button
                  onClick={handleSaveNewMark}
                  className="flex-1 text-primary-foreground font-bold py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-base bg-primary"
                >
                  {language === 'en' ? (isEditingBrand ? 'Update' : 'Save') : (isEditingBrand ? 'Mettre à jour' : 'Enregistrer')}
                </button>
                <button
                  onClick={() => {
                    setShowAddMarkModal(false);
                    setNewMarkName('');
                    setNewMarkImage(null);
                    setBrandImagePreview(null);
                    setIsEditingBrand(false);
                    setEditingBrandId(null);
                  }}
                  className="flex-1 border-2 border-border text-electric hover:bg-surface-2 font-bold py-3 px-4 rounded-lg transition-all active:scale-95"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Connector Type Modal */}
      {showAddConnectorModal && (
        <div className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl max-w-md w-full shadow-sm"
          >
            <div className="p-6 border-b border-border rounded-t-2xl bg-card">
              <h2 className="text-2xl font-bold text-electric">
                {language === 'en' ? 'Add Connector Type' : 'Ajouter Type de Connecteur'}
              </h2>
              <p className="text-electric text-sm mt-1">
                {language === 'en' ? 'Create a new connector type' : 'Créez un nouveau type de connecteur'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-electric">
                  {language === 'en' ? 'Connector Name' : 'Nom du Connecteur'} *
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g., USB-C, Lightning...' : 'Ex: USB-C, Lightning...'}
                  value={newConnectorName}
                  onChange={(e) => setNewConnectorName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveNewConnector()}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-card font-semibold"
                  autoFocus
                />
              </div>

              <div className="bg-surface-2 p-3 rounded-lg">
                <p className="text-xs text-electric font-semibold">
                  {language === 'en' ? 'Tip: Be specific (USB-C, Lightning, Micro USB, etc.)' : 'Conseil: Soyez spécifique (USB-C, Lightning, Micro USB, etc.)'}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={handleSaveNewConnector}
                  className="flex-1 text-primary-foreground font-bold py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md bg-primary"
                >
                  {language === 'en' ? 'Save Connector' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setShowAddConnectorModal(false);
                    setNewConnectorName('');
                  }}
                  className="flex-1 border-2 border-border text-electric hover:bg-surface-2 font-bold py-3 px-4 rounded-lg transition-all"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && chargerToDelete && (
        <div className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl max-w-md w-full shadow-sm p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {language === 'en' ? 'Confirm Delete' : 'Confirmer la Suppression'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {language === 'en' 
                  ? `Are you sure you want to delete "${
                      chargers.find(c => c.id === chargerToDelete)?.name || ''
                    }"? If it appears in past sales it will be archived instead.`
                  : `Êtes-vous sûr de vouloir supprimer "${
                      chargers.find(c => c.id === chargerToDelete)?.name || ''
                    }"? S'il figure dans des ventes passées, il sera archivé à la place.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setChargerToDelete(null);
                  }}
                  type="button"
                  className="flex-1 border border-border bg-card hover:bg-surface-2 text-foreground font-bold h-11 px-4 rounded-[10px] transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => { if (chargerToDelete) handleDeleteCharger(chargerToDelete); }}
                  className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-60 text-white font-bold h-11 px-4 rounded-[10px] transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {language === 'en' ? 'Delete' : 'Supprimer'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
