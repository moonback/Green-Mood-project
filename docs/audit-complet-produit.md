# Audit complet du produit — Green Mood CBD

## 1) PRÉSENTATION GLOBALE DE L’APPLICATION

### But produit
Green Mood CBD est une plateforme e-commerce omnicanale pour une boutique CBD, combinant :
- boutique en ligne (catalogue, panier, checkout),
- espace client (commandes, adresses, fidélité, abonnements, avis, parrainage),
- back-office administrateur (gestion complète du commerce),
- caisse magasin POS,
- assistant IA BudTender (chat + voix).

### Problème résolu
Le produit centralise dans une seule application les opérations habituellement éclatées entre :
- CMS e-commerce,
- CRM basique,
- caisse magasin,
- moteur de recommandation,
- support/conseil client.

### Types d’utilisateurs
1. **Visiteur non connecté** : découverte, navigation catalogue, consultation fiches.
2. **Client connecté** : achat, gestion compte, fidélité, parrainage, historique.
3. **Administrateur** : pilotage catalogue, stock, commandes, analytics, BudTender, POS.
4. **Vendeur magasin (admin)** : utilisation POS en caisse.

### Cas d’usage principaux
- Achat en ligne CBD (de la découverte au paiement simulé).
- Réachat assisté (recommandations, favoris, suggestions liées).
- Gestion quotidienne boutique (stock, commandes, promos, avis).
- Vente magasin via interface POS avec tickets et clôture journalière.
- Conseils personnalisés avec IA textuelle et vocale.

### Fonctionnalités clés
- Catalogue + catégories + recherche.
- Checkout (adresse, livraison, points fidélité, code promo).
- Compte client (profil, commandes, adresses, abonnements, avis, favoris).
- Système fidélité + transactions de points.
- Parrainage (bonus de bienvenue + récompense 1ère commande).
- Back-office multi-onglets.
- Recommandations produit (RPC SQL + fallback catégorie).
- IA BudTender (quiz préférences, mémoire, historique).

### Proposition de valeur
Une solution “tout-en-un” pour commerçant CBD : expérience premium, personnalisation IA et opérations magasin/online unifiées via Supabase.

---

## 2) ANALYSE DE L’ARCHITECTURE

### Structure du projet
- **Frontend SPA** : `src/` (React + TypeScript).
- **Backend managé** : Supabase (Auth, PostgreSQL, Storage, RPC SQL).
- **Migrations DB** : `supabase/*.sql`.
- **Scripts utilitaires** : `scripts/` et scripts racine (`check_*.ts`, `sync_*.ts`).
- **Assets SEO/PWA** : `public/`.
- **Documentation technique existante** : `README.md`, `ARCHITECTURE.md`, `API_DOCS.md`, `DB_SCHEMA.md`.

### Séparation frontend/backend
- Pas de serveur applicatif custom actif dans ce repo pour la prod web.
- Le frontend appelle directement Supabase (`supabase.from`, `supabase.rpc`, `supabase.storage`, `supabase.auth`).

### Architecture globale
- **Client SPA React**
  - Routing React Router (public/protected/admin)
  - état global Zustand
  - UI + logique de parcours
- **Supabase**
  - Auth utilisateurs
  - PostgreSQL + RLS
  - RPC métier (promo, bundles, reco, vector search, POS customer)
  - Storage images produit
- **Services IA externes**
  - OpenRouter (chat + embeddings)
  - Gemini Live (voix temps réel)

### Patterns utilisés
- Route guards (`ProtectedRoute`, `AdminRoute`).
- Lazy loading des pages.
- Domain stores (auth/cart/settings).
- Feature modules admin en onglets.
- Hybrid business logic (UI + SQL RPC).

### Frameworks / libs / conventions
- Frontend: React 19 + Vite + TypeScript.
- Routing: `react-router-dom`.
- State: Zustand (+ persistance locale panier).
- Data access: Supabase JS.
- UI: Tailwind + Motion + Lucide.

