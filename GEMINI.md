# GEMINI.md - Lanchonete Escoteiros POS Suite v2

## Project Overview
**Lanchonete Escoteiros POS Suite v2** is a modular Point of Sale (POS) system designed for snack bars and restaurants. It is built as a highly interactive Single Page Application (SPA) using **React 19**, **Vite**, and **TypeScript**. The system supports real-time synchronization across multiple terminals and displays using **Supabase** (PostgreSQL + Realtime).

### Key Modules (Apps)
- **POS (Terminal de Caixa)**: Main interface for cashiers to register orders, manage payments, and control shifts.
- **Kiosk (Autoatendimento)**: Self-service interface for customers to place orders directly.
- **KDS (Kitchen Display System)**: Production queue management for the kitchen.
- **TV (Painel de Chamada)**: Public display for order status (Preparing/Ready).
- **Admin Backoffice**: Management dashboard for products, inventory, reports, promotions, and users.

### Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS.
- **Icons**: Lucide React.
- **State Management**: Zustand (Global Store) with support for real-time syncing.
- **Backend/Database**: Supabase (PostgreSQL, RLS, Realtime).
- **Testing**: Vitest, React Testing Library.

---

## Architecture & Logic
- **Modular SPA**: The application switches between different "apps" (POS, KDS, etc.) within the same codebase, controlled by a simple router in `src/App.tsx`.
- **Backend Abstraction**: Logic is abstracted through a `BackendInterface` in `src/services/backend/backend.ts`, allowing for a "Mock/Offline" fallback when Supabase is not configured.
- **State Syncing**: The Zustand store (`src/store.ts`) handles both local state updates and remote persistence/synchronization via Supabase Realtime subscriptions.
- **Promotion Engine**: Complex discount rules (BOGO, Bundles, % off) are calculated in `src/services/promotionEngine.ts`.
- **Role-Based Access Control (RBAC)**: Basic security implemented in `App.tsx` based on user roles (`ADMIN`, `MANAGER`, `CASHIER`, `KITCHEN`).

---

## Development Workflow

### Core Commands
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles the project for production.
- `npm run preview`: Previews the production build locally.
- `npm run test`: Executes unit tests using Vitest.

### Database Setup (Supabase)
To set up the database, execute the following scripts in the Supabase SQL Editor in order:
1. `supabase/schema.clean.sql`: Core table structures.
2. `supabase/schema.rls.sql`: Security policies (Row Level Security).
3. `supabase/schema.realtime.sql`: Enables real-time synchronization for the `orders` table.

### Environment Configuration
- `.env.local`: Should contain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- If environment variables are missing, the system defaults to **Mock Mode**.

---

## Directory Structure
- `src/apps/`: Main entry points for each system module.
- `src/components/`: UI components, organized by module (e.g., `admin/`, `pos/`, `kds/`).
- `src/services/`: Business logic, including `promotionEngine.ts` and `backend/` integration.
- `src/store.ts`: The central source of truth for the application state.
- `src/types.ts`: Unified TypeScript interfaces and enums for the entire project.
- `supabase/`: SQL migration scripts and configuration.

---

## Coding Conventions
- **Type Safety**: Use TypeScript interfaces defined in `src/types.ts` for all data models.
- **State Integrity**: Always update the backend through the methods provided in the Zustand store (`src/store.ts`) to ensure synchronization.
- **Surgical Updates**: When modifying UI, prioritize reusing existing components in `src/components/ui.tsx`.
- **Naming**: Follow camelCase for variables/functions and PascalCase for components.
- **Testing**: New features should be accompanied by tests in `src/basic.test.ts` or new test files.
