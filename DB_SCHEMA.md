# Schéma de Base de Données (Supabase PostgreSQL)

Description structurée des tables principales utilisées au sein de l'application. L'essentiel des interactions est sécurisé depuis le client web via les **Row Level Security (RLS)** de PostgreSQL.

## 🗂️ Aperçu des Tables

### 1. `categories`
- `id` (uuid, PK) : Identifiant unique de la catégorie.
- `slug` (text, UNIQUE) : Chaîne URL (ex: 'fleurs', 'huiles').
- `name` (text) : Nom affiché de la catégorie.
- `description` (text) : Détails sur la catégorie.
- `icon_name` (text) : Nom du composant icône Lucide-React.
- `image_url` (text) : Référence image externe.
- `sort_order` (int) : Ordre d'affichage croissant pour les menus de navigation.
- `is_active` (boolean) : Permet de masquer une catégorie.

### 2. `products`
*Contient le catalogue principal des articles.*
- `id` (uuid, PK)
- `category_id` (uuid, FK) : Liée à `categories.id`.
- `slug` (text, UNIQUE)
- `name` (text), `description` (text)
- `cbd_percentage`, `thc_max` (numeric) : Métriques pour les taux.
- `weight_grams` (numeric) : Poids.
- `price` (numeric) : Coût.
- `image_url` (text) : Image de présentation.
- `stock_quantity` (int) : Suivi des inventaires.
- `is_available`, `is_featured`, `is_active` (boolean) : Différents flags de configuration.

### 3. `profiles`
*La table reprenant les données personnelles des utilisateurs. Alimentée via un trigger Postgres attaché à l'authentification GoTrue : `auth.users` -> `public.profiles`*
- `id` (uuid, PK, FK) : Épouse directement `auth.users(id)`.
- `full_name` (text)
- `phone` (text)
- `loyalty_points` (int) : Points fidélité à créditer suite aux achats.
- `is_admin` (boolean) : *Flag Crucial.* Utilisable dans les politiques de validation RLS pour contourner les droits restreints.

### 4. `addresses`
*Stockage des contextes d'expédition ou domiciles pour un utilisateur authentifié.*
- `id` (uuid, PK)
- `user_id` (uuid, FK) : Lié à `profiles.id`.
- `label` (text) : Mots-clés (ex: 'Maison', 'Bureau').
- `street`, `city`, `postal_code`, `country` (text) : Données d'adresse physiques.
- `is_default` (boolean)

### 5. `orders` & `order_items`
*Les objets transactionnels. La séparation permet de figer le prix des articles (Line Items) historiquement par rapport aux factures.*
**Commandes (Orders) :**
- `id` (uuid, PK)
- `user_id` (uuid, FK) : Nullable (prévu pour d'éventuels achats 'Guest').
- `status` (text) : Statuts logistiques (`pending`, `processing`, `shipped`, `delivered`).
- `delivery_type` (text) : Choix client (`click_collect`, `delivery`).
- `address_id` (uuid, FK) : L'adresse de facturation/livraison ciblée.
- `subtotal`, `delivery_fee`, `total` (numeric) : Traces comptables.
- `payment_status` (text) : Contexte d'approbation Viva Wallet.

**Lignes de Commandes (Order Items) :**
- Lie l'`order_id` aux différents `product_id`.
- `product_name` (text)
- `unit_price`, `quantity`, `total_price` : Ces champs scellent les calculs effectués à l'instant de l'achat afin qu'un futur changement de prix d'un produit ne modifie pas le total facturé rétrospectivement.

### 6. `stock_movements`
*Log des ajustements d'inventaires pour le propriétaire métier.*
- `id` (uuid, PK)
- `product_id` (uuid, FK) : Le produit ajusté.
- `quantity_change` (int) : Représentation d'une augmentation (`> 0`) ou d'une vente (`< 0`).
- `type` (text) : Motif de l'entrée d'événement.
- `note` (text) : Explication administrateur (ex: 'Arrivage du Lundi').

### 7. `store_settings`
*Comportement de type clé-valeur afin d'injecter facilement des bannières commerciales ou horaires variables de manière globale.*
- `key` (text, PK) : Clé de référence (ex: `banner_enabled`, `delivery_fee`).
- `value` (jsonb) : Charge Payload JSON. Analysée par `settingsStore.ts`.
