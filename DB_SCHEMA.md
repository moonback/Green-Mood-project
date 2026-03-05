# DB_SCHEMA

## Vue d’ensemble

Base: PostgreSQL (Supabase), avec RLS et extension `vector` pour la recherche sémantique produits.

## Tables principales

### Catalogue
- `categories`
- `products`
- `product_images`
- `bundle_items`
- `product_recommendations`

### Utilisateurs
- `profiles` (lié à `auth.users`)
- `addresses`
- `wishlists`

### Commerce
- `orders`
- `order_items`
- `stock_movements`
- `promo_codes`
- `store_settings`

### Fidélité / Engagement
- `loyalty_transactions`
- `subscriptions`
- `subscription_orders`
- `reviews`
- `referrals`

### IA / Personnalisation
- `user_ai_preferences`
- `budtender_interactions`

### POS
- `pos_reports`

## Relations clés

- `products.category_id -> categories.id`
- `product_images.product_id -> products.id`
- `bundle_items.bundle_id -> products.id`
- `bundle_items.product_id -> products.id`
- `product_recommendations.product_id -> products.id`
- `product_recommendations.recommended_id -> products.id`
- `profiles.id -> auth.users.id`
- `addresses.user_id -> profiles.id`
- `orders.user_id -> profiles.id`
- `orders.address_id -> addresses.id`
- `order_items.order_id -> orders.id`
- `order_items.product_id -> products.id`
- `stock_movements.product_id -> products.id`
- `loyalty_transactions.user_id -> profiles.id`
- `loyalty_transactions.order_id -> orders.id`
- `subscriptions.user_id -> profiles.id`
- `subscriptions.product_id -> products.id`
- `subscription_orders.subscription_id -> subscriptions.id`
- `subscription_orders.order_id -> orders.id`
- `reviews.user_id -> profiles.id`
- `reviews.product_id -> products.id`
- `reviews.order_id -> orders.id`
- `referrals.referrer_id -> profiles.id`
- `referrals.referee_id -> profiles.id`
- `wishlists.user_id -> auth.users.id`
- `wishlists.product_id -> products.id`
- `user_ai_preferences.user_id -> auth.users.id`
- `budtender_interactions.user_id -> auth.users.id`
- `pos_reports.closed_by -> profiles.id`

## Fonctions SQL / RPC

- `handle_new_user()` + trigger `on_auth_user_created`
- `generate_referral_code()`
- `tr_generate_referral_code()` + trigger `on_profile_created_gen_code`
- `increment_promo_uses(code_text)`
- `sync_bundle_stock(p_bundle_id)`
- `trigger_sync_bundles_on_stock_change()`
- `get_product_recommendations(p_product_id, p_limit)`
- `match_products(query_embedding, match_threshold, match_count)`
- `create_pos_customer(p_full_name, p_phone)`

## Évolutions de schéma notables

- `products.embedding` introduit pour recherche vectorielle (migrations 768 puis 3072 dimensions présentes).
- `products.sku` ajouté pour POS/scanner code-barres.
- `user_ai_preferences` enrichie avec `age_range`, `intensity_preference`, `extra_prefs`.
- `pos_reports` enrichie avec `product_breakdown`, `cash_counted`, `cash_difference`.

## Sécurité / RLS

- RLS activée sur la quasi-totalité des tables applicatives.
- Politiques observées:
  - public read sur tables catalogue/config sélectionnées
  - owner CRUD sur données personnelles
  - admin all sur tables d’administration

## Points à valider

- ⚠️ À compléter : état final cible de dimension vectorielle (768 et 3072 coexistent dans les migrations).
- ⚠️ À compléter : dictionnaire exhaustif des colonnes avec types/contraintes par table (possible, mais non maintenu dans un fichier de référence unique dans le repo).
