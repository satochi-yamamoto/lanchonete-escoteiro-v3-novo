# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

**Lanchonete Escoteiros POS Suite** is a modular Point of Sale (POS) system for the snack bar of Grupo Escoteiro Cooper Cotia. It's a React SPA with two main embedded apps (POS and Admin) that can run in offline/mock mode or connected to Supabase for real-time synchronization.

The system supports scout/escoteiro operations for events and activities. Sales are not profit-oriented — they serve to organize operations, control supplies, provide accountability, and support scouting sustainability.

## Build Commands

```bash
# Development server (runs on port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests (Vitest)
npm run test

# Backup database (requires Supabase credentials)
npm run backup
```

## Architecture

### Modular SPA Structure

The application is a single-page app with an internal router (`src/App.tsx`) that presents a launcher menu after PIN-based login. The launcher routes to:

- **POS** (`src/apps/POS.tsx`): Cashier terminal for order entry and payments. Accessible by ADMIN, MANAGER, and CASHIER roles.
- **Admin** (`src/apps/Admin.tsx`): Backoffice for products, inventory, reports, promotions, scouts, menus, terminals. Accessible by ADMIN only.

Other modules exist as standalone apps but are not loaded from the main launcher:
- **KDS** (`src/apps/KDS.tsx` & `src/apps/KDSSimplified.tsx`): Kitchen Display System (full 3-step flow or simplified mobile version)
- **Kiosk** (`src/apps/Kiosk.tsx`): Self-service customer interface
- **TV** (`src/apps/TV.tsx`): Public order status display

### Backend Abstraction Pattern

The app uses a backend abstraction layer (`src/services/backend/backend.ts`) that provides a unified interface for both Supabase and local/mock storage:

```typescript
// BackendInterface provides methods like:
- loadInitialState()
- upsertProduct(), deleteProduct()
- upsertOrder()
- subscribeToChanges() // For real-time sync
- resetDatabase(), forceCompleteAllOrders()
```

The `backend` object automatically detects if Supabase is configured (via env vars) and switches between:
- **Supabase mode**: Full PostgreSQL persistence with Realtime subscriptions
- **Local mode**: In-memory data with localStorage persistence for settings

### State Management (Zustand)

Global state is managed via Zustand in `src/store.ts`. Key patterns:

- **Cart state**: `cart`, `cartTotals`, actions like `addToCart()`, `removeFromCart()`
- **Order management**: `orders`, `createOrder()`, `updateOrderStatus()`, `recallOrder()`
- **Catalog**: `products`, `ingredients`, `promotions`, `menuCatalogs`, `terminals`
- **Shift management**: `currentShift`, `openShift()` (with `ShiftOpeningData` for operational planning), `closeShift()`, `addShiftTransaction()`
- **Store session**: `currentSession` for business day tracking
- **Users**: Dual user system — `users` (login list without PINs) and `dbUsers` (full management with PINs)
- **Scouts**: `scouts`, `addScout()`, `importScouts()`, `fetchScouts()`
- **Payment settings**: `activePaymentMethodsPOS`, persisted to localStorage. Currently only PIX and CASH are supported.
- **Admin utilities**: `resetDatabase()`, `forceCompleteAllOrders()`

All state mutations that need persistence call backend methods with `.catch()` for fire-and-forget async operations.

### Authentication

- PIN-based login (4-digit PIN) via `LoginScreen` component
- Users are listed without PINs; authentication validates against stored PINs in backend
- Role-Based Access Control: `ADMIN`, `MANAGER`, `CASHIER`, `KITCHEN`

### Promotion Engine

Complex discount rules are calculated in `src/services/promotionEngine.ts`:

- Supports `FIXED_PRICE_BUNDLE` (e.g., "2 burgers for R$20")
- Supports `BOGO` and `PERCENTAGE_OFF` types
- Category-based matching (different products in same category qualify for bundles)
- Items are expanded by quantity and marked as "used" by promotions
- Discounts calculated by priority order
- Promotions can be paused (active/inactive toggle) without deletion

### Real-time Synchronization

When using Supabase, the app subscribes to PostgreSQL changes:
- Orders table: Syncs order status across all terminals
- Store sessions: Syncs business day open/close status
- Connection status displayed on launcher (CONNECTING, SUBSCRIBED, CHANNEL_ERROR)

### Payment Methods

Currently supported: **PIX** and **CASH** only. Payment method settings are persisted to localStorage under `omni_payment_settings`.

In `CashPaymentModal`, when the "Valor recebido" (amount received) field is left empty and the operator confirms, the system assumes the full total to pay (exact payment, no change). Amounts typed below the total still block confirmation.

## Environment Configuration

Create `.env.local` with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