---

## 3) STACK TECHNIQUE

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Zustand
- TailwindCSS
- Motion
- Recharts
- Lucide
- React Markdown

### Backend/Data
- Supabase Auth
- Supabase PostgREST
- Supabase RPC SQL
- Supabase Storage
- PostgreSQL
- pgvector (vector search)

### IA
- OpenRouter API (chat/embeddings)
- Google Gemini API (voix live et scripts embeddings Gemini)

### Infra/config
- Variables d’environnement `.env`
- Sitemaps XML générées par script
- PWA assets (`manifest`, `sw.js`)

### Dépendances notables possiblement non exploitées côté app web
- `express`, `better-sqlite3` présents dans `package.json` mais pas utilisés dans `src/`.

---

## 4) CARTOGRAPHIE COMPLÈTE DES FONCTIONNALITÉS

> Organisation par catégories fonctionnelles.

### A. Authentification
1. **Connexion email/mot de passe**
   - Objectif: authentifier client.
   - Front: `src/pages/Login.tsx`, `src/store/authStore.ts`.
   - API: `supabase.auth.signInWithPassword`.
   - Accès: public.

2. **Inscription**
   - Création compte + profil auto via trigger SQL.
   - Front: `Login.tsx`, `authStore.ts`.
   - Backend: trigger `handle_new_user` + table `profiles`.
   - Règles: mot de passe renforcé côté UI.

3. **Reset mot de passe**
   - Pages: `ForgotPassword`, `ResetPassword`.
   - API: `resetPasswordForEmail`, `updateUser`.

4. **Sessions actives par appareil**
   - `user_active_sessions` upsert au login/session refresh.
   - Front: `authStore.ts`.

### B. Gestion du compte
1. **Profil utilisateur** (`/compte/profil`)
2. **Adresses** (`/compte/adresses`) CRUD + défaut.
3. **Commandes** (`/compte/commandes`) + détails.
4. **Favoris** (`/compte/favoris`) via table `wishlists`.
5. **Avis utilisateur** (`/compte/avis`) publication/gestion.
6. **Historique fidélité** (`/compte/fidelite`).
7. **Abonnements** (`/compte/abonnements`) pause/reprise/annulation.
8. **Parrainage** (`/compte/parrainage`) code/referrals.

### C. Catalogue / shopping
1. **Catalogue global** (`/catalogue`)
2. **Fiche produit** (`/catalogue/:slug`)
3. **Produits liés / fréquemment achetés**
4. **Recherche prédictive (header)**
5. **Panier persistant** (`cartStore` + sidebar)
6. **Badges stock & quantité**

### D. Checkout / transaction
1. **Choix livraison** (click & collect / livraison).
2. **Sélection/création adresse**.
3. **Application code promo** (`promo_codes`).
4. **Utilisation points fidélité** (conversion par paliers).
5. **Création commande + order_items**.
6. **Simulation paiement Viva** (placeholder, pas intégration serveur finale).
7. **Décrément stock + journal mouvements**.
8. **Crédit/débit points fidélité + journal transactions**.
9. **Activation récompense parrainage à la 1ère commande payée**.

### E. Administration
1. **Dashboard admin** (KPI, commandes récentes, revenus).
2. **Produits** (CRUD, activation, stock, bundles).
3. **Catégories** (CRUD logique + activation).
4. **Commandes** (statuts, suivi).
5. **Stock** (mouvements).
6. **Clients** (lecture, rôle admin toggle).
7. **Paramètres boutique** (`store_settings`).
8. **Analytics** (graphiques Recharts).
9. **Abonnements** (gestion + génération order liée).
10. **Avis** (modération publication).
11. **Codes promo** (CRUD + activation).
12. **Recommandations produits** (table dédiée).
13. **BudTender admin** (config IA et logs).
14. **Referrals admin** (suivi programme).
15. **POS admin** (caisse).

