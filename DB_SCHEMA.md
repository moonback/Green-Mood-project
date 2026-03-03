# 🗃️ Schéma de la Base de Données

Green Mood CBD utilise Supabase (PostgreSQL). Voici une vue d'ensemble structurée des tables et relations.

## 📋 Tables Principales

### `categories`
Catégories de produits (ex: Fleurs, Huiles).
- `id` (uuid, PK)
- `slug` (text, unique) : Identifiant URL.
- `name` (text) : Nom affiché.
- `is_active` (boolean) : Statut de visibilité.

### `products`
Catalogue complet des articles.
- `id` (uuid, PK)
- `category_id` (uuid, FK) : Référence à `categories`.
- `name` (text), `description` (text)
- `price` (numeric) : Prix TTC.
- `stock_quantity` (int) : Quantité disponible.
- `is_bundle` (boolean) : Indique si c'est un pack de produits.
- `attributes` (jsonb) : Propriétés variables (Bénéfices, Arômes).

### `profiles`
Données étendues des utilisateurs (liées à `auth.users`).
- `id` (uuid, PK) : Référence à l'utilisateur authentifié.
- `full_name` (text), `phone` (text)
- `loyalty_points` (int) : Solde de fidélité.
- `is_admin` (boolean) : Droits d'administration.

---

## 🧾 Gestion des Commandes

### `orders`
En-tête des transactions.
- `id` (uuid, PK)
- `user_id` (uuid, FK) : L'acheteur.
- `status` (text) : `pending`, `paid`, `shipped`, etc.
- `total` (numeric) : Montant final.
- `delivery_type` (text) : `click_collect`, `delivery`.

### `order_items`
Détail des produits achetés par commande.
- `id` (uuid, PK)
- `order_id` (uuid, FK), `product_id` (uuid, FK)
- `quantity` (int), `unit_price` (numeric).

---

## 🎁 Fidélité & Réductions

### `loyalty_transactions`
Historique des points gagnés ou utilisés.
- `user_id`, `points`, `type` (earned, redeemed).

### `promo_codes`
Codes promo configurables.
- `code` (text), `discount_type` (percent/fixed), `expires_at`.

---

## 🔄 Relations Clés

- **`products` ↔ `categories`** : N à 1 (un produit appartient à une catégorie).
- **`orders` ↔ `profiles`** : N à 1 (un utilisateur peut avoir plusieurs commandes).
- **`bundle_items` ↔ `products`** : Relation Many-to-Many pour composer des packs.
- **`product_recommendations` ↔ `products`** : Relation réflexive pour le cross-selling.

---

## 🛡️ Sécurité (RLS)
Des politiques de **Row Level Security** s'appliquent sur toutes les tables pour garantir que les utilisateurs ne voient que leurs propres données et que le catalogue reste protégé.
