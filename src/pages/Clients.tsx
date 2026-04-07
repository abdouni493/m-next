import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  History,
  Phone,
  User,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  price_tier: number;
  client_type: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  total_purchases?: number;
  total_spent?: number;
  last_purchase_date?: string;
}

interface ClientFormData {
  name: string;
  phone: string;
  price_tier: number;
  notes: string;
}

const Clients = () => {
  const { language } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    price_tier: 1,
    notes: '',
  });

  // Load clients
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          phone,
          email,
          price_tier,
          client_type,
          notes,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load purchase summary for each client
      const clientsWithStats = await Promise.all(
        (data || []).map(async (client) => {
          // Query invoices table to calculate totals
          const { data: invoices } = await supabase
            .from('invoices')
            .select('total_amount, invoice_date')
            .eq('customer_id', client.id)
            .eq('type', 'sale');

          const total_purchases = invoices?.length || 0;
          const total_spent = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
          const last_purchase_date = invoices && invoices.length > 0 
            ? invoices[0].invoice_date 
            : null;

          return {
            ...client,
            total_purchases,
            total_spent,
            last_purchase_date,
          };
        })
      );

      setClients(clientsWithStats);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      if (!formData.name.trim() || !formData.phone.trim()) {
        toast.error('Name and phone number are required');
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            price_tier: formData.price_tier,
            notes: formData.notes.trim() || null,
            is_active: true,
          },
        ])
        .select();

      if (error) throw error;

      toast.success('Client created successfully');
      resetForm();
      setShowAddModal(false);
      loadClients();
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    }
  };

  const handleUpdateClient = async () => {
    try {
      if (!selectedClient) return;
      if (!formData.name.trim() || !formData.phone.trim()) {
        toast.error('Name and phone number are required');
        return;
      }

      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          price_tier: formData.price_tier,
          notes: formData.notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast.success('Client updated successfully');
      resetForm();
      setIsEditingMode(false);
      setSelectedClient(null);
      loadClients();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
  };

  const handleDeleteClient = async () => {
    try {
      if (!clientToDelete) return;

      const { error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', clientToDelete);

      if (error) throw error;

      toast.success('Client deleted successfully');
      setShowDeleteConfirm(false);
      setClientToDelete(null);
      loadClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleViewHistory = async (client: Client) => {
    try {
      setHistoryLoading(true);
      setSelectedClient(client);

      // Query invoices table for sales made by this customer
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', client.id)
        .eq('type', 'sale')
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      setClientHistory(data || []);
      setShowHistoryModal(true);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error('Failed to load purchase history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      price_tier: client.price_tier,
      notes: client.notes || '',
    });
    setIsEditingMode(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      price_tier: 1,
      notes: '',
    });
    setSelectedClient(null);
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  const getPriceTierName = (tier: number) => {
    const names: Record<number, string> = {
      1: 'Normal',
      2: 'Revendeur',
      3: 'Gros',
    };
    return names[tier] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">👥 Clients</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {clients.length} clients registered
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsEditingMode(false);
            setShowAddModal(true);
          }}
          className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="w-4 h-4" />
          Add New Client
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {searchTerm ? 'No clients found matching your search' : 'No clients registered yet'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-cyan-500 dark:border-cyan-600 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700">
                <CardContent className="p-6">
                  {/* Client Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div 
                          className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                          whileHover={{ scale: 1.1 }}
                        >
                          {client.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-lg">
                            {client.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="text-center"
                    >
                      <span className="inline-block px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 text-cyan-700 dark:text-cyan-300 shadow-sm">
                        {getPriceTierName(client.price_tier) === 'Normal' && '💙'}
                        {getPriceTierName(client.price_tier) === 'Revendeur' && '🟨'}
                        {getPriceTierName(client.price_tier) === 'Gros' && '📦'}
                        {' '}{getPriceTierName(client.price_tier)}
                      </span>
                    </motion.div>
                  </div>

                  {/* Client Stats */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-4 space-y-2 border border-cyan-200 dark:border-cyan-800"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">📊 Purchases:</span>
                      <span className="font-bold text-cyan-700 dark:text-cyan-300">
                        {client.total_purchases || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">💰 Total Spent:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {(client.total_spent || 0).toFixed(2)} DZD
                      </span>
                    </div>
                    {client.last_purchase_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">📅 Last Purchase:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-200">
                          {new Date(client.last_purchase_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </motion.div>

                  {/* Notes */}
                  {client.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 italic bg-slate-100 dark:bg-slate-700 p-2 rounded">
                      📝 {client.notes}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewHistory(client)}
                        className="w-full gap-2 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <History className="w-4 h-4" />
                        📜
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClient(client)}
                        className="w-full gap-2 border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                      >
                        <Edit2 className="w-4 h-4" />
                        ✏️
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        onClick={() => {
                          setClientToDelete(client.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                        🗑️
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showAddModal || isEditingMode ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  {isEditingMode ? '✏️ Edit Client' : '👤 Add New Client'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  {isEditingMode ? 'Update client information' : 'Register a new customer'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditingMode(false);
                  resetForm();
                }}
                className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Name */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  👤 {language === 'en' ? 'Full Name' : 'Nom Complet'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-cyan-200 dark:border-cyan-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder={language === 'en' ? 'Client name' : 'Nom du client'}
                />
              </motion.div>

              {/* Phone */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  📞 {language === 'en' ? 'Phone Number' : 'Numéro de Téléphone'} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-cyan-200 dark:border-cyan-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="+213 555 123456"
                />
              </motion.div>

              {/* Price Tier */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  💰 {language === 'en' ? 'Price Tier' : 'Niveau de Prix'} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 1, label: '💙 Normal', color: 'blue' },
                    { value: 2, label: '🟨 Revendeur', color: 'amber' },
                    { value: 3, label: '📦 Gros', color: 'green' }
                  ].map((tier) => (
                    <button
                      key={tier.value}
                      onClick={() => setFormData({ ...formData, price_tier: tier.value })}
                      className={`relative px-3 py-3 rounded-lg font-medium text-sm transition-all transform hover:scale-105 ${
                        formData.price_tier === tier.value
                          ? `bg-${tier.color}-500 text-white shadow-lg ring-2 ring-${tier.color}-300`
                          : `bg-${tier.color}-50 dark:bg-${tier.color}-900/20 text-${tier.color}-700 dark:text-${tier.color}-300 border border-${tier.color}-200 dark:border-${tier.color}-700 hover:bg-${tier.color}-100 dark:hover:bg-${tier.color}-900/30`
                      }`}
                    >
                      {tier.label}
                      {formData.price_tier === tier.value && (
                        <motion.div
                          layoutId="activePriceTier"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent to-white/20 pointer-events-none"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  📝 {language === 'en' ? 'Notes' : 'Remarques'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-cyan-200 dark:border-cyan-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                  placeholder={language === 'en' ? 'Add any notes about this client...' : 'Ajoutez des remarques sur ce client...'}
                />
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="flex-1"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditingMode(false);
                    resetForm();
                  }}
                  className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕ {language === 'en' ? 'Cancel' : 'Annuler'}
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex-1"
              >
                <Button
                  onClick={
                    isEditingMode ? handleUpdateClient : handleAddClient
                  }
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {isEditingMode ? '💾 Update' : '✚ Create'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      ) : null}

      {/* Purchase History Modal */}
      {showHistoryModal && selectedClient ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 border border-slate-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  📜 Purchase History
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {selectedClient.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setClientHistory([]);
                }}
                className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="text-center py-12"
              >
                <div className="text-5xl mb-4">⏳</div>
                <p className="text-slate-600 dark:text-slate-400">
                  {language === 'en' ? 'Loading purchase history...' : 'Chargement de l\'historique...'}
                </p>
              </motion.div>
            ) : clientHistory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-5xl mb-4">📭</p>
                <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">
                  {language === 'en' ? 'No purchase history' : 'Aucun historique d\'achat'}
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  {language === 'en' ? 'This client hasn\'t made any purchases yet.' : 'Ce client n\'a pas encore effectué d\'achats.'}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {clientHistory.map((purchase, idx) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-all bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 hover:border-purple-300 dark:hover:border-purple-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>🧾</span> Invoice: {purchase.invoice_number}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          <span className="inline-block">📅 {new Date(purchase.invoice_date).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold ${
                          purchase.status === 'paid'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300'
                            : 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 text-yellow-700 dark:text-yellow-300'
                        }`}
                      >
                        {purchase.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                      </motion.span>
                    </div>
                    <div className="text-right pt-2 border-t border-slate-200 dark:border-slate-600">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Amount</p>
                      <p className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        💰 {purchase.total_amount.toFixed(2)} DZD
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-sm w-full p-6"
          >
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
              Delete Client?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setClientToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteClient}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Clients;
