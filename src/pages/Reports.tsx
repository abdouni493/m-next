import { useState } from 'react';
import {
  Download,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  FileText,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';

// --- Type Definitions ---
interface ReportStats {
  totalSales: number;
  totalPurchases: number;
  netProfit: number;
  productsCount: number;
  suppliersCount: number;
  lowStockCount: number;
  salesCount: number;
  purchasesCount: number;
  totalPaid: number;
  totalUnpaid: number;
}

interface Invoice {
  id: string;
  supplier_name: string;
  total_amount: number;
  amount_paid: number;
  status: string;
  invoice_date: string;
  type: string;
}

interface Product {
  id: string;
  name: string;
  current_quantity: number;
  min_quantity: number;
  category: string;
  buying_price?: number;
  selling_price?: number;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
}

interface Payment {
  id: string;
  employee_id: string;
  amount: number;
  date: string;
  description: string;
}

interface CaisseTransaction {
  id: string;
  transaction_type: 'encaissement' | 'decaissement';
  amount: number;
  description: string;
  transaction_date: string;
  discount_applied?: number;
  created_at: string;
}

// Helper Components
const ReportSection = ({ icon, title, children, delay = 0 }: { icon: string; title: string; children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow bg-card">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <span className="text-xl font-bold">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

const StatBox = ({ icon, label, value, color = 'blue', subtext = '' }: { icon: string; label: string; value: string; color?: string; subtext?: string }) => {
  const colorMap = {
    blue: '',
    green: '',
    orange: '',
    red: '',
    purple: '',
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={`bg-card ${colorMap[color as keyof typeof colorMap]} text-white p-8 rounded-xl shadow-sm border-2 border-white/20`}
    >
      <p className="text-5xl mb-3">{icon}</p>
      <p className="text-sm text-white/80 mb-3 font-semibold">{label}</p>
      <p className="text-4xl font-bold mb-2">{value}</p>
      {subtext && <p className="text-xs text-white/70">{subtext}</p>}
    </motion.div>
  );
};


export default function Reports() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [caisseTransactions, setCaisseTransactions] = useState<CaisseTransaction[]>([]);
  const [showInventoryValuation, setShowInventoryValuation] = useState(false);

  const getText = (key: string) => {
    const texts: {[key: string]: {ar: string; fr: string}} = {
      reports: { ar: 'التقارير والتحليلات', fr: 'Rapports & Analyses' },
      reportDesc: { ar: 'أنشئ واعرض تقاريرك المفصلة', fr: 'Générez et consultez vos rapports détaillés' },
      selectDate: { ar: 'اختر فترة التقرير', fr: 'Sélectionner la Période' },
      startDate: { ar: 'تاريخ البدء', fr: 'Date de Début' },
      endDate: { ar: 'تاريخ الانتهاء', fr: 'Date de Fin' },
      generate: { ar: 'إنشاء التقرير', fr: 'Générer Rapport' },
      download: { ar: 'تحميل PDF', fr: 'Télécharger PDF' },
      newReport: { ar: 'تقرير جديد', fr: 'Nouveau Rapport' },
      totalSales: { ar: 'إجمالي المبيعات', fr: 'Total Ventes' },
      totalPurchases: { ar: 'إجمالي الشراء', fr: 'Total Achats' },
      profit: { ar: 'الربح الصافي', fr: 'Bénéfice Net' },
      dashboard: { ar: 'لوحة المعلومات', fr: 'Tableau de Bord' },
      inventory: { ar: 'إدارة المخزون', fr: 'Gestion du Stock' },
      purchases: { ar: 'فواتير الشراء', fr: 'Factures d\'Achat' },
      sales: { ar: 'المبيعات', fr: 'Ventes' },
      suppliers: { ar: 'الموردين', fr: 'Fournisseurs' },
      payments: { ar: 'المدفوعات', fr: 'Paiements' },
      loading: { ar: 'جارٍ التحميل...', fr: 'Chargement...' },
      noData: { ar: 'لم يتم العثور على بيانات', fr: 'Aucune donnée trouvée' },
      lowStock: { ar: 'مخزون منخفض', fr: 'Stock bas' },
      products: { ar: 'المنتجات', fr: 'Produits' },
      supplier: { ar: 'المورد', fr: 'Fournisseur' },
      quantity: { ar: 'الكمية', fr: 'Quantité' },
      price: { ar: 'السعر', fr: 'Prix' },
      amount: { ar: 'المبلغ', fr: 'Montant' },
      date: { ar: 'التاريخ', fr: 'Date' },
      status: { ar: 'الحالة', fr: 'Statut' },
      paid: { ar: 'مدفوع', fr: 'Payé' },
      unpaid: { ar: 'غير مدفوع', fr: 'Non payé' },
      total: { ar: 'الإجمالي', fr: 'Total' },
    };
    
    return texts[key]?.[language === 'ar' ? 'ar' : 'fr'] || key;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');

  const generateReport = async () => {
    setIsLoading(true);
    try {
      // Fetch all invoices
      const { data: allInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*');

      if (invoicesError) throw invoicesError;

      // Filter by date range
      const filteredInvoices = (allInvoices || []).filter(inv => {
        const invDate = inv.invoice_date?.split('T')[0];
        return invDate && invDate >= startDate && invDate <= endDate;
      });

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*');

      if (suppliersError) throw suppliersError;

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) throw paymentsError;

      // Fetch Caisse transactions
      const { data: caisseData, error: caisseError } = await supabase
        .from('caisse_transactions')
        .select('*')
        .eq('is_active', true);

      if (caisseError) console.warn('Caisse data fetch warning:', caisseError);
      
      const filteredCaisse = (caisseData || []).filter(trans => {
        const transDate = trans.transaction_date?.split('T')[0];
        return transDate && transDate >= startDate && transDate <= endDate;
      });

      // Calculate statistics
      const purchaseInvoices = filteredInvoices.filter(inv => inv.type === 'purchase');
      const saleInvoices = filteredInvoices.filter(inv => inv.type !== 'purchase');

      const totalSales = saleInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalPaid = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalUnpaid = filteredInvoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const lowStockCount = (productsData || []).filter(p => (p.current_quantity || 0) <= (p.min_quantity || 10)).length;

      setInvoices(filteredInvoices);
      setProducts(productsData || []);
      setSuppliers(suppliersData || []);
      setCaisseTransactions(filteredCaisse);
      setPayments((paymentsData || []).filter(p => {
        const payDate = p.date?.split('T')[0];
        return payDate && payDate >= startDate && payDate <= endDate;
      }));

      setReportData({
        totalSales,
        totalPurchases,
        netProfit: totalSales - totalPurchases,
        productsCount: (productsData || []).length,
        suppliersCount: (suppliersData || []).length,
        lowStockCount,
        salesCount: saleInvoices.length,
        purchasesCount: purchaseInvoices.length,
        totalPaid,
        totalUnpaid,
      });

      setReportGenerated(true);
      
      toast({
        title: language === 'ar' ? 'نجاح' : 'Succès',
        description: language === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Rapport généré avec succès',
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إنشاء التقرير' : 'Erreur lors de la génération',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-8 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-2xl md:text-[28px] tracking-tight font-bold text-foreground">
          {getText('reports')}
        </h1>
        <p className="text-muted-foreground text-lg">{getText('reportDesc')}</p>
      </motion.div>

      {/* Date Selection Section */}
      {!reportGenerated ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="p-5 border-b border-border">
              <CardTitle className="text-lg flex items-center gap-3">
                <span></span>
                {getText('selectDate')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                  <Label className="text-lg font-bold text-foreground flex items-center gap-2">
                    {getText('startDate')}
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-2 border-border focus:border-electric h-12 rounded-lg text-base bg-card"
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                  <Label className="text-lg font-bold text-foreground flex items-center gap-2">
                    {getText('endDate')}
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-2 border-border focus:border-electric h-12 rounded-lg text-base bg-card"
                  />
                </motion.div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} className="pt-6">
                <Button
                  onClick={generateReport}
                  disabled={isLoading}
                  className="w-full text-primary-foreground font-bold py-7 text-xl rounded-xl shadow-sm hover:shadow-3xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 bg-primary"
                >
                  <FileText className="h-6 w-6" />
                  {isLoading ? getText('loading') : getText('generate')}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-10"
        >
          {/* Generate Another + Download Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => setReportGenerated(false)}
              variant="outline"
              className="px-8 py-6 text-lg border-2 border-electric text-electric hover:bg-surface-2"
            >
              <RefreshCw className={`${isRTL ? 'ml-3' : 'mr-3'} h-5 w-5`} />
              {getText('newReport')}
            </Button>
            <Button
              className="text-primary-foreground font-bold px-8 py-6 text-lg rounded-lg shadow-sm hover:shadow-md transition-all bg-primary"
            >
              <Download className={`${isRTL ? 'ml-3' : 'mr-3'} h-5 w-5`} />
              {getText('download')}
            </Button>
          </div>

          {reportData && (
            <>
              {/* Financial Summary Cards - Main KPIs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="absolute inset-0 rounded-2xl blur-xl opacity-30 bg-primary text-primary-foreground"></div>
                  <div className="relative text-primary-foreground p-8 rounded-2xl shadow-sm border-2 border-white/20 bg-primary">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl"></span>
                      <ArrowUpRight className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-primary-foreground text-sm font-semibold mb-2">{getText('totalSales')}</p>
                    <p className="text-4xl font-bold">{formatCurrency(reportData.totalSales)}</p>
                    <p className="text-xs text-primary-foreground mt-3">{reportData.salesCount} {language === 'ar' ? 'معاملة بيع' : 'transactions'}</p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="absolute inset-0 rounded-2xl blur-xl opacity-30 bg-primary text-primary-foreground"></div>
                  <div className="relative text-primary-foreground p-8 rounded-2xl shadow-sm border-2 border-white/20 bg-primary">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl"></span>
                      <ArrowDownLeft className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-primary-foreground text-sm font-semibold mb-2">{getText('totalPurchases')}</p>
                    <p className="text-4xl font-bold">{formatCurrency(reportData.totalPurchases)}</p>
                    <p className="text-xs text-primary-foreground mt-3">{reportData.purchasesCount} {language === 'ar' ? 'فاتورة شراء' : 'factures'}</p>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="absolute inset-0 rounded-2xl blur-xl opacity-30 bg-primary text-primary-foreground"></div>
                  <div className="relative text-primary-foreground p-8 rounded-2xl shadow-sm border-2 border-white/20 bg-primary">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl"></span>
                      <TrendingUp className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-primary-foreground text-sm font-semibold mb-2">{getText('profit')}</p>
                    <p className="text-4xl font-bold">{formatCurrency(reportData.netProfit)}</p>
                    <p className="text-xs text-primary-foreground mt-3">{((reportData.netProfit / (reportData.totalSales || 1)) * 100).toFixed(1)}% {language === 'ar' ? 'هامش ربح' : 'marge'}</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Payment Status Cards */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <motion.div whileHover={{ scale: 1.02 }} className="p-8 rounded-2xl border-2 border-border bg-card">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl"></span>
                    <div>
                      <p className="text-sm font-semibold text-electric">{language === 'ar' ? 'المدفوع' : 'Payé'}</p>
                      <p className="text-3xl font-bold text-electric">{formatCurrency(reportData.totalPaid)}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="p-8 rounded-2xl border-2 border-border bg-card">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl"></span>
                    <div>
                      <p className="text-sm font-semibold text-destructive">{language === 'ar' ? 'غير مدفوع' : 'Non payé'}</p>
                      <p className="text-3xl font-bold text-destructive">{formatCurrency(reportData.totalUnpaid)}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Report Sections */}
              <div className="space-y-10">
                {/* 1. Dashboard Section */}
                <ReportSection icon="" title={getText('dashboard')} delay={0.2}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatBox icon="" label={language === 'ar' ? 'مبيعات' : 'Ventes'} value={reportData.salesCount.toString()} color="green" subtext={`${reportData.salesCount} ${language === 'ar' ? 'معاملة' : 'opérations'}`} />
                    <StatBox icon="" label={language === 'ar' ? 'مشتريات' : 'Achats'} value={reportData.purchasesCount.toString()} color="orange" subtext={`${reportData.purchasesCount} ${language === 'ar' ? 'فاتورة' : 'factures'}`} />
                    <StatBox icon="" label={language === 'ar' ? 'منتجات' : 'Produits'} value={reportData.productsCount.toString()} color="blue" subtext={language === 'ar' ? 'في المخزون' : 'en stock'} />
                  </div>
                </ReportSection>

                {/* 2. Inventory Section with Alerts */}
                <ReportSection icon="" title={getText('inventory')} delay={0.3}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <StatBox
                        icon=""
                        label={language === 'ar' ? 'إجمالي المنتجات' : 'Total Produits'}
                        value={reportData.productsCount.toString()}
                        color="blue"
                        subtext={`${(products.reduce((sum, p) => sum + (p.current_quantity || 0), 0))} ${language === 'ar' ? 'وحدة' : 'unités'}`}
                      />
                      <StatBox
                        icon=""
                        label={getText('lowStock')}
                        value={reportData.lowStockCount.toString()}
                        color="red"
                        subtext={language === 'ar' ? 'تحتاج انتباه' : 'à surveiller'}
                      />
                    </div>

                    {/* Low Stock Products Alert */}
                    {products.filter(p => (p.current_quantity || 0) <= (p.min_quantity || 10)).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-2 border-border rounded-2xl p-6 bg-card"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-4xl"></span>
                          <div>
                            <h3 className="text-lg font-bold text-warning">{language === 'ar' ? 'تنبيهات المخزون المنخفض' : 'Alertes Stock Bas'}</h3>
                            <p className="text-sm text-warning">{language === 'ar' ? 'المنتجات التي تحتاج إعادة تخزين فوراً' : 'Produits nécessitant un réapprovisionnement'}</p>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-surface-2">
                              <TableHead className="font-bold">{language === 'ar' ? 'اسم المنتج' : 'Produit'}</TableHead>
                              <TableHead className="font-bold">{language === 'ar' ? 'الكمية الحالية' : 'Stock Actuel'}</TableHead>
                              <TableHead className="font-bold">{language === 'ar' ? 'الحد الأدنى' : 'Minimum'}</TableHead>
                              <TableHead className="font-bold">{language === 'ar' ? 'الفئة' : 'Catégorie'}</TableHead>
                              <TableHead className="text-right font-bold">{language === 'ar' ? 'المبلغ' : 'Manque'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.filter(p => (p.current_quantity || 0) <= (p.min_quantity || 10)).map((p, idx) => {
                              const shortage = (p.min_quantity || 10) - (p.current_quantity || 0);
                              return (
                                <motion.tr
                                  key={p.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="border-b hover:bg-surface-2 transition-colors"
                                >
                                  <TableCell className="font-bold text-warning">{p.name}</TableCell>
                                  <TableCell className="text-destructive font-bold">{p.current_quantity} </TableCell>
                                  <TableCell className="text-success">{p.min_quantity}</TableCell>
                                  <TableCell className="text-muted-foreground">{p.category || '-'}</TableCell>
                                  <TableCell className="text-right font-bold text-warning">
                                    <Badge className="bg-warning text-white">+{shortage}</Badge>
                                  </TableCell>
                                </motion.tr>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </motion.div>
                    )}
                  </div>
                </ReportSection>

                {/* 3. Purchase Invoices Section */}
                <ReportSection icon="" title={getText('purchases')} delay={0.4}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                        <p className="text-sm text-electric mb-2">{language === 'ar' ? 'إجمالي الفواتير' : 'Nombre de factures'}</p>
                        <p className="text-4xl font-bold text-electric">{reportData.purchasesCount}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                        <p className="text-sm text-warning mb-2">{language === 'ar' ? 'إجمالي المشتريات' : 'Montant total'}</p>
                        <p className="text-3xl font-bold text-warning">{formatCurrency(reportData.totalPurchases)}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                        <p className="text-sm text-success mb-2">{language === 'ar' ? 'المتوسط لكل فاتورة' : 'Montant moyen'}</p>
                        <p className="text-3xl font-bold text-success">{formatCurrency((reportData.totalPurchases || 0) / (reportData.purchasesCount || 1))}</p>
                      </motion.div>
                    </div>

                    {invoices.filter(i => i.type === 'purchase').length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-surface-2">
                              <TableHead className="font-bold">{getText('supplier')}</TableHead>
                              <TableHead className="font-bold">{getText('amount')}</TableHead>
                              <TableHead className="font-bold">{language === 'ar' ? 'المدفوع' : 'Payé'}</TableHead>
                              <TableHead className="font-bold">{getText('date')}</TableHead>
                              <TableHead className="font-bold">{getText('status')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.filter(i => i.type === 'purchase').map((inv, idx) => (
                              <motion.tr
                                key={inv.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-b hover:bg-surface-2 transition-colors"
                              >
                                <TableCell className="font-bold text-foreground">{inv.supplier_name}</TableCell>
                                <TableCell className="font-bold text-warning">{formatCurrency(inv.total_amount)}</TableCell>
                                <TableCell className={`font-bold ${inv.amount_paid > 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(inv.amount_paid)}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(inv.invoice_date)}</TableCell>
                                <TableCell>
                                  <Badge className={inv.status === 'paid' ? 'bg-success' : inv.status === 'partial' ? 'bg-warning' : 'bg-destructive'}>
                                    {inv.status === 'paid' ? '' : inv.status === 'partial' ? '' : ''} {inv.status}
                                  </Badge>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-surface-2 rounded-xl">
                        <p className="text-2xl"></p>
                        <p className="text-muted-foreground mt-3">{getText('noData')}</p>
                      </div>
                    )}
                  </div>
                </ReportSection>

                {/* 4. Sales Section */}
                <ReportSection icon="" title={getText('sales')} delay={0.5}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                        <p className="text-sm text-success mb-2">{language === 'ar' ? 'عدد المبيعات' : 'Nombre de ventes'}</p>
                        <p className="text-4xl font-bold text-success">{reportData.salesCount}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                        <p className="text-sm text-success mb-2">{language === 'ar' ? 'إجمالي المبيعات' : 'Montant total'}</p>
                        <p className="text-3xl font-bold text-success">{formatCurrency(reportData.totalSales)}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                        <p className="text-sm text-electric mb-2">{language === 'ar' ? 'المتوسط لكل بيع' : 'Montant moyen'}</p>
                        <p className="text-3xl font-bold text-electric">{formatCurrency((reportData.totalSales || 0) / (reportData.salesCount || 1))}</p>
                      </motion.div>
                    </div>

                    {invoices.filter(i => i.type !== 'purchase').length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-surface-2">
                              <TableHead className="font-bold">{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                              <TableHead className="font-bold">{getText('amount')}</TableHead>
                              <TableHead className="font-bold">{language === 'ar' ? 'المدفوع' : 'Payé'}</TableHead>
                              <TableHead className="font-bold">{getText('date')}</TableHead>
                              <TableHead className="font-bold">{getText('status')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.filter(i => i.type !== 'purchase').map((inv, idx) => (
                              <motion.tr
                                key={inv.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-b hover:bg-surface-2 transition-colors"
                              >
                                <TableCell className="font-bold text-foreground">{inv.supplier_name}</TableCell>
                                <TableCell className="font-bold text-success">{formatCurrency(inv.total_amount)}</TableCell>
                                <TableCell className={`font-bold ${inv.amount_paid > 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(inv.amount_paid)}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(inv.invoice_date)}</TableCell>
                                <TableCell>
                                  <Badge className={inv.status === 'paid' ? 'bg-success' : inv.status === 'partial' ? 'bg-warning' : 'bg-destructive'}>
                                    {inv.status === 'paid' ? '' : inv.status === 'partial' ? '' : ''} {inv.status}
                                  </Badge>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-surface-2 rounded-xl">
                        <p className="text-2xl"></p>
                        <p className="text-muted-foreground mt-3">{getText('noData')}</p>
                      </div>
                    )}
                  </div>
                </ReportSection>

                {/* 5. Suppliers Section */}
                <ReportSection icon="" title={getText('suppliers')} delay={0.6}>
                  {suppliers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {suppliers.map((supplier, idx) => {
                        const supplierInvoices = invoices.filter(i => i.supplier_name === supplier.name && i.type === 'purchase');
                        const totalAmount = supplierInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
                        return (
                          <motion.div
                            key={supplier.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-6 rounded-2xl border-2 border-border hover:shadow-md transition-all bg-card"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="text-2xl font-bold text-foreground">{supplier.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{supplier.contact_person}</p>
                              </div>
                              <span className="text-3xl"></span>
                            </div>
                            <div className="space-y-3 border-t border-border pt-4">
                              <div>
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الهاتف' : 'Téléphone'}</p>
                                <p className="text-sm font-semibold text-foreground">{supplier.phone}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الفواتير' : 'Factures'}</p>
                                <p className="text-sm font-semibold text-electric">{supplierInvoices.length} {language === 'ar' ? 'فاتورة' : 'factures'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الإجمالي' : 'Montant'}</p>
                                <p className="text-lg font-bold text-warning">{formatCurrency(totalAmount)}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-surface-2 rounded-xl">
                      <p className="text-2xl"></p>
                      <p className="text-muted-foreground mt-3">{getText('noData')}</p>
                    </div>
                  )}
                </ReportSection>

                {/* 6. Inventory Valuation Section */}
                <ReportSection icon="" title={language === 'ar' ? 'تقييم المخزون' : 'Valorisation du Stock'} delay={0.7}>
                  <div className="space-y-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setShowInventoryValuation(!showInventoryValuation)}
                      className="w-full text-primary-foreground font-bold py-4 px-6 rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all bg-primary"
                    >
                      {showInventoryValuation ? '' : ''} {language === 'ar' ? (showInventoryValuation ? 'إخفاء التفاصيل' : 'عرض جميع المنتجات') : (showInventoryValuation ? 'Masquer les détails' : 'Afficher tous les produits')}
                    </motion.button>

                    {showInventoryValuation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overflow-x-auto"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-surface-2">
                              <TableHead className="font-bold text-electric">{language === 'ar' ? 'اسم المنتج' : 'Produit'}</TableHead>
                              <TableHead className="font-bold text-electric">{language === 'ar' ? 'الماركة' : 'Marque'}</TableHead>
                              <TableHead className="font-bold text-electric text-center">{language === 'ar' ? 'الكمية الحالية' : 'Quantité'}</TableHead>
                              <TableHead className="font-bold text-electric text-right">{language === 'ar' ? 'سعر الوحدة' : 'Prix/Unité'}</TableHead>
                              <TableHead className="font-bold text-electric text-right">{language === 'ar' ? 'القيمة الإجمالية' : 'Valeur Total'}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((product, idx) => {
                              const quantity = product.current_quantity || 0;
                              const price = product.buying_price || product.selling_price || 0;
                              const totalValue = quantity * price;
                              return (
                                <motion.tr
                                  key={product.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.02 }}
                                  className="border-b hover:bg-surface-2 transition-colors"
                                >
                                  <TableCell className="font-bold text-foreground">{product.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{product.mark?.name || '-'}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={quantity <= (product.min_quantity || 10) ? 'bg-destructive' : 'bg-success'}>
                                      {quantity} {language === 'ar' ? 'وحدة' : 'unités'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-electric">{formatCurrency(price)}</TableCell>
                                  <TableCell className="text-right font-bold text-electric text-lg">{formatCurrency(totalValue)}</TableCell>
                                </motion.tr>
                              );
                            })}
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: products.length * 0.02 }}
                              className="font-bold text-lg border-t-2 border-border bg-card"
                            >
                              <TableCell colSpan={4} className="text-right text-electric py-4">
                                {language === 'ar' ? 'إجمالي قيمة المخزون:' : 'Valeur Total du Stock:'}
                              </TableCell>
                              <TableCell className="text-right text-electric py-4">
                                {formatCurrency(
                                  products.reduce((sum, p) => {
                                    const qty = p.current_quantity || 0;
                                    const price = p.buying_price || p.selling_price || 0;
                                    return sum + (qty * price);
                                  }, 0)
                                )}
                              </TableCell>
                            </motion.tr>
                          </TableBody>
                        </Table>
                      </motion.div>
                    )}
                  </div>
                </ReportSection>

                {/* 7. Cash Register (Caisse) Summary Section */}
                {caisseTransactions.length > 0 && (
                  <ReportSection icon="" title={language === 'ar' ? 'ملخص الصندوق' : 'Résumé Caisse'} delay={0.8}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                          <p className="text-sm text-success mb-2">{language === 'ar' ? 'إجمالي الإيداعات' : 'Dépôts'}</p>
                          <p className="text-3xl font-bold text-success">
                            {formatCurrency(caisseTransactions.filter(t => t.transaction_type === 'encaissement').reduce((sum, t) => sum + t.amount, 0))}
                          </p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                          <p className="text-sm text-destructive mb-2">{language === 'ar' ? 'إجمالي السحوبات' : 'Retraits'}</p>
                          <p className="text-3xl font-bold text-destructive">
                            {formatCurrency(caisseTransactions.filter(t => t.transaction_type === 'decaissement').reduce((sum, t) => sum + t.amount, 0))}
                          </p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border-2 border-border">
                          <p className="text-sm text-electric mb-2">{language === 'ar' ? 'الرصيد' : 'Solde'}</p>
                          <p className="text-3xl font-bold text-electric">
                            {formatCurrency(
                              caisseTransactions.filter(t => t.transaction_type === 'encaissement').reduce((sum, t) => sum + t.amount, 0) -
                              caisseTransactions.filter(t => t.transaction_type === 'decaissement').reduce((sum, t) => sum + t.amount, 0)
                            )}
                          </p>
                        </motion.div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow className="bg-surface-2">
                            <TableHead className="font-bold">{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                            <TableHead className="font-bold">{getText('amount')}</TableHead>
                            <TableHead className="font-bold">{getText('date')}</TableHead>
                            <TableHead className="font-bold">{language === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {caisseTransactions.map((trans, idx) => (
                            <motion.tr
                              key={trans.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.03 }}
                              className="border-b hover:bg-surface-2"
                            >
                              <TableCell className="font-bold">
                                {trans.transaction_type === 'encaissement' ? 'Dépôt' : 'Retrait'}
                              </TableCell>
                              <TableCell className={`font-bold ${trans.transaction_type === 'encaissement' ? 'text-success' : 'text-destructive'}`}>
                                {formatCurrency(trans.amount)}
                              </TableCell>
                              <TableCell>{formatDate(trans.transaction_date)}</TableCell>
                              <TableCell className="text-muted-foreground">{trans.description}</TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ReportSection>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
