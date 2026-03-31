# OmniBurger POS Suite v2 - Especificação de Requisitos do Produto (PRD)

**Versão:** 2.0 | **Última atualização:** 2026-03-09

---

## 1. Visão Geral

O **OmniBurger POS Suite v2** é uma plataforma unificada de gestão para restaurantes de serviço rápido (QSR - Quick Service Restaurants), projetada como uma SPA (Single Page Application) modular de alta performance. O sistema integra terminais de ponto de venda, autoatendimento, gestão de cozinha, painel de chamadas e administração completa do negócio, com sincronização em tempo real entre todos os terminais.

### 1.1 Objetivos do Produto
- Eliminar impressoras de cozinha com um KDS digital rastreável.
- Reduzir filas com totem de autoatendimento.
- Fornecer dados gerenciais em tempo real para decisão operacional.
- Suportar múltiplos terminais simultâneos com estado compartilhado via Supabase Realtime.

---

## 2. Arquitetura Técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| UI Framework | React | 19.x |
| Linguagem | TypeScript | ~5.8.x |
| Build Tool | Vite | ^6.x |
| Estilização | TailwindCSS | latest |
| Ícones | Lucide React | ^0.562.x |
| Estado Global | Zustand | ^5.x |
| Backend / Banco de Dados | Supabase (PostgreSQL + Realtime) | ^2.49.x |
| Testes | Vitest + React Testing Library | ^4.x / ^16.x |

### 2.1 Padrões Arquiteturais
- **SPA Modular:** Roteamento interno em `src/App.tsx` alterna entre os módulos (POS, KDS, Kiosk, TV, Admin) sem recarregamento.
- **Abstração de Backend:** `BackendInterface` em `src/services/backend/backend.ts` suporta modo Supabase (produção) e modo Local/Mock (offline/desenvolvimento).
- **Sincronização em Tempo Real:** O store Zustand (`src/store.ts`) gerencia o estado local e se inscreve em eventos Supabase Realtime para `orders` e `sessions`.
- **RBAC:** Controle de acesso baseado em funções implementado em `App.tsx` com os papéis: `ADMIN`, `MANAGER`, `CASHIER`, `KITCHEN`.
- **Motor de Promoções:** Cálculo de descontos por prioridade em `src/services/promotionEngine.ts`, aplicado no carrinho em tempo real.

### 2.2 Configuração de Ambiente
- `.env.local`: Deve conter `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Sem variáveis de ambiente, o sistema opera em **Modo Mock** com dados em memória.

---

## 3. Módulos do Sistema

### 3.1 Terminal PDV (Point of Sale — `src/apps/POS.tsx`)
Interface otimizada para operadores de caixa, focada em velocidade e controle financeiro.

#### 3.1.1 Gestão de Turno (Shift)
- Abertura de caixa com valor inicial e ID de terminal configurável.
- Fechamento de caixa com conferência de valores e geração de Z-Report.
- **Sangria (DROP):** Retirada de dinheiro do caixa com justificativa.
- **Suprimento (ADD):** Reforço de troco com justificativa.
- **Reembolso (REIMBURSEMENT):** Lançamento de despesas administrativas com anexo de comprovante (base64).
- Histórico completo de transações por turno.

#### 3.1.2 Grid de Produtos
- Filtragem por Categoria e por Estação de produção (Grelha, Fritadeira, Bebidas, Montagem).
- **Toggle de Visibilidade:** Oculta/exibe produtos indisponíveis no grid.
- Indicação visual clara para produtos fora de estoque.

#### 3.1.3 Carrinho e Pedido
- Adição de observações personalizadas por item.
- Edição rápida de modificadores e quantidades.
- Cálculo de totais em tempo real com aplicação automática de promoções.
- Limite de itens por pedido configurável nas Configurações.

#### 3.1.4 Pagamentos
| Método | Suporte |
|---|---|
| Dinheiro (CASH) | ✅ com cálculo de troco |
| Cartão de Crédito | ✅ |
| Cartão de Débito | ✅ |
| PIX | ✅ |
| Voucher | ✅ |
| Online | ✅ |

- Métodos habilitados são configuráveis por canal (POS vs. Kiosk) na área Admin.
- Dedução automática de estoque ao confirmar pagamento.
- Modal de confirmação com resumo do pedido estilo recibo.

---

### 3.2 KDS — Kitchen Display System (`src/apps/KDS.tsx`)
Sistema digital de gerenciamento de produção da cozinha.

#### 3.2.1 Fluxo Kanban
```
PAID (Recebido) → PREPARING (Preparando) → READY (Pronto) → DELIVERED (Entregue)
                                         ↓
                                   PARTIAL (Entrega Parcial)
