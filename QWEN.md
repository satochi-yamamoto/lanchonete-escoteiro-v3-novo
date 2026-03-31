# OmniBurger POS Suite v2 - Contexto do Projeto

## Visão Geral

**OmniBurger POS Suite** é um sistema PDV (Ponto de Venda) modular para restaurantes de serviço rápido (QSR), desenvolvido com React 19, Vite, TypeScript e Supabase. O sistema integra terminal de vendas, autoatendimento, gestão de cozinha e backoffice administrativo em uma arquitetura reativa baseada em eventos.

## Arquitetura do Sistema

### Módulos Principais

| Módulo | Descrição | Público |
|--------|-----------|---------|
| **POS** | Terminal de caixa para registro de pedidos e pagamentos | Operadores de caixa |
| **Kiosk** | Totem de autoatendimento com interface touch | Clientes finais |
| **KDS** | Kitchen Display System - gestão de produção em estilo Kanban | Cozinha |
| **TV** | Painel de senhas para exibição de pedidos prontos | Clientes (salão) |
| **Admin** | Backoffice para gestão de produtos, estoque, promoções e relatórios | Admin/Gerentes |

### Stack Tecnológica

- **Frontend**: React 19, Vite 6, TypeScript 5.8
- **Estilização**: TailwindCSS
- **Estado Global**: Zustand (com persistência local + sincronização remota)
- **Backend/Banco de Dados**: Supabase (PostgreSQL)
- **Ícones**: Lucide React
- **Testes**: Vitest

### Estrutura de Diretórios

```
src/
├── apps/           # Módulos principais (POS.tsx, Kiosk.tsx, KDS.tsx, TV.tsx, Admin.tsx)
├── components/     # Componentes UI reutilizáveis e específicos por módulo
│   ├── admin/
│   ├── kds/
│   ├── kiosk/
│   ├── pos/
│   ├── ui.tsx      # Componentes base (Button, Input, Modal, etc.)
│   └── LoginScreen.tsx
├── services/
│   ├── backend/
│   │   ├── backend.ts      # Interface unificada (Supabase ou Local/Mock)
│   │   └── supabaseClient.ts
│   ├── mockData.ts         # Dados mockados para modo offline
│   └── promotionEngine.ts  # Motor de regras de promoção
├── store.ts        # Zustand store - estado global e ações
├── types.ts        # Tipos TypeScript e enums
├── utils.ts        # Funções utilitárias
├── App.tsx         # Router simples e tela de seleção de módulos
└── index.tsx       # Entry point

supabase/
├── schema.clean.sql      # Criação de tabelas (estrutura limpa)
├── schema.rls.sql        # Políticas de Row Level Security
├── schema.realtime.sql   # Configuração de realtime para sincronização
├── schema.sessions.sql   # Tabela de sessões de loja
└── migrations/           # Migrações versionadas
```

## Entidades Principais (Tipos)

### Pedidos e Vendas
- **Order**: Transação central com status (`PENDING` → `PAID` → `PREPARING` → `READY` → `PARTIAL` → `DELIVERED`)
- **CartItem**: Item no carrinho/pedido com modificadores e observações
- **Shift**: Sessão de trabalho financeira (abertura/fechamento de caixa)
- **StoreSession**: Sessão da loja (expediente diário)

### Catálogo e Estoque
- **Product**: Produto com categoria, estação (GRILL/FRYER/DRINKS/ASSEMBLY), receita e modificadores
- **Ingredient**: Ingrediente com controle de estoque, custo e fornecedor
- **StockLog**: Registro de movimentação de estoque (RECEIVE/ADJUST/SALE/WASTE)
- **Promotion**: Regras de promoção (BOGO, FIXED_PRICE_BUNDLE, PERCENTAGE_OFF)

### Usuários
- **User**: Usuário com role (ADMIN/MANAGER/CASHIER/KITCHEN) e PIN
- **Scout**: Cadastro de clientes (sistema de fidelidade Escoteiros)

## Configuração e Execução

### Pré-requisitos
- Node.js v18+
- Conta no Supabase (opcional para modo offline)

### Instalação

