# 🤝 Contribution au Projet

Merci de l'intérêt que vous portez à Green Mood CBD ! Voici quelques directives pour contribuer au projet de manière efficace.

## 🛠️ Setup Local

1. Assurez-vous d'avoir Node.js et `npm` installés.
2. Utilisez le fichier `.env.example` pour créer votre `.env`.
3. Respectez la version de TypeScript définie dans le `tsconfig.json`.

## 📜 Conventions de Code

### Style de Code
- Nous utilisons **ESLint** pour assurer la qualité du code.
- Utilisez des **composants fonctionnels** avec des hooks React.
- Privilégiez l'utilisation des utilitaires **Tailwind CSS** au lieu du CSS brut.

### Commits
Nous suivons la convention [Conventional Commits](https://www.conventionalcommits.org/) :
- `feat: ...` : Nouvelle fonctionnalité.
- `fix: ...` : Correction de bug.
- `docs: ...` : Documentation uniquement.
- `style: ...` : Changements esthétiques (espaces, formatage).
- `refactor: ...` : Refonte du code sans changement de comportement.

### Branches
- `main` : Branche stable de production.
- `develop` : Branche de développement intégrant les nouveautés.
- `feature/ma-feature` : Travail sur une nouvelle fonctionnalité.
- `hotfix/mon-fix` : Correction urgente.

## 🚀 Workflow de Contribution

1. **Forkez** le repository.
2. Créez votre branche à partir de `develop`.
3. Effectuez vos modifications.
4. Lancez le linting : `npm run lint`.
5. Soumettez une **Pull Request** claire et détaillée vers `develop`.

---

Besoin d'aide ? N'hésitez pas à ouvrir une *Issue* !
