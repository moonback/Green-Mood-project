# Améliorations Pertinentes : BudTender IA — Green Moon CBD

Ce document détaille les axes d'amélioration identifiés pour transformer l'actuel **BudTender IA** en un véritable assistant de vente prédictif et ultra-personnalisé.

---

## 1. Intelligence Artificielle & Précision (IA 2.0)

### 🧩 RAG (Retrieval-Augmented Generation)
- [x] **Problème actuel** : On envoie seulement les 8 à 12 premiers produits au modèle pour rester sous les limites de tokens.
- [x] **Amélioration** : Utiliser une recherche vectorielle pour extraire les 10 produits les plus pertinents par rapport à la question du client, puis les envoyer à l'IA. Cela permet de prendre en compte **100% du catalogue**.

### ⚙️ Intégration du Stock en Temps Réel
- **Amélioration** : Coupler l'IA aux niveaux de stock réels. Si une fleur est presque épuisée, l'IA peut dire : *"Dépêchez-vous, il n'en reste que 2 en stock !"* pour augmenter le sentiment d'urgence.

### 🧪 Analyse Fine des Terpènes (Experts)
- **Amélioration** : Aller au-delà de la description textuelle en utilisant les "profils terpéniques" (Limonène, Myrcène, etc.) pour des recommandations basées sur la science moléculaire plutôt que sur le marketing.

---

## 2. Mémoire & CRM (Hyper-Personnalisation)

### ☁️ Persistance Multi-Appareils
- **Amélioration** : Déplacer la mémoire du `localStorage` vers la base de données **Supabase** (`user_profiles` ou table dédiée).
- **Bénéfice** : Un client qui commence sa discussion sur mobile la retrouvera sur son ordinateur une fois connecté.

### 💖 Analyse des Sentiments & Retours
- **Amélioration** : Ajouter un système de vote (👍/👎) sur chaque recommandation de l'IA.
- **IA Apprenante** : Si l'utilisateur a détesté une huile 30%, l'IA doit s'en souvenir et dire : *"Je sais que l'huile 30% était trop forte pour vous, voici une alternative plus douce..."*

### 📅 Cycle de Réapprovisionnement Intelligent
- **Amélioration** : L'IA pourrait calculer le temps moyen de consommation d'un produit (ex: 30ml d'huile dure 30 jours) et envoyer une notification personnalisée : *"Bonjour, votre flacon doit être presque vide vers le 15 mars. On refait un stock ?"*

---

## 3. Expérience Utilisateur (UX Premium)

### 🎙️ Commande Vocale & Audio
- **Amélioration** : Intégrer la **Web Speech API** pour permettre au client de parler directement au BudTender sans taper (mode "mains libres").
- **Synthèse Vocale** : Faire lire les conseils de l'IA avec une voix calme et zen.

### 📊 Comparaison de Produits Interactive
- **Amélioration** : Permettre des questions comme *"Quelle est la différence entre l'Amnesia et la White Widow ?"* et afficher un tableau comparatif généré à la volée.

### 🎭 Thèmes Visuels Dynamiques
- **Amélioration** : Changer l'ambiance visuelle du chat selon l'objectif détecté :
    - **Sommeil** : Interface bleu nuit / étoiles.
    - **Énergie** : Interface jaune / soleil.
    - **Stress** : Interface vert sauge / effets de brume.

---

## 4. Conversion & Business (Vente Augmentée)

### 🛒 One-Click Bundles (Packs)
- **Amélioration** : L'IA peut proposer un bouton : *"Ajouter ma sélection idéale au panier (Pack -15%)"*. Cela transforme 3 recommandations en 1 seule vente groupée immédiate.

### 🎟️ Codes Promos Dynamiques
- **Amélioration** : Si l'IA détecte une hésitation (panier abandonné ou question sur le prix), elle peut générer un code promo unique de 5% valable seulement 1h : *"Je vois que vous hésitez, voici un petit geste de ma part : CHAT5"*.

### 🔗 Triggering Prédictif
- **Amélioration** : Ouvrir la bulle de chat proactivement si l'utilisateur passe plus de 45 secondes sur une fiche produit complexe sans l'ajouter au panier.

---

## 5. Administration & Monitoring

### 📈 Dashboard de Performance
- **Amélioration** : Créer un panneau admin pour voir :
    - Les questions les plus posées (insight pour le SEO/FAQ).
    - Le taux de conversion du BudTender (est-ce que les gens achètent après le quiz ?).

### 🧪 A/B Testing de Personnalités
- **Amélioration** : Tester plusieurs "tones of voice" via l'admin : 
    - Le "Scientifique" (très technique).
    - Le "BudTender Cool" (détendu).
    - Le "Conseiller Médical" (très axé bien-être).

---
*Document généré par l'IA Antigravity pour Green Moon CBD — Mars 2026*
