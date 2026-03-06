# 🤝 Guide de Contribution — Green Mood CBD

Merci de votre intérêt pour contribuer à Green Mood CBD ! Ce guide vous aidera à contribuer efficacement au projet.

---

## 📋 Prérequis

- **Node.js** ≥ 18 et **npm** ≥ 9
- Un compte **Supabase** avec un projet configuré
- Clés API : **Gemini**, **OpenRouter** (voir `.env.example`)
- Connaissance de **React**, **TypeScript**, **Tailwind CSS v4**

---

## 🔀 Workflow Git

### Branches

```
main              ← Production stable
├── dev           ← Intégration / staging
├── feature/*     ← Nouvelles fonctionnalités
├── fix/*         ← Corrections de bugs
├── refactor/*    ← Refactoring de code
└── docs/*        ← Documentation
```

### Processus

1. **Fork** le dépôt ou créez une branche depuis `dev`
2. **Nommez** la branche selon la convention : `feature/nom-fonctionnalite`, `fix/nom-bug`
3. **Développez** en suivant les conventions ci-dessous
4. **Testez** localement (`npm run dev`, `npm run lint`)
5. **Commitez** avec un message conforme aux Conventional Commits
6. **Créez une Pull Request** vers `dev`

---

## 📝 Conventional Commits

Tous les messages de commit doivent suivre le format [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types

| Type | Description |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `refactor` | Refactoring sans changement fonctionnel |
| `style` | Formatage, point-virgules manquants (pas de changement de code) |
| `perf` | Amélioration de performance |
| `test` | Ajout ou correction de tests |
| `chore` | Maintenance (CI, build, dépendances) |

### Scopes courants

`auth`, `cart`, `catalog`, `admin`, `pos`, `budtender`, `seo`, `store`, `db`, `ui`

### Exemples

```bash
feat(budtender): add terpene preference to quiz
fix(cart): correct delivery fee calculation for free threshold
docs(api): update RPC functions documentation
refactor(admin): extract POS report into separate component
perf(cache): increase embedding LRU cache to 100 entries
chore(deps): upgrade react-router-dom to v7.14
```

---

## 🏗 Conventions de code

### Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | `PascalCase` | `ProductCard.tsx`, `AdminOrdersTab.tsx` |
| Fichiers utilitaires | `camelCase` | `authStore.ts`, `budtenderCache.ts` |
| Hooks | `camelCase` avec préfixe `use` | `useBudTenderMemory.ts` |
| URL / routes | `kebab-case` | `/compte/mot-de-passe-oublie` |
| Variables CSS | `kebab-case` | `--color-green-neon` |

### Structure d'un composant

```tsx
// 1. Imports
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';

// 2. Types/Interfaces
interface Props {
  product: Product;
  onSelect: (id: string) => void;
}

// 3. Composant (fonctionnel uniquement)
export default function ProductCard({ product, onSelect }: Props) {
  const [loading, setLoading] = useState(false);

  return (
    <div onClick={() => onSelect(product.id)}>
      {product.name}
    </div>
  );
}
```

### Règles essentielles

- ✅ **Composants fonctionnels** uniquement (pas de classes)
- ✅ **Zustand** pour l'état global (pas Redux)
- ✅ **Tailwind CSS v4** pour le style (pas de CSS ad-hoc complexe)
- ✅ **Lucide React** pour les icônes (pas FontAwesome, pas Heroicons)
- ✅ **try/catch** exhaustif sur tous les appels Supabase
- ✅ Types TypeScript stricts dans `src/lib/types.ts`
- ❌ Jamais de `any` sauf cas exceptionnel documenté
- ❌ Jamais de Service Role Key côté client
- ❌ Jamais de calcul métier lourd côté client (utiliser des RPC/Views SQL)

---

## 📂 Organisation des fichiers

| Dossier | Contenu |
|---|---|
| `src/components/` | Composants réutilisables isolés |
| `src/components/admin/` | Onglets du back-office admin |
| `src/pages/` | Vues complètes (une par route) |
| `src/store/` | Stores Zustand |
| `src/hooks/` | Hooks personnalisés |
| `src/lib/` | Types, utilitaires, clients API, IA |
| `src/lib/seo/` | Helpers SEO (meta, schema.org) |
| `supabase/` | Migrations SQL |
| `scripts/` | Scripts utilitaires (Node.js) |

---

## 🗄 Ajout d'une nouvelle table

1. Créer le fichier SQL dans `supabase/migration_vXX_<nom>.sql`
2. Inclure les politiques RLS
3. Ajouter l'interface TypeScript dans `src/lib/types.ts`
4. Créer les actions dans un store Zustand ou dans le composant page

---

## ✅ Checklist avant PR

- [ ] Le code compile sans erreur (`npm run lint`)
- [ ] L'application démarre correctement (`npm run dev`)
- [ ] Les politiques RLS sont définies pour toute nouvelle table
- [ ] Les types TypeScript sont à jour dans `src/lib/types.ts`
- [ ] Le message de commit suit les Conventional Commits
- [ ] La branche est basée sur `dev`

---

## 📄 Licence

En contribuant, vous acceptez que vos contributions soient distribuées sous la licence **MIT** du projet.
