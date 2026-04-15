import { createClient } from '@supabase/supabase-js';

// NEW DATABASE CONNECTION
// Update these in .env.local with your NEW Supabase project credentials
// Old database (pzzngzaljrfrbteclexi) is NO LONGER USED

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Missing Supabase credentials in environment variables!');
  console.error('📋 Please create .env.local with:');
  console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=eyJ...');
  console.error('📖 See .env.local.example for more details');
  throw new Error('Supabase credentials not configured!');
}

// Use service role key if available for unrestricted access, otherwise use anon key
const authKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const isUsingServiceRole = !!SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(SUPABASE_URL, authKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'chargeur-app',
    },
  },
  db: {
    schema: 'public',
  },
});

// Log which key is being used
console.log(`🔑 Supabase initialized with ${isUsingServiceRole ? 'SERVICE ROLE KEY' : 'ANON KEY'}`);

// ========== USER MANAGEMENT ==========

export const signUp = async (email: string, password: string, username: string) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Wait a moment for auth to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create user profile in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user?.id,
          email,
          username,
          role: 'admin',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error('User profile creation error:', userError);
      // Don't throw - user auth succeeded even if profile creation fails
    }

    return { user: userData || { id: authData.user?.id, email }, authUser: authData.user };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Return auth user directly (avoid RLS issues on users table)
    // The auth.user() already contains necessary user data
    return { user: { id: data.user?.id, email: data.user?.email }, authUser: data.user };
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Signout error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// ========== PRODUCTS ==========

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createProduct = async (product: any) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== SUPPLIERS ==========

export const getSuppliers = async () => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createSupplier = async (supplier: any) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([supplier])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSupplier = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSupplier = async (id: string) => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== CATEGORIES ==========

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createCategory = async (name: string, description?: string) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, description }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, name: string, description?: string) => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== INVOICES ==========

export const getInvoices = async (type?: string) => {
  let query = supabase.from('invoices').select('*');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.order('created_at', {
    ascending: false,
  });

  if (error) throw error;
  return data;
};

export const createInvoice = async (invoice: any) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([invoice])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInvoice = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteInvoice = async (id: string) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== EMPLOYEES ==========

export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createEmployee = async (employee: any) => {
  const { data, error } = await supabase
    .from('employees')
    .insert([employee])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEmployee = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEmployee = async (id: string) => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== PAYMENTS (PAIEMENTS) ==========

export const createPayment = async (payment: any) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([payment])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getPaymentHistory = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const deletePayment = async (id: string) => {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getTotalPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('amount');

  if (error) throw error;
  
  // Sum all payment amounts
  const total = data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
  return total;
};

export const getPaymentsThisMonth = async () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', firstDay.toISOString().split('T')[0])
    .lte('date', lastDay.toISOString().split('T')[0]);

  if (error) throw error;
  
  // Sum all payment amounts for this month
  const total = data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
  return total;
};

// ========== STORES (MAGASINS) ==========

