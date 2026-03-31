// Constantes de mensagens do sistema
// Centraliza todas as mensagens de erro, sucesso e informação

export const ERROR_MESSAGES = {
  // Autenticação
  INVALID_PIN: 'PIN Incorreto',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  AUTH_REQUIRED: 'Autenticação necessária',

  // Validações POS
  SHIFT_REQUIRED: 'Abra um turno de caixa antes de realizar vendas!',
  SHIFT_ALREADY_OPEN: 'Já existe um turno aberto',
  EMPTY_CART: 'Carrinho vazio',
  MAX_ITEMS_REACHED: 'Limite de itens por pedido atingido',

  // Estoque
  OUT_OF_STOCK: 'Produto sem estoque',
  INSUFFICIENT_STOCK: 'Estoque insuficiente',

  // Pagamento
  PAYMENT_FAILED: 'Falha no pagamento',
  INVALID_AMOUNT: 'Valor inválido',
  PAYMENT_METHOD_REQUIRED: 'Selecione um método de pagamento',

  // KDS
  NO_ORDERS: 'Nenhum pedido disponível',
  ORDER_NOT_FOUND: 'Pedido não encontrado',

  // Admin
  MISSING_FIELDS: 'Preencha todos os campos obrigatórios',
  OPERATION_FAILED: 'Operação falhou',

  // Sessão
  SESSION_CLOSED: 'A loja está fechada',
  CANNOT_CLOSE_SESSION: 'Não é possível fechar a sessão com turnos abertos',
};

export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Pedido criado com sucesso!',
  PAYMENT_SUCCESS: 'Pagamento realizado com sucesso!',
  SHIFT_OPENED: 'Turno aberto com sucesso',
  SHIFT_CLOSED: 'Turno fechado com sucesso',
  SESSION_OPENED: 'Expediente iniciado',
  SESSION_CLOSED: 'Expediente encerrado',
  SAVED: 'Salvo com sucesso',
  DELETED: 'Excluído com sucesso',
};

export const INFO_MESSAGES = {
  LOADING: 'Carregando...',
  PROCESSING: 'Processando...',
  CONNECTING: 'Conectando ao servidor...',
  SYNCING: 'Sincronizando dados...',
};
