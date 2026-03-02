# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Green Moon** (Green Mood CBD Shop) is a full-featured e-commerce SPA for a physical CBD store in France. It includes an online catalog, AI-powered product assistant (BudTender), loyalty/referral programs, subscriptions, and an in-store Point-of-Sale (POS) terminal.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run lint      # TypeScript type-check (no emit)
npm run clean     # Remove /dist
```

No test runner is configured. Type-checking via `npm run lint` is the primary code validation tool.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | TailwindCSS v4 (via `@tailwindcss/vite` plugin) |
| Routing | React Router DOM v7 |
| State | Zustand v5 |
| Animations | `motion` (Framer Motion) |
| Icons | `lucide-react` exclusively |
| Charts | Recharts |
| Backend/DB | Supabase (PostgreSQL + GoTrue auth + RLS) |
| AI | Google GenAI SDK (OpenRouter/Gemini 2.0) |
| Payment | Viva Wallet |

## Architecture

### Routing (src/App.tsx)
Three route groups:
- **Admin routes** (`/admin`, `/pos`) — wrapped in `<AdminRoute>`, no header/footer layout
- **Public layout routes** — wrapped in `<Layout>` with header/footer
- **Protected routes** (`/commande`, `/compte/*`) — wrapped in `<ProtectedRoute>` inside Layout

Route guards: [src/components/AdminRoute.tsx](src/components/AdminRoute.tsx) requires `is_admin = true` in profile. [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) requires any authenticated user.

### State Management
Zustand stores in [src/store/](src/store/):
- `authStore.ts` — session, profile, `initialize()` called once at app start
- `cartStore.ts` — cart items with localStorage persistence
- `settingsStore.ts` — global config fetched from `store_settings` table
- `toastStore.ts` — notification queue
- `wishlistStore.ts` — user favorites

**Rule:** Zustand for global/shared state only. Use `useState`/`useReducer` for local UI state (modals, tabs, etc.).

### Data Access Pattern
There is **no custom API server**. All data access goes through `@supabase/supabase-js` directly from the client. Wrap every Supabase call in `try/catch`. Heavy aggregations should use PostgreSQL Views or RPC functions, not client-side computation.

```ts
// Typical pattern in pages
const [data, setData] = useState<MyType[]>([]);
useEffect(() => {
  const fetch = async () => {
    try {
      const { data, error } = await supabase.from('table').select('*');
      if (error) throw error;
      setData(data);
    } catch (err) { /* set error state */ }
  };
  fetch();
}, []);
```

### TypeScript Types
All DB entity interfaces are defined in [src/lib/types.ts](src/lib/types.ts). **Always keep this file in sync with DB schema changes. Never use `any`.**

### Supabase Client
Initialized in [src/lib/supabase.ts](src/lib/supabase.ts). The Service Role Key must never appear in frontend code — only `VITE_SUPABASE_ANON_KEY` (public) is exposed.

## Database Migrations

Migrations live in [supabase/](supabase/) and must be applied in order:
1. `migration.sql` — base schema (products, orders, profiles, loyalty, etc.)
2. `migration_v2.sql` — wishlists, product images, bundles
3. `migration_v3_referrals.sql` — referral system
4. `migration_v4_budtender_sync.sql` — AI memory sync
5. `migration_v5_pos_reports.sql` — POS reports table
6. `migration_v6_pos_features.sql` — POS additional features
7. `migration_v7_pos_reports_reconciliation.sql` — cash counting & product breakdown

**Workflow for new tables:** Add SQL to a new `migration_vN.sql` → add TypeScript interface to `src/lib/types.ts` → implement Supabase query in store or page component.

All tables use **Row Level Security (RLS)**. Admins bypass RLS via policy checks on `is_admin` in `profiles`.

## File Organization Conventions

```
src/
  components/   # Reusable UI components (PascalCase filenames)
  pages/        # Full page views, one per route (PascalCase)
  store/        # Zustand store slices (camelCase: authStore.ts)
  lib/          # supabase.ts, types.ts, utilities, AI prompts
  hooks/        # Custom React hooks (camelCase: useBudTenderMemory.ts)
```

**Naming:** `PascalCase` for components/pages, `camelCase` for hooks/stores/utils, `kebab-case` for URLs and CSS custom properties.

## Key Components to Know

- [src/components/BudTender.tsx](src/components/BudTender.tsx) — AI chatbot (large, ~65KB); uses `src/lib/budtenderPrompts.ts` and `src/hooks/useBudTenderMemory.ts`
- [src/components/AdminPOSTab.tsx](src/components/AdminPOSTab.tsx) — POS terminal UI (largest file, ~118KB)
- [src/pages/Admin.tsx](src/pages/Admin.tsx) — Admin dashboard shell with tab routing
- [src/pages/POSPage.tsx](src/pages/POSPage.tsx) — Standalone POS page (no layout)

## Environment Variables

Required in `.env` (see `.env.example`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VIVA_WALLET_BASE_URL=
VITE_VIVA_CLIENT_ID=
VITE_VIVA_CLIENT_SECRET=
VIVA_MERCHANT_ID=
VIVA_API_KEY=
GEMINI_API_KEY=
APP_URL=
```

Only `VITE_*` prefixed variables are accessible in the browser bundle.

## Coding Rules

- Functional components and hooks only — no class components
- Explicit prop destructuring: `({ title, value }: Props)` — no implicit `props` parameter
- Icons: `lucide-react` only (not Heroicons, FontAwesome)
- Animations: `motion` (Framer Motion) for transitions and hover effects
- CSS: TailwindCSS utility classes — avoid custom CSS unless absolutely necessary
- No Redux — Zustand only
