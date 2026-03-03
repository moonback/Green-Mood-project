# 🌿 Green Mood CBD

> Une expérience e-commerce premium dédiée au bien-être, propulsée par l'intelligence artificielle.

Green Mood CBD est une plateforme e-commerce moderne spécialisée dans la vente de produits CBD de haute qualité. Elle intègre un **BudTender IA** (basé sur Google Gemini) capable de conseiller les clients en temps réel via une interface vocale et textuelle, offrant une expérience d'achat personnalisée et experte.

---

## 🚀 Stack Technique

- **Frontend** : [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling** : [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) (animations)
- **Backend & Database** : [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions)
- **IA Conversationnelle** : [Google Gemini AI](https://deepmind.google/technologies/gemini/) (Multimodal Live API)
- **Gestion d'État** : [Zustand](https://docs.pmnd.rs/zustand/)
- **Routage** : [React Router 7](https://reactrouter.com/)

---

## ✨ Fonctionnalités Principales (MVP)

- 🛒 **E-commerce Complet** : Catalogue, gestion du panier, processus de commande sécurisé.
- 🤖 **BudTender IA** : Assistant virtuel expert en CBD capable de recommander des produits basés sur les besoins de l'utilisateur.
- 🎙️ **Interface Vocale** : Interaction fluide avec l'IA en mode mains libres.
- 👤 **Gestion de Compte** : Profils utilisateurs, historique des commandes, gestion des adresses.
- 🏆 **Système de Fidélité** : Gain de points à chaque achat et programme de parrainage.
- 📦 **Abonnements** : Gestion de livraisons récurrentes pour les produits consommables.
- 📊 **Dashboard Admin & POS** : Interface de gestion des stocks, des commandes et terminal de point de vente.

---

## 🛠️ Installation et Configuration

### Prérequis
- Node.js (v18+)
- Un projet [Supabase](https://supabase.com/)
- Une clé API [Google AI Studio](https://aistudio.google.com/)

### Étapes
1. **Cloner le projet** :
   ```bash
   git clone https://github.com/Mayss/Green-Moon-project.git
   cd Green-Moon-project
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Variables d'Environnement** :
   Créez un fichier `.env` à la racine et configurez les variables suivantes :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
   VITE_GEMINI_API_KEY=votre_cle_gemini
   ```

4. **Base de Données** :
   Appliquez les migrations situées dans le dossier `/supabase` via l'éditeur SQL de votre dashboard Supabase.

---

## 🏃 Lancement du Projet

### Mode Développement
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

### Mode Production
```bash
npm run build
npm run preview
```

---

## 📁 Structure du Projet

```text
├── public/              # Assets statiques
├── src/
│   ├── components/      # Composants UI réutilisables
│   │   ├── budtender-ui/# Interface spécifique à l'IA
│   │   └── ui/          # Composants de base (boutons, inputs, etc.)
│   ├── hooks/           # Hooks React personnalisés (IA, Auth, etc.)
│   ├── lib/             # Utilitaires, types et configuration API
│   ├── pages/           # Composants pages de l'application
│   ├── store/           # Gestion de l'état global (Zustand)
│   └── App.tsx          # Configuration des routes
├── supabase/            # Migrations SQL et configuration backend
└── package.json         # Dépendances et scripts
```

---

## 📝 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.