If env vars are missing, the system automatically falls back to Mock Mode.

## Deployment

Deployed on **Vercel**. Configuration in `vercel.json` and `.vercel/` directory. Build output is static SPA.

## Key Files

- `src/types.ts`: All TypeScript interfaces and enums (source of truth)
- `src/store.ts`: Zustand store with all state and actions (~35KB)
- `src/services/backend/backend.ts`: Backend abstraction layer (~27KB)
- `src/services/backend/supabaseClient.ts`: Supabase client initialization
- `src/services/promotionEngine.ts`: Discount calculation logic
- `src/services/mockData.ts`: Mock users, products, scouts for offline mode
- `src/App.tsx`: Module router, launcher menu, and login gate
- `src/components/ui.tsx`: Shared UI components (Button, Card, Modal, etc.)
- `src/components/LoginScreen.tsx`: PIN-based authentication screen
- `src/constants/messages.ts`: Centralized system messages (errors, success, info)
- `src/constants/fixedProducts.ts`: Fixed shift products (Chefe/Escoteiro/Extra) and `computeBurgerPlan` (shared opening burger-plan rules)
- `vite.config.ts`: Vite config with path aliases (`@/` → `src/`), port 3000

## Component Organization

- `src/components/pos/PosComponents.tsx`: All POS-specific components (single large file ~95KB)
- `src/components/admin/AdminComponents.tsx`: Admin panel components (~131KB)
- `src/components/admin/StoreControl.tsx`: Store session open/close
- `src/components/admin/ScoutManager.tsx`: Scout CRUD
- `src/components/admin/OrderManager.tsx`: Order management panel
- `src/components/kds/`: KDS components
- `src/components/kiosk/`: Kiosk components
- `src/components/ui.tsx`: Shared UI primitives

## Database Schema (Supabase)

SQL scripts in `/supabase/`:
- `schema.clean.sql`: Table definitions (current)
- `schema.rls.sql`: Row Level Security policies
- `schema.realtime.sql`: Realtime publication setup
- `migrations/`: Incremental schema changes

Key tables: `products`, `ingredients`, `orders`, `shifts`, `store_sessions`, `stock_logs`, `promotions`, `scouts`, `users`

## Testing

Uses Vitest (v4.0.17). Tests are in:
- `src/**/*.test.ts`
- `src/**/*.test.tsx`

Test environment: jsdom (currently commented out in vite.config.ts for troubleshooting).

## Tech Stack

- **React** 19.2.3
- **Vite** 6.2
- **TypeScript** 5.8.2
- **Zustand** 5.0.9
- **Supabase JS** 2.99.3
- **Lucide React** 0.562 (icons)
- **Vitest** 4.0.17
- **Testing Library** (React 16.3.2, jest-dom 6.9.1)

## Important Patterns

1. **Cart items** extend Product with `cartId` (unique instance ID), `selectedModifiers`, and `note`
2. **Orders** contain a snapshot of cart items and calculated totals (subtotal, discount, total)
3. **Shift transactions** track cash movements (OPENING, SALE, DROP, ADD, REIMBURSEMENT, CLOSING)
4. **Shift opening** requires operational planning data (`ShiftOpeningData`): product cost total, planned normal/vegan quantities, planned **Chefes** count, derived **Escoteiros/Extra** count (= normal + vegan − chefes), unit cost, daily menu name. The shared helper `computeBurgerPlan({ normal, vegan, chefe })` in `src/constants/fixedProducts.ts` is the single source for total/derived quantities and validation. The suggested unit cost (`calculateOpeningUnitCost`) divides the product cost by the **payable** burgers (Escoteiros/Extra only), since Chefes are free.
5. **Fixed shift products**: the POS pins three virtual products at the top of the catalog — `00 - Chefe` (always R$ 0,00), `01 - Escoteiro` and `02 - Extra` (priced at the shift's `opening_unit_cost`). Built by `buildShiftFixedProducts()`; not stored in the catalog.
6. **Shift closing** (`ZReportModal`) pre-fills the closing form from the opening data (menu, unit cost, produced total). Any change vs. the opening is recorded as an audit entry in `shift.adjustments` (`ShiftAdjustment[]`), persisted to the `shifts.adjustments` JSONB column.
7. **Inventory**: Products can have a recipe (ingredient BOM) for automatic stock deduction on sale
8. **Scouts**: Scout profiles with branch (ramo) and patrol (patrulha) for association tracking
9. **Menu catalogs**: Named menus with active/inactive toggle for event-based operation
10. **Terminal configs**: Named terminal configurations with operation date
11. **Store sessions**: Business day open/close with user tracking
12. **Path alias**: Use `@/` to reference `src/` directory
