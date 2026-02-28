# Documentation API

Ce projet utilise **Supabase** comme Backend-as-a-Service, ce qui signifie que nous ne maintenons pas d'endpoints RESTful traditionnels (Node/Express). Au lieu de cela, toutes les transactions de données sont exécutées en utilisant le client SDK `@supabase/supabase-js` mappé sur Postgres.

Vous trouverez ci-dessous un aperçu des principaux "endpoints" (opérations) logiques utilisés au sein de l'application.

---

## 🔐 1. Authentification (`authStore.ts`)

| Opération | Méthode API Supabase | Niveau d'Accès | Description |
|-----------|----------------------|----------------|-------------|
| **Inscription** | `supabase.auth.signUp()` | Public | Inscription d'un nouvel utilisateur. Déclenche la création d'un profil via trigger DB. |
| **Connexion** | `supabase.auth.signInWithPassword()` | Public | Authentifie un utilisateur via Email & Mot de passe. |
| **Déconnexion** | `supabase.auth.signOut()` | Authed | Nettoie la session et les tokens en stockage local. |
| **Obtenir Session**| `supabase.auth.getSession()` | Authed | Récupère la session d'authentification active. |

---

## 👤 2. Profils (`authStore.ts` & `src/pages/Account.tsx`)

| Opération | Table | Méthodes | Niveau d'Accès | Description |
|-----------|-------|----------|----------------|-------------|
| **Obtenir Profil** | `profiles` | `select('*').eq('id', userId).single()` | Propriétaire / Admin | Récupère les détails de l'utilisateur (nom, tel, points). |
| **Mettre à jour**  | `profiles` | `update({ ... }).eq('id', userId)` | Propriétaire | Modifie les détails personnels de l'utilisateur. |

---

## 🛍️ 3. Catalogue (Catégories & Produits)

| Opération | Table | Méthodes | Niveau d'Accès | Description |
|-----------|-------|----------|----------------|-------------|
| **Liste Catégories** | `categories` | `select('*').order('sort_order')` | Public | Récupère toutes les catégories de produits actives. |
| **Liste Produits** | `products` | `select('*, category:categories(*)').eq('is_active', true)` | Public | Obtient les produits joints à leurs données de catégorie. |
| **Obtenir un Produit** | `products` | `select('...').eq('slug', slug).single()` | Public | Récupère les informations détaillées d'une page produit. |
| **Sauvegarder** | `products` | `insert()` ou `update()` | **Admin** | Crée ou modifie les détails et les prix d'un produit. |

---

## 📦 4. Commandes & Paiement

| Opération | Table | Méthodes | Niveau d'Accès | Description |
|-----------|-------|----------|----------------|-------------|
| **Créer Commande** | `orders` & `order_items` | Insertion lot ou RPC | Authed | Initie une commande avec les articles du panier et les infos d'adresse. |
| **Commandes Utilisateur** | `orders` | `select('*, order_items(...)').eq('user_id', auth.uid())` | Propriétaire | Historique des commandes précédentes pour la page Compte. |
| **Toutes Commandes** | `orders` | `select('*, profiles(full_name)')` | **Admin** | Liste complète de toutes les commandes à travers la boutique. |
| **Mettre à jour Statut** | `orders` | `update({ status: 'shipped' })` | **Admin** | Change l'état de traitement d'une commande. |

---

## 🏦 5. Paramètres Dynamiques

| Opération | Table | Méthodes | Niveau d'Accès | Description |
|-----------|-------|----------|----------------|-------------|
| **Obtenir Paramètres** | `store_settings` | `select('*')` | Public | Récupère la configuration (bannières, tarifs, éléments UI). |
| **Mettre à jour** | `store_settings` | `upsert({ key, value })` | **Admin** | Sauvegarde les changements poussés depuis le panneau d'administration. |

---

**Note** : Toutes les opérations ci-dessus appliquent l'intégrité des données via les politiques Row Level Security (RLS) de PostgreSQL définies dans `supabase/migration.sql`. Même si elles sont appelées de manière inappropriée depuis le client, la base de données bloque les événements non autorisés.
