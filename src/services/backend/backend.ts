import { Ingredient, Order, Product, Promotion, Shift, StockLog, StoreSession, TaxSettings, User, Scout, PaymentMethod } from '../../types';
import { isSupabaseConfigured, supabase, ensureAuth } from './supabaseClient';
import { MOCK_INGREDIENTS, MOCK_PRODUCTS, MOCK_USERS, MOCK_SCOUTS } from '../mockData';
import { MOCK_PROMOTIONS } from '../promotionEngine';

export type BackendKind = 'supabase' | 'local';

export interface BackendStatus {
  kind: BackendKind;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
}

export interface BackendInitialState {
  products: Product[];
  ingredients: Ingredient[];
  stockLogs: StockLog[];
  promotions: Promotion[];
  users: User[];
  scouts: Scout[];
  orders: Order[];
  currentShift: Shift | null;
  currentSession: StoreSession | null;
  taxSettings: TaxSettings;
  paymentSettings: { pos: PaymentMethod[], kiosk: PaymentMethod[] };
  printSettings: { enabled: boolean };
  businessRules: { maxItemsPerOrder: number };
}

const defaultTaxSettings: TaxSettings = {
  isEnabled: false,
  taxName: 'ICMS',
  defaultRate: 18.0,
  taxId: '',
  exemptCategories: []
};

const defaultPaymentSettings = {
  pos: [PaymentMethod.CASH, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.PIX],
  kiosk: [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.PIX]
};

const requireSupabase = () => {
  if (!supabase) throw new Error('Supabase não configurado (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).');
  return supabase;
};

const isTableEmpty = async (table: string) => {
  const sb = requireSupabase();
  const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return (count ?? 0) === 0;
};

const seedIfEmpty = async () => {
  const sb = requireSupabase();

  // Desativado: Impede que o sistema insira dados mockados na tabela de produtos ao iniciar
  /*
  const seedProducts = await isTableEmpty('products');
  if (seedProducts) {
    const { error } = await sb.from('products').insert(MOCK_PRODUCTS);
    if (error) throw error;
  }
  */

  // Desativado: Impede que o sistema insira dados mockados na tabela de ingredientes ao iniciar
  /*
  const seedIngredients = await isTableEmpty('ingredients');
  if (seedIngredients) {
    const { error } = await sb.from('ingredients').insert(MOCK_INGREDIENTS);
    if (error) throw error;
  }
  */

  // Users table is now for other functionality, not login. Skipping seed.
  /*
  const seedUsers = await isTableEmpty('users');
  if (seedUsers) {
    const { error } = await sb.from('users').insert(MOCK_USERS);
    if (error) throw error;
  }
  */

  // Desativado: Impede que o sistema insira dados mockados na tabela de promoções ao iniciar
  /*
  const seedPromotions = await isTableEmpty('promotions');
  if (seedPromotions) {
    const { error } = await sb.from('promotions').insert(MOCK_PROMOTIONS);
    if (error) console.error("Error seeding promotions:", error);
  }
  */

  // Desativado: Impede que o sistema insira dados mockados na tabela de escoteiros ao iniciar
  /*
  const seedScouts = await isTableEmpty('scouts');
  if (seedScouts) {
    const { error } = await sb.from('scouts').insert(MOCK_SCOUTS);
    if (error) throw error;
  }
  */

  const { data: taxSettingsRow, error: taxSettingsError } = await sb
    .from('settings')
    .select('id')
    .eq('id', 'tax_settings')
    .maybeSingle();
  if (taxSettingsError) throw taxSettingsError;
  if (!taxSettingsRow) {
    await upsertTaxSettings(defaultTaxSettings);
  }

  const { data: paymentSettingsRow, error: paymentSettingsError } = await sb
    .from('settings')
    .select('id')
    .eq('id', 'payment_settings')
    .maybeSingle();
  if (paymentSettingsError) throw paymentSettingsError;
  if (!paymentSettingsRow) {
    await upsertPaymentSettings(defaultPaymentSettings);
  }

  const { data: printSettingsRow, error: printSettingsError } = await sb
    .from('settings')
    .select('id')
    .eq('id', 'print_settings')
    .maybeSingle();
  if (printSettingsError) throw printSettingsError;
  if (!printSettingsRow) {
    await upsertPrintSettings({ enabled: true });
  }

  const { data: businessRulesRow, error: businessRulesError } = await sb
    .from('settings')
    .select('id')
    .eq('id', 'business_rules')
    .maybeSingle();
  if (businessRulesError) throw businessRulesError;
  if (!businessRulesRow) {
    await upsertBusinessRules({ maxItemsPerOrder: 3 });
  }
};

