# PRD — Green Mood CBD V2

## 1. PRODUCT OVERVIEW

### Nom du produit
**Green Mood CBD V2**.

### Description
Green Mood CBD V2 est une plateforme e-commerce omnicanale pour boutiques CBD, combinant :
- une boutique en ligne (catalogue, panier, checkout, espace client),
- un back-office d’administration (produits, commandes, stock, analytics, promotions, recommandations),
- un POS magasin,
- un assistant IA “BudTender” (chat + voix) connecté aux données produits et à l’historique utilisateur.

### Problème résolu
Les boutiques CBD opèrent souvent avec des outils fragmentés (site vitrine, e-commerce, caisse, CRM, conseil client, analytics), ce qui complique :
- l’expérience d’achat,
- l’exploitation commerciale,
- la personnalisation conseil produit,
- l’alignement online/offline.

### Proposition de valeur
- **Plateforme unifiée** : e-commerce + POS + CRM léger + IA conseil.
- **Personnalisation** : recommandations BudTender (quiz, chat, voix, mémoire de préférences).
- **Pilotage business** : analytics, stock, promotions, abonnements, parrainage.
- **Architecture serverless pragmatique** : frontend React direct sur Supabase (Auth/DB/Storage/RPC), limitant la complexité opérationnelle.

### Positionnement produit
Solution e-commerce CBD “premium” orientée **conversion + rétention + expérience conseil assistée IA**, adaptée aux acteurs retail voulant unifier boutique physique et vente en ligne.

### Public cible
1. **Clients finaux CBD** : découverte, achat, réachat, fidélité.
2. **Équipe boutique** : gestion POS et opérations quotidiennes.
3. **Administrateurs/gestionnaires** : merchandising, pricing, stock, performance commerciale.

### Cas d’usage principaux
- Achat CBD web (catalogue → panier → commande).
- Réassurance/conseil via BudTender (chat et voix).
- Exploitation commerciale (admin + POS).
- Fidélisation (points, abonnements, parrainage, avis, favoris).

---

## 2. OBJECTIFS PRODUIT

### Objectifs business
- Augmenter le chiffre d’affaires omnicanal (web + POS).
- Améliorer le taux de conversion via recommandation assistée et UX checkout.
- Accroître la rétention via fidélité, abonnements, favoris et parrainage.
- Réduire les frictions opérationnelles (stock, commandes, promotions, analytics centralisés).

### Objectifs utilisateurs
- Trouver rapidement des produits adaptés aux besoins (sommeil, stress, douleur, bien-être).
- Commander simplement avec options de livraison / click & collect.
- Suivre son compte et ses commandes de manière autonome.
- Recevoir des conseils personnalisés fiables et contextualisés.

### Métriques de succès (KPIs)
- Taux de conversion catalogue → commande.
- AOV (panier moyen).
- Taux de réachat à 30/60/90 jours.
- Part des commandes assistées BudTender.
- Taux d’utilisation des points fidélité et des codes promo.
- Taux d’activation et de rétention abonnements.
- Taux de complétion du checkout.
- CA POS journalier et écart de caisse (cash difference).

### Impact attendu
- Hausse conversion et panier moyen.
- Diminution abandons panier.
- Meilleure continuité d’expérience entre canaux (web/magasin).
- Pilotage data-driven plus fin (produits, promos, stock, acquisition/rétention).

---

## 3. PERSONAS UTILISATEURS

### Persona 1 — “Nina, Acheteuse CBD débutante”
- **Description** : 28 ans, découvre le CBD, a besoin de guidance.
- **Besoins** : explications simples, recommandations rassurantes, dosage/format adaptés.
- **Problèmes** : manque de confiance, surcharge d’options.
- **Objectifs** : choisir un produit pertinent et commander sans complexité.

### Persona 2 — “Hugo, Client récurrent orienté résultats”
- **Description** : 37 ans, usage régulier (stress/sommeil/récupération).
- **Besoins** : réachat rapide, favoris, abonnements, points fidélité.
- **Problèmes** : friction de réapprovisionnement, variations de stock.
- **Objectifs** : gagner du temps et optimiser le rapport qualité/prix.

### Persona 3 — “Sofia, Responsable boutique / admin”
- **Description** : pilote assortiment, promotions, stock, performance.
- **Besoins** : console unique, visibilité KPI, actions rapides sur catalogue.
- **Problèmes** : dispersion des outils, faible lisibilité de la performance.
- **Objectifs** : maximiser ventes, maîtriser marge/stock, fluidifier l’exploitation.

