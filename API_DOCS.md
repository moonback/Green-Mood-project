# 📘 Documentation API & Routes (Green Moon)

Bien que l'application soit principalement construite comme une SPA communiquant directement avec Supabase (**PostgREST**), ce document décrit les routes utilisateur (frontend) et les points d'interaction importants.

---

## 🛤️ Routes Frontend (React Router)

### 🏬 Espace Public
| Route | Composant | Description |
| :--- | :--- | :--- |
| `/` | `Home.tsx` | Landing page premium (vidéo, splash screen). |
| `/catalogue` | `Catalog.tsx` | Galerie de produits avec filtres et recherche. |
| `/catalogue/:slug` | `ProductDetail.tsx` | Détail produit, avis, cross-selling et packs. |
| `/boutique` | `Shop.tsx` | Page de présentation de l'expérience boutique. |
| `/contact` | `Contact.tsx` | Formulaire expert et chat direct. |
| `/connexion` | `Login.tsx` | Authentification (Email / Mot de passe). |

### 🔐 Espace Client (Protégé par `ProtectedRoute`)
| Route | Composant | Description |
| :--- | :--- | :--- |
| `/panier` | `Cart.tsx` | Visualisation complète avant validation. |
| `/commande` | `Checkout.tsx` | Tunnel de paiement (Promo, Fidélité, Adresses). |
| `/compte` | `Account.tsx` | Dashboard utilisateur et points Carats. |
| `/compte/commandes` | `Orders.tsx` | Historique et suivi des sélections. |
| `/compte/favoris` | `Favorites.tsx` | Accès aux produits enregistrés. |
| `/compte/profil` | `Profile.tsx` | Mise à jour des informations personnelles. |
| `/compte/avis` | `MyReviews.tsx` | Gestion des retours clients publiés. |

### 🛡️ Espace Admin (Protégé par `AdminRoute`)
| Route | Composant | Description |
| :--- | :--- | :--- |
| `/admin` | `Admin.tsx` | Tableau de bord complet de gestion. |

---

## 🛰️ Interactions Supabase (Services Lib)

L'application utilise le client Supabase configuré dans `src/lib/supabase.ts`. Voici les principaux points d'accès :

### 👤 Authentification
- `supabase.auth.signUp(email, password)`
- `supabase.auth.signInWithPassword(email, password)`
- `supabase.auth.signOut()`

### 📦 Produits & Catalogue
- `SELECT * FROM products WHERE is_active = true`
- `SELECT * FROM categories ORDER BY sort_order ASC`
- `SELECT * FROM wishlists WHERE user_id = auth.uid()`

### 🛒 Commandes & Checkout
- `INSERT INTO orders` : Création forcée via RLS (uniquement l'utilisateur courant).
- `SELECT * FROM promo_codes WHERE code = ?` : Validation de réduction avant application.

---

## 🤖 BudTender IA (Points d'Intégration)

L'IA ne dispose pas d'un endpoint local mais communique avec **OpenRouter**.

- **URL de Base** : `https://openrouter.ai/api/v1/chat/completions`
- **Méthode** : `POST`
- **Payload** :
  ```json
  {
    "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
    "messages": [
      { "role": "system", "content": "...system_prompt..." },
      { "role": "user", "content": "...message..." }
    ],
    "temperature": 0.7
  }
  ```
- **Persistance** : Les interactions sont enregistrées dans la table `budtender_interactions` via `handleSendMessage` dans le composant `BudTender.tsx`.

---

## ⚙️ Paramètres Dynamiques
Les réglages de la boutique (bannières, frais de port, horaires) sont gérés via le store `settingsStore` qui interroge la table `store_settings`. Ces données sont rafraîchies à chaque chargement de l'application dans `App.tsx`.
