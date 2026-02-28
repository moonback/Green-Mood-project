# 🌿 Green Mood CBD Shop - Site Vitrine & E-commerce

## 📖 Présentation du Projet
**Green Mood CBD Shop** est une application web moderne (Single Page Application) conçue pour une boutique physique de CBD. La plateforme vise à présenter l'univers premium de la marque, à rassurer les clients sur la qualité et la légalité des produits, et à générer des ventes en ligne (Click & Collect / Livraison) ainsi que du trafic en boutique (Web-to-Store).

## 🛠️ Stack Technique
- **Cœur Frontend** : React 19, Vite 6, TypeScript
- **Styling** : Tailwind CSS v4, Framer Motion (pour les animations), Lucide React (pour les icônes)
- **Gestion d'État** : Zustand (Authentification, Panier, Paramètres)
- **Routage** : React Router v7
- **Base de données & Backend (BaaS)** : Supabase (PostgreSQL, Authentification, Row Level Security)
- **Autres utilitaires** : express, better-sqlite3

## ✨ Fonctionnalités Principales (MVP)
- **Vitrine Premium** : Page d'accueil responsive et animée mettant en valeur la marque.
- **Catalogue de Produits** : Produits CBD dynamiques récupérés depuis la base de données (Fleurs, Résines, Huiles).
- **Panier & Commande** : Panier interactif avec mises à jour en temps réel et traitement des commandes.
- **Comptes Utilisateurs** : Authentification, gestion de profil et suivi des commandes.
- **Tableau de Bord Administrateur** : Panneau sécurisé pour gérer le stock, mettre à jour les paramètres (horaires, frais) et suivre les commandes.
- **Paramètres Dynamiques** : Informations de la boutique (téléphone, adresse, bannière) synchronisées dynamiquement de manière globale.

## 📋 Prérequis
- **Node.js** : v18+ (v22+ recommandé)
- **npm**, **yarn**, ou **pnpm**
- Un projet **Supabase** configuré (pour la BDD distante et l'Authentification)

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

3. **Configuration de l'environnement :**
   Dupliquez le fichier `.env.example` et renommez-le en `.env` :
   ```bash
   cp .env.example .env
   ```
   Remplissez vos identifiants Supabase et les autres variables d'API dans le fichier `.env`.

4. **Initialisation de la base de données :**
   Exécutez le script `supabase/migration.sql` fourni dans l'éditeur SQL de votre projet Supabase pour créer les tables, les politiques RLS et les données de test (seed).

## 💻 Comment lancer le projet

**Mode Développement :**
```bash
npm run dev
```
Accédez à l'application sur `http://localhost:3000`.

**Build pour la Production :**
```bash
npm run build
npm run preview
```
Les fichiers optimisés seront générés dans le dossier `dist/`.

## 📁 Structure du Projet
```text
/
├── public/               # Ressources statiques publiques (images, icônes)
├── src/
│   ├── components/       # Composants UI réutilisables (Layout, Cart, Modals)
│   ├── lib/              # Types, initialisation du client Supabase, utilitaires
│   ├── pages/            # Composants de vues (Home, Shop, Admin, Cart, etc.)
│   ├── store/            # État global Zustand (cart, auth, settings)
│   ├── App.tsx           # Définition globale du routage
│   ├── main.tsx          # Point d'entrée de l'application React
│   └── index.css         # Styles globaux & point d'entrée Tailwind
├── supabase/             # Migrations de base de données et contexte Supabase
├── vite.config.ts        # Configuration du bundler Vite
└── package.json          # Dépendances & scripts npm
```

## 🔐 Variables d'Environnement
Exemple de fichier `.env` :
```env
VITE_SUPABASE_URL=url_de_votre_projet_supabase
VITE_SUPABASE_ANON_KEY=clé_anon_de_votre_projet_supabase
# Autres clés potentielles (API Gemini, portefeuille Viva, etc.)
```

## 🤝 Bonnes pratiques pour contribuer
Les contributions sont les bienvenues ! Veuillez lire [CONTRIBUTING.md](./CONTRIBUTING.md) pour les détails sur les normes de code, les conventions de nommage des branches et le processus de Pull Request. Référez-vous également à `.cursorrules` pour le contexte de développement assisté par IA.

## 📄 Licence
Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
