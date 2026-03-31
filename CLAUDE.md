# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OmniBurger POS Suite v2** is a modular Point of Sale (POS) system for snack bars/restaurants. It's a React SPA with multiple embedded apps (POS, KDS, Kiosk, TV, Admin) that can run in offline/mock mode or connected to Supabase for real-time synchronization.

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
```

## Architecture

### Modular SPA Structure

The application is a single-page app with an internal router (`src/App.tsx`) that switches between distinct modules based on user selection:

- **POS** (`src/apps/POS.tsx`): Cashier terminal for order entry and payments
- **KDS** (`src/apps/KDS.tsx` & `src/apps/KDSSimplified.tsx`): Kitchen Display System with two modes (full 3-step flow or simplified mobile version)
- **Kiosk** (`src/apps/Kiosk.tsx`): Self-service customer interface
- **TV** (`src/apps/TV.tsx`): Public order status display
- **Admin** (`src/apps/Admin.tsx`): Backoffice for products, inventory, reports, promotions

### Backend Abstraction Pattern

The app uses a backend abstraction layer (`src/services/backend/backend.ts`) that provides a unified interface for both Supabase and local/mock storage:

```typescript
// BackendInterface in backend.ts provides methods like:
- loadInitialState()
- upsertProduct(), deleteProduct()
- upsertOrder()
- subscribeToChanges() // For real-time sync
```

The `backend` object automatically detects if Supabase is configured (via env vars) and switches between:
- **Supabase mode**: Full PostgreSQL persistence with Realtime subscriptions
- **Local mode**: In-memory data with localStorage persistence for settings

### State Management (Zustand)

Global state is managed via Zustand in `src/store.ts`. Key patterns:

- **Cart state**: `cart`, `cartTotals`, actions like `addToCart()`, `removeFromCart()`
- **Order management**: `orders`, `createOrder()`, `updateOrderStatus()`
- **Catalog**: `products`, `ingredients`, `promotions`
- **Shift management**: `currentShift`, `openShift()`, `closeShift()`, `addShiftTransaction()`
- **Store session**: `currentSession` for business day tracking

All state mutations that need persistence call backend methods with `.catch()` for fire-and-forget async operations.

### Promotion Engine

Complex discount rules are calculated in `src/services/promotionEngine.ts`:

- Supports `FIXED_PRICE_BUNDLE` (e.g., "2 burgers for $15")
- Supports `BOGO` and `PERCENTAGE_OFF` types
- Items are expanded by quantity and marked as "used" by promotions
- Discounts calculated by priority order

### Real-time Synchronization

When using Supabase, the app subscribes to PostgreSQL changes:
- Orders table: Syncs order status across all terminals
- Store sessions: Syncs business day open/close status
- Subscriptions handled in `initializeBackend()` in store.ts

### Role-Based Access Control

User roles defined in `src/types.ts`: `ADMIN`, `MANAGER`, `CASHIER`, `KITCHEN`
- Access control implemented in `App.tsx` menu screen
- Login uses PIN-based authentication with mock users (MOCK_USERS in mockData.ts)

### Database Schema (Supabase)

SQL scripts in `/supabase/`:
- `schema.clean.sql`: Table definitions
- `schema.rls.sql`: Row Level Security policies
- `schema.realtime.sql`: Realtime publication setup

Key tables: `products`, `ingredients`, `orders`, `shifts`, `store_sessions`, `stock_logs`, `promotions`, `scouts`

## Environment Configuration

Create `.env.local` with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

If env vars are missing, the system automatically falls back to Mock Mode.

## Key Files

- `src/types.ts`: All TypeScript interfaces and enums (source of truth)
- `src/store.ts`: Zustand store with all state and actions
- `src/services/backend/backend.ts`: Backend abstraction layer
- `src/services/promotionEngine.ts`: Discount calculation logic
- `src/App.tsx`: Module router and login screen
- `src/components/ui.tsx`: Shared UI components (Button, Card, Modal, etc.)

## Component Organization

Components are organized by module:
- `src/components/pos/`: POS-specific components
- `src/components/kds/`: KDS components
- `src/components/kiosk/`: Kiosk components
- `src/components/admin/`: Admin panel components
- `src/components/ui.tsx`: Shared UI primitives

## Testing

Uses Vitest with React Testing Library. Tests are in:
- `src/**/*.test.ts`
- `src/**/*.test.tsx`

Currently minimal test coverage - only basic sanity tests exist.

## Important Patterns

1. **Cart items** extend Product with `cartId` (unique instance ID), `selectedModifiers`, and `note`
2. **Orders** contain a snapshot of cart items and calculated totals (subtotal, discount, total)
3. **Shift transactions** track cash movements (OPENING, SALE, DROP, ADD, REIMBURSEMENT, CLOSING)
4. **Inventory**: Products can have a recipe (ingredient BOM) for automatic stock deduction on sale
5. **Scouts**: System supports scout/escoteiro profiles for association tracking
