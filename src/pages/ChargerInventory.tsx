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
  mark?: { name: string };
  connector_type?: { name: string };
  voltage: number;
  wattage: number;
  amperage: number;
  model_number?: string;
  quantity_actual: number;
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

const ChargerInventory = () => {
  const { language } = useLanguage();
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [connectorTypes, setConnectorTypes] = useState<ConnectorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMark, setFilterMark] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

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
    quantity_initial: '',
    quantity_actual: '',
    quantity_minimal: '',
    purchase_price: '',
    selling_price: '',
    supplier_id: '',
    images: [] as File[],
  });

  // Load data
  useEffect(() => {
    loadChargers();
    loadMarks();
    loadConnectorTypes();
  }, []);

  const loadChargers = async () => {
    try {
      setLoading(true);
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
          primary_image
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch marks and connector types for each product
      const enrichedChargers = await Promise.all(
        (data || []).map(async (charger: any) => {
          let mark = null;
          let connectorType = null;

          if (charger.mark_id) {
            const { data: markData } = await supabase
              .from('marks')
              .select('id, name')
              .eq('id', charger.mark_id)
              .single();
            mark = markData;
          }

          if (charger.connector_type_id) {
            const { data: ctData } = await supabase
              .from('connector_types')
              .select('id, name')
              .eq('id', charger.connector_type_id)
              .single();
            connectorType = ctData;
          }

          // Primary image is now directly from products table
          console.log(`Loading charger ${charger.name}, primary image: ${charger.primary_image}`);

          const margin =
            ((charger.selling_price - charger.purchase_price) /
              charger.purchase_price) *
            100;

          return {
            ...charger,
            mark,
            connector_type: connectorType,
            primary_image: charger.primary_image || null,
            margin: isNaN(margin) ? 0 : margin,
          };
        })
      );

      setChargers(enrichedChargers);
      console.log('✅ Chargers loaded successfully:', enrichedChargers);
    } catch (error) {
      console.error('❌ Error loading chargers:', error);
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

  const handleAddMark = async () => {
    const newMarkName = prompt('Enter mark name:');
    if (!newMarkName) return;

    try {
      const { data, error } = await supabase
        .from('marks')
        .insert([{ name: newMarkName, is_active: true }])
        .select()
        .single();

      if (error) throw error;
      setMarks([...marks, data]);
      setFormData({ ...formData, mark_id: data.id });
    } catch (error) {
      console.error('Error adding mark:', error);
      alert('Error adding mark');
    }
  };

  const handleAddConnectorType = async () => {
    const newTypeName = prompt('Enter connector type name:');
    if (!newTypeName) return;

    try {
      const { data, error } = await supabase
        .from('connector_types')
        .insert([{ name: newTypeName, is_active: true }])
        .select()
        .single();

      if (error) throw error;
      setConnectorTypes([...connectorTypes, data]);
      setFormData({ ...formData, connector_type_id: data.id });
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

  const uploadImages = async (productId: string) => {
    if (formData.images.length === 0) return;

    try {
      for (let i = 0; i < formData.images.length; i++) {
        const file = formData.images[i];
        const fileName = `${productId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('chargers')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('chargers')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('product_images')
          .insert([
            {
              product_id: productId,
              image_url: publicUrl.publicUrl,
              file_path: fileName,
              display_order: i,
              is_primary: i === 0,
            },
          ]);

        if (dbError) throw dbError;
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleSaveCharger = async () => {
    try {
      if (!formData.name) {
        alert('Product name is required');
        return;
      }

      const quantityActual = formData.quantity_actual || formData.quantity_initial;

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
            quantity_initial: parseInt(formData.quantity_initial) || 0,
            quantity_actual: parseInt(quantityActual) || 0,
            quantity_minimal: parseInt(formData.quantity_minimal) || 0,
            purchase_price: parseFloat(formData.purchase_price) || 0,
            selling_price: parseFloat(formData.selling_price) || 0,
            supplier_id: formData.supplier_id || null,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Upload images
      if (formData.images.length > 0) {
        await uploadImages(data.id);
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
        quantity_initial: '',
        quantity_actual: '',
        quantity_minimal: '',
        purchase_price: '',
        selling_price: '',
        supplier_id: '',
        images: [],
      });

      setShowAddModal(false);
      loadChargers();
    } catch (error) {
      console.error('Error saving charger:', error);
      alert('Error saving charger');
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'en' ? 'Charger Inventory' : 'Gestion du Stock Chargeurs'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'en'
              ? `${filteredChargers.length} products, ${lowStockChargers} low stock`
              : `${filteredChargers.length} produits, ${lowStockChargers} en rupture`}
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === 'en' ? 'Add Charger' : 'Ajouter Chargeur'}
        </Button>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              language === 'en'
                ? 'Search by name, description, mark...'
                : 'Rechercher par nom, description, marque...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterMark}
          onChange={(e) => setFilterMark(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">
            {language === 'en' ? 'All Marks' : 'Toutes les Marques'}
          </option>
          {marks.map((mark) => (
            <option key={mark.id} value={mark.name}>
              {mark.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Chargers Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {filteredChargers.map((charger) => (
            <motion.div
              key={charger.id}
              whileHover={{ y: -3 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden group">
                {charger.primary_image ? (
                  <>
                    <img
                      src={charger.primary_image}
                      alt={charger.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        console.warn(`Failed to load image for ${charger.name}:`, charger.primary_image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                    <span className="text-sm text-gray-500">{language === 'en' ? 'No image' : 'Pas d\'image'}</span>
                  </div>
                )}

                {charger.quantity_actual <= charger.quantity_minimal && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                    <AlertCircle className="w-4 h-4" />
                    {language === 'en' ? 'Low Stock' : 'Stock Faible'}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {charger.name}
                </h3>

                <div className="space-y-1 mb-3 text-xs">
                  {charger.mark && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Mark:</span> {charger.mark.name}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-gray-600">
                    <p>
                      <span className="font-semibold">V:</span> {charger.voltage}V
                    </p>
                    <p>
                      <span className="font-semibold">W:</span> {charger.wattage}W
                    </p>
                    <p>
                      <span className="font-semibold">A:</span> {charger.amperage}A
                    </p>
                    {charger.connector_type && (
                      <p>
                        <span className="font-semibold">Type:</span>{' '}
                        {charger.connector_type.name}
                      </p>
                    )}
                  </div>

                  <p className="text-gray-700 font-semibold mt-2">
                    Qty: {charger.quantity_actual} / {charger.selling_price.toFixed(2)} DA
                  </p>
                </div>

                <div className="flex gap-1 pt-2 border-t">
                  <button
                    onClick={() => setSelectedCharger(charger)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs font-semibold transition-colors"
                  >
                    {language === 'en' ? 'View' : 'Voir'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCharger(charger);
                      setIsEditingDetail(true);
                      setEditFormData({ ...charger });
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {language === 'en' ? 'Edit' : 'Modifier'}
                  </button>
                  <button
                    onClick={() => {
                      const confirmDelete = window.confirm(
                        language === 'en'
                          ? `Are you sure you want to delete "${charger.name}"?`
                          : `Êtes-vous sûr de vouloir supprimer "${charger.name}"?`
                      );
                      if (confirmDelete) {
                        handleDeleteCharger(charger.id);
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Charger Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Add New Charger' : 'Ajouter Nouveau Chargeur'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {language === 'en' ? 'Product Name' : 'Nom du Produit'} *
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g., USB-C Charger' : 'Ex: Chargeur USB-C'}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {language === 'en' ? 'Description' : 'Description'}
                </label>
                <textarea
                  placeholder={language === 'en' ? 'Optional details about the charger...' : 'Détails optionnels...'}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mark Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Mark / Brand' : 'Marque'} *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.mark_id}
                      onChange={(e) =>
                        setFormData({ ...formData, mark_id: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {language === 'en' ? 'Select Mark' : 'Sélectionnez Marque'}
                      </option>
                      {marks.map((mark) => (
                        <option key={mark.id} value={mark.id}>
                          {mark.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleAddMark}
                      variant="outline"
                      className="px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Connector Type */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Connector Type' : 'Type de Connecteur'} *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.connector_type_id}
                      onChange={(e) =>
                        setFormData({ ...formData, connector_type_id: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {language === 'en' ? 'Select Type' : 'Sélectionnez Type'}
                      </option>
                      {connectorTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleAddConnectorType}
                      variant="outline"
                      className="px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Electrical Specs */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Voltage (V)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="5V"
                    value={formData.voltage}
                    onChange={(e) =>
                      setFormData({ ...formData, voltage: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Wattage (W)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="20W"
                    value={formData.wattage}
                    onChange={(e) =>
                      setFormData({ ...formData, wattage: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Amperage (A)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="4A"
                    value={formData.amperage}
                    onChange={(e) =>
                      setFormData({ ...formData, amperage: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Model Number */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {language === 'en' ? 'Model Number' : 'Numéro de Modèle'}
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={formData.model_number}
                  onChange={(e) =>
                    setFormData({ ...formData, model_number: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Initial Qty' : 'Qté Initiale'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity_initial}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity_initial: e.target.value,
                        quantity_actual: formData.quantity_actual || e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Current Qty' : 'Qté Actuelle'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Auto-filled"
                    value={formData.quantity_actual}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity_actual: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Min Qty' : 'Qté Minimale'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Alert level"
                    value={formData.quantity_minimal}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity_minimal: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Purchase Price' : 'Prix Achat'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Selling Price' : 'Prix Vente'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) =>
                      setFormData({ ...formData, selling_price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {language === 'en' ? 'Product Images' : 'Images du Produit'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    id="imageInput"
                    className="hidden"
                  />
                  <label htmlFor="imageInput" className="cursor-pointer">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      {formData.images.length > 0
                        ? `${formData.images.length} ${language === 'en' ? 'image(s) selected' : 'image(s) sélectionnée(s)'}`
                        : language === 'en'
                        ? 'Click to select images'
                        : 'Cliquez pour sélectionner des images'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  onClick={handleSaveCharger}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {language === 'en' ? 'Save Charger' : 'Enregistrer'}
                </Button>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCharger.name}
              </h2>
              <div className="flex gap-2">
                {!isEditingDetail ? (
                  <button
                    onClick={() => {
                      setIsEditingDetail(true);
                      setEditFormData({ ...selectedCharger });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    {language === 'en' ? 'Edit' : 'Modifier'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditingDetail(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      {language === 'en' ? 'Cancel' : 'Annuler'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('products')
                            .update({
                              name: editFormData.name,
                              description: editFormData.description,
                              voltage: parseFloat(editFormData.voltage) || 0,
                              wattage: parseFloat(editFormData.wattage) || 0,
                              amperage: parseFloat(editFormData.amperage) || 0,
                              model_number: editFormData.model_number,
                              quantity_actual: parseInt(editFormData.quantity_actual) || 0,
                              quantity_minimal: parseInt(editFormData.quantity_minimal) || 0,
                              purchase_price: parseFloat(editFormData.purchase_price) || 0,
                              selling_price: parseFloat(editFormData.selling_price) || 0,
                              mark_id: editFormData.mark_id || null,
                              connector_type_id: editFormData.connector_type_id || null,
                            })
                            .eq('id', selectedCharger.id);

                          if (error) throw error;
                          setIsEditingDetail(false);
                          loadChargers();
                          alert(language === 'en' ? 'Updated successfully!' : 'Mis à jour avec succès!');
                        } catch (error) {
                          alert(language === 'en' ? 'Error updating: ' : 'Erreur de mise à jour: ' + error);
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {language === 'en' ? 'Save' : 'Enregistrer'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedCharger(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Image Section */}
              {selectedCharger.primary_image && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {language === 'en' ? 'Product Image' : 'Image du Produit'}
                  </h3>
                  <img
                    src={selectedCharger.primary_image}
                    alt={selectedCharger.name}
                    className="w-full h-80 object-cover rounded-lg"
                    onError={(e) => {
                      console.warn(`Failed to load image: ${selectedCharger.primary_image}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Product Name' : 'Nom du Produit'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Brand' : 'Marque'}
                  </label>
                  {isEditingDetail ? (
                    <select
                      value={editFormData.mark_id || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, mark_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {language === 'en' ? 'Select Brand' : 'Sélectionner une Marque'}
                      </option>
                      {marks.map((mark) => (
                        <option key={mark.id} value={mark.id}>
                          {mark.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-700">{selectedCharger.mark?.name || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Connector Type' : 'Type de Connecteur'}
                  </label>
                  {isEditingDetail ? (
                    <select
                      value={editFormData.connector_type_id || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, connector_type_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {language === 'en' ? 'Select Type' : 'Sélectionner un Type'}
                      </option>
                      {connectorTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-700">{selectedCharger.connector_type?.name || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {language === 'en' ? 'Model Number' : 'Numéro de Modèle'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="text"
                      value={editFormData.model_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, model_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.model_number || '-'}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {language === 'en' ? 'Description' : 'Description'}
                </label>
                {isEditingDetail ? (
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  />
                ) : (
                  <p className="text-gray-700">{selectedCharger.description || '-'}</p>
                )}
              </div>

              {/* Technical Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    ⚡ {language === 'en' ? 'Voltage' : 'Tension'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="number"
                      value={editFormData.voltage || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, voltage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.voltage}V</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    💡 {language === 'en' ? 'Wattage' : 'Puissance'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="number"
                      value={editFormData.wattage || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, wattage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.wattage}W</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    🔌 {language === 'en' ? 'Amperage' : 'Ampérage'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="number"
                      value={editFormData.amperage || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, amperage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.amperage}A</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    📊 {language === 'en' ? 'Margin' : 'Marge'}
                  </label>
                  <p className="text-gray-700">{selectedCharger.margin.toFixed(2)}%</p>
                </div>
              </div>

              {/* Stock & Price */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    📦 {language === 'en' ? 'Stock' : 'Stock'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="number"
                      value={editFormData.quantity_actual || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity_actual: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.quantity_actual}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    ⚠️ {language === 'en' ? 'Min Stock' : 'Stock Min'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="number"
                      value={editFormData.quantity_minimal || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity_minimal: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.quantity_minimal}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    💵 {language === 'en' ? 'Cost' : 'Coût'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="number"
                      value={editFormData.purchase_price || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, purchase_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.purchase_price.toFixed(2)} DA</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    💰 {language === 'en' ? 'Price' : 'Prix'}
                  </label>
                  {isEditingDetail ? (
                    <input
                      type="number"
                      value={editFormData.selling_price || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, selling_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700">{selectedCharger.selling_price.toFixed(2)} DA</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ChargerInventory;
