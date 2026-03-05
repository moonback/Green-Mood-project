# API_DOCS

## 1) API Surface réelle du projet

Le projet n’expose pas une API REST custom (pas de contrôleurs Express/Node actifs dans `src/`). L’API effective est composée de:
- **Supabase PostgREST** (accès tables)
- **Supabase RPC** (fonctions SQL)
- **Supabase Auth**
- **Supabase Storage**
- **APIs externes IA** (OpenRouter, Gemini Live)

## 2) Supabase Auth

### Session & identité
- `supabase.auth.getSession()`
- `supabase.auth.onAuthStateChange(...)`

### Login / Signup / Logout
- `signInWithPassword({ email, password })`
- `signUp({ email, password, options.data.full_name })`
- `signOut()`

### Password
- `resetPasswordForEmail(email, { redirectTo })`
- `updateUser({ password })`

## 3) Supabase RPC utilisées

### `get_product_recommendations(p_product_id uuid, p_limit int default 4)`
Retourne des produits recommandés (priorité recommandations explicites puis fallback catégorie).

### `sync_bundle_stock(p_bundle_id uuid)`
Recalcule le stock d’un bundle à partir de ses composants.

### `increment_promo_uses(code_text text)`
Incrémente l’usage d’un code promo.

### `match_products(query_embedding vector, match_threshold float, match_count int)`
Recherche vectorielle de produits (similarité embedding).

### `create_pos_customer(p_full_name text, p_phone text default null)`
Création d’un client depuis l’interface POS (admin only côté SQL).

## 4) Tables accédées depuis le frontend

- `categories`
- `products`
- `product_images`
- `bundle_items`
- `product_recommendations`
- `wishlists`
- `profiles`
- `addresses`
- `orders`
- `order_items`
- `stock_movements`
- `store_settings`
- `loyalty_transactions`
- `subscriptions`
- `subscription_orders`
- `reviews`
- `promo_codes`
- `referrals`
- `user_ai_preferences`
- `budtender_interactions`
- `pos_reports`

## 5) Stockage fichiers

### Bucket
- `product-images`

### Opérations observées
- Upload image produit
- Récupération URL publique
- Suppression d’image

## 6) APIs externes

### OpenRouter
- `POST https://openrouter.ai/api/v1/chat/completions`
- `POST https://openrouter.ai/api/v1/embeddings`

Auth: `Authorization: Bearer <VITE_OPENROUTER_API_KEY>`

### Gemini Live
- WebSocket temps réel vers `generativelanguage.googleapis.com`.
- Auth par clé `VITE_GEMINI_API_KEY`.

## 7) Sécurité

- RLS activée sur les tables métier principales.
- Modèle d’accès principal:
  - lecture publique: catalogue/contenus non sensibles
  - accès owner: données utilisateur (adresses, commandes, préférences)
  - accès admin: maintenance catalogue/stock/analytics/POS

## 8) Limites observables

- ⚠️ À compléter : spécification OpenAPI/Swagger non présente.
- ⚠️ À compléter : endpoints backend de paiement Viva non implémentés dans ce repo (appel `/api/payment/create-order` commenté).
