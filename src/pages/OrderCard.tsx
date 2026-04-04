import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
  confirmed_at?: string;
  delivery_started_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  admin_notes?: string;
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

interface OrderCardProps {
  order: Order;
  language: string;
  isRTL: boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  onViewDetails: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onConfirm: (order: Order) => void;
  onStartDelivery: (order: Order) => void;
  onFinalize: (order: Order) => void;
  onCancel: (order: Order) => void;
  onShowDeleteDialog: (order: Order) => void;
}

export const OrderCard = ({
  order,
  language,
  isRTL,
  getStatusBadge,
  onViewDetails,
  onEdit,
  onDelete,
  onConfirm,
  onStartDelivery,
  onFinalize,
  onCancel,
  onShowDeleteDialog,
}: OrderCardProps) => {
  // Use items_count and thumbnail_image from order instead of fetching
  const itemsCount = order.items_count || 0;
  const thumbnailImage = order.thumbnail_image;
  const finalTotal = order.final_price > 0 ? order.final_price : (order.total_price - (order.discount_amount || 0));

  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <div className="h-full border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all bg-white dark:bg-slate-800 overflow-hidden rounded-xl">
        {/* Compact Top Section - Image + Status + Info */}
        <div className="relative">
          {/* Background Image (30% of card) */}
          <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
            {thumbnailImage ? (
              <img
                src={thumbnailImage}
                alt="Order thumbnail"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Status Badge - Top Right */}
            <div className="absolute top-2 right-2">
              {getStatusBadge(order.status)}
            </div>

            {/* Item Count Badge - Top Left */}
            <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">
              {itemsCount} {language === 'ar' ? 'منتج' : 'item'}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-4 space-y-3">
          {/* Header: Name + Price */}
          <div className="flex items-start justify-between gap-2 min-h-[2.5rem]">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {order.customer_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {order.customer_phone}
              </p>
            </div>
            <div className="text-right whitespace-nowrap">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {language === 'ar' ? 'المجموع' : 'Total'}
              </p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                {finalTotal.toFixed(0)} DZD
              </p>
            </div>
          </div>

          {/* Product Compact Info */}
          {itemsCount > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30 p-3 rounded-lg space-y-2">
              {/* Items Summary */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? `${itemsCount} منتجات في الطلب` : `${itemsCount} item${itemsCount > 1 ? 's' : ''} in order`}
                </p>
              </div>
              
              {/* Quick Note */}
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {language === 'ar' ? 'انقر على "تفاصيل" لرؤية جميع المنتجات والصور' : 'Click "Details" to see all items and images'}
              </p>
            </div>
          )}

          {/* Action Buttons - Responsive Layout */}
          <div className="flex flex-wrap gap-2 pt-2">
            {/* Main Actions */}
            <button
              onClick={() => onViewDetails(order)}
              className="flex-1 min-w-[80px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white py-2 px-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>👁️</span>
              <span className="hidden sm:inline">{language === 'ar' ? 'تفاصيل' : 'Détails'}</span>
            </button>

            <button
              onClick={() => onEdit(order)}
              disabled={order.status === 'delivered' || order.status === 'cancelled'}
              className="flex-1 min-w-[80px] bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white py-2 px-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>✏️</span>
              <span className="hidden sm:inline">{language === 'ar' ? 'تعديل' : 'Éditer'}</span>
            </button>

            <button
              onClick={() => onShowDeleteDialog(order)}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white py-2 px-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center w-10 h-10"
              title={language === 'ar' ? 'حذف' : 'Supprimer'}
            >
              🗑️
            </button>
          </div>

          {/* Status Action Buttons - Row 2 */}
          {order.status === 'pending' && (
            <button
              onClick={() => onConfirm(order)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>✅</span>
              <span>{language === 'ar' ? 'تأكيد الطلب' : 'Confirmer'}</span>
            </button>
          )}
          {order.status === 'confirmed' && (
            <button
              onClick={() => onStartDelivery(order)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>🚚</span>
              <span>{language === 'ar' ? 'بدء التوصيل' : 'En Livraison'}</span>
            </button>
          )}
          {order.status === 'on_delivery' && (
            <button
              onClick={() => onFinalize(order)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>✔️</span>
              <span>{language === 'ar' ? 'تم التسليم' : 'Livré'}</span>
            </button>
          )}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button
              onClick={() => onCancel(order)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>❌</span>
              <span>{language === 'ar' ? 'إلغاء الطلب' : 'Annuler'}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
