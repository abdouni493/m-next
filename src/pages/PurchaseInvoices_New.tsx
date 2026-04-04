import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  X,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

interface Charger {
  id: string;
  name: string;
  connector_type?: { name: string };
  mark?: { name: string };
  voltage: number;
  wattage: number;
  amperage: number;
  model_number?: string;
  purchase_price: number;
  quantity_actual?: number;
}

interface InvoiceItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name?: string;
  invoice_date: string;
  due_date?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
}

interface Supplier {
  id: string;
  name: string;
}

const PurchaseInvoicesPage = () => {
  const { language } = useLanguage();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    items: [] as InvoiceItem[],
    discount_amount: 0,
    notes: '',
  });

  const [itemForm, setItemForm] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0,
  });

  const [chargerSearch, setChargerSearch] = useState('');
  const [filteredChargers, setFilteredChargers] = useState<Charger[]>([]);

  // Load data
  useEffect(() => {
    loadInvoices();
    loadSuppliers();
    loadChargers();
  }, []);

  // Filter chargers when search changes
  useEffect(() => {
    if (chargerSearch.trim()) {
      setFilteredChargers(
        chargers.filter((c) =>
          c.name.toLowerCase().includes(chargerSearch.toLowerCase()) ||
          c.mark?.name.toLowerCase().includes(chargerSearch.toLowerCase())
        )
      );
    } else {
      setFilteredChargers([]);
    }
  }, [chargerSearch, chargers]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadChargers = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, purchase_price, voltage, wattage, amperage, model_number, connector_type_id, mark_id')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Enrich with mark and connector type info
      const enriched = await Promise.all(
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

          return {
            ...charger,
            mark,
            connector_type: connectorType,
          };
        })
      );

      setChargers(enriched);
    } catch (error) {
      console.error('Error loading chargers:', error);
    }
  };

  const addItemToInvoice = () => {
    if (!itemForm.product_id) {
      alert('Please select a charger');
      return;
    }

    const charger = chargers.find((c) => c.id === itemForm.product_id);
    if (!charger) return;

    const newItem: InvoiceItem = {
      product_id: charger.id,
      product_name: charger.name,
      quantity: itemForm.quantity,
      unit_price: itemForm.unit_price || charger.purchase_price,
      total_price: (itemForm.unit_price || charger.purchase_price) * itemForm.quantity,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });

    setItemForm({
      product_id: '',
      quantity: 1,
      unit_price: 0,
    });
    setChargerSearch('');
  };

  const removeItemFromInvoice = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - formData.discount_amount;
  };

  const handleSaveInvoice = async () => {
    try {
      if (!formData.supplier_id) {
        alert('Please select a supplier');
        return;
      }

      if (formData.items.length === 0) {
        alert('Please add at least one charger');
        return;
      }

      const invoiceNumber = `PI-${Date.now()}`;
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      const { data: invoice, error } = await supabase
        .from('purchase_invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            supplier_id: formData.supplier_id,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date || null,
            items: formData.items,
            subtotal,
            discount_amount: formData.discount_amount,
            total_amount: total,
            status: 'pending',
            notes: formData.notes,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update product quantities
      for (const item of formData.items) {
        const currentCharger = chargers.find((c) => c.id === item.product_id);
        if (currentCharger) {
          const newQuantity = (currentCharger.quantity_actual || 0) + item.quantity;
          await supabase
            .from('products')
            .update({ quantity_actual: newQuantity })
            .eq('id', item.product_id);
        }
      }

      setFormData({
        supplier_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        items: [],
        discount_amount: 0,
        notes: '',
      });

      setShowAddModal(false);
      loadInvoices();
      loadChargers();
      alert('Invoice created successfully!');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error creating invoice');
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCharger = chargers.find((c) => c.id === itemForm.product_id);

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
            {language === 'en' ? 'Purchase Invoices' : 'Factures d\'Achat'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'en'
              ? `${filteredInvoices.length} invoices`
              : `${filteredInvoices.length} factures`}
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === 'en' ? 'New Invoice' : 'Nouvelle Facture'}
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              language === 'en'
                ? 'Search by invoice number or supplier...'
                : 'Rechercher par numéro ou fournisseur...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </motion.div>

      {/* Invoices List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {filteredInvoices.map((invoice) => (
            <motion.div
              key={invoice.id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {invoice.invoice_number}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {invoice.supplier_name} • {new Date(invoice.invoice_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : invoice.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {invoice.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowDetailModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-gray-600 text-sm">
                    {language === 'en' ? 'Items' : 'Produits'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {invoice.items?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">
                    {language === 'en' ? 'Subtotal' : 'Sous-total'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${invoice.subtotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">
                    {language === 'en' ? 'Total' : 'Total'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${invoice.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'en'
              ? 'No invoices found. Create your first purchase invoice!'
              : 'Aucune facture trouvée. Créez votre première facture!'}
          </p>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full my-8"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'New Purchase Invoice' : 'Nouvelle Facture d\'Achat'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Supplier Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Supplier' : 'Fournisseur'} *
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">
                      {language === 'en' ? 'Select Supplier' : 'Sélectionnez Fournisseur'}
                    </option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Invoice Date' : 'Date Facture'} *
                  </label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, invoice_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {language === 'en' ? 'Due Date' : 'Date Limite'}
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Add Items Section */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === 'en' ? 'Add Chargers' : 'Ajouter Chargeurs'}
                </h3>

                {/* Charger Search and Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {language === 'en' ? 'Search Charger' : 'Rechercher Chargeur'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={
                        language === 'en'
                          ? 'Start typing charger name...'
                          : 'Commencez à taper...'
                      }
                      value={chargerSearch}
                      onChange={(e) => setChargerSearch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {filteredChargers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredChargers.map((charger) => (
                          <button
                            key={charger.id}
                            onClick={() => {
                              setItemForm({
                                ...itemForm,
                                product_id: charger.id,
                                unit_price: charger.purchase_price,
                              });
                              setChargerSearch('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b"
                          >
                            <p className="font-semibold">{charger.name}</p>
                            <p className="text-sm text-gray-600">
                              {charger.mark?.name} • {charger.voltage}V {charger.wattage}W
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Charger Details */}
                {selectedCharger && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-gray-900">{selectedCharger.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <span className="font-semibold">V:</span> {selectedCharger.voltage}V
                      </p>
                      <p>
                        <span className="font-semibold">W:</span> {selectedCharger.wattage}W
                      </p>
                      <p>
                        <span className="font-semibold">A:</span> {selectedCharger.amperage}A
                      </p>
                    </div>
                  </div>
                )}

                {/* Quantity and Price */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      {language === 'en' ? 'Quantity' : 'Quantité'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={itemForm.quantity}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      {language === 'en' ? 'Unit Price' : 'Prix Unitaire'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.unit_price}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          unit_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      {language === 'en' ? 'Add Item' : 'Ajouter Article'}
                    </label>
                    <Button
                      onClick={addItemToInvoice}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">
                          {language === 'en' ? 'Product' : 'Produit'}
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold">
                          {language === 'en' ? 'Qty' : 'Qté'}
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold">
                          {language === 'en' ? 'Price' : 'Prix'}
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold">
                          {language === 'en' ? 'Total' : 'Total'}
                        </th>
                        <th className="px-4 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2 text-sm">{item.product_name}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-center">${item.unit_price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center font-semibold">
                            ${item.total_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => removeItemFromInvoice(idx)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary */}
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {language === 'en' ? 'Subtotal' : 'Sous-total'}
                  </span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <label className="font-semibold">
                    {language === 'en' ? 'Discount' : 'Remise'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                  />
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>{language === 'en' ? 'Total' : 'Total'}</span>
                  <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {language === 'en' ? 'Notes' : 'Notes'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder={
                    language === 'en'
                      ? 'Optional notes...'
                      : 'Notes optionnelles...'
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  onClick={handleSaveInvoice}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {language === 'en' ? 'Create Invoice' : 'Créer Facture'}
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
    </div>
  );
};

export default PurchaseInvoicesPage;
