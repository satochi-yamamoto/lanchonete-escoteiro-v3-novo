import { Ingredient, Order, Product, Promotion, Shift, StockLog, StoreSession, TaxSettings, User, Scout, PaymentMethod, MenuCatalog, TerminalConfig } from '../../types';
import { MOCK_INGREDIENTS, MOCK_PRODUCTS, MOCK_USERS, MOCK_SCOUTS } from '../mockData';
import { MOCK_PROMOTIONS } from '../promotionEngine';
import { acknowledgeLocalOperation, enqueueLocalOperation, isDesktopRuntime, localRecords, markLocalOperationFailure, pendingLocalOperations, removeLocalRecord, replaceLocalRecords, saveLocalRecord } from './desktopSqlite';

export type BackendKind = 'api' | 'local';
export interface BackendStatus { kind: BackendKind; status: 'idle' | 'loading' | 'ready' | 'error'; error?: string; }
export interface BackendInitialState {
  products: Product[]; ingredients: Ingredient[]; stockLogs: StockLog[]; promotions: Promotion[]; users: User[];
  menuCatalogs: MenuCatalog[]; terminals: TerminalConfig[]; scouts: Scout[]; orders: Order[];
  currentShift: Shift | null; currentSession: StoreSession | null; taxSettings: TaxSettings;
  paymentSettings: { pos: PaymentMethod[]; kiosk: PaymentMethod[] }; printSettings: { enabled: boolean };
  businessRules: { maxItemsPerOrder: number };
}

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const tokenKey = 'lanchonete_api_token';
const defaultTaxSettings: TaxSettings = { isEnabled: false, taxName: 'ICMS', defaultRate: 18, taxId: '', exemptCategories: [] };
const defaultPaymentSettings = { pos: [PaymentMethod.PIX, PaymentMethod.CASH], kiosk: [PaymentMethod.PIX, PaymentMethod.CASH] };
const supportedPaymentMethods = new Set<PaymentMethod>([PaymentMethod.PIX, PaymentMethod.CASH]);
const defaultMenuCatalogs: MenuCatalog[] = [];
const defaultTerminals: TerminalConfig[] = [];

const getToken = () => typeof window === 'undefined' ? null : window.sessionStorage.getItem(tokenKey);
const setToken = (token: string) => window.sessionStorage.setItem(tokenKey, token);
const clearToken = () => window.sessionStorage.removeItem(tokenKey);
const isApiConfigured = () => Boolean(apiUrl);
const endpoint = (path: string) => `${apiUrl}${path}`;
const normalizePaymentSettings = (settings?: { pos?: PaymentMethod[]; kiosk?: PaymentMethod[] }) => {
  const normalize = (methods: PaymentMethod[] | undefined, fallback: PaymentMethod[]) => {
    const supported = methods?.filter((method) => supportedPaymentMethods.has(method)) ?? [];
    return supported.length ? supported : fallback;
  };
  return { pos: normalize(settings?.pos, defaultPaymentSettings.pos), kiosk: normalize(settings?.kiosk, defaultPaymentSettings.kiosk) };
};

