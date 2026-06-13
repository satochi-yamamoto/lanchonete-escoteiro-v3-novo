# 🍔 Lanchonete Escoteiros POS Suite v3 - Documentação do Projeto

## 📋 Visão Geral
O **Lanchonete Escoteiros POS Suite** é uma solução completa para gestão da lanchonete do **Grupo Escoteiro Cooper Cotia**, desenvolvida com tecnologias modernas de frontend para garantir alta performance, responsividade e experiência de usuário fluida. O sistema opera em uma arquitetura híbrida, funcionando localmente (estado em memória/storage) ou integrado ao **Supabase** para persistência e recursos em tempo real.

O sistema foi pensado para apoiar atividades, eventos e ações escoteiras, organizando pedidos, caixa, estoque, produção e prestação de contas. As vendas registradas não visam lucratividade; seu objetivo é permitir uma operação transparente, controlada e sustentável para as atividades do grupo.


### 🛠️ Stack Tecnológico
- **Frontend:** React 19.2, Vite 6.2, TypeScript 5.8
- **Estilização:** Tailwind CSS, Lucide React 0.562 (Ícones)
- **Gerenciamento de Estado:** Zustand 5.0 (Global Store)
- **Backend / Persistência:** Supabase JS 2.99 (PostgreSQL + Realtime) ou Local Fallback
- **Testes:** Vitest 4.0, Testing Library (React 16.3, jest-dom 6.9)
- **Deploy:** Vercel
- **Arquitetura:** SPA (Single Page Application) modularizada por "Apps" (POS, Admin, KDS, Kiosk, TV).

---

## 🚀 Módulos e Funcionalidades

### 1. 🖥️ POS (Ponto de Venda)
Interface destinada aos operadores de caixa para lançamento de pedidos e gestão de turnos. Acesso: ADMIN, MANAGER, CASHIER.

*   **Gestão de Turno (Caixa):**
    *   Abertura de caixa com fundo inicial e **planejamento operacional** (custo de produtos, quantidade planejada de hambúrgueres normais/veganos, custo unitário, nome do cardápio do dia).
    *   Registro de movimentações: **Suprimento** (ADD), **Sangria** (DROP) e **Reembolsos** (REIMBURSEMENT).
    *   Fechamento de caixa com métricas: consumo de bebidas (litros), custo de hambúrgueres, produção, sobras, nome do responsável e feedback.
    *   Relatório Z Térmico para impressão em bobinas.
*   **Tomada de Pedidos:**
    *   Seleção visual de produtos por categorias.
    *   Personalização de itens (Modificadores/Adicionais).
    *   Carrinho de compras com cálculo automático de totais e promoções.
*   **Pagamento:**
    *   Métodos ativos: **PIX** e **Dinheiro (CASH)**.
    *   Integração com Motor de Promoções para aplicação automática de descontos.
    *   Configuração de métodos persistida em localStorage.

### 2. 🍳 KDS (Kitchen Display System)
Sistema de gerenciamento de pedidos para a cozinha (módulo standalone).

*   **KDS Completo (3 colunas):**
    *   `PAID` (Pendente) → `PREPARING` (Em Preparo) → `READY` (Pronto).
*   **KDS Simplificado (Mobile-First):**
    *   Itens individuais como cards grandes para toque rápido em tablets.
*   **Controle de Tempo:**
    *   Indicadores visuais de atraso (Alertas de tempo excedido).
    *   Tempo de preparo customizado por item.
*   **Entrega Parcial:**
    *   Status `PARTIAL` para entrega parcial de itens.

### 3. 📱 Kiosk (Autoatendimento)
Interface simplificada para uso direto pelo cliente final (módulo standalone).

*   **Navegação Visual:** Cardápio focado em imagens e categorias intuitivas.
*   **Fluxo Guiado:** Seleção → Personalização → Revisão → Pagamento.
*   **Identificação:** Opção para inserir nome do cliente para chamada no painel.

### 4. 📺 TV (Painel de Chamada)
Display para clientes visualizarem o status dos pedidos (módulo standalone).

*   **Separação de Status:** Colunas distintas para "Em Preparo" e "Pronto".
*   **Atualização em Tempo Real:** Sincronizado com o KDS via Supabase Realtime ou Store Global.

