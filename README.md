# 🌿 Green Mood CBD Shop — Site Vitrine & E-commerce

> Application web e-commerce premium pour une boutique CBD physique, avec système Click & Collect, livraison, fidélité, codes promo, bundles et cross-selling.

---

## 📖 Présentation du Projet

**Green Mood CBD Shop** est une Single Page Application (SPA) conçue pour une boutique physique de CBD. La plateforme vise à présenter l'univers premium de la marque, rassurer les clients sur la qualité et la légalité des produits, et générer des ventes en ligne (**Click & Collect / Livraison**) ainsi que du trafic en boutique.

---

## 🛠️ Stack Technique

| Catégorie | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, TypeScript |
| **Styling** | Tailwind CSS v4, Framer Motion, Lucide React |
| **État global** | Zustand (auth, panier, paramètres) |
| **Routage** | React Router v7 |
| **Backend / BaaS** | Supabase (PostgreSQL, Auth, RLS, Storage) |
| **Paiement** | Viva Wallet (placeholder — mode simulation) |

---

## ✨ Fonctionnalités

### 🛍️ Boutique & Catalogue
- **Vitrine premium** : page d'accueil animée centrée sur l'innovation **N10** avec splash screen vidéo
- **Catalogue dynamique N10 & CBD** : fleurs, résines, huiles et molécules de synthèse maîtrisée (N10)
- **Fiche produit immersive** : galerie, specs moléculaires (N10 %, CBD %, THC), badges de pureté, avis vérifiés
- **Recherche & filtres intelligents** par catégorie et puissance (N10)

### 🛒 Panier & Commande
- **Sidebar panier** interactive (glassmorphism, animations Framer Motion)
- Toggle **Click & Collect / Livraison** avec pill glissante animée
- **Jauge livraison offerte** (`FreeShippingGauge`) avec barre de progression
- **Checkout complet** : adresses multiples, résumé commande, simulation paiement

### 🎟️ Codes Promo
- Saisie de code promo dans le checkout avec validation Supabase en temps réel
- Types : **pourcentage** (%) ou **montant fixe** (€)
- Vérifications : expiration, nombre max d'utilisations, commande minimum
- Compteur `uses_count` incrémenté automatiquement à la validation

### 💖 Fidélité & Rétention
- **Points de fidélité** : 1 point par euro dépensé, convertibles en réduction (100 pts = 5 €)
- Historique des transactions (`loyalty_transactions`) : gains, utilisations
- Affichage du solde sur la page compte et dans le checkout
- **Abonnements produits** (huiles) : fréquence hebdo / bimensuelle / mensuelle

### 📦 Packs & Bundles
- Produits de type **Bundle** (`is_bundle`) composés de plusieurs articles
- Stock synchronisé automatiquement via trigger PostgreSQL (`sync_bundle_stock`)
- Affichage **prix barré + économie réalisée** en violet sur les cartes et fiches
- Section "Contenu du Pack" sur la fiche produit avec liens vers chaque composant

### 🔄 Cross-Selling
- Section **"Vous aimerez aussi"** en bas de chaque fiche produit
- Recommandations **explicites** configurables par l'admin (table `product_recommendations`)
- **Fallback automatique** : même catégorie si pas de recommandation configurée
- Skeleton animé pendant le chargement + quick-add panier sur chaque carte

### 👤 Comptes Utilisateurs
- Inscription / connexion / déconnexion (Supabase Auth)
- Page compte premium avec avatar initiales, badge vérifié, stats de fidélité
- Gestion des adresses de livraison
- Historique des commandes + suivi statut
- Gestion des abonnements

### ⭐ Avis Clients
- Système **reviews** liés à un achat vérifié
- Notation par étoiles (1–5), commentaire, badge "Achat vérifié"
- Validation manuelle par l'admin avant publication

---

## 🔧 Panneau d'Administration

Accessible sur `/admin` (compte `is_admin = true` requis).

| Onglet | Description |
|---|---|
| **Dashboard** | CA total, commandes du jour, alertes stock bas |
| **Produits** | CRUD complet avec upload image Supabase Storage |
| **Catégories** | Gestion des catégories avec ordre d'affichage |
| **Commandes** | Mise à jour des statuts (pending → livré) |
| **Stock** | Ajustements manuels + historique mouvements |
| **Clients** | Liste des profils, passage en admin |
| **Codes Promo** | Création, édition, toggle actif/inactif, suivi utilisations |
| **Cross-Selling** | Configuration des recommandations produits par produit |
| **Abonnements** | Suivi des abonnements actifs |
| **Avis** | Modération des avis clients |
| **Analytique** | Tableaux de bord, graphiques |
| **Paramètres** | Horaires, adresse, frais de port, bannière, réseaux sociaux |