const request = async <T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> => {
  if (!apiUrl) throw new Error('VITE_API_URL não configurada.');
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(endpoint(path), { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Erro de API (${response.status}).`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
};

const localState = (): BackendInitialState => ({
  products: MOCK_PRODUCTS, ingredients: MOCK_INGREDIENTS, stockLogs: [], promotions: MOCK_PROMOTIONS, users: MOCK_USERS,
  menuCatalogs: defaultMenuCatalogs, terminals: defaultTerminals, scouts: MOCK_SCOUTS, orders: [], currentShift: null,
  currentSession: null, taxSettings: defaultTaxSettings, paymentSettings: defaultPaymentSettings, printSettings: { enabled: true }, businessRules: { maxItemsPerOrder: 3 }
});
const operationId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const flushDesktopOutbox = async () => {
  if (!isDesktopRuntime() || !getToken() || !navigator.onLine) return;
  for (const operation of await pendingLocalOperations()) {
    try {
      const path = operation.resource === 'settings' ? `/api/settings/${encodeURIComponent(operation.recordId)}`
        : operation.resource === 'users' ? `/api/users/${encodeURIComponent(operation.recordId)}`
          : operation.resource === 'stock-logs' ? '/api/stock-logs'
            : `/api/resources/${operation.resource}/${encodeURIComponent(operation.recordId)}`;
      await request(path, operation.method === 'DELETE' ? { method: 'DELETE' } : { method: operation.method, body: JSON.stringify(operation.payload) });
      await acknowledgeLocalOperation(operation.id);
    } catch (error) { await markLocalOperationFailure(operation.id, error); break; }
  }
};
const putResource = async <T>(table: string, value: { id: string }) => {
  if (!isDesktopRuntime()) return request<T>(`/api/resources/${table}/${encodeURIComponent(value.id)}`, { method: 'PUT', body: JSON.stringify(value) });
  await saveLocalRecord(table, value.id, value);
  await enqueueLocalOperation({ id: operationId(), method: 'PUT', resource: table, recordId: value.id, payload: value });
  void flushDesktopOutbox();
};
const deleteResource = async (table: string, id: string) => {
  if (!isDesktopRuntime()) return request<void>(`/api/resources/${table}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await removeLocalRecord(table, id);
  await enqueueLocalOperation({ id: operationId(), method: 'DELETE', resource: table, recordId: id });
  void flushDesktopOutbox();
};
const putSetting = async (id: string, value: unknown) => {
  if (!isDesktopRuntime()) return request<void>(`/api/settings/${id}`, { method: 'PUT', body: JSON.stringify(value) });
  await saveLocalRecord('settings', id, { id, value });
  await enqueueLocalOperation({ id: operationId(), method: 'PUT', resource: 'settings', recordId: id, payload: value });
  void flushDesktopOutbox();
};
const putUser = async (user: User) => {
  if (!isDesktopRuntime()) return request(`/api/users/${encodeURIComponent(user.id)}`, { method: 'PUT', body: JSON.stringify(user) });
  await saveLocalRecord('users', user.id, user);
  await enqueueLocalOperation({ id: operationId(), method: 'PUT', resource: 'users', recordId: user.id, payload: user });
  void flushDesktopOutbox();
};
const putStockLog = async (log: StockLog) => {
  if (!isDesktopRuntime()) return request('/api/stock-logs', { method: 'POST', body: JSON.stringify(log) });
  await saveLocalRecord('stock_logs', log.id, log);
  await enqueueLocalOperation({ id: operationId(), method: 'POST', resource: 'stock-logs', recordId: log.id, payload: log });
  void flushDesktopOutbox();
};

const localDesktopState = async (): Promise<BackendInitialState> => {
  const fallback = localState();
  const [products, ingredients, stockLogs, promotions, users, orders, shifts, sessions, scouts, settings] = await Promise.all([
    localRecords<Product>('products'), localRecords<Ingredient>('ingredients'), localRecords<StockLog>('stock_logs'), localRecords<Promotion>('promotions'),
    localRecords<User>('users'), localRecords<Order>('orders'), localRecords<Shift>('shifts'), localRecords<StoreSession>('store_sessions'), localRecords<Scout>('scouts'),
    localRecords<{ id: string; value: any }>('settings'),
  ]);
  const setting = (id: string, defaultValue: any) => settings.find((entry) => entry.id === id)?.value ?? defaultValue;
  return {
    ...fallback, products: products.length ? products : fallback.products, ingredients: ingredients.length ? ingredients : fallback.ingredients,
    stockLogs, promotions: promotions.length ? promotions : fallback.promotions, users: users.length ? users : fallback.users, orders,
    currentShift: shifts.find((shift) => shift.status === 'OPEN') ?? null, currentSession: sessions.find((session) => session.status === 'OPEN') ?? null,
    scouts, taxSettings: setting('tax_settings', fallback.taxSettings), paymentSettings: setting('payment_settings', fallback.paymentSettings),
    printSettings: setting('print_settings', fallback.printSettings), businessRules: setting('business_rules', fallback.businessRules),
    menuCatalogs: setting('menu_catalogs', fallback.menuCatalogs), terminals: setting('terminals', fallback.terminals),
  };
};

const persistDesktopState = async (state: BackendInitialState) => {
  await Promise.all([
    replaceLocalRecords('products', state.products), replaceLocalRecords('ingredients', state.ingredients), replaceLocalRecords('stock_logs', state.stockLogs),
    replaceLocalRecords('promotions', state.promotions), replaceLocalRecords('users', state.users), replaceLocalRecords('orders', state.orders),
    replaceLocalRecords('shifts', state.currentShift ? [state.currentShift] : []), replaceLocalRecords('store_sessions', state.currentSession ? [state.currentSession] : []),
    replaceLocalRecords('scouts', state.scouts),
    saveLocalRecord('settings', 'tax_settings', { id: 'tax_settings', value: state.taxSettings }),
    saveLocalRecord('settings', 'payment_settings', { id: 'payment_settings', value: state.paymentSettings }),
    saveLocalRecord('settings', 'print_settings', { id: 'print_settings', value: state.printSettings }),
    saveLocalRecord('settings', 'business_rules', { id: 'business_rules', value: state.businessRules }),
    saveLocalRecord('settings', 'menu_catalogs', { id: 'menu_catalogs', value: state.menuCatalogs }),
    saveLocalRecord('settings', 'terminals', { id: 'terminals', value: state.terminals }),
  ]);
};

export interface BackendInterface {
  kind: BackendKind; loadInitialState: () => Promise<BackendInitialState | null>; checkSchema: () => Promise<string[]>;
  fetchScouts: () => Promise<Scout[]>; fetchOrders: () => Promise<Order[]>;
  upsertProduct: (p: Product) => Promise<void>; deleteProduct: (id: string) => Promise<void>;
  upsertIngredient: (i: Ingredient) => Promise<void>; insertStockLog: (log: StockLog) => Promise<void>;
  upsertPromotion: (p: Promotion) => Promise<void>; deletePromotion: (id: string) => Promise<void>;
  upsertUser: (u: User) => Promise<void>; deleteUser: (id: string) => Promise<void>;
  upsertScout: (s: Scout) => Promise<void>; deleteScout: (id: string) => Promise<void>;
  upsertShift: (shift: Shift) => Promise<void>; upsertSession: (session: StoreSession) => Promise<void>; upsertOrder: (order: Order) => Promise<void>;
  upsertTaxSettings: (settings: TaxSettings) => Promise<void>; upsertPaymentSettings: (settings: { pos: PaymentMethod[]; kiosk: PaymentMethod[] }) => Promise<void>;
  upsertPrintSettings: (settings: { enabled: boolean }) => Promise<void>; upsertBusinessRules: (rules: { maxItemsPerOrder: number }) => Promise<void>;
  upsertMenuCatalogs: (menus: MenuCatalog[]) => Promise<void>; upsertTerminals: (terminals: TerminalConfig[]) => Promise<void>;
  subscribeToChanges: (onOrdersChange: (payload: any) => void, onSessionsChange: (payload: any) => void, onShiftsChange: (payload: any) => void, onStatusChange?: (status: string) => void) => () => void;
  fetchReports: (startDate?: string, endDate?: string) => Promise<{ shifts: Shift[]; orders: Order[] }>;
  signIn: (email: string, password: string) => Promise<{ user: any; error: any }>; signOut: () => Promise<void>;
  authenticateUserByPin: (userId: string, pin: string) => Promise<User | null>;
  resetDatabase: (options?: { keepCatalog?: boolean }) => Promise<void>; forceCompleteAllOrders: () => Promise<void>;
}

export const backend: BackendInterface = {
  kind: isApiConfigured() ? 'api' : 'local',
  checkSchema: async () => { if (!isApiConfigured()) return []; await request('/api/health', {}, false); return []; },
  loadInitialState: async () => {
    if (isDesktopRuntime()) {
      if (!getToken()) {
        try { await replaceLocalRecords('users', await request<User[]>('/api/login-users', {}, false)); } catch { /* Offline login uses cached users. */ }
        return localDesktopState();
      }
      try {
        await flushDesktopOutbox();
        const remote = await request<BackendInitialState>('/api/initial-state');
        await persistDesktopState(remote);
        return remote;
      } catch { return localDesktopState(); }
    }
    if (!isApiConfigured()) return localState();
    if (!getToken()) {
      const users = await request<User[]>('/api/login-users', {}, false);
      return { ...localState(), products: [], ingredients: [], promotions: [], scouts: [], users };
    }
    return request<BackendInitialState>('/api/initial-state');
  },
  fetchScouts: async () => isDesktopRuntime() ? localRecords<Scout>('scouts') : isApiConfigured() ? request<Scout[]>('/api/scouts') : MOCK_SCOUTS,
  fetchOrders: async () => isDesktopRuntime() ? localRecords<Order>('orders') : isApiConfigured() ? request<Order[]>('/api/orders') : [],
  upsertProduct: async (product) => { if (isApiConfigured()) await putResource('products', product); },
  deleteProduct: async (id) => { if (isApiConfigured()) await deleteResource('products', id); },
  upsertIngredient: async (ingredient) => { if (isApiConfigured()) await putResource('ingredients', ingredient); },
  insertStockLog: async (log) => { if (isApiConfigured()) await putStockLog(log); },
  upsertPromotion: async (promotion) => { if (isApiConfigured()) await putResource('promotions', promotion); },
  deletePromotion: async (id) => { if (isApiConfigured()) await deleteResource('promotions', id); },
  upsertUser: async (user) => { if (isApiConfigured()) await putUser(user); },
  deleteUser: async (id) => { if (isApiConfigured()) await deleteResource('users', id); },
  upsertScout: async (scout) => { if (isApiConfigured()) await putResource('scouts', scout); },
  deleteScout: async (id) => { if (isApiConfigured()) await deleteResource('scouts', id); },
  upsertShift: async (shift) => { if (isApiConfigured()) await putResource('shifts', shift); },
  upsertSession: async (session) => { if (isApiConfigured()) await putResource('store_sessions', session); },
  upsertOrder: async (order) => { if (isApiConfigured()) await putResource('orders', order); },
  upsertTaxSettings: async (settings) => { if (isApiConfigured()) await putSetting('tax_settings', settings); },
  upsertPaymentSettings: async (settings) => { if (isApiConfigured()) await putSetting('payment_settings', normalizePaymentSettings(settings)); },
  upsertPrintSettings: async (settings) => { if (isApiConfigured()) await putSetting('print_settings', settings); },
  upsertBusinessRules: async (rules) => { if (isApiConfigured()) await putSetting('business_rules', rules); },
  upsertMenuCatalogs: async (menus) => { if (isApiConfigured()) await putSetting('menu_catalogs', menus); },
  upsertTerminals: async (terminals) => { if (isApiConfigured()) await putSetting('terminals', terminals); },
  subscribeToChanges: (onOrdersChange, onSessionsChange, onShiftsChange, onStatusChange) => {
    if (!isApiConfigured() || !getToken()) return () => {};
    let stopped = false;
    let source: EventSource | null = null;
    let reconnectTimer: number | undefined;
    const connect = async () => {
      onStatusChange?.('CONNECTING');
      try {
        const { ticket } = await request<{ ticket: string }>('/api/events/token', { method: 'POST' });
        if (stopped) return;
        source = new EventSource(`${endpoint('/api/events')}?ticket=${encodeURIComponent(ticket)}`);
        source.addEventListener('ready', () => onStatusChange?.('SUBSCRIBED'));
        source.onmessage = (message) => {
          const event = JSON.parse(message.data);
          if (event.entity === 'orders') onOrdersChange(event);
          if (event.entity === 'store_sessions') onSessionsChange(event);
          if (event.entity === 'shifts') onShiftsChange(event);
        };
        source.onerror = () => {
          source?.close();
          onStatusChange?.('CHANNEL_ERROR');
          if (!stopped) reconnectTimer = window.setTimeout(() => { void connect(); }, 2_000);
        };
      } catch {
        onStatusChange?.('CHANNEL_ERROR');
        if (!stopped) reconnectTimer = window.setTimeout(() => { void connect(); }, 2_000);
      }
    };
    void connect();
    return () => { stopped = true; source?.close(); if (reconnectTimer) window.clearTimeout(reconnectTimer); };
  },
  fetchReports: async (startDate, endDate) => {
    if (!isApiConfigured()) return { shifts: [], orders: [] };
    const parameters = new URLSearchParams(); if (startDate) parameters.set('startDate', startDate); if (endDate) parameters.set('endDate', endDate);
    return request(`/api/reports${parameters.size ? `?${parameters}` : ''}`);
  },
  signIn: async () => ({ user: null, error: new Error('Login por e-mail não é suportado.') }),
  signOut: async () => { clearToken(); },
  authenticateUserByPin: async (userId, pin) => {
    if (!isApiConfigured()) return MOCK_USERS.find((user) => user.id === userId && user.pin === pin) ?? null;
    try { const result = await request<{ user: User; token: string }>('/api/auth/pin', { method: 'POST', body: JSON.stringify({ userId, pin }) }, false); setToken(result.token); return result.user; } catch { return null; }
  },
  resetDatabase: async (options = { keepCatalog: true }) => { if (isApiConfigured()) await request('/api/admin/reset', { method: 'POST', body: JSON.stringify(options) }); },
  forceCompleteAllOrders: async () => { if (isApiConfigured()) await request('/api/admin/force-complete-orders', { method: 'POST' }); },
};
