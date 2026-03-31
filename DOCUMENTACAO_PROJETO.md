# 🍔 Lanchonete Escoteiros POS Suite v2 - Documentação do Projeto

## 📋 Visão Geral
O **Lanchonete Escoteiros POS Suite** é uma solução completa para gestão de fast-food e restaurantes, desenvolvida com tecnologias modernas de frontend para garantir alta performance, responsividade e experiência de usuário fluida. O sistema opera em uma arquitetura híbrida, funcionando localmente (estado em memória/storage) ou integrado ao **Supabase** para persistência e recursos em tempo real.



### 🛠️ Stack Tecnológico
- **Frontend:** React, Vite, TypeScript
- **Estilização:** Tailwind CSS, Lucide React (Ícones)
- **Gerenciamento de Estado:** Zustand (Global Store)
- **Backend / Persistência:** Supabase (PostgreSQL + Realtime) ou Local Fallback
- **Arquitetura:** SPA (Single Page Application) modularizada por "Apps" (POS, KDS, Admin, Kiosk).

---

## 🚀 Módulos e Funcionalidades

### 1. 🖥️ POS (Ponto de Venda)
Interface destinada aos operadores de caixa para lançamento de pedidos e gestão de turnos.

*   **Gestão de Turno (Caixa):**
    *   Abertura de caixa com fundo inicial.
    *   Registro de movimentações: **Suprimento** (Entrada), **Sangria** (Saída) e **Reembolsos**.
    *   Fechamento de caixa com relatório resumido.
*   **Tomada de Pedidos:**
    *   Seleção visual de produtos por categorias.
    *   Personalização de itens (Modificadores/Adicionais).
    *   Carrinho de compras com cálculo automático de totais.
*   **Pagamento:**
    *   Múltiplos métodos: Dinheiro, Crédito, Débito, PIX, Voucher.
    *   Integração com Motor de Promoções para aplicação automática de descontos.

### 2. 🍳 KDS (Kitchen Display System)
Sistema de gerenciamento de pedidos para a cozinha, substituindo as impressoras de produção.

*   **Fluxo de Status:**
    *   `PENDING` (Pendente) -> `PREPARING` (Em Preparo) -> `READY` (Pronto) -> `DELIVERED` (Entregue).
*   **Filtros por Estação:**
    *   Visualização segmentada: Grill, Fritadeira (Fryer), Bebidas, Montagem.
*   **Controle de Tempo:**
    *   Indicadores visuais de atraso (Alertas de tempo excedido).
*   **Histórico:**
    *   Visualização de pedidos concluídos recentemente.

### 3. 📱 Kiosk (Autoatendimento)
Interface simplificada para uso direto pelo cliente final.

*   **Navegação Visual:** Cardápio focado em imagens e categorias intuitivas.
*   **Fluxo Guiado:** Seleção -> Personalização -> Revisão -> Pagamento Simulada.
*   **Identificação:** Opção para inserir nome do cliente para chamada no painel.

### 4. 📺 TV (Painel de Chamada)
Display para clientes visualizarem o status dos pedidos.

*   **Separação de Status:** Colunas distintas para "Em Preparo" e "Pronto".
*   **Atualização em Tempo Real:** Sincronizado com o KDS via Supabase Realtime ou Store Global.

### 5. ⚙️ Admin Backoffice
Painel administrativo para gestão completa do negócio.

#### 📊 Dashboard
*   **KPIs em Tempo Real:** Vendas Líquidas, Ticket Médio, Total de Pedidos, Margem Estimada.
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
    *   Entrada (Compra), Ajuste (Inventário) e Perda (Quebra/Vencimento).
    *   Histórico de logs de movimentação.
*   **Ficha Técnica:** Associação de ingredientes a produtos para baixa automática na venda.

#### 🏷️ Produtos (`ProductManager`)
*   **CRUD Completo:** Criação, edição e exclusão de produtos.
*   **Configuração:** Definição de preço, categoria, estação de preparo (KDS) e imagem.
*   **Modificadores:** (Estrutura pronta para grupos de adicionais).

#### ⚡ Promoções (`PromotionManager`)
*   **Motor de Regras:** Criação de promoções complexas.
    *   *Tipos:* Preço Fixo (Combo), Desconto Percentual, Leve X Pague Y (BOGO).
    *   *Regras:* Validade por dia da semana, horário, canais de venda e categorias específicas.

