import { create } from 'zustand';
import { CartItem, Order, OrderStatus, OrderType, Product, Shift, ShiftTransaction, ShiftAdjustment, PaymentMethod, Ingredient, StockLog, User, Promotion, ShiftTransactionExtras, ShiftOpeningData, TaxSettings, StoreSession, Scout, MenuCatalog, TerminalConfig } from './types';
import { calculateCartTotals, MOCK_PROMOTIONS } from './services/promotionEngine';
import { backend, BackendInterface, BackendStatus } from './services/backend/backend';
import { MOCK_INGREDIENTS, MOCK_PRODUCTS, MOCK_USERS, MOCK_SCOUTS } from './services/mockData';
import { generateUUID } from './utils';
import { FIXED_PRODUCT_IDS } from './constants/fixedProducts';

interface AppState {
  backend: BackendInterface;
  backendStatus: BackendStatus;
  realtimeStatus: string; // 'CONNECTING' | 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'CLOSED'
  initializeBackend: () => Promise<void>;

  // Catalog
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Inventory
  ingredients: Ingredient[];
  stockLogs: StockLog[];
  updateStock: (ingredientId: string, change: number, type: StockLog['type'], notes?: string) => void;
  addIngredient: (i: Ingredient) => void;

  // Users & Auth (Login)
  users: User[];
  authenticateUserByPin: (userId: string, pin: string) => Promise<User | null>;
  addUser: (u: User) => void;
  updateUser: (id: string, u: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Database Users (Management)
  dbUsers: User[];
  addDbUser: (u: User) => void;
  updateDbUser: (id: string, u: Partial<User>) => void;
  deleteDbUser: (id: string) => void;

  // Scouts
  scouts: Scout[];
  addScout: (s: Scout) => void;
  updateScout: (id: string, s: Partial<Scout>) => void;
  deleteScout: (id: string) => void;
  importScouts: (scouts: Scout[]) => void;
  fetchScouts: () => Promise<void>;

  // Promotions
  promotions: Promotion[];
  addPromotion: (p: Promotion) => void;
  updatePromotion: (id: string, p: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;

  // Menus
  menuCatalogs: MenuCatalog[];
  addMenuCatalog: (menu: Omit<MenuCatalog, 'id' | 'updated_at'>) => void;
  updateMenuCatalog: (id: string, updates: Partial<MenuCatalog>) => void;
  deleteMenuCatalog: (id: string) => void;

  // Terminals
  terminals: TerminalConfig[];
  addTerminal: (terminal: Omit<TerminalConfig, 'id' | 'updated_at'>) => void;
  updateTerminal: (id: string, updates: Partial<TerminalConfig>) => void;
  deleteTerminal: (id: string) => void;

  // POS/Kiosk State
  cart: CartItem[];
  addToCart: (product: Product, modifiers?: string[], note?: string) => void;
  removeFromCart: (cartId: string) => void;
  updateCartItem: (cartId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  cartTotals: { subtotal: number; discount: number; total: number };

  // Order Management
  orders: Order[];
  createOrder: (type: OrderType, method: PaymentMethod, customerName?: string, customId?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  toggleOrderItemComplete: (orderId: string, cartId: string) => void;
  setOrderItemPrepTime: (orderId: string, cartId: string, minutes: number) => void;
  recallOrder: (orderId: string) => void;

  // Shift Management
  currentShift: Shift | null;
  reportShifts: Shift[];
  openShift: (staffName: string, startCash: number, terminalId: string, openingData: ShiftOpeningData) => Promise<Shift | null>;
  updateShiftOpeningData: (updates: Partial<Pick<Shift, 'staff_name' | 'terminal_id' | 'start_cash' | 'opening_product_cost_total' | 'opening_drinks_liters' | 'planned_normal_burgers' | 'planned_vegan_burgers' | 'planned_chefe_burgers' | 'planned_escoteiro_extra_burgers' | 'opening_unit_cost_suggested' | 'opening_unit_cost' | 'daily_menu_name'>>) => Promise<Shift | null>;
  closeShift: (metrics?: { drinks_liters?: number, burger_cost?: number, burgers_produced?: number, burgers_unsold?: number, menu_name?: string, closer_name?: string, feedback?: string }) => Promise<Shift | null>;
  addShiftTransaction: (type: ShiftTransaction['type'], amount: number, reason: string, extras?: ShiftTransactionExtras) => void;
  addShiftTransactions: (transactions: Array<{ type: ShiftTransaction['type']; amount: number; reason: string; extras?: ShiftTransactionExtras }>) => Promise<Shift | null>;
  updateShiftFixedProductPrice: (productId: string, price: number) => void;

  // Store Session (Business Day)
  currentSession: StoreSession | null;
  openStore: (user: string) => void;
  closeStore: (user: string) => void;

  // Settings
  maxItemsPerOrder: number;
  setMaxItemsPerOrder: (limit: number) => void;
  activePaymentMethodsPOS: PaymentMethod[];
  activePaymentMethodsKiosk: PaymentMethod[];
  togglePaymentMethod: (target: 'POS' | 'KIOSK', method: PaymentMethod) => void;
  taxSettings: TaxSettings;
  updateTaxSettings: (settings: Partial<TaxSettings>) => void;
  printReceiptEnabled: boolean;
  setPrintReceiptEnabled: (enabled: boolean) => void;
  resetDatabase: (keepCatalog: boolean) => Promise<void>;
  forceCompleteAllOrders: () => Promise<void>;
}

const newId = () => generateUUID();
const sanitizeUsersForLogin = (users: User[]): User[] =>
  users.map(({ pin, ...user }) => user as User);

const PAYMENT_SETTINGS_STORAGE_KEY = 'omni_payment_settings';

const defaultPaymentSettings = {
  pos: [PaymentMethod.PIX, PaymentMethod.CASH],
  kiosk: [PaymentMethod.PIX, PaymentMethod.CASH]
};

const supportedPaymentMethods = new Set<PaymentMethod>([PaymentMethod.PIX, PaymentMethod.CASH]);

const isSupportedPaymentMethod = (value: unknown): value is PaymentMethod =>
  typeof value === 'string' && supportedPaymentMethods.has(value as PaymentMethod);

const normalizePaymentSettings = (settings?: { pos?: unknown[]; kiosk?: unknown[] }) => {
  const normalize = (methods: unknown[] | undefined, fallback: PaymentMethod[]) => {
    const supported = Array.isArray(methods) ? methods.filter(isSupportedPaymentMethod) : [];
    return supported.length > 0 ? supported : fallback;
  };

  return {
    pos: normalize(settings?.pos, defaultPaymentSettings.pos),
    kiosk: normalize(settings?.kiosk, defaultPaymentSettings.kiosk)
  };
};

const readPaymentSettingsFromStorage = (): { pos: PaymentMethod[]; kiosk: PaymentMethod[] } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PAYMENT_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { pos?: unknown[]; kiosk?: unknown[] };
    return normalizePaymentSettings(parsed);
  } catch {
    return null;
  }
};

const writePaymentSettingsToStorage = (settings: { pos: PaymentMethod[]; kiosk: PaymentMethod[] }) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures silently (private mode / quota)
  }
};

