# 🌿 BudTender AI : Guide de Fonctionnement & Évolutions

Ce document détaille l'architecture actuelle de l'assistant **BudTender IA** et propose des pistes d'évolution pour transformer l'expérience client en un véritable accompagnement sur-mesure.

---

## 🚀 Fonctionnement Actuel

BudTender est un assistant conversationnel hybride combinant logique algorithmique locale et intelligence artificielle générative.

### 1. Le Flux de Conversation
- **Interface Fluide :** Un système de bulles de tchat avec animations "typing" pour simuler une interaction humaine.
- **Diagnostic en 4 étapes :** Besoins (Sommeil, Stress...), Expérience (Débutant/Expert), Format (Huile, Fleur...) et Budget.

### 2. Le Système de Recommandation
- **Scoring Local :** Chaque produit du catalogue reçoit un score basé sur les réponses du quiz. Les 3 meilleurs scores sont sélectionnés instantanément.
- **Intelligence Artificielle (Gemini) :** Les réponses du quiz + le catalogue sont envoyés à l'API Gemini pour générer un conseil rédigé de manière naturelle et professionnelle.
- **Fallback :** Si l'IA est indisponible, un système de conseils statiques prend le relais pour garantir une réponse.

### 3. La Couche "Mémoire" (Fidélisation)
- **Reconnaissance Client :** Salue l'utilisateur par son nom et mentionne son dernier achat s'il est connecté.
- **Rappels de Stock intelligents :** Analyse l'historique de commandes. Si un produit est susceptible d'être fini (ex: 14j pour les fleurs, 30j pour les huiles), il propose un réapprovisionnement direct via une carte interactive.
- **Mémoire de Quiz :** Sauvegarde les préférences dans le `localStorage` pour permettre au client de demander des "Recommandations rapides" sans refaire le quiz.

---

## 🔮 10 Suggestions de Fonctionnalités Supplémentaires

Pour aller plus loin dans l'expertise et la conversion :

1. **📅 Mode "Abonnement Intelligent"** : Proposer, directement après un réapprovisionnement, de passer le produit en abonnement récurrent avec -10% de réduction.
2. **🧪 Sélecteur de Terpènes & Arômes** : Ajouter une étape optionnelle pour les "Connaisseurs" afin de filtrer par goûts (Citronné, Terreux, Fruité) ou par effets terpéniques (Focus, Créativité).
3. **📸 Analyse Photo (IA Vision)** : Permettre à l'utilisateur d'envoyer la photo d'un produit concurrent ou d'une ancienne fleur pour que BudTender identifie le produit équivalent dans le catalogue Green Moon.
4. **🚑 Mode "SOS Nuit" (Urgent)** : Un bouton spécifique pour les clients en crise (insomnie, stress intense) qui suggère immédiatement les produits à action ultra-rapide (Huiles 30%+) avec une livraison prioritaire.
5. **🤝 Social Proof dynamique** : Intégrer les avis clients dans les bulles de recommandation. *Ex: "Ce produit a aidé 45 personnes avec des problèmes de sommeil similaires aux vôtres."*
6. **🌡️ BudTender Coach (Dosage)** : Après un achat d'huile, BudTender envoie un message après 3 jours pour demander comment se passe le dosage et aide à l'ajuster (Calculateur de gouttes).
7. **🎁 Système de "Bundles" à la volée** : Si l'utilisateur a un gros budget, l'IA génère un "Pack Cure Complète" combinant Huile + Infusion + Fleurs avec une remise groupée calculée par l'IA.
8. **🏆 Programme Ambassadeur Chat** : Offrir un code promo unique à la fin du quiz si l'utilisateur partage ses résultats ou invite un ami à faire le diagnostic.
9. **🌍 Multilingue Intelligent** : Détection de la langue de l'utilisateur pour adapter les conseils (Anglais, Espagnol, Allemand) tout en gardant le ton expert "French Touch".
10. **🎙️ Commande Vocale** : Permettre de répondre au quiz à la voix pour une accessibilité accrue et une sensation de "Siri du CBD".

---

*Document généré pour le projet Green Moon — Expert en Cannabinoïdes.*