### Persona 4 — “Léo, Vendeur en magasin (POS)”
- **Description** : gère ventes en caisse et clôture journalière.
- **Besoins** : POS rapide, création client walk-in, traçabilité paiements.
- **Problèmes** : lenteurs process caisse, manque d’intégration au SI.
- **Objectifs** : encaissement fluide, moins d’erreurs, reporting fiable.

---

## 4. USER JOURNEY

### A. Utilisateur non connecté
1. **Découverte** : arrive via Home/SEO/guides/catégories.
2. **Navigation** : explore `/catalogue`, filtres implicites par catégories/pages.
3. **Décision** : consulte une fiche produit (`/catalogue/:slug`), produits liés, bundles, avis.
4. **Assistance** : peut interagir avec BudTender pour orienter le choix.
5. **Pré-achat** : ajoute au panier.
6. **Inscription / connexion** : au moment des actions protégées (checkout, compte), redirection vers `/connexion`.

### B. Utilisateur connecté
1. **Onboarding** : création profil via Supabase Auth + trigger SQL profil.
2. **Achat principal** : panier → checkout (`/commande`) → confirmation.
3. **Post-achat** : suivi commandes, fidélité, avis, favoris, abonnements, parrainage.
4. **Engagement** : BudTender mémorise préférences/interactions pour personnalisation future.

### C. Parcours admin
1. Connexion admin (flag `profiles.is_admin`).
2. Accès `/admin` (route gardée).
3. Opérations : dashboard, produits, catégories, commandes, stock, clients, referrals, subscriptions, reviews, promo, recommandations, BudTender config, analytics, settings.
4. Accès `/pos` pour caisse magasin.

### D. Parcours POS
1. Admin ouvre `/pos`.
2. Sélection produits / panier caisse / mode de paiement.
3. Option création client à la volée via RPC `create_pos_customer`.
4. Clôture (rapport POS et réconciliation).

---

## 5. LISTE DES FEATURES

## 5.1 Authentification

### F1 — Inscription / connexion / déconnexion
- **Description** : auth email/password Supabase.
- **Objectif utilisateur** : accéder aux fonctionnalités privées.
- **Composants** : `authStore`, pages Login/Forgot/Reset.
- **APIs** : Supabase Auth.
- **Accès** : public (inscription/connexion), authentifié (logout).
- **Logique** : synchronisation session, récupération profil, tracking sessions actives (`user_active_sessions`).

### F2 — Reset mot de passe
- **Description** : email de reset + update password.
- **Objectif** : récupération d’accès.
- **API** : `resetPasswordForEmail`, `updateUser`.

## 5.2 Gestion du compte

### F3 — Profil utilisateur
- **Description** : informations personnelles + sessions actives.
- **Composants** : `/compte`, `/compte/profil`.
- **Données** : `profiles`, `user_active_sessions`.

### F4 — Adresses
- **Description** : CRUD adresses livraison.
- **APIs** : table `addresses`.
- **Règles d’accès** : owner via RLS.

### F5 — Historique commandes
- **Description** : listing et détail commandes utilisateur.
- **Données** : `orders`, `order_items`.

### F6 — Favoris (wishlist)
- **Description** : sauvegarde produits préférés.
- **Données** : `wishlists`.

### F7 — Fidélité
- **Description** : solde points + historique transactions.
- **Données** : `profiles.loyalty_points`, `loyalty_transactions`.

### F8 — Abonnements
- **Description** : souscriptions produits récurrentes.
- **Données** : `subscriptions`, `subscription_orders`.

### F9 — Avis clients
- **Description** : dépôt et consultation avis.
- **Données** : `reviews` (vérification/publication).

### F10 — Parrainage
- **Description** : code parrain, suivi filleuls, attribution points.
- **Données** : `profiles.referral_code/referred_by_id`, `referrals`, `loyalty_transactions`.

## 5.3 Catalogue & shopping

### F11 — Catalogue produits
- **Description** : listing catégories/produits, pages SEO, disponibilité stock.
- **Composants** : `Catalog`, `ProductDetail`, cartes produits, related/FBT.
- **Données** : `categories`, `products`, `product_images`, `bundle_items`, `product_recommendations`.

### F12 — Panier persistant
- **Description** : panier local persisté (Zustand persist).
- **Logique** : sous-total, frais livraison selon `store_settings`, total.

