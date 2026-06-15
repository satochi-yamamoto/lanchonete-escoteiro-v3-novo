# Lanchonete Escoteiros POS Suite

Sistema de PDV (Ponto de Venda) modular para a lanchonete do Grupo Escoteiro Cooper Cotia, desenvolvido com React, Vite e Supabase.

O projeto apoia a operação de vendas da lanchonete em atividades, eventos e ações do grupo escoteiro. As vendas registradas no sistema não têm como objetivo a lucratividade; elas servem para organizar a operação, controlar insumos, prestar contas e apoiar a sustentabilidade das atividades escoteiras.

## Arquitetura

O projeto é uma SPA (Single Page Application) modular com dois apps principais acessíveis via launcher após autenticação por PIN:

- **POS (Terminal de Caixa)**: Registro de pedidos, pagamentos e controle de caixa. Acesso: ADMIN, MANAGER, CASHIER.
- **Admin (Backoffice)**: Gestão de produtos, estoque, relatórios, promoções, escoteiros, cardápios e terminais. Acesso: ADMIN.

Módulos adicionais existem como apps standalone (não carregados pelo launcher principal):
- **KDS (Kitchen Display System)**: Gestão de fila de produção na cozinha (versão completa 3 colunas ou simplificada mobile).
- **Kiosk (Autoatendimento)**: Interface touch para clientes realizarem pedidos.
- **TV (Painel de Senhas)**: Exibição de pedidos prontos para retirada.

### Stack Tecnológica

- **Frontend**: React 19.2, TypeScript 5.8, Vite 6.2
- **Estado Global**: Zustand 5.0 (persistência local + sincronização remota)
- **Backend / Banco de Dados**: Supabase (PostgreSQL + Realtime)
- **Ícones**: Lucide React
- **Testes**: Vitest 4.0
- **Deploy**: Vercel

## Instalação e Configuração

### Pré-requisitos

- Node.js (v18+)
- Conta no Supabase (para persistência em nuvem — opcional)

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_publica
```

> **Nota**: Se as variáveis não forem configuradas, o sistema rodará em modo **Offline/Mock**, mantendo os dados apenas na memória do navegador.

### 2. Configurar Banco de Dados (Supabase)

Acesse o painel do Supabase, vá em **SQL Editor** e execute os scripts na seguinte ordem:

1. **Criar Tabelas**: `supabase/schema.clean.sql`
2. **Configurar Permissões (RLS)**: `supabase/schema.rls.sql`
3. **Habilitar Realtime**: `supabase/schema.realtime.sql`

Isso criará as tabelas: `products`, `ingredients`, `orders`, `users`, `promotions`, `stock_logs`, `shifts`, `store_sessions`, `scouts`.

### 3. Executar o Projeto

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Comandos Disponíveis

```bash
npm run dev       # Servidor de desenvolvimento (porta 3000)
npm run build     # Build de produção
npm run preview   # Preview do build de produção
npm run test      # Testes (Vitest)
npm run backup    # Backup do banco de dados Supabase
```

## Funcionalidades

### Autenticação
- Login via PIN de 4 dígitos
- Seleção de usuário + digitação de PIN no teclado numérico
- Controle de acesso por role (ADMIN, MANAGER, CASHIER, KITCHEN)

### Gestão de Turno (Caixa)
- **Abertura com Planejamento Operacional**: Ao abrir turno, informar custo dos produtos, quantidade planejada de lanches normais/veganos, **quantidade de lanches para Chefes** (o total de **Escoteiros/Extra** é calculado automaticamente = Normal + Vegano − Chefes), custo unitário e nome do cardápio do dia.
- **Valor Unitário Sugerido**: Rateado apenas pelos lanches pagantes (Escoteiros/Extra), pois os lanches de **Chefes** custam R$ 0,00.
- **Lanches Fixos no Caixa**: `00 - Chefe` (R$ 0,00), `01 - Escoteiro` e `02 - Extra` (valor unitário da abertura) sempre disponíveis no topo do catálogo.
- **Fechamento pré-preenchido**: O formulário de fechamento traz os dados da abertura (cardápio, custo e total produzido); alterações são gravadas como **histórico de ajustes** para auditoria.
- **Transações**: OPENING, SALE, DROP (sangria), ADD (suprimento), REIMBURSEMENT, CLOSING.
- **Relatório Z Térmico**: Impressão nativa formatada para bobinas de impressoras térmicas.

### Pagamentos
- Métodos ativos: **PIX** e **Dinheiro (CASH)**
- No pagamento em dinheiro, **campo "Valor recebido" vazio assume o total a pagar** (pagamento exato, sem troco)
- Configurações de métodos persistidas em localStorage

### Escoteiros
- Cadastro de escoteiros com ramo (branch) e patrulha (patrol)
- Importação em lote
- Vinculação a operações e eventos

### Cardápios (Menu Catalogs)
- Cardápios nomeados com toggle ativo/inativo
- Operação baseada em eventos

### Terminais
- Configurações de terminal com data de operação
- Toggle ativo/inativo

### Motor de Promoções
- **Combos Flexíveis**: Produtos diferentes da mesma categoria qualificam para bundles (Ex: "2 Lanches por R$ 20").
- **BOGO e Desconto Percentual**: Suporte completo.
- **Status Ativo/Inativo**: Promoções pausáveis sem exclusão.
- **Prioridade**: Descontos aplicados em ordem de prioridade.

### KDS (Kitchen Display System)
1. **KDS Completo**: Fluxo em 3 colunas (Pendente → Preparando → Pronto).
2. **KDS Simplificado (Mobile-First)**: Itens individuais como cards grandes para toque rápido em tablets.

### Sessão da Loja (Business Day)
- Abertura/fechamento de expediente com rastreamento de usuário
- Sincronização em tempo real entre terminais

### Sincronização em Tempo Real
- Pedidos sincronizados entre POS, KDS e TV via Supabase Realtime
- Status de conexão visível no launcher (CONNECTING, SUBSCRIBED, CHANNEL_ERROR)

## Estrutura do Projeto

```
src/
├── apps/           # Módulos principais (POS, Admin, KDS, Kiosk, TV)
├── components/     # Componentes UI por módulo
│   ├── admin/      # Componentes do Admin (~131KB AdminComponents.tsx)
│   ├── pos/        # Componentes do POS (~95KB PosComponents.tsx)
│   ├── kds/        # Componentes do KDS
│   ├── kiosk/      # Componentes do Kiosk
│   ├── ui.tsx      # Primitivos UI compartilhados
│   └── LoginScreen.tsx
├── services/       # Lógica de negócio
│   ├── backend/    # Abstração backend (Supabase/Mock)
│   ├── promotionEngine.ts
│   └── mockData.ts
├── constants/      # Mensagens centralizadas
├── store.ts        # Estado global (Zustand)
├── types.ts        # Interfaces e enums TypeScript
└── utils.ts        # Utilitários
supabase/
├── schema.clean.sql
├── schema.rls.sql
├── schema.realtime.sql
├── migrations/     # Migrações incrementais
└── backups/        # Backups do banco
```

## Segurança

- **RLS (Row Level Security)**: Tabelas com políticas RLS para produção.
- **Variáveis de Ambiente**: Nunca commite `.env.local` ou chaves `service_role` no repositório.
- **PINs**: Armazenados apenas no backend, nunca expostos na lista de login.

## Testes

```bash
npm run test
```

Utiliza Vitest com @testing-library/react. Testes em `src/**/*.test.{ts,tsx}`.

---
Desenvolvido para a Lanchonete do Grupo Escoteiro Cooper Cotia