const loadTaxSettings = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb.from('settings').select('value').eq('id', 'tax_settings').maybeSingle();
  if (error) throw error;
  return (data?.value as TaxSettings | undefined) ?? defaultTaxSettings;
};

const loadPaymentSettings = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb.from('settings').select('value').eq('id', 'payment_settings').maybeSingle();
  if (error) throw error;
  return (data?.value as { pos: PaymentMethod[], kiosk: PaymentMethod[] } | undefined) ?? defaultPaymentSettings;
};

const loadPrintSettings = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb.from('settings').select('value').eq('id', 'print_settings').maybeSingle();
  if (error) throw error;
  return (data?.value as { enabled: boolean } | undefined) ?? { enabled: true };
};

const loadBusinessRules = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb.from('settings').select('value').eq('id', 'business_rules').maybeSingle();
  if (error) throw error;
  return (data?.value as { maxItemsPerOrder: number } | undefined) ?? { maxItemsPerOrder: 3 };
};

const upsertTaxSettings = async (settings: TaxSettings) => {
  const sb = requireSupabase();
  const { error } = await sb.from('settings').upsert([{ id: 'tax_settings', value: settings }], { onConflict: 'id' });
  if (error) throw error;
};

const upsertPaymentSettings = async (settings: { pos: PaymentMethod[], kiosk: PaymentMethod[] }) => {
  const sb = requireSupabase();
  const { error } = await sb.from('settings').upsert([{ id: 'payment_settings', value: settings }], { onConflict: 'id' });
  if (error) throw error;
};

const upsertPrintSettings = async (settings: { enabled: boolean }) => {
  const sb = requireSupabase();
  const { error } = await sb.from('settings').upsert([{ id: 'print_settings', value: settings }], { onConflict: 'id' });
  if (error) throw error;
};

const upsertBusinessRules = async (rules: { maxItemsPerOrder: number }) => {
  const sb = requireSupabase();
  const { error } = await sb.from('settings').upsert([{ id: 'business_rules', value: rules }], { onConflict: 'id' });
  if (error) throw error;
};

export interface BackendInterface {
  kind: BackendKind;
  loadInitialState: () => Promise<BackendInitialState | null>;
  upsertProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  upsertIngredient: (i: Ingredient) => Promise<void>;
  insertStockLog: (log: StockLog) => Promise<void>;
  upsertPromotion: (p: Promotion) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  upsertUser: (u: User) => Promise<void>;
  upsertScout: (s: Scout) => Promise<void>;
  upsertShift: (shift: Shift) => Promise<void>;
  upsertSession: (session: any) => Promise<void>;
  upsertOrder: (order: Order) => Promise<void>;
  upsertTaxSettings: (settings: TaxSettings) => Promise<void>;
  upsertPaymentSettings: (settings: { pos: PaymentMethod[], kiosk: PaymentMethod[] }) => Promise<void>;
  upsertPrintSettings: (settings: { enabled: boolean }) => Promise<void>;
  upsertBusinessRules: (rules: { maxItemsPerOrder: number }) => Promise<void>;
  subscribeToChanges: (
    onOrdersChange: (payload: any) => void,
    onSessionsChange: (payload: any) => void,
    onStatusChange?: (status: string) => void
  ) => () => void;
  fetchReports: (startDate?: string, endDate?: string) => Promise<{ shifts: Shift[], orders: Order[] }>;
  deleteUser: (id: string) => Promise<void>;
  deleteScout: (id: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ user: any, error: any }>;
  signOut: () => Promise<void>;
  authenticateUserByPin: (userId: string, pin: string) => Promise<User | null>;
  resetDatabase: (options?: { keepCatalog?: boolean }) => Promise<void>;
  checkSchema: () => Promise<string[]>;
  fetchScouts: () => Promise<Scout[]>;
  forceCompleteAllOrders: () => Promise<void>;
}

