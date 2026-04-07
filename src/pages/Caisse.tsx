import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Calendar,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface CaisseTransaction {
  id: string;
  transaction_type: 'encaissement' | 'decaissement';
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
  is_active: boolean;
}

interface CaisseSummary {
  total_encaissements: number;
  total_decaissements: number;
  balance: number;
  total_transactions: number;
}

interface FormData {
  transaction_type: 'encaissement' | 'decaissement';
  amount: string;
  description: string;
  transaction_date: string;
}

const Caisse = () => {
  const { language, isRTL } = useLanguage();
  const [transactions, setTransactions] = useState<CaisseTransaction[]>([]);
  const [summary, setSummary] = useState<CaisseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CaisseTransaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<FormData>({
    transaction_type: 'encaissement',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const t = {
    en: {
      title: 'Cash Register',
      subtitle: 'Manage your cash flow',
      add_transaction: 'Add Transaction',
      encaissement: 'Deposit',
      decaissement: 'Withdrawal',
      balance: 'Balance',
      total_deposits: 'Total Deposits',
      total_withdrawals: 'Total Withdrawals',
      amount: 'Amount',
      description: 'Description',
      date: 'Date',
      save: 'Save Transaction',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      delete_confirm: 'Delete Transaction?',
      confirm_message: 'This action cannot be undone.',
      yes: 'Yes, Delete',
      no: 'No, Cancel',
      transaction_deleted: 'Transaction deleted successfully',
      transaction_saved: 'Transaction saved successfully',
      error: 'Error',
      no_transactions: 'No transactions yet',
      start_transaction: 'Start by adding your first transaction',
      search: 'Search transactions...',
    },
    fr: {
      title: 'Caisse',
      subtitle: 'Gérez votre trésorerie',
      add_transaction: 'Ajouter une Transaction',
      encaissement: 'Encaissement',
      decaissement: 'Décaissement',
      balance: 'Solde',
      total_deposits: 'Total Encaissements',
      total_withdrawals: 'Total Décaissements',
      amount: 'Montant',
      description: 'Description',
      date: 'Date',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      delete_confirm: 'Supprimer la transaction?',
      confirm_message: 'Cette action ne peut pas être annulée.',
      yes: 'Oui, Supprimer',
      no: 'Non, Annuler',
      transaction_deleted: 'Transaction supprimée avec succès',
      transaction_saved: 'Transaction enregistrée avec succès',
      error: 'Erreur',
      no_transactions: 'Aucune transaction',
      start_transaction: 'Commencez par ajouter votre première transaction',
      search: 'Rechercher des transactions...',
    },
    ar: {
      title: 'الصندوق',
      subtitle: 'إدارة تدفق النقد',
      add_transaction: 'إضافة معاملة',
      encaissement: 'إيداع',
      decaissement: 'سحب',
      balance: 'الرصيد',
      total_deposits: 'إجمالي الإيداعات',
      total_withdrawals: 'إجمالي السحوبات',
      amount: 'المبلغ',
      description: 'الوصف',
      date: 'التاريخ',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      delete_confirm: 'حذف المعاملة؟',
      confirm_message: 'لا يمكن التراجع عن هذا الإجراء.',
      yes: 'نعم، احذف',
      no: 'لا، إلغاء',
      transaction_deleted: 'تم حذف المعاملة بنجاح',
      transaction_saved: 'تم حفظ المعاملة بنجاح',
      error: 'خطأ',
      no_transactions: 'لا توجد معاملات',
      start_transaction: 'ابدأ بإضافة معاملتك الأولى',
      search: 'البحث عن المعاملات...',
    },
  };

  const getText = (key: keyof typeof t.en) => {
    return t[language as keyof typeof t]?.[key] || t.en[key];
  };

  useEffect(() => {
    loadTransactions();
    loadSummary();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('caisse_transactions')
        .select('*')
        .eq('is_active', true)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error(getText('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('caisse_summary')
        .select('*')
        .single();

      if (error) throw error;
      setSummary(data);
    } catch (error: any) {
      console.error('Error loading summary:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.description || !formData.transaction_date) {
      toast.error(getText('error'));
      return;
    }

    try {
      if (isEditingMode && selectedTransaction) {
        const { error } = await supabase
          .from('caisse_transactions')
          .update({
            transaction_type: formData.transaction_type,
            amount: parseFloat(formData.amount),
            description: formData.description,
            transaction_date: new Date(formData.transaction_date).toISOString(),
          })
          .eq('id', selectedTransaction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('caisse_transactions')
          .insert([{
            transaction_type: formData.transaction_type,
            amount: parseFloat(formData.amount),
            description: formData.description,
            transaction_date: new Date(formData.transaction_date).toISOString(),
          }]);

        if (error) throw error;
      }

      toast.success(getText('transaction_saved'));
      resetForm();
      setShowAddModal(false);
      await loadTransactions();
      await loadSummary();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast.error(getText('error'));
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const { error } = await supabase
        .from('caisse_transactions')
        .update({ is_active: false })
        .eq('id', transactionToDelete);

      if (error) throw error;

      toast.success(getText('transaction_deleted'));
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      await loadTransactions();
      await loadSummary();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error(getText('error'));
    }
  };

  const handleEditTransaction = (transaction: CaisseTransaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      transaction_type: transaction.transaction_type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      transaction_date: transaction.transaction_date.split('T')[0],
    });
    setIsEditingMode(true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      transaction_type: 'encaissement',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
    });
    setSelectedTransaction(null);
    setIsEditingMode(false);
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.amount.toString().includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              💰 {getText('title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">{getText('subtitle')}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            {getText('add_transaction')}
          </motion.button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-6 rounded-xl border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{getText('balance')}</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    💵 {summary.balance.toFixed(2)} DZD
                  </p>
                </div>
                <div className="text-5xl opacity-50">📊</div>
              </div>
            </motion.div>

            {/* Total Deposits */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{getText('total_deposits')}</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    ⬆️ {summary.total_encaissements.toFixed(2)} DZD
                  </p>
                </div>
                <div className="text-5xl opacity-50">📈</div>
              </div>
            </motion.div>

            {/* Total Withdrawals */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 p-6 rounded-xl border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{getText('total_withdrawals')}</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                    ⬇️ {summary.total_decaissements.toFixed(2)} DZD
                  </p>
                </div>
                <div className="text-5xl opacity-50">📉</div>
              </div>
            </motion.div>

            {/* Total Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">📝 {language === 'en' ? 'Transactions' : language === 'fr' ? 'Transactions' : 'المعاملات'}</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {summary.total_transactions}
                  </p>
                </div>
                <div className="text-5xl opacity-50">📋</div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={getText('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">{language === 'en' ? 'Loading...' : language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">{getText('no_transactions')}</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">{getText('start_transaction')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-l-4 hover:shadow-xl transition-all h-full ${
                  transaction.transaction_type === 'encaissement'
                    ? 'border-l-green-500 bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-green-900/20'
                    : 'border-l-red-500 bg-gradient-to-br from-white to-red-50 dark:from-slate-800 dark:to-red-900/20'
                }`}>
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={isRTL ? 'text-right' : ''}>
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-3xl">
                            {transaction.transaction_type === 'encaissement' ? '💚' : '❤️'}
                          </span>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {transaction.transaction_type === 'encaissement' ? getText('encaissement') : getText('decaissement')}
                          </h3>
                        </div>
                        <p className={`text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-2 rounded-lg text-sm font-bold ${
                        transaction.transaction_type === 'encaissement'
                          ? 'bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : 'bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      }`}>
                        {transaction.amount.toFixed(2)} DZD
                      </span>
                    </div>

                    {/* Description */}
                    <div className={`bg-slate-100 dark:bg-slate-700/30 rounded-lg p-3 mb-4 border border-slate-200 dark:border-slate-600 ${isRTL ? 'text-right' : ''}`}>
                      <p className={`text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <FileText className="w-3 h-3" />
                        {getText('description')}
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{transaction.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        {getText('edit')}
                      </button>
                      <button
                        onClick={() => {
                          setTransactionToDelete(transaction.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {getText('delete')}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-8"
          >
            <div className={`flex justify-between items-start mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isEditingMode ? '✏️ ' : '➕ '}
                {isEditingMode ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
                className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  {getText('encaissement')} / {getText('decaissement')}
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as 'encaissement' | 'decaissement' })}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="encaissement">💚 {getText('encaissement')}</option>
                  <option value="decaissement">❤️ {getText('decaissement')}</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  {getText('amount')} (DZD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  {getText('description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  {getText('date')}
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {getText('cancel')}
              </button>
              <button
                onClick={handleAddTransaction}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                {getText('save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-sm w-full p-6"
          >
            <div className="flex justify-center mb-4">
              <div className="text-5xl">⚠️</div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
              {getText('delete_confirm')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
              {getText('confirm_message')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTransactionToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {getText('no')}
              </button>
              <button
                onClick={handleDeleteTransaction}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                {getText('yes')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Caisse;
