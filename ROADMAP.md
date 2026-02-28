# 🗺️ Roadmap du Projet

## 🎯 Phase 1 : Produit Minimum Viable (État Actuel)
*Objectif : Déployer une vitrine entièrement fonctionnelle avec gestion des stocks et navigation dans le catalogue.*
- [x] Configuration initiale React 19 + Vite
- [x] Intégration Tailwind CSS v4 et Framer Motion pour des visuels premium
- [x] Implémentation Base de Données et Auth avec Supabase (`profiles`, `products`, `orders`)
- [x] Gestion de l'état global via Zustand (Cart, Auth, Settings)
- [x] Panneau d'administration (Gérer les produits, voir le statut des commandes, ajuster les paramètres boutique)
- [x] Catalogue public, vue détaillée des produits, et tunnel de commande responsive
- [x] Routage côté client avec React Router v7

## 🚀 Phase 2 : Version 1.0 (Focus Pré-lancement)
*Objectif : Plateforme E-Commerce pleinement opérationnelle traitant les transactions.*
- [ ] **Intégration Viva Wallet** : Finaliser les requêtes serveur/API pour traiter les paiements réels et connecter les webhooks des commandes.
- [ ] **Notifications par Email** : Intégration Resend/SendGrid pour des emails automatisés de confirmation de commande, d'envoi de colis et de bienvenue.
- [ ] **Optimisation SEO** : Implémenter des données structurées (Schema.org), balises dynamiques `<title>` et `<meta>` avec `react-helmet-async` pour le SEO local.
- [ ] **Achat en mode Invité** : Permettre aux utilisateurs non authentifiés d'acheter et de suivre leurs commandes avec un lien par email.
- [ ] **Fonctionnalités PWA** : Ajouter un Web Manifest et un Service Worker pour une consultation hors ligne et la possibilité d'"Ajouter à l'écran d'accueil".

## 🌟 Phase 3 : Expansion Future (V1+)
*Objectif : Augmenter la fidélisation des utilisateurs et offrir des capacités de vente avancées.*
- [x] **Programme de Fidélité & Récompenses** : Enregistrer automatiquement des points de fidélité (`loyalty_points`) après achat pour offrir des réductions.
- [x] **Système d'Abonnement** : Permettre des livraisons hebdomadaires/mensuelles automatiques pour les consommables (huiles).
- [x] **Avis Clients** : Permettre aux acheteurs vérifiés de laisser des avis de 1 à 5 étoiles sur chaque fiche produit.
- [x] **Analytique Admin Avancée** : Graphiques de ventes, produits performants et tunnels de conversion au sein du dashboard.
- [ ] **Support Multi-langue (i18n)** : Traduire le catalogue en FR/EN pour cibler les clients frontaliers européens.
