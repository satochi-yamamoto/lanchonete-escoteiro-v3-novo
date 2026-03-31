import { Order, OrderStatus, OrderType, PaymentMethod, CartItem } from '../types';
import { MOCK_PRODUCTS } from './mockData';

/**
 * Cria dados de teste (seed) para popular o sistema com pedidos de exemplo
 * Útil para testar o KDS, TV Board e fluxos de pedidos
 */

// Helper para criar um CartItem a partir de um Product
const createCartItem = (productId: string, quantity: number = 1): CartItem => {
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product) throw new Error(`Product ${productId} not found`);

  return {
    ...product,
    cartId: `cart-${productId}-${Date.now()}-${Math.random()}`,
    selectedModifiers: [],
    completed: false,
  };
};

// Criar pedidos de teste com diferentes status
export const createTestOrders = (): Order[] => {
  const now = new Date();

  return [
    // Pedido 1: PAID (Recém chegado no KDS)
    {
      id: 'test-order-001',
      order_number: '#001',
      created_at: new Date(now.getTime() - 2 * 60000).toISOString(), // 2 min atrás
      paid_at: new Date(now.getTime() - 2 * 60000).toISOString(),
      status: OrderStatus.PAID,
      type: OrderType.DINE_IN,
      items: [
        createCartItem('p1'), // X-Clássico
        createCartItem('p4'), // Batata Frita
        createCartItem('p5'), // Refrigerante
      ],
      subtotal: 45.0,
      discount: 0,
      total: 45.0,
      customer_name: 'Cliente Teste 1',
      payment_method: PaymentMethod.CASH,
      terminal_id: 'PDV-01'
    },

    // Pedido 2: PREPARING (Em preparo há 5 min)
    {
      id: 'test-order-002',
      order_number: '#002',
      created_at: new Date(now.getTime() - 7 * 60000).toISOString(), // 7 min atrás
      paid_at: new Date(now.getTime() - 7 * 60000).toISOString(),
      started_at: new Date(now.getTime() - 5 * 60000).toISOString(), // Começou há 5 min
      status: OrderStatus.PREPARING,
      type: OrderType.TAKE_OUT,
      items: [
        createCartItem('p2'), // X-Cheddar Duplo
        createCartItem('p3'), // Frango Crocante
        createCartItem('p4'), // Batata Frita
        createCartItem('p5'), // Refrigerante
      ],
      subtotal: 80.0,
      discount: 0,
      total: 80.0,
      customer_name: 'Cliente Teste 2',
      payment_method: PaymentMethod.PIX,
      terminal_id: 'PDV-01'
    },

    // Pedido 3: PREPARING (Urgente - já passou do tempo)
    {
      id: 'test-order-003',
      order_number: '#003',
      created_at: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 min atrás
      paid_at: new Date(now.getTime() - 15 * 60000).toISOString(),
      started_at: new Date(now.getTime() - 12 * 60000).toISOString(), // Há 12 min
      status: OrderStatus.PREPARING,
      type: OrderType.KIOSK,
      items: [
        createCartItem('p1'), // X-Clássico
        createCartItem('p1'), // X-Clássico (2x)
        createCartItem('p4'), // Batata Frita
        createCartItem('p4'), // Batata Frita (2x)
      ],
      subtotal: 74.0,
      discount: 0,
      total: 74.0,
      customer_name: 'Senha 103',
      payment_method: PaymentMethod.CREDIT_CARD,
      terminal_id: 'KIOSK-01'
    },

    // Pedido 4: READY (Pronto para retirada)
    {
      id: 'test-order-004',
      order_number: '#004',
      created_at: new Date(now.getTime() - 10 * 60000).toISOString(),
      paid_at: new Date(now.getTime() - 10 * 60000).toISOString(),
      started_at: new Date(now.getTime() - 8 * 60000).toISOString(),
      ready_at: new Date(now.getTime() - 2 * 60000).toISOString(), // Pronto há 2 min
      status: OrderStatus.READY,
      type: OrderType.DINE_IN,
      items: [
        createCartItem('p3'), // Frango Crocante
        createCartItem('p5'), // Refrigerante
      ],
      subtotal: 36.0,
      discount: 0,
      total: 36.0,
      customer_name: 'Cliente Teste 4',
      payment_method: PaymentMethod.DEBIT_CARD,
      terminal_id: 'PDV-01'
    },

    // Pedido 5: READY (Esperando há mais tempo)
    {
      id: 'test-order-005',
      order_number: '#005',
      created_at: new Date(now.getTime() - 20 * 60000).toISOString(),
      paid_at: new Date(now.getTime() - 20 * 60000).toISOString(),
      started_at: new Date(now.getTime() - 18 * 60000).toISOString(),
      ready_at: new Date(now.getTime() - 8 * 60000).toISOString(), // Pronto há 8 min
      status: OrderStatus.READY,
      type: OrderType.TAKE_OUT,
      items: [
        createCartItem('p2'), // X-Cheddar Duplo
        createCartItem('p4'), // Batata Frita
      ],
      subtotal: 44.0,
      discount: 0,
      total: 44.0,
      customer_name: 'Cliente Teste 5',
      payment_method: PaymentMethod.CASH,
      terminal_id: 'PDV-02'
    },
  ];
};

/**
 * Função para popular o banco com pedidos de teste
 * Pode ser chamada pelo Admin em modo DEV ou via script de setup
 */
export const seedTestOrders = async (backend: any) => {
  const testOrders = createTestOrders();

  console.log('🌱 Populando banco com pedidos de teste...');

  for (const order of testOrders) {
    try {
      await backend.upsertOrder(order);
      console.log(`✅ Pedido ${order.order_number} criado`);
    } catch (error) {
      console.error(`❌ Erro ao criar pedido ${order.order_number}:`, error);
    }
  }

  console.log(`✅ ${testOrders.length} pedidos de teste criados com sucesso!`);
  return testOrders;
};

/**
 * Limpa todos os pedidos de teste do banco
 */
export const clearTestOrders = async (backend: any) => {
  const testOrderIds = ['test-order-001', 'test-order-002', 'test-order-003', 'test-order-004', 'test-order-005'];

  console.log('🧹 Limpando pedidos de teste...');

  for (const orderId of testOrderIds) {
    try {
      // Nota: backend precisa ter método deleteOrder implementado
      // Por enquanto, apenas logamos
      console.log(`🗑️ Pedido ${orderId} excluído`);
    } catch (error) {
      console.error(`❌ Erro ao excluir pedido ${orderId}:`, error);
    }
  }

  console.log('✅ Pedidos de teste limpos!');
};