### F. POS (caisse magasin)
- Recherche produits, panier caisse, remises, promo.
- Paiements cash/card/mobile.
- Gestion client caisse (recherche + création via RPC).
- Utilisation/attribution points fidélité.
- Impression ticket.
- Rapport journalier + réconciliation cash + historique.
- Persistance/reporting via `orders`, `order_items`, `stock_movements`, `pos_reports`.

### G. IA / personnalisation
1. **BudTender chat**
   - Quiz onboarding préférences.
   - Recommandations avec mémoire.
   - Historique sessions persisté.
2. **BudTender mémoire utilisateur**
   - `user_ai_preferences`, `budtender_interactions`.
   - exploitation historique d’achats.
3. **Recherche vectorielle**
   - `products.embedding` + RPC `match_products`.
4. **BudTender voix temps réel**
   - Hook `useGeminiLiveVoice` vers Gemini Live.

### H. Contenu/SEO
- Pages statiques: home, boutique, qualité, contact, légal.
- Guides SEO (`/guides/...`).
- Sitemaps générés depuis CSV produit.

### I. Système interne
- Splash screen / age gate / toast.
- Error boundary global.
- SEO component + schema builder.

---

## 5) PARCOURS UTILISATEUR COMPLET

### Utilisateur non connecté
1. Arrive sur `/`.
2. Voit bannière + navigation + catalogue + CTA.
3. Peut consulter `/catalogue`, fiches produits, guides.
4. Peut remplir panier librement.
5. Au checkout `/commande`, redirigé vers `/connexion` (route protégée).
6. Peut s’inscrire / se connecter.

### Utilisateur connecté
1. Accède au compte (`/compte`) avec modules.
2. Navigue catalogue, ajoute au panier.
3. Checkout: livraison/adresse/promo/points.
4. Validation commande + confirmation.
5. Suit commandes, fidélité, abonnements, avis.
6. Utilise BudTender (si activé).

### Utilisateur admin
1. Connexion avec `profile.is_admin = true`.
2. Accès `/admin` (sinon redirection `/`).
3. Pilote onglets métier.
4. Peut accéder `/pos` (route admin).

---

## 6) CARTOGRAPHIE DES ÉCRANS ET ROUTES

### Routes publiques
- `/` : Home (landing premium + CTA)
- `/boutique` : présentation boutique
- `/produits` : listing marketing produit
- `/qualite` : qualité/légalité CBD
- `/contact` : contact
- `/mentions-legales` : légal
- `/connexion` : login/inscription
- `/mot-de-passe-oublie` : reset request
- `/reinitialiser-mot-de-passe` : update password
- `/catalogue` : catalogue e-commerce
- `/catalogue/:slug` : fiche produit
- `/guides` + `/guides/...` : contenus SEO éditoriaux
- `/panier` : panier

### Routes protégées (auth)
- `/commande`
- `/commande/confirmation`
- `/compte`
- `/compte/commandes`
- `/compte/adresses`
- `/compte/abonnements`
- `/compte/fidelite`
- `/compte/avis`
- `/compte/favoris`
- `/compte/parrainage`
- `/compte/profil`

### Routes admin
- `/admin`
- `/pos`

### Fallback
- `*` : NotFound

---

## 7) FLUX DE DONNÉES

### Flux principal e-commerce
1. Front charge catégories/produits (Supabase select).
2. Utilisateur ajoute produits (Zustand local persisted).
3. Checkout crée `orders` puis `order_items`.
4. Stock décrémenté dans `products` + journal `stock_movements`.
5. Profil points mis à jour + logs `loyalty_transactions`.
6. Confirmation affichée côté front.

### Flux auth
- Supabase session -> `authStore.initialize` -> fetch profil -> guards route.

### Flux configuration runtime
- `settingsStore.fetchSettings` lit `store_settings`.
- Les settings pilotent bannière, livraison, BudTender, search, referrals, etc.

### Flux BudTender
- Préférences + historiques sauvegardés local + Supabase.
- Reco via embeddings + RPC `match_products` + OpenRouter/Gemini selon mode.

