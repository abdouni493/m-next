// POS CLIENT SEARCH IMPLEMENTATION GUIDE
// Add these code sections to src/pages/POS.tsx

// ============================================
// 1. ADD CLIENT INTERFACE AFTER Product INTERFACE (around line 85)
// ============================================

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
}

// ============================================
// 2. ADD CLIENT STATES IN export default function POS()
// (Add after existing states around line 140)
// ============================================

  // Client Search States - ADD THESE:
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [showClientSearchDropdown, setShowClientSearchDropdown] = useState(false);
  const clientSearchInputRef = useRef<HTMLInputElement>(null);

// ============================================
// 3. ADD CLIENT FETCH FUNCTION (after fetchProducts function)
// ============================================

  // --- Fetch Clients from Supabase ---
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setAllClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to load clients.' : 'فشل في تحميل العملاء.',
        variant: 'destructive'
      });
    }
  };

// ============================================
// 4. UPDATE useEffect TO INCLUDE fetchClients
// (Modify existing useEffect around line 198)
// ============================================

  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchClients();  // ADD THIS LINE
  }, []);

// ============================================
// 5. ADD CLIENT SEARCH useEffect
// (Add after existing useEffect blocks around line 240)
// ============================================

  // Client search with auto-filter
  useEffect(() => {
    if (clientSearchQuery.trim() === '') {
      setFilteredClients(allClients);
    } else {
      const query = clientSearchQuery.toLowerCase();
      const filtered = allClients.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.phone.includes(clientSearchQuery)
      );
      setFilteredClients(filtered);
    }
  }, [clientSearchQuery, allClients]);

// ============================================
// 6. ADD CLIENT SELECTION HANDLER
// (Add after other handler functions)
// ============================================

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientName(client.name);
    setClientSearchQuery('');
    setShowClientSearchDropdown(false);
    
    // IMPORTANT: Recalculate cart with client's price tier
    recalculateCartWithClientPriceTier(client.price_tier);
  };

  // Clear selected client
  const handleClearClient = () => {
    setSelectedClient(null);
    setClientName('');
    setClientSearchQuery('');
    
    // Reset cart to normal prices (tier 1)
    recalculateCartWithClientPriceTier(1);
  };

  // Recalculate cart prices based on client price tier
  const recalculateCartWithClientPriceTier = (priceTier: number) => {
    const updatedCart = cart.map(item => {
      // Get the product to find its prices
      const product = products.find(p => p.id === item.id);
      if (!product) return item;

      // Select price based on tier
      let newPrice = product.selling_price; // Default to tier 1
      
      // Try to use three-tier prices if available
      if (product.selling_price_1) {
        if (priceTier === 1) {
          newPrice = product.selling_price_1;
        } else if (priceTier === 2 && product.selling_price_2) {
          newPrice = product.selling_price_2;
        } else if (priceTier === 3 && product.selling_price_3) {
          newPrice = product.selling_price_3;
        } else {
          newPrice = product.selling_price_1;
        }
      }

      return {
        ...item,
        price_per_unit: newPrice,
        price_tier: priceTier,
        line_total: newPrice * item.quantity
      };
    });

    setCart(updatedCart);
  };

// ============================================
// 7. UPDATE Product INTERFACE to include three prices
// (Modify around line 65)
// ============================================

interface Product {
  id: string;
  name: string;
  mark_id?: string;
  mark?: any;
  connector_type_id?: string;
  connector_type?: any;
  barcode?: string;
  quantity_actual: number;
  quantity_initial: number;
  quantity_minimal: number;
  purchase_price: number;
  selling_price: number;
  selling_price_1?: number;      // ADD THIS
  selling_price_2?: number;      // ADD THIS
  selling_price_3?: number;      // ADD THIS
  margin_percent?: number;
  last_price_to_sell?: number;
  store_id: string;
  description?: string;
  [key: string]: any;
}

// ============================================
// 8. UPDATE CartItem interface to include price_tier
// (Modify around line 65)
// ============================================

interface CartItem extends Product {
  quantity: number;
  price_per_unit: number;
  line_total: number;
  price_tier?: number;  // ADD THIS - track which tier was used
}

// ============================================
// 9. UPDATE addToCart function to include price_tier
// (Modify existing addToCart function)
// ============================================

  const addToCart = (product: Product, quantity: number = 1) => {
    // Use selected client's price tier if available
    const priceTier = selectedClient?.price_tier || 1;
    
    // Determine which price to use
    let priceToUse = product.selling_price;
    if (product.selling_price_1) {
      if (priceTier === 1) {
        priceToUse = product.selling_price_1;
      } else if (priceTier === 2 && product.selling_price_2) {
        priceToUse = product.selling_price_2;
      } else if (priceTier === 3 && product.selling_price_3) {
        priceToUse = product.selling_price_3;
      } else {
        priceToUse = product.selling_price_1;
      }
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                line_total: (item.quantity + quantity) * priceToUse,
                price_tier: priceTier  // ADD THIS
              }
            : item
        );
      }

      return [...prevCart, {
        ...product,
        quantity,
        price_per_unit: priceToUse,
        line_total: quantity * priceToUse,
        price_tier: priceTier  // ADD THIS
      }];
    });
  };

