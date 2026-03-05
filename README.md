# Green Mood CBD (V2)

## Project Overview
Green Mood CBD is a production-grade CBD e-commerce platform that combines a modern storefront, customer lifecycle features, and AI-assisted shopping guidance. It serves both end customers (discovery, checkout, loyalty, subscriptions) and internal teams (admin operations, analytics, and POS) in a single integrated system.

The platform is designed for CBD brands and retailers that need a premium digital commerce experience with operational tooling and an intelligent "BudTender" advisor.

## Tech Stack

### Frontend
- **React 19** + **TypeScript**
- **Vite 6** (build/dev tooling)
- **React Router 7** (routing)
- **Zustand** (state management)

### Styling & UI
- **Tailwind CSS 4**
- **Motion** (`motion/react`) for animations
- **Lucide React** for iconography
- Global CSS via `src/index.css`

### AI & Recommendations
- **Google Gemini** (`@google/genai`) for live voice assistant workflows
- **OpenRouter** embeddings/LLM integration for recommendation/vector flows

### Backend & Data
- **Supabase** (`@supabase/supabase-js`): Auth, PostgreSQL, Storage, RLS-backed data access
- SQL migrations maintained in `supabase/`

### Tooling & Utilities
- **TypeScript compiler** for static checks
- **tsx** for running TS scripts
- **PapaParse** for CSV import workflows
- **Recharts** for dashboard analytics

## Key Features (Current V2)
- Full CBD e-commerce flow: catalog, product detail pages, cart, checkout, and order confirmation.
- Customer account area: profile, addresses, order history, favorites, reviews, loyalty history, referrals, and subscriptions.
- AI BudTender assistant with text + voice-oriented interaction and recommendation support.
- Admin backoffice with multi-tab management for products, categories, orders, stock, customers, referrals, promo codes, recommendations, subscriptions, reviews, analytics, and store settings.
- POS (Point of Sale) dedicated route for in-store operations.
- SEO and content features including guides pages and sitemap generation scripts.

## Project Structure

```text
.
├── public/                   # Static assets, PWA files, sitemap outputs, CSV samples
├── scripts/                  # Operational scripts (e.g., embeddings sync, sitemap generation)
├── src/
│   ├── components/           # Reusable UI and domain components
│   │   ├── admin/            # Admin dashboard feature tabs/components
│   │   └── budtender-ui/     # BudTender chat/interaction UI units
│   ├── hooks/                # Custom hooks (voice AI, BudTender memory)
│   ├── lib/                  # API clients, domain utilities, embeddings, SEO helpers
│   ├── pages/                # Route-level pages (shop, account, admin, POS, guides)
│   ├── seo/                  # SEO provider setup
│   ├── store/                # Zustand stores (auth, cart, settings, wishlist, toast)
│   ├── App.tsx               # Central route map and guards
│   └── main.tsx              # Application bootstrap
├── supabase/                 # SQL migrations and DB maintenance scripts
├── ARCHITECTURE.md           # Technical architecture notes
├── DB_SCHEMA.md              # Database schema reference
├── API_DOCS.md               # API and integration notes
└── package.json              # Dependencies and scripts
```

## Prerequisites
- **Node.js**: 18+ recommended (20 LTS preferred)
- **Package manager**: `npm` (lockfile included)
- **Supabase project**: required for Auth, DB, and data-driven features
- **AI keys**:
  - Google Gemini API key (voice assistant / AI flows)
  - OpenRouter key (embeddings/recommendation-related flows)
- **Optional payment configuration**: Viva Wallet credentials for payment integrations

## Installation
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Green-Mood-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then update `.env` with your project values.

4. **Run development server**
   ```bash
   npm run dev
   ```

## Environment Variables
Detected from `.env.example`, Vite config, and runtime scripts.

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Server-side Gemini key injection alias used in Vite define/runtime contexts. | Optional (context-dependent) |
| `VITE_GEMINI_API_KEY` | Browser-side Gemini key used for live voice/BudTender features. | Yes (for AI features) |
| `APP_URL` | Base public URL used in hosted/runtime integration contexts. | Optional |
| `VITE_OPENROUTER_API_KEY` | OpenRouter key for embeddings/LLM calls from app logic. | Yes (for recommendation/vector features) |
| `VITE_OPENROUTER_EMBED_MODEL` | Embedding model name (default provided in code). | No |
| `VITE_OPENROUTER_EMBED_DIMENSIONS` | Embedding vector dimensionality (default `768`). | No |
| `VITE_SUPABASE_URL` | Supabase project URL. | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key. | Yes |
| `VITE_VIVA_WALLET_BASE_URL` | Viva Wallet API base URL (sandbox/prod). | Optional |
| `VITE_VIVA_CLIENT_ID` | Viva Wallet client identifier. | Optional |
| `VITE_VIVA_CLIENT_SECRET` | Viva Wallet client secret. | Optional |
| `VIVA_MERCHANT_ID` | Viva Wallet merchant identifier. | Optional |
| `VIVA_API_KEY` | Viva Wallet API key. | Optional |
| `OPENROUTER_API_KEY` | Script-level OpenRouter key for local sync tooling. | Optional (scripts) |
| `OPENROUTER_EMBED_MODEL` | Script-level override for embedding model. | Optional |
| `OPENROUTER_SITE_URL` | Referer value for OpenRouter requests in sync scripts. | Optional |
| `OPENROUTER_APP_NAME` | App name header for OpenRouter script calls. | Optional |
| `DISABLE_HMR` | Disable Vite HMR if set to `true`. | Optional |

## Running the Project

### Development
```bash
npm run dev
```
Runs Vite dev server on `0.0.0.0:3000`.

### Production Build
```bash
npm run build
```
Generates optimized production assets in `dist/`.

### Preview Production Build
```bash
npm run preview
```
Serves the built output locally for verification.

## Scripts
- `npm run dev` — start development server on port 3000.
- `npm run build` — create production build.
- `npm run preview` — preview built app.
- `npm run clean` — remove `dist/`.
- `npm run lint` — TypeScript type-check (`tsc --noEmit`).

## Contributing
1. Create a branch from `main` (recommended naming):
   - `feat/<short-description>`
   - `fix/<short-description>`
   - `docs/<short-description>`
2. Keep changes focused and include tests/type checks where relevant.
3. Follow the existing TypeScript/React patterns and folder organization.
4. Open a Pull Request with:
   - clear problem statement,
   - implementation summary,
   - test/validation notes,
   - screenshots for UI changes when applicable.

For additional conventions, see `CONTRIBUTING.md` if your team extends contribution policies.

## License
This project is licensed under the **MIT License**. See `LICENSE` for details.
