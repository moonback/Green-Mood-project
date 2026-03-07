<p align="center">
  <img src="public/header.png" alt="Green Mood CBD Header" width="100%" />
</p>

<p align="center">
  <img src="public/logo.png" alt="Green Mood CBD" width="140" />
</p>

<h1 align="center">🌿 Green Mood CBD — Boutique Premium & Innovation N10</h1>

<p align="center">
  <strong>Plateforme e-commerce premium de CBD avec conseiller IA intégré (BudTender).</strong><br/>
  Conçue pour les boutiques physiques souhaitant digitaliser leur activité via Click & Collect, livraison et point de vente (POS).<br/>
  L'application offre une expérience immersive avec recherche sémantique vectorielle, chat IA et conseiller vocal en temps réel.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-purple?logo=vite" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-blue?logo=tailwindcss" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## 📖 Présentation

**Green Mood CBD** est une application e-commerce SPA (Single Page Application) conçue pour une boutique physique de CBD premium. Elle permet aux clients de parcourir le catalogue, recevoir des conseils personnalisés de l'IA BudTender (chat texte et voix), passer commande en Click & Collect ou en livraison, et gérer leur compte fidélité. Les administrateurs disposent d'un back-office complet avec POS intégré, analytics et gestion avancée des produits, stocks et commandes.

---

## 🛠 Stack Technique

| Technologie | Rôle | Version |
|---|---|---|
| **React** | Framework frontend (SPA) | 19.0.0 |
| **TypeScript** | Langage principal | ~5.8.2 |
| **Vite** | Build tool & dev server | ^6.2.0 |
| **Tailwind CSS** | Framework CSS utilitaire | v4.1.14 |
| **Zustand** | Gestion d'état global | ^5.0.11 |
| **React Router DOM** | Routage client-side | ^7.13.1 |
| **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, Storage, RLS) | ^2.98.0 |
| **Google Gemini** | IA générative — voix temps réel (Live API) | ^1.29.0 |
| **OpenRouter** | LLM chat (BudTender), embeddings vectoriels | API REST |
| **Framer Motion** | Animations & transitions | ^12.23.24 |
| **Lucide React** | Bibliothèque d'icônes | ^0.546.0 |
| **Recharts** | Graphiques analytics admin | ^3.7.0 |
| **React Markdown** | Rendu Markdown dans le chat | ^10.1.0 |
| **PapaParse** | Import CSV de produits | ^5.5.3 |
| **Viva Wallet** | Passerelle de paiement | API REST |
| **pgvector** | Recherche sémantique vectorielle (PostgreSQL) | Extension |

---

## ✨ Fonctionnalités

### 👤 Utilisateurs (Client)

- **Catalogue en ligne** — parcours par catégories (Fleurs, Résines, Huiles, Infusions), filtres, tri, recherche sémantique
- **Fiches produit détaillées** — CBD %, arômes, bénéfices, avis vérifiés, produits complémentaires
- **Panier persistant** — avec jauges de livraison gratuite, suggestions panier vide, codes promo
- **Checkout complet** — Click & Collect ou livraison, intégration Viva Wallet
- **Compte utilisateur** — profil, commandes, adresses, favoris
- **Programme fidélité** — points gagnés/dépensés, historique des transactions
- **Programme parrainage** — codes uniques `GRN-XXXXXX`, bonus bienvenue, suivi
- **Abonnements** — livraisons récurrentes (hebdo / bi-mensuel / mensuel)
- **Avis produits** — notation 5 étoiles, commentaires, modération admin
- **🤖 BudTender IA (chat texte)** — quiz guidé + conversation libre, mémoire client
- **🎙 BudTender IA (voix)** — conseiller vocal temps réel via Gemini Live Audio API
- **Guides CBD** — articles SEO (huile, dosage, sommeil, anxiété, légalité)
- **PWA** — installable, Service Worker, mode offline partiel
- **SEO avancé** — sitemaps, schema.org, meta tags dynamiques, robots.txt AI-friendly

### 🔒 Administrateurs

- **Dashboard** — KPIs temps réel (revenue, commandes, clients)
- **Gestion produits** — CRUD complet, import CSV, upload images, génération IA des descriptions
- **Gestion catégories** — CRUD, réorganisation, icônes
- **Gestion commandes** — suivi statuts, mise à jour, détail
- **Gestion stocks** — mouvements, alertes de réapprovisionnement
- **POS (Point de Vente)** — caisse enregistreuse intégrée, scan code-barres, création client walk-in, rapports de clôture Z (avec réconciliation caisse)
- **Codes promo** — création, limites d'usage, expiration
- **Bundles / Packs** — création de packs avec synchronisation automatique du stock
- **Cross-selling** — recommandations manuelles + fallback automatique par catégorie
- **Analytics** — graphiques revenus, top produits, statuts commandes, acquisition clients
- **Gestion avis** — modération, publication/suppression
- **Gestion abonnements** — vue d'ensemble, pause/annulation
- **Gestion parrainages** — suivi, validation des récompenses
- **Configuration BudTender** — modèle IA, température, quiz customisable, seuils restock
- **Paramètres boutique** — bannière, horaires, frais livraison, activations fonctionnalités