const PRINT_SETTINGS_STORAGE_KEY = 'omni_print_settings';

const readPrintSettingsFromStorage = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(PRINT_SETTINGS_STORAGE_KEY);
    if (raw === 'false') return false;
    return true; // Default to true
  } catch {
    return true;
  }
};

const writePrintSettingsToStorage = (enabled: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PRINT_SETTINGS_STORAGE_KEY, enabled.toString());
  } catch {
    // Ignore
  }
};

const BUSINESS_RULES_STORAGE_KEY = 'omni_business_rules';

const readBusinessRulesFromStorage = (): { maxItemsPerOrder: number } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BUSINESS_RULES_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeBusinessRulesToStorage = (rules: { maxItemsPerOrder: number }) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BUSINESS_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // Ignore
  }
};

export const useStore = create<AppState>((set, get) => ({
  backend: backend,
  backendStatus: { kind: backend.kind, status: backend.kind === 'supabase' ? 'idle' : 'ready' },
  realtimeStatus: 'IDLE',

  initializeBackend: async () => {
    const localPaymentSettings = readPaymentSettingsFromStorage();
    if (localPaymentSettings) {
      set({
        activePaymentMethodsPOS: localPaymentSettings.pos,
        activePaymentMethodsKiosk: localPaymentSettings.kiosk
      });
    }

    const localBusinessRules = readBusinessRulesFromStorage();
    if (localBusinessRules) {
      set({
        maxItemsPerOrder: localBusinessRules.maxItemsPerOrder
      });
    }

    if (backend.kind !== 'supabase') return;
    set({ backendStatus: { kind: 'supabase', status: 'loading' }, realtimeStatus: 'CONNECTING' });

    try {
      const data = await backend.loadInitialState();
      if (!data) {
        // Fallback to local is handled by initial state check in backend
        set({ backendStatus: { kind: 'supabase', status: 'ready' } });
        return;
      }
      // Spread data into store, but keep backend methods intact
      set({
        ...data,
        dbUsers: data.users, // Store DB users separately
        users: sanitizeUsersForLogin(data.users),
        menuCatalogs: data.menuCatalogs || [],
        terminals: data.terminals || [],
        activePaymentMethodsPOS: normalizePaymentSettings((data as any).paymentSettings).pos,
        activePaymentMethodsKiosk: normalizePaymentSettings((data as any).paymentSettings).kiosk,
        printReceiptEnabled: (data as any).printSettings?.enabled ?? get().printReceiptEnabled,
        maxItemsPerOrder: (data as any).businessRules?.maxItemsPerOrder ?? get().maxItemsPerOrder
      });
      set({ backendStatus: { kind: 'supabase', status: 'ready' } });

      writePaymentSettingsToStorage({
        ...normalizePaymentSettings((data as any).paymentSettings)
      });

      // Auto-seed test data if in test mode
      const isTestMode = import.meta.env.VITE_TEST_MODE === 'true' || import.meta.env.VITE_AUTO_SEED_ORDERS === 'true';
      if (isTestMode && data.orders.length === 0) {
        console.log('[TestMode] Auto-seeding test orders...');
        try {
          const { seedTestOrders } = await import('./services/seedTestData');
          await seedTestOrders(backend);
          // Reload orders after seeding
          const orders = await backend.fetchOrders();
          set({ orders });
          console.log(`[TestMode] Seeded ${orders.length} test orders`);
        } catch (e) {
          console.error('[TestMode] Failed to seed test data:', e);
        }
      }

      // Subscribe to Realtime Updates
      backend.subscribeToChanges(
        // 1. Orders Handler
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            if (eventType === 'INSERT') {
              if (state.orders.find(o => o.id === newRecord.id)) return {};
              return { orders: [...state.orders, newRecord as Order] };
            }
            if (eventType === 'UPDATE') {
              return { orders: state.orders.map(o => o.id === newRecord.id ? (newRecord as Order) : o) };
            }
            if (eventType === 'DELETE') {
              return { orders: state.orders.filter(o => o.id !== oldRecord.id) };
            }
            return {};
          });
        },
        // 2. Sessions Handler
        (payload) => {
          const { eventType, new: newRecord } = payload;
          console.log('[Store] Session Update:', eventType, newRecord);
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const session = newRecord as StoreSession;
            if (session.status === 'OPEN') {
              set({ currentSession: session });
            } else if (session.status === 'CLOSED') {
              // Only clear if it matches the current one (to avoid race conditions with multiple terminals)
              set((state) => state.currentSession?.id === session.id ? { currentSession: null } : {});
            }
          }
        },
        // 3. Shifts Handler
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          set((state) => {
            if (eventType === 'DELETE') {
              return {
                currentShift: state.currentShift?.id === oldRecord.id ? null : state.currentShift,
                reportShifts: state.reportShifts.filter((shift) => shift.id !== oldRecord.id)
              };
            }

            const shift = newRecord as Shift;
            const nextReportShifts = [
              shift,
              ...state.reportShifts.filter((reportShift) => reportShift.id !== shift.id)
            ];

            if (shift.status === 'OPEN') {
              return { currentShift: shift, reportShifts: nextReportShifts };
            }

            return {
              currentShift: state.currentShift?.id === shift.id ? shift : state.currentShift,
              reportShifts: nextReportShifts
            };
          });
        },
        // 4. Status Handler
        (status) => set({ realtimeStatus: status })
      );

    } catch (e: any) {
      const message = e instanceof Error ? e.message : (e?.message || JSON.stringify(e));
      console.error("Backend init error:", message);
      set({ backendStatus: { kind: 'supabase', status: 'error', error: message } });
    }
  },

  products: backend.kind === 'supabase' ? [] : MOCK_PRODUCTS,
  ingredients: backend.kind === 'supabase' ? [] : MOCK_INGREDIENTS,
  stockLogs: [],
  users: sanitizeUsersForLogin(MOCK_USERS),
  dbUsers: [],
  scouts: backend.kind === 'supabase' ? [] : MOCK_SCOUTS,
  promotions: backend.kind === 'supabase' ? [] : MOCK_PROMOTIONS,
  menuCatalogs: [],
  terminals: [],

  addScout: (s) => {
    set(state => ({ scouts: [...state.scouts, s] }));
    void backend.upsertScout(s).catch(e => console.error("Failed to add scout:", e));
  },
  updateScout: (id, s) => {
    set(state => ({ scouts: state.scouts.map(x => x.id === id ? { ...x, ...s } : x) }));
    const updated = get().scouts.find(x => x.id === id);
    if (updated) void backend.upsertScout(updated).catch(e => console.error("Failed to update scout:", e));
  },
  deleteScout: (id) => {
    set(state => ({ scouts: state.scouts.filter(x => x.id !== id) }));
    void backend.deleteScout(id).catch(e => console.error("Failed to delete scout:", e));
  },
  importScouts: (newScouts) => {
    set(state => ({ scouts: [...state.scouts, ...newScouts] }));
    // Batch insert? For now, just loop upsert
    newScouts.forEach(s => void backend.upsertScout(s).catch(e => console.error("Failed to import scout:", e)));
  },
  fetchScouts: async () => {
    if (backend.kind !== 'supabase') return;
    try {
      const scouts = await backend.fetchScouts();
      set({ scouts });
    } catch (e) {
      console.error("Failed to fetch scouts:", e);
    }
  },

  addProduct: (p) => {
    set(s => ({ products: [...s.products, p] }));
    void backend.upsertProduct(p).catch(() => { });
  },
  updateProduct: (id, p) => {
    set(s => ({ products: s.products.map(x => x.id === id ? { ...x, ...p } : x) }));
    const updated = get().products.find(x => x.id === id);
    if (updated) void backend.upsertProduct(updated).catch(() => { });
  },
  deleteProduct: (id) => {
    set(s => ({ products: s.products.filter(x => x.id !== id) }));
    void backend.deleteProduct(id).catch(() => { });
  },

  addIngredient: (i) => {
    set(s => ({ ingredients: [...s.ingredients, i] }));
    void backend.upsertIngredient(i).catch(() => { });
  },

  updateStock: (ingredientId, change, type, notes) => {
    const current = get().ingredients.find(i => i.id === ingredientId);
    if (!current) return;
    const updatedIngredient: Ingredient = { ...current, current_stock: current.current_stock + change };
    const log: StockLog = {
      id: newId(),
      date: new Date().toISOString(),
      ingredient_id: ingredientId,
      change,
      type,
      notes
    };
    set(s => ({
      ingredients: s.ingredients.map(i => i.id === ingredientId ? updatedIngredient : i),
      stockLogs: [...s.stockLogs, log]
    }));
    void backend.upsertIngredient(updatedIngredient).catch(() => { });
    void backend.insertStockLog(log).catch(() => { });
  },

  authenticateUserByPin: async (userId, pin) => {
    try {
      return await backend.authenticateUserByPin(userId, pin);
    } catch (e) {
      console.error('Falha ao autenticar por PIN:', e);
      return null;
    }
  },

  addUser: (u) => {
    set(s => ({ users: [...s.users, u] }));
    // Local only for login users
  },
  updateUser: (id, u) => {
    set(s => ({ users: s.users.map(user => user.id === id ? { ...user, ...u } : user) }));
    // Local only for login users
  },
  deleteUser: (id) => {
    set(s => ({ users: s.users.filter(x => x.id !== id) }));
    // Local only for login users
  },

  addDbUser: async (u) => {
    set(s => ({ dbUsers: [...s.dbUsers, u] }));
    try {
      await backend.upsertUser(u);
    } catch (e) {
      console.error("Falha ao adicionar usuário no banco:", e);
    }
  },
  updateDbUser: async (id, u) => {
    const currentUser = get().dbUsers.find(x => x.id === id);
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...u };
    set(s => ({ dbUsers: s.dbUsers.map(user => user.id === id ? updatedUser : user) }));
    try {
      await backend.upsertUser(updatedUser);
    } catch (e) {
      console.error("Falha ao atualizar usuário no banco:", e);
    }
  },
  deleteDbUser: async (id) => {
    set(s => ({ dbUsers: s.dbUsers.filter(x => x.id !== id) }));
    try {
      await backend.deleteUser(id);
    } catch (e) {
      console.error("Falha ao deletar usuário no banco:", e);
    }
  },

  addPromotion: (p) => {
    // Ensure ID is present
    const promoWithId = { ...p, id: p.id || newId() };
    set(s => ({ promotions: [...s.promotions, promoWithId] }));
    void backend.upsertPromotion(promoWithId).catch((e) => console.error("Falha ao salvar promoção:", e));
  },

  updatePromotion: (id, p) => {
    set(s => ({ promotions: s.promotions.map(x => x.id === id ? { ...x, ...p } : x) }));
    const updated = get().promotions.find(x => x.id === id);
    if (updated) void backend.upsertPromotion(updated).catch((e) => console.error("Falha ao atualizar promoção:", e));
  },

  deletePromotion: (id) => {
    console.log("Deletando promoção:", id);
    set(s => ({ promotions: s.promotions.filter(x => x.id !== id) }));
    void backend.deletePromotion(id).catch((e) => console.error("Falha ao excluir promoção:", e));
  },

  addMenuCatalog: (menuInput) => {
    const menu: MenuCatalog = {
      id: newId(),
      name: menuInput.name,
      observations: menuInput.observations,
      description: menuInput.description,
      is_active: menuInput.is_active ?? true,
      updated_at: new Date().toISOString()
    };
    set((s) => {
      const nextMenus = [...s.menuCatalogs, menu];
      void backend.upsertMenuCatalogs(nextMenus).catch((e) => console.error("Falha ao salvar cardápios:", e));
      return { menuCatalogs: nextMenus };
    });
  },

  updateMenuCatalog: (id, updates) => {
    set((s) => {
      const nextMenus = s.menuCatalogs.map((menu) =>
        menu.id === id ? { ...menu, ...updates, updated_at: new Date().toISOString() } : menu
      );
      void backend.upsertMenuCatalogs(nextMenus).catch((e) => console.error("Falha ao atualizar cardápio:", e));
      return { menuCatalogs: nextMenus };
    });
  },

  deleteMenuCatalog: (id) => {
    set((s) => {
      const nextMenus = s.menuCatalogs.filter((menu) => menu.id !== id);
      void backend.upsertMenuCatalogs(nextMenus).catch((e) => console.error("Falha ao remover cardápio:", e));
      return { menuCatalogs: nextMenus };
    });
  },

  addTerminal: (terminalInput) => {
    const terminal: TerminalConfig = {
      id: newId(),
      name: terminalInput.name,
      observations: terminalInput.observations,
      is_active: terminalInput.is_active ?? true,
      operation_date: terminalInput.operation_date,
      updated_at: new Date().toISOString()
    };
    set((s) => {
      const nextTerminals = [...s.terminals, terminal];
      void backend.upsertTerminals(nextTerminals).catch((e) => console.error("Falha ao salvar terminais:", e));
      return { terminals: nextTerminals };
    });
  },

  updateTerminal: (id, updates) => {
    set((s) => {
      const nextTerminals = s.terminals.map((terminal) =>
        terminal.id === id ? { ...terminal, ...updates, updated_at: new Date().toISOString() } : terminal
      );
      void backend.upsertTerminals(nextTerminals).catch((e) => console.error("Falha ao atualizar terminal:", e));
      return { terminals: nextTerminals };
    });
  },

  deleteTerminal: (id) => {
    set((s) => {
      const nextTerminals = s.terminals.filter((terminal) => terminal.id !== id);
      void backend.upsertTerminals(nextTerminals).catch((e) => console.error("Falha ao remover terminal:", e));
      return { terminals: nextTerminals };
    });
  },

  cart: [],
  cartTotals: { subtotal: 0, discount: 0, total: 0 },
  orders: [],
  currentShift: null,
  reportShifts: [],
  currentSession: null,

  // --- Cart Actions ---
  addToCart: (product, modifiers = [], note = '') => {
    // Calculate modifier cost
    const modCost = 0;
    const newItem: CartItem = {
      ...product,
      price: product.price + modCost,
      cartId: newId(),
      selectedModifiers: modifiers,
      note,
      completed: false
    };

    set((state) => {
      const newCart = [...state.cart, newItem];
      return {
        cart: newCart,
        cartTotals: calculateCartTotals(newCart, state.promotions)
      };
    });
  },

  removeFromCart: (cartId) => {
    set((state) => {
      const newCart = state.cart.filter(item => item.cartId !== cartId);
      return {
        cart: newCart,
        cartTotals: calculateCartTotals(newCart, state.promotions)
      };
    });
  },

  updateCartItem: (cartId, updates) => {
    set((state) => {
      const newCart = state.cart.map(item => item.cartId === cartId ? { ...item, ...updates } : item);
      return { cart: newCart, cartTotals: calculateCartTotals(newCart, state.promotions) };
    });
  },

  clearCart: () => set({ cart: [], cartTotals: { subtotal: 0, discount: 0, total: 0 } }),

  // --- Order Actions ---
  createOrder: (type, method, customerName, customId) => {
    const { cart, cartTotals, currentShift, currentSession, addShiftTransaction, ingredients } = get();
    if (cart.length === 0) return;

    if (!currentSession && backend.kind === 'supabase') {
      console.warn("Criando pedido sem sessão de loja aberta!");
    }

    // 1. Handle Cash Log
    if (currentShift && method === PaymentMethod.CASH) {
      addShiftTransaction('SALE', cartTotals.total, `Pagamento Pedido`);
    }

    // 2. Handle Inventory Deduction (Naive implementation)
    // In a real app, this happens on the backend to avoid race conditions
    const stockUpdates: Record<string, number> = {};
    cart.forEach(item => {
      if (item.recipe) {
        item.recipe.forEach(comp => {
          stockUpdates[comp.ingredient_id] = (stockUpdates[comp.ingredient_id] || 0) + comp.quantity;
        });
      }
    });

    const updatedIngredients = ingredients.map(ing => {
      const delta = stockUpdates[ing.id];
      if (!delta) return ing;
      return { ...ing, current_stock: ing.current_stock - delta };
    });

    const stockLogsToInsert: StockLog[] = Object.entries(stockUpdates).map(([ingredientId, qty]) => ({
      id: newId(),
      date: new Date().toISOString(),
      ingredient_id: ingredientId,
      change: -qty,
      type: 'SALE',
      notes: 'Baixa por Venda'
    }));

    if (stockLogsToInsert.length > 0) {
      set(state => ({
        ingredients: updatedIngredients,
        stockLogs: [...state.stockLogs, ...stockLogsToInsert]
      }));
      updatedIngredients.forEach(ing => {
        if (stockUpdates[ing.id]) void backend.upsertIngredient(ing).catch(() => { });
      });
      stockLogsToInsert.forEach(log => {
        void backend.insertStockLog(log).catch(() => { });
      });
    }

    // 3. Create Order
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: newId(),
      // Use custom alphanumeric ID if provided, otherwise generate random
      order_number: customId || Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      created_at: now,
      paid_at: now,
      delivered_at: now,
      status: OrderStatus.DELIVERED,
      type,
      items: [...cart],
      ...cartTotals,
      customer_name: customerName || `Cliente`,
      payment_method: method,
      shift_id: currentShift?.id,
      session_id: currentSession?.id,
      terminal_id: currentShift?.terminal_id || 'KIOSK'
    };

    set((state) => ({
      orders: [...state.orders, newOrder],
      cart: [],
      cartTotals: { subtotal: 0, discount: 0, total: 0 }
    }));

    void backend.upsertOrder(newOrder).catch(() => { });
  },

  updateOrderStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id !== orderId) return o;
        const updates: any = { status };
        const now = new Date().toISOString();
        if (status === OrderStatus.PREPARING) updates.started_at = now;
        if (status === OrderStatus.READY) updates.ready_at = now;
        if (status === OrderStatus.DELIVERED) updates.delivered_at = now;
        return { ...o, ...updates };
      })
    }));
    const updated = get().orders.find(o => o.id === orderId);
    if (updated) void backend.upsertOrder(updated).catch(() => { });
  },

  toggleOrderItemComplete: (orderId, cartId) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id !== orderId) return o;

        // 1. Toggle the specific item
        const updatedItems = o.items.map(i => i.cartId === cartId ? { ...i, completed: !i.completed } : i);

        return {
          ...o,
          items: updatedItems,
        };
      })
    }));
    const updated = get().orders.find(o => o.id === orderId);
    if (updated) void backend.upsertOrder(updated).catch(() => { });
  },

  setOrderItemPrepTime: (orderId, cartId, minutes) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map(i => i.cartId === cartId ? { ...i, estimatedPrepTime: minutes } : i)
        };
      })
    }));
    const updated = get().orders.find(o => o.id === orderId);
    if (updated) void backend.upsertOrder(updated).catch(() => { });
  },

  recallOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id !== orderId) return o;
        let prevStatus = o.status;
        const updates: any = {};

        // Determine previous status and clear the timestamp of the *current* status
        // so SLAs reset correctly.
        if (o.status === OrderStatus.DELIVERED) {
          prevStatus = OrderStatus.READY;
          updates.delivered_at = undefined;
        }
        else if (o.status === OrderStatus.PARTIAL) {
          prevStatus = OrderStatus.READY;
          // Keep ready_at as is, since it was already ready
        }
        else if (o.status === OrderStatus.READY) {
          prevStatus = OrderStatus.PREPARING;
          updates.ready_at = undefined;
        }
        else if (o.status === OrderStatus.PREPARING) {
          prevStatus = OrderStatus.PAID;
          updates.started_at = undefined;
        }

        return { ...o, status: prevStatus, ...updates };
      })
    }));
    const updated = get().orders.find(o => o.id === orderId);
    if (updated) void backend.upsertOrder(updated).catch(() => { });
  },

  // --- Shift Actions ---
  openShift: async (staffName, startCash, terminalId, openingData) => {
    const { currentSession } = get();
    // Validate: Cannot open shift if store is closed
    if (!currentSession || currentSession.status !== 'OPEN') {
      alert("A Loja está FECHADA. Abra o expediente da loja antes de abrir o caixa.");
      return null;
    }

    const newShift: Shift = {
      id: newId(),
      staff_name: staffName,
      terminal_id: terminalId,
      session_id: currentSession.id,
      opened_at: new Date().toISOString(),
      start_cash: startCash,
      current_cash: startCash,
      status: 'OPEN',
      ...openingData,
      transactions: [{
        id: 'init', time: new Date().toISOString(), type: 'OPENING', amount: startCash, user_id: staffName
      }]
    };

    if (backend.kind === 'supabase') {
      await backend.upsertShift(newShift);
    }

    set((state) => ({
      currentShift: newShift,
      reportShifts: [newShift, ...state.reportShifts.filter((shift) => shift.id !== newShift.id)]
    }));
    if (backend.kind !== 'supabase') {
      void backend.upsertShift(newShift).catch((e) => console.error("Failed to open shift:", e));
    }
    return newShift;
  },

  updateShiftOpeningData: async (updates) => {
    const shift = get().currentShift;
    if (!shift || shift.status !== 'OPEN') return null;

    const nextStartCash = updates.start_cash ?? shift.start_cash;
    const cashDelta = nextStartCash - shift.start_cash;
    const nextStaffName = updates.staff_name ?? shift.staff_name;
    const nextTransactions = shift.transactions.map((transaction) => {
      if (transaction.type !== 'OPENING') return transaction;
      return {
        ...transaction,
        amount: nextStartCash,
        user_id: nextStaffName
      };
    });

    const updatedShift: Shift = {
      ...shift,
      ...updates,
      current_cash: shift.current_cash + cashDelta,
      transactions: nextTransactions
    };

    if (backend.kind === 'supabase') {
      await backend.upsertShift(updatedShift);
    }

    set((state) => ({
      currentShift: updatedShift,
      reportShifts: state.reportShifts.map((reportShift) => reportShift.id === updatedShift.id ? updatedShift : reportShift)
    }));

    if (backend.kind !== 'supabase') {
      void backend.upsertShift(updatedShift).catch((e) => console.error("Failed to update shift opening data:", e));
    }

    return updatedShift;
  },

  closeShift: async (metrics?: { drinks_liters?: number, burger_cost?: number, burgers_produced?: number, burgers_unsold?: number, menu_name?: string, closer_name?: string, feedback?: string }) => {
    const shift = get().currentShift;
    if (!shift) return null;

    const now = new Date().toISOString();
    const changedBy = metrics?.closer_name || shift.staff_name;

    // Baseline planejado na abertura para comparar com o que foi informado no fechamento
    const openingMenu = shift.daily_menu_name ?? null;
    const openingCost = shift.opening_unit_cost ?? null;
    const openingDrinksLiters = shift.opening_drinks_liters ?? null;
    const hasPlanned = shift.planned_normal_burgers != null || shift.planned_vegan_burgers != null;
    const openingProduced = hasPlanned
      ? (shift.planned_normal_burgers ?? 0) + (shift.planned_vegan_burgers ?? 0)
      : null;

    const adjustments: ShiftAdjustment[] = [...(shift.adjustments ?? [])];
    const recordAdjustment = (
      field: ShiftAdjustment['field'],
      label: string,
      previous: string | number | null,
      next: string | number | null | undefined
    ) => {
      // Só registra quando havia um valor de abertura e ele de fato mudou
      if (next === undefined || next === null || next === '') return;
      if (previous === null || previous === undefined || previous === '') return;
      // Tolerância numérica para evitar falsos ajustes por arredondamento (2 casas)
      const unchanged = typeof previous === 'number' && typeof next === 'number'
        ? Math.abs(previous - next) < 0.005
        : previous === next;
      if (unchanged) return;
      adjustments.push({
        id: newId(),
        field,
        label,
        previous_value: previous,
        new_value: next,
        changed_at: now,
        changed_by: changedBy
      });
    };

    recordAdjustment('menu_name', 'Cardápio do Lanche', openingMenu, metrics?.menu_name);
    recordAdjustment('burger_cost', 'Custo do Lanche', openingCost, metrics?.burger_cost);
    recordAdjustment('burgers_produced', 'Total de Lanches Produzidos', openingProduced, metrics?.burgers_produced);
    recordAdjustment('drinks_liters', 'Litros de Bebida', openingDrinksLiters, metrics?.drinks_liters);

    const updatedShift: Shift = {
      ...shift,
      ...metrics,
      adjustments,
      status: 'CLOSED',
      closed_at: now
    };

    if (backend.kind === 'supabase') {
      await backend.upsertShift(updatedShift);
    }

    set((state) => ({
      currentShift: updatedShift,
      reportShifts: state.reportShifts.map((reportShift) => reportShift.id === updatedShift.id ? updatedShift : reportShift)
    }));

    if (backend.kind !== 'supabase') {
      void backend.upsertShift(updatedShift).catch((e) => console.error("Failed to close shift:", e));
    }
    return updatedShift;
  },

  addShiftTransaction: (type, amount, reason, extras) => {
    set((state) => {
      if (!state.currentShift) return {};
      let cashDelta = 0;
      if (type === 'ADD' || type === 'SALE') cashDelta = amount;
      if (type === 'DROP' || type === 'REIMBURSEMENT') cashDelta = -amount;
      const newTransaction: ShiftTransaction = {
        id: newId(),
        time: new Date().toISOString(),
        type,
        amount,
        reason,
        user_id: state.currentShift.staff_name,
        ...extras
      };
      const updatedShift: Shift = {
        ...state.currentShift,
        current_cash: state.currentShift.current_cash + cashDelta,
        transactions: [...state.currentShift.transactions, newTransaction]
      };
      void backend.upsertShift(updatedShift).catch(() => { });
      return {
        currentShift: updatedShift,
        reportShifts: state.reportShifts.map((reportShift) => reportShift.id === updatedShift.id ? updatedShift : reportShift)
      };
    });
  },

  addShiftTransactions: async (transactions) => {
    const currentShift = get().currentShift;
    if (!currentShift || transactions.length === 0) return currentShift;

    const newTransactions: ShiftTransaction[] = transactions.map(({ type, amount, reason, extras }) => ({
      id: newId(),
      time: new Date().toISOString(),
      type,
      amount,
      reason,
      user_id: currentShift.staff_name,
      ...extras
    }));

    const cashDelta = newTransactions.reduce((total, transaction) => {
      if (transaction.type === 'ADD' || transaction.type === 'SALE') return total + transaction.amount;
      if (transaction.type === 'DROP' || transaction.type === 'REIMBURSEMENT') return total - transaction.amount;
      return total;
    }, 0);

    const updatedShift: Shift = {
      ...currentShift,
      current_cash: currentShift.current_cash + cashDelta,
      transactions: [...currentShift.transactions, ...newTransactions]
    };

    if (backend.kind === 'supabase') {
      await backend.upsertShift(updatedShift);
    }

    set((state) => ({
      currentShift: updatedShift,
      reportShifts: state.reportShifts.map((reportShift) => reportShift.id === updatedShift.id ? updatedShift : reportShift)
    }));

    if (backend.kind !== 'supabase') {
      void backend.upsertShift(updatedShift).catch((e) => console.error("Failed to add shift transactions:", e));
    }

    return updatedShift;
  },

  updateShiftFixedProductPrice: (productId, price) => {
    if (!Number.isFinite(price) || price < 0) return;
    set((state) => {
      if (!state.currentShift || state.currentShift.status !== 'OPEN') return {};
      if (
        productId !== FIXED_PRODUCT_IDS.ESCOTEIRO &&
        productId !== FIXED_PRODUCT_IDS.EXTRA &&
        productId !== FIXED_PRODUCT_IDS.VEGANO
      ) return {};

      const updatedShift: Shift = {
        ...state.currentShift,
        opening_unit_cost: price
      };

      void backend.upsertShift(updatedShift).catch(() => { });
      return {
        currentShift: updatedShift,
        reportShifts: state.reportShifts.map((reportShift) => reportShift.id === updatedShift.id ? updatedShift : reportShift)
      };
    });
  },

  // --- Tax Settings ---
  maxItemsPerOrder: readBusinessRulesFromStorage()?.maxItemsPerOrder || 3,
  setMaxItemsPerOrder: (limit) => {
    set({ maxItemsPerOrder: limit });
    writeBusinessRulesToStorage({ maxItemsPerOrder: limit });
    void backend.upsertBusinessRules({ maxItemsPerOrder: limit }).catch(e => console.error("Failed to save business rules:", e));
  },

  activePaymentMethodsPOS: defaultPaymentSettings.pos,
  activePaymentMethodsKiosk: defaultPaymentSettings.kiosk,
  togglePaymentMethod: (target, method) => {
    if (!supportedPaymentMethods.has(method)) return;
    set(state => {
      let nextState: any = {};
      if (target === 'POS') {
        const current = state.activePaymentMethodsPOS;
        nextState = { activePaymentMethodsPOS: current.includes(method) ? current.filter(m => m !== method) : [...current, method] };
      } else {
        const current = state.activePaymentMethodsKiosk;
        nextState = { activePaymentMethodsKiosk: current.includes(method) ? current.filter(m => m !== method) : [...current, method] };
      }

      // Persist to backend
      const nextStateObj = target === 'POS'
        ? { activePaymentMethodsPOS: nextState.activePaymentMethodsPOS, activePaymentMethodsKiosk: state.activePaymentMethodsKiosk }
        : { activePaymentMethodsPOS: state.activePaymentMethodsPOS, activePaymentMethodsKiosk: nextState.activePaymentMethodsKiosk };

      void backend.upsertPaymentSettings({
        pos: nextStateObj.activePaymentMethodsPOS,
        kiosk: nextStateObj.activePaymentMethodsKiosk
      }).catch(e => console.error("Failed to save payment settings:", e));

      writePaymentSettingsToStorage({
        pos: nextStateObj.activePaymentMethodsPOS,
        kiosk: nextStateObj.activePaymentMethodsKiosk
      });

      return nextState;
    });
  },

  taxSettings: {
    isEnabled: false,
    taxName: 'ICMS',
    defaultRate: 18.0,
    taxId: '',
    exemptCategories: []
  },

  updateTaxSettings: (settings) => {
    const merged = { ...get().taxSettings, ...settings };
    set({ taxSettings: merged });
    void backend.upsertTaxSettings(merged).catch(() => { });
  },

  printReceiptEnabled: readPrintSettingsFromStorage(),
  setPrintReceiptEnabled: (enabled) => {
    set({ printReceiptEnabled: enabled });
    writePrintSettingsToStorage(enabled);
    void backend.upsertPrintSettings({ enabled }).catch(e => console.error("Failed to save print settings:", e));
  },

  resetDatabase: async (keepCatalog) => {
    try {
      await backend.resetDatabase({ keepCatalog });

      // Clear local state
      set({
        orders: [],
        stockLogs: [],
        currentShift: null,
        reportShifts: [],
        currentSession: null,
        // If not keeping catalog, clear it too
        products: keepCatalog ? get().products : [],
        ingredients: keepCatalog ? get().ingredients : [],
        promotions: keepCatalog ? get().promotions : [],
        menuCatalogs: keepCatalog ? get().menuCatalogs : [],
        terminals: keepCatalog ? get().terminals : [],
        users: keepCatalog ? get().users : [],
      });

      // If we wiped catalog, we might want to reload to trigger re-seeding if backend does it
      if (!keepCatalog) {
        // reload window or re-init?
        // window.location.reload(); 
        // Better to just re-init
        await get().initializeBackend();
      }
    } catch (e) {
      console.error("Failed to reset database:", e);
      throw e;
    }
  },

  // --- Store Session Actions ---
  openStore: (user) => {
    const newSession: StoreSession = {
      id: newId(),
      opened_at: new Date().toISOString(),
      status: 'OPEN',
      opened_by: user
    };
    set({ currentSession: newSession });
    void backend.upsertSession(newSession).catch(() => { });
  },

  closeStore: (user) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const closedSession: StoreSession = {
      ...currentSession,
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
      closed_by: user
    };
    set({ currentSession: null }); // Clear current session from store
    void backend.upsertSession(closedSession).catch(() => { });
  },

  forceCompleteAllOrders: async () => {
    try {
      await backend.forceCompleteAllOrders();
      
      // Update local state to reflect changes immediately
      set(state => ({
        orders: state.orders.map(o => {
          if (o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED) {
            return {
              ...o,
              status: OrderStatus.DELIVERED,
              delivered_at: new Date().toISOString(),
              ready_at: o.ready_at || new Date().toISOString()
            };
          }
          return o;
        })
      }));
    } catch (e) {
      console.error("Failed to force complete orders:", e);
      throw e;
    }
  },

}));
