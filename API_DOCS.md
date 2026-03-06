# 📡 API & RPC Documentation — Green Mood CBD

> **Note :** Green Mood n'utilise pas d'API REST traditionnelle.  
> Toutes les interactions sont effectuées directement via le **SDK client Supabase** (`@supabase/supabase-js`).  
> La sécurité est assurée par les politiques **Row Level Security (RLS)** de PostgreSQL.  
> Ce document référence les **tables Supabase** (endpoints CRUD auto-générés) et les **fonctions RPC** PostgreSQL.

---

## 🔐 Authentification

L'authentification utilise **Supabase GoTrue** (email/password).

### POST — Sign Up

Inscription d'un nouvel utilisateur.

**Auth requise :** Non

```typescript
supabase.auth.signUp({
  email: "user@example.com",
  password: "securePassword",
  options: { data: { full_name: "Jean Dupont" } }
})
```

**Réponse :**
```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "session": { "access_token": "jwt...", "refresh_token": "..." }
}
```

> Un trigger PostgreSQL `handle_new_user` crée automatiquement la ligne `profiles` et génère un `referral_code` unique.

---

### POST — Sign In

Connexion par email et mot de passe.

**Auth requise :** Non

```typescript
supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "securePassword"
})
```

---

### POST — Password Reset Request

Envoi d'un email de réinitialisation.

**Auth requise :** Non

```typescript
supabase.auth.resetPasswordForEmail("user@example.com", {
  redirectTo: "https://greenmood.fr/reinitialiser-mot-de-passe"
})
```

---

### POST — Update Password

Mise à jour du mot de passe (après réception du lien de réinitialisation).

**Auth requise :** Oui

```typescript
supabase.auth.updateUser({ password: "newSecurePassword" })
```

---

## 📦 Tables CRUD (via SDK Supabase)

### Categories

**RLS :** Lecture publique, écriture admin

| Opération | Exemple |
|---|---|
| **SELECT** | `supabase.from('categories').select('*').eq('is_active', true)` |
| **INSERT** | `supabase.from('categories').insert({ slug, name, description, icon_name, image_url, sort_order })` |
| **UPDATE** | `supabase.from('categories').update({ name }).eq('id', categoryId)` |
| **DELETE** | `supabase.from('categories').delete().eq('id', categoryId)` |

---

### Products

**RLS :** Lecture publique, écriture admin

| Opération | Exemple |
|---|---|
| **SELECT** | `supabase.from('products').select('*, category:categories(slug, name)').eq('is_active', true)` |
| **SELECT par slug** | `supabase.from('products').select('*').eq('slug', slug).single()` |
| **INSERT** | `supabase.from('products').insert({ category_id, slug, name, price, ... })` |
| **UPDATE** | `supabase.from('products').update({ price, stock_quantity }).eq('id', productId)` |

---

### Profiles

**RLS :** Lecture owner/admin, écriture owner/admin

```typescript
// Lecture du profil courant
supabase.from('profiles').select('*').eq('id', userId).single()

// Mise à jour du profil
supabase.from('profiles').update({ full_name, phone }).eq('id', userId)
```

---

### Orders

**RLS :** Lecture owner/admin, insertion authentifié, update admin

```typescript
// Création d'une commande
supabase.from('orders').insert({
  user_id, status: 'pending', delivery_type,
  subtotal, delivery_fee, total, loyalty_points_earned,
  promo_code, promo_discount
}).select().single()

// Mise à jour statut (admin)
supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId)
```

---

### Order Items

**RLS :** Lecture owner/admin, insertion authentifié

```typescript
supabase.from('order_items').insert(items.map(i => ({
  order_id, product_id: i.product.id,
  product_name: i.product.name,
  unit_price: i.product.price,
  quantity: i.quantity,
  total_price: i.product.price * i.quantity
})))
```

---

### Reviews

**RLS :** Lecture publique (publiées) / owner / admin, insertion owner, update owner (non publiées), admin all

```typescript
// Récupérer les avis d'un produit
supabase.from('reviews')
  .select('*, profile:profiles(full_name)')
  .eq('product_id', productId)
  .eq('is_published', true)
  .order('created_at', { ascending: false })

// Soumettre un avis
supabase.from('reviews').insert({
  product_id, user_id, order_id, rating, comment
})
```

---

### Promo Codes

**RLS :** Lecture authentifié, écriture admin

```typescript
// Vérifier un code promo
supabase.from('promo_codes')
  .select('*')
  .eq('code', code.toUpperCase())
  .eq('is_active', true)
  .single()
```

---

### Store Settings

