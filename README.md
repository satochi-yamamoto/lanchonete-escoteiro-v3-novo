# Lanchonete Escoteiros POS Suite v2

Sistema de PDV (Ponto de Venda) modular para lanchonetes, desenvolvido com React, Vite e Supabase.

## Arquitetura

O projeto é uma SPA (Single Page Application) modular que carrega diferentes "apps" baseados no contexto de uso:

- **POS (Terminal de Caixa)**: Registro de pedidos, pagamentos e controle de caixa.
- **Kiosk (Autoatendimento)**: Interface touch para clientes realizarem pedidos.
- **KDS (Kitchen Display System)**: Gestão de fila de produção na cozinha.
- **TV (Painel de Senhas)**: Exibição de pedidos prontos para retirada.
- **Admin**: Backoffice para gestão de produtos, estoque e relatórios.

### Stack Tecnológica

- **Frontend**: React 19, Vite, TailwindCSS
- **Estado Global**: Zustand (Persistência local + Sincronização remota)
- **Backend / Banco de Dados**: Supabase (PostgreSQL)
- **Testes**: Vitest

## Instalação e Configuração

### Pré-requisitos

- Node.js (v18+)
- Conta no Supabase (para persistência em nuvem)

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

Acesse o painel do Supabase, vá em **SQL Editor** e execute o script de criação de tabelas localizado em:

1. **Criar Tabelas**: `supabase/schema.clean.sql`
   (Cria a estrutura do banco se estiver vazio)

2. **Configurar Permissões (RLS)**: `supabase/schema.rls.sql`
   (Habilita segurança e libera acesso para a aplicação funcionar)

3. **Habilitar Realtime**: `supabase/schema.realtime.sql`
   (Ativa a sincronização automática de pedidos entre telas como KDS e TV)

Isso criará as tabelas: `products`, `ingredients`, `orders`, `users`, `promotions`, `stock_logs`, `shifts`, `settings`.

### 3. Executar o Projeto

Instale as dependências e inicie o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## Funcionalidades e Módulos (Atualizações Recentes)

### Gestão de Turno (Caixa)
- **Métricas Avançadas**: Durante o fechamento de caixa, o operador deve informar o cardápio do dia, seu nome, consumo de bebidas, custo do lanche e produção. O sistema calcula automaticamente as sobras com base no total vendido.
- **Relatório Z Térmico**: Impressão nativa do Relatório de Fechamento de Caixa, formatado para bobinas de impressoras térmicas (resumo de vendas, PIX, Dinheiro e sangrias).
- **Relatório Detalhado (Admin)**: Acesso gerencial com detalhamento de lucro final, quantidade de lanches vendidos por produto (dinâmico) e histórico de reembolsos.

### KDS (Kitchen Display System)
O sistema agora possui duas versões de tela de produção:
1. **KDS Completo**: Fluxo tradicional em 3 colunas (Pendente, Preparando, Pronto) voltado para lanchonetes maiores.
2. **KDS Simplificado (Mobile-First)**: Desenvolvido para operações ágeis (Ex: eventos escoteiros). Focado em dispositivos móveis/tablets, exibe os lanches individualmente (como grandes cartões) e não por pedido. Basta tocar no lanche para dar baixa e enviá-lo diretamente para "Entregue".

### Motor de Promoções
- **Combos Flexíveis**: O motor de cálculo entende produtos diferentes pertencentes à mesma categoria. (Exemplo: "2 Lanches por R$ 20" aceitará 1 Lanche Escoteiro + 1 Lanche Chefe, aplicando o desconto corretamente).
- **Status Ativo/Inativo**: Promoções podem ser pausadas no painel administrativo sem necessidade de exclusão do banco de dados.

## Testes

O projeto utiliza Vitest para testes unitários.

```bash
npm run test
```

## Estrutura do Projeto

- `/apps`: Módulos principais (POS, Kiosk, etc).
- `/components`: Componentes UI reutilizáveis e específicos por módulo.
- `/services`: Lógica de negócio (Cálculo de promoções, Cliente Supabase).
- `/store.ts`: Gerenciamento de estado global (Zustand).
- `/supabase`: Scripts SQL e Edge Functions.

## Segurança

- **RLS (Row Level Security)**: As tabelas do Supabase devem ter políticas RLS ativadas para produção. O script atual configura acesso básico para `anon` (cliente público), mas recomenda-se refinar para `authenticated` em produção.
- **Variáveis**: Nunca comite `.env.local` ou chaves de serviço (`service_role`) no repositório.

---
Desenvolvido por Lanchonete Escoteiros Cooper