### ⚙️ Système / Backend

- **Authentification Supabase** — email/password avec GoTrue, auto-création profil via trigger
- **Row Level Security (RLS)** — politiques granulaires sur toutes les tables
- **Recherche vectorielle** — pgvector (3072 dims), embeddings via OpenRouter / Gemini
- **Fonctions RPC PostgreSQL** — `match_products`, `sync_bundle_stock`, `create_pos_customer`, `increment_promo_uses`, `get_product_recommendations`
- **Triggers BD** — auto-sync stocks bundles, auto-génération codes parrainage
- **Storage Supabase** — bucket `product-images` avec upload admin
- **Caching multi-niveaux** — TTL cache produits (5 min), settings (2 min), LRU embeddings (50 entrées)
- **Service Worker** — stratégie Stale-While-Revalidate, exclusion appels API

---

## 🚀 Installation

### Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9
- Un projet **Supabase** configuré (avec pgvector activé)
- Clés API : **Gemini**, **OpenRouter**, **Viva Wallet** (optionnel)

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-org/Green-Moon-project.git
cd Green-Moon-project

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# 4. Initialiser la base de données
# Exécuter supabase/migration.sql dans Supabase SQL Editor
# Puis exécuter les migrations incrémentales (v3 à v9) dans l'ordre

# 5. (Optionnel) Synchroniser les embeddings vectoriels
npx tsx scripts/sync-embeddings.ts

# 6. (Optionnel) Générer les sitemaps
npx tsx scripts/generate-sitemap.ts
```

---

## ▶️ Lancement

### Développement

```bash
npm run dev
# → http://localhost:3000
```

### Production

```bash
npm run build
npm run preview
```

### Autres commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur Vite en mode développement (port 3000) |
| `npm run build` | Build de production (`dist/`) |
| `npm run preview` | Preview du build de production |
| `npm run clean` | Supprime le dossier `dist/` |
| `npm run lint` | Vérification TypeScript sans émission |

---

## 🔑 Variables d'environnement

| Variable | Rôle | Obligatoire |
|---|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ |
| `VITE_GEMINI_API_KEY` | Clé API Gemini (voix temps réel) | ✅ |
| `VITE_OPENROUTER_API_KEY` | Clé API OpenRouter (chat + embeddings) | ✅ |
| `VITE_OPENROUTER_EMBED_MODEL` | Modèle d'embedding (défaut: `openai/text-embedding-3-small`) | ❌ |
| `VITE_OPENROUTER_EMBED_DIMENSIONS` | Dimensions embeddings (défaut: `768`) | ❌ |
| `VITE_VIVA_WALLET_BASE_URL` | URL base Viva Wallet | ❌ |
| `VITE_VIVA_CLIENT_ID` | Client ID Viva Wallet | ❌ |
| `VITE_VIVA_CLIENT_SECRET` | Client Secret Viva Wallet | ❌ |
| `VIVA_MERCHANT_ID` | Merchant ID Viva Wallet | ❌ |
| `VIVA_API_KEY` | Clé API Viva Wallet | ❌ |
| `GEMINI_API_KEY` | Clé Gemini (server-side / AI Studio) | ❌ |
| `APP_URL` | URL de l'application déployée | ❌ |

---

## 📂 Structure du projet

```
Green-Moon-project/
├── public/                  # Assets statiques, PWA, sitemaps, CSV
├── scripts/                 # Scripts utilitaires (sitemap, embeddings)
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── admin/           # 19 onglets du back-office admin
│   │   └── budtender-ui/    # Composants UI du BudTender
│   ├── hooks/               # Hooks personnalisés (mémoire IA, voix)
│   ├── lib/                 # Types, utilitaires, Supabase, IA, SEO
│   │   └── seo/             # Builders meta, schema.org, links internes
│   ├── pages/               # Pages de l'application (27+)
│   │   └── guides/          # Pages guides CBD
│   ├── seo/                 # Provider SEO global
│   ├── store/               # Stores Zustand (auth, cart, settings, wishlist, toast)
│   ├── App.tsx              # Routage principal
│   ├── main.tsx             # Point d'entrée React
│   └── index.css            # Design system (thème, fonts, glow, glassmorphism)
├── supabase/                # Migrations SQL (v1 → v9)
├── docs/                    # Documentation fonctionnelle, PRD, audits
├── .cursorrules             # Règles de développement IA
├── vite.config.ts           # Configuration Vite
├── tsconfig.json            # Configuration TypeScript
└── package.json             # Dépendances & scripts
```

---

## 📄 Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 📚 Documentation complémentaire

- [ARCHITECTURE.md](ARCHITECTURE.md) — Architecture technique détaillée
- [API_DOCS.md](API_DOCS.md) — Documentation des endpoints et RPC
- [DB_SCHEMA.md](DB_SCHEMA.md) — Schéma de base de données complet
- [ROADMAP.md](ROADMAP.md) — Roadmap fonctionnelle
- [CONTRIBUTING.md](CONTRIBUTING.md) — Guide de contribution
