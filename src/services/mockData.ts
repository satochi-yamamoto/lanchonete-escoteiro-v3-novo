import { Ingredient, Product, User, Scout } from '../types';

export const MOCK_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Pão de Hambúrguer', unit: 'un', cost_per_unit: 0.5, current_stock: 100, min_stock: 20, supplier: 'Padaria Central' },
  { id: 'i2', name: 'Carne (Crua)', unit: 'un', cost_per_unit: 1.2, current_stock: 80, min_stock: 30, supplier: 'Casa de Carnes' },
  { id: 'i3', name: 'Fatia de Cheddar', unit: 'un', cost_per_unit: 0.2, current_stock: 200, min_stock: 50, supplier: 'Laticínios Bom' },
  { id: 'i4', name: 'Batata (Congelada)', unit: 'kg', cost_per_unit: 2.0, current_stock: 50, min_stock: 10, supplier: 'Fazenda Inc' },
  { id: 'i5', name: 'Xarope de Cola', unit: 'L', cost_per_unit: 5.0, current_stock: 10, min_stock: 2, supplier: 'Bebidas Co' }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'X-Clássico',
    price: 25.0,
    category: 'Lanches',
    station: 'GRILL',
    is_available: true,
    image: 'https://picsum.photos/200/200?random=1',
    modifiers: [{ id: 'm1', name: 'Adicionais', min: 0, max: 2, options: [{ name: 'Bacon', price: 4 }, { name: 'Queijo Extra', price: 3 }] }],
    recipe: [
      { ingredient_id: 'i1', quantity: 1 },
      { ingredient_id: 'i2', quantity: 1 }
    ]
  },
  {
    id: 'p2',
    name: 'X-Cheddar Duplo',
    price: 32.0,
    category: 'Lanches',
    station: 'GRILL',
    is_available: true,
    image: 'https://picsum.photos/200/200?random=2',
    recipe: [
      { ingredient_id: 'i1', quantity: 1 },
      { ingredient_id: 'i2', quantity: 1 },
      { ingredient_id: 'i3', quantity: 2 }
    ]
  },
  { id: 'p3', name: 'Frango Crocante', price: 28.0, category: 'Lanches', station: 'FRYER', is_available: true, image: 'https://picsum.photos/200/200?random=3' },
  {
    id: 'p4',
    name: 'Batata Frita',
    price: 12.0,
    category: 'Acomp.',
    station: 'FRYER',
    is_available: true,
    image: 'https://picsum.photos/200/200?random=4',
    recipe: [{ ingredient_id: 'i4', quantity: 0.2 }]
  },
  { id: 'p5', name: 'Refrigerante 500ml', price: 8.0, category: 'Bebidas', station: 'DRINKS', is_available: true, image: 'https://picsum.photos/200/200?random=5' }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin', role: 'ADMIN', pin: '0000' },
  { id: 'u2', name: 'Gerente João', role: 'MANAGER', pin: '0000' },
  { id: 'u3', name: 'Caixa 01', role: 'CASHIER', pin: '0000' },
  { id: 'u4', name: 'Cozinha', role: 'KITCHEN', pin: '0000' }
];

export const MOCK_SCOUTS: Scout[] = [
  { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Pedro Henrique', branch: 'Escoteiro', patrol: 'Lobo' },
  { id: '550e8400-e29b-41d4-a716-446655440012', name: 'Ana Clara', branch: 'Sênior', patrol: 'Everest' },
  { id: '550e8400-e29b-41d4-a716-446655440013', name: 'Lucas Gabriel', branch: 'Lobinho', patrol: 'Vermelha' }
];

// Deixando o array de promoções vazio para evitar qualquer inserção acidental de mock data no banco de dados.
export const MOCK_PROMOTIONS: any[] = [];
