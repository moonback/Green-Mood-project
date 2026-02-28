# Contribuer à Green Mood CBD Shop

Tout d'abord, merci de considérer d'apporter votre contribution à Green Mood ! Ce projet est conçu comme une application rapide, moderne et sécurisée. C'est grâce aux contributeurs que ce projet continue de grandir.

## 1. Pour Commencer

### Fork et Clone
1. Forkez ce dépôt sur GitHub.
2. Clonez votre fork localement :
   ```bash
   git clone https://github.com/votre-nom-utilisateur/Green-Moon-project.git
   ```
3. Configurez l'environnement de développement en exécutant `npm install` et en copiant les variables de `.env.example` dans un fichier `.env`.

## 2. Normes de Code

- **Formatting & Linting** : Assurez-vous qu'il n'y a pas d'erreurs TypeScript avant de pousser du code.
  ```bash
  npm run lint
  ```
- **Composants React** :
  - Utilisez des composants fonctionnels (`function Component() {}` ou `const Component = () => {}`).
  - Gardez la logique centralisée dans des Hooks (`useX`) ou le store Zustand.
- **Styling** : Utilisez les utilitaires **Tailwind CSS v4** directement dans l'attribut `className`. Pour des classes dynamiques, préférez l'utilisation de `clsx` ou `tailwind-merge`.
- **Conventions de Nommage** :
  - Nommez les fichiers en `PascalCase` pour les composants React (ex: `HeroBanner.tsx`).
  - Utilisez `camelCase` pour les utilitaires, les hooks personnalisés, et les fichiers du store (ex: `authStore.ts`, `useCart.ts`).

## 3. Processus de Pull Request

### Convention de nommage des branches
Préfixez vos branches avec le type de travail que vous effectuez :
- `feat/` : Une nouvelle fonctionnalité
- `fix/` : Une correction de bug
- `docs/` : Changements liés à la documentation
- `refactor/` : Remaniement de code n'ajoutant ni fonctionnalité ni correction de bug

*Exemple : `git checkout -b feat/ajout-points-fidelite`*

### Messages de Commit
Nous suivons la spécification [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) :
- `feat: ajoute la bannière promotionnelle sur l'accueil`
- `fix: corrige une erreur de calcul dans le panier`
- `style: met à jour les couleurs des boutons`

### Ouverture d'une PR
1. Assurez-vous que votre branche se fusionne proprement avec `main`.
2. Mettez à jour `README.md` si vous introduisez des changements majeurs.
3. Détaillez vos changements dans le template de PR.
4. Votre PR nécessite au moins une approbation avant d'être fusionnée.

## 4. Signaler des Bugs
- Fournissez un titre clair et descriptif.
- Décrivez les étapes exactes pour reproduire le problème.
- Incluez les détails de votre environnement (OS, Navigateur) et des captures d'écran si le souci est visuel.
