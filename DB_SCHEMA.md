# 🗄 Schéma de Base de Données — Green Mood CBD

> Base de données : **PostgreSQL** via **Supabase**  
> Extensions : **pgvector** (recherche sémantique)  
> Sécurité : **Row Level Security (RLS)** sur toutes les tables

---

## Diagramme ERD

```mermaid
erDiagram
    CATEGORIES ||--o{ PRODUCTS : "has"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered in"
    PRODUCTS ||--o{ REVIEWS : "reviewed"
    PRODUCTS ||--o{ BUNDLE_ITEMS : "component of"
    PRODUCTS ||--o{ PRODUCT_RECOMMENDATIONS : "recommends"
    PRODUCTS ||--o{ SUBSCRIPTIONS : "subscribed to"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "tracked by"

    AUTH_USERS ||--|| PROFILES : "has"
    PROFILES ||--o{ ADDRESSES : "owns"
    PROFILES ||--o{ ORDERS : "places"
    PROFILES ||--o{ REVIEWS : "writes"
    PROFILES ||--o{ REFERRALS : "refers"
    PROFILES ||--o{ SUBSCRIPTIONS : "subscribes"
    PROFILES ||--o{ LOYALTY_TRANSACTIONS : "earns/redeems"
    PROFILES ||--o{ USER_AI_PREFERENCES : "configures"
    PROFILES ||--o{ BUDTENDER_INTERACTIONS : "interacts"

    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ LOYALTY_TRANSACTIONS : "generates"
    ORDERS ||--o{ REVIEWS : "allows"

    SUBSCRIPTIONS ||--o{ SUBSCRIPTION_ORDERS : "triggers"
    SUBSCRIPTION_ORDERS ||--|| ORDERS : "links"

    AUTH_USERS ||--o{ USER_ACTIVE_SESSIONS : "tracks"

    CATEGORIES {
        uuid id PK
        text slug UK
        text name
        text description
        text icon_name
        text image_url
        int sort_order
        boolean is_active
        timestamptz created_at
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        text slug UK
        text name
        text sku UK
        text description
        numeric cbd_percentage
        numeric thc_max
        numeric weight_grams
        numeric price
        text image_url
        int stock_quantity
        boolean is_available
        boolean is_featured
        boolean is_active
        boolean is_bundle
        boolean is_subscribable
        numeric original_value
        jsonb attributes
        vector embedding
        timestamptz created_at
    }

    PROFILES {
        uuid id PK_FK
        text full_name
        text phone
        int loyalty_points
        text referral_code UK
        uuid referred_by_id FK
        boolean is_admin
        timestamptz created_at
    }

    ADDRESSES {
        uuid id PK
        uuid user_id FK
        text label
        text street
        text city
        text postal_code
        text country
        boolean is_default
        timestamptz created_at
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        text status
        text delivery_type
        uuid address_id FK
        numeric subtotal
        numeric delivery_fee
        numeric total
        int loyalty_points_earned
        int loyalty_points_redeemed
        text viva_order_code
        text payment_status
        text promo_code
        numeric promo_discount
        text notes
        timestamptz created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        text product_name
        numeric unit_price
        int quantity
        numeric total_price
    }

    STOCK_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        int quantity_change
        text type
        text note
        timestamptz created_at
    }

    STORE_SETTINGS {
        text key PK
        jsonb value
        timestamptz updated_at
    }

    LOYALTY_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid order_id FK
        text type
        int points
        int balance_after
        text note
        timestamptz created_at
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        int quantity
        text frequency
        date next_delivery_date
        text status
        timestamptz created_at
    }

    SUBSCRIPTION_ORDERS {
        uuid id PK
        uuid subscription_id FK
        uuid order_id FK
        timestamptz created_at
    }

    REVIEWS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        uuid order_id FK
        smallint rating
        text comment
        boolean is_verified
        boolean is_published
        timestamptz created_at
    }

    PROMO_CODES {
        uuid id PK
        text code UK
        text description
        text discount_type
        numeric discount_value
        numeric min_order_value
        int max_uses
        int uses_count
        timestamptz expires_at
        boolean is_active
        timestamptz created_at
    }

    BUNDLE_ITEMS {
        uuid id PK
        uuid bundle_id FK
        uuid product_id FK
        int quantity
        timestamptz created_at
    }

    PRODUCT_RECOMMENDATIONS {
        uuid id PK
        uuid product_id FK
        uuid recommended_id FK
        int sort_order
        timestamptz created_at
    }

    REFERRALS {
        uuid id PK
        uuid referrer_id FK
        uuid referee_id FK
        text status
        boolean reward_issued
        int points_awarded
        timestamptz created_at
    }

    USER_AI_PREFERENCES {
        uuid id PK
        uuid user_id FK_UK
        text goal
        text experience_level
        text preferred_format
        text budget_range
        text age_range
        text intensity_preference
        text_array terpene_preferences
        jsonb extra_prefs
        timestamptz updated_at
    }

    BUDTENDER_INTERACTIONS {
        uuid id PK
        uuid user_id FK
        text session_id
        text interaction_type
        jsonb quiz_answers
        uuid_array recommended_products
        uuid clicked_product FK
        text feedback
        timestamptz created_at
    }

    POS_REPORTS {
        uuid id PK
        date date UK
        numeric total_sales
        numeric cash_total
        numeric card_total
        numeric mobile_total
        int items_sold
        int order_count
        numeric cash_counted
        numeric cash_difference
        jsonb product_breakdown
        timestamptz closed_at
        uuid closed_by FK
        timestamptz created_at
    }

    USER_ACTIVE_SESSIONS {
        uuid id PK
        uuid user_id FK
        text device_id
        text device_name
        text user_agent
        text ip_address
        timestamptz last_seen
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## Tables détaillées

### `categories`
Catégories de produits (Fleurs, Résines, Huiles, Infusions).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, auto | Identifiant unique |
| `slug` | text | UNIQUE, NOT NULL | URL-friendly slug |
| `name` | text | NOT NULL | Nom de la catégorie |
| `description` | text | | Description longue |
| `icon_name` | text | | Nom d'icône Lucide |
| `image_url` | text | | URL image de couverture |
| `sort_order` | int | NOT NULL, DEFAULT 0 | Ordre d'affichage |
| `is_active` | boolean | NOT NULL, DEFAULT true | Visible/masqué |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date de création |

---

### `products`
Catalogue de produits CBD.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, auto | Identifiant unique |
| `category_id` | uuid | FK → categories(id), NOT NULL | Catégorie parente |
| `slug` | text | UNIQUE, NOT NULL | URL slug |
| `name` | text | NOT NULL | Nom du produit |
| `sku` | text | UNIQUE | Code-barres / SKU (POS) |
| `description` | text | | Description marketing |
| `cbd_percentage` | numeric(5,2) | | Pourcentage CBD |
| `thc_max` | numeric(5,3) | | THC maximum (< 0.3%) |
| `weight_grams` | numeric(8,2) | | Poids en grammes |
| `price` | numeric(10,2) | NOT NULL | Prix en euros |
| `original_value` | numeric(10,2) | | Valeur originale (bundles) |
| `image_url` | text | | URL image produit |
| `stock_quantity` | int | NOT NULL, DEFAULT 0 | Quantité en stock |
| `is_available` | boolean | NOT NULL, DEFAULT true | Disponible à la vente |
| `is_featured` | boolean | NOT NULL, DEFAULT false | Mis en avant |
| `is_active` | boolean | NOT NULL, DEFAULT true | Actif dans le catalogue |
| `is_bundle` | boolean | NOT NULL, DEFAULT false | Est un pack/bundle |
| `attributes` | jsonb | DEFAULT '{}' | Bénéfices, arômes, etc. |
| `embedding` | vector(3072) | | Vecteur d'embedding (pgvector) |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date de création |

**Index :** `idx_products_sku` (sur `sku`)

---

### `profiles`
Profils utilisateurs (liés à `auth.users`).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, FK → auth.users(id) ON DELETE CASCADE | ID Supabase Auth |
| `full_name` | text | | Nom complet |
| `phone` | text | | Numéro de téléphone |
| `loyalty_points` | int | NOT NULL, DEFAULT 0 | Points de fidélité |
| `referral_code` | text | UNIQUE | Code parrainage (GRN-XXXXXX) |
| `referred_by_id` | uuid | FK → profiles(id) | Parrain |
| `is_admin` | boolean | NOT NULL, DEFAULT false | Rôle administrateur |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date d'inscription |

**Triggers :**
- `handle_new_user` — Crée le profil automatiquement à l'inscription
- `tr_generate_referral_code` — Génère un code parrainage unique

---

### `orders`
Commandes clients.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, auto | Identifiant commande |
| `user_id` | uuid | FK → profiles(id) | Client |
| `status` | text | NOT NULL, DEFAULT 'pending' | `pending` / `paid` / `processing` / `ready` / `shipped` / `delivered` / `cancelled` |
| `delivery_type` | text | NOT NULL, DEFAULT 'click_collect' | `click_collect` / `delivery` / `in_store` |
| `address_id` | uuid | FK → addresses(id) | Adresse de livraison |
| `subtotal` | numeric(10,2) | NOT NULL | Sous-total HT |
| `delivery_fee` | numeric(10,2) | NOT NULL, DEFAULT 0 | Frais de livraison |
| `total` | numeric(10,2) | NOT NULL | Total TTC |
| `loyalty_points_earned` | int | NOT NULL, DEFAULT 0 | Points gagnés |
| `loyalty_points_redeemed` | int | NOT NULL, DEFAULT 0 | Points dépensés |
| `promo_code` | text | | Code promo appliqué |
| `promo_discount` | numeric(10,2) | NOT NULL, DEFAULT 0 | Montant de la réduction |
| `viva_order_code` | text | | Code commande Viva Wallet |
| `payment_status` | text | NOT NULL, DEFAULT 'pending' | `pending` / `paid` / `failed` / `refunded` |
| `notes` | text | | Notes commande |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Date de commande |

---

### `pos_reports`
Rapports de clôture de caisse (Z).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | uuid | PK, auto | Identifiant rapport |
| `date` | date | UNIQUE, NOT NULL, DEFAULT CURRENT_DATE | Date du rapport |
| `total_sales` | numeric(10,2) | NOT NULL, DEFAULT 0 | Total des ventes |
| `cash_total` | numeric(10,2) | NOT NULL, DEFAULT 0 | Total espèces |
| `card_total` | numeric(10,2) | NOT NULL, DEFAULT 0 | Total cartes |
| `mobile_total` | numeric(10,2) | NOT NULL, DEFAULT 0 | Total mobile |
| `items_sold` | int | NOT NULL, DEFAULT 0 | Articles vendus |
| `order_count` | int | NOT NULL, DEFAULT 0 | Nombre de commandes |
| `cash_counted` | numeric(10,2) | DEFAULT 0 | Espèces comptées |
| `cash_difference` | numeric(10,2) | DEFAULT 0 | Différence caisse |
| `product_breakdown` | jsonb | DEFAULT '{}' | Détail par produit |
| `closed_by` | uuid | FK → profiles(id) | Admin qui a clôturé |
| `closed_at` | timestamptz | NOT NULL, DEFAULT now() | Date/heure de clôture |

---

## Index

| Table | Index | Colonnes | Type |
|---|---|---|---|
| `products` | `idx_products_sku` | `sku` | B-Tree |
| `bundle_items` | `idx_bundle_items_bundle_id` | `bundle_id` | B-Tree |
| `user_ai_preferences` | `idx_user_ai_extra_prefs` | `extra_prefs` | GIN |
| `user_active_sessions` | `idx_user_active_sessions_user_last_seen` | `user_id, last_seen DESC` | B-Tree |

---

## Fonctions RPC

| Fonction | Paramètres | Retour | Description |
|---|---|---|---|
| `match_products` | `query_embedding vector(3072), match_threshold float, match_count int` | `SETOF products + similarity` | Recherche vectorielle cosine |
| `get_product_recommendations` | `p_product_id uuid, p_limit int` | `SETOF products` | Recommandations cross-sell |
| `sync_bundle_stock` | `p_bundle_id uuid` | `void` | Recalcul stock bundle |
| `increment_promo_uses` | `code_text text` | `void` | Incrémente usage promo |
| `create_pos_customer` | `p_full_name text, p_phone text` | `uuid` | Création client POS |
| `generate_referral_code` | — | `text` | Génère code GRN-XXXXXX |

---

## Triggers

| Trigger | Table | Événement | Fonction | Description |
|---|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` | Crée le profil automatiquement |
| `on_profile_created_gen_code` | `profiles` | BEFORE INSERT | `tr_generate_referral_code()` | Génère le code parrainage |
| `trg_sync_bundle_stock` | `products` | AFTER UPDATE OF stock_quantity | `trigger_sync_bundles_on_stock_change()` | Resynchronise les bundles |

