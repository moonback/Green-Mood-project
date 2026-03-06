# 💰 Estimation Budgétaire & Technique — Green Mood CBD

> **Date** : Mars 2026  
> **Auteur** : Audit automatisé basé sur l'analyse factuelle du code source  
> **Base d'estimation** : 100+ fichiers analysés, 18 tables PostgreSQL, 27+ pages, 19 onglets admin, 2 intégrations IA, POS complet

---

## 📋 Résumé Exécutif

| Critère | Profil A — Senior | Profil B — Junior |
|---|---|---|
| **TJM** | 700 € (fourchette 600–800€) | 375 € (fourchette 300–450€) |
| **Charge totale** | **130 J/H** | **322 J/H** |
| **Durée réaliste** | **~7.5 mois** | **~19 mois** |
| **Coût développement** | **~91 000 € HT** | **~120 750 € HT** |
| **Coût total Année 1** | **~92 500 € HT** | **~122 250 € HT** |

> ⚠️ **Constat paradoxal** : Le profil Junior coûte **+32% de plus** que le Senior en coût total, malgré un TJM 2× inférieur. Raison : les modules IA/Voix/RLS/POS (55% du projet) nécessitent ×2.5 à ×3.3 plus de temps pour un profil non-expert.

---

## 📊 Tableau Comparatif Détaillé par Module

### Hypothèses de calcul

| Paramètre | Profil A — Senior | Profil B — Junior |
|---|---|---|
| **Profil** | Dev Fullstack Senior (Expert React/Supabase/IA) | Dev Junior/Intermédiaire (1-2 ans XP) |
| **TJM retenu** | **700 €** | **375 €** |
| **Journée type** | 7h productives | 7h productives |
| **Ratio d'efficacité** | ×1 (référence) | ×1.8 à ×3.3 selon complexité |

---

### Module 1 — Setup & Architecture Projet

**Périmètre :** Vite 6, React 19, TypeScript 5.8, Tailwind CSS v4 (plugin Vite), Zustand 5, React Router DOM v7, Supabase SDK, configuration ESM, alias `@/`, déduplication React, HMR conditionnel, ErrorBoundary global, SEOProvider, StrictMode.

| | Senior | Junior |
|---|---|---|
| **Charge** | 3 J/H | 6 J/H |
| **Coût** | 2 100 € | 2 250 € |
| **Ratio** | ×1 | ×2.0 |
| **Risque** | 🟢 Faible | 🟢 Faible |

**Justification :** Stack bien documentée, patterns standard.

---

### Module 2 — Design System & Layout Principal