```

#### 3.2.2 Gestão de SLA
- Cálculo dinâmico de SLA por pedido (mínimo 5 min; máximo do tempo de preparo dos itens).
- Temporizador individual por pedido em formato `MM:SS`.
- **Alerta Amarelo:** Ativado ao atingir 70% do SLA.
- **Alerta Vermelho + Pulsação:** Ativado ao exceder 100% do SLA.
- **Alertas Sonoros:** Notificação de áudio para novos pedidos e para atrasos críticos.

#### 3.2.3 Controles de Operação
| Ação | Descrição |
|---|---|
| **Bump** | Avança o pedido para o próximo estágio |
| **Recall** | Reverte o pedido ao estágio anterior (desfaz erro operacional) |
| **Entrega Parcial** | Marca pedido com múltiplos itens como `PARTIAL` para entrega fracionada |
| **Check de Item** | Check-off individual de cada item dentro de um pedido |
| **Tempo de Preparo** | Define tempo estimado (`estimatedPrepTime`) por item |
| **Ver Detalhes** | Modal com lista completa de itens, modificadores, notas e auditoria |

#### 3.2.4 Filtragem de Estação
- Exibe apenas itens relevantes para a estação configurada: `ALL`, `GRILL`, `FRYER`, `DRINKS`, `ASSEMBLY`.
- Escopo de sessão: exibe apenas pedidos da sessão de loja ativa.

---

### 3.3 Totem de Autoatendimento — Kiosk (`src/apps/Kiosk.tsx`)
Interface self-service voltada ao cliente final, com foco em upsell e facilidade de uso.

#### 3.3.1 Fluxo de Navegação
```
SPLASH → MENU → CUSTOMIZE → CART → PAYMENT → SUCCESS
```

#### 3.3.2 Funcionalidades
- **Tela Splash:** Tela inicial com branding, ativada por toque.
- **Navegação por Categorias:** Scroll horizontal de categorias filtráveis.
- **Grid de Produtos:** Exibição com imagem grande, preço e indicador de disponibilidade.
- **Customização de Produto:**
  - Seleção de modificadores com validação de limites mínimo/máximo.
  - Grupos de escolha única (radio) e múltipla (checkbox).
- **Carrinho:** Limite de itens configurable; revisão antes do pagamento.
- **Pagamento:** Métodos habilitados conforme configurações do canal Kiosk.
- **Proteção de Privacidade:** Timer de inatividade de 60 segundos que retorna automaticamente à tela Splash.
- **Validação de Sessão:** Não permite operação sem uma sessão de loja ativa.

---

### 3.4 Painel de Chamadas — Status TV (`src/apps/TV.tsx`)
Display passivo para o salão, informando clientes sobre o status de seus pedidos.

- **Layout Adaptativo:** Detecção automática de orientação (Paisagem para TVs, Retrato para monitores verticais).
- **Seções Visuais:**
  - **Prontos** (verde): Pedidos em status `READY` ou `PARTIAL`, ordenados do mais novo para o mais antigo.
  - **Em Preparo** (amarelo/cinza): Pedidos em status `PREPARING`, ordenados por SLA (mais atrasados primeiro).
- **Destaque de Atraso:** Pedidos que excedem o SLA recebem realce visual.
- **Status Parcial:** Pedidos `PARTIAL` são exibidos em "Prontos" com indicativo visual para o cliente aguardar itens restantes.
- **Sincronização em Tempo Real:** Atualização via Supabase Realtime.
- **Controles de Desenvolvimento:** Botões de alternância de orientação ocultos (visíveis ao hover).

---

### 3.5 Admin Backoffice (`src/apps/Admin.tsx`)
Painel administrativo completo para gestão do negócio.

#### 3.5.1 Dashboard
- KPIs de vendas: faturamento total, ticket médio, número de pedidos.
- Produtos mais vendidos e análise por categoria.
- Transações recentes.

#### 3.5.2 Controle de Loja (Store Session)
- Abrir/Fechar a sessão do dia (StoreSession).
- Validações de fechamento: nenhum turno aberto; nenhum pedido ativo.
- Rastreamento de quem abriu/fechou e horários.

#### 3.5.3 Gestão de Pedidos
- Listagem de todos os pedidos com busca e filtros por status e número.

#### 3.5.4 Gestão de Produtos
- CRUD completo: nome, preço, categoria, estação, imagem, descrição.
- Configuração de Grupos de Modificadores (min/max, opções com preço adicional).
- Vinculação de Receita (Bill of Materials) a ingredientes.
- Toggle de disponibilidade.

#### 3.5.5 Gestão de Estoque
- Cadastro de ingredientes: nome, unidade, custo/unidade, estoque mínimo, fornecedor.
- Movimentações de estoque:
  | Tipo | Descrição |
  |---|---|
  | `RECEIVE` | Entrada de mercadoria |
  | `ADJUST` | Correção manual |
  | `WASTE` | Perda / vencimento |
  | `SALE` | Dedução automática por venda |
- Histórico completo de movimentações com timestamps.
- Alerta visual para itens com estoque abaixo do mínimo.

#### 3.5.6 Motor de Promoções
| Tipo | Descrição |
|---|---|
| `FIXED_PRICE_BUNDLE` | Combo de produtos por preço fixo |
| `PERCENTAGE_OFF` | Desconto percentual sobre itens |
| `BOGO` | Compre X, Leve Y |

- Segmentação: por categoria ou produto específico; quantidade mínima.
- Validade: período de datas (`valid_from`/`valid_until`), dias da semana, janela de horário.
- Canal: POS, Kiosk, Delivery (independentemente configurável).
- Prioridade: define a ordem de aplicação quando múltiplas promoções se aplicam.

#### 3.5.7 Gestão de Usuários (RBAC)
| Papel | Permissões |
|---|---|
| `ADMIN` | Acesso total ao sistema |
| `MANAGER` | Relatórios, estoque e gerência operacional |
| `CASHIER` | Operações de PDV |
| `KITCHEN` | Operações de KDS |

- Autenticação por PIN (4 dígitos).
- CRUD de usuários com atribuição de papel.

#### 3.5.8 Gestão de Escoteiros (Scouts)
- Cadastro de membros: nome, tropa, patrulha.
- Importação em lote de membros.
- Sincronização com banco de dados.

#### 3.5.9 Relatórios
- Relatórios de fechamento de turno (Z-Report):
  - Operador, terminal, horário de abertura/fechamento.
  - Totais por método de pagamento.
  - Sangrias, Suprimentos e Reembolsos com auditoria.
  - Saldo final de caixa.
  - Número de pedidos e resumo financeiro.

#### 3.5.10 Configurações
- Taxa fiscal: ICMS/IVA, CNPJ, categorias isentas.
- Regras de negócio: máximo de itens por pedido.
- Métodos de pagamento habilitados por canal (POS e Kiosk, independentemente).
- Reembolsos administrativos com comprovante (base64).
- Reset de banco de dados: completo ou apenas catálogo.

---

## 4. Integrações e Infraestrutura

### 4.1 Banco de Dados (Supabase / PostgreSQL)

| Tabela | Descrição |
|---|---|
| `products` | Catálogo com modificadores e receitas (JSONB) |
| `ingredients` | Ingredientes com níveis de estoque |
| `stock_logs` | Histórico de movimentações de estoque |
| `users` | Usuários do sistema com papel e PIN |
| `scouts` | Membros do grupo escoteiro |
| `promotions` | Regras de promoção com validações complexas (JSONB) |
| `orders` | Pedidos com timestamps de ciclo de vida e itens (JSONB) |
| `shifts` | Turnos com transações financeiras (JSONB) |
| `settings` | Configurações globais (tax_settings, payment_settings) |
| `stripe_events` | Log de eventos de webhook de pagamento |

### 4.2 Realtime
- Subscriptions ativas em `orders` e `sessions` (INSERT, UPDATE, DELETE).
- Status de conexão rastreado: `CONNECTING`, `SUBSCRIBED`, `CHANNEL_ERROR`, `CLOSED`.

### 4.3 Segurança (RLS)
- Todas as tabelas possuem políticas RLS no Supabase.
- Configuração atual: permissiva para `anon` e `authenticated` (ambiente de desenvolvimento).
- **Recomendação para produção:** Implementar políticas por papel com `auth.jwt()`.

---

## 5. Fluxo de Status de Pedido

```
PENDING → PAID → PREPARING → READY → DELIVERED
                          ↓
                       PARTIAL → DELIVERED
                          ↑
                       (Recall)
                          ↓
                      CANCELLED