### F13 — Checkout
- **Description** : sélection livraison, adresse, points fidélité, code promo.
- **APIs** : `orders`, `order_items`, `products`, `stock_movements`, `loyalty_transactions`, RPC `increment_promo_uses`.
- **Règles d’accès** : connecté requis.
- **Logique** : création commande, simulation paiement Viva, décrément stock, points gagnés/utilisés, récompense parrainage au 1er achat payé.

### F14 — Confirmation commande
- **Description** : écran de confirmation post achat.

## 5.4 BudTender IA

### F15 — Chat BudTender (quiz + conversation)
- **Description** : assistant conversationnel avec scoring local + appel LLM OpenRouter.
- **APIs** : OpenRouter chat, Supabase interactions/préférences.
- **Logique** : quiz besoins, ranking produits, réponse générative contextualisée, mémoire utilisateur.

### F16 — Recherche sémantique produit
- **Description** : embeddings + RPC `match_products`.
- **Composants** : module embeddings + parcours BudTender.
- **Données** : `products.embedding` (pgvector).

### F17 — Conseiller vocal temps réel
- **Description** : session audio Gemini Live via WebSocket.
- **Composants** : `useGeminiLiveVoice`, `VoiceAdvisor`.
- **Intégrations** : Google Gemini Live + micro navigateur (AudioWorklet).

## 5.5 Administration

### F18 — Dashboard admin
- **Description** : CA, commandes, stock critique, clients, commandes récentes.

### F19 — Gestion produits/catégories
- **Description** : CRUD catalogue + images + attributs + recommandations + bundles.
- **Intégration** : Supabase Storage bucket `product-images`.

### F20 — Gestion commandes/stock/clients
- **Description** : suivi commandes, mouvements stock, base clients.

### F21 — Promotions
- **Description** : gestion `promo_codes`, suivi usages.

### F22 — Analytics
- **Description** : visualisations business et tendances (Recharts).

### F23 — Admin BudTender
- **Description** : réglages IA (activation, modèle, paramètres comportement).

### F24 — Paramètres boutique
- **Description** : store settings dynamiques (livraison, bannière, réseaux, options modules).

## 5.6 POS

### F25 — Caisse magasin
- **Description** : vente in-store sur route dédiée `/pos`.
- **Données** : commandes `in_store`, stock, `pos_reports`.

### F26 — Reporting & réconciliation POS
- **Description** : clôture journalière, ventilation paiements (cash/card/mobile), écart de caisse.

## 5.7 SEO & contenu

### F27 — Guides SEO
- **Description** : pages éditoriales “guides CBD”.

### F28 — Sitemaps
- **Description** : génération XML pages/produits/blog via script.

---

## 6. USER STORIES

### Auth
- En tant que visiteur, je veux créer un compte afin d’accéder au checkout et au suivi de mes commandes.
  - **AC** : compte créé, profil initial disponible, connexion active.
- En tant qu’utilisateur, je veux réinitialiser mon mot de passe afin de récupérer l’accès.
  - **AC** : email de reset envoyé, mot de passe modifiable.

### Catalogue/achat
- En tant que client, je veux parcourir le catalogue et ouvrir les fiches produits afin de comparer avant achat.
  - **AC** : fiche détaillée accessible par slug, disponibilité/infos affichées.
- En tant que client, je veux ajouter des produits au panier afin de préparer ma commande.
  - **AC** : quantités modifiables, panier persistant entre sessions.
- En tant que client connecté, je veux finaliser une commande afin de recevoir mes produits.
  - **AC** : commande créée + lignes + statut payé simulé + stock décrémenté + redirection confirmation.
- En tant que client fidèle, je veux utiliser mes points afin de réduire mon montant.
  - **AC** : conversion points→remise appliquée au total, transaction fidélité journalisée.
- En tant que client, je veux saisir un code promo afin de bénéficier d’une remise.
  - **AC** : code valide applique une réduction et incrémente son compteur d’usage.

### BudTender
- En tant que client indécis, je veux un quiz/conseiller IA afin de trouver un produit adapté.
  - **AC** : recommandations affichées selon objectifs/profil/budget.
- En tant qu’utilisateur, je veux parler à un conseiller vocal afin d’obtenir une aide mains libres.
  - **AC** : session audio ouverte, échange temps réel, suggestions exploitables.

### Compte
- En tant que client, je veux consulter mes commandes afin de suivre mes achats.
- En tant que client, je veux gérer mes adresses afin de simplifier la livraison.
- En tant que client, je veux gérer mes favoris/abonnements/avis/parrainage afin d’optimiser mon expérience long terme.

