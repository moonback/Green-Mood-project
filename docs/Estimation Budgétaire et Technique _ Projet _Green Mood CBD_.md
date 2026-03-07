# Estimation Budgétaire et Technique : Projet "Green Mood CBD"

## 1. Introduction
Ce document présente une analyse comparative détaillée pour le développement de la plateforme **Green Mood CBD**. Le projet se distingue par une forte composante technologique (IA générative, recherche vectorielle) et une hybridation e-commerce / point de vente physique (POS).

---

## 2. Tableau Comparatif par Module (Charge de travail en Jours/Homme)

| Module | Profil A (Senior) | Profil B (Junior/Interm.) | Écart & Justification |
| :--- | :---: | :---: | :--- |
| **Architecture & Sécurité (RLS/RPC)** | 4 J/H | 10 J/H | Complexité critique de la RLS et des fonctions SQL avancées. |
| **E-commerce Client (27+ pages)** | 12 J/H | 22 J/H | Volume de pages important, gestion d'état Zustand complexe. |
| **BudTender IA (Texte & Voix)** | 6 J/H | 15 J/H | Intégration de Gemini Live API (WebSockets) et RAG. |
| **Back-office Admin & POS** | 8 J/H | 16 J/H | Logique de stock temps réel et rapports de clôture Z. |
| **Intégration Paiement (Viva Wallet)** | 3 J/H | 6 J/H | Gestion des webhooks et sécurisation des transactions. |
| **Tests, QA & Déploiement** | 4 J/H | 8 J/H | Mise en place de tests E2E et CI/CD. |
| **TOTAL ESTIMÉ** | **37 J/H** | **77 J/H** | **Ratio de ~1:2 en temps d'exécution.** |

---

## 3. Analyse des Risques (Profil Junior/Intermédiaire)

Le profil Junior présente des risques de blocage sur les modules suivants :

*   **Gemini Live API (Voix) :** La gestion des flux audio bidirectionnels via WebSockets est une tâche complexe nécessitant une excellente maîtrise de l'asynchrone et de la gestion des buffers en JS/TS.
*   **Recherche Vectorielle (pgvector) :** La configuration des embeddings, le calcul des dimensions (768 vs 3072) et l'optimisation des index HNSW/IVFFlat dans PostgreSQL peuvent être ardus sans expérience préalable.
*   **Sécurité RLS (Row Level Security) :** Une mauvaise configuration de la RLS peut entraîner des fuites de données massives ou des blocages applicatifs difficiles à débugger.
*   **POS & Synchronisation de stock :** La gestion des conflits de stock entre la vente physique et le e-commerce nécessite une logique transactionnelle robuste (PostgreSQL `BEGIN/COMMIT`).

---

## 4. Estimation des Coûts d'Infrastructure (Mensuels)

| Service | Plan / Usage | Coût Estimé (HT) |
| :--- | :--- | :--- |
| **Supabase** | Pro Plan (Production standard) | 25,00 € |
| **Google Gemini API** | Usage modéré (~1M tokens/mois) | ~10,00 € |
| **OpenRouter** | Embeddings & LLM Fallback | ~5,00 € |
| **Viva Wallet** | Frais de transaction (E-commerce) | ~1,69% + 0,10€ / trans. |
| **Hébergement Frontend** | Vercel / Netlify (Pro) | 20,00 € |
| **TOTAL FIXE ESTIMÉ** | | **~60,00 € / mois** |

---

## 5. Total Financier (Coût total HT du projet)

| Indicateur | Profil A (Senior) | Profil B (Junior/Interm.) |
| :--- | :--- | :--- |
| **TJM Moyen** | 700 € | 375 € |
| **Charge de travail** | 37 J/H | 77 J/H |
| **Coût Prestation HT** | **25 900 €** | **28 875 €** |
| **Délai de livraison** | ~2 mois | ~4-5 mois |

> **Note :** Bien que le TJM du Junior soit plus bas, la durée allongée du projet rend le coût final quasi équivalent, voire supérieur, sans compter le coût d'opportunité lié au retard de mise sur le marché.

---

## 6. Maintenance (Forfait mensuel)

Un forfait de **2 à 4 jours par mois** est recommandé pour assurer la stabilité et les mises à jour :

*   **Profil Senior :** 1 400 € à 2 800 € / mois (Efficacité maximale sur les évolutions IA).
*   **Profil Junior :** 750 € à 1 500 € / mois (Idéal pour les corrections mineures et l'ajout de contenu).

---

## 7. Recommandation Manus
Pour un projet de cette envergure combinant **Innovation IA** et **Gestion POS critique**, le choix du **Profil Senior** est vivement recommandé. Le gain en sécurité, en qualité d'architecture et surtout en délai de livraison compense largement l'écart de TJM initial.