```

| Status | Descrição | Quem transiciona |
|---|---|---|
| `PENDING` | Pedido iniciado mas não pago | POS / Kiosk |
| `PAID` | Pagamento confirmado | POS / Kiosk |
| `PREPARING` | Produção iniciada | KDS (Bump) |
| `READY` | Pronto para retirada | KDS (Bump) |
| `PARTIAL` | Parte dos itens entregue | KDS (Entrega Parcial) |
| `DELIVERED` | Pedido concluído | KDS (Bump) |
| `CANCELLED` | Pedido cancelado | Admin / Sistema |

---

## 6. Glossário de Entidades

| Entidade | Descrição |
|---|---|
| **Order** | Objeto central de uma transação comercial |
| **CartItem** | Instância de produto no pedido com modificadores e notas específicos |
| **Shift** | Sessão financeira de trabalho atrelada a um terminal e operador |
| **StoreSession** | Sessão de operação do dia (necessária para abrir turnos) |
| **Promotion** | Regra de desconto automática aplicada ao carrinho |
| **Ingredient** | Insumo com rastreamento de estoque e custo unitário |
| **ModifierGroup** | Grupo de opções de personalização de produto (ex: "Ponto da carne") |
| **Scout** | Membro de grupo escoteiro para controle de participação |

---

## 7. Comandos de Desenvolvimento

```bash
npm run dev       # Servidor de desenvolvimento Vite
npm run build     # Compilação para produção
npm run preview   # Preview do build de produção
npm run test      # Execução de testes com Vitest
```

### 7.1 Setup do Banco de Dados
Execute em ordem no SQL Editor do Supabase:
1. `supabase/schema.clean.sql` — Estrutura das tabelas
2. `supabase/schema.rls.sql` — Políticas de segurança (RLS)
3. `supabase/schema.realtime.sql` — Subscriptions de tempo real
