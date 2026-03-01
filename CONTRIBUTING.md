# 🤝 Guide de Contribution — Green Moon

Nous sommes ravis que vous souhaitiez contribuer à **Green Moon** ! L'objectif est de co-créer une boutique CBD premium, sécurisée et fluide. Voici les lignes directrices pour garantir une collaboration harmonieuse.

---

## 🛠️ Configuration du Développement

1.  **Installation** : Assurez-vous d'avoir Node.js (v18+) et npm.
2.  **Linting** : Nous utilisons TypeScript en mode strikt. Avant de commit, vérifiez les erreurs :
    ```bash
    npm run lint
    ```
3.  **Style de Code** : Suivez les conventions de Prettier et ESLint configurées dans le projet.
    - Utilisez des **Composants Fonctionnels** avec React 19.
    - Privilégiez les **Utility Classes Tailwind** pour le style.
    - Les animations doivent passer par `motion/react`.

---

## 🚀 Workflow de Branchement (Git Flow)

Nous suivons un workflow simple mais efficace :
1.  **Main** : Branche de production, doit toujours être stable.
2.  **Develop** : Branche de travail principale (optionnelle selon la taille de l'équipe).
3.  **Feature** : `feat/nom-de-la-feature` (ex: `feat/stripe-integration`).
4.  **Fix** : `fix/nom-du-bug` (ex: `fix/mobile-menu-overlap`).

---

## 📝 Bonnes Pratiques de Code

### 📂 Structure des Fichiers
- Les **Pages** résident dans `src/pages/`.
- Les **Composants globaux** dans `src/components/`.
- Les **Services et types** dans `src/lib/`.
- L'**État global** dans `src/store/`.

### 🛡️ Sécurité (RLS)
N'oubliez jamais que le frontend n'est qu'une interface. Toute donnée sensible doit être protégée par des **politiques RLS (Row Level Security)** dans Supabase. Ne fiez-vous jamais uniquement à la validation client.

### 🍱 État Global (Zustand)
- Utilisez Zustand pour les données partagées par plusieurs composants (Auth, Cart).
- Pour l'état local (un menu ouvert, un champ de saisie), utilisez `useState`.

### 🧪 Tests (Futur)
Bien que les tests ne soient pas encore obligatoires, toute nouvelle fonctionnalité majeure devrait, dans l'idéal, s'accompagner de tests unitaires (Vitest).

---

## 📥 Soumettre une Pull Request (PR)

1.  Assurez-vous que votre branche est à jour avec `main`.
2.  Décrivez précisément les changements apportés dans la description de la PR.
3.  Incluez une capture d'écran ou un GIF pour tout changement visuel UI.
4.  Un mainteneur passera en revue votre code et pourra demander des modifications.

---

## 💬 Communication
Pour toute question, ouvrez une **Issue** GitHub ou contactez l'équipe de développement directement.

---

Merci de contribuer à faire de **Green Moon** la référence du CBD premium ! 🌿
