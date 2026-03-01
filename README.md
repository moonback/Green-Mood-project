# 🌿 Green Moon — E-commerce & Vitrine CBD Premium

> **Green Moon** est une plateforme e-commerce Single-Page Application (SPA) haut de gamme dédiée à l'univers du CBD et de l'innovation moléculaire N10. Conçue pour offrir une expérience immersive, elle intègre un conseiller IA (BudTender), un système complet de gestion de panier, et un panneau d'administration robuste.

---

## 🛠️ Stack Technique

| Technologie | Usage |
| :--- | :--- |
| **React 19** | Bibliothèque UI principale |
| **Vite 6** | Outil de build et serveur de développement ultra-rapide |
| **TypeScript** | Typage statique pour une meilleure maintenabilité |
| **Tailwind CSS 4** | Framework utilitaire pour le styling moderne |
| **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, RLS, Edge Functions) |
| **Zustand** | Gestion de l'état global (Auth, Panier, Favoris) |
| **Motion/React** | Animations fluides et micro-interactions |
| **OpenRouter** | API pour l'intelligence artificielle (BudTender) |

---

## ✨ Fonctionnalités Principales (MVP)

### 🏬 Expérience Client
- **Catalogue Immersif** : Navigation fluide entre Fleurs, Huiles, Résines et Bundles.
- **BudTender IA** : Conseiller interactif qui analyse vos besoins pour recommander les produits adaptés (avec mémoire persistante).
- **Gestion du Panier** : Click & Collect ou Livraison avec jauge de frais de port offerts.
- **Favoris (Wishlist)** : Liste de souhaits persistante pour sauvegarder ses produits coups de cœur.
- **Fidélité & Promo** : Système de points de fidélité (Loyalty) et validation de codes promo en temps réel.
- **Abonnements** : Gestion de livraisons récurrentes pour les huiles et produits essentiels.

### 🔐 Espace Membre
- **Authentification Sécurisée** : Via Supabase Auth.
- **Profil Utilisateur** : Gestion des adresses, historique des commandes, avis et abonnements.
- **Points Carats** : Suivi des points de fidélité gagnés lors des achats.

### 🛡️ Panneau d'Administration
- **Gestion du Catalogue** : CRUD complet des produits et catégories.
- **Suivi des Commandes** : Mise à jour des statuts et analytics de vente.
- **Modération des Avis** : Validation manuelle des retours clients avant publication.
- **Configuration Dynamique** : Gestion des bannières, horaires et frais de port via le `settingsStore`.

---

## 📋 Prérequis

- **Node.js** v18+ (v22+ recommandé)
- **Supabase Account** : Un projet actif sur [supabase.com](https://supabase.com)
- **OpenRouter API Key** : Pour les fonctionnalités d'IA (facultatif pour le fonctionnement de base)

---

## 🚀 Installation & Configuration

1. **Clonage du dépôt** :
   ```bash
   git clone https://github.com/Mayssa/Green-Moon-project.git
   cd Green-Moon-project
   ```

2. **Installation des dépendances** :
   ```bash
   npm install
   ```

3. **Variables d'environnement** :
   Copiez le fichier `.env.example` vers `.env` et remplissez vos identifiants Supabase et OpenRouter :
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
   VITE_OPENROUTER_API_KEY=votre_cle_openrouter
   ```

4. **Initialisation de la base de données** :
   Importez le contenu de `supabase/migration.sql` et `supabase/migration_v2.sql` dans l'éditeur SQL de votre dashboard Supabase.

---

## 💻 Lancement

### Développement
```bash
npm run dev
# Accès : http://localhost:3000
```

### Production
```bash
npm run build
npm run preview
```

---

## 📁 Structure du Projet

```text
/
├── public/                # Assets statiques (vidéos, images, favicon)
├── src/
│   ├── components/        # Composants UI réutilisables (ProductCard, BudTender, etc.)
│   │   ├── admin/         # Onglets spécifiques au panneau admin
│   │   └── budtender-ui/  # Sous-composants pour l'interface IA
│   ├── hooks/             # Hooks personnalisés (useBudTenderMemory, etc.)
│   ├── lib/               # Clients API et interfaces TypeScript (supabase, types)
│   ├── pages/             # Pages entières (Home, Catalog, Favorites, Account...)
│   ├── store/             # Stores Zustand pour l'état global
│   ├── App.tsx            # Routage principal
│   └── index.css          # Design system et utility classes
├── supabase/              # Scripts de migration SQL
├── vite.config.ts         # Configuration Vite
└── README.md              # Document principal
```

---

## 🤝 Contribution

Nous encourageons les contributions ! Avant de commencer :
1. Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour les règles de style.
2. Créez une branche descriptive : `git checkout -b feat/nom-de-la-feature`.
3. Assurez-vous que le linting passe : `npm run lint`.

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](./LICENSE) (ou la mention standard) pour plus de détails.