### Admin / POS
- En tant qu’admin, je veux gérer produits/catégories/stock afin de maintenir un catalogue fiable.
- En tant qu’admin, je veux suivre KPI et ventes afin de piloter la performance.
- En tant que vendeur magasin, je veux encaisser via POS afin de traiter les ventes physiques rapidement.

---

## 7. PRODUCT STRUCTURE (PAGES & ROUTES)

### Public
- `/` — Home : proposition de valeur, mise en avant.
- `/boutique` — page shop marketing.
- `/produits` — listing orienté produits.
- `/qualite` — discours qualité.
- `/contact` — contact.
- `/mentions-legales` — légal.
- `/connexion` — login/signup.
- `/mot-de-passe-oublie` — reset request.
- `/reinitialiser-mot-de-passe` — reset confirm.
- `/catalogue` — catalogue e-commerce.
- `/catalogue/:slug` — détail produit.
- `/guides` + `/guides/...` — contenus SEO.
- `/panier` — récapitulatif panier.

### Protégées (auth)
- `/commande` — checkout.
- `/commande/confirmation` — confirmation.
- `/compte` — hub compte.
- `/compte/commandes` — historique commandes.
- `/compte/adresses` — gestion adresses.
- `/compte/abonnements` — gestion subscriptions.
- `/compte/fidelite` — historique fidélité.
- `/compte/avis` — mes avis.
- `/compte/favoris` — wishlist.
- `/compte/parrainage` — programme referral.
- `/compte/profil` — profil et sessions.

### Admin
- `/admin` — console multi-tabs.
- `/pos` — caisse magasin.

### Fallback
- `*` — 404.

---

## 8. DATA MODEL

## Noyau transactionnel
- `categories`, `products`, `product_images`, `bundle_items`, `product_recommendations`.
- `profiles`, `addresses`, `orders`, `order_items`, `stock_movements`, `store_settings`.

## Engagement / rétention
- `loyalty_transactions`, `subscriptions`, `subscription_orders`, `reviews`, `promo_codes`, `referrals`, `wishlists`.

## IA / personnalisation
- `user_ai_preferences`, `budtender_interactions`, `products.embedding` + extension `vector`, RPC `match_products`.

## POS / sessions
- `pos_reports`, `user_active_sessions`.

## Relations et contraintes clés
- FK massives `orders->profiles`, `order_items->orders/products`, `subscriptions->profiles/products`, etc.
- `reviews`: unicité `(product_id, user_id, order_id)`.
- `bundle_items`: contraintes de cohérence bundle.
- `promo_codes`: contrôle usage/validité via logique applicative + RPC.
- RLS activée globalement avec schéma owner/admin/public-read selon tables.

---

## 9. SYSTEM ARCHITECTURE

### Architecture générale
- **Frontend SPA** : React 19 + Vite + TypeScript + Tailwind.
- **State management** : Zustand.
- **Backend managé** : Supabase (Auth, PostgREST, RPC SQL, Storage).
- **DB** : PostgreSQL + pgvector.
- **IA** : OpenRouter (chat/embeddings) + Gemini Live (voix).

### Frontend
- Routing React Router avec lazy loading.
- Guards d’accès : `ProtectedRoute`, `AdminRoute`.
- composants métier (catalogue, checkout, compte, admin, BudTender).

### Backend/API
- Pas d’API Node/Express active pour la logique produit.
- appels directs Supabase `from(...)` + `rpc(...)`.

### Services externes
- OpenRouter API (`chat/completions`, `embeddings`).
- Gemini Live websocket.
- Viva Wallet prévu mais backend paiement non implémenté (placeholder).

### Infrastructure
- Build Vite, no CI/CD détecté.
- scripts utilitaires (sitemap, sync embeddings).
- assets statiques + PWA manifest/service worker.

---

## 10. BUSINESS LOGIC

### Règles métier principales
- Checkout exige utilisateur connecté et adresse si livraison.
- Frais de livraison calculés dynamiquement (`delivery_fee`, `delivery_free_threshold`).
- Fidélité :
  - points gagnés ≈ total commande,
  - conversion redemption par paliers,
  - journalisation transactions (earned/redeemed/referral).
- Promo : code appliqué au checkout + compteur d’usage via RPC.
- Stock : décrément sur commande + enregistrement mouvement.
- Parrainage :
  - code généré au profil,
  - bonus de bienvenue optionnel,
  - récompense parrain au 1er achat payé du filleul.
