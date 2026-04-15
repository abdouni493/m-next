import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Mail,
  X,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  bank_account?: string;
  is_active: boolean;
  created_at: string;
}

const SuppliersPage = () => {
  const { language } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    tax_id: '',
    bank_account: '',
  });

  // Load suppliers
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      console.log('📦 Loading suppliers from database...');
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error loading suppliers:', error);
        setSuppliers([]);
        return;
      }
      
      console.log('✅ Suppliers loaded successfully:', data);
      setSuppliers(data || []);
    } catch (error) {
      console.error('❌ Exception loading suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      tax_id: '',
      bank_account: '',
    });
    setEditingSupplier(null);
    setShowAddModal(true);
  };

  const handleOpenHistoryModal = (supplier: Supplier) => {
    // TODO: Show purchase history for this supplier
    console.log('Show history for:', supplier.name);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      tax_id: supplier.tax_id || '',
      bank_account: supplier.bank_account || '',
    });
    setEditingSupplier(supplier);
    setShowAddModal(true);
  };

  const handleSaveSupplier = async () => {
    try {
      if (!formData.name) {
        alert(language === 'en' ? 'Supplier name is required' : 'Le nom du fournisseur est requis');
        return;
      }
      if (!formData.phone) {
        alert(language === 'en' ? 'Phone number is required' : 'Le numéro de téléphone est requis');
        return;
      }
      if (!formData.address) {
        alert(language === 'en' ? 'Address is required' : 'L\'adresse est requise');
        return;
      }

      const supplierData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };

      if (editingSupplier) {
        // Update
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('suppliers')
          .insert([{ ...supplierData, is_active: true }]);

        if (error) throw error;
      }

      setShowAddModal(false);
      loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert(language === 'en' ? 'Error saving supplier' : 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm(language === 'en' ? 'Are you sure?' : 'Êtes-vous sûr?')) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      loadSuppliers();
      alert(
        language === 'en'
          ? 'Supplier deleted successfully!'
          : 'Fournisseur supprimé avec succès!'
      );
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert(language === 'en' ? 'Error deleting supplier' : 'Erreur lors de la suppression');
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            🏭 {language === 'en' ? 'Suppliers Management' : 'Gestion des Fournisseurs'}
          </h1>
          <p className="text-slate-600">
            {language === 'en'
              ? `📊 ${suppliers.length} suppliers in your network`
              : `📊 ${suppliers.length} fournisseurs dans votre réseau`}
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="h-[46px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-base font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          ➕ {language === 'en' ? 'Add Supplier' : 'Ajouter Fournisseur'}
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              language === 'en'
                ? '🔍 Search by name, phone, city...'
                : '🔍 Rechercher par nom, téléphone, ville...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow text-slate-900 dark:text-white"
          />
        </div>
      </motion.div>

      {/* Suppliers List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredSuppliers.map((supplier, index) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-200 hover:border-blue-200 transition-all"
            >
              {/* Header with color-coded top */}
              <div className="mb-4 pb-4 border-b-2 border-gradient-to-r from-blue-200 to-indigo-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      🏭 {supplier.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenHistoryModal(supplier)}
                      title={language === 'en' ? 'Purchase History' : 'Historique d\'Achats'}
                      className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg hover:shadow-md transition-all"
                    >
                      <span className="text-lg">📊</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(supplier)}
                      title={language === 'en' ? 'Edit' : 'Modifier'}
                      className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg hover:shadow-md transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      title={language === 'en' ? 'Delete' : 'Supprimer'}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg hover:shadow-md transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Info with colored sections */}
              <div className="space-y-3">
                {supplier.phone && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-xs text-green-600 font-semibold uppercase">{language === 'en' ? 'Phone' : 'Téléphone'}</p>
                      <a href={`tel:${supplier.phone}`} className="text-green-900 font-semibold hover:text-green-700">
                        {supplier.phone}
                      </a>
                    </div>
                  </div>
                )}

                {supplier.address && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-red-600 font-semibold uppercase">{language === 'en' ? 'Address' : 'Adresse'}</p>
                      <p className="text-red-900 font-semibold text-sm">
                        {supplier.address}
                        {supplier.city && ` · ${supplier.city}`}
                        {supplier.country && ` · ${supplier.country}`}
                      </p>
                    </div>
                  </div>
                )}

                {supplier.email && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-semibold uppercase">Email</p>
                      <a href={`mailto:${supplier.email}`} className="text-blue-900 font-semibold hover:text-blue-700 text-sm truncate">
                        {supplier.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer action */}
              <button
                onClick={() => handleOpenEditModal(supplier)}
                className="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>✏️</span>
                {language === 'en' ? 'Edit Supplier' : 'Modifier'}
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {language === 'en'
              ? 'No suppliers found. Create your first supplier!'
              : 'Aucun fournisseur trouvé. Créez votre premier fournisseur!'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal - Simplified */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-slate-900">
                {editingSupplier
                  ? '✏️ ' + (language === 'en' ? 'Edit Supplier' : 'Modifier Fournisseur')
                  : '➕ ' + (language === 'en' ? 'Add New Supplier' : 'Ajouter Nouveau Fournisseur')}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Full Name Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
              >
                <h3 className="text-lg font-bold text-blue-900 mb-4">🏭 {language === 'en' ? 'Supplier Name' : 'Nom du Fournisseur'}</h3>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g., Tech Supplies Inc.' : 'Ex: Tech Supplies Inc.'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 font-semibold text-lg text-slate-900 dark:text-white"
                />
              </motion.div>

              {/* Phone Number Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200"
              >
                <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-4">📞 {language === 'en' ? 'Phone Number' : 'Numéro de Téléphone'}</h3>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-green-300 dark:border-green-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 font-semibold text-lg text-slate-900 dark:text-white"
                />
              </motion.div>

              {/* Address Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200"
              >
                <h3 className="text-lg font-bold text-red-900 mb-4">📍 {language === 'en' ? 'Address' : 'Adresse'}</h3>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-red-900 dark:text-red-300">{language === 'en' ? 'Address' : 'Adresse'}</label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Street address' : 'Adresse'}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-red-300 dark:border-red-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-700 font-semibold text-lg text-slate-900 dark:text-white"
                  />
                </div>
              </motion.div>

              {/* Optional Fields */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200"
              >
                <p className="text-sm text-gray-600 italic">
                  ✅ {language === 'en' ? 'All required information provided' : 'Toutes les informations requises fournies'}
                </p>
              </motion.div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSaveSupplier}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg h-12 font-bold text-base"
                >
                  💾 {language === 'en' ? 'Save Supplier' : 'Enregistrer'}
                </Button>
                <Button
                  onClick={() => setShowAddModal(false)}
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
    </div>
  );
};

export default SuppliersPage;