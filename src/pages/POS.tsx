import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus,
  Minus,
  Trash2,
  CreditCard,
  ShoppingCart,
  Package,
  DollarSign,
  Check,
  X,
  Printer,
  Car,
  AlertCircle,
  Store,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase, getProducts, getStores } from '@/lib/supabaseClient';

// --- Type Definitions ---
interface Product {
  id: string;
  name: string;
  barcode: string;
  brand: string;
  category: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  selling_price_1?: number;
  selling_price_2?: number;
  selling_price_3?: number;
  last_price_to_sell?: number;
  margin_percent: number;
  quantity_initial: number;
  quantity_actual: number;
  quantity_minimal: number;
  supplier: string;
  store_id: string;
  created_at: string;
  updated_at: string;
  primary_image?: string;
  voltage?: number;
  wattage?: number;
  amperage?: number;
  model_number?: string;
  mark?: { id: string; name: string };
  connector_type?: { id: string; name: string };
}

interface Store {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  total: number;
}

interface GlobalDiscount {
  amount: number;
  type: 'fixed' | 'percentage';
}

interface SaleInvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  purchase_price: number;
  margin_percent: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  total: number;
}

interface SaleInvoice {
  id: number;
  type: 'sale';
  clientId: string;
  total: number;
  amount_paid: number;
  created_at: string;
  items: SaleInvoiceItem[];
}

const formatCurrencyLocal = (amount: number, language: string) => 
  new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', { 
    style: 'currency', 
    currency: 'DZD' 
  }).format(amount);