- Reviews : publication contrôlée (`is_published`) et lecture publique limitée.
- Bundles : synchronisation stock bundle via RPC/trigger.
- Recommandations produits : explicites + fallback même catégorie.
- BudTender : scoring local heuristique + enrichissement LLM + mémoire utilisateur.

### Validations
- Contraintes SQL (CHECK, UNIQUE, FK) sur objets critiques.
- RLS pour isolation des données.
- Contrôle rôle admin via `profiles.is_admin` (UI + policies).

### Automatisations
- Trigger création profil à l’inscription.
- Trigger génération referral_code.
- Triggers de sync stock bundle.
- Scripts de synchronisation embeddings et génération sitemaps.

---

## 11. NON-FUNCTIONAL REQUIREMENTS

### Performance
- Lazy loading pages.
- Caching côté BudTender (catalogue/settings) pour limiter latence.
- Requêtes SQL ciblées, mais plusieurs flux restent “chatty” côté frontend (opportunité d’optimisation).

### Sécurité
- Supabase Auth + RLS généralisée.
- Séparation d’accès public/owner/admin.
- Attention : appels API IA depuis frontend exposent l’usage de clés client-side (risque à mitiger via proxy backend).

### Scalabilité
- Architecture serverless scalable via Supabase.
- Limites possibles sur opérations massives côté client (admin analytics/chargements volumineux).

### Disponibilité
- Dépendance forte à Supabase + OpenRouter + Gemini.
- Dégradation possible des features IA en cas d’indisponibilité externe.

### Monitoring
- Peu de monitoring structuré observé (pas de pipeline observabilité explicite).
- Logs console présents, mais manque d’instrumentation produit centralisée.

---

## 12. RISKS & LIMITATIONS

1. **Paiement Viva incomplet** : checkout en mode simulation (pas de flux serveur finalisé).
2. **Sécurité API IA** : pattern frontend direct à renforcer (BFF recommandé).
3. **Incohérences de migrations vectorielles** : coexistence dimensions 768/3072 à clarifier.
4. **Dette potentielle de gouvernance schéma** : plusieurs migrations successives avec évolutions croisées.
5. **Absence CI/CD visible** : risque qualité/régression et déploiement manuel.
6. **Backend applicatif absent** : logique métier sensible en partie côté frontend.
7. **Observabilité limitée** : KPIs/erreurs techniques non centralisés.

---

## 13. ROADMAP SUGGÉRÉE

## P0 (court terme)
- Finaliser intégration paiement réelle (backend sécurisé + webhooks statut paiement).
- Introduire BFF/API server pour masquer clés IA et centraliser règles sensibles.
- Stabiliser schéma vectoriel (dimension unique, indexation, stratégie re-embed).
- Mettre en place CI (typecheck, lint, tests) + CD minimal.

## P1 (moyen terme)
- Orchestration commandes/stock avec transactions SQL robustes.
- Dashboard KPI produit (funnel conversion, cohortes, réachat).
- Notifications transactionnelles (email/SMS).
- Optimisation POS (offline tolerance, meilleure réconciliation).

## P2 (évolutif)
- Personnalisation avancée (reco hybride behavior + vector + stock/marge).
- AB testing UX et prompts BudTender.
- Segmentation CRM avancée + marketing automation.
- Internationalisation et multi-boutiques.

---

## 14. PRODUCT SUMMARY

Green Mood CBD V2 est une base produit solide pour un commerce CBD omnicanal :
- expérience e-commerce complète,
- compte client riche (fidélité, abonnements, avis, parrainage, favoris),
- administration opérationnelle étendue,
- POS intégré,
- couche IA différenciante (chat/voix + personnalisation).

Le potentiel est élevé pour devenir une plateforme retail spécialisée CBD de référence, à condition de prioriser la robustesse des briques critiques (paiement, sécurité des intégrations IA, qualité opérationnelle CI/CD, observabilité).

---

## Hypothèses formulées (zones non explicites)
- Le POS et certains onglets admin sont considérés “production-ready” fonctionnellement, bien que certaines implémentations puissent être partielles côté UX.
- Le paiement Viva est actuellement non finalisé côté backend ; le mode simulation est utilisé en attendant.
- Les parcours marketing (acquisition automation, notifications push/email) ne sont pas implémentés en natif dans ce repo.
- Les exigences de conformité légale CBD (selon pays) semblent traitées surtout via contenu/UX, pas via moteur de règles dédié.
