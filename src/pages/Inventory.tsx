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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

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
      // ✨ OPTIMIZED: Use single query with joins instead of N+1 queries
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
      console.log('📦 Loading suppliers...');
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error loading suppliers:', error);
        setSuppliers([]);
        return;
      }
      
      console.log('✅ Suppliers loaded:', data);
      setSuppliers(data || []);
    } catch (error) {
      console.error('❌ Exception loading suppliers:', error);
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
    console.log('🔍 Loading brand for edit:', { brandId, brandName, brand });
    
    if (brand) {
      const logoUrl = (brand as any).logo_url;
      console.log('📷 Brand logo_url field:', logoUrl);
      
      if (logoUrl && logoUrl.trim() !== '') {
        console.log('✅ Setting brand image preview:', logoUrl);
        // Verify the URL is valid by checking if it's a proper Supabase URL
        if (logoUrl.includes('supabase') || logoUrl.startsWith('http')) {
          setBrandImagePreview(logoUrl);
        } else {
          console.warn('⚠️ Invalid image URL format:', logoUrl);
          setBrandImagePreview(null);
        }
      } else {
        console.log('❌ No logo_url found for brand');
        setBrandImagePreview(null);
      }
    } else {
      console.warn('⚠️ Brand not found in marks array');
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
      alert(language === 'en' ? 'Brand deleted successfully!' : 'Marque supprimée avec succès!');
      setMarks(marks.filter((m) => m.id !== selectedBrand));
      setSelectedBrand('');
      setFormData({ ...formData, mark_id: '' });
      setShowBrandOptionsModal(false);
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert(language === 'en' ? 'Error deleting brand' : 'Erreur lors de la suppression de la marque');
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
      alert(language === 'en' ? 'Connector type deleted successfully!' : 'Type de connecteur supprimé avec succès!');
      setConnectorTypes(connectorTypes.filter((c) => c.id !== connectorId));
      setFormData({ ...formData, connector_type_id: '' });
    } catch (error) {
      console.error('Error deleting connector type:', error);
      alert(language === 'en' ? 'Error deleting connector type' : 'Erreur lors de la suppression du type de connecteur');
    }
  };

  const handleSaveNewMark = async () => {
    if (!newMarkName.trim()) {
      alert(language === 'en' ? 'Please enter a mark name' : 'Veuillez entrer le nom de la marque');
      return;
    }

    try {
      let logoPath = null;
      let logoUrl = null;

      // Upload image if selected
      if (newMarkImage) {
        const fileName = `${Date.now()}-${newMarkImage.name}`;
        const brandId = editingBrandId || 'temp';
        const filePath = `marks/${brandId}/${fileName}`;

        console.log('📤 Uploading brand image:', { filePath, fileSize: newMarkImage.size });

        const { error: uploadError } = await supabase.storage
          .from('chargers')
          .upload(filePath, newMarkImage);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('chargers')
          .getPublicUrl(filePath);

        logoPath = filePath;
        logoUrl = publicUrl.publicUrl;
        
        console.log('✅ Image uploaded successfully:', { logoPath, logoUrl });
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

        console.log('🔄 Updating brand:', { editingBrandId, updateData });

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

        console.log('➕ Creating new brand:', insertData);

        const { data, error } = await supabase
          .from('marks')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;
        
        console.log('✅ Brand created successfully:', data);
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
      console.error('❌ Error saving mark:', error);
      alert(language === 'en' ? 'Error saving mark' : 'Erreur lors de l\'enregistrement de la marque');
    }
  };

  const handleSaveNewConnector = async () => {
    if (!newConnectorName.trim()) {
      alert('Please enter a connector type name');
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
      alert('Connector type added successfully!');
    } catch (error) {
      console.error('Error adding connector type:', error);
      alert('Error adding connector type');
    }
  };

  const handleDeleteCharger = async (chargerId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', chargerId);

      if (error) throw error;
      alert(language === 'en' ? 'Product deleted successfully!' : 'Produit supprimé avec succès!');
      setSelectedCharger(null);
      loadChargers();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(language === 'en' ? 'Error deleting product' : 'Erreur lors de la suppression du produit');
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

  const uploadImages = async (productId: string) => {
    if (formData.images.length === 0) return null;

    let primaryImageUrl: string | null = null;

    try {
      console.log(`🚀 Starting image upload for product ${productId}. Total images: ${formData.images.length}`);
      
      for (let i = 0; i < formData.images.length; i++) {
        const file = formData.images[i];
        const isPrimary = i === primaryImageId || (primaryImageId === null && i === 0);
        
        // Create unique filename with timestamp
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${productId}/${timestamp}-${i}.${fileExtension}`;
        
        console.log(`📸 Uploading image ${i + 1}/${formData.images.length}: ${fileName}`);
        
        // 1. Upload file to storage bucket 'chargers'
        const { error: uploadError } = await supabase.storage
          .from('chargers')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`❌ Upload failed for ${fileName}:`, uploadError);
          throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`);
        }
        
        console.log(`✅ Image ${i + 1} uploaded to storage bucket`);

        // 2. Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('chargers')
          .getPublicUrl(fileName);
        
        const publicUrl = publicUrlData.publicUrl;
        console.log(`🔗 Public URL: ${publicUrl}`);

        // 3. Save primary image URL if this is the primary
        if (isPrimary) {
          primaryImageUrl = publicUrl;
          console.log(`⭐ Primary image URL: ${primaryImageUrl}`);
        }

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
              uploaded_by: (await supabase.auth.getUser()).data?.user?.id,
            },
          ]);

        if (dbError) {
          console.warn(`⚠️ Database save warning for image ${i + 1}:`, dbError);
          // Continue anyway - image is in storage
        } else {
          console.log(`💾 Image ${i + 1} saved to product_images table`);
        }
      }
      
      console.log('✅ All images uploaded to bucket!');
      return primaryImageUrl;
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      throw error;
    }
  };

  const handleSaveCharger = async () => {
    try {
      if (!formData.name) {
        alert('Product name is required');
        return;
      }

      // If editing mode, update existing product
      if (isEditingMode && editingChargerId) {
        let primaryImageUrl: string | null = null;

        // Update existing images' primary status if primaryImageId changed
        if (chargerImages.length > 0 && primaryImageId !== null) {
          try {
            console.log(`🔄 Updating primary image status for existing images...`);
            // Set all existing images to not primary first
            for (let i = 0; i < chargerImages.length; i++) {
              const { error: updateError } = await supabase
                .from('product_images')
                .update({ is_primary: i === primaryImageId })
                .eq('id', chargerImages[i].id);
              
              if (updateError) {
                console.warn(`⚠️ Warning updating image ${i}:`, updateError);
              }
            }
            // Set the primary image URL from the selected existing image
            if (primaryImageId < chargerImages.length) {
              primaryImageUrl = chargerImages[primaryImageId].image_url;
              console.log(`⭐ Updated primary image to index ${primaryImageId}: ${primaryImageUrl}`);
            }
          } catch (error) {
            console.error('❌ Error updating existing image primary status:', error);
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
            console.log('✅ All new images uploaded successfully!');
          } catch (imageError) {
            console.error('❌ Image upload failed:', imageError);
            alert(`Image upload failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
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

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', editingChargerId);

        if (error) throw error;

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
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
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
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('Product created successfully:', data);

      // Upload images if any are provided
      if (formData.images.length > 0) {
        try {
          console.log(`Starting to upload ${formData.images.length} images...`);
          const primaryImageUrl = await uploadImages(data.id);
          console.log('✅ All images uploaded successfully!');

          // Update product with primary image URL
          if (primaryImageUrl) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ primary_image: primaryImageUrl })
              .eq('id', data.id);

            if (updateError) {
              console.error('❌ Failed to update primary image:', updateError);
            } else {
              console.log('✅ Product updated with primary image URL:', primaryImageUrl);
            }
          }
        } catch (imageError) {
          console.error('❌ Image upload failed:', imageError);
          // Product was saved, but images failed - show warning
          alert(`Charger saved but image upload failed: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
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

      setShowAddModal(false);
      loadChargers();
    } catch (error) {
      console.error('Error saving charger:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving charger: ${errorMessage}`);
    }
  };

  const filteredChargers = chargers.filter((charger) => {
    const matchesSearch =
      charger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charger.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charger.mark?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = !filterMark || charger.mark?.name === filterMark;

    return matchesSearch && matchesFilter;
  });

  const lowStockChargers = chargers.filter(
    (c) => c.quantity_actual <= c.quantity_minimal
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
          {language === 'en' ? '🔋 Charger Inventory' : '🔋 Gestion du Stock Chargeurs'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {language === 'en'
            ? `📊 ${filteredChargers.length} products available • ⚠️ ${lowStockChargers} low stock alerts`
            : `📊 ${filteredChargers.length} produits disponibles • ⚠️ ${lowStockChargers} alertes de rupture`}
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              language === 'en'
                ? '🔍 Search products...'
                : '🔍 Rechercher les produits...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={filterMark}
          onChange={(e) => setFilterMark(e.target.value)}
          className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow appearance-none text-slate-900 dark:text-white"
          style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '16px 12px', paddingRight: '2.5rem'}}
        >
          <option value="">🏷️ {language === 'en' ? 'All Marks' : 'Toutes les Marques'}</option>
          {marks.map((mark) => (
            <option key={mark.id} value={mark.name}>
              {mark.name}
            </option>
          ))}
        </select>

        <div className="col-span-1 md:col-span-1"></div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="h-[46px] bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-base font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === 'en' ? '➕ Add Charger' : '➕ Ajouter'}
        </Button>
      </motion.div>

      {/* Chargers Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">{language === 'en' ? 'Loading chargers...' : 'Chargement des chargeurs...'}</p>
        </div>
      ) : filteredChargers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <ImageIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">
            {language === 'en' ? '❌ No chargers found' : '❌ Aucun chargeur trouvé'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {filteredChargers.map((charger) => {
            const lowStock = charger.quantity_actual <= charger.quantity_minimal;
            const outOfStock = charger.quantity_actual === 0;
            
            return (
              <motion.div
                key={charger.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                className="group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
                  {/* Image Section */}
                  <div className="relative h-28 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden group">
                    {charger.primary_image ? (
                      <img
                        src={charger.primary_image}
                        alt={charger.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-12 h-12 text-slate-400" />
                        <p className="text-xs text-slate-500">{language === 'en' ? 'No image' : 'Pas d\'image'}</p>
                      </div>
                    )}

                    {/* Stock Badge */}
                    {outOfStock ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Out of Stock
                      </motion.div>
                    ) : lowStock ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 right-2 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Low Stock
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 right-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg"
                      >
                        ✅ In Stock
                      </motion.div>
                    )}
                  </div>

                  {/* Content Section */}
                  <CardContent className="pt-4 pb-4">
                    {/* Product Name */}
                    <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-2">
                      {charger.name}
                    </h3>

                    {/* Mark Badge */}
                    {charger.mark && (
                      <div className="mb-3 inline-block">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          🏷️ {charger.mark.name}
                        </span>
                      </div>
                    )}

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-slate-600 font-semibold">⚡ V</p>
                        <p className="text-sm font-bold text-slate-800">{charger.voltage}V</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 font-semibold">🔌 W</p>
                        <p className="text-sm font-bold text-slate-800">{charger.wattage}W</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-600 font-semibold">⚙️ A</p>
                        <p className="text-sm font-bold text-slate-800">{charger.amperage}A</p>
                      </div>
                      {charger.connector_type && (
                        <div className="text-center col-span-2">
                          <p className="text-xs text-slate-600 font-semibold">🔗 {charger.connector_type.name}</p>
                        </div>
                      )}
                    </div>

                    {/* Stock & Pricing */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-600 font-bold">📦</p>
                        <p className="text-base font-bold text-purple-700">{charger.quantity_actual}</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-bold">💵</p>
                        <p className="text-sm font-bold text-blue-700">{charger.purchase_price.toFixed(0)}</p>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <p className="text-xs text-emerald-600 font-bold">💰</p>
                        <p className="text-sm font-bold text-emerald-700">{charger.selling_price.toFixed(0)}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => {
                          // Refresh charger data and then show details
                          refreshChargerData(charger.id);
                          setSelectedCharger(charger);
                          // Fetch all images for this charger with full metadata
                          supabase
                            .from('product_images')
                            .select('id, image_url, file_path, display_order, is_primary')
                            .eq('product_id', charger.id)
                            .order('display_order', { ascending: true })
                            .then(({ data }) => {
                              if (data) {
                                setChargerImages(data);
                              }
                            });
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center"
                        title={language === 'en' ? 'View details' : 'Voir les détails'}
                      >
                        👁️
                      </button>
                      <button
                        onClick={async () => {
                          setIsEditingMode(true);
                          setEditingChargerId(charger.id);
                          setFormData({
                            name: charger.name,
                            description: charger.description || '',
                            mark_id: charger.mark_id || '',
                            connector_type_id: charger.connector_type_id || '',
                            voltage: charger.voltage.toString(),
                            wattage: charger.wattage.toString(),
                            amperage: charger.amperage.toString(),
                            model_number: charger.model_number || '',
                            purchase_price: charger.purchase_price.toString(),
                            selling_price: charger.selling_price.toString(),
                            selling_price_1: charger.selling_price.toString(),
                            selling_price_2: charger.selling_price.toString(),
                            selling_price_3: charger.selling_price.toString(),
                            images: [],
                          });
                          // Load existing images for this product
                          const { data: existingImages } = await supabase
                            .from('product_images')
                            .select('id, image_url, file_path, display_order, is_primary')
                            .eq('product_id', charger.id)
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
                          setShowAddModal(true);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center"
                        title={language === 'en' ? 'Edit' : 'Modifier'}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          setChargerToDelete(charger.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center"
                        title={language === 'en' ? 'Delete' : 'Supprimer'}
                      >
                        🗑️
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add Charger Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 dark:from-slate-700 to-emerald-50 dark:to-slate-700 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-900">
                {isEditingMode 
                  ? (language === 'en' ? '✏️ Edit Charger' : '✏️ Modifier Chargeur')
                  : (language === 'en' ? '➕ Add New Charger' : '➕ Ajouter Nouveau Chargeur')}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditingMode(false);
                  setEditingChargerId(null);
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
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg p-2 transition"
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
                className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200"
              >
                <h3 className="text-lg font-bold text-cyan-900 mb-4">🖼️ {language === 'en' ? 'Product Images' : 'Images du Produit'}</h3>
                
                {/* Existing Images Gallery (when editing) */}
                {isEditingMode && editingChargerId && chargerImages.length > 0 && (
                  <div className="mb-4 p-4 bg-white dark:bg-slate-700 rounded-lg border border-cyan-300 dark:border-cyan-600">
                    <p className="text-xs font-semibold text-cyan-700 mb-3">📸 {language === 'en' ? 'Existing Images - Click to set as Primary' : 'Images Existantes - Cliquez pour définir comme principale'} ({chargerImages.length})</p>
                    <div className="grid grid-cols-3 gap-3">
                      {chargerImages.map((imageObj, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPrimaryImageId(index)}
                          className="relative group rounded-lg overflow-hidden border-4 shadow-md transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
                          style={{borderColor: index === primaryImageId || (primaryImageId === null && index === 0) ? '#06b6d4' : '#cbd5e1'}}
                          title={language === 'en' ? 'Click to set as primary image' : 'Cliquez pour définir comme image principale'}
                        >
                          {(index === primaryImageId || (primaryImageId === null && index === 0)) && <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold z-10">⭐ PRIMARY</div>}
                          <img
                            src={imageObj.image_url}
                            alt={`Existing image ${index + 1}`}
                            className="w-full h-24 object-cover hover:scale-105 transition-transform duration-300"
                          />
                          {(index === primaryImageId || (primaryImageId === null && index === 0)) && (
                            <div className="absolute inset-0 bg-cyan-400 bg-opacity-20 border-2 border-cyan-400 rounded-lg flex items-center justify-center">
                              <div className="text-4xl">✓</div>
                            </div>
                          )}
                        </button>
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
                    <ImageIcon className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                    <p className="text-cyan-900 font-semibold">
                      {formData.images.length > 0
                        ? `✅ ${formData.images.length} ${language === 'en' ? 'new image(s) selected' : 'nouvelle(s) image(s) sélectionnée(s)'}`
                        : language === 'en'
                        ? '📤 Click to select images'
                        : '📤 Cliquez pour sélectionner des images'}
                    </p>
                    <p className="text-xs text-cyan-700 mt-2">
                      {isEditingMode ? (language === 'en' ? 'Add more images to existing ones' : 'Ajoutez plus d\'images aux existantes') : (language === 'en' ? 'Select one or more images' : 'Sélectionnez une ou plusieurs images')}
                    </p>
                  </label>
                </div>

                {/* Image Preview Section */}
                {formData.images.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-cyan-700 mb-3">🎯 {language === 'en' ? 'New Images - Select which one is primary' : 'Nouvelles Images - Sélectionnez laquelle est principale'}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {formData.images.map((image, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPrimaryImageId(index)}
                          className="relative group rounded-lg overflow-hidden border-4 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
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
                              <div className="absolute inset-0 bg-cyan-400 bg-opacity-20 border-2 border-cyan-400 rounded-lg flex items-center justify-center">
                                <div className="text-4xl">✓</div>
                              </div>
                              <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold z-10">⭐ PRIMARY</div>
                            </>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(index);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white text-xl rounded-full w-10 h-10 flex items-center justify-center transition-colors font-bold"
                              title={language === 'en' ? 'Delete image' : 'Supprimer image'}
                            >
                              🗑️
                            </button>
                          </div>
                          <p className="absolute inset-0 text-xs text-white/80 flex items-start justify-start p-2 bg-gradient-to-br from-black/50 to-transparent rounded-lg pointer-events-none truncate">{image.name}</p>
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
                className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
              >
                <h3 className="text-lg font-bold text-blue-900 mb-4">📦 {language === 'en' ? 'Product Information' : 'Informations du Produit'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-blue-900">
                      🏷️ {language === 'en' ? 'Product Name' : 'Nom du Produit'} *
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'en' ? 'e.g., USB-C Charger' : 'Ex: Chargeur USB-C'}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-blue-900 dark:text-blue-300">
                      📝 {language === 'en' ? 'Description' : 'Description'}
                    </label>
                    <textarea
                      placeholder={language === 'en' ? 'Optional details about the charger...' : 'Détails optionnels...'}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Mark & Connector Section - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
              >
                <h3 className="text-lg font-bold text-purple-900 mb-5">🏢 {language === 'en' ? 'Brand & Connector' : 'Marque & Connecteur'}</h3>
                
                {/* Streamlined Grid: 1 column on mobile, 2 columns on tablet+ */}
                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  
                  {/* Brand / Mark Field */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-purple-900">
                      🏷️ {language === 'en' ? 'Mark / Brand' : 'Marque'} *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.mark_id}
                        onChange={(e) => {
                          setFormData({ ...formData, mark_id: e.target.value });
                          setSelectedBrand(e.target.value);
                        }}
                        className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
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
                            className="px-2.5 py-2 border-blue-300 text-blue-600 hover:bg-blue-100 flex-shrink-0"
                            title={language === 'en' ? 'Edit brand' : 'Modifier la marque'}
                          >
                            ✏️
                          </Button>
                          <Button
                            onClick={handleDeleteBrand}
                            variant="outline"
                            className="px-2.5 py-2 border-red-300 text-red-600 hover:bg-red-100 flex-shrink-0"
                            title={language === 'en' ? 'Delete brand' : 'Supprimer la marque'}
                          >
                            🗑️
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={handleAddMark}
                        variant="outline"
                        className="px-2.5 py-2 border-purple-300 text-purple-600 hover:bg-purple-100 flex-shrink-0"
                        title={language === 'en' ? 'Add new brand' : 'Ajouter nouvelle marque'}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Connector Type Field */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-purple-900">
                      🔗 {language === 'en' ? 'Connector Type' : 'Type de Connecteur'} *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.connector_type_id}
                        onChange={(e) =>
                          setFormData({ ...formData, connector_type_id: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
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
                            className="px-2.5 py-2 border-blue-300 text-blue-600 hover:bg-blue-100 flex-shrink-0"
                            title={language === 'en' ? 'Clear selection' : 'Effacer la sélection'}
                          >
                            ✖️
                          </Button>
                          <Button
                            onClick={handleDeleteConnector}
                            variant="outline"
                            className="px-2.5 py-2 border-red-300 text-red-600 hover:bg-red-100 flex-shrink-0"
                            title={language === 'en' ? 'Delete connector type' : 'Supprimer le type de connecteur'}
                          >
                            🗑️
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={handleAddConnectorType}
                        variant="outline"
                        className="px-2.5 py-2 border-purple-300 text-purple-600 hover:bg-purple-100 flex-shrink-0"
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
                className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200"
              >
                <h3 className="text-lg font-bold text-yellow-900 mb-4">⚡ {language === 'en' ? 'Electrical Specs' : 'Spécifications Électriques'}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-300">⚡ Voltage</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="5V"
                      value={formData.voltage}
                      onChange={(e) =>
                        setFormData({ ...formData, voltage: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-yellow-300 dark:border-yellow-600 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-300">🔌 Wattage</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="20W"
                      value={formData.wattage}
                      onChange={(e) =>
                        setFormData({ ...formData, wattage: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-yellow-300 dark:border-yellow-600 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-300">⚙️ Amperage</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="4A"
                      value={formData.amperage}
                      onChange={(e) =>
                        setFormData({ ...formData, amperage: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-yellow-300 dark:border-yellow-600 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-300">🔢 {language === 'en' ? 'Model Number' : 'Numéro de Modèle'}</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.model_number}
                    onChange={(e) =>
                      setFormData({ ...formData, model_number: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-yellow-300 dark:border-yellow-600 rounded-lg focus:ring-2 focus:ring-yellow-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </motion.div>

              {/* Pricing Section - Only Selling Prices */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200"
              >
                <h3 className="text-lg font-bold text-rose-900 mb-4">💰 {language === 'en' ? 'Selling Prices' : 'Prix de Vente'}</h3>
                <p className="text-sm text-rose-700 mb-4">{language === 'en' ? 'Set different prices for different customer types' : 'Définissez des prix différents pour les différents types de clients'}</p>
                
                {/* Selling Prices - Three Tier System */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Price 1 - Normal */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-xs font-semibold mb-2 text-blue-900">💰 {language === 'en' ? 'Normal Price' : 'Prix Normal'} *</label>
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
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-bold text-sm"
                    />
                  </div>

                  {/* Price 2 - Revendeur (Reseller) */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="block text-xs font-semibold mb-2 text-amber-900">🔄 {language === 'en' ? 'Revendeur Price' : 'Prix Revendeur'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.selling_price_2}
                      onChange={(e) =>
                        setFormData({ ...formData, selling_price_2: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-bold text-sm"
                    />
                  </div>

                  {/* Price 3 - Wholesale */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <label className="block text-xs font-semibold mb-2 text-emerald-900">📦 {language === 'en' ? 'Wholesale Price' : 'Prix Gros'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.selling_price_3}
                      onChange={(e) =>
                        setFormData({ ...formData, selling_price_3: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-bold text-sm"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSaveCharger}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg h-12 font-bold text-base"
                >
                  {isEditingMode 
                    ? (language === 'en' ? '💾 Update' : '💾 Mettre à Jour')
                    : (language === 'en' ? '💾 Save Charger' : '💾 Enregistrer')}
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
                  ✖️ {language === 'en' ? 'Cancel' : 'Annuler'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCharger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 dark:from-slate-700 to-pink-50 dark:to-slate-700 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                👁️ {selectedCharger.name}
              </h2>
              <button
                onClick={() => setSelectedCharger(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg p-2 transition text-2xl"
              >
                ❌
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
                  className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200"
                >
                  <h3 className="text-lg font-bold text-cyan-900 mb-4">🖼️ {language === 'en' ? 'Product Images' : 'Images du Produit'} ({chargerImages.length})</h3>
                  {chargerImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {chargerImages.map((imageObj, index) => {
                        // Handle both string URLs and objects
                        const imageUrl = typeof imageObj === 'string' ? imageObj : imageObj.image_url;
                        const isPrimary = typeof imageObj === 'object' ? imageObj.is_primary : false;
                        
                        return (
                          <div key={index} className="rounded-lg overflow-hidden border-4 shadow-md relative" style={{borderColor: isPrimary ? '#06b6d4' : '#cbd5e1'}}>
                            {isPrimary && <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold z-10">⭐ PRIMARY</div>}
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
                      className="w-full h-80 object-cover rounded-lg border-2 border-cyan-300"
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
                className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
              >
                <h3 className="text-lg font-bold text-blue-900 mb-4">📦 {language === 'en' ? 'Product Information' : 'Informations du Produit'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">🏷️ {language === 'en' ? 'Product Name' : 'Nom du Produit'}</label>
                    <p className="text-blue-900 font-semibold">{selectedCharger.name}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">🎨 {language === 'en' ? 'Brand' : 'Marque'}</label>
                    <p className="text-blue-900 font-semibold">{selectedCharger.mark?.name || '-'}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">🔗 {language === 'en' ? 'Connector Type' : 'Type de Connecteur'}</label>
                    <p className="text-blue-900 font-semibold">{selectedCharger.connector_type?.name || '-'}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">🔢 {language === 'en' ? 'Model Number' : 'Numéro de Modèle'}</label>
                    <p className="text-blue-900 font-semibold">{selectedCharger.model_number || '-'}</p>
                  </div>
                </div>

                {selectedCharger.description && (
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <label className="block text-xs font-semibold text-blue-700 mb-1">📝 {language === 'en' ? 'Description' : 'Description'}</label>
                    <p className="text-blue-900">{selectedCharger.description}</p>
                  </div>
                )}
              </motion.div>

              {/* Technical Specs Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl border border-violet-200"
              >
                <h3 className="text-lg font-bold text-violet-900 mb-4">⚡ {language === 'en' ? 'Technical Specifications' : 'Spécifications Techniques'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-violet-700">⚡ Voltage</p>
                    <p className="text-lg font-bold text-violet-900">{selectedCharger.voltage}V</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-violet-700">💡 Wattage</p>
                    <p className="text-lg font-bold text-violet-900">{selectedCharger.wattage}W</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-violet-700">🔌 Amperage</p>
                    <p className="text-lg font-bold text-violet-900">{selectedCharger.amperage}A</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-violet-700">📊 Margin</p>
                    <p className="text-lg font-bold text-violet-900">{selectedCharger.margin.toFixed(1)}%</p>
                  </div>
                </div>
              </motion.div>

              {/* Stock & Pricing Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200"
              >
                <h3 className="text-lg font-bold text-emerald-900 mb-4">💰 {language === 'en' ? 'Stock & Pricing' : 'Stock & Tarification'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-emerald-700">📦 {language === 'en' ? 'Initial Stock' : 'Stock Initial'}</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedCharger.quantity_initial || selectedCharger.quantity_actual}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-emerald-700">📊 {language === 'en' ? 'Current Stock' : 'Stock Actuel'}</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedCharger.quantity_actual}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-emerald-700">⚠️ {language === 'en' ? 'Min Stock' : 'Stock Min'}</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedCharger.quantity_minimal}</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-emerald-700">💵 {language === 'en' ? 'Buy Price' : 'Prix Achat'}</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedCharger.purchase_price.toFixed(0)} DA</p>
                  </div>

                  <div className="p-3 bg-white rounded-lg text-center">
                    <p className="text-xs font-semibold text-emerald-700">💰 {language === 'en' ? 'Sell Price' : 'Prix Vente'}</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedCharger.selling_price.toFixed(0)} DA</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-300">
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
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-base"
                >
                  <Edit2 className="w-5 h-5" />
                  {language === 'en' ? '✏️ Edit' : '✏️ Modifier'}
                </button>
                <button
                  onClick={() => setSelectedCharger(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-bold transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-2xl sticky top-0 z-10">
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                🏷️ {language === 'en' ? (isEditingBrand ? 'Edit Brand' : 'Add New Brand') : (isEditingBrand ? 'Modifier Marque' : 'Ajouter Nouvelle Marque')}
              </h2>
              <p className="text-purple-100 text-sm mt-2">
                {language === 'en' ? 'Create or edit a charger brand with logo' : 'Créez ou modifiez une marque avec logo'}
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  {language === 'en' ? 'Brand Name' : 'Nom de la Marque'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g., Apple, Samsung...' : 'Ex: Apple, Samsung...'}
                  value={newMarkName}
                  onChange={(e) => setNewMarkName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveNewMark()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-semibold text-gray-800 transition-all"
                  autoFocus
                />
              </div>

              {/* Brand Logo Upload */}
              <div>
                <label className="block text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
                  <span className="text-lg">🖼️</span>
                  {language === 'en' ? 'Brand Logo' : 'Logo de la Marque'} <span className="text-gray-400">({language === 'en' ? 'Optional' : 'Optionnel'})</span>
                </label>
                
                {!brandImagePreview ? (
                  <div 
                    className="border-3 border-dashed border-purple-400 rounded-xl p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 cursor-pointer transition-all duration-200 group"
                    onClick={() => document.getElementById('brandImageInput')?.click()}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBrandImageSelect}
                      className="hidden"
                      id="brandImageInput"
                    />
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">📤</div>
                    <p className="text-purple-900 font-bold text-lg">
                      {language === 'en' ? 'Click to upload logo' : 'Cliquez pour télécharger le logo'}
                    </p>
                    <p className="text-xs text-purple-700 mt-2 font-medium">PNG, JPG, WebP (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-6 flex items-center justify-center min-h-[140px] relative overflow-hidden">
                      <img 
                        src={brandImagePreview} 
                        alt="Preview" 
                        className="max-h-[120px] max-w-[120px] object-contain drop-shadow-lg hover:scale-105 transition-transform"
                        crossOrigin="anonymous"
                        onLoad={(e) => {
                          console.log('✅ Image loaded successfully:', brandImagePreview);
                          (e.target as HTMLImageElement).style.display = 'block';
                        }}
                        onError={(e) => {
                          console.error('❌ Image failed to load:', brandImagePreview);
                          console.error('Error details:', (e.target as HTMLImageElement).naturalWidth);
                          // Show error message in the container
                          const container = (e.target as HTMLImageElement).parentElement;
                          if (container) {
                            container.innerHTML = '<p class="text-red-600 font-semibold text-sm">⚠️ Unable to load image</p>';
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">✓</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => document.getElementById('brandImageInput')?.click()}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        🔄 {language === 'en' ? 'Change' : 'Changer'}
                      </button>
                      <button
                        onClick={handleRemoveBrandImage}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        🗑️ {language === 'en' ? 'Remove' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={handleSaveNewMark}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 text-base"
                >
                  💾 {language === 'en' ? (isEditingBrand ? 'Update' : 'Save') : (isEditingBrand ? 'Mettre à jour' : 'Enregistrer')}
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
                  className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold py-3 px-4 rounded-lg transition-all active:scale-95"
                >
                  ✖️ {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Connector Type Modal */}
      {showAddConnectorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
          >
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-cyan-900">
                🔗 {language === 'en' ? 'Add Connector Type' : 'Ajouter Type de Connecteur'}
              </h2>
              <p className="text-cyan-700 text-sm mt-1">
                {language === 'en' ? 'Create a new connector type' : 'Créez un nouveau type de connecteur'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-cyan-900">
                  📝 {language === 'en' ? 'Connector Name' : 'Nom du Connecteur'} *
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g., USB-C, Lightning...' : 'Ex: USB-C, Lightning...'}
                  value={newConnectorName}
                  onChange={(e) => setNewConnectorName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveNewConnector()}
                  className="w-full px-4 py-3 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white font-semibold"
                  autoFocus
                />
              </div>

              <div className="bg-cyan-50 p-3 rounded-lg">
                <p className="text-xs text-cyan-700 font-semibold">
                  💡 {language === 'en' ? 'Tip: Be specific (USB-C, Lightning, Micro USB, etc.)' : 'Conseil: Soyez spécifique (USB-C, Lightning, Micro USB, etc.)'}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSaveNewConnector}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  💾 {language === 'en' ? 'Save Connector' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setShowAddConnectorModal(false);
                    setNewConnectorName('');
                  }}
                  className="flex-1 border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 font-bold py-3 px-4 rounded-lg transition-all"
                >
                  ✖️ {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && chargerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ⚠️ {language === 'en' ? 'Confirm Delete' : 'Confirmer la Suppression'}
              </h2>
              <p className="text-gray-600 mb-4">
                {language === 'en' 
                  ? `Are you sure you want to delete "${
                      chargers.find(c => c.id === chargerToDelete)?.name || ''
                    }"? This action cannot be undone.`
                  : `Êtes-vous sûr de vouloir supprimer "${
                      chargers.find(c => c.id === chargerToDelete)?.name || ''
                    }"? Cette action ne peut pas être annulée.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setChargerToDelete(null);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
                <button
                  onClick={() => {
                    if (chargerToDelete) {
                      handleDeleteCharger(chargerToDelete);
                      setShowDeleteConfirm(false);
                      setChargerToDelete(null);
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
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
