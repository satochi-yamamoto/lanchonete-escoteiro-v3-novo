import { create } from 'zustand';
import { CartItem, Order, OrderStatus, OrderType, Product, Shift, ShiftTransaction, PaymentMethod, Ingredient, StockLog, User, Promotion, ShiftTransactionExtras, TaxSettings, StoreSession, Scout } from './types';
import { calculateCartTotals, MOCK_PROMOTIONS } from './services/promotionEngine';
import { backend, BackendInterface } from './services/backend/backend';
import { MOCK_INGREDIENTS, MOCK_PRODUCTS, MOCK_USERS, MOCK_SCOUTS } from './services/mockData';
import { generateUUID } from './utils';

interface AppState {
  backend: BackendInterface;
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
  openShift: (staffName: string, startCash: number, terminalId: string) => void;
  closeShift: (metrics?: { drinks_liters?: number, burger_cost?: number, burgers_produced?: number, burgers_unsold?: number, menu_name?: string, closer_name?: string, feedback?: string }) => void;
  addShiftTransaction: (type: ShiftTransaction['type'], amount: number, reason: string, extras?: ShiftTransactionExtras) => void;

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

const PAYMENT_SETTINGS_STORAGE_KEY = 'omni_payment_settings';

const defaultPaymentSettings = {
  pos: [PaymentMethod.CASH, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.PIX],
  kiosk: [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.PIX]
};

const isPaymentMethod = (value: unknown): value is PaymentMethod => {
  return typeof value === 'string' && Object.values(PaymentMethod).includes(value as PaymentMethod);
};

const readPaymentSettingsFromStorage = (): { pos: PaymentMethod[]; kiosk: PaymentMethod[] } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PAYMENT_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { pos?: unknown[]; kiosk?: unknown[] };
    const pos = Array.isArray(parsed.pos) ? parsed.pos.filter(isPaymentMethod) : [];
    const kiosk = Array.isArray(parsed.kiosk) ? parsed.kiosk.filter(isPaymentMethod) : [];
    if (pos.length === 0 || kiosk.length === 0) return null;
    return { pos, kiosk };
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
    // We don't change the backend object structure anymore, just load data
    // set({ backend: { kind: 'supabase', status: 'loading' } }); 
    // ^ This was replacing the object with a plain status object, removing methods!

    try {
      const data = await backend.loadInitialState();
      if (!data) {
        // Fallback to local is handled by initial state check in backend
        return;
      }
      // Spread data into store, but keep backend methods intact
      set({
        ...data,
        dbUsers: data.users, // Store DB users separately
        users: MOCK_USERS, // Keep login users as static mock users
        activePaymentMethodsPOS: (data as any).paymentSettings?.pos || get().activePaymentMethodsPOS,
        activePaymentMethodsKiosk: (data as any).paymentSettings?.kiosk || get().activePaymentMethodsKiosk,
        printReceiptEnabled: (data as any).printSettings?.enabled ?? get().printReceiptEnabled,
        maxItemsPerOrder: (data as any).businessRules?.maxItemsPerOrder ?? get().maxItemsPerOrder
      });

      writePaymentSettingsToStorage({
        pos: (data as any).paymentSettings?.pos || get().activePaymentMethodsPOS,
        kiosk: (data as any).paymentSettings?.kiosk || get().activePaymentMethodsKiosk
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
        // 3. Status Handler
        (status) => set({ realtimeStatus: status })
      );

    } catch (e: any) {
      const message = e instanceof Error ? e.message : (e?.message || JSON.stringify(e));
      console.error("Backend init error:", message);
      // set({ backend: { kind: 'supabase', status: 'error', error: message } });
    }
  },

  products: backend.kind === 'supabase' ? [] : MOCK_PRODUCTS,
  ingredients: backend.kind === 'supabase' ? [] : MOCK_INGREDIENTS,
  stockLogs: [],
  users: MOCK_USERS,
  dbUsers: [],
  scouts: backend.kind === 'supabase' ? [] : MOCK_SCOUTS,
  promotions: backend.kind === 'supabase' ? [] : MOCK_PROMOTIONS,

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

  cart: [],
  cartTotals: { subtotal: 0, discount: 0, total: 0 },
  orders: [],
  currentShift: null,
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
    const newOrder: Order = {
      id: newId(),
      // Use custom alphanumeric ID if provided, otherwise generate random
      order_number: customId || Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      created_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      status: OrderStatus.PAID,
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
  openShift: (staffName, startCash, terminalId) => {
    const { currentSession } = get();
    // Validate: Cannot open shift if store is closed
    if (!currentSession || currentSession.status !== 'OPEN') {
      alert("A Loja está FECHADA. Abra o expediente da loja antes de abrir o caixa.");
      return;
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
      transactions: [{
        id: 'init', time: new Date().toISOString(), type: 'OPENING', amount: startCash, user_id: staffName
      }]
    };
    set({ currentShift: newShift });
    void backend.upsertShift(newShift).catch(() => { });
  },

  closeShift: (metrics?: { drinks_liters?: number, burger_cost?: number, burgers_produced?: number, burgers_unsold?: number, menu_name?: string, closer_name?: string, feedback?: string }) => {
    set((state) => {
      if (!state.currentShift) return {};
      const updatedShift: Shift = {
        ...state.currentShift,
        ...metrics,
        status: 'CLOSED',
        closed_at: new Date().toISOString()
      };
      // Use a persistent action to update backend, but here we just trigger it
      void backend.upsertShift(updatedShift).catch(() => { });

      // IMPORTANT: We must set currentShift to null or update it to be closed
      // But for the UI to know there is no *active* shift, null is better, 
      // or we keep the closed shift in view until a new one starts.
      // Let's keep it as closed in state, but StoreControl checks status === 'OPEN'
      return { currentShift: updatedShift };
    });
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
      return { currentShift: updatedShift };
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
        currentSession: null,
        // If not keeping catalog, clear it too
        products: keepCatalog ? get().products : [],
        ingredients: keepCatalog ? get().ingredients : [],
        promotions: keepCatalog ? get().promotions : [],
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
