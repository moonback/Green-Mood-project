# 🗺 Roadmap — Green Mood CBD

> Statuts : ✅ Fait · 🚧 En cours · 📋 Planifié · 💡 Idée

---

## Phase 1 — MVP E-commerce

| Statut | Fonctionnalité |
|---|---|
| ✅ | Catalogue de produits (catégories, filtres, tri) |
| ✅ | Fiches produit détaillées (CBD %, arômes, bénéfices) |
| ✅ | Panier persistant (localStorage via Zustand) |
| ✅ | Authentification email/password (Supabase GoTrue) |
| ✅ | Création automatique de profil (trigger DB) |
| ✅ | Gestion des adresses utilisateur |
| ✅ | Checkout (Click & Collect + Livraison) |
| ✅ | Gestion des commandes (historique, suivi statut) |
| ✅ | Back-office admin (dashboard, produits, commandes, stocks) |
| ✅ | Row Level Security sur toutes les tables |
| ✅ | Guard routes (ProtectedRoute + AdminRoute) |

---

## Phase 2 — IA BudTender & Engagement

| Statut | Fonctionnalité |
|---|---|
| ✅ | BudTender IA — Quiz guidé (5 étapes) |
| ✅ | BudTender IA — Chat libre avec contexte catalogue |
| ✅ | Recherche sémantique vectorielle (pgvector + OpenRouter embeddings) |
| ✅ | Mémoire client IA (user_ai_preferences persistées en DB) |
| ✅ | Cache multi-niveaux (TTL produits, settings, LRU embeddings) |
| ✅ | BudTender IA vocal — Gemini Live Audio (WebSocket temps réel) |
| ✅ | Function calling vocal (search_catalog, add_to_cart, view_product, navigate_to) |
| ✅ | Adaptation du discours IA selon le niveau client (débutant/connaisseur/expert) |
| ✅ | Configuration admin du BudTender (modèle, température, quiz, seuils) |

---

## Phase 3 — Fidélisation & Croissance

| Statut | Fonctionnalité |
|---|---|
| ✅ | Programme de fidélité (points, earn/redeem, historique) |
| ✅ | Programme de parrainage (codes uniques GRN-XXXXXX, bonus bienvenue) |
| ✅ | Abonnements récurrents (hebdo / bi-mensuel / mensuel) |
| ✅ | Système d'avis produits (rating 5 étoiles, commentaires, modération) |
| ✅ | Codes promotionnels (pourcentage / fixe, limites usage, expiration) |
| ✅ | Bundles / Packs découverte (sync stock automatique) |
| ✅ | Cross-selling (recommandations manuelles + fallback catégorie) |
| ✅ | Suggestions panier vide |
| ✅ | Jauges livraison gratuite (FreeShippingGauge) |

---

## Phase 4 — POS & Retail

| Statut | Fonctionnalité |
|---|---|
| ✅ | POS — Caisse enregistreuse intégrée |
| ✅ | POS — Scan code-barres (SKU) |
| ✅ | POS — Création client walk-in (RPC `create_pos_customer`) |
| ✅ | POS — Rapports de clôture Z |
| ✅ | POS — Réconciliation caisse (cash counting, différence) |
| ✅ | POS — Breakdown produits par rapport |
| ✅ | POS — Modes de paiement multiples (espèces, cartes, mobile) |

---

## Phase 5 — SEO & PWA

| Statut | Fonctionnalité |
|---|---|
| ✅ | PWA installable (manifest, Service Worker) |
| ✅ | Mode offline partiel (Stale-While-Revalidate) |
| ✅ | Sitemaps automatiques (pages, produits, blog) |
| ✅ | Meta tags dynamiques (SEO.tsx + metaBuilder) |
| ✅ | JSON-LD schema.org (Product, Organization, BreadcrumbList) |
| ✅ | robots.txt AI-friendly (GPTBot, ClaudeBot autorisés) |
| ✅ | llms.txt & ai.txt (contexte pour crawlers IA) |
| ✅ | Guides CBD éducatifs (5 articles SEO) |

---

## Phase 6 — Améliorations UI/UX

| Statut | Fonctionnalité |
|---|---|
| ✅ | Design system dark mode (neon green, glassmorphism, glow effects) |
| ✅ | Animations Framer Motion |
| ✅ | Splash screen vidéo |
| ✅ | Bannière ticker dynamique |
| ✅ | Recherche globale avec résultats instantanés |
| ✅ | AgeGate (vérification d'âge) |
| ✅ | Error Boundary global |
| ✅ | Sessions actives (gestion multi-appareils) |
| ✅ | Lazy loading de toutes les pages |
| ✅ | Accessibilité (focus-visible, reduced-motion) |

---

## 📋 Planifié

| Statut | Fonctionnalité |
|---|---|
| 📋 | Notifications push (PWA) |
| 📋 | Passerelle de paiement complète (Viva Wallet end-to-end) |
| 📋 | Tests unitaires et e2e |
| 📋 | CI/CD pipeline (GitHub Actions) |
| 📋 | Internationalisation (i18n) |

---

## 💡 Idées Futures

| Statut | Fonctionnalité |
|---|---|
| 💡 | Tracking colis en temps réel |
| 💡 | Blog communautaire |
| 💡 | Live chat support humain |
| 💡 | Recommandations IA par terpènes / profil cannabinoïde |
| 💡 | Dashboard analytics avancé (retention, LTV, cohortes) |
| 💡 | App mobile native (React Native) |
| 💡 | Intégration ERP / comptabilité |