---

## 🗄️ Schéma Base de Données

```
categories         → produits classés par type
products           → catalogue avec is_bundle, original_value
bundle_items       → articles composant un pack
product_recommendations → cross-selling explicite
orders             → commandes avec promo_code, promo_discount
order_items        → lignes de commande
addresses          → adresses de livraison par utilisateur
profiles           → profils utilisateurs + loyalty_points
loyalty_transactions → historique points de fidélité
promo_codes        → codes promo avec règles et compteurs
subscriptions      → abonnements produits récurrents
reviews            → avis clients vérifiés
stock_movements    → historique mouvements de stock
store_settings     → paramètres dynamiques de la boutique
```

---

## 📋 Prérequis

- **Node.js** v18+ (v22+ recommandé)
- **npm**, **yarn** ou **pnpm**
- Un projet **Supabase** configuré

---

## 🚀 Installation & Configuration

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/votre-nom-utilisateur/Green-Moon-project.git
   cd Green-Moon-project
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Variables d'environnement :**
   ```bash
   cp .env.example .env
   ```
   Renseigner dans `.env` :
   ```env
   VITE_SUPABASE_URL=url_de_votre_projet_supabase
   VITE_SUPABASE_ANON_KEY=clé_anon_de_votre_projet_supabase
   ```

4. **Initialisation de la base de données :**
   Exécutez `supabase/migration.sql` en intégralité dans l'éditeur SQL de votre projet Supabase.  
   Ce script crée les tables, les politiques RLS, les triggers, fonctions PostgreSQL et les données de démonstration.

---

## 💻 Lancer le projet

**Développement :**
```bash
npm run dev
# → http://localhost:3000
```

**Production :**
```bash
npm run build
npm run preview
```

---

## 📁 Structure du Projet

```
/
├── public/                    # Ressources statiques (splash.mp4, logo.jpeg…)
├── src/
│   ├── components/
│   │   ├── admin/             # Onglets admin (Promo, Cross-selling, Reviews…)
│   │   ├── CartSidebar.tsx    # Sidebar panier glassmorphism
│   │   ├── FreeShippingGauge.tsx  # Jauge livraison offerte
│   │   ├── PromoCodeInput.tsx # Saisie code promo
│   │   ├── RelatedProducts.tsx # Cross-selling fiche produit
│   │   └── …                 # Layout, SEO, StockBadge, StarRating…
│   ├── lib/
│   │   ├── supabase.ts        # Client Supabase
│   │   └── types.ts           # Interfaces TypeScript (Product, BundleItem…)
│   ├── pages/
│   │   ├── Admin.tsx          # Panneau admin complet (12 onglets)
│   │   ├── Checkout.tsx       # Tunnel de commande avec promos & fidélité
│   │   ├── ProductDetail.tsx  # Fiche produit + avis + bundle + cross-selling
│   │   └── …                 # Home, Catalogue, Cart, Account, Orders…
│   ├── store/
│   │   ├── authStore.ts       # Authentification & profil
│   │   ├── cartStore.ts       # Panier, livraison, totaux
│   │   └── settingsStore.ts   # Paramètres boutique dynamiques
│   ├── App.tsx                # Routage global
│   └── index.css              # Design system (tokens, animations, glows)
├── supabase/
│   └── migration.sql          # Schéma complet + données de démonstration
└── package.json
```

---

## 🔐 Variables d'Environnement

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) et `.cursorrules` pour les conventions de code et le workflow de PR.

---

---

## 🗺️ Roadmap : L'Ascension Green Mood

### 🎯 Phase 1 : Fondations (Terminé)
- Architecture React 19 / Vite 6 / Supabase.
- Design System Glassmorphism & Micro-animations.

### 🧪 Phase 2 : L'Ère N10 (En Cours)
- Lancement de la gamme **N10** (plus puissant que le CBNO).
- Hub éducatif sur les cannabinoides de synthèse maîtrisée.
- IA BudTender pour recommandations personnalisées.

### 🚀 Phase 3 : Scale & Global (V1+)
- Intégration Viva Wallet Production.
- SEO international & logistique automatisée.

---

## 📄 Licence
Ce projet est sous licence **MIT**.

