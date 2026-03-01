# 📊 Schéma Base de Données — Green Moon (Supabase/PostgreSQL)

La persistance des données de **Green Moon** repose sur les capacités relationnelles de **PostgreSQL**, utilisant **Supabase** pour la gestion de l'authentification et du stockage.

---

## 🏗️ Modèle de Données Global

### 🏷️ Catalogue Produits
| Table | Colonnes Clés | Description |
| :--- | :--- | :--- |
| `categories` | `id, slug, name, icon_name, sort_order` | Groupes de produits (Fleurs, Huiles, etc.). |
| `products` | `id, category_id, name, slug, price, stock_quantity, attributes` | Catalogue complet (CBD%, THC%, Arômes). |
| `product_images` | `id, product_id, image_url, sort_order` | Galerie photos par produit (Migration V2). |
| `bundle_items` | `id, bundle_id, product_id, quantity` | Composition des packs (Ex: Pack Bien-être). |

### 👤 Utilisateurs & Profils
| Table | Colonnes Clés | Description |
| :--- | :--- | :--- |
| `profiles` | `id, full_name, loyalty_points, referral_code, referred_by_id, is_admin` | Informations étendues liées à `auth.users`. |
| `addresses` | `id, user_id, street, city, postal_code, is_default` | Carnet d'adresses client. |
| `loyalty_transactions` | `id, user_id, order_id, points, type` | Historique des points Carats gagnés/utilisés. |
| `wishlists` | `id, user_id, product_id` | Liste de souhaits (Favoris) (Migration V2). |

### `profiles`
- `id`: UUID, PRIMARY KEY (FK to `auth.users.id`)
- `full_name`: TEXT
- `loyalty_points`: INTEGER, default 0
- `referral_code`: TEXT, UNIQUE, format 'GRN-XXXXXX'
- `referred_by_id`: UUID, FK to `profiles.id` (identifie le parrain)
- `is_admin`: BOOLEAN, default false
- `created_at`: TIMESTAMPTZ

### `referrals`
Table de suivi des parrainages.
- `id`: UUID, PRIMARY KEY
- `referrer_id`: UUID, FK to `profiles.id`
- `referee_id`: UUID, FK to `profiles.id`
- `status`: TEXT ('joined' | 'completed')
- `reward_issued`: BOOLEAN, default false
- `points_awarded`: INTEGER
- `created_at`: TIMESTAMPTZ

### 🛒 Commandes & Ventes
| Table | Colonnes Clés | Description |
| :--- | :--- | :--- |
| `orders` | `id, user_id, status, subtotal, total, delivery_type` | En-têtes de facturation et livraison. |
| `order_items` | `id, order_id, product_id, quantity, unit_price` | Détails des articles achetés. |
| `promo_codes` | `id, code, type, value, active, expires_at` | Gestion des remises par code. |
| `subscriptions` | `id, user_id, product_id, frequency, status` | Paniers récurrents (Abonnements). |

### 🤖 BudTender IA & Feedback
| Table | Colonnes Clés | Description |
| :--- | :--- | :--- |
| `user_ai_preferences` | `user_id, goal, experience_level, terpene_preferences` | Mémoire personnalisée pour l'IA (Migration V2). |
| `budtender_interactions` | `id, user_id, session_id, interaction_type, quiz_answers` | Logs de conversation et clics (Migration V2). |
| `reviews` | `id, product_id, user_id, rating, comment, is_verified` | Avis clients modérés. |

### ⚙️ Opérations & Logs
| Table | Colonnes Clés | Description |
| :--- | :--- | :--- |
| `stock_movements` | `id, product_id, quantity_change, type` | Historique pour la traçabilité des stocks. |
| `store_settings` | `id, key, value, description` | Configuration dynamique (Bannières, Port). |

---

## 🔒 Sécurité (Row Level Security - RLS)

Chaque table est protégée par défaut (`ENABLE ROW LEVEL SECURITY`). Voici les types de politiques appliqués :

1.  **Public Read** : Accessible à tous (ex: `products`, `categories`).
2.  **Owner Only** : Accessible uniquement à l'utilisateur qui possède la donnée (`orders`, `addresses`, `wishlists`).
3.  **Admin Overwrite** : Les administrateurs (`profiles.is_admin = true`) peuvent contourner les restrictions pour le support client.
4.  **Bot Interaction** : Politiques spécifiques pour permettre l'insertion anonyme d'interactions BudTender.

---

## ⚙️ Fonctions & Triggers PostgreSQL

Le projet utilise des scripts côté serveur pour garantir l'intégrité :
- **sync_bundle_stock** : Recalcule automatiquement le stock d'un "Pack" en fonction du plus petit stock de ses composants.
- **handle_new_user** : Crée automatiquement un profil dans `profiles` lors d'une inscription via `auth.users`.
- **update_loyalty_points** : Trigger qui met à jour les points `Carats` lors du passage d'une commande.