```bash
npm install
```

### Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_publica
```

> **Nota**: Sem as variáveis configuradas, o sistema roda em modo **Offline/Mock** com dados em memória.

### Scripts Disponíveis

```bash
npm run dev       # Inicia servidor de desenvolvimento (Vite)
npm run build     # Build de produção
npm run preview   # Preview da build
npm run test      # Testes com Vitest
```

### Configuração do Supabase

1. Acesse o **SQL Editor** no painel do Supabase
2. Execute os scripts na ordem:
   - `supabase/schema.clean.sql` - Cria tabelas
   - `supabase/schema.rls.sql` - Configura políticas RLS
   - `supabase/schema.realtime.sql` - Habilita realtime para sincronização

## Padrões de Desenvolvimento

### Gerenciamento de Estado

O Zustand store (`src/store.ts`) é o centro do estado da aplicação:
- Todas as ações CRUD passam pelo store
- Cada ação persiste automaticamente no backend (Supabase ou local)
- Realtime updates sincronizam múltiplos clientes

```typescript
// Exemplo de uso no componente
const products = useStore(s => s.products);
const addToCart = useStore(s => s.addToCart);
```

### Backend Abstraction

O módulo `src/services/backend/backend.ts` fornece uma interface unificada:
- **Modo Supabase**: Persistência em nuvem com realtime
- **Modo Local**: Dados mockados em memória para desenvolvimento/demo

### Convenções de Código

- **TypeScript**: Tipagem estrita, todos os tipos definidos em `types.ts`
- **Componentes**: Funções React com tipagem explícita de props
- **IDs**: Usar `generateUUID()` para IDs únicos
- **Datas**: ISO 8601 strings (`new Date().toISOString()`)
- **Nomes de arquivos**: PascalCase para componentes, camelCase para utilitários

### Estrutura de Componentes

```tsx
import { useStore } from '../store';
import { Button } from './ui';

export const MeuComponente = ({ onExit }: { onExit: () => void }) => {
  const action = useStore(s => s.action);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Conteúdo */}
    </div>
  );
};
```

## Recursos Específicos por Módulo

### POS (Terminal de Caixa)
- Grid de produtos com filtragem por categoria/estação
- Toggle para ocultar produtos indisponíveis
- Múltiplos métodos de pagamento (Dinheiro, Crédito, Voucher, Pix)
- Cálculo automático de troco
- Sangria e suprimento protegidos por senha

### KDS (Cozinha)
- Fluxo Kanban: Recebidos → Preparando → Pronto
- Alertas visuais e sonoros para SLA
- Bump (avançar estágio), Recall (reversão)
- Entrega parcial de itens
- Temporizadores individuais por pedido

### Kiosk (Autoatendimento)
- Navegação por categorias com fotos
- Customização de modificadores com validação min/max
- Timer de inatividade para reset de sessão

### TV (Status)
- Layout adaptativo (Paisagem/Retrato)
- Destaque visual para pedidos atrasados
- Exibição segregada: Em Preparo / Prontos

### Admin
- Dashboard de vendas e ticket médio
- Gestão de estoque com entradas/perdas
- Motor de promoções com regras complexas
- RBAC para usuários

## Segurança

- **RLS (Row Level Security)**: Políticas ativadas no Supabase para produção
- **Variáveis de ambiente**: Nunca commitar `.env.local` ou chaves `service_role`
- **Autenticação**: Login por PIN (simplificado) ou Supabase Auth

## Testes

Testes unitários com Vitest:

```bash
npm run test
```

Arquivos de teste: `src/**/*.test.ts`, `src/**/*.test.tsx`

## Deploy (Vercel)

Configuração em `vercel.json`:

```json
{
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
```

O arquivo `.vercelignore` exclui arquivos desnecessários do deploy.

## Links e Recursos

- **README.md**: Visão geral e instruções de instalação
- **PRD.md**: Especificação detalhada de requisitos
- **DOCUMENTACAO_PROJETO.md**: Documentação técnica complementar
- **MANUAL_USUARIO.md**: Guia do usuário final
- **MIGRATIONS.md**: Histórico de migrações do banco