### Flux POS
- Catalogue/clients chargés depuis Supabase.
- Vente caisse crée commandes et effets stock/points.
- Rapport de journée écrit dans `pos_reports`.

---

## 8) MODÈLE DE DONNÉES

### Noyau tables
- `categories`
- `products`
- `profiles`
- `addresses`
- `orders`
- `order_items`
- `stock_movements`
- `store_settings`

### Extensions e-commerce
- `promo_codes`
- `bundle_items`
- `product_images`
- `product_recommendations`
- `wishlists`

### Engagement/client lifecycle
- `loyalty_transactions`
- `subscriptions`
- `subscription_orders`
- `reviews`
- `referrals`

### IA
- `user_ai_preferences`
- `budtender_interactions`
- `products.embedding` (pgvector)

### POS
- `pos_reports`
- `user_active_sessions`

### Relations clés
- `products.category_id -> categories.id`
- `orders.user_id -> profiles.id`
- `order_items.order_id -> orders.id`
- `order_items.product_id -> products.id`
- `reviews` lie user+product+order
- `referrals` lie referrer/referee
- `subscriptions` lie user+product

### Contraintes métier visibles
- RLS largement activée.
- Politiques owner/admin/public selon table.
- Unicité : slug catégories/produits, etc.

---

## 9) LOGIQUE MÉTIER

### Commandes
- Statuts: `pending/paid/processing/ready/shipped/delivered/cancelled`.
- Au checkout web, paiement simulé -> passe rapidement à `paid + processing`.

### Fidélité
- Earn: points = `floor(total commande)`.
- Redeem: par paliers de 100 points (valeur monétaire fixe côté UI checkout).
- Historisation dans `loyalty_transactions`.

### Promo
- Vérification validité code (actif, dates, limites, montant min selon implémentation UI).
- Usage incrémenté par RPC `increment_promo_uses`.

### Parrainage
- À l’inscription: possibilité de lier un `referred_by_id` + event `joined`.
- À la 1ère commande payée: `status=completed`, crédit points parrain.
- Bonus de bienvenue configurable via settings.

### Bundles
- Produit bundle alimenté via `bundle_items`.
- Stock bundle synchronisé via RPC `sync_bundle_stock`.

### BudTender
- Quiz paramétrable.
- Mémoire activable (préférences + historique sessions).
- Restock suggestions basées sur délai depuis dernier achat par catégorie.

---

## 10) SYSTÈMES INTERNES

### Authentification
- Supabase Auth (email/password).
- Trigger SQL de création profil.

### Rôles / permissions
- Champ `profiles.is_admin` + RLS admin policies.
- Guards UI front pour routes.

### Emails
- Reset password via Supabase.
- Pas de service emailing transactionnel explicite dans le repo.

### Notifications
- Toasts UI locaux.

### Paiements
- Viva Wallet prévu mais non finalisé côté backend (placeholder simulé).

### Uploads
- Storage bucket `product-images` (admin).

### Tâches automatiques
- Triggers SQL (profil/referral code/bundle stock).
- Scripts manuels pour embeddings/sitemaps.

### Webhooks
- Aucun webhook explicite trouvé.

### Intégrations externes
- Supabase
- OpenRouter
- Gemini
- Viva (partiel)

---

## 11) DIAGRAMMES LOGIQUES (texte)

### Diagramme architecture
`[React SPA] -> [Supabase Auth + DB + Storage + RPC] -> [PostgreSQL + pgvector]`

`[React SPA] -> [OpenRouter API]`

`[React SPA] -> [Gemini Live WS]`

### Diagramme parcours achat
`Landing -> Catalogue -> Fiche produit -> Panier -> (Auth) -> Checkout -> Création commande -> Stock/Points -> Confirmation`

### Diagramme flux données checkout
`cartStore(local)`
` -> insert orders`
` -> insert order_items`
` -> update products(stock)`
` -> insert stock_movements`
` -> update profiles(loyalty_points)`
` -> insert loyalty_transactions`
` -> rpc increment_promo_uses`