export default function POS() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', phone: '', price_tier: 1, notes: '' });
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [editableTotal, setEditableTotal] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [printConfirmationDialog, setPrintConfirmationDialog] = useState(false);
  const [lastSaleInvoice, setLastSaleInvoice] = useState<SaleInvoice | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount>({
    amount: 0,
    type: 'fixed'
  });
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('posSelectedStoreId') || '';
  });
  const [isStorePinned, setIsStorePinned] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('posStorePinned') === 'true';
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch Stores from Supabase ---
  const fetchStores = async () => {
    try {
      const data = await getStores();
      setStores(data);

      const savedStoreId = typeof window !== 'undefined' ? localStorage.getItem('posSelectedStoreId') : null;
      const savedPinned = typeof window !== 'undefined' ? localStorage.getItem('posStorePinned') === 'true' : false;
      setIsStorePinned(savedPinned);

      if (data.length > 0) {
        if (savedPinned && savedStoreId && data.some((s) => s.id === savedStoreId)) {
          setSelectedStore(savedStoreId);
        } else if (!savedStoreId || !data.some((s) => s.id === savedStoreId)) {
          setSelectedStore(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل المتاجر.' : 'Failed to load stores.',
        variant: 'destructive'
      });
    }
  };

  // --- Fetch Products from Supabase ---
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      const formattedData = data.map((p: any) => ({
        ...p,
        id: p.id || '',
        purchase_price: p.purchase_price || 0,
        selling_price: p.selling_price || 0,
        selling_price_1: p.selling_price_1 || p.selling_price || 0,
        selling_price_2: p.selling_price_2 || p.selling_price || 0,
        selling_price_3: p.selling_price_3 || p.selling_price || 0,
        margin_percent: p.margin_percent || 0,
        quantity_actual: p.quantity_actual || 0,
        quantity_initial: p.quantity_initial || 0,
        quantity_minimal: p.quantity_minimal || 0,
        description: p.description || '',
        last_price_to_sell: typeof p.last_price_to_sell === 'number' ? p.last_price_to_sell : (parseFloat(p.last_price_to_sell) || 0),
        store_id: p.store_id || ''
      }));
      setProducts(formattedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل المنتجات.' : 'Failed to load products.',
        variant: 'destructive'
      });
    }
  };

  // --- Fetch Clients from Supabase ---
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, price_tier')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchClients();
  }, []);

  // Persist selected store when pin is enabled
  useEffect(() => {
    if (isStorePinned && selectedStore) {
      localStorage.setItem('posSelectedStoreId', selectedStore);
      localStorage.setItem('posStorePinned', 'true');
    } else {
      localStorage.removeItem('posSelectedStoreId');
      localStorage.setItem('posStorePinned', 'false');
    }
  }, [isStorePinned, selectedStore]);

  // Search with store filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      // Show all products regardless of store (store filtering disabled)
      // This allows POS to display products from all stores
      const storeProducts = products;

      const isBarcode = /^\d+$/.test(searchQuery);
      if (isBarcode && searchQuery.length >= 8) {
        const scannedProduct = storeProducts.find(p => p.barcode === searchQuery);
        if (scannedProduct) {
          addToCart(scannedProduct);
          setSearchQuery('');
          return;
        } else {
          toast({
            title: language === 'ar' ? 'تحذير' : 'Attention',
            description: language === 'ar' ? `المنتج بالباركود ${searchQuery} غير موجود.` : `Produit avec le code-barres ${searchQuery} introuvable.`,
            variant: 'destructive'
          });
          setSearchQuery('');
          return;
        }
      }

      const results = storeProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery)
      );
      setFilteredProducts(results);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, products, language]);

  // Client search filtering
  useEffect(() => {
    if (clientSearch.trim() === '') {
      setFilteredClients([]);
      return;
    }
    
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.phone.includes(clientSearch)
    );
    setFilteredClients(filtered);
  }, [clientSearch, clients]);

  // Focus management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  // Helper function to get the correct price based on client tier
  const getPriceForClient = (product: Product, client: any | null): number => {
    let selectedPrice = product.selling_price_1 || product.selling_price;
    
    if (client) {
      if (client.price_tier === 2 && product.selling_price_2) {
        selectedPrice = product.selling_price_2;
      } else if (client.price_tier === 3 && product.selling_price_3) {
        selectedPrice = product.selling_price_3;
      } else if (client.price_tier === 1 && product.selling_price_1) {
        selectedPrice = product.selling_price_1;
      }
    }
    
    return parseFloat(selectedPrice);
  };

  // Calculations - Use cart item totals which already include client-based pricing
  const subtotal = cart.reduce((sum, item) => sum + (item.total / (1 - (item.discount || 0) / 100)), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + ((item.total / (1 - (item.discount || 0) / 100)) * (item.discount || 0) / 100), 0);
  const globalDiscountAmount = globalDiscount.type === 'fixed' 
    ? globalDiscount.amount 
    : (subtotal - totalDiscount) * (globalDiscount.amount / 100);
  const total = Math.max(0, subtotal - totalDiscount - globalDiscountAmount);
  const remainingDebt = total - receivedAmount;
  const change = receivedAmount - total;

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (product.quantity_actual <= 0) {
      toast({
        title: language === 'ar' ? 'تحذير' : 'Attention',
        description: language === 'ar' ? 'المنتج غير متوفر في المخزون.' : 'Ce produit est en rupture de stock.',
        variant: 'destructive'
      });
      return;
    }

    // Get price based on selected client's tier
    let selectedPrice = product.selling_price;
    if (selectedClient) {
      if (selectedClient.price_tier === 2 && product.selling_price_2) {
        selectedPrice = parseFloat(product.selling_price_2);
      } else if (selectedClient.price_tier === 3 && product.selling_price_3) {
        selectedPrice = parseFloat(product.selling_price_3);
      } else if (selectedClient.price_tier === 1 && product.selling_price_1) {
        selectedPrice = parseFloat(product.selling_price_1);
      }
    } else if (product.selling_price_1) {
      selectedPrice = parseFloat(product.selling_price_1);
    }

    if (existingItem) {
      if (existingItem.quantity + 1 > product.quantity_actual) {
        toast({
          title: language === 'ar' ? 'تحذير' : 'Attention',
          description: language === 'ar' ? `لا يوجد ما يكفي من ${product.name} في المخزون. الكمية المتوفرة: ${product.quantity_actual}.` : `Pas assez de ${product.name} en stock. Quantité disponible: ${product.quantity_actual}.`,
          variant: 'destructive'
        });
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * selectedPrice * (1 - item.discount / 100) 
            }
          : item
      ));
    } else {
      setCart([...cart, { 
        product, 
        quantity: 1, 
        discount: 0,
        total: selectedPrice
      }]);
    }
    
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Handle client selection
  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setClientName(client.name);
    setClientSearch('');
    setShowClientDropdown(false);
    
    // Update cart product prices based on client's price tier
    if (cart.length > 0) {
      setCart(cart.map(item => {
        // Calculate price based on tier: selling_price_1, selling_price_2, selling_price_3
        let selectedPrice = item.product.selling_price;
        
        if (client.price_tier === 2 && item.product.selling_price_2) {
          selectedPrice = parseFloat(item.product.selling_price_2);
        } else if (client.price_tier === 3 && item.product.selling_price_3) {
          selectedPrice = parseFloat(item.product.selling_price_3);
        } else if (client.price_tier === 1 && item.product.selling_price_1) {
          selectedPrice = parseFloat(item.product.selling_price_1);
        }
        
        return {
          ...item,
          total: selectedPrice * item.quantity * (1 - item.discount / 100)
        };
      }));
    }
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setClientName('');
    setClientSearch('');
    
    // Reset cart prices to default selling_price_1 (tier 1 price)
    if (cart.length > 0) {
      setCart(cart.map(item => ({
        ...item,
        total: (item.product.selling_price_1 || item.product.selling_price) * item.quantity * (1 - item.discount / 100)
      })));
    }
  };

  const handleAddNewClient = async () => {
    if (!newClientForm.name.trim() || !newClientForm.phone.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            name: newClientForm.name.trim(),
            phone: newClientForm.phone.trim(),
            price_tier: newClientForm.price_tier,
            notes: newClientForm.notes.trim() || null,
            is_active: true,
          },
        ])
        .select();

      if (error) throw error;

      // Add new client to list
      if (data && data.length > 0) {
        const newClient = data[0];
        setClients([...clients, newClient]);
        handleClientSelect(newClient);
        setShowAddClientModal(false);
        setNewClientForm({ name: '', phone: '', price_tier: 1, notes: '' });
        
        toast({
          title: language === 'ar' ? 'نجاح' : 'Success',
          description: language === 'ar' ? 'تم إضافة العميل بنجاح' : 'Client créé avec succès',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل في إضافة العميل' : 'Erreur lors de la création du client'),
        variant: 'destructive'
      });
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const productInStock = products.find(p => p.id === productId);
    if (!productInStock) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > productInStock.quantity_actual) {
      toast({
        title: language === 'ar' ? 'تحذير' : 'Attention',
        description: language === 'ar' ? `لا يوجد ما يكفي من ${productInStock.name} في المخزون.` : `Pas assez de ${productInStock.name} en stock.`,
        variant: 'destructive'
      });
      return;
    }
    
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        // Get the correct price based on selected client
        const unitPrice = getPriceForClient(item.product, selectedClient);
        const total = newQuantity * unitPrice * (1 - item.discount / 100);
        return { ...item, quantity: newQuantity, total };
      }
      return item;
    }));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        // Get the correct price based on selected client
        const unitPrice = getPriceForClient(item.product, selectedClient);
        const total = item.quantity * unitPrice * (1 - discount / 100);
        return { ...item, discount, total };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setClientName('');
    setReceivedAmount(0);
    setGlobalDiscount({ amount: 0, type: 'fixed' });
  };

  const completeSale = async () => {
    try {
      let customerId: string | null = null;
      const trimmedClientName = clientName.trim();

      // Scenario 1: No client typed - use "Client de passage"
      if (!trimmedClientName) {
        // Do nothing, will save as "Client de passage"
      } 
      // Scenario 2: Client typed but might not exist
      else {
        // Check if client exists in database
        const { data: existingClient } = await supabase
          .from('customers')
          .select('id')
          .eq('name', trimmedClientName)
          .maybeSingle();

        if (existingClient) {
          // Client exists in database
          customerId = existingClient.id;
        } else {
          // Client name typed but doesn't exist - create new client
          const { data: newClient, error: createError } = await supabase
            .from('customers')
            .insert([{
              name: trimmedClientName,
              phone: '',
              price_tier: 1,
              notes: 'Created from POS sale',
              is_active: true
            }])
            .select()
            .single();

          if (createError) {
            console.warn('Could not create client:', createError);
            // Continue anyway, will save with just the name
          } else if (newClient) {
            customerId = newClient.id;
          }
        }
      }

      const invoiceData = {
        invoice_number: `SAL-${Date.now()}`,
        type: 'sale',
        customer_id: customerId,
        client_name: trimmedClientName || 'Client de passage',
        subtotal: subtotal,
        tax_amount: 0,
        discount_amount: totalDiscount + globalDiscountAmount,
        total_amount: editableTotal,
        amount_paid: receivedAmount,
        status: receivedAmount >= editableTotal ? 'paid' : 'pending',
        payment_method: receivedAmount > 0 ? 'cash' : null,
        payment_date: receivedAmount >= editableTotal ? new Date().toISOString() : null,
        invoice_date: new Date().toISOString(),
        notes: `Discount: ${totalDiscount} + Global: ${globalDiscountAmount}`
      };

      const { data: createdInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const items = cart.map(({ product, quantity, total, discount }) => ({
        invoice_id: createdInvoice.id,
        product_id: product.id,
        product_name: product.name,
        quantity: parseInt(quantity.toString()),
        unit_price: parseFloat((total / (1 - (discount || 0) / 100)).toString()),
        total_price: parseFloat(total.toString())
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Deduct quantities from products inventory (using quantity_actual field)
      for (const item of cart) {
        const newQuantity = Math.max(0, (item.product.quantity_actual || 0) - item.quantity);
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            quantity_actual: newQuantity
          })
          .eq('id', item.product.id);

        if (updateError) {
          console.warn(`Warning: Could not update inventory for product ${item.product.id}:`, updateError);
        }
      }

      const fetchedInvoice: SaleInvoice = {
        id: createdInvoice.id,
        type: 'sale',
        clientId: customerId || 'passager',
        total: editableTotal,
        amount_paid: receivedAmount,
        created_at: new Date().toISOString(),
        items: items as any
      };

      setLastSaleInvoice(fetchedInvoice);
      
      toast({
        title: language === 'ar' ? 'تمت الفاتورة' : 'Vente Complétée',
        description: language === 'ar' ? 'تم إنشاء فاتورة البيع بنجاح.' : 'Facture de vente créée avec succès.',
      });
      
      clearCart();
      setPaymentDialog(false);
      fetchProducts();
      setPrintConfirmationDialog(true);
    } catch (error) {
      console.error('Error completing sale:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إتمام عملية البيع.' : 'Échec de la finalisation de la vente.',
        variant: 'destructive'
      });
    }
  };

  const printSaleInvoice = () => {
    if (!lastSaleInvoice) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceType = language === 'ar' ? 'فاتورة بيع' : 'Facture de Vente';
      const invoiceDate = new Date(lastSaleInvoice.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');
      const clientDisplayedName = lastSaleInvoice.clientId || (language === 'ar' ? 'العميل عابر' : 'Client de passage');

      printWindow.document.write(`
        <html>
          <head>
            <title>${invoiceType}</title>
            <style>
              body { font-family: Arial; margin: 20px; }
              .container { max-width: 600px; margin: 0 auto; }
              h1 { text-align: center; color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f0f0f0; }
              .total { font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${invoiceType}</h1>
              <p><strong>${language === 'ar' ? 'العميل' : 'Client'}:</strong> ${clientDisplayedName}</p>
              <p><strong>${language === 'ar' ? 'التاريخ' : 'Date'}:</strong> ${invoiceDate}</p>
              <table>
                <thead>
                  <tr>
                    <th>${language === 'ar' ? 'المنتج' : 'Produit'}</th>
                    <th>${language === 'ar' ? 'المواصفات' : 'Spécifications'}</th>
                    <th>${language === 'ar' ? 'الكمية' : 'Qté'}</th>
                    <th>${language === 'ar' ? 'السعر' : 'Prix'}</th>
                    <th>${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${lastSaleInvoice.items.map(item => {
                    const specs = [];
                    if (item.voltage) specs.push(item.voltage + 'V');
                    if (item.wattage) specs.push(item.wattage + 'W');
                    if (item.amperage) specs.push(item.amperage + 'A');
                    const specsStr = specs.length > 0 ? specs.join(' | ') : '-';
                    return `
                    <tr>
                      <td>${item.product_name}</td>
                      <td>${specsStr}</td>
                      <td>${item.quantity}</td>
                      <td>${formatCurrencyLocal(item.unit_price, language)}</td>
                      <td>${formatCurrencyLocal(item.total_price, language)}</td>
                    </tr>
                  `}).join('')}
                </tbody>
              </table>
              <p class="total">${language === 'ar' ? 'المبلغ الإجمالي' : 'Total'}: ${formatCurrencyLocal(lastSaleInvoice.total, language)}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-hero !mb-0 flex items-center justify-between gap-6 flex-wrap"
        >
          <div>
            <h1 className="text-2xl md:text-[28px] tracking-tight font-bold mb-2 flex items-center gap-3">
                            <span className="text-foreground">
                {language === 'ar' ? 'نقطة البيع' : 'Point de Vente'}
              </span>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {language === 'ar' ? 'إدارة المبيعات والفواتير' : 'Gestion des ventes et factures'}
            </p>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Products Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border border-border shadow-sm hover:shadow-md transition-all bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Search className="w-6 h-6" />
                    {language === 'ar' ? 'ابحث عن المنتجات' : 'Recherche'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div
                    animate={{
                      scale: searchFocused ? 1.02 : 1,
                      boxShadow: searchFocused 
                        ? '0 0 0 3px hsl(var(--electric) / 0.25)'
                        : 'none'
                    }}
                    className="relative"
                  >
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-electric`} />
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder={language === 'ar' ? 'ابحث بالاسم أو الباركود...' : 'Recherchez par nom ou code-barres...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-12 text-lg bg-card border-2 transition-all duration-200 ${
                        searchFocused
                          ? 'border-electric ring-2 ring-ring'
                          : 'border-border'
                      }`}
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Products Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border border-border shadow-sm bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Package className="h-5 w-5 text-electric" /> {language === 'ar' ? `الشواحن (${filteredProducts.length})` : `Chargeurs (${filteredProducts.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredProducts.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <p className="text-5xl mb-4"></p>
                      <p className="text-muted-foreground text-lg font-semibold">
                        {language === 'ar' ? 'لم يتم العثور على شواحن' : 'Aucun chargeur trouvé'}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2">
                        {language === 'ar' ? 'جرب البحث بكلمة أخرى' : 'Essayez une autre recherche'}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                      <AnimatePresence>
                        {filteredProducts.map((product, idx) => {
                          const qty = Number(product.quantity_actual) || 0;
                          const isOut = qty <= 0;
                          const isLowStock = !isOut && qty <= (Number(product.quantity_minimal) || 0);
                          const tiers = [
                            { label: 'P1', value: parseFloat(product.selling_price_1 || product.selling_price || 0), cls: 'bg-primary text-primary-foreground' },
                            { label: 'P2', value: parseFloat(product.selling_price_2 || product.selling_price || 0), cls: 'bg-surface-2 text-foreground' },
                            { label: 'P3', value: parseFloat(product.selling_price_3 || product.selling_price || 0), cls: 'bg-volt text-volt-foreground' },
                          ];
                          return (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.97 }}
                              transition={{ delay: Math.min(idx, 12) * 0.02 }}
                              onClick={() => addToCart(product)}
                              className="group cursor-pointer"
                            >
                              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-electric/40 hover:shadow-md">
                                <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                                  {product.primary_image ? (
                                    <img
                                      src={product.primary_image}
                                      alt={product.name}
                                      loading="lazy"
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                                      <Package className="h-10 w-10" />
                                      <span className="text-xs">{language === 'ar' ? 'بدون صورة' : "Pas d'image"}</span>
                                    </div>
                                  )}
                                  <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur ${isOut ? 'text-destructive' : isLowStock ? 'text-warning' : 'text-success'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${isOut ? 'bg-destructive' : isLowStock ? 'bg-warning' : 'bg-success'}`} />
                                    {qty} {language === 'ar' ? 'في المخزون' : 'en stock'}
                                  </span>
                                  {product.mark && (
                                    <span className="absolute right-3 top-3 rounded-full bg-[#0B1220]/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{product.mark.name}</span>
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col p-4">
                                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-foreground">{product.name}</h3>
                                  {(product.voltage || product.wattage || product.amperage) && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {product.voltage ? <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold tabular-nums">{product.voltage}V</span> : null}
                                      {product.wattage ? <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold tabular-nums">{product.wattage}W</span> : null}
                                      {product.amperage ? <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold tabular-nums">{product.amperage}A</span> : null}
                                    </div>
                                  )}
                                  <div className="mt-auto pt-3">
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {tiers.map((tier) => (
                                        <div key={tier.label} className={`rounded-[10px] px-2 py-1.5 text-center ${tier.cls}`}>
                                          <p className="text-[10px] font-semibold opacity-70">{tier.label}</p>
                                          <p className="truncate text-xs font-bold tabular-nums">{formatCurrencyLocal(tier.value, language)}</p>
                                        </div>
                                      ))}
                                    </div>
                                    <Button
                                      size="sm"
                                      className="mt-3 h-9 w-full rounded-[10px] bg-primary font-semibold text-primary-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(product);
                                      }}
                                    >
                                      <Plus className="mr-1 h-4 w-4" /> {language === 'ar' ? 'إضافة' : 'Ajouter'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Cart Panel */}
          <div className="space-y-6">
            {/* Cart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border border-border shadow-sm sticky top-6 bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-warning">
                      <ShoppingCart className="h-5 w-5" />
                      {language === 'ar' ? `السلة (${cart.length})` : `Panier (${cart.length})`}
                    </CardTitle>
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearCart} className="hover:bg-surface-2">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client Name Input */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-semibold text-foreground flex items-center gap-2">
                        {language === 'en' ? 'Select Client' : 'Sélectionner Client'}
                        {selectedClient && (
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-bold">
                            {selectedClient.name}
                          </span>
                        )}
                      </Label>
                      <Button
                        size="sm"
                        onClick={() => setShowAddClientModal(true)}
                        className="h-7 text-primary-foreground text-xs bg-primary"
                      >
                        <Plus className="w-3 h-3 mr-1" /> {language === 'en' ? 'New' : 'Nouveau'}
                      </Button>
                    </div>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={language === 'en' ? 'Type client name or phone...' : 'Taper nom ou téléphone...'}
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        className="pl-10 border border-border focus:border-border"
                      />
                    </div>
                    
                    {/* Client Dropdown */}
                    {showClientDropdown && clientSearch && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-sm z-50 max-h-48 overflow-y-auto"
                      >
                        {filteredClients.length === 0 ? (
                          <div className="p-3 text-center text-muted-foreground">
                            {language === 'en' ? 'No clients found' : 'Aucun client trouvé'}
                          </div>
                        ) : (
                          filteredClients.map((client) => (
                            <motion.button
                              key={client.id}
                              onClick={() => handleClientSelect(client)}
                              whileHover={{ x: 5 }}
                              className="w-full text-left px-4 py-3 hover:bg-surface-2 border-b border-border last:border-b-0 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-foreground">{client.name}</p>
                                  <p className="text-xs text-muted-foreground">{client.phone}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded bg-surface-2 text-electric">
                                  {client.price_tier === 1 && 'Normal'}
                                  {client.price_tier === 2 && 'Revendeur'}
                                  {client.price_tier === 3 && 'Gros'}
                                </span>
                              </div>
                            </motion.button>
                          ))
                        )}
                      </motion.div>
                    )}

                    {/* Selected Client Info */}
                    {selectedClient && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 rounded-lg border border-border bg-card"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-foreground">{selectedClient.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleClearClient}
                            className="text-destructive hover:bg-surface-2"
                          >
                            
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold">{language === 'ar' ? 'السلة فارغة' : 'Panier vide'}</p>
                        <p className="text-xs">{language === 'ar' ? 'ابحث عن المنتجات' : 'Recherchez des produits'}</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <motion.div 
                          key={item.product.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="rounded-lg p-3 space-y-2 border border-border bg-card"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm text-foreground">{item.product.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.product.id)}
                              className="h-6 w-6 hover:bg-surface-2"
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="h-6 w-6"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="h-6 w-6"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-bold text-success">{formatCurrencyLocal(item.total, language)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder={language === 'ar' ? 'خصم %' : 'Remise %'}
                              value={item.discount}
                              onChange={(e) => updateDiscount(item.product.id, Number(e.target.value))}
                              className="h-6 text-xs border-border"
                              min="0"
                              max="100"
                            />
                            <span className="text-xs text-muted-foreground font-semibold">%</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary */}
            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="text-primary-foreground shadow-sm border border-border bg-primary">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">{language === 'ar' ? 'المجموع' : 'Sous-total'}:</span>
                        <span className="font-bold">{formatCurrencyLocal(subtotal, language)}</span>
                      </div>
                      
                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-primary-foreground">
                          <span>{language === 'ar' ? 'خصم' : 'Remise'}:</span>
                          <span>-{formatCurrencyLocal(totalDiscount, language)}</span>
                        </div>
                      )}
                      
                      <div className="bg-white/10 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">{language === 'ar' ? 'تخفيض إضافي' : 'Réduction'}:</span>
                          <select 
                            value={globalDiscount.type}
                            onChange={(e) => setGlobalDiscount({
                              ...globalDiscount, 
                              type: e.target.value as 'fixed' | 'percentage'
                            })}
                            className="bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white font-semibold"
                          >
                            <option value="fixed" className="bg-primary">DA</option>
                            <option value="percentage" className="bg-primary">%</option>
                          </select>
                        </div>
                        <Input
                          type="number"
                          placeholder={globalDiscount.type === 'fixed' ? 'DA' : '%'}
                          value={globalDiscount.amount}
                          onChange={(e) => setGlobalDiscount({
                            ...globalDiscount,
                            amount: Math.max(0, Number(e.target.value))
                          })}
                          className="h-8 text-sm bg-white/20 border-white/30 text-white placeholder-white/70"
                          min="0"
                        />
                      </div>
                      
                      <div className="border-t border-white/20 pt-3" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>{language === 'ar' ? 'الإجمالي' : 'Total'}:</span>
                        <span>{formatCurrencyLocal(total, language)}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        setPaymentDialog(true);
                        setEditableTotal(total);
                        setReceivedAmount(0);
                      }}
                      className="w-full bg-card text-success hover:bg-white/90 font-bold text-base h-12 rounded-lg shadow-sm"
                    >
                      <CreditCard className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                      {language === 'ar' ? `دفع الآن` : `Payer maintenant`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Create New Client Modal */}
      <AnimatePresence>
        {showAddClientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0B1220]/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setShowAddClientModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl shadow-sm max-w-lg w-full p-8 border border-border bg-card"
            >
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-3xl font-bold text-foreground">
                  {language === 'ar' ? 'إضافة عميل جديد' : 'Ajouter un Client'}
                </h2>
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Full Name Field */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {language === 'ar' ? 'الاسم الكامل' : 'Nom Complet'}
                  </label>
                  <Input
                    value={newClientForm.name}
                    onChange={(e) =>
                      setNewClientForm({
                        ...newClientForm,
                        name: e.target.value,
                      })
                    }
                    placeholder={language === 'ar' ? 'أدخل الاسم' : 'Entrez le nom'}
                    className="mt-2 border border-border focus:border-electric focus:ring-0 h-11 text-base"
                  />
                </motion.div>

                {/* Phone Field */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {language === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
                  </label>
                  <Input
                    value={newClientForm.phone}
                    onChange={(e) =>
                      setNewClientForm({
                        ...newClientForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Entrez le téléphone'}
                    className="mt-2 border border-border focus:border-electric focus:ring-0 h-11 text-base"
                  />
                </motion.div>

                {/* Price Tier Selection */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {language === 'ar' ? 'مستوى السعر' : 'Niveau de Prix'}
                  </label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {[
                      { tier: 1, emoji: '', label: language === 'ar' ? 'عادي' : 'Normal' },
                      { tier: 2, emoji: '', label: language === 'ar' ? 'موزع' : 'Revendeur' },
                      { tier: 3, emoji: '', label: language === 'ar' ? 'جملة' : 'Gros' },
                    ].map(({ tier, emoji, label }) => (
                      <motion.button
                        key={tier}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          setNewClientForm({
                            ...newClientForm,
                            price_tier: tier,
                          })
                        }
                        className={`py-3 px-2 rounded-lg font-bold transition-all border-2 ${
                          newClientForm.price_tier === tier
                            ? tier === 1
                              ? 'bg-surface-2 border-electric text-electric'
                              : tier === 2
                              ? 'bg-surface-2 border-warning text-warning'
                              : 'bg-surface-2 border-success text-success'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        <div className="text-lg">{emoji}</div>
                        <div className="text-xs">{label}</div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Notes Field */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {language === 'ar' ? 'ملاحظات' : 'Notes'}
                  </label>
                  <textarea
                    value={newClientForm.notes}
                    onChange={(e) =>
                      setNewClientForm({
                        ...newClientForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder={language === 'ar' ? 'أدخل ملاحظات اختيارية' : 'Entrez des notes optionnelles'}
                    className="mt-2 border border-border focus:border-electric focus:ring-0 h-24 p-2 rounded-lg text-sm"
                  />
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-border">
                <Button
                  onClick={() => {
                    setShowAddClientModal(false);
                    setNewClientForm({ name: '', phone: '', price_tier: 1, notes: '' });
                  }}
                  className="flex-1 bg-surface-2 text-foreground hover:bg-border border-0"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  onClick={handleAddNewClient}
                  className="flex-1 text-primary-foreground font-bold border-0 shadow-sm bg-primary"
                >
                  {language === 'ar' ? 'إضافة' : 'Créer'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {language === 'ar' ? 'إتمام الدفع' : 'Finaliser le Paiement'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'أدخل المبلغ الذي تم استلامه لإتمام عملية البيع' : 'Entrez le montant reçu pour finaliser la vente'}
            </DialogDescription>
            {selectedClient && (
              <div className="text-sm text-muted-foreground mt-2">
                {language === 'ar' ? 'العميل' : 'Client'}: <span className="font-bold text-foreground">{selectedClient.name}</span>
                <br />
                {language === 'ar' ? 'المستوى' : 'Tier'}: 
                {selectedClient.price_tier === 1 && ' Normal'}
                {selectedClient.price_tier === 2 && ' Revendeur'}
                {selectedClient.price_tier === 3 && ' Gros'}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editableTotal" className="font-bold text-foreground">{language === 'ar' ? 'المبلغ الإجمالي' : 'Total à payer'}</Label>
              <Input
                id="editableTotal"
                type="number"
                value={editableTotal}
                onChange={(e) => setEditableTotal(Number(e.target.value))}
                placeholder={language === 'ar' ? 'المبلغ الإجمالي' : 'Total à payer'}
                className="mt-2 border border-border focus:border-electric h-12 text-lg font-bold"
              />
            </div>

            <div>
              <Label htmlFor="receivedAmount" className="font-bold text-foreground">{language === 'ar' ? 'المبلغ المستلم' : 'Montant reçu'}</Label>
              <Input
                id="receivedAmount"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                placeholder={language === 'ar' ? 'المبلغ نقدا' : 'Montant en espèces'}
                className="mt-2 border border-border focus:border-success h-12 text-lg"
              />
            </div>
            
            <Button
              onClick={() => setReceivedAmount(editableTotal)}
              variant="outline"
              className="w-full border border-border hover:bg-surface-2 h-12 font-bold"
            >
              <DollarSign className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'العميل دفع الكل' : 'Paiement complet'}
            </Button>
            
            {receivedAmount !== 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-lg p-4 font-bold text-center text-lg ${
                  editableTotal - receivedAmount > 0
                    ? 'bg-surface-2 text-destructive'
                    : 'bg-surface-2 text-success'
                }`}
              >
                {editableTotal - receivedAmount > 0 ? (
                  <>
                    <p>{language === 'ar' ? 'المبلغ المتبقي' : 'Reste à payer'}</p>
                    <p className="text-2xl mt-1">{formatCurrencyLocal(editableTotal - receivedAmount, language)}</p>
                  </>
                ) : (
                  <>
                    <p>{language === 'ar' ? 'الباقي' : 'Monnaie'}</p>
                    <p className="text-2xl mt-1">{formatCurrencyLocal(Math.abs(receivedAmount - editableTotal), language)}</p>
                  </>
                )}
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)} className="h-11 font-semibold">
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button 
              onClick={completeSale}
              disabled={receivedAmount < 0}
              className="text-primary-foreground font-bold h-11 bg-primary"
            >
              <Check className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'إتمام البيع' : 'Finaliser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printConfirmationDialog} onOpenChange={setPrintConfirmationDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {language === 'ar' ? 'هل تريد طباعة الفاتورة؟' : 'Imprimer la facture?'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'اختر ما إذا كنت تريد طباعة فاتورة البيع' : 'Choisissez si vous souhaitez imprimer la facture de vente'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintConfirmationDialog(false)} className="h-11 font-semibold">
              {language === 'ar' ? 'لا' : 'Non'}
            </Button>
            <Button 
              onClick={() => { printSaleInvoice(); setPrintConfirmationDialog(false); }} 
              className="text-primary-foreground font-bold h-11 bg-primary"
            >
              <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'نعم، طباعة' : 'Oui, imprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
