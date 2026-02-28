# 🗺️ Roadmap - Green Moon CBD Shop

Ce document présente la feuille de route du projet **Green Moon CBD Shop**. Il décrit les fonctionnalités déjà implémentées, celles en cours de développement et les évolutions futures pour améliorer l'expérience utilisateur et le référencement du site.

---

## ✅ Phase 1 : MVP (Minimum Viable Product) - _Terminé_

L'objectif de cette phase était de créer un site vitrine fonctionnel, esthétique et rassurant pour les clients.

- [x] **Structure de base** : Configuration de React 19, Vite, et Tailwind CSS v4.
- [x] **Routage** : Mise en place de React Router pour une navigation fluide entre les pages.
- [x] **Design System** : Définition des couleurs (zinc-950, green-primary, green-neon) et des typographies (Inter, Playfair Display).
- [x] **Pages essentielles** :
  - [x] Accueil (Hero, Présentation, Engagements, FAQ).
  - [x] La Boutique (Histoire, Valeurs, Photos).
  - [x] Nos Produits (Catégories : Fleurs, Résines, Huiles).
  - [x] Qualité & Légalité (Conformité THC < 0.3%, Analyses laboratoire).
  - [x] Contact (Coordonnées, Horaires, Espace Google Maps).
  - [x] Mentions Légales (Avertissements CBD, Éditeur, Hébergement).
- [x] **Animations** : Intégration de Framer Motion (apparitions au défilement, micro-interactions au survol).
- [x] **Bannière promotionnelle** : Ajout d'une bannière dismissible en haut de page pour les offres (ex: -10% de bienvenue).
- [x] **Correction UX** : Ajout du `window.scrollTo(0, 0)` pour remonter en haut de page à chaque changement de route.

---

## 🚧 Phase 2 : Contenu & Optimisation SEO (À faire avant le lancement)

Cette phase concerne la personnalisation du site avec les vraies données de la boutique et l'optimisation pour les moteurs de recherche.

- [ ] **Intégration des vraies photos** : Remplacer les images génériques (Unsplash) par des photos professionnelles de la boutique, de l'équipe et des produits.
- [ ] **Mise à jour des coordonnées** : Renseigner l'adresse exacte, le numéro de téléphone, l'email et le SIRET dans les pages Contact, Footer et Mentions Légales.
- [ ] **Intégration Google Maps** : Remplacer le bloc "Carte Interactive" par l'iframe officielle de Google Maps pointant vers la boutique.
- [ ] **Optimisation SEO (Balises Meta)** :
  - Ajouter la bibliothèque `react-helmet-async`.
  - Définir des balises `<title>` et `<meta description>` uniques et optimisées pour chaque page (ex: "Acheter CBD à [Ville] - Green Moon Shop").
- [ ] **Google Business Profile** : S'assurer que la fiche Google My Business est créée, validée et liée au site web.
- [ ] **Favicon** : Créer et ajouter un favicon (logo Green Moon) dans le dossier `public/`.

---

## 🚀 Phase 3 : Améliorations Fonctionnelles (Post-lancement)

Ces fonctionnalités viendront enrichir l'expérience utilisateur une fois le site en ligne.

- [ ] **Popup de vérification d'âge (Age Gate)** : Obligatoire pour les sites liés au CBD. Un popup à l'arrivée sur le site demandant "Avez-vous plus de 18 ans ?".
- [ ] **Formulaire de contact fonctionnel** : Remplacer les simples coordonnées par un formulaire de contact direct (utilisant un service comme EmailJS ou Formspree pour éviter d'avoir un backend complexe).
- [ ] **Bouton WhatsApp flottant** : Un bouton fixe en bas à droite de l'écran pour permettre aux clients de poser des questions instantanément via WhatsApp.
- [ ] **Intégration Instagram** : Afficher un flux (feed) des dernières publications Instagram de la boutique directement sur la page d'accueil.
- [ ] **Avis Clients (Reviews)** : Intégrer un widget affichant les derniers avis Google ou Trustpilot pour renforcer la confiance.

---

## 🔮 Phase 4 : Évolution E-commerce (Optionnel / Long terme)

Si la boutique décide de vendre ses produits en ligne (Click & Collect ou Livraison).

- [ ] **Catalogue dynamique** : Remplacer les listes statiques par une base de données de produits (ex: Supabase, Firebase ou un CMS headless comme Strapi/Sanity).
- [ ] **Panier d'achat (Cart)** : Permettre l'ajout de produits au panier avec gestion des quantités.
- [ ] **Paiement en ligne** : Intégration d'une solution de paiement compatible avec le CBD (attention, Stripe et PayPal ont des politiques strictes sur le CBD, il faudra utiliser des passerelles spécialisées comme Viva Wallet ou un processeur haut risque).
- [ ] **Comptes utilisateurs** : Historique des commandes, adresses de livraison, programme de fidélité.
- [ ] **Gestion des stocks** : Synchronisation des stocks entre la boutique physique et le site web.
