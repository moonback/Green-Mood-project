# ROADMAP

## Current Version (V2)
Le projet est déjà à un niveau V2 structuré, avec un socle fonctionnel large :
- [x] Storefront e-commerce (catalogue, fiche produit, panier, checkout, confirmation)
- [x] Espace client complet (profil, adresses, commandes, abonnements, fidélité, avis, favoris, parrainage)
- [x] Backoffice admin multi-domaines (produits, commandes, stock, clients, analytics, promos, recommandations)
- [x] Mode POS dédié pour les opérations terrain
- [x] Assistant IA BudTender (texte + composante vocale)
- [x] Migrations SQL Supabase versionnées pour la couche data

## Next Milestones
Améliorations court terme orientées robustesse et opérabilité :
- [ ] Renforcer les parcours de paiement (gestion d’échecs, retries, traçabilité)
- [ ] Industrialiser les contrôles qualité en CI (type-check + build + smoke tests)
- [ ] Ajouter des actions bulk en administration (produits / commandes / catégories)
- [ ] Améliorer l’observabilité applicative (logs métier + erreurs critiques)
- [ ] Documenter un runbook d’exploitation (incidents checkout, sync embeddings)

## Planned Features
Périmètre moyen terme orienté croissance et personnalisation :
- [ ] Améliorer la pertinence des recommandations produits (feedback loop)
- [ ] Étendre les parcours d’abonnement (pause, skip, reprise)
- [ ] Renforcer le module parrainage avec tableaux de bord de conversion
- [ ] Consolider les fonctionnalités SEO éditoriales autour des guides
- [ ] Ajouter des exports opérationnels (commandes/stock/clients) côté admin

## Future Ideas
Vision long terme :
- [ ] Stratégie multi-boutiques / multi-marques
- [ ] Expérience mobile avancée (PWA enrichie ou app native)
- [ ] Expansion internationale (localisation, devise, conformité)
- [ ] IA interne pour assistance merchandising et optimisation stock
- [ ] Connecteurs BI / entrepôt de données

> ⚠️ À compléter : priorisation finale, owners et dates cibles non détectés dans le repository.