export const getStores = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, display_name, logo_data, address, phone, email, city, country, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createStore = async (store: any) => {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('stores')
    .insert([{ ...store, created_by: user.data.user?.id || null }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateStore = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStore = async (id: string) => {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== SHELVINGS (ETAGERS) ==========

export const getShelvings = async (storeId?: string) => {
  let query = supabase.from('shelvings').select('*').eq('is_active', true);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createShelving = async (shelving: any) => {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('shelvings')
    .insert([{ ...shelving, created_by: user.data.user?.id || null }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateShelving = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('shelvings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteShelving = async (id: string) => {
  const { error } = await supabase
    .from('shelvings')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ========== CREATE PURCHASE INVOICE ==========

export const createPurchaseInvoice = async (
  supplierId: string,
  items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>,
  notes?: string
) => {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax_amount = subtotal * 0.19; // 19% VAT for Algeria
  const total_amount = subtotal + tax_amount;

  // Create invoice without created_by field to avoid foreign key constraint
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([
      {
        invoice_number: `PUR-${Date.now()}`,
        type: 'purchase',
        supplier_id: supplierId,
        subtotal,
        tax_amount,
        total_amount,
        status: 'pending',
        notes,
      },
    ])
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  // Create invoice items
  const invoiceItems = items.map(item => ({
    invoice_id: invoice.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems);

  if (itemsError) throw itemsError;

  return invoice;
};

// ========== DASHBOARD STATS ==========

export const getDashboardStats = async () => {
  try {
    const [products, invoices, employees] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('employees').select('*'),
    ]);

    return {
      totalProducts: products.data?.length || 0,
      totalSalesInvoices: invoices.data?.filter((i) => i.type === 'sale').length || 0,
      totalPurchaseInvoices: invoices.data?.filter((i) => i.type === 'purchase').length || 0,
      totalEmployees: employees.data?.length || 0,
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
};

// ========== USER PROFILE & SYSTEM INFO ==========

export const getUserProfile = async () => {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return null;

    // First try to get existing profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // User profile doesn't exist, create one
      console.log('User profile not found, creating new profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.user.id,
            email: authUser.user.email,
            username: authUser.user.email?.split('@')[0] || 'user',
            role: 'admin',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user profile:', createError);
        // Return basic auth user info as fallback
        return {
          id: authUser.user.id,
          email: authUser.user.email,
          username: authUser.user.email?.split('@')[0] || 'user',
          role: 'admin'
        };
      }

      return newProfile;
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    // Return basic auth user info as fallback
    const { data: authUser } = await supabase.auth.getUser();
    return authUser.user ? {
      id: authUser.user.id,
      email: authUser.user.email,
      username: authUser.user.email?.split('@')[0] || 'user',
      role: 'admin'
    } : null;
  }
};

export const updateUserProfile = async (updates: { username?: string }) => {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) throw new Error('User not authenticated');

    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.user.id)
      .single();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.user.id,
            email: authUser.user.email,
            username: updates.username || authUser.user.email?.split('@')[0] || 'user',
            role: 'admin',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Update existing profile
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', authUser.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

export const getSystemInfo = async () => {
  try {
    // Get database size (approximate)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact' });

    if (productsError) throw productsError;

    // Get last backup info (we'll use a simple timestamp for now)
    const lastBackup = localStorage.getItem('lastBackup') || 'Jamais';

    // Calculate approximate database size (rough estimate)
    const dbSize = (products?.length || 0) * 1024; // Rough estimate: 1KB per product

    return {
      version: '1.0.0',
      database: 'Supabase',
      lastBackup,
      diskSpace: `${(dbSize / 1024 / 1024).toFixed(2)} MB`,
      uptime: 'N/A', // Supabase handles this
      networkStatus: 'connected'
    };
  } catch (error) {
    console.error('Get system info error:', error);
    return {
      version: '1.0.0',
      database: 'Supabase',
      lastBackup: 'N/A',
      diskSpace: 'N/A',
      uptime: 'N/A',
      networkStatus: 'disconnected'
    };
  }
};

// ========== WEBSITE MANAGEMENT ==========

// Website Settings
export const getWebsiteSettings = async () => {
  try {
    const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
    const response = await fetch(
      `${SUPABASE_REST_URL}/website_settings?select=*&limit=1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('❌ REST API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('📊 Website Settings Fetched:', {
      dataLength: data?.length,
      hasData: data && Array.isArray(data) && data.length > 0,
      firstRecord: data?.[0],
      imageUrl: data?.[0]?.landing_page_image_url,
    });
    
    return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('❌ Error fetching website settings via REST:', error);
    return null;
  }
};

export const updateWebsiteSettings = async (updates: any) => {
  const { data, error } = await supabase
    .from('website_settings')
    .update(updates)
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Offers
export const getOffers = async () => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        products!offers_product_id_fkey(
          voltage,
          wattage,
          amperage,
          mark:mark_id(name),
          connector:connector_type_id(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      // Return empty array instead of throwing - allows UI to handle gracefully
      return [];
    }
    
    // Transform data to include specs at top level
    return data?.map((offer: any) => ({
      ...offer,
      voltage: offer.products?.voltage || offer.voltage,
      wattage: offer.products?.wattage || offer.wattage,
      amperage: offer.products?.amperage || offer.amperage,
      connection_type: offer.products?.connector?.name || offer.connection_type,
      product_mark: offer.product_mark || offer.products?.mark?.name
    })) || [];
  } catch (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
};

export const getVisibleOffers = async () => {
  const { data, error } = await supabase
    .from('visible_offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createOffer = async (offer: any) => {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('offers')
    .insert([{ ...offer, created_by: user.data.user?.id || null }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateOffer = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('offers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteOffer = async (id: string) => {
  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Special Offers
export const getSpecialOffers = async () => {
  try {
    const { data, error } = await supabase
      .from('special_offers')
      .select(`
        *,
        products!special_offers_product_id_fkey(
          voltage,
          wattage,
          amperage,
          mark:mark_id(name),
          connector:connector_type_id(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      // Return empty array instead of throwing
      return [];
    }
    
    // Transform data to include specs at top level
    return data?.map((offer: any) => ({
      ...offer,
      voltage: offer.products?.voltage || offer.voltage,
      wattage: offer.products?.wattage || offer.wattage,
      amperage: offer.products?.amperage || offer.amperage,
      connection_type: offer.products?.connector?.name || offer.connection_type,
      product_mark: offer.product_mark || offer.products?.mark?.name,
      offer_price: offer.special_price || offer.offer_price
    })) || [];
  } catch (error) {
    console.error('Error fetching special offers:', error);
    return [];
  }
};

export const getVisibleSpecialOffers = async () => {
  const { data, error } = await supabase
    .from('visible_special_offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createSpecialOffer = async (specialOffer: any) => {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('special_offers')
    .insert([{ ...specialOffer, created_by: user.data.user?.id || null }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSpecialOffer = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('special_offers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSpecialOffer = async (id: string) => {
  const { error } = await supabase
    .from('special_offers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ==================== ORDERS/COMMANDS FUNCTIONS ====================

// Get all orders via REST API
export const getOrders = async () => {
  try {
    const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
    const response = await fetch(
      `${SUPABASE_REST_URL}/orders?select=*&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('REST API error fetching orders:', response.status, error);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching orders via REST:', error);
    return [];
  }
};

// Get single order with items via REST API
export const getOrderById = async (id: string) => {
  try {
    const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
    
    // Fetch order
    const orderRes = await fetch(
      `${SUPABASE_REST_URL}/orders?id=eq.${id}&select=*`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (!orderRes.ok) {
      console.error('Failed to fetch order:', orderRes.status);
      throw new Error('Order not found');
    }
    
    const orders = await orderRes.json();
    if (!orders || orders.length === 0) {
      throw new Error('Order not found');
    }

    const order = orders[0];

    // Fetch order items with product details
    const itemsRes = await fetch(
      `${SUPABASE_REST_URL}/order_items?order_id=eq.${id}&select=*`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (!itemsRes.ok) {
      console.error('Failed to fetch order items:', itemsRes.status);
      throw new Error('Failed to fetch order items');
    }
    
    const items = await itemsRes.json();

    // Fetch product data for each item (including images)
    const itemsWithDetails = await Promise.all(
      (items || []).map(async (item: any) => {
        try {
          const productRes = await fetch(
            `${SUPABASE_REST_URL}/products?id=eq.${item.product_id}&select=id,name,description,primary_image,voltage,wattage,amperage,connector_type_id,mark_id`,
            {
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
              },
            }
          );

          if (productRes.ok) {
            const products = await productRes.json();
            if (products && products.length > 0) {
              const product = products[0];
              return {
                ...item,
                product_name: item.product_name || product.name,
                product_image: item.product_image || product.primary_image,
                product_description: item.product_description || product.description,
                voltage: item.voltage || product.voltage,
                wattage: item.wattage || product.wattage,
                amperage: item.amperage || product.amperage,
                connector_type_id: item.connector_type_id || product.connector_type_id,
                mark_id: item.mark_id || product.mark_id,
              };
            }
          }
        } catch (error) {
          console.error('Error fetching product details:', error);
        }
        return item;
      })
    );

    return { ...order, items: itemsWithDetails };
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    throw error;
  }
};

// Create new order via REST API
export const createOrder = async (orderData: any) => {
  try {
    const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
    
    // Extract items from orderData if present
    const { items, ...order } = orderData;

    // Create the order
    const response = await fetch(
      `${SUPABASE_REST_URL}/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(order)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('REST API error creating order:', response.status, error);
      throw new Error(`Failed to create order: ${error.message || response.statusText}`);
    }

    const createdOrder = await response.json();
    const orderId = (Array.isArray(createdOrder) ? createdOrder[0] : createdOrder).id;

    // If items provided, add them to the order
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        product_mark: item.product_mark,
        product_description: item.product_description,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        line_total: item.quantity * item.price_per_unit,
        from_offer: item.from_offer || false,
        offer_id: item.offer_id || null,
      }));

      const itemsRes = await fetch(
        `${SUPABASE_REST_URL}/order_items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(orderItems)
        }
      );

      if (!itemsRes.ok) {
        const error = await itemsRes.json();
        console.error('Error adding order items:', error);
        // Continue - order was created even if items failed
      }
    }

    return Array.isArray(createdOrder) ? createdOrder[0] : createdOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Update order
export const updateOrder = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete order
export const deleteOrder = async (id: string) => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Confirm order (pending -> confirmed)
export const confirmOrder = async (id: string) => {
  try {
    console.log('📝 Confirming order:', id);
    
    // Try updating with Supabase client first
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'confirmed'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('⚠️ Supabase client error, trying with timestamp:', error.message);
      
      // If that fails, it might be an RLS issue, so let's retry with explicit values
      const now = new Date().toISOString();
      const { data: data2, error: error2 } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: now
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error2) {
        console.error('❌ Error confirming order:', error2);
        throw error2;
      }
      
      console.log('✅ Order confirmed:', data2.id);
      return data2;
    }

    console.log('✅ Order confirmed:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error confirming order:', error);
    throw error;
  }
};

// Start delivery (confirmed -> on_delivery)
export const startOrderDelivery = async (id: string) => {
  try {
    console.log('📦 Starting delivery for order:', id);
    
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'on_delivery',
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error starting delivery:', error);
      throw error;
    }

    console.log('✅ Delivery started for order:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error starting delivery:', error);
    throw error;
  }
};

// Finalize order (on_delivery -> delivered)
// Also deducts inventory from products
export const finalizeOrder = async (id: string) => {
  try {
    console.log('Starting finalize order for:', id);

    // STEP 1: Get order items to deduct inventory
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      throw itemsError;
    }

    console.log('Order items to deduct:', items?.length || 0);

    // STEP 2: Deduct inventory for each product
    if (items && items.length > 0) {
      for (const item of items) {
        try {
          // Get current inventory
          const { data: product, error: getError } = await supabase
            .from('products')
            .select('quantity_actual')
            .eq('id', item.product_id)
            .single();

          if (getError) {
            console.warn(`⚠️ Product ${item.product_id} not found`);
            continue;
          }

          if (product && product.quantity_actual !== undefined) {
            const currentQty = product.quantity_actual;
            const newQty = Math.max(0, currentQty - item.quantity); // Don't go below 0

            console.log(`Deducting inventory for product ${item.product_id}: ${currentQty} → ${newQty}`);

            const { error: updateError } = await supabase
              .from('products')
              .update({ quantity_actual: newQty })
              .eq('id', item.product_id);

            if (updateError) {
              console.warn(`⚠️ Error updating product inventory:`, updateError);
              // Continue - don't fail the entire order if one product fails
            }
          }
        } catch (itemError) {
          console.warn(`⚠️ Error processing item:`, itemError);
        }
      }
    }

    // STEP 3: Update order status to delivered
    console.log('Updating order status to delivered...');
    
    const now = new Date().toISOString();
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating order status:', updateError);
      throw updateError;
    }

    console.log('✅ Order delivered:', updatedOrder.id);

    console.log('✅ Order finalized successfully!');
    return updatedOrder;
  } catch (error) {
    console.error('❌ Error finalizing order:', error);
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (id: string, reason?: string) => {
  try {
    console.log('❌ Cancelling order:', id);
    
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        updated_at: now,
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error cancelling order:', error);
      throw error;
    }

    console.log('✅ Order cancelled:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    throw error;
  }
};


// Add item to order
export const addOrderItem = async (orderItem: any) => {
  const { data, error } = await supabase
    .from('order_items')
    .insert([orderItem])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update order item
export const updateOrderItem = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('order_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete order item
export const deleteOrderItem = async (id: string) => {
  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ==================== SHOPPING CART FUNCTIONS ====================

// Get or create cart
export const getOrCreateCart = async (sessionId: string) => {
  // Check if cart exists
  const { data: existingCart, error: fetchError } = await supabase
    .from('shopping_carts')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (!fetchError && existingCart) {
    return existingCart;
  }

  // Create new cart
  const { data: newCart, error: createError } = await supabase
    .from('shopping_carts')
    .insert([{ session_id: sessionId }])
    .select()
    .single();

  if (createError) throw createError;
  return newCart;
};

// Get cart items
export const getCartItems = async (cartId: string) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Add item to cart
export const addToCart = async (cartItem: any) => {
  // Check if item already exists
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartItem.cart_id)
    .eq('product_id', cartItem.product_id)
    .single();

  if (existing) {
    // Update quantity
    return updateCartItem(existing.id, {
      quantity: existing.quantity + (cartItem.quantity || 1)
    });
  }

  // Add new item
  const { data, error } = await supabase
    .from('cart_items')
    .insert([cartItem])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update cart item quantity
export const updateCartItem = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('cart_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Remove item from cart
export const removeFromCart = async (id: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Clear cart
export const clearCart = async (cartId: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId);

  if (error) throw error;
};

// ========== DIRECT REST API CALLS (Bypasses Auth Issues) ==========
// These bypass the Supabase client and use direct REST API calls
// Useful when JWT/RLS is blocking the Supabase client

const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

export const getOffersREST = async () => {
  try {
    const response = await fetch(
      `${SUPABASE_REST_URL}/offers?select=*,products!offers_product_id_fkey(voltage,wattage,amperage,mark:mark_id(name,logo_url),connector:connector_type_id(name))&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('REST API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data?.map((offer: any) => ({
      ...offer,
      voltage: offer.products?.voltage || offer.voltage,
      wattage: offer.products?.wattage || offer.wattage,
      amperage: offer.products?.amperage || offer.amperage,
      connection_type: offer.products?.connector?.name || offer.connection_type,
      product_mark: offer.product_mark || offer.products?.mark?.name,
      brand_logo: offer.products?.mark?.logo_url
    })) || [];
  } catch (error) {
    console.error('Error fetching offers via REST:', error);
    return [];
  }
};

export const getSpecialOffersREST = async () => {
  try {
    const response = await fetch(
      `${SUPABASE_REST_URL}/special_offers?select=*,products!special_offers_product_id_fkey(voltage,wattage,amperage,mark:mark_id(name,logo_url),connector:connector_type_id(name))&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('REST API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data?.map((offer: any) => ({
      ...offer,
      voltage: offer.products?.voltage || offer.voltage,
      wattage: offer.products?.wattage || offer.wattage,
      amperage: offer.products?.amperage || offer.amperage,
      connection_type: offer.products?.connector?.name || offer.connection_type,
      product_mark: offer.product_mark || offer.products?.mark?.name,
      offer_price: offer.special_price || offer.offer_price,
      brand_logo: offer.products?.mark?.logo_url
    })) || [];
  } catch (error) {
    console.error('Error fetching special offers via REST:', error);
    return [];
  }
};

export const getWebsiteSettingsREST = async () => {
  try {
    const response = await fetch(
      `${SUPABASE_REST_URL}/website_settings?select=*&limit=1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('REST API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching website settings via REST:', error);
    return null;
  }
};

// Get order by ID with product images via REST API
// Get order by ID with items using proper Supabase relationship
export const getOrderByIdREST = async (id: string) => {
  try {
    console.log(`🔍 Fetching order ${id} with items...`);
    
    // Use Supabase client to fetch order with nested order_items
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
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
        )
      `)
      .eq('id', id)
      .single();

    if (orderError) {
      console.error('❌ Error fetching order with items:', orderError);
      throw orderError;
    }

    if (!orderData) {
      console.error('❌ Order not found:', id);
      throw new Error('Order not found');
    }

    const itemsCount = orderData.order_items?.length || 0;
    console.log(`✅ Order ${id} has ${itemsCount} item(s)`);
    console.log('📋 Full order with items:', orderData);

    // Ensure order_items is always an array
    return {
      ...orderData,
      order_items: orderData.order_items || [],
      items: orderData.order_items || [] // For backward compatibility
    };
  } catch (error) {
    console.error('❌ Error fetching order via Supabase:', error);
    throw error;
  }
};

// Get cart with totals
export const getCartWithTotals = async (cartId: string) => {
  const items = await getCartItems(cartId);
  const totalPrice = items.reduce((sum, item) => sum + (item.price_per_unit * item.quantity), 0);
  
  return {
    items,
    totalPrice,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  };
};

// Convert cart to order
export const convertCartToOrder = async (cartId: string, orderData: any) => {
  const cartItems = await getCartItems(cartId);

  // Create order
  const order = await createOrder(orderData);

  // Add items to order
  for (const item of cartItems) {
    await addOrderItem({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      product_mark: item.product_mark,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit,
      line_total: item.price_per_unit * item.quantity,
      from_offer: item.from_offer,
      offer_id: item.offer_id
    });
  }

  // Clear cart
  await clearCart(cartId);

  return order;
};

// Create order via REST API (bypassing Supabase client)
export const createOrderREST = async (orderData: any, cartItems?: any[]) => {
  let orderId: string | null = null;
  try {
    console.log('📝 Creating order with data:', orderData);
    console.log('🛒 Cart items to add:', cartItems);
    
    const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
    
    // Step 1: Create the order
    const response = await fetch(
      `${SUPABASE_REST_URL}/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(orderData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ REST API error creating order:', response.status, error);
      throw new Error(`Failed to create order: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const order = data && Array.isArray(data) ? data[0] : data;
    orderId = order.id;
    console.log('✅ Order created with ID:', order.id);

    // Step 2: Insert cart items into order_items table
    if (cartItems && cartItems.length > 0) {
      console.log(`📦 Inserting ${cartItems.length} items into order_items...`);
      
      const orderItemsData = cartItems.map(item => {
        const pricePerUnit = item.price || 0;
        const quantity = item.quantity || 1;
        return {
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.name || item.product_name,
          quantity: quantity,
          price_per_unit: pricePerUnit,
          line_total: pricePerUnit * quantity,
          product_image: item.image || item.product_image,
          product_mark: item.product_mark,
          product_description: item.product_description,
          from_offer: item.from_offer || false,
          offer_id: item.offer_id || null
        };
      });

      const itemsResponse = await fetch(
        `${SUPABASE_REST_URL}/order_items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(orderItemsData)
        }
      );

      if (!itemsResponse.ok) {
        const itemError = await itemsResponse.json();
        console.error('❌ Error inserting order items:', itemsResponse.status, itemError);
        throw new Error(`Failed to insert order items: ${itemError.message || itemsResponse.statusText}`);
      }

      const insertedItems = await itemsResponse.json();
      console.log(`✅ Successfully inserted ${insertedItems.length || orderItemsData.length} items`);
    } else {
      console.warn('⚠️ No cart items provided for order');
    }

    return order;
  } catch (error) {
    // Rollback: delete the order if items insertion failed
    if (orderId) {
      console.log(`🔄 Rolling back - deleting order ${orderId} due to error...`);
      try {
        const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
        await fetch(
          `${SUPABASE_REST_URL}/orders?id=eq.${orderId}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_ANON_KEY
            }
          }
        );
        console.log(`✅ Order ${orderId} rolled back`);
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
    }
    console.error('❌ Error creating order via REST:', error);
    throw error;
  }
};

// Delete order (for rollback on item insert failure)
export const deleteOrderRollback = async (orderId: string) => {
  try {
    console.log(`🔄 Rolling back - deleting order ${orderId}...`);
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error(`❌ Error deleting order during rollback:`, error);
      throw error;
    }
    console.log(`✅ Order ${orderId} deleted successfully`);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
};

// ========== PACKAGES MANAGEMENT ==========

// Get all packages
export const getPackages = async () => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

// Get visible packages for website
export const getVisiblePackagesREST = async () => {
  try {
    const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
    const response = await fetch(
      `${SUPABASE_REST_URL}/visible_packages`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching visible packages:', error);
    throw error;
  }
};

// Get all package items
export const getPackageItems = async () => {
  try {
    const { data, error } = await supabase
      .from('package_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching package items:', error);
    throw error;
  }
};

// Get package details with items
export const getPackageDetails = async (packageId: string) => {
  try {
    const { data, error } = await supabase
      .from('package_items')
      .select('*')
      .eq('package_id', packageId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching package details:', error);
    throw error;
  }
};

// Create package
export const createPackage = async (packageData: any) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .insert([packageData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
};

// Update package
export const updatePackage = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
};

// Delete package
export const deletePackage = async (id: string) => {
  try {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting package:', error);
    throw error;
  }
};

// Add product to package
export const addProductToPackage = async (packageId: string, product: any, quantity: number = 1, customPrice: number = 0) => {
  try {
    const { data, error } = await supabase
      .from('package_items')
      .insert([{
        package_id: packageId,
        product_id: product.id,
        product_name: product.name,
        product_image: product.primary_image,
        product_mark: product.mark?.name,
        product_voltage: product.voltage,
        product_amperage: product.amperage,
        product_wattage: product.wattage,
        quantity: quantity,
        custom_price: customPrice > 0 ? customPrice : null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding product to package:', error);
    throw error;
  }
};

// Remove product from package
export const removeProductFromPackage = async (itemId: string) => {
  try {
    const { error } = await supabase
      .from('package_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing product from package:', error);
    throw error;
  }
};

// Update package item quantity
export const updatePackageItemQuantity = async (itemId: string, quantity: number) => {
  try {
    const { data, error } = await supabase
      .from('package_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating package item quantity:', error);
    throw error;
  }
};

// ========== ENHANCED SPECIAL OFFERS - PRICE VISIBILITY ==========

// Update special offer with price visibility
export const updateSpecialOfferVisibility = async (id: string, showPrice: boolean, description: string) => {
  try {
    const { data, error } = await supabase
      .from('special_offers')
      .update({
        show_price: showPrice,
        description: description,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating special offer visibility:', error);
    throw error;
  }
};

// ========== DELIVERY AGENCIES MANAGEMENT ==========

// Get all delivery agencies
export const getDeliveryAgencies = async () => {
  try {
    const { data, error } = await supabase
      .from('delivery_agencies')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching delivery agencies:', error);
    throw error;
  }
};

// Get visible delivery agencies for customers
export const getVisibleDeliveryAgencies = async () => {
  try {
    const { data, error } = await supabase
      .from('delivery_agencies_with_prices')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching visible delivery agencies:', error);
    throw error;
  }
};

// Create delivery agency
export const createDeliveryAgency = async (agencyData: any) => {
  try {
    const { data, error } = await supabase
      .from('delivery_agencies')
      .insert([agencyData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating delivery agency:', error);
    throw error;
  }
};

// Update delivery agency
export const updateDeliveryAgency = async (id: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('delivery_agencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating delivery agency:', error);
    throw error;
  }
};

// Delete delivery agency
export const deleteDeliveryAgency = async (id: string) => {
  try {
    const { error } = await supabase
      .from('delivery_agencies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting delivery agency:', error);
    throw error;
  }
};

// Toggle delivery agency visibility
export const toggleDeliveryAgencyVisibility = async (id: string, isVisible: boolean) => {
  try {
    const { data, error } = await supabase
      .from('delivery_agencies')
      .update({ is_visible: !isVisible })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling delivery agency visibility:', error);
    throw error;
  }
};

// ========== DELIVERY AGENCY WILAYA PRICING FUNCTIONS ==========

// Get all wilaya prices for an agency
export const getWilayaPrices = async (agencyId: string) => {
  try {
    const { data, error } = await supabase
      .from('delivery_agency_wilaya_prices')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('is_active', true)
      .order('wilaya_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching wilaya prices:', error);
    throw error;
  }
};

// Get price for specific wilaya
export const getWilayaPrice = async (agencyId: string, wilayaName: string) => {
  try {
    const { data, error } = await supabase
      .from('delivery_agency_wilaya_prices')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('wilaya_name', wilayaName)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data || null;
  } catch (error) {
    console.error('Error fetching wilaya price:', error);
    throw error;
  }
};

// Create or update wilaya price
export const upsertWilayaPrice = async (agencyId: string, wilayaName: string, priceDomicile: number, priceBureau: number) => {
  try {
    const { data, error } = await supabase
      .from('delivery_agency_wilaya_prices')
      .upsert({
        agency_id: agencyId,
        wilaya_name: wilayaName,
        price_domicile: priceDomicile,
        price_bureau: priceBureau,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'agency_id,wilaya_name'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting wilaya price:', error);
    throw error;
  }
};

// Delete wilaya price
export const deleteWilayaPrice = async (agencyId: string, wilayaName: string) => {
  try {
    const { error } = await supabase
      .from('delivery_agency_wilaya_prices')
      .delete()
      .eq('agency_id', agencyId)
      .eq('wilaya_name', wilayaName);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting wilaya price:', error);
    throw error;
  }
};

// Get delivery price for customer (with wilaya fallback)
export const getDeliveryPriceForWilaya = async (agencyId: string, wilayaName: string, deliveryType: 'bureau' | 'domicile') => {
  try {
    // Try to get wilaya-specific price first
    const wilayaPrice = await getWilayaPrice(agencyId, wilayaName);
    
    if (wilayaPrice) {
      return deliveryType === 'bureau' ? wilayaPrice.price_bureau : wilayaPrice.price_domicile;
    }
    
    // Fallback to agency default price
    const { data: agency, error } = await supabase
      .from('delivery_agencies')
      .select('price_domicile, price_bureau')
      .eq('id', agencyId)
      .single();

    if (error) throw error;
    
    return deliveryType === 'bureau' ? agency.price_bureau : agency.price_domicile;
  } catch (error) {
    console.error('Error getting delivery price for wilaya:', error);
    throw error;
  }
};

// ========== CLIENT TESTIMONIALS ==========

interface Testimonial {
  id: string;
  client_name: string;
  opinion: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

// Get all approved testimonials for display
export const getApprovedTestimonials = async (): Promise<Testimonial[]> => {
  try {
    console.log('🔍 Querying DB: ALL testimonials (testing)');
    const { data, error } = await supabase
      .from('client_testimonials')
      .select('id, client_name, opinion, rating, created_at, updated_at, is_approved, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('📊 DB Response (all):', { data, error });
    
    // Filter for approved on client-side to debug
    const approved = data?.filter(t => t.is_approved === true) || [];
    console.log('✅ After filtering approved:', approved);
    
    if (error) throw error;
    return approved;
  } catch (error) {
    console.error('❌ Error fetching testimonials:', error);
    return [];
  }
};

// Create a new testimonial
export const createTestimonial = async (clientName: string, opinion: string, rating: number = 5, clientEmail?: string): Promise<Testimonial | null> => {
  try {
    const { data, error } = await supabase
      .from('client_testimonials')
      .insert([
        {
          client_name: clientName.trim(),
          opinion: opinion.trim(),
          rating: Math.min(Math.max(rating, 1), 5), // Ensure rating is between 1-5
          client_email: clientEmail?.trim() || null,
          is_approved: false, // Require admin approval for new testimonials
          is_active: true,
        }
      ])
      .select('id, client_name, opinion, rating, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw error;
  }
};

// Get testimonials by client name (user's opinions)
export const getTestimonialsByName = async (clientName: string): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase
      .from('client_testimonials')
      .select('id, client_name, opinion, rating, created_at, updated_at, is_approved')
      .eq('client_name', clientName)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user testimonials:', error);
    return [];
  }
};

// Update testimonial
export const updateTestimonial = async (
  testimonialId: string,
  opinion: string,
  rating: number
): Promise<Testimonial | null> => {
  try {
    const { data, error } = await supabase
      .from('client_testimonials')
      .update({
        opinion: opinion.trim(),
        rating: Math.min(Math.max(rating, 1), 5),
        updated_at: new Date().toISOString(),
      })
      .eq('id', testimonialId)
      .select('id, client_name, opinion, rating, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw error;
  }
};

// Delete testimonial (soft delete)
export const deleteTestimonial = async (testimonialId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_testimonials')
      .update({ is_active: false })
      .eq('id', testimonialId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
};
// Get ALL testimonials (for admin) - both approved and pending
export const getAllTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase
      .from('client_testimonials')
      .select('id, client_name, opinion, rating, created_at, updated_at, is_approved, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all testimonials:', error);
    return [];
  }
};

// Get pending testimonials (for admin approval)
export const getPendingTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase
      .from('client_testimonials')
      .select('id, client_name, opinion, rating, created_at, updated_at, is_approved')
      .eq('is_approved', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending testimonials:', error);
    return [];
  }
};

// Approve a testimonial (admin function)
export const approveTestimonial = async (testimonialId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_testimonials')
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .eq('id', testimonialId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error approving testimonial:', error);
    throw error;
  }
};

// Reject a testimonial (admin function)
export const rejectTestimonial = async (testimonialId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('client_testimonials')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', testimonialId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error rejecting testimonial:', error);
    throw error;
  }
};

// ========== PRODUCTS (FOR WEBSITE BOUTIQUE) ==========

export const getAllProductsREST = async () => {
  try {
    const response = await fetch(
      `${SUPABASE_REST_URL}/products?select=*,marks(id,name,logo_url),connector_types(id,name)&is_active=eq.true&order=created_at.desc`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('REST API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data?.map((product: any) => ({
      ...product,
      product_name: product.name,
      product_image: product.primary_image,
      product_mark: product.marks?.name,
      brand_logo: product.marks?.logo_url,
      connection_type: product.connector_types?.name,
    })) || [];
  } catch (error) {
    console.error('Error fetching products via REST:', error);
    return [];
  }
};

// Toggle product visibility on website
export const toggleProductVisibility = async (productId: string, isVisible: boolean) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isVisible })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error toggling product visibility:', error);
    throw error;
  }
};