### 5. ⚙️ Admin Backoffice
Painel administrativo para gestão completa do negócio. Acesso: ADMIN.

#### 📊 Dashboard
*   **KPIs em Tempo Real:** Vendas Líquidas, Ticket Médio, Total de Pedidos e acompanhamento financeiro operacional.
*   **Gráficos e Listas:** Produtos mais vendidos e últimas transações.

#### 📝 Relatórios (`ReportsManager`)
*   **Fechamento de Caixa:** Histórico detalhado de todos os turnos.
*   **Detalhamento Financeiro:**
    *   Total vendido por método de pagamento.
    *   Discriminação de **Sangrias**, **Suprimentos** e **Devoluções**.
    *   Contagem de itens vendidos.
*   **Auditoria:** Registro de quem abriu/fechou o caixa e horários (Início/Fim).

#### 📦 Estoque & Ingredientes (`InventoryManager`)
*   **Gestão de Ingredientes:** Cadastro com custo unitário e fornecedor.
*   **Movimentações:**
    *   Entrada (RECEIVE), Ajuste (ADJUST) e Perda (WASTE).
    *   Histórico de logs de movimentação.
*   **Ficha Técnica (BOM):** Associação de ingredientes a produtos para baixa automática na venda.

#### 🏷️ Produtos (`ProductManager`)
*   **CRUD Completo:** Criação, edição e exclusão de produtos.
*   **Configuração:** Definição de preço, categoria, estação de preparo (GRILL, FRYER, DRINKS, ASSEMBLY) e imagem.
*   **Disponibilidade:** Toggle de ativo/inativo para controle em tempo real.
*   **Modificadores:** Grupos de modificadores com min/max de seleções.

#### ⚡ Promoções (`PromotionManager`)
*   **Motor de Regras:** Criação de promoções complexas.
    *   *Tipos:* `FIXED_PRICE_BUNDLE` (Combo), `PERCENTAGE_OFF` (Desconto Percentual), `BOGO` (Leve X Pague Y).
    *   *Regras:* Validade por dia da semana, horário, canais de venda (POS, KIOSK, DELIVERY) e categorias.
    *   *Prioridade:* Descontos aplicados em ordem de prioridade configurável.
    *   *Status:* Toggle ativo/inativo sem exclusão.

#### 🛍️ Pedidos (`OrderManager`)
*   **Listagem Geral:** Visão de todos os pedidos do sistema.
*   **Filtros:** Busca por número/nome e filtro por status.
*   **Ações Admin:** `forceCompleteAllOrders()` e `resetDatabase()`.

#### 👥 Usuários (`UserManager`)
*   **Controle de Acesso (RBAC):**
    *   **ADMIN:** Acesso total (POS + Admin).
    *   **MANAGER:** POS + relatórios.
    *   **CASHIER:** Apenas POS.
    *   **KITCHEN:** Apenas KDS.
*   **Segurança:** Autenticação via PIN de 4 dígitos. PINs nunca expostos na lista de login.
*   **Sistema Dual:** Lista de login (`users`) separada da gestão completa (`dbUsers`).

#### 🏕️ Escoteiros (`ScoutManager`)
*   **Cadastro:** Nome, ramo (branch) e patrulha (patrol).
*   **Importação em Lote:** Upload de lista completa de escoteiros.
*   **Vinculação:** Associação a operações e eventos.

#### 📋 Cardápios (`MenuCatalog`)
*   **Gestão:** Cardápios nomeados com observações.
*   **Toggle:** Ativo/inativo para operação baseada em eventos.

#### 🖥️ Terminais (`TerminalConfig`)
*   **Configuração:** Terminais nomeados com data de operação.
*   **Toggle:** Ativo/inativo.

#### 🏪 Sessão da Loja (`StoreControl`)
*   **Business Day:** Abertura/fechamento de expediente com rastreamento de usuário.
*   **Validação:** Não permite fechar com turnos abertos.
*   **Sincronização:** Status sincronizado em tempo real entre terminais.

---

## 🔄 Fluxos Principais da Aplicação

### 1. Fluxo de Venda (Order Flow)
1.  **Criação:** Pedido é criado no **POS** ou **Kiosk**.
2.  **Processamento:**
    *   Itens são validados.
    *   Motor de Promoções recalcula o total se houver regras aplicáveis.
    *   Baixa de estoque é calculada (baseada na ficha técnica/BOM).
3.  **Pagamento:** Status muda para `PAID`.
4.  **Produção:**
    *   Pedido aparece no **KDS**.
    *   Cozinha altera status para `PREPARING` → `READY`.
5.  **Entrega:**
    *   Cliente visualiza na **TV**.
    *   Pedido é marcado como `DELIVERED` e sai da fila ativa.

### 2. Fluxo de Estoque (Inventory Flow)
1.  **Cadastro:** Ingrediente "Carne" cadastrado (ex: 100un).
2.  **Vínculo:** Produto "Hambúrguer" consome 1un de "Carne" via recipe (BOM).
3.  **Venda:** Ao vender 1 Hambúrguer, o sistema gera um log de `SALE` e reduz o estoque.
4.  **Reposição:** Gerente lança `RECEIVE` no Admin para repor estoque.

### 3. Fluxo Financeiro e de Caixa (Shift Flow)
1.  **Abertura:** Operador abre o caixa informando fundo inicial e dados de planejamento operacional.
2.  **Operação:** Vendas em dinheiro somam ao saldo esperado.
3.  **Movimentações:**
    *   **DROP (Sangria):** Retirada de dinheiro do caixa.
    *   **ADD (Suprimento):** Entrada de dinheiro no caixa.
    *   **REIMBURSEMENT:** Reembolsos com nome do beneficiário e comprovante.
4.  **Fechamento:** Operador encerra o turno com métricas de produção.
5.  **Conferência:** Gerente acessa **Relatórios** no Admin para ver o balanço final e auditar as movimentações.

---

## 📂 Estrutura de Pastas

```bash
src/
├── apps/                 # Pontos de entrada das aplicações (Telas principais)
│   ├── Admin.tsx         # Backoffice (~52KB)
│   ├── POS.tsx           # Frente de Caixa (~36KB)
│   ├── KDS.tsx           # Cozinha (completo)
│   ├── KDSSimplified.tsx # Cozinha (mobile)
│   ├── Kiosk.tsx         # Autoatendimento
│   └── TV.tsx            # Painel de Clientes
├── components/           # Componentes UI reutilizáveis
│   ├── admin/            # AdminComponents.tsx (~131KB), StoreControl, ScoutManager, OrderManager
│   ├── pos/              # PosComponents.tsx (~95KB)
│   ├── kds/              # Cards de Pedidos KDS
│   ├── kiosk/            # Componentes Kiosk
│   ├── LoginScreen.tsx   # Tela de autenticação por PIN
│   └── ui.tsx            # Biblioteca de componentes base (Botões, Cards, Inputs, Modal)
├── services/
│   ├── backend/          # Abstração backend (backend.ts ~27KB, supabaseClient.ts)
│   ├── promotionEngine.ts # Lógica de cálculo de descontos
│   ├── mockData.ts       # Dados mock para modo offline
│   └── seedTestData.ts   # Dados de seed para testes
├── constants/
│   └── messages.ts       # Mensagens centralizadas (erros, sucesso, info)
├── store.ts              # Gerenciamento de Estado Global Zustand (~35KB)
├── types.ts              # Definições de Tipos TypeScript (Interfaces centrais)
└── utils.ts              # Utilitários

supabase/
├── schema.clean.sql      # Schema principal (tabelas)
├── schema.rls.sql        # Políticas de Row Level Security
├── schema.realtime.sql   # Configuração de publicação Realtime
├── migrations/           # Migrações incrementais
└── backups/              # Backups do banco
```

## 📝 Notas de Desenvolvimento
*   **Race Conditions:** O sistema implementa tratativas para evitar condições de corrida em atualizações de estado assíncronas (ex: salvamento de usuários).
*   **Type Safety:** Uso extensivo de TypeScript para garantir a integridade dos dados entre Backend e Frontend, especialmente no parsing de campos JSON (`items`, `transactions`).
*   **Extensibilidade:** O padrão `BackendInterface` permite trocar a implementação do backend (ex: migrar para Firebase ou API REST própria) sem refatorar os componentes de UI.
*   **Modo Offline:** Se variáveis de ambiente do Supabase não estiverem configuradas, o sistema opera em modo mock com dados em memória.
*   **Path Alias:** Use `@/` para referenciar o diretório `src/`.
