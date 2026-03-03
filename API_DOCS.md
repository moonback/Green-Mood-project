# 📖 Documentation API

Green Mood CBD utilise principalement les APIs de Supabase (Post-gREST) et des fonctions personnalisées (RPC).

## 🗄️ Supabase Remote Procedure Calls (RPC)

Certaines fonctionnalités complexes sont gérées directement en base de données pour plus de performance.

### `get_product_recommendations`
Récupère les produits recommandés pour un produit donné (recommandations croisées + fallback par catégorie).
- **Paramètres** : 
  - `p_product_id` (uuid) : ID du produit source.
  - `p_limit` (int) : Nombre maximum de recommandations (défaut: 4).
- **Retour** : Ensemble d'objets `products`.

### `sync_bundle_stock`
Synchronise le stock d'un pack (bundle) basé sur le stock de ses composants.
- **Paramètres** : 
  - `p_bundle_id` (uuid) : ID du bundle.

---

## 🤖 Gemini Live AI Interface

L'application communique avec Gemini 2.0 via le protocole Multimodal Live.

### Outils (Tools) disponibles pour l'IA
L'IA peut déclencher les actions suivantes dans l'application :

1. **`get_products`** : Récupérer la liste des produits disponibles.
2. **`add_to_cart`** : Ajouter un produit spécifique au panier utilisateur.
   - Arguments : `product_id`, `quantity`.
3. **`get_cart_total`** : Obtenir la valeur actuelle du panier.

---

## 🔐 Authentification & Sécurité

### Headers requis
Pour toutes les requêtes authentifiées via le client Supabase :
```json
{
  "apikey": "VITE_SUPABASE_ANON_KEY",
  "Authorization": "Bearer <user_jwt_token>"
}
```

---

## 🛍️ Endpoints de Données (Collections)

| Table | Méthodes | Description |
| :--- | :--- | :--- |
| `products` | `SELECT` | Liste des produits (public) |
| `categories` | `SELECT` | Liste des catégories (public) |
| `orders` | `SELECT, INSERT` | Commandes de l'utilisateur |
| `profiles` | `SELECT, UPDATE` | Informations du profil utilisateur |
| `loyalty_transactions`| `SELECT` | Historique des points de fidélité |
