# Green Mood CBD (V2)

## Pitch
Green Mood CBD est une plateforme e-commerce CBD déjà en production fonctionnelle, avec un parcours client complet (catalogue, panier, commande, espace compte) et des modules opérationnels avancés côté équipe. Elle s’adresse aux boutiques CBD qui veulent centraliser vente en ligne, fidélisation client, et gestion interne (admin + POS) dans une même application. Sa proposition de valeur principale est de combiner expérience d’achat premium et assistant IA BudTender (texte + voix) connecté au catalogue réel.

## Badges
![Build](https://img.shields.io/badge/build-%C3%A0%20compl%C3%A9ter-lightgrey)
![Version](https://img.shields.io/badge/version-0.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Tech Stack

| Technology | Role | Version |
|------------|------|---------|
| React | Framework frontend | `^19.0.0` |
| TypeScript | Typage statique | `~5.8.2` |
| Vite | Build tool + dev server | `^6.2.0` |
| @vitejs/plugin-react | Intégration React pour Vite | `^5.0.4` |
| Tailwind CSS | Styling utilitaire | `^4.1.14` |
| @tailwindcss/vite | Plugin Tailwind pour Vite | `^4.1.14` |
| React Router DOM | Routing SPA | `^7.13.1` |
| Zustand | State management | `^5.0.11` |
| Supabase JS | Accès backend Supabase (Auth + DB) | `^2.98.0` |
| @google/genai | Intégration IA Gemini | `^1.29.0` |
| motion | Animations UI | `^12.23.24` |
| Lucide React | Icônes | `^0.546.0` |
| Recharts | Graphiques analytics | `^3.7.0` |
| PapaParse | Parsing/import CSV | `^5.5.3` |
| tsx | Exécution de scripts TypeScript | `^4.21.0` |

## Key Features
- Catalogue produit CBD avec pages détail et navigation dédiée (`/catalogue`, `/catalogue/:slug`).
- Tunnel e-commerce complet : panier, checkout, confirmation de commande.
- Espace client protégé : profil, adresses, commandes, abonnements, fidélité, favoris, avis, parrainage.
- Assistant IA BudTender avec logique conversationnelle et composant vocal temps réel.
- Backoffice administrateur multi-onglets : produits, catégories, commandes, stock, clients, analytics, promos, recommandations, abonnements, avis, parrainages, BudTender.
- Route POS dédiée (`/pos`) pour usage point de vente.
- SEO applicatif (provider + builders) et génération de sitemap.

## Prerequisites
- Node.js >= 18 (Node 20 LTS recommandé).
- npm (lockfile `package-lock.json` présent).
- Projet Supabase opérationnel (URL + anon key).
- Clés IA :
  - `VITE_GEMINI_API_KEY` (voice/assistant)
  - `VITE_OPENROUTER_API_KEY` (embeddings/recommandations)
- Optionnel : credentials Viva Wallet pour les flux de paiement configurés.

## Installation
1. Cloner le dépôt
```bash
git clone <repository-url>
cd Green-Mood-project
```

2. Installer les dépendances
```bash
npm install
```

3. Initialiser les variables d’environnement
```bash
cp .env.example .env
```

4. Renseigner les clés requises dans `.env` (voir section dédiée ci-dessous).

5. Lancer en développement
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Variable injectée dans `vite.config.ts` pour `process.env.GEMINI_API_KEY`. | Non |
| `VITE_GEMINI_API_KEY` | Clé Gemini utilisée côté app (assistant vocal) et scripts debug. | Oui (features IA) |
| `APP_URL` | URL publique applicative (documentée dans `.env.example`). | ⚠️ À compléter : usage exact non détecté dans le code frontend principal |
| `VITE_OPENROUTER_API_KEY` | Clé OpenRouter utilisée dans le BudTender et la génération d’embeddings côté app. | Oui (features vectorielles) |
| `VITE_OPENROUTER_EMBED_MODEL` | Modèle d’embedding OpenRouter (fallback codé). | Non |
| `VITE_OPENROUTER_EMBED_DIMENSIONS` | Dimensions des embeddings (fallback `768`). | Non |
| `VITE_SUPABASE_URL` | URL du projet Supabase. | Oui |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase. | Oui |
| `VITE_VIVA_WALLET_BASE_URL` | Base URL Viva Wallet (sandbox/prod). | Non |
| `VITE_VIVA_CLIENT_ID` | Identifiant client Viva Wallet. | Non |
| `VITE_VIVA_CLIENT_SECRET` | Secret client Viva Wallet. | Non |
| `VIVA_MERCHANT_ID` | Merchant ID Viva Wallet. | Non |
| `VIVA_API_KEY` | API key Viva Wallet. | Non |
| `OPENROUTER_API_KEY` | Clé OpenRouter utilisée dans `sync_vectors.ts`. | Non (scripts spécifiques) |
| `OPENROUTER_EMBED_MODEL` | Override modèle embedding pour script `sync_vectors.ts`. | Non |
| `OPENROUTER_SITE_URL` | Header `HTTP-Referer` pour `sync_vectors.ts`. | Non |
| `OPENROUTER_APP_NAME` | Header `X-Title` pour `sync_vectors.ts`. | Non |
| `DISABLE_HMR` | Désactive le HMR Vite si `true`. | Non |

## Running the Project
### Development
```bash
npm run dev
```
- Démarre Vite sur `0.0.0.0:3000`.

### Production build
```bash
npm run build
```
- Génère le build dans `dist/`.

### Preview build
```bash
npm run preview
```
- Sert localement le build de production.

## Scripts
| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Lance le serveur Vite (port 3000). |
| build | `npm run build` | Compile le frontend pour production. |
| preview | `npm run preview` | Prévisualise le build localement. |
| clean | `npm run clean` | Supprime `dist/`. |
| lint | `npm run lint` | Exécute `tsc --noEmit` (type-check). |

## API / Backend Notes
- L’application consomme directement Supabase via `@supabase/supabase-js` (pas de contrôleurs Express détectés dans le repository).
- Les opérations métier avancées côté base passent par des fonctions SQL/RPC (ex. recommandations, synchronisation de stock bundles, recherche vectorielle).
- ⚠️ À compléter : aucun dossier de routes HTTP backend dédié (type `/api`) n’est présent dans ce dépôt.

## Database
- Technologie : PostgreSQL via Supabase.
- Migrations SQL versionnées dans `supabase/`.
- Entités principales visibles dans les migrations : `categories`, `products`, `profiles`, `orders`, `order_items`, `addresses`, `store_settings`, `loyalty_transactions`, `subscriptions`, `subscription_orders`, `reviews`, `promo_codes`, `bundle_items`, `product_recommendations`, `referrals`, `wishlists`, `product_images`, `user_ai_preferences`, `budtender_interactions`, `pos_reports`.

## Authentication
- Authentification gérée via Supabase Auth (`signInWithPassword`, `signUp`, reset password, session sync).
- Guarding des routes avec `ProtectedRoute` et `AdminRoute`.

## Project Structure
```text
.
├── public/                  # Assets statiques + sitemap + fichiers PWA
├── scripts/                 # Scripts d’exploitation (embeddings, sitemap)
├── src/
│   ├── components/          # UI partagée + modules admin + BudTender UI
│   ├── hooks/               # Hooks custom (voix Gemini, mémoire BudTender)
│   ├── lib/                 # Clients, utilitaires, SEO, embeddings, types
│   ├── pages/               # Pages routées (shop, compte, admin, POS)
│   ├── store/               # Stores Zustand (auth, panier, settings, wishlist)
│   ├── seo/                 # Provider SEO
│   ├── App.tsx              # Définition des routes et guards
│   └── main.tsx             # Bootstrap React
└── supabase/                # Migrations SQL + scripts DB
```

## Third-Party Services
- Supabase (Auth, DB, policies, stockage).
- Google Gemini (assistant IA/voix + embeddings via scripts).
- OpenRouter (embeddings/LLM côté app et scripts).
- Viva Wallet (variables de configuration présentes).

## Deployment
- ⚠️ À compléter : aucun fichier de déploiement explicite détecté (`Dockerfile`, `vercel.json`, workflow CI/CD, etc.).

## Contributing
- Branches recommandées : `feat/*`, `fix/*`, `docs/*`.
- Ouvrir une PR avec : objectif, changements, validation (`npm run lint` minimum), et captures si UI impactée.
- Respecter les patterns existants React + TypeScript + Zustand.

## License
MIT — voir `LICENSE`.
