# 🧠 Guide de Vectorisation des Produits (IA)

Ce guide explique comment générer les vecteurs (embeddings) pour vos produits afin de permettre au **BudTender IA** de faire des recherches sémantiques intelligentes.

## 📋 Prérequis

1.  Votre fichier `.env` doit contenir :
    *   `VITE_GEMINI_API_KEY` (Clé Google AI Studio)
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY` (ou Service Role Key pour plus de puissance)

2.  Le modèle utilisé est **Gemini embedding-001** (768 dimensions).

---

## 🛠️ Étape 1 : Préparer la Base de Données

Avant d'envoyer des vecteurs, la base de données doit être configurée pour accepter exactement **768** dimensions.

1.  Ouvrez l'**Éditeur SQL** de Supabase.
2.  Copiez et exécutez le contenu de :
    `supabase/fix_vectors_768.sql`
    *(Cela réinitialise la colonne et la fonction de recherche).*

---

## 🚀 Étape 2 : Générer les Vecteurs

Lancez le script de synchronisation depuis votre terminal à la racine du projet :

```powershell
npx ts-node sync_vectors.ts
```

**Ce que fait ce script :**
*   Récupère tous les produits de votre base de données.
*   Envoie le nom et la description à l'IA Gemini.
*   Récupère un vecteur numérique (768 nombres).
*   Génère des fichiers SQL dans le dossier `supabase/` (ex: `apply_vectors_part1.sql`).

---

## 📥 Étape 3 : Appliquer les Vecteurs

Le SQL généré est trop volumineux pour être envoyé d'un coup. Le script divise les mises à jour par lots de 50.

1.  Allez dans le dossier `supabase/`.
2.  Ouvrez `apply_vectors_part1.sql`, copiez tout le code.
3.  Collez-le dans l'**Éditeur SQL** de Supabase et cliquez sur **Run**.
4.  Répétez pour les fichiers suivants (part2, part3, etc.).

---

## ✅ Étape 4 : Vérification

Une fois les scripts SQL exécutés :

1.  Allez dans votre interface **Admin** locale (onglet Produits).
2.  Vous devriez voir une icône **Cerveau Vert** 🧠 pour chaque produit vectorisé.
3.  Testez la recherche vocale avec le BudTender !

## ⚠️ Notes Importantes
*   **Nouvel article ?** Si vous ajoutez un article manuellement, il n'aura pas de vecteur tout de suite. Il faudra relancer `sync_vectors.ts`.
*   **Dimensions :** Ne changez pas le modèle Gemini dans `embeddings.ts` sans mettre à jour la base de données (768 est la norme pour Gemini).