**RLS :** Lecture publique, écriture admin

```typescript
// Lire tous les paramètres
supabase.from('store_settings').select('*')

// Mettre à jour un paramètre
supabase.from('store_settings').upsert({ key: 'banner_text', value: '...' })
```

---

### Subscriptions

**RLS :** Lecture owner/admin, insertion owner, update owner/admin

```typescript
supabase.from('subscriptions').insert({
  user_id, product_id, quantity, frequency, next_delivery_date
})
```

---

### Referrals

**RLS :** Lecture referrer/referee

```typescript
supabase.from('referrals').select('*, referee:profiles!referee_id(full_name, created_at)')
  .eq('referrer_id', userId)
```

---

### User Active Sessions

**RLS :** CRUD owner uniquement

```typescript
supabase.from('user_active_sessions').upsert({
  user_id, device_id, device_name, user_agent, last_seen
}, { onConflict: 'user_id,device_id' })
```

---

### User AI Preferences (BudTender)

**RLS :** CRUD owner, lecture admin

```typescript
supabase.from('user_ai_preferences').upsert({
  user_id, goal, experience_level, preferred_format, budget_range, terpene_preferences
}, { onConflict: 'user_id' })
```

---

## ⚡ Fonctions RPC PostgreSQL

### `match_products`

Recherche sémantique vectorielle via cosine similarity (pgvector).

**Auth requise :** Non (lecture produits publique)

```typescript
supabase.rpc('match_products', {
  query_embedding: [0.12, -0.34, ...],  // vector(3072)
  match_threshold: 0.5,
  match_count: 5
})
```

**Retourne :** Liste de produits avec un champ `similarity` (float).

---

### `get_product_recommendations`

Recommandations de produits complémentaires (explicites + fallback catégorie).

**Auth requise :** Non

```typescript
supabase.rpc('get_product_recommendations', {
  p_product_id: 'uuid...',
  p_limit: 4
})
```

---

### `sync_bundle_stock`

Recalcule le stock d'un bundle = `min(floor(composant.stock / qtité))`.

**Auth requise :** Admin (via trigger automatique ou appel direct)

```typescript
supabase.rpc('sync_bundle_stock', { p_bundle_id: 'uuid...' })
```

---

### `increment_promo_uses`

Incrémente le compteur d'utilisation d'un code promo.

**Auth requise :** Authentifié (SECURITY DEFINER)

```typescript
supabase.rpc('increment_promo_uses', { code_text: 'BIENVENUE10' })
```

---

### `create_pos_customer`

Crée un client walk-in depuis le POS (insertion dans `auth.users` + trigger profil).

**Auth requise :** Admin uniquement (vérification interne)

```typescript
supabase.rpc('create_pos_customer', {
  p_full_name: 'Client Boutique',
  p_phone: '06 12 34 56 78'
})
```

**Retourne :** `uuid` du nouveau client.

---

## 🤖 API Externes

### OpenRouter — Chat LLM

```bash
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer $VITE_OPENROUTER_API_KEY
Content-Type: application/json
X-Title: Green Mood Admin AI
```

```json
{
  "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
  "messages": [{ "role": "user", "content": "prompt..." }]
}
```

---

### OpenRouter — Embeddings

```bash
POST https://openrouter.ai/api/v1/embeddings
Authorization: Bearer $VITE_OPENROUTER_API_KEY
Content-Type: application/json
```

```json
{
  "model": "openai/text-embedding-3-small",
  "input": "texte à encoder",
  "dimensions": 768
}
```

---

### Google Gemini — Live Audio (WebSocket)

Connexion WebSocket pour le conseiller vocal temps réel.

```typescript
const genAI = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });
const session = await genAI.live.connect({
  model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
  config: {
    responseModalities: [Modality.AUDIO],
    tools: [{ functionDeclarations: [...] }]
  }
});
```

**Tools déclarées :** `search_catalog`, `add_to_cart`, `view_product`, `navigate_to`, `close_session`

---

### Supabase Storage — Upload Image

```typescript
supabase.storage.from('product-images').upload(filePath, file, {
  cacheControl: '3600',
  upsert: true
})
```

**RLS :** Upload/update/delete admin uniquement, lecture publique.

---

### Viva Wallet — Paiement

> ⚠️ À compléter : l'intégration Viva Wallet est configurée via variables d'environnement mais le flux de paiement complet n'est pas entièrement détectable dans le code client analysé. Les variables `VITE_VIVA_WALLET_BASE_URL`, `VITE_VIVA_CLIENT_ID`, et `VITE_VIVA_CLIENT_SECRET` sont définies dans `.env.example`.
