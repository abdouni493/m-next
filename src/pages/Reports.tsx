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
import { StatCard } from '@/admin/ui';

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
const ReportSection = ({ title, description, children, delay = 0 }: { icon?: string; title: string; description?: string; children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
  >
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border px-5 pb-4 pt-5">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="p-5">
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

const TONE: Record<string, string> = {
  blue: 'bg-electric/10 text-electric',
  green: 'bg-success/15 text-success',
  orange: 'bg-warning/15 text-warning',
  red: 'bg-destructive/10 text-destructive',
  purple: 'bg-volt text-volt-foreground',
};

const StatBox = ({ label, value, color = 'blue', subtext = '' }: { icon?: string; label: string; value: string; color?: string; subtext?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[color] || TONE.blue}`}>{label}</span>
    <p className="mt-3 font-sora text-2xl font-bold tabular-nums text-foreground">{value}</p>
    {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
  </div>
);

const Meter = ({ label, value, total, tone = 'bg-primary', right }: { label: string; value: number; total: number; tone?: string; right?: React.ReactNode }) => {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{right ?? `${pct.toFixed(0)}%`}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
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
        className="admin-hero !mb-0 space-y-1"
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
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {getText('startDate')}
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-border focus:border-electric h-12 rounded-lg text-base bg-card"
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {getText('endDate')}
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-border focus:border-electric h-12 rounded-lg text-base bg-card"
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
              className="h-11 rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground"
            >
              <Download className={`${isRTL ? 'ml-3' : 'mr-3'} h-5 w-5`} />
              {getText('download')}
            </Button>
          </div>

          {reportData && (
            <>
              {/* Financial Summary Cards - Main KPIs */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label={getText('totalSales')} value={formatCurrency(reportData.totalSales)} hint={`${reportData.salesCount} ${language === 'ar' ? 'معاملة' : 'ventes'}`} icon={ArrowUpRight} />
                <StatCard label={getText('totalPurchases')} value={formatCurrency(reportData.totalPurchases)} hint={`${reportData.purchasesCount} ${language === 'ar' ? 'فاتورة' : 'factures'}`} icon={ArrowDownLeft} />
                <StatCard label={getText('profit')} value={<span className={reportData.netProfit >= 0 ? 'text-success' : 'text-destructive'}>{formatCurrency(reportData.netProfit)}</span>}
                  hint={`${((reportData.netProfit / (reportData.totalSales || 1)) * 100).toFixed(1)}% ${language === 'ar' ? 'هامش' : 'de marge'}`} icon={TrendingUp} />
                <StatCard label={language === 'ar' ? 'نسبة التحصيل' : 'Taux d\'encaissement'}
                  value={`${(((reportData.totalPaid) / ((reportData.totalPaid + reportData.totalUnpaid) || 1)) * 100).toFixed(0)}%`}
                  hint={`${formatCurrency(reportData.totalUnpaid)} ${language === 'ar' ? 'غير مدفوع' : 'impayés'}`} icon={DollarSign} />
              </div>

              {/* Detailed analysis */}
              {(() => {
                const sales = invoices.filter((i) => i.type !== 'purchase');
                const purchases = invoices.filter((i) => i.type === 'purchase');
                // daily series across the period
                const days: string[] = [];
                const start = new Date(startDate), end = new Date(endDate);
                for (let d = new Date(start); d <= end && days.length < 92; d.setDate(d.getDate() + 1)) days.push(d.toISOString().split('T')[0]);
                const byDay = days.map((day) => ({
                  day,
                  sales: sales.filter((i) => i.invoice_date?.startsWith(day)).reduce((s, i) => s + (i.total_amount || 0), 0),
                  purchases: purchases.filter((i) => i.invoice_date?.startsWith(day)).reduce((s, i) => s + (i.total_amount || 0), 0),
                }));
                const maxDay = Math.max(1, ...byDay.map((d) => Math.max(d.sales, d.purchases)));
                const bestDay = byDay.reduce((m, d) => (d.sales > m.sales ? d : m), byDay[0] || { day: '', sales: 0, purchases: 0 });
                const activeDays = byDay.filter((d) => d.sales > 0).length;
                const cashIn = caisseTransactions.filter((c) => c.transaction_type === 'encaissement').reduce((s, c) => s + (c.amount || 0), 0);
                const cashOut = caisseTransactions.filter((c) => c.transaction_type === 'decaissement').reduce((s, c) => s + (c.amount || 0), 0);
                const payroll = payments.reduce((s, p) => s + (p.amount || 0), 0);
                const qty = (p: Product) => Number(p.current_quantity ?? (p as unknown as { quantity_actual?: number }).quantity_actual) || 0;
                const cost = (p: Product) => Number(p.buying_price ?? (p as unknown as { purchase_price?: number }).purchase_price) || 0;
                const stockCost = products.reduce((s, p) => s + qty(p) * cost(p), 0);
                const stockRetail = products.reduce((s, p) => s + qty(p) * (Number(p.selling_price) || 0), 0);
                const outOfStock = products.filter((p) => qty(p) <= 0).length;
                const supplierTotals = Object.entries(purchases.reduce<Record<string, number>>((acc, i) => {
                  const k = i.supplier_name || '—';
                  acc[k] = (acc[k] || 0) + (i.total_amount || 0);
                  return acc;
                }, {})).sort((x, y) => y[1] - x[1]).slice(0, 5);
                const topSupplier = supplierTotals[0]?.[1] || 1;
                const statusCounts = invoices.reduce<Record<string, number>>((acc, i) => { acc[i.status || 'unknown'] = (acc[i.status || 'unknown'] || 0) + 1; return acc; }, {});
                const statusLabel = (s: string) => ({ paid: language === 'ar' ? 'مدفوعة' : 'Payées', partial: language === 'ar' ? 'جزئية' : 'Partielles', unpaid: language === 'ar' ? 'غير مدفوعة' : 'Impayées', pending: language === 'ar' ? 'معلقة' : 'En attente' } as Record<string, string>)[s] || s;
                return (
                  <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                      <CardHeader className="px-5 pb-2 pt-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-base font-semibold">{language === 'ar' ? 'المبيعات والمشتريات اليومية' : 'Ventes et achats par jour'}</CardTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(startDate)} → {formatDate(endDate)}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />{language === 'ar' ? 'مبيعات' : 'Ventes'}</span>
                            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-electric/60" />{language === 'ar' ? 'مشتريات' : 'Achats'}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-5 pb-5">
                        <div className="flex h-48 items-end gap-[3px] overflow-hidden">
                          {byDay.map((d) => (
                            <div key={d.day} className="group relative flex h-full min-w-[4px] flex-1 items-end gap-px" title={`${formatDate(d.day)} · ${formatCurrency(d.sales)} / ${formatCurrency(d.purchases)}`}>
                              <div className="flex-1 rounded-t-sm bg-primary transition-opacity group-hover:opacity-80" style={{ height: `${(d.sales / maxDay) * 100}%` }} />
                              <div className="flex-1 rounded-t-sm bg-electric/60 transition-opacity group-hover:opacity-80" style={{ height: `${(d.purchases / maxDay) * 100}%` }} />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
                          <div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'أفضل يوم' : 'Meilleur jour'}</p><p className="font-semibold tabular-nums">{bestDay?.sales ? formatDate(bestDay.day) : '—'}</p></div>
                          <div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'مبيعات أفضل يوم' : 'CA du meilleur jour'}</p><p className="font-semibold tabular-nums">{formatCurrency(bestDay?.sales || 0)}</p></div>
                          <div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'أيام نشطة' : 'Jours actifs'}</p><p className="font-semibold tabular-nums">{activeDays} / {byDay.length}</p></div>
                          <div><p className="text-xs text-muted-foreground">{language === 'ar' ? 'متوسط يومي' : 'Moyenne / jour'}</p><p className="font-semibold tabular-nums">{formatCurrency(reportData.totalSales / (byDay.length || 1))}</p></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-5 pb-2 pt-5"><CardTitle className="text-base font-semibold">{language === 'ar' ? 'حالة الفواتير' : 'Encaissement des factures'}</CardTitle></CardHeader>
                      <CardContent className="space-y-4 px-5 pb-5">
                        <Meter label={language === 'ar' ? 'المدفوع' : 'Payé'} value={reportData.totalPaid} total={reportData.totalPaid + reportData.totalUnpaid} tone="bg-success" right={formatCurrency(reportData.totalPaid)} />
                        <Meter label={language === 'ar' ? 'غير مدفوع' : 'Non payé'} value={reportData.totalUnpaid} total={reportData.totalPaid + reportData.totalUnpaid} tone="bg-destructive" right={formatCurrency(reportData.totalUnpaid)} />
                        <div className="flex flex-wrap gap-1.5 border-t border-border pt-4">
                          {Object.entries(statusCounts).map(([s, n]) => (
                            <span key={s} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold">{statusLabel(s)} · {n}</span>
                          ))}
                          {!Object.keys(statusCounts).length && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-5 pb-2 pt-5"><CardTitle className="text-base font-semibold">{language === 'ar' ? 'الصندوق والرواتب' : 'Caisse & paiements'}</CardTitle></CardHeader>
                      <CardContent className="space-y-3 px-5 pb-5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">{language === 'ar' ? 'مداخيل' : 'Encaissements'}</span><span className="font-semibold tabular-nums text-success">+{formatCurrency(cashIn)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{language === 'ar' ? 'مصاريف' : 'Décaissements'}</span><span className="font-semibold tabular-nums text-destructive">−{formatCurrency(cashOut)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{language === 'ar' ? 'رواتب' : 'Paiements employés'}</span><span className="font-semibold tabular-nums">{formatCurrency(payroll)}</span></div>
                        <div className="flex justify-between border-t border-border pt-3"><span className="font-semibold">{language === 'ar' ? 'الرصيد' : 'Solde caisse'}</span><span className={`font-sora text-lg font-bold tabular-nums ${cashIn - cashOut >= 0 ? 'text-foreground' : 'text-destructive'}`}>{formatCurrency(cashIn - cashOut)}</span></div>
                        <p className="text-xs text-muted-foreground">{caisseTransactions.length} {language === 'ar' ? 'عملية' : 'opérations de caisse'} · {payments.length} {language === 'ar' ? 'دفعة' : 'paiements'}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-5 pb-2 pt-5"><CardTitle className="text-base font-semibold">{language === 'ar' ? 'قيمة المخزون' : 'Valeur du stock'}</CardTitle></CardHeader>
                      <CardContent className="space-y-3 px-5 pb-5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">{language === 'ar' ? 'بسعر الشراء' : "Au prix d'achat"}</span><span className="font-semibold tabular-nums">{formatCurrency(stockCost)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">{language === 'ar' ? 'بسعر البيع' : 'Au prix de vente'}</span><span className="font-semibold tabular-nums">{formatCurrency(stockRetail)}</span></div>
                        <div className="flex justify-between border-t border-border pt-3"><span className="font-semibold">{language === 'ar' ? 'ربح محتمل' : 'Marge potentielle'}</span><span className="font-sora text-lg font-bold tabular-nums text-success">{formatCurrency(stockRetail - stockCost)}</span></div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold">{reportData.productsCount} {language === 'ar' ? 'منتج' : 'produits'}</span>
                          <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">{reportData.lowStockCount} {language === 'ar' ? 'منخفض' : 'stock faible'}</span>
                          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">{outOfStock} {language === 'ar' ? 'نفد' : 'rupture'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-5 pb-2 pt-5"><CardTitle className="text-base font-semibold">{language === 'ar' ? 'أهم الموردين' : 'Top fournisseurs (achats)'}</CardTitle></CardHeader>
                      <CardContent className="space-y-3 px-5 pb-5">
                        {supplierTotals.length ? supplierTotals.map(([name, total]) => (
                          <Meter key={name} label={name} value={total} total={topSupplier} tone="bg-electric" right={formatCurrency(total)} />
                        )) : <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد مشتريات' : 'Aucun achat sur la période'}</p>}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

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
                        className="border border-border rounded-2xl p-6 bg-card"
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
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
                        <p className="text-sm text-electric mb-2">{language === 'ar' ? 'إجمالي الفواتير' : 'Nombre de factures'}</p>
                        <p className="text-4xl font-bold text-electric">{reportData.purchasesCount}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
                        <p className="text-sm text-warning mb-2">{language === 'ar' ? 'إجمالي المشتريات' : 'Montant total'}</p>
                        <p className="text-3xl font-bold text-warning">{formatCurrency(reportData.totalPurchases)}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
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
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
                        <p className="text-sm text-success mb-2">{language === 'ar' ? 'عدد المبيعات' : 'Nombre de ventes'}</p>
                        <p className="text-4xl font-bold text-success">{reportData.salesCount}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
                        <p className="text-sm text-success mb-2">{language === 'ar' ? 'إجمالي المبيعات' : 'Montant total'}</p>
                        <p className="text-3xl font-bold text-success">{formatCurrency(reportData.totalSales)}</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
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
                            className="p-6 rounded-2xl border border-border hover:shadow-md transition-all bg-card"
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
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
                          <p className="text-sm text-success mb-2">{language === 'ar' ? 'إجمالي الإيداعات' : 'Dépôts'}</p>
                          <p className="text-3xl font-bold text-success">
                            {formatCurrency(caisseTransactions.filter(t => t.transaction_type === 'encaissement').reduce((sum, t) => sum + t.amount, 0))}
                          </p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
                          <p className="text-sm text-destructive mb-2">{language === 'ar' ? 'إجمالي السحوبات' : 'Retraits'}</p>
                          <p className="text-3xl font-bold text-destructive">
                            {formatCurrency(caisseTransactions.filter(t => t.transaction_type === 'decaissement').reduce((sum, t) => sum + t.amount, 0))}
                          </p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-surface-2 p-6 rounded-xl border border-border">
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