export const backend: BackendInterface = {
  kind: (isSupabaseConfigured() ? 'supabase' : 'local') as BackendKind,

  checkSchema: async () => {
    if (!isSupabaseConfigured()) return [];
    const sb = requireSupabase();
    const missingTables: string[] = [];

    // Check tables one by one. If we can't select, it likely doesn't exist or RLS issue.
    // Error code 42P01 is undefined_table in Postgres
    const tables = ['products', 'ingredients', 'users', 'promotions', 'orders', 'shifts', 'store_sessions', 'stock_logs', 'scouts'];

    for (const table of tables) {
      // Use maybeSingle to avoid errors if empty, but check error code
      const { error } = await sb.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        missingTables.push(table);
      }
    }
    return missingTables;
  },

  fetchScouts: async () => {
    if (!isSupabaseConfigured()) return MOCK_SCOUTS;
    const sb = requireSupabase();
    const { data, error } = await sb.from('scouts').select('*').order('name', { ascending: true });
    if (error) {
      console.error("Error fetching scouts:", error);
      return [];
    }
    return (data ?? []) as unknown as Scout[];
  },

  resetDatabase: async (options = { keepCatalog: true }) => {
    if (!isSupabaseConfigured()) {
      console.log("Resetting local database (mock)...");
      // For local mode, we can't easily "reset" without reloading, 
      // but we could clear the store state in the store action.
      // Here we just acknowledge.
      return;
    }
    const sb = requireSupabase();

    // 1. Clear Transactional Data (Always)
    const { error: errOrders } = await sb.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (errOrders) throw errOrders;

    const { error: errShifts } = await sb.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errShifts) throw errShifts;

    const { error: errSessions } = await sb.from('store_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errSessions) throw errSessions;

    const { error: errLogs } = await sb.from('stock_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errLogs) throw errLogs;

    // 2. Clear Catalog (Optional)
    if (!options.keepCatalog) {
      const { error: errProds } = await sb.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (errProds) throw errProds;

      const { error: errIngs } = await sb.from('ingredients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (errIngs) throw errIngs;

      const { error: errPromos } = await sb.from('promotions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (errPromos) throw errPromos;

      // Note: We typically don't delete users to avoid lockout, unless explicitly requested.
      // If we do, the seed function will restore them on next load.
      const { error: errUsers } = await sb.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (errUsers) throw errUsers;

      const { error: errScouts } = await sb.from('scouts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (errScouts) throw errScouts;
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured()) return { user: { email }, error: null }; // Mock login for local
    const sb = requireSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    return { user: data.user, error };
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    await sb.auth.signOut();
  },

  authenticateUserByPin: async (userId, pin) => {
    if (!isSupabaseConfigured()) {
      const isPinFormatValid = /^\d{4}$/.test(pin);
      const found = MOCK_USERS.find((u) => u.id === userId);
      if (!isPinFormatValid) return null;
      if (!found) return null;
      return found as User;
    }
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('users')
      .select('id, name, role')
      .eq('id', userId)
      .eq('pin', pin)
      .maybeSingle();
    if (error) {
      console.error('Erro ao autenticar usuário por PIN:', error);
      return null;
    }
    return (data as User | null) ?? null;
  },

  loadInitialState: async (): Promise<BackendInitialState | null> => {
    if (!isSupabaseConfigured()) {
      return {
        products: MOCK_PRODUCTS,
        ingredients: MOCK_INGREDIENTS,
        stockLogs: [],
        promotions: MOCK_PROMOTIONS,
        users: MOCK_USERS,
        scouts: MOCK_SCOUTS,
        orders: [],
        currentShift: null,
        currentSession: null,
        taxSettings: defaultTaxSettings,
        paymentSettings: defaultPaymentSettings,
        printSettings: { enabled: true },
        businessRules: { maxItemsPerOrder: 3 }
      };
    }
    const sb = requireSupabase();

    // Try to ensure auth, but don't fail hard if it's disabled (e.g., Anonymous sign-ins off)
    // This allows the app to fallback to Public/Anon access if RLS allows it.
    try {
      await ensureAuth();
    } catch (e) {
      console.warn("[Backend] Auth initialization warning (proceeding with anon/public access):", e);
    }

    await seedIfEmpty();

    const [productsRes, ingredientsRes, promotionsRes, usersRes, ordersRes, shiftRes, sessionRes, taxSettings, stockLogsRes, paymentSettings, printSettings, businessRules] = await Promise.all([
      sb.from('products').select('*').order('name', { ascending: true }),
      sb.from('ingredients').select('*').order('name', { ascending: true }),
      sb.from('promotions').select('*').order('priority', { ascending: false }),
      sb.from('users').select('*').order('name', { ascending: true }),
      sb.from('orders').select('*').order('created_at', { ascending: false }),
      // Fetch the MOST RECENT shift, regardless of status, to determine initial state correctly
      sb.from('shifts').select('*').order('opened_at', { ascending: false }).limit(1),
      sb.from('store_sessions').select('*').eq('status', 'OPEN').order('opened_at', { ascending: false }).limit(1),
      loadTaxSettings(),
      sb.from('stock_logs').select('*').order('date', { ascending: false }).limit(50),
      loadPaymentSettings(),
      loadPrintSettings(),
      loadBusinessRules()
    ]);

    if (productsRes.error) throw productsRes.error;
    if (ingredientsRes.error) throw ingredientsRes.error;
    if (promotionsRes.error) throw promotionsRes.error;
    if (usersRes.error) throw usersRes.error;
    if (ordersRes.error) throw ordersRes.error;
    if (shiftRes.error) throw shiftRes.error;
    if (sessionRes.error && sessionRes.error.code !== 'PGRST116') throw sessionRes.error;
    if (stockLogsRes.error && stockLogsRes.error.code !== 'PGRST116') throw stockLogsRes.error;

    const { data: scoutsData, error: scoutsError } = await sb.from('scouts').select('*').order('name', { ascending: true });
    if (scoutsError) throw scoutsError;

    const currentShift = shiftRes.data?.[0] ? (shiftRes.data[0] as unknown as Shift) : null;
    const currentSession = sessionRes.data?.[0] ? (sessionRes.data[0] as unknown as StoreSession) : null;

    return {
      products: (productsRes.data ?? []) as unknown as Product[],
      ingredients: (ingredientsRes.data ?? []) as unknown as Ingredient[],
      stockLogs: (stockLogsRes.data ?? []) as unknown as StockLog[],
      promotions: (promotionsRes.data ?? []) as unknown as Promotion[],
      users: (usersRes.data ?? []) as unknown as User[],
      scouts: (scoutsData ?? []) as unknown as Scout[],
      orders: (ordersRes.data ?? []) as unknown as Order[],
      currentShift,
      currentSession,
      taxSettings,
      paymentSettings,
      printSettings,
      businessRules
    };
  },

  upsertProduct: async (p: Product) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('products').upsert([p], { onConflict: 'id' });
    if (error) throw error;
  },

  deleteProduct: async (id: string) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  upsertIngredient: async (i: Ingredient) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('ingredients').upsert([i], { onConflict: 'id' });
    if (error) throw error;
  },

  insertStockLog: async (log: StockLog) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('stock_logs').insert([log]);
    if (error) throw error;
  },

  upsertPromotion: async (p: Promotion) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    
    // Clean up potentially undefined fields to avoid JSON errors
    const cleanedPromo = { ...p };
    if ((cleanedPromo as any).conditions) {
        if ((cleanedPromo as any).conditions.min_quantity === undefined) delete (cleanedPromo as any).conditions.min_quantity;
        if ((cleanedPromo as any).conditions.specific_products === undefined) delete (cleanedPromo as any).conditions.specific_products;
        if ((cleanedPromo as any).conditions.category === undefined) delete (cleanedPromo as any).conditions.category;
    }
    if (cleanedPromo.rules) {
        if (cleanedPromo.rules.min_quantity === undefined) delete (cleanedPromo.rules as any).min_quantity;
        if (cleanedPromo.rules.product_id === undefined) delete cleanedPromo.rules.product_id;
        if (cleanedPromo.rules.category_id === undefined) delete cleanedPromo.rules.category_id;
        if (cleanedPromo.rules.active === undefined) delete cleanedPromo.rules.active;
    }

    const { error } = await sb.from('promotions').upsert([cleanedPromo], { onConflict: 'id' });
    if (error) throw error;
  },

  deletePromotion: async (id: string) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('promotions').delete().eq('id', id);
    if (error) throw error;
  },

  upsertUser: async (u: User) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('users').upsert([u], { onConflict: 'id' });
    if (error) throw error;
  },

  upsertScout: async (s: Scout) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('scouts').upsert([s], { onConflict: 'id' });
    if (error) throw error;
  },

  upsertShift: async (shift: Shift) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    // Converter arrays (como transactions) para JSON para o Supabase
    const payload = {
        ...shift,
        transactions: shift.transactions ? JSON.parse(JSON.stringify(shift.transactions)) : []
    };
    const { error } = await sb.from('shifts').upsert([payload], { onConflict: 'id' });
    if (error) {
        console.error("Error upserting shift:", error);
        throw error;
    }
  },

  upsertSession: async (session: any) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('store_sessions').upsert([session], { onConflict: 'id' });
    if (error) throw error;
  },

  upsertOrder: async (order: Order) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('orders').upsert([order], { onConflict: 'id' });
    if (error) throw error;
  },

  upsertTaxSettings,
  upsertPaymentSettings,
  upsertPrintSettings,
  upsertBusinessRules,

  // Realtime Subscriptions
  subscribeToChanges: (
    onOrdersChange: (payload: any) => void,
    onSessionsChange: (payload: any) => void,
    onStatusChange?: (status: string) => void
  ) => {
    if (!isSupabaseConfigured()) return () => { };
    const sb = requireSupabase();

    const subscription = sb
      .channel('app-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onOrdersChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_sessions' }, onSessionsChange)
      .subscribe((status) => {
        if (onStatusChange) onStatusChange(status);
        console.log(`[Realtime] Status: ${status}`);
      });

    return () => {
      void sb.removeChannel(subscription);
    };
  },

  deleteUser: async (id: string) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  deleteScout: async (id: string) => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    const { error } = await sb.from('scouts').delete().eq('id', id);
    if (error) throw error;
  },

  fetchReports: async (startDate?: string, endDate?: string) => {
    if (!isSupabaseConfigured()) {
      // Return mock empty or limited data for local mode
      return { shifts: [], orders: [] };
    }
    const sb = requireSupabase();

    let shiftQuery = sb.from('shifts').select('*').order('opened_at', { ascending: false });
    if (startDate) shiftQuery = shiftQuery.gte('opened_at', startDate);
    if (endDate) shiftQuery = shiftQuery.lte('opened_at', endDate);

    const { data: shifts, error: shiftError } = await shiftQuery;
    if (shiftError) throw shiftError;

    if (!shifts || shifts.length === 0) return { shifts: [], orders: [] };

    // Fetch orders for these shifts
    const shiftIds = shifts.map((s: any) => s.id);
    const { data: orders, error: orderError } = await sb
      .from('orders')
      .select('*')
      .in('shift_id', shiftIds);

    if (orderError) throw orderError;

    return {
      shifts: shifts as Shift[],
      orders: orders as Order[]
    };
  },

  forceCompleteAllOrders: async () => {
    if (!isSupabaseConfigured()) return;
    const sb = requireSupabase();
    
    // Updates all orders that are not DELIVERED or CANCELLED to DELIVERED
    const { error } = await sb
      .from('orders')
      .update({ 
        status: 'DELIVERED', 
        delivered_at: new Date().toISOString(),
        ready_at: new Date().toISOString() // Ensure ready_at is also set if missing
      })
      .neq('status', 'DELIVERED')
      .neq('status', 'CANCELLED');
      
    if (error) throw error;
  }
};