// ============================================
// 10. UPDATE cartTotal calculation to use updated prices
// (Find and update the cartTotal calculation)
// ============================================

  const cartTotal = cart.reduce((sum, item) => sum + item.line_total, 0);

// ============================================
// 11. ADD CLIENT SEARCH UI COMPONENT
// (Add this in the JSX before the product search, around line 600)
// ============================================

{/* CLIENT SEARCH SECTION - ADD THIS */}
<Card className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-700">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg flex items-center gap-2">
      <span>👥</span>
      {language === 'en' ? 'Select Client' : 'اختر العميل'}
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {selectedClient ? (
      // SHOW SELECTED CLIENT
      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-cyan-200 dark:border-cyan-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
              {selectedClient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {selectedClient.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                📱 {selectedClient.phone}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <Badge className={
              selectedClient.price_tier === 1 ? 'bg-blue-500' :
              selectedClient.price_tier === 2 ? 'bg-amber-500' :
              'bg-green-500'
            }>
              {selectedClient.price_tier === 1 ? 'Normal' :
               selectedClient.price_tier === 2 ? 'Revendeur' : 'Gros'}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearClient}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    ) : (
      // SEARCH INPUT
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          ref={clientSearchInputRef}
          type="text"
          placeholder={language === 'en' ? 'Search by name or phone...' : 'ابحث بالاسم أو الهاتف...'}
          value={clientSearchQuery}
          onChange={(e) => setClientSearchQuery(e.target.value)}
          onFocus={() => setShowClientSearchDropdown(true)}
          className="w-full pl-10 pr-4 py-2 border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500"
        />

        {/* DROPDOWN SUGGESTIONS */}
        {showClientSearchDropdown && filteredClients.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredClients.slice(0, 10).map(client => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className="w-full text-left px-4 py-2 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {client.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {client.phone}
                  </p>
                </div>
                <Badge variant="outline" className={
                  client.price_tier === 1 ? 'border-blue-300 text-blue-700' :
                  client.price_tier === 2 ? 'border-amber-300 text-amber-700' :
                  'border-green-300 text-green-700'
                }>
                  {client.price_tier === 1 ? 'Normal' :
                   client.price_tier === 2 ? 'Revendeur' : 'Gros'}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {clientSearchQuery && filteredClients.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700 rounded-lg p-3 text-center text-slate-600 dark:text-slate-400 text-sm">
            {language === 'en' ? 'No clients found' : 'لم يتم العثور على عملاء'}
          </div>
        )}
      </div>
    )}
  </CardContent>
</Card>

// ============================================
// 12. UPDATE CHECKOUT/PAYMENT SECTION
// (When saving invoice, include selected client)
// ============================================

  // In the save invoice function, add:
  const invoiceData = {
    // ... existing data
    customer_id: selectedClient?.id || null,  // ADD THIS
    client_name: selectedClient?.name || clientName,  // UPDATE THIS
    // ... rest of data
  };

// ============================================
// 13. UPDATE CART ITEM DISPLAY TO SHOW PRICE TIER
// (In the cart table/list display)
// ============================================

// Add this column/info when displaying cart items:
<div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
  {item.price_tier ? (
    item.price_tier === 1 ? '💰 Normal Price' :
    item.price_tier === 2 ? '🔄 Revendeur Price' :
    '📦 Gros Price'
  ) : null}
</div>

// ============================================
// END OF IMPLEMENTATION GUIDE
// ============================================

// SUMMARY OF CHANGES:
// 1. Added Client interface ✓
// 2. Added 6 client-related states ✓
// 3. Added fetchClients function ✓
// 4. Updated useEffect to fetch clients ✓
// 5. Added client search useEffect ✓
// 6. Added handler functions for client selection ✓
// 7. Updated Product interface with three prices ✓
// 8. Updated CartItem interface with price_tier ✓
// 9. Updated addToCart to respect client pricing ✓
// 10. Added client search UI component ✓
// 11. Updated checkout to save client_id ✓
// 12. Updated cart display to show which price tier ✓

// TEST CHECKLIST:
// - [ ] Clients page loads and displays clients
// - [ ] Client search works by name and phone
// - [ ] Autocomplete dropdown appears
// - [ ] Can select a client
// - [ ] Selected client badge shows correct tier
// - [ ] Cart items update prices when client is selected
// - [ ] Different tiers show different prices
// - [ ] Can clear client selection
// - [ ] Invoice saves with client_id
// - [ ] Client price tier is correctly applied
