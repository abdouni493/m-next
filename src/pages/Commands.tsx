import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrderCard } from './OrderCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Check,
  Truck,
  CheckCircle,
  X,
  Search,
  Plus,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import {
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  confirmOrder,
  startOrderDelivery,
  finalizeOrder,
  cancelOrder,
  updateOrderItem,
  deleteOrderItem,
  getApprovedTestimonials,
  getAllTestimonials,
  getPendingTestimonials,
  approveTestimonial,
  rejectTestimonial,
  deleteTestimonial,
} from '@/lib/supabaseClient';
import { supabase } from '@/lib/supabaseClient';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_wilaya: string;
  delivery_type: 'bureau' | 'domicile';
  status: 'pending' | 'confirmed' | 'on_delivery' | 'delivered' | 'cancelled';
  total_price: number;
  discount_amount: number;
  final_price: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  thumbnail_image?: string;
  items_count?: number;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_mark?: string;
  quantity: number;
  price_per_unit: number;
  line_total: number;
  from_offer: boolean;
  voltage?: number;
  wattage?: number;
  amperage?: number;
  connection_type?: string;
}

interface Testimonial {
  id: string;
  client_name: string;
  opinion: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  is_approved?: boolean;
}

export default function Commands() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Testimonials State
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [showTestimonialsPanel, setShowTestimonialsPanel] = useState(false);

  // Pending Testimonials State
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [showPendingTab, setShowPendingTab] = useState(false);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit Form State
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_wilaya: '',
    delivery_type: 'domicile' as 'bureau' | 'domicile',
    admin_notes: '',
  });

  // Fetch orders with items using Supabase relationship - OPTIMIZED
  const fetchAllOrders = async () => {
    setLoadingOrders(true);
    try {
      console.log('Fetching all orders with items (optimized query)...');
      
      // First, fetch just the orders with count and thumbnail for card display
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_phone,
          customer_email,
          customer_address,
          customer_wilaya,
          delivery_type,
          status,
          total_price,
          discount_amount,
          final_price,
          thumbnail_image,
          items_count,
          notes,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log(`Loaded ${(orders || []).length} orders (fast initial load)`);
      
      setOrders(orders || []);
      applyFilters(orders || [], searchQuery, statusFilter);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في جلب الطلبات' : 'Impossible de charger les commandes',
        variant: 'destructive',
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch testimonials
  const fetchTestimonials = async () => {
    setLoadingTestimonials(true);
    try {
      const data = await getApprovedTestimonials();
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في جلب الآراء' : 'Impossible de charger les avis',
        variant: 'destructive',
      });
    } finally {
      setLoadingTestimonials(false);
    }
  };

  // Fetch pending testimonials for approval
  const fetchPendingTestimonials = async () => {
    setLoadingPending(true);
    try {
      const data = await getPendingTestimonials();
      setPendingTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching pending testimonials:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في جلب الآراء المعلقة' : 'Impossible de charger les avis en attente',
        variant: 'destructive',
      });
    } finally {
      setLoadingPending(false);
    }
  };

  // Approve testimonial
  const handleApproveTestimonial = async (testimonialId: string) => {
    try {
      await approveTestimonial(testimonialId);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم الموافقة على الرأي' : 'Avis approuvé',
      });
      fetchPendingTestimonials();
      fetchTestimonials();
    } catch (error) {
      console.error('Error approving testimonial:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في الموافقة' : 'Erreur lors de l\'approbation',
        variant: 'destructive',
      });
    }
  };

  // Reject testimonial
  const handleRejectTestimonial = async (testimonialId: string) => {
    try {
      await rejectTestimonial(testimonialId);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم رفض الرأي' : 'Avis rejeté',
      });
      fetchPendingTestimonials();
    } catch (error) {
      console.error('Error rejecting testimonial:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في الرفض' : 'Erreur lors du rejet',
        variant: 'destructive',
      });
    }
  };

  // Delete testimonial
  const handleDeleteTestimonial = async (testimonialId: string) => {
    try {
      await deleteTestimonial(testimonialId);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم حذف الرأي' : 'Avis supprimé',
      });
      fetchTestimonials();
      fetchPendingTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف الرأي' : 'Impossible de supprimer l\'avis',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchTestimonials();
    fetchPendingTestimonials();
  }, []);

  // Apply filters
  const applyFilters = (orderList: Order[], search: string, status: string) => {
    let filtered = orderList;

    if (status !== 'all') {
      filtered = filtered.filter(order => order.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        order =>
          order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          order.customer_phone.includes(search) ||
          order.id.includes(search)
      );
    }

    setFilteredOrders(filtered);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(orders, query, statusFilter);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(orders, searchQuery, status);
  };

  // View order details - OPTIMIZED
  const handleViewDetails = async (order: Order) => {
    try {
      console.log('Fetching order items for:', order.id);
      
      // Fetch only the items for this order (fast, selective query)
      const { data: items, error } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          product_name,
          product_image,
          product_mark,
          product_description,
          quantity,
          price_per_unit,
          line_total,
          from_offer,
          offer_id,
          created_at
        `)
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching order items:', error);
        throw error;
      }

      console.log(`Fetched ${items?.length || 0} items for order ${order.id}`);
      
      setSelectedOrder(order);
      setOrderItems(items || []);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  // Edit order
  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email || '',
      customer_address: order.customer_address,
      customer_wilaya: order.customer_wilaya,
      delivery_type: order.delivery_type,
      admin_notes: '',
    });
    setShowEditDialog(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!selectedOrder) return;

    try {
      await updateOrder(selectedOrder.id, editForm);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم تحديث الطلب' : 'Commande mise à jour',
      });
      setShowEditDialog(false);
      fetchAllOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  // Delete order
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      await deleteOrder(selectedOrder.id);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم حذف الطلب' : 'Commande supprimée',
      });
      setShowDeleteDialog(false);
      fetchAllOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  // Confirm order
  const handleConfirmOrder = async (order: Order) => {
    try {
      await confirmOrder(order.id);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم تأكيد الطلب' : 'Commande confirmée',
      });
      fetchAllOrders();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  // Start delivery
  const handleStartDelivery = async (order: Order) => {
    try {
      await startOrderDelivery(order.id);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم بدء التوصيل' : 'Livraison en cours',
      });
      fetchAllOrders();
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  // Finalize order
  const handleFinalizeOrder = async (order: Order) => {
    try {
      await finalizeOrder(order.id);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم إنهاء الطلب' : 'Commande livrée',
      });
      fetchAllOrders();
    } catch (error) {
      console.error('Error finalizing order:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };

  // Cancel order
  const handleCancelOrder = async (order: Order) => {
    const reason = window.prompt(
      language === 'ar' ? 'سبب الإلغاء:' : 'Raison de l\'annulation:'
    );
    
    if (!reason && reason !== '') return; // User cancelled the prompt
    
    try {
      await cancelOrder(order.id, reason || undefined);
      toast({
        title: language === 'ar' ? 'تم' : 'Succès',
        description: language === 'ar' ? 'تم إلغاء الطلب' : 'Commande annulée',
      });
      fetchAllOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        variant: 'destructive',
      });
    }
  };


  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; emoji: string; label: string }> = {
      pending: {
        color: 'bg-warning hover:bg-warning/90',
        emoji: '',
        label: language === 'ar' ? 'قيد الانتظار' : 'En attente'
      },
      confirmed: {
        color: 'bg-primary hover:bg-primary/90',
        emoji: '',
        label: language === 'ar' ? 'مؤكد' : 'Confirmé'
      },
      on_delivery: {
        color: 'bg-primary hover:bg-primary/90',
        emoji: '',
        label: language === 'ar' ? 'في التوصيل' : 'En livraison'
      },
      delivered: {
        color: 'bg-success hover:bg-success/90',
        emoji: '',
        label: language === 'ar' ? 'تم التوصيل' : 'Livré'
      },
      cancelled: {
        color: 'bg-destructive hover:bg-destructive/90',
        emoji: '',
        label: language === 'ar' ? 'ملغى' : 'Annulé'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} text-white font-bold text-sm px-3 py-1`}>
        {config.emoji} {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex gap-6 p-6 bg-surface-2 min-h-screen">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-[28px] tracking-tight font-bold flex items-center gap-3 text-foreground">
              <Truck className="w-8 h-8" />
              {language === 'ar' ? 'إدارة الطلبات' : 'Gestion des Commandes'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'ar' ? 'عرض وإدارة جميع الطلبات' : 'Afficher et gérer toutes les commandes'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTestimonialsPanel(!showTestimonialsPanel)}
            className="text-primary-foreground font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm bg-primary"
          >
            <MessageSquare className="w-5 h-5" />
            {language === 'ar' ? 'الآراء' : 'Avis'}
            {showTestimonialsPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ar' ? 'بحث عن طلب...' : 'Rechercher une commande...'}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-card border-2 border-border focus:border-electric"
          />
        </div>

        {/* Status Filter */}
        <div className={`flex gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          {['all', 'pending', 'confirmed', 'on_delivery', 'delivered', 'cancelled'].map((status) => {
            const getStatusLabel = (s: string) => {
              const labels: Record<string, { ar: string; fr: string }> = {
                all: { ar: 'الكل', fr: 'Tous' },
                pending: { ar: 'قيد الانتظار', fr: 'En attente' },
                confirmed: { ar: 'مؤكد', fr: 'Confirmé' },
                on_delivery: { ar: 'في التوصيل', fr: 'En livraison' },
                delivered: { ar: 'تم التوصيل', fr: 'Livré' },
                cancelled: { ar: 'ملغى', fr: 'Annulé' }
              };
              return language === 'ar' ? labels[s].ar : labels[s].fr;
            };

            return (
              <Button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`${
                  statusFilter === status
                    ? 'text-primary-foreground bg-primary'
                    : 'bg-surface-2 text-foreground hover:bg-surface-2'
                } transition-all font-semibold`}
                size="sm"
              >
                {getStatusLabel(status)}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {loadingOrders ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border-2 border-border bg-card">
          <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {language === 'ar' ? 'لا توجد طلبات' : 'Aucune commande'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              language={language}
              isRTL={isRTL}
              getStatusBadge={getStatusBadge}
              onViewDetails={handleViewDetails}
              onEdit={handleEditClick}
              onDelete={handleDeleteOrder}
              onConfirm={handleConfirmOrder}
              onStartDelivery={handleStartDelivery}
              onFinalize={handleFinalizeOrder}
              onCancel={handleCancelOrder}
              onShowDeleteDialog={(order) => {
                setSelectedOrder(order);
                setShowDeleteDialog(true);
              }}
            />
          ))}
        </motion.div>
      )}

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl bg-card border border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {language === 'ar' ? 'تفاصيل الطلب الكاملة' : 'Détails Complets de la Commande'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              {language === 'ar' ? 'معرف الطلب: ' : 'Numéro: '}{selectedOrder?.id.slice(0, 12)}...
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Horizontal Status and Summary Bar */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">{language === 'ar' ? 'الحالة' : 'Statut'}</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-semibold">{language === 'ar' ? 'السعر الكلي' : 'Total'}</p>
                    <p className="text-2xl font-bold text-electric">
                      {(selectedOrder.final_price > 0 ? selectedOrder.final_price : (selectedOrder.total_price - (selectedOrder.discount_amount || 0))).toFixed(2)} DZD
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Customer Info + Products */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Information - Column 1 */}
                <div className="md:col-span-1">
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <h3 className="text-lg font-bold text-electric mb-4 flex items-center gap-2">
                      <span></span>
                      {language === 'ar' ? 'بيانات العميل' : 'Client'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-electric font-semibold uppercase">{language === 'ar' ? 'الاسم' : 'Nom'}</p>
                        <p className="text-sm font-bold text-foreground">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-electric font-semibold uppercase">{language === 'ar' ? 'الهاتف' : 'Téléphone'}</p>
                        <p className="text-sm font-bold text-foreground">{selectedOrder.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-electric font-semibold uppercase">{language === 'ar' ? 'البريد' : 'Email'}</p>
                        <p className="text-sm font-mono text-foreground break-all">{selectedOrder.customer_email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-electric font-semibold uppercase">{language === 'ar' ? 'الولاية' : 'Wilaya'}</p>
                        <p className="text-sm font-bold text-foreground">{selectedOrder.customer_wilaya}</p>
                      </div>
                      <div>
                        <p className="text-xs text-electric font-semibold uppercase">{language === 'ar' ? 'العنوان' : 'Adresse'}</p>
                        <p className="text-sm text-foreground">{selectedOrder.customer_address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-electric font-semibold uppercase">{language === 'ar' ? 'نوع التوصيل' : 'Livraison'}</p>
                        <p className="text-sm font-bold text-foreground">
                          {selectedOrder.delivery_type === 'bureau' ? 'Bureau' : 'Domicile'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products List - Column 2-3 */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <span></span>
                    {language === 'ar' ? `المنتجات (${orderItems.length})` : `Produits (${orderItems.length})`}
                  </h3>
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {/* Product Header */}
                        <div className="p-4 border-b border-border bg-card">
                          <h4 className="text-base font-bold text-foreground mb-1">{item.product_name}</h4>
                          {item.product_mark && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-2 text-electric rounded text-xs font-semibold">
                              {item.product_mark}
                            </span>
                          )}
                        </div>

                        {/* Product Content */}
                        <div className="p-4 space-y-4">
                          {/* Image and Specs Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            {/* Image */}
                            <div className="sm:col-span-1">
                              {item.product_image ? (
                                <img 
                                  src={item.product_image} 
                                  alt={item.product_name}
                                  className="w-full h-28 rounded-lg object-cover border border-border"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-28 rounded-lg bg-surface-2 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Charger Specifications */}
                            <div className="sm:col-span-3">
                              <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">{language === 'ar' ? 'المواصفات' : 'Spécifications'}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {item.voltage && (
                                  <div className="p-3 rounded border border-border text-center bg-card">
                                    <p className="text-xs text-warning font-semibold">Voltage</p>
                                    <p className="text-lg font-bold text-warning">{item.voltage}V</p>
                                  </div>
                                )}
                                {item.amperage && (
                                  <div className="p-3 rounded border border-border text-center bg-card">
                                    <p className="text-xs text-electric font-semibold">Amperage</p>
                                    <p className="text-lg font-bold text-electric">{item.amperage}A</p>
                                  </div>
                                )}
                                {item.wattage && (
                                  <div className="p-3 rounded border border-border text-center bg-card">
                                    <p className="text-xs text-success font-semibold">Wattage</p>
                                    <p className="text-lg font-bold text-success">{item.wattage}W</p>
                                  </div>
                                )}
                                {item.connection_type && (
                                  <div className="p-3 rounded border border-border text-center bg-card">
                                    <p className="text-xs text-electric font-semibold">Type</p>
                                    <p className="text-xs font-bold text-electric truncate">{item.connection_type}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quantity and Pricing */}
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                            <div className="bg-surface-2 p-3 rounded text-center">
                              <p className="text-xs text-muted-foreground font-semibold uppercase">{language === 'ar' ? 'الكمية' : 'Quantité'}</p>
                              <p className="text-lg font-bold text-foreground">{item.quantity}</p>
                            </div>
                            <div className="bg-surface-2 p-3 rounded text-center">
                              <p className="text-xs text-muted-foreground font-semibold uppercase">{language === 'ar' ? 'السعر' : 'Prix U.'}</p>
                              <p className="text-base font-bold text-foreground">{item.price_per_unit.toFixed(0)} DZD</p>
                            </div>
                            <div className="bg-surface-2 p-3 rounded text-center border border-border">
                              <p className="text-xs text-success font-semibold uppercase">{language === 'ar' ? 'الإجمالي' : 'Total'}</p>
                              <p className="text-lg font-bold text-success">{item.line_total.toFixed(0)} DZD</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Summary Section */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-bold text-success mb-3">
                  {language === 'ar' ? 'ملخص الدفع' : 'Résumé du Paiement'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground">{language === 'ar' ? 'السعر الأساسي' : 'Sous-total'}:</span>
                    <span className="font-bold text-foreground">{selectedOrder.total_price.toFixed(2)} DZD</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-foreground">{language === 'ar' ? 'الخصم' : 'Réduction'}:</span>
                      <span className="font-bold text-warning">-{selectedOrder.discount_amount.toFixed(2)} DZD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t-2 border-border pt-2">
                    <span>{language === 'ar' ? 'الإجمالي النهائي' : 'Total Final'}:</span>
                    <span className="text-success">
                      {(selectedOrder.final_price > 0 ? selectedOrder.final_price : (selectedOrder.total_price - (selectedOrder.discount_amount || 0))).toFixed(2)} DZD
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-surface-2 p-4 rounded-lg border border-border">
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {language === 'ar' ? 'الجدول الزمني' : 'Timeline'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">{language === 'ar' ? 'الإنشاء' : 'Créé'}</p>
                      <p className="text-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl bg-card border-2 border-border max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {language === 'ar' ? 'تعديل الطلب' : 'Éditer la Commande'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'تحديث معلومات الطلب والعميل' : 'Mettre à jour les informations de la commande et du client'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Customer Information Section */}
            <div className="p-4 rounded-xl border-2 border-border bg-card">
              <h3 className="font-bold text-lg mb-4 text-electric">{language === 'ar' ? 'معلومات العميل' : 'Informations Client'}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground">
                    {language === 'ar' ? 'اسم العميل' : 'Nom du Client'}
                  </label>
                  <Input
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                    className="bg-card border-2 border-border focus:border-electric"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-foreground">
                      {language === 'ar' ? 'الهاتف' : 'Téléphone'}
                    </label>
                    <Input
                      value={editForm.customer_phone}
                      onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                      className="bg-card border-2 border-border focus:border-electric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-foreground">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <Input
                      value={editForm.customer_email}
                      onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                      className="bg-card border-2 border-border focus:border-electric"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-foreground">
                      {language === 'ar' ? 'الولاية' : 'Wilaya'}
                    </label>
                    <Input
                      value={editForm.customer_wilaya}
                      onChange={(e) => setEditForm({ ...editForm, customer_wilaya: e.target.value })}
                      className="bg-card border-2 border-border focus:border-electric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-foreground">
                      {language === 'ar' ? 'نوع التوصيل' : 'Type de Livraison'}
                    </label>
                    <select
                      value={editForm.delivery_type}
                      onChange={(e) => setEditForm({ ...editForm, delivery_type: e.target.value as 'bureau' | 'domicile' })}
                      className="w-full bg-card border-2 border-border rounded-lg p-2 focus:border-electric font-bold text-foreground"
                    >
                      <option value="bureau">Bureau</option>
                      <option value="domicile">Domicile</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground">
                    {language === 'ar' ? 'العنوان الكامل' : 'Adresse Complète'}
                  </label>
                  <textarea
                    value={editForm.customer_address}
                    onChange={(e) => setEditForm({ ...editForm, customer_address: e.target.value })}
                    className="w-full bg-card border-2 border-border rounded-lg p-2 focus:border-electric"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Admin Notes Section */}
            <div className="p-4 rounded-xl border-2 border-border bg-card">
              <h3 className="font-bold text-lg mb-3 text-warning">{language === 'ar' ? 'ملاحظات الإدارة' : 'Notes d\'Administration'}</h3>
              <textarea
                value={editForm.admin_notes}
                onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                className="w-full bg-card border-2 border-border rounded-lg p-2 focus:border-warning"
                rows={3}
                placeholder={language === 'ar' ? 'أضف ملاحظات إضافية...' : 'Ajouter des notes...'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t-2 border-border">
              <Button
                onClick={handleSaveEdit}
                className="flex-1 text-primary-foreground font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 h-10 bg-primary"
              >
                {language === 'ar' ? 'حفظ التغييرات' : 'Enregistrer'}
              </Button>
              <Button
                onClick={() => setShowEditDialog(false)}
                className="flex-1 text-primary-foreground font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 h-10 bg-primary"
              >
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-2 border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirmer la suppression'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? 'هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-muted-foreground hover:bg-muted-foreground text-white font-bold">
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-destructive hover:bg-destructive/90 text-white font-bold"
            >
              {language === 'ar' ? 'حذف' : 'Supprimer'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    {/* ========== TESTIMONIALS SIDEBAR ========== */}
    <AnimatePresence>
      {showTestimonialsPanel && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full md:w-96 rounded-2xl p-6 border-2 border-border shadow-sm max-h-screen overflow-y-auto bg-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-electric" />
              {language === 'ar' ? 'الآراء' : 'Avis Clients'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowTestimonialsPanel(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b-2 border-border">
            <button
              onClick={() => setShowPendingTab(false)}
              className={`flex-1 pb-2 px-3 font-bold text-sm transition-all ${
                !showPendingTab
                  ? 'border-b-2 border-electric text-electric'
                  : 'text-muted-foreground'
              }`}
            >
              {language === 'ar' ? 'موافق عليه' : 'Approuvés'} ({testimonials.length})
            </button>
            <button
              onClick={() => setShowPendingTab(true)}
              className={`flex-1 pb-2 px-3 font-bold text-sm transition-all ${
                showPendingTab
                  ? 'border-b-2 border-warning text-warning'
                  : 'text-muted-foreground'
              }`}
            >
              {language === 'ar' ? 'قيد المراجعة' : 'En attente'} ({pendingTestimonials.length})
            </button>
          </div>

          {/* Approved Testimonials */}
          {!showPendingTab && (
            <div className="space-y-4">
              {loadingTestimonials ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block"
                  >
                    <span className="text-3xl"></span>
                  </motion.div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
                  </p>
                </div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    {language === 'ar' ? 'لا توجد آراء موافق عليها' : 'Aucun avis approuvé'}
                  </p>
                </div>
              ) : (
                testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-lg p-3 border-l-4 border-success shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < (testimonial.rating || 5) ? 'text-lg' : 'text-lg opacity-30'
                          }`}
                        >
                          
                        </span>
                      ))}
                    </div>

                    {/* Opinion */}
                    <p className="text-sm text-foreground mb-2 line-clamp-3">
                      "{testimonial.opinion}"
                    </p>

                    {/* Author and Date */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {testimonial.client_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(testimonial.created_at).toLocaleDateString(
                            language === 'ar' ? 'ar-DZ' : 'fr-FR'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        className="p-1.5 bg-destructive hover:bg-destructive/90 text-white rounded text-xs"
                        title={language === 'ar' ? 'حذف' : 'Supprimer'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Pending Testimonials */}
          {showPendingTab && (
            <div className="space-y-4">
              {loadingPending ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block"
                  >
                    <span className="text-3xl"></span>
                  </motion.div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
                  </p>
                </div>
              ) : pendingTestimonials.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    {language === 'ar' ? 'لا توجد آراء قيد المراجعة' : 'Aucun avis en attente'}
                  </p>
                </div>
              ) : (
                pendingTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-surface-2 rounded-lg p-3 border-l-4 border-warning shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < (testimonial.rating || 5) ? 'text-lg' : 'text-lg opacity-30'
                          }`}
                        >
                          
                        </span>
                      ))}
                    </div>

                    {/* Opinion */}
                    <p className="text-sm text-foreground mb-3 line-clamp-3">
                      "{testimonial.opinion}"
                    </p>

                    {/* Author and Date */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-foreground">
                        {testimonial.client_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(testimonial.created_at).toLocaleDateString(
                          language === 'ar' ? 'ar-DZ' : 'fr-FR'
                        )}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleApproveTestimonial(testimonial.id)}
                        className="flex-1 bg-success hover:bg-success/90 text-white font-bold py-1 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {language === 'ar' ? 'موافقة' : 'Approuver'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleRejectTestimonial(testimonial.id)}
                        className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold py-1 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        {language === 'ar' ? 'رفض' : 'Rejeter'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              fetchTestimonials();
              fetchPendingTestimonials();
            }}
            disabled={loadingTestimonials || loadingPending}
            className="w-full mt-4 disabled:opacity-50 text-primary-foreground font-bold py-2 rounded-lg transition-all bg-primary"
          >
            {language === 'ar' ? 'تحديث' : 'Rafraîchir'}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
}
