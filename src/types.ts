
export enum OrderStatus {
  PENDING = 'PENDING',       // Created, not paid
  PAID = 'PAID',             // Paid, waiting for kitchen (Received)
  PREPARING = 'PREPARING',   // In kitchen
  READY = 'READY',           // Ready for pickup
  PARTIAL = 'PARTIAL',       // Partially delivered (some items given to customer)
  DELIVERED = 'DELIVERED',   // Customer picked up
  CANCELLED = 'CANCELLED'
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKE_OUT = 'TAKE_OUT',
  DELIVERY = 'DELIVERY',
  KIOSK = 'KIOSK'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD', // Integrated or External Terminal
  DEBIT_CARD = 'DEBIT_CARD',
  VOUCHER = 'VOUCHER',
  ONLINE = 'ONLINE',
  PIX = 'PIX'
}

export type Station = 'GRILL' | 'FRYER' | 'DRINKS' | 'ASSEMBLY';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  station: Station; // Default station for this item
  image?: string;
  description?: string;
  is_available: boolean;
  modifiers?: ModifierGroup[]; // Available modifiers
  recipe?: RecipeItem[]; // BOM
}

export interface RecipeItem {
    ingredient_id: string;
    quantity: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  options: { name: string; price: number }[];
}

export interface CartItem extends Product {
  cartId: string; // Unique ID for this instance in cart
  selectedModifiers: string[]; // List of modifier names
  note?: string;
  completed?: boolean; // For KDS item bumping
  estimatedPrepTime?: number; // Custom prep time in minutes set by KDS operator
}

export interface Order {
  id: string;
  order_number: string;
  created_at: string;
  
  // KDS Timestamps
  paid_at?: string;      // When it hit the KDS
  started_at?: string;   // When prep started
  ready_at?: string;     // When bumped to ready
  delivered_at?: string; // When handed to customer

  status: OrderStatus;
  type: OrderType;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  customer_name?: string;
  payment_method?: PaymentMethod;
  shift_id?: string;
  session_id?: string; // Links to StoreSession
  terminal_id?: string; // ID of the POS station
}

// Shift Management
export interface Shift {
  id: string;
  staff_name: string;
  terminal_id: string; // ID of the POS station
  session_id?: string; // Links to StoreSession
  opened_at: string;
  closed_at?: string;
  start_cash: number;
  current_cash: number; // Theoretical cash
  status: 'OPEN' | 'CLOSED';
  transactions: ShiftTransaction[];
  // End of shift metrics
  drinks_liters?: number;
  burger_cost?: number;
  burgers_produced?: number;
  burgers_unsold?: number;
  menu_name?: string; // Cardápio do Lanche
  closer_name?: string; // Nome completo da pessoa que preenche
  feedback?: string;
}

export interface ShiftTransaction {
  id: string;
  time: string;
  type: 'OPENING' | 'SALE' | 'DROP' | 'ADD' | 'CLOSING' | 'REIMBURSEMENT';
  amount: number;
  reason?: string;
  user_id: string;
  payee?: string; // Name of person reimbursed
  attachment?: string; // URL or base64 of the invoice/receipt
}

export interface ShiftTransactionExtras {
    payee?: string;
    attachment?: string;
}

// Promotion Engine Types
export enum PromotionType {
  BOGO = 'BOGO', // Buy X Get Y
  FIXED_PRICE_BUNDLE = 'FIXED_PRICE_BUNDLE', // 2 items for $15
  PERCENTAGE_OFF = 'PERCENTAGE_OFF'
}

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  rules: {
    category_id?: string;
    product_id?: string;
    min_quantity: number;
    active?: boolean; // Controla se a promoção está ativa (padrão true se undefined)
  };
  value: number; // e.g., 15 (price) or 0.10 (10% off)
  priority: number;
  // Validity rules
  valid_from?: string;
  valid_until?: string;
  valid_days?: number[]; // 0=Sun, 6=Sat
  valid_hours_start?: string; // "14:00"
  valid_hours_end?: string; // "17:00"
  channels?: ('POS' | 'KIOSK' | 'DELIVERY')[];
}

// --- Inventory & Admin Types ---

export interface Ingredient {
    id: string;
    name: string;
    unit: string; // kg, liter, units
    cost_per_unit: number;
    current_stock: number;
    min_stock: number;
    supplier: string;
}

export interface StockLog {
    id: string;
    date: string;
    ingredient_id: string;
    change: number;
    type: 'RECEIVE' | 'ADJUST' | 'SALE' | 'WASTE';
    notes?: string;
}

export interface User {
    id: string;
    name: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
    pin: string; // Simplified auth
}

export interface Scout {
    id: string;
    name: string;
    branch: string; // Ramo de atividade
    patrol: string; // Patrulha/Matilha
}

// --- Settings Types ---

export interface TaxSettings {
    isEnabled: boolean;
    taxName: string; // e.g., "ICMS", "IVA"
    defaultRate: number; // e.g., 18.0 (%)
    taxId: string; // CNPJ / VAT ID
    exemptCategories: string[]; // List of categories exempt from tax
}

// --- Store Session (Business Day) ---
export interface StoreSession {
    id: string;
    opened_at: string;
    closed_at?: string;
    status: 'OPEN' | 'CLOSED';
    opened_by: string;
    closed_by?: string;
    notes?: string;
}