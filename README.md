# 🌿 Green Moon CBD Shop - Site Vitrine

Bienvenue sur le dépôt du site vitrine officiel de **Green Moon CBD Shop**. Ce projet est une application web moderne (Single Page Application) conçue pour présenter la boutique physique, ses valeurs, ses produits et rassurer la clientèle sur la légalité et la qualité des produits proposés.

## 🎯 Objectifs du projet

- **Présenter l'univers** de la boutique avec un design premium, naturel et épuré (thème sombre avec accents verts).
- **Rassurer les clients** sur la légalité (THC < 0.3%), la traçabilité et la qualité des produits.
- **Générer du trafic en boutique** (Web-to-Store) en mettant en avant l'adresse, les horaires et l'expertise des vendeurs.
- **Optimiser le SEO local** pour être visible sur les recherches de type "CBD shop + ville".

## 🚀 Fonctionnalités principales

- **Navigation fluide** : Routage côté client sans rechargement de page (React Router).
- **Design Responsive** : Adapté à tous les écrans (mobile, tablette, bureau) grâce à Tailwind CSS.
- **Animations subtiles** : Transitions douces, apparitions au défilement et micro-interactions au survol (Framer Motion).
- **Bannière promotionnelle** : Mise en avant d'offres temporaires en haut de page.
- **Section FAQ** : Accordéon interactif pour répondre aux questions fréquentes.
- **Pages dédiées** : Accueil, La Boutique, Nos Produits, Qualité & Légalité, Contact, Mentions Légales.

## 🛠️ Stack Technique

- **Framework** : [React 19](https://react.dev/)
- **Outil de build** : [Vite](https://vitejs.dev/)
- **Routage** : [React Router v6](https://reactrouter.com/)
- **Styling** : [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations** : [Motion (Framer Motion)](https://motion.dev/)
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Typographie** : Inter (Sans-serif) & Playfair Display (Serif) via Google Fonts.

## 📁 Structure du projet

```text
/
├── public/             # Fichiers statiques
├── src/
│   ├── components/     # Composants réutilisables (Layout, FAQ, etc.)
│   ├── pages/          # Pages de l'application (Home, Shop, Contact, etc.)
│   ├── App.tsx         # Configuration du routage
│   ├── main.tsx        # Point d'entrée React
│   └── index.css       # Styles globaux et configuration Tailwind
├── index.html          # Point d'entrée HTML
├── package.json        # Dépendances et scripts
├── vite.config.ts      # Configuration Vite
└── README.md           # Ce fichier
```

## 💻 Installation et Lancement local

1. **Cloner le projet** (ou télécharger les fichiers).
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   Le site sera accessible sur `http://localhost:3000`.
4. **Compiler pour la production** :
   ```bash
   npm run build
   ```
   Les fichiers optimisés seront générés dans le dossier `dist/`.

## 🎨 Personnalisation (Pour le propriétaire)

Avant la mise en ligne définitive, voici les éléments à mettre à jour dans le code :

1. **Images** : Remplacer les URLs d'images Unsplash par les vraies photos de la boutique (dans `src/pages/Home.tsx`, `Shop.tsx`, `Products.tsx`).
2. **Coordonnées** : Mettre à jour l'adresse, le téléphone et l'email dans `src/components/Layout.tsx` (Footer) et `src/pages/Contact.tsx`.
3. **Google Maps** : Remplacer le bloc "Carte Interactive" dans `src/pages/Contact.tsx` par le code d'intégration `<iframe>` fourni par Google Maps.
4. **Mentions Légales** : Compléter les informations de l'entreprise (SIRET, Directeur de publication) dans `src/pages/Legal.tsx`.

---

_Développé avec soin pour Green Moon CBD Shop._
