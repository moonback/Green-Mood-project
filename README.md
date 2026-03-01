# 🌿 Green Mood Project : Plateforme E-commerce CBD Premium & IA

## ✨ La Révolution du CBD en Ligne

**Green Mood Project** est une plateforme e-commerce de nouvelle génération, conçue pour transformer l'expérience d'achat de produits CBD. Au-delà d'une simple boutique en ligne, c'est un écosystème complet qui combine un design moderne, des fonctionnalités e-commerce avancées et une intelligence artificielle personnalisée pour offrir une valeur inégalée à ses utilisateurs et un potentiel de croissance exponentiel à ses propriétaires.

Développée avec une stack technologique de pointe, cette application est prête à être déployée et à captiver un marché en pleine expansion, en se positionnant comme un leader innovant grâce à ses différenciateurs clés.

## 🚀 Fonctionnalités Clés & Différenciateurs

Green Mood Project se distingue par une suite de fonctionnalités robustes et innovantes, pensées pour maximiser l'engagement client et les revenus :

1.  **🤖 BudTender AI : Votre Conseiller CBD Personnel**
    *   Un assistant conversationnel intelligent qui guide les utilisateurs à travers un quiz interactif pour recommander les produits CBD les plus adaptés à leurs besoins.
    *   **Mémoire Utilisateur** : Le BudTender mémorise les préférences et l'historique des interactions pour des recommandations toujours plus pertinentes.
    *   **Configuration Admin** : Entièrement configurable via un panneau d'administration dédié, permettant d'ajuster les prompts, les modèles d'IA (via OpenRouter), la vitesse de frappe, et les seuils de réapprovisionnement.
    *   **Valeur Ajoutée** : Réduit la friction à l'achat, augmente la confiance des clients et personnalise l'expérience, transformant les visiteurs en acheteurs fidèles.

2.  **💖 Programme de Fidélité Gamifié & Abonnements**
    *   **Système de Points à Niveaux (Bronze, Silver, Gold)** : Incite à la répétition d'achats avec des récompenses progressives (points par euro, livraisons offertes, accès ventes privées, réductions VIP).
    *   **Abonnements Récurrents** : Permet aux clients de s'abonner à leurs produits favoris avec des livraisons automatiques et des réductions, assurant des revenus récurrents et prévisibles.
    *   **Gestion Complète** : Les utilisateurs peuvent gérer leurs abonnements (pause, reprise, annulation, changement de fréquence) directement depuis leur compte.
    *   **Valeur Ajoutée** : Augmente la Life-Time Value (LTV) des clients et fidélise la base d'utilisateurs.

3.  **🛍️ Expérience E-commerce Premium**
    *   **Catalogue Produit Avancé** : Navigation intuitive avec filtres par catégorie, bénéfices, arômes, et recherche full-text.
    *   **Fiches Produits Détaillées** : Informations complètes, images multiples, gestion des stocks, et système d'avis clients vérifiés.
    *   **Tunnel de Commande Optimisé** : Processus d'achat fluide et sécurisé, gestion des adresses, codes promotionnels.
    *   **PWA (Progressive Web App)** : Offre une expérience utilisateur rapide, fiable et engageante, avec installation sur l'écran d'accueil et fonctionnement hors ligne partiel.

3.  **🛒 Système de Caisse POS (Point of Sale)**
    *   **Vente en Boutique** : Interface dédiée pour les ventes physiques, permettant une gestion fluide des clients en magasin.
    *   **Gestion Client & Fidélité** : Recherche rapide de profils clients pour l'attribution automatique de points de fidélité lors des achats en boutique.
    *   **Encaissement Multi-modes** : Support des espèces (avec calcul du rendu), cartes bancaires et paiements mobiles.
    *   **Synchronisation en Temps Réel** : Mise à jour automatique des stocks globaux et génération de reçus formatés après chaque vente.
    *   **Valeur Ajoutée** : Unifie la gestion des ventes en ligne et physiques dans un seul outil, simplifiant la comptabilité et le suivi des stocks.

4.  **📊 Panneau d'Administration Complet**
    *   Un back-office intuitif pour gérer tous les aspects de la boutique : produits, catégories, commandes, clients, stocks, codes promotionnels, avis, et paramètres de l'IA BudTender.
    *   **Analytique Intégrée** : Tableau de bord avec des métriques clés (chiffre d'affaires, top produits, distribution des statuts de commande, acquisition client) pour une prise de décision éclairée.
    *   **Valeur Ajoutée** : Autonomie totale pour l'opérateur, réduisant la dépendance aux développeurs pour la gestion quotidienne et stratégique.

## ⚙️ Stack Technique Robuste & Moderne

L'application est construite sur une architecture solide, garantissant performance, scalabilité et maintenabilité :

*   **Frontend** : `React 19` (avec `Vite` pour le build ultra-rapide), `TypeScript`, `TailwindCSS 4` (pour un design system cohérent et rapide).
*   **Backend & Base de Données** : `Supabase` (basé sur `PostgreSQL`) – une solution BaaS complète incluant :
    *   **Authentification** : Gestion des utilisateurs et sessions.
    *   **Base de Données** : Schéma relationnel robuste avec plus de 19 tables (produits, commandes, utilisateurs, abonnements, fidélité, etc.).
    *   **Row-Level Security (RLS)** : Sécurité granulaire des données, garantissant que chaque utilisateur n'accède qu'à ses propres informations.
    *   **Fonctions & Triggers SQL** : Logique métier complexe implémentée directement en base de données pour une cohérence et une fiabilité maximales (ex: gestion des stocks, points de fidélité, synchronisation des bundles).
*   **State Management** : `Zustand` pour une gestion d'état réactive et performante.
*   **IA** : Intégration via `OpenRouter` pour une flexibilité dans le choix des modèles de langage (par défaut `google/gemini-2.0-flash-lite-preview-02-05`).
*   **Animations** : `Motion` pour des transitions et animations fluides et élégantes.

## 🏗️ Architecture & Qualité du Code

Le projet suit une architecture modulaire et des bonnes pratiques de développement :

*   **Codebase** : Plus de **15 200 lignes de code TypeScript**.
*   **Modularité** : Séparation claire des composants, pages, hooks, et stores, facilitant la compréhension et les évolutions.
*   **Sécurité** : RLS implémentée sur toutes les tables sensibles, garantissant une protection des données utilisateurs.
*   **Performance** : Optimisations frontend (Vite, React) et backend (fonctions SQL) pour une expérience utilisateur rapide.
*   **Maintenabilité** : Code typé (TypeScript), conventions de nommage claires, et structure de projet logique.

## 🛠️ Installation & Démarrage (pour développeurs)

Pour démarrer le projet en local, suivez ces étapes :

1.  **Cloner le dépôt** :
    ```bash
    git clone https://github.com/moonback/Green-Mood-project.git
    cd Green-Mood-project
    ```
2.  **Configuration Supabase** :
    *   Créez un nouveau projet Supabase.
    *   Configurez les variables d'environnement `.env` avec votre `SUPABASE_URL` et `SUPABASE_ANON_KEY`.
    *   Exécutez les migrations SQL fournies dans le dossier `supabase/` pour initialiser la base de données et les fonctions/RLS.
3.  **Installation des dépendances** :
    ```bash
    pnpm install
    ```
4.  **Démarrage du serveur de développement** :
    ```bash
    pnpm dev
    ```

## 📞 Contact

Pour toute question ou information complémentaire, veuillez contacter [Nom/Email/Lien] ou ouvrir une issue sur ce dépôt GitHub.