#### 🛍️ Pedidos (`OrderManager`)
*   **Listagem Geral:** Visão de todos os pedidos do sistema.
*   **Filtros:** Busca por número/nome e filtro por status (Pendente, Pago, Cancelado, etc.).

#### 👥 Usuários (`UserManager`)
*   **Controle de Acesso (RBAC):**
    *   **ADMIN:** Acesso total.
    *   **MANAGER:** Relatórios e Gestão.
    *   **CASHIER:** Apenas POS.
    *   **KITCHEN:** Apenas KDS.
*   **Segurança:** Autenticação simplificada via PIN de 4 dígitos.

#### ⚙️ Configurações (`SettingsView`)
*   **Fiscal:** Configuração de alíquotas de imposto (ICMS/IVA) e isenções.
*   **Despesas:** Lançamento de despesas administrativas e anexação de comprovantes.

---

## 🔄 Fluxos Principais da Aplicação

### 1. Fluxo de Venda (Order Flow)
1.  **Criação:** Pedido é criado no **POS** ou **Kiosk**.
2.  **Processamento:**
    *   Itens são validados.
    *   Motor de Promoções recalcula o total se houver regras aplicáveis.
    *   Baixa de estoque é calculada (baseada na ficha técnica).
3.  **Pagamento:** Status muda para `PAID`.
4.  **Produção:**
    *   Pedido aparece no **KDS**.
    *   Cozinha altera status para `PREPARING` -> `READY`.
5.  **Entrega:**
    *   Cliente visualiza na **TV**.
    *   Pedido é marcado como `DELIVERED` e sai da fila ativa.

### 2. Fluxo de Estoque (Inventory Flow)
1.  **Cadastro:** Ingrediente "Carne" cadastrado (ex: 100un).
2.  **Vínculo:** Produto "Hambúrguer" consome 1un de "Carne".
3.  **Venda:** Ao vender 1 Hambúrguer, o sistema gera um log de `SALE` e reduz o estoque de "Carne" para 99un.
4.  **Reposição:** Gerente lança `RECEIVE` (+50un) no Admin -> Estoque vai a 149un.

### 3. Fluxo Financeiro e de Caixa (Shift Flow)
1.  **Abertura:** Operador abre o caixa informando fundo inicial (ex: R$ 100,00).
2.  **Operação:** Vendas em dinheiro somam ao saldo esperado.
3.  **Movimentações:**
    *   Precisa comprar gelo? Lança **Sangria** (Retirada).
    *   Precisa de troco? Lança **Suprimento** (Entrada).
4.  **Fechamento:** Operador encerra o turno.
5.  **Conferência:** Gerente acessa **Relatórios** no Admin para ver o balanço final e auditar as movimentações.

---

## 📂 Estrutura de Pastas Importantes

```bash
src/
├── apps/                 # Pontos de entrada das aplicações (Telas principais)
│   ├── Admin.tsx         # Backoffice
│   ├── POS.tsx           # Frente de Caixa
│   ├── KDS.tsx           # Cozinha
│   ├── Kiosk.tsx         # Autoatendimento
│   └── TV.tsx            # Painel de Clientes
├── components/           # Componentes UI reutilizáveis
│   ├── admin/            # Componentes específicos do Admin (Gerenciadores)
│   ├── pos/              # Componentes do POS (Carrinho, Grid de Produtos)
│   ├── kds/              # Cards de Pedidos
│   └── ui.tsx            # Biblioteca de componentes base (Botões, Cards, Inputs)
├── services/
│   ├── backend/          # Lógica de conexão (Supabase/Local)
│   └── promotionEngine.ts # Lógica de cálculo de descontos
├── store.ts              # Gerenciamento de Estado Global (Zustand)
└── types.ts              # Definições de Tipos TypeScript (Interfaces centrais)
```

## 📝 Notas de Desenvolvimento
*   **Race Conditions:** O sistema implementa tratativas para evitar condições de corrida em atualizações de estado assíncronas (ex: salvamento de usuários).
*   **Type Safety:** Uso extensivo de TypeScript para garantir a integridade dos dados entre Backend e Frontend, especialmente no parsing de campos JSON (`items`, `transactions`).
*   **Extensibilidade:** O padrão `BackendInterface` permite trocar a implementação do backend (ex: migrar para Firebase ou API REST própria) sem refatorar os componentes de UI.