**Périmètre :** Design system dark mode complet (`index.css` — 164 lignes), glow system (4 niveaux : `glow-green`, `glow-box-green`, `glow-box-green-sm`, `glow-pulse-green`), glassmorphism, fonts Google (Inter, Playfair Display, Dancing Script), scrollbar custom, accessibilité (`focus-visible`, `prefers-reduced-motion`), `Layout.tsx` (800 lignes — Header avec mega-menu, Footer, BannerTicker animé, recherche instantanée avec embeddings, Cart Sidebar, menu burger responsive), `SplashScreen.tsx` (vidéo), `AgeGate.tsx` (vérification d'âge), composant `SEO.tsx` (meta dynamiques).

| | Senior | Junior |
|---|---|---|
| **Charge** | 8 J/H | 18 J/H |
| **Coût** | 5 600 € | 6 750 € |
| **Ratio** | ×1 | ×2.3 |
| **Risque** | 🟡 Moyen | 🟡 Moyen |

**Justification :** Le Layout de 800 lignes intègre une recherche sémantique en temps réel (embeddings). La partie design system est accessible, mais la recherche vectorielle dans le header demande une compréhension des embeddings.

---

### Module 3 — E-commerce — Pages Publiques

**Périmètre :**
- `Home.tsx` (26KB) — Hero section, best-sellers, carousel avis, FAQ, statistiques
- `Catalog.tsx` (40KB) — Filtres multi-critères (catégorie, prix, CBD%, attributs), tri, recherche sémantique vectorielle, pagination
- `ProductDetail.tsx` (46KB) — Fiche complète, galerie, badges stock, sélecteur quantité, avis vérifiés, bundle details, cross-selling (`RelatedProducts`, `FrequentlyBoughtTogether`)
- `Shop.tsx` (12KB) — Présentation boutique physique, carte, horaires
- `Products.tsx` (14KB) — Vitrine par catégorie
- `Quality.tsx` (13KB) — Page qualité/traçabilité
- `Contact.tsx` (13KB) — Formulaire de contact
- `Legal.tsx` (5KB) — Mentions légales
- `Guides.tsx` + `GuidePage.tsx` — 5 guides SEO (huile, dosage, sommeil, anxiété, légalité)
- `NotFound.tsx` (5KB) — Page 404
- `Login.tsx` (11KB) — Connexion + inscription avec code parrainage
- `ForgotPassword.tsx` (4KB) + `ResetPassword.tsx` (7KB)
- Composants : `ProductCard.tsx` (10KB), `BestSellers.tsx` (6KB), `ReviewCarousel.tsx` (13KB), `ReviewModal.tsx` (14KB), `StarRating.tsx`, `StockBadge.tsx`, `FAQ.tsx` (4KB)

| | Senior | Junior |
|---|---|---|
| **Charge** | 18 J/H | 40 J/H |
| **Coût** | 12 600 € | 15 000 € |
| **Ratio** | ×1 | ×2.2 |
| **Risque** | 🟡 Moyen | 🟡 Moyen |

**Justification :** Volume important (13+ pages, 7+ composants) mais patterns relativement classiques. La recherche sémantique dans le Catalog est le point de complexité.

---

### Module 4 — Panier, Codes Promo & Checkout

**Périmètre :**
- `Cart.tsx` (13KB) — Page panier complète
- `CartSidebar.tsx` (16KB) — Sidebar glissant avec animations
- `FreeShippingGauge.tsx` (9KB) — Jauge animée de livraison gratuite
- `EmptyCartSuggestions.tsx` (7KB) — Produits suggérés quand panier vide
- `PromoCodeInput.tsx` (7KB) — Validation asynchrone des codes promo contre Supabase
- `QuantitySelector.tsx` (2KB)
- `Checkout.tsx` (29KB) — Tunnel complet : choix livraison (Click & Collect / Delivery), sélection adresse, récapitulatif, intégration Viva Wallet, création commande + order_items + loyalty points + promo incrémentation
- `OrderConfirmation.tsx` (5KB)
- `cartStore.ts` (3KB) — Zustand persist, calcul deliveryFee dynamique (seuil `delivery_free_threshold`)

| | Senior | Junior |
|---|---|---|
| **Charge** | 10 J/H | 22 J/H |
| **Coût** | 7 000 € | 8 250 € |
| **Ratio** | ×1 | ×2.2 |
| **Risque** | 🟡 Moyen | 🟡 Moyen |

**Justification :** Le tunnel de checkout est complexe (multi-étapes, logique fidélité, promo, paiement externe). L'intégration Viva Wallet ajoute de la complexité.

---

### Module 5 — Espace Compte Client

**Périmètre :**
- `Account.tsx` (11KB) — Dashboard personnel
- `Profile.tsx` (45KB) — Profil complet, édition, sessions actives multi-appareils (device tracking)
- `Orders.tsx` (15KB) — Historique commandes avec statuts
- `Addresses.tsx` (14KB) — CRUD adresses (label, rue, ville, CP, pays, défaut)
- `Favorites.tsx` (7KB) — Liste de souhaits
- `Subscriptions.tsx` (12KB) — Gestion abonnements (pause, fréquence, annulation)
- `LoyaltyHistory.tsx` (22KB) — Historique fidélité (earned/redeemed/adjusted/expired), solde, transactions
- `MyReviews.tsx` (8KB) — Avis laissés par l'utilisateur
- `Referrals.tsx` (14KB) — Programme parrainage (code GRN-XXXXXX, partage, tableau parrainés, bonus)
- `wishlistStore.ts` (1KB) — Zustand persist

| | Senior | Junior |
|---|---|---|
| **Charge** | 12 J/H | 25 J/H |
| **Coût** | 8 400 € | 9 375 € |
| **Ratio** | ×1 | ×2.1 |
| **Risque** | 🟡 Moyen | 🟡 Moyen |

**Justification :** CRUD standard via Supabase, mais le volume est conséquent (9 pages). La page Profile (45KB) avec sessions actives est la plus complexe.

---

### Module 6 — 🤖 BudTender IA — Chat Texte (RAG)

**Périmètre :**
- `BudTender.tsx` (**91KB** — 2000+ lignes) — Composant principal : quiz guidé dynamique (5 étapes), interface chat libre, recherche sémantique (embedding requête → pgvector `match_products`), gestion états (quiz/chat/loading/error), adaptation discours multi-niveaux (débutant/connaisseur/expert)
- `budtenderPrompts.ts` (12KB) — 3 prompts système complexes (`getQuizPrompt`, `getChatPrompt`, `getVoicePrompt`), injection contexte catalogue, profil client, panier
- `budtenderSettings.ts` (7KB) — Configuration quiz dynamique, modèle IA, seuils restock, migration des settings anciens
- `budtenderCache.ts` (5KB) — Cache TTL générique (produits 5min, settings 2min), LRU embeddings (50 entrées, 10min), déduplication fetches
- `embeddings.ts` (2KB) — Génération embeddings via OpenRouter API, cache LRU
- `productAI.ts` (4KB) — Auto-génération descriptions produit via LLM (OpenRouter)
- `useBudTenderMemory.ts` (16KB) — Hook persistance mémoire client (user_ai_preferences dans Supabase, historique achats, préférences terpènes)
- `budtender-ui/` — 5 composants UI : `BudTenderWidget.tsx` (FAB avec pulse animation), `BudTenderMessage.tsx` (bulle avec rendu Markdown), `BudTenderTypingIndicator.tsx`, `BudTenderFeedback.tsx`, `index.ts`

| | Senior | Junior |
|---|---|---|
| **Charge** | 15 J/H | 45 J/H |
| **Coût** | 10 500 € | 16 875 € |
| **Ratio** | ×1 | ×3.0 |
| **Risque** | 🟡 Moyen | 🔴 **Élevé** |

**Points de blocage Junior :**
- Architecture RAG (Retrieval Augmented Generation) : embedding → similarité cosinus → prompt engineering
- Gestion du cache LRU et déduplication de fetches concurrents
- Tuning des seuils de similarité (match_threshold)
- Prompt engineering multi-niveaux (287 lignes de prompts)
- Le fichier principal fait **91KB** — densité de logique très élevée

---

### Module 7 — 🎙 BudTender IA — Voix Temps Réel (Gemini Live)

**Périmètre :**
- `useGeminiLiveVoice.ts` (22KB, 529 lignes) — Hook complet : connexion WebSocket Gemini Live API, AudioWorklet PCM 16-bit 16kHz (capture micro), WebAudio API output 24kHz (lecture réponse), function calling asynchrone (5 tools), gestion interruptions utilisateur, timeout reconnexion (10s), scheduling audio, conversion Float32→Int16→Base64
- `VoiceAdvisor.tsx` (22KB) — Interface visuelle du conseiller vocal (états : idle, connecting, listening, speaking), visualiseur audio, intégration panier
- `audio-processor.js` (1.5KB) — AudioWorkletProcessor pour capture micro
- Prompts voix dans `budtenderPrompts.ts` → `getVoicePrompt()` (170+ lignes, injection contexte)
- Function calling : `search_catalog` (embedding + match_products), `add_to_cart` (avec quantité/poids), `view_product` (navigation), `navigate_to` (routing), `close_session` (fermeture propre)

| | Senior | Junior |
|---|---|---|
| **Charge** | 12 J/H | 40 J/H |
| **Coût** | 8 400 € | 15 000 € |
| **Ratio** | ×1 | ×3.3 |
| **Risque** | 🟡 Moyen | 🔴 **Critique** |

**Points de blocage Junior :**
- **WebSocket audio bidirectionnel** — Peu de documentation publique sur `@google/genai` Live API
- **AudioWorklet API** — API Web avancée, debugging difficile
- **Encodage audio** — PCM 16-bit, resampling 16kHz→24kHz, conversion binaire→Base64
- **Function calling asynchrone** — Gérer les appels d'outil pendant le streaming audio
- **Gestion des interruptions** — L'utilisateur peut couper la parole en plein réponse audio
- **Risque estimé** : Un junior peut **bloquer 2-4 semaines** sur ce module seul

---

### Module 8 — Back-office Admin

**Périmètre :** 19 onglets dans `Admin.tsx` (16KB, shell avec navigation) :

| Onglet | Fichier | Taille | Complexité |
|---|---|---|---|
| Dashboard | `AdminDashboardTab.tsx` | 10KB | KPIs temps réel |
| Produits | `AdminProductsTab.tsx` | **71KB** | CRUD + import CSV + AI autofill + mass modify + image upload |
| Catégories | `AdminCategoriesTab.tsx` | 26KB | CRUD + réordonnancement |
| Commandes | `AdminOrdersTab.tsx` | 18KB | Suivi statuts, détails |
| Stocks | `AdminStockTab.tsx` | 14KB | Mouvements, alertes restock |
| Analytics | `AdminAnalyticsTab.tsx` | 24KB | Recharts (revenue, top produits, statuts, acquisition) |
| BudTender | `AdminBudTenderTab.tsx` | **49KB** | Config modèle IA, quiz editor, seuils |
| Codes Promo | `AdminPromoCodesTab.tsx` | 23KB | CRUD, limites, expiration |
| Recommandations | `AdminRecommendationsTab.tsx` | 18KB | Cross-selling manuel |
| Clients | `AdminCustomersTab.tsx` | 9KB | Liste, recherche clients |
| Avis | `AdminReviewsTab.tsx` | 7KB | Modération, publish/delete |
| Abonnements | `AdminSubscriptionsTab.tsx` | 12KB | Vue d'ensemble, actions |
| Parrainages | `AdminReferralsTab.tsx` | 19KB | Suivi, validation |
| Paramètres | `AdminSettingsTab.tsx` | 23KB | Config boutique complète |
| CSV Import | `CSVImporter.tsx` | 7KB | Parser PapaParse + validation |
| Mass Modify | `MassModifyModal.tsx` | 12KB | Edition groupée |
| Image Upload | `ProductImageUpload.tsx` | 7KB | Upload Supabase Storage |
| Preview | `AdminProductPreviewModal.tsx` | 8KB | Aperçu fiche produit |

| | Senior | Junior |
|---|---|---|
| **Charge** | 22 J/H | 50 J/H |
| **Coût** | 15 400 € | 18 750 € |
| **Ratio** | ×1 | ×2.3 |
| **Risque** | 🟡 Moyen | 🟡 Moyen |

**Justification :** Volume très important (19 fichiers, ~350KB de code) mais patterns CRUD répétitifs. Le tab Products (71KB) et BudTender config (49KB) sont les plus denses.

---

### Module 9 — POS (Point de Vente / Caisse)

**Périmètre :**
- `AdminPOSTab.tsx` (**132KB** — le plus gros fichier du projet, ~3000+ lignes)
- Caisse enregistreuse complète : recherche produit (nom/SKU/code-barres), ajout au ticket, sélection/création client walk-in
- Modes de paiement multiples : espèces (avec calcul rendu monnaie), carte bancaire, paiement mobile
- Gestion bundles dans le POS (décomposition automatique des composants)
- Rapports de clôture Z : total ventes, ventilation espèces/carte/mobile, comptage caisse physique, calcul différence (écart), breakdown par produit
- RPC `create_pos_customer` — création client en boutique (insertion `auth.users` + trigger profil)
- Historique des rapports POS (`pos_reports` table)

| | Senior | Junior |
|---|---|---|
| **Charge** | 15 J/H | 42 J/H |
| **Coût** | 10 500 € | 15 750 € |
| **Ratio** | ×1 | ×2.8 |
| **Risque** | 🟡 Moyen | 🔴 **Élevé** |

**Points de blocage Junior :**
- 132KB de logique métier dense dans un seul fichier
- États multiples complexes (ticket en cours, paiement, clôture)
- Logique de réconciliation financière (comptage caisse, écarts)
- Compréhension requise du retail physique et de la réglementation caisse

---

### Module 10 — Base de Données, RLS & Sécurité

**Périmètre :**
- **18 tables** PostgreSQL : `categories`, `products`, `profiles`, `addresses`, `orders`, `order_items`, `stock_movements`, `store_settings`, `loyalty_transactions`, `subscriptions`, `subscription_orders`, `reviews`, `promo_codes`, `bundle_items`, `product_recommendations`, `referrals`, `user_ai_preferences`, `budtender_interactions`, `pos_reports`, `user_active_sessions`
- **RLS sur 100% des tables** — Politiques granulaires (owner, admin, public, auth) avec sous-requêtes `EXISTS`
- **5 fonctions RPC** : `match_products` (pgvector), `get_product_recommendations`, `sync_bundle_stock`, `increment_promo_uses`, `create_pos_customer`
- **3 triggers** : `handle_new_user` (auto-profil), `tr_generate_referral_code` (code parrainage), `trg_sync_bundle_stock` (sync stock bundles)
- **pgvector extension** — Vecteurs 3072 dimensions, cosine similarity
- **Storage** — Bucket `product-images` avec politiques RLS (lecture publique, écriture admin)
- **12 fichiers de migration** (v1 → v9 + vecteurs + budtender)
- **Seeds** — Catégories, produits, settings, promo codes, recommandations

| | Senior | Junior |
|---|---|---|
| **Charge** | 8 J/H | 20 J/H |
| **Coût** | 5 600 € | 7 500 € |
| **Ratio** | ×1 | ×2.5 |
| **Risque** | 🟡 Moyen | 🔴 **Élevé** |

**Points de blocage Junior :**
- Politique RLS avec sous-requêtes imbriquées — une erreur expose des données ou bloque silencieusement
- Debugging RLS très difficile (erreurs Supabase peu explicites, pas de logs)
- pgvector : choix dimensions, performance, tuning seuils
- Fonctions RPC avec `SECURITY DEFINER` — risques de sécurité en cas de mauvaise utilisation

---

### Module 11 — SEO & PWA

**Périmètre :**
- `SEO.tsx` (6KB) — Composant Head avec meta tags dynamiques
- `metaBuilder.ts` (4KB) — Génération meta title/description par page
- `schemaBuilder.ts` (6KB) — JSON-LD schema.org (Product, Organization, BreadcrumbList, FAQ)
- `internalLinks.ts` (1KB) — Maillage interne
- `SEOProvider.tsx` (1KB) — Provider React global
- `generate-sitemap.ts` (2KB) — Génération automatique de 4 sitemaps (index, pages, produits, blog)
- `robots.txt` (365B) — AI-friendly (GPTBot, ClaudeBot, PerplexityBot autorisés)
- `llms.txt` + `ai.txt` + `model-context.json` — Contexte pour crawlers IA
- `manifest.webmanifest` (1.2KB) — PWA (standalone, icônes, shortcuts)
- `sw.js` (2KB) — Service Worker Stale-While-Revalidate (exclut Supabase et OpenRouter)
- `_redirects` — SPA fallback

| | Senior | Junior |
|---|---|---|
| **Charge** | 5 J/H | 10 J/H |
| **Coût** | 3 500 € | 3 750 € |
| **Ratio** | ×1 | ×2.0 |
| **Risque** | 🟢 Faible | 🟢 Faible |

**Justification :** Patterns SEO/PWA bien établis et documentés.

---

### Module 12 — Scripts & DevOps

**Périmètre :**
- `sync-embeddings.ts` (3KB) — Synchronisation embeddings Gemini → Supabase (batch)
- `generate-sitemap.ts` (2KB) — Génération sitemaps
- Scripts de debug : `check_dims.ts`, `check_dims_v2.ts`, `check_rpc.ts`, `check_vectors.ts`, `debug_sync.ts`, `sync_vectors.ts`, `list_models.ts`, `test.js`
- `.gitignore` — Exclusions standard + .env + .claude + .gemini
- `.env.example` — Template avec 12 variables documentées

| | Senior | Junior |
|---|---|---|
| **Charge** | 2 J/H | 4 J/H |
| **Coût** | 1 400 € | 1 500 € |
| **Ratio** | ×1 | ×2.0 |
| **Risque** | 🟢 Faible | 🟢 Faible |

---

## 📈 Récapitulatif Global Charge & Coûts

### Par module

| # | Module | Senior J/H | Senior € | Junior J/H | Junior € | Risque Junior |
|---|---|---|---|---|---|---|
| 1 | Setup & Architecture | 3 | 2 100 | 6 | 2 250 | 🟢 |
| 2 | Design System & Layout | 8 | 5 600 | 18 | 6 750 | 🟡 |
| 3 | Pages publiques e-commerce | 18 | 12 600 | 40 | 15 000 | 🟡 |
| 4 | Panier & Checkout | 10 | 7 000 | 22 | 8 250 | 🟡 |
| 5 | Espace Compte Client | 12 | 8 400 | 25 | 9 375 | 🟡 |
| 6 | BudTender IA — Chat (RAG) | 15 | 10 500 | 45 | 16 875 | 🔴 |
| 7 | BudTender IA — Voix (Gemini) | 12 | 8 400 | 40 | 15 000 | 🔴 |
| 8 | Back-office Admin | 22 | 15 400 | 50 | 18 750 | 🟡 |
| 9 | POS (Point de Vente) | 15 | 10 500 | 42 | 15 750 | 🔴 |
| 10 | Base de données & RLS | 8 | 5 600 | 20 | 7 500 | 🔴 |
| 11 | SEO & PWA | 5 | 3 500 | 10 | 3 750 | 🟢 |
| 12 | Scripts & DevOps | 2 | 1 400 | 4 | 1 500 | 🟢 |
| | **TOTAL** | **130 J/H** | **91 000 €** | **322 J/H** | **120 750 €** | |

### Durée calendaire

| | Senior | Junior |
|---|---|---|
| **J/H bruts** | 130 jours | 322 jours |
| **Semaines** (5j/sem) | 26 semaines | 64 semaines |
| **Mois** (22j/mois) | ~6 mois | ~14.5 mois |
| **Durée réaliste** (+25% aléas, tests, debug, réunions) | **~7.5 mois** | **~19 mois** |

---

## 🔴 Analyse des Risques — Profil Junior

### Matrice de risques

| Module | Complexité technique | Documentation disponible | Risque de blocage | Temps de blocage estimé |
|---|---|---|---|---|
| **BudTender Voix (Gemini Live)** | 🔴 Très haute | 🔴 Faible (API nouvelle) | 🔴 **Critique** | 2-4 semaines |
| **BudTender Chat (RAG)** | 🔴 Haute | 🟡 Moyenne | 🔴 **Élevé** | 1-3 semaines |
| **RLS PostgreSQL** | 🔴 Haute | 🟡 Moyenne | 🔴 **Élevé** | 1-2 semaines |
| **POS** | 🟡 Haute | 🟡 Faible (métier retail) | 🔴 **Élevé** | 1-2 semaines |
| **pgvector** | 🟡 Moyenne-haute | 🟡 Moyenne | 🟡 Moyen | 3-5 jours |
| **Checkout (Viva Wallet)** | 🟡 Moyenne | 🟡 Moyenne | 🟡 Moyen | 2-3 jours |
| **Pages e-commerce** | 🟢 Standard | 🟢 Bonne | 🟢 Faible | — |
| **SEO & PWA** | 🟢 Standard | 🟢 Très bonne | 🟢 Faible | — |

### Détail des blocages critiques

#### 1. Gemini Live Audio API (🔴 Critique)

```
Problématiques spécifiques :
├── WebSocket bidirectionnel audio (pas HTTP classique)
├── AudioWorklet API (Web Worker spécialisé audio)
├── Encodage PCM : Float32 → Int16 → Base64
├── Resampling : microphone 44.1kHz → API 16kHz
├── Playback : API 24kHz → WebAudio output
├── Function calling pendant le streaming audio
├── Gestion interruptions (l'utilisateur coupe la parole)
├── Timeout et reconnexion WebSocket
└── Très peu d'exemples publics en production
```

**Impact** : Un junior sans expérience WebSocket/Audio risque de passer **80-120h** uniquement sur ce module vs **56h** pour un senior.

#### 2. Architecture RAG - BudTender Chat (🔴 Élevé)

```
Problématiques spécifiques :
├── Pipeline : texte → embedding (OpenRouter) → cosine similarity (pgvector) → prompt
├── Tuning du match_threshold (trop bas = bruit, trop haut = pas de résultats)
├── Prompt engineering (287 lignes, 3 prompts, multi-niveaux)
├── Cache LRU avec éviction et TTL
├── Déduplication de fetches concurrents (Promise sharing)
├── Gestion quotas API (retry, backoff, détection rate limit)
└── Fichier principal de 91KB (2000+ lignes à maintenir)
```

#### 3. Row Level Security (🔴 Élevé)

```
Problématiques spécifiques :
├── 18 tables × ~3 politiques chacune = ~54 règles RLS
├── Politiques avec sous-requêtes imbriquées (EXISTS + JOIN profiles)
├── Différenciation owner / admin / public / authenticated
├── Erreurs silencieuses (Supabase retourne [] au lieu d'une erreur 403)
├── Debugging RLS très difficile sans accès server-side logs
└── Une erreur = fuite de données OU blocage fonctionnel complet
```

---

## 💶 Coûts d'Infrastructure Mensuels

### Services Cloud

| Service | Plan | Coût/mois | Détail |
|---|---|---|---|
| **Supabase** | Pro | **25 $** (~23€) | 8 Go DB, 250 Go bandwidth, 100 Go storage, Auth illimité, pgvector inclus |
| **Supabase** | Pro + Compute addon | **50-100 $** | Si besoin de performances vecteurs (déconseillé au démarrage) |
| **OpenRouter** — Embeddings | Pay-per-use | **~5-15 €** | `text-embedding-3-small` : ~0.02$/1M tokens. Estimation : 500-2000 conversations/mois |
| **OpenRouter** — LLM Chat | Pay-per-use | **~10-35 €** | `gemini-2.0-flash-lite` (gratuit) ou modèle payant. Fallback : ~0.10$/1M tokens |
| **Google Gemini** — Live Audio | Pay-per-use | **~20-80 €** | Audio input ~0.07$/min, audio output ~0.28$/min. Estimation : 100-500 sessions de 2min/mois |
| **Viva Wallet** | Commission | **Variable** | ~1.4% + 0.10€ par transaction. Pas d'abonnement fixe |
| **Hébergement frontend** | Netlify Free / Vercel Free | **0 €** | SPA statique, build Vite. Gratuit jusqu'à ~100 Go bandwidth |
| **Domaine** | greenmood.fr | **~1 €** | ~12€/an |

### Scénarios mensuels

| Scénario | Volume | Coût infrastructure/mois |
|---|---|---|
| **Lancement** (faible trafic) | 100 conversations IA, 50 sessions voix, 20 commandes | **~60 €/mois** |
| **Croissance** (trafic modéré) | 500 conversations, 200 sessions voix, 100 commandes | **~120 €/mois** |
| **Maturité** (trafic élevé) | 2000 conversations, 500 sessions voix, 500 commandes | **~225 €/mois** |

### Coût infrastructure annuel

| Scénario | Année 1 |
|---|---|
| **Lancement** | **~720 €** |
| **Croissance** | **~1 440 €** |
| **Maturité** | **~2 700 €** |

---

## 💰 Total Financier HT

### Profil A — Développeur Senior Fullstack

| Poste | Fourchette basse (600€/j) | TJM moyen (700€/j) | Fourchette haute (800€/j) |
|---|---|---|---|
| Développement (130 J/H) | 78 000 € | **91 000 €** | 104 000 € |
| Infrastructure Année 1 | ~1 000 € | ~1 500 € | ~2 700 € |
| **TOTAL Année 1** | **79 000 €** | **92 500 €** | **106 700 €** |

### Profil B — Développeur Junior/Intermédiaire

| Poste | Fourchette basse (300€/j) | TJM moyen (375€/j) | Fourchette haute (450€/j) |
|---|---|---|---|
| Développement (322 J/H) | 96 600 € | **120 750 €** | 144 900 € |
| Infrastructure Année 1 | ~1 000 € | ~1 500 € | ~2 700 € |
| **TOTAL Année 1** | **97 600 €** | **122 250 €** | **147 600 €** |

### Comparaison visuelle

```
Senior  ████████████████████████████████░░░░░░░░  92 500 €   (~7.5 mois)
Junior  ████████████████████████████████████████████████████  122 250 €  (~19 mois)
Hybride ██████████████████████████████████░░░░░░░  90 500 €   (~6 mois)
```

---

## 🔧 Forfait de Maintenance Mensuel

### Périmètre type

| Tâche | Fréquence | Charge/mois |
|---|---|---|
| Correctifs bugs & régressions | Continu | 0.5 – 1 j |
| Mises à jour dépendances (React, Supabase, Vite, Tailwind) | Mensuel | 0.5 j |
| Monitoring performances & erreurs | Mensuel | 0.25 j |
| Évolutions mineures (UI, ajustements catalogue, nouveaux produits) | Sur demande | 0.5 – 1.5 j |
| Maintenance IA (tuning prompts, recalibrage seuils vectoriels, nouveaux modèles) | Mensuel | 0.25 – 0.5 j |
| Migrations DB & évolutions schema | Ponctuel | 0 – 0.5 j |
| Sauvegarde & audit RLS | Trimestriel | 0 – 0.25 j |

### Grille tarifaire

| Formule | Senior (700€/j) | Junior (375€/j) |
|---|---|---|
| **Light** — 2 j/mois | **1 400 €/mois** | 750 €/mois |
| **Standard** — 3 j/mois | **2 100 €/mois** ⭐ | 1 125 €/mois |
| **Premium** — 4 j/mois | **2 800 €/mois** | 1 500 €/mois |

> **💡 Recommandation :** Forfait **Standard Senior à 2 100€/mois**. Il couvre les correctifs, les mises à jour mensuelles, et 1-2 petites évolutions, avec la réactivité d'un expert sur les composants IA et RLS critiques.

### Coût maintenance annuel

| Formule | Senior | Junior |
|---|---|---|
| **Light** (24 j/an) | 16 800 €/an | 9 000 €/an |
| **Standard** (36 j/an) | 25 200 €/an | 13 500 €/an |
| **Premium** (48 j/an) | 33 600 €/an | 18 000 €/an |

---

## 🎯 Scénario Hybride Optimal

Si le budget est contraint, une approche hybride permet d'optimiser les coûts :

| Phase | Profil | Modules | J/H | Coût |
|---|---|---|---|---|
| **Phase 1** — Architecture & modules critiques | **Senior** | Setup, BudTender Chat, BudTender Voix, RLS/DB, POS | 53 J/H | 37 100 € |
| **Phase 2** — E-commerce & admin (en parallèle) | **Junior** | Pages publiques, Panier, Compte client, Admin CRUD, SEO | 120 J/H | 45 000 € |
| **Phase 3** — Intégration & review | **Senior** | Code review, intégration, tests, polish | 12 J/H | 8 400 € |
| | | **TOTAL HYBRIDE** | **~185 J/H** | **~90 500 € HT** |

**Avantages :**
- ✅ Coût le plus bas des 3 scénarios (~90 500 € vs 91 000 Senior ou 120 750 Junior)
- ✅ Durée la plus courte (~6 mois, les deux profils travaillent en parallèle dès Phase 2)
- ✅ L'architecture et les modules IA/sécurité sont posés par un expert
- ✅ Le Junior apprend sur les modules standards avec un code de référence
- ⚠️ Nécessite une bonne coordination entre les deux profils

---

## 📌 Conclusion & Recommandation

| Critère | Senior solo | Junior solo | Hybride |
|---|---|---|---|
| **Coût total** | ~92 500 € | ~122 250 € | **~90 500 €** ⭐ |
| **Durée** | ~7.5 mois | ~19 mois | **~6 mois** ⭐ |
| **Qualité code** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Risque technique** | 🟢 Faible | 🔴 Élevé | 🟡 Modéré |
| **Maintenabilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Time-to-market** | Rapide | Très lent | **Le plus rapide** ⭐ |

> **Recommandation finale :** Le scénario **hybride** ou **Senior solo** sont les seuls viables pour un projet de cette envergure technique. Le scénario Junior solo est déconseillé en raison du risque élevé de blocage sur les modules IA/Voix/RLS, d'un time-to-market presque 3× plus long, et d'un coût paradoxalement supérieur.

---

> ⚠️ **Note importante** : Ces estimations représentent la **valeur de production from scratch** du projet. Si le code est déjà fonctionnel (ce qui semble être le cas d'après l'analyse), ces chiffres mesurent le **travail déjà accompli** et servent de base pour valoriser le projet ou estimer des extensions futures.
