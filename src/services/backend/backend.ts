import { Ingredient, Order, Product, Promotion, Shift, StockLog, StoreSession, TaxSettings, User, Scout, PaymentMethod, MenuCatalog, TerminalConfig } from '../../types';
import { MOCK_INGREDIENTS, MOCK_PRODUCTS, MOCK_USERS, MOCK_SCOUTS } from '../mockData';
import { MOCK_PROMOTIONS } from '../promotionEngine';

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
const putResource = <T>(table: string, value: { id: string }) => request<T>(`/api/resources/${table}/${encodeURIComponent(value.id)}`, { method: 'PUT', body: JSON.stringify(value) });
const deleteResource = (table: string, id: string) => request<void>(`/api/resources/${table}/${encodeURIComponent(id)}`, { method: 'DELETE' });
const putSetting = (id: string, value: unknown) => request<void>(`/api/settings/${id}`, { method: 'PUT', body: JSON.stringify(value) });

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
    if (!isApiConfigured()) return localState();
    if (!getToken()) {
      const users = await request<User[]>('/api/login-users', {}, false);
      return { ...localState(), products: [], ingredients: [], promotions: [], scouts: [], users };
    }
    return request<BackendInitialState>('/api/initial-state');
  },
  fetchScouts: async () => isApiConfigured() ? request<Scout[]>('/api/scouts') : MOCK_SCOUTS,
  fetchOrders: async () => isApiConfigured() ? request<Order[]>('/api/orders') : [],
  upsertProduct: async (product) => { if (isApiConfigured()) await putResource('products', product); },
  deleteProduct: async (id) => { if (isApiConfigured()) await deleteResource('products', id); },
  upsertIngredient: async (ingredient) => { if (isApiConfigured()) await putResource('ingredients', ingredient); },
  insertStockLog: async (log) => { if (isApiConfigured()) await request('/api/stock-logs', { method: 'POST', body: JSON.stringify(log) }); },
  upsertPromotion: async (promotion) => { if (isApiConfigured()) await putResource('promotions', promotion); },
  deletePromotion: async (id) => { if (isApiConfigured()) await deleteResource('promotions', id); },
  upsertUser: async (user) => { if (isApiConfigured()) await request(`/api/users/${encodeURIComponent(user.id)}`, { method: 'PUT', body: JSON.stringify(user) }); },
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