---

## Migrations

Les fichiers de migration se trouvent dans `supabase/` et doivent être exécutés dans cet ordre :

| Fichier | Description |
|---|---|
| `migration.sql` | Tables de base + Phase 3 (fidélité, abonnements, avis, promo, bundles, cross-sell) |
| `consolidated_budtender_tables.sql` | Tables IA (préférences, interactions) |
| `migration_v3_referrals.sql` | Programme de parrainage |
| `migration_v5_add_profile_fields.sql` | Champs préférences IA |
| `migration_v5_pos_reports.sql` | Rapports POS |
| `migration_v6_dynamic_prefs.sql` | Préférences dynamiques (extra_prefs JSONB) |
| `migration_v6_pos_features.sql` | SKU/codes-barres + index bundles |
| `migration_v7_pos_reports_reconciliation.sql` | Réconciliation caisse |
| `migration_v7_remove_minor_age.sql` | Nettoyage champ âge mineur |
| `migration_v8_pos_enhancements.sql` | RPC `create_pos_customer` |
| `migration_v9_user_active_sessions.sql` | Sessions actives |
| `unify_vectors_3072.sql` | pgvector + `match_products` RPC |

> **Note :** Les fichiers `apply_vectors_partX.sql` contiennent les données d'embedding pré-calculées pour les produits.