---

## 12) FONCTIONNALITÉS INCOMPLÈTES OU CACHÉES

1. **Paiement Viva**
   - Intégration réelle commentée dans checkout; simulation utilisée.

2. **Coexistence migrations vector 768 / 3072**
   - Plusieurs scripts de correction/upgrade suggèrent des itérations non stabilisées.

3. **Dépendances backend inutilisées dans app principale**
   - `express`, `better-sqlite3` présents mais pas connectés au flux SPA.

4. **Fonctionnalités “préparées” via settings**
   - Flags et options BudTender/feature toggles riches, pas tous visibles en UX publique.

5. **Possibles endpoints/scripts de maintenance hors flow utilisateur**
   - Scripts `check_*`, `sync_*` orientés diagnostics/ops.

---

## 13) RISQUES ET DETTES TECHNIQUES

1. **Business logic critique côté frontend**
   - Création commande, stock, points, referral orchestration côté client -> risque de contournement si RLS/RPC non strictement blindés.

2. **Workflow checkout non transactionnel DB**
   - Multiples opérations séquentielles (orders/items/stock/points) sans transaction atomique globale.

3. **Complexité élevée du module POS monolithique**
   - Composant très volumineux, maintenance/testabilité plus difficile.

4. **BudTender très riche mais dispersé**
   - logique entre composants/hooks/lib/scripts.

5. **Risque de divergence doc/code**
   - nombreuses docs existantes, potentiellement désynchronisées.

6. **Absence de tests automatisés visibles**
   - Pas de suite unit/integration/e2e dans repo.

7. **CI/CD absent**
   - Pas de pipeline qualité automatique.

---

## 14) AMÉLIORATIONS POSSIBLES

### Produit
- Finaliser paiement réel (Viva ou autre PSP) avec backend sécurisé.
- Parcours onboarding plus explicite (referral code, consentements, politiques).
- Exposer clairement les bénéfices fidélité/parrainage en checkout.

### Technique
- Déplacer logique critique checkout/POS dans RPC/functions atomiques.
- Ajouter tests (domaines: checkout, loyalty, referral, promo, RLS assumptions).
- Découper `AdminPOSTab` et `BudTender` en sous-modules.
- Standardiser stratégie embeddings (dimension unique).
- Ajouter validation runtime centralisée (zod/env schema).

### Architecture
- Introduire couche BFF/serverless pour paiements, webhooks, logique sensible.
- Instrumentation observabilité (logs structurés, tracing erreurs).
- CI: typecheck + lint + tests + build + checks SQL migrations.

### UX
- Simplifier la densité des écrans admin.
- Harmoniser feedback d’erreurs (network/auth/validation).
- Meilleure visibilité des statuts commande et délais.

---

## 15) RÉSUMÉ FINAL

Green Mood CBD est une application SaaS e-commerce spécialisée CBD, orientée omnicanal, reposant sur une SPA React et un backend Supabase fortement exploité (Auth/DB/RLS/RPC/Storage). Le produit couvre l’ensemble du cycle commerce (catalogue -> achat -> fidélisation -> pilotage admin -> caisse magasin), avec une couche IA avancée (BudTender chat/voix + vector search) qui constitue un différenciateur net.

Le système est fonctionnel et riche, mais présente des axes de consolidation : sécurisation et centralisation serveur des flux transactionnels, finalisation paiement réel, renforcement tests/CI, réduction de complexité de modules volumineux. La base métier est solide et bien structurée pour évoluer vers une plateforme retail CBD plus industrialisée.

---

## Hypothèses explicites
- Le repo ne contient pas de backend de paiement opérationnel ; hypothèse: externalisé ou non livré.
- Les politiques RLS sont considérées source de sécurité principale ; leur couverture réelle doit être validée dans l’instance Supabase cible.
- Certaines features sont inférées depuis settings/migrations même si UX publique partielle.
