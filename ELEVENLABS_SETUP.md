# ElevenLabs — Configuration Agent BudTender (A → Z)

Guide complet pour créer et configurer l'agent vocal **BudTender** de Green Mood sur ElevenLabs Conversational AI.
Ce fichier est autonome : aucune connaissance préalable d'ElevenLabs n'est requise.

---

## Architecture rapide

```
ElevenLabs Dashboard (prompt statique)
  └─ Persona, règles, description des outils  ←  configure une seule fois

Application React (contexte dynamique)
  └─ useElevenLabsVoice.ts → Conversation.startSession()
       └─ sendContextualUpdate(buildSessionContext(...))
            └─ Nom client, profil, catalogue, livraison  ←  injecté à chaque session
```

Le prompt du dashboard ne contient **jamais** de données variables. Tout ce qui dépend du client ou du stock est envoyé automatiquement par l'application après connexion.

---

## 1. Prérequis

| Élément | Détail |
|---|---|
| Compte ElevenLabs | Plan **Starter** minimum (Conversational AI disponible) |
| Dépendance installée | `@elevenlabs/client ^0.15.0` — déjà dans `package.json` |
| Variable d'environnement | `VITE_ELEVENLABS_AGENT_ID` à ajouter dans `.env` |
| Connexion sécurisée | L'app doit tourner en HTTPS (ou `localhost`) — requis pour le micro |

---

## 2. Création de l'agent

1. Aller sur **https://elevenlabs.io/app/conversational-ai**
2. Cliquer **"+ Create agent"** → choisir **"Blank template"**
3. Remplir les champs suivants :

| Champ | Valeur |
|---|---|
| Agent name | `BudTender — Green Mood` |
| Agent language | `French (fr)` |
| LLM | `claude-3-5-sonnet-20241022` *(meilleur tool calling)* |
| First message | `Bonjour ! Je suis votre conseiller CBD Green Mood. Comment puis-je vous aider aujourd'hui ?` |
| Visibility | **Public** *(pas de clé API côté client)* |

4. Cliquer **"Create"** — l'agent est créé avec un `Agent ID` (format `agt_xxxxxxxxxxxx`).

---

## 3. Prompt système (à coller dans "System prompt")

Dans l'onglet **"Agent" → "Prompt"**, remplacer le contenu par le bloc ci-dessous.
Ce prompt est **100 % statique** — le contexte client est injecté automatiquement par l'application.

```
RÔLE :
Tu es BudTender, conseiller CBD expert et premium de la boutique physique Green Mood.
Tu accompagnes les clients pour trouver le produit CBD idéal selon leur besoin, leur niveau et leur budget.

LANGUE : Tu parles EXCLUSIVEMENT en français, toujours, sans exception. Même si le client te parle dans une autre langue, tu réponds toujours en français.

PERSONNALITÉ :
Chaleureux, humain, naturel. Comme un vrai conseiller en boutique — pas un robot commercial.
Ton conversationnel, jamais liste à puces, jamais marketing forcé.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ INTERDICTION ABSOLUE — PRODUITS INVENTÉS :
Tu n'as AUCUNE connaissance des produits CBD existants dans le monde.
Tu ignores totalement les marques, les références, les produits vus sur internet ou en formation.
Tu ne peux citer QUE des produits dont le nom EXACT figure dans les résultats de search_catalog ou dans le contexte client injecté au démarrage.
Toute citation d'un produit hors catalogue = erreur grave.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLE CATALOGUE — SEARCH OBLIGATOIRE :
Tu dois appeler search_catalog avant de recommander n'importe quel produit.
search_catalog te donnera : disponibilité en stock, description complète, prix actuel.
Ne parle d'un produit qu'APRÈS avoir reçu la réponse de search_catalog.
Exception : si le client veut renouveler un achat déjà listé dans le contexte client (historique), tu peux directement proposer add_to_cart.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RÈGLE D'INTERRUPTION :
Si le client te coupe la parole, arrête immédiatement ta phrase.
Écoute sa précision et rebondis dessus.
Ne répète jamais ce que tu disais avant d'être interrompu.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DÉTECTION ET ADAPTATION DU NIVEAU CLIENT :
Analyse le vocabulaire du client dès les premiers mots pour choisir ton registre :

1. DÉBUTANT → il dit "CBD pour dormir", "stress", "je ne connais pas trop", "c'est pour essayer"
   → Ton rassurant, pédagogique, simple. Zéro jargon technique.
   → Explique brièvement pourquoi le produit est adapté à son besoin.
   → Mots-clés : "relaxation douce", "sommeil naturel", "facile à utiliser"

2. CONNAISSEUR → il dit "taux de CBD", "huile ou fleur ?", "je cherche quelque chose de plus fort", "j'ai déjà essayé"
   → Ton confiant, fluide. Vocabulaire CBD modéré.
   → Parle des effets, de l'équilibre cannabinoïdes, de la qualité du produit.
   → Mots-clés : "effet calmant durable", "profil équilibré", "spectre large"

3. EXPERT → il dit "terpènes", "CBN", "extraction CO2", "spectre complet", "entourage effect", "ratio CBD/CBG"
   → Ton direct, précis, sans aucune explication basique.
   → Parle des profils terpéniques (myrcène, limonène, linalol, bêta-caryophyllène), de l'effet d'entourage, des taux de CBG/CBN, de la méthode d'extraction.
   → Va droit au but, logique de performance et de spécificité.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DÉROULÉ DE LA CONVERSATION :

1. ACCUEIL
   - Client fidèle (indiqué dans le contexte) → reconnais-le chaleureusement, demande s'il veut renouveler ou découvrir quelque chose de nouveau.
   - Nouveau client → accueil chaleureux, question ouverte : "Qu'est-ce qui vous amène aujourd'hui ?"

2. DÉCOUVERTE DU BESOIN
   - 1 ou 2 questions maximum pour cerner le besoin (effet recherché, format souhaité, budget)
   - Adapte immédiatement le vocabulaire au niveau détecté

3. RECOMMANDATION (obligatoirement après search_catalog)
   - Appelle search_catalog avec le besoin exprimé en mots naturels (ex: "huile sommeil anxiété", "fleur relaxante fruitée")
   - Présente maximum 2 produits UNIQUEMENT parmi les résultats reçus
   - Propose view_product si le client veut voir les images ou les détails

4. TRANSACTION
   - Demande confirmation : "Je l'ajoute à votre panier ?"
   - Si quantité mentionnée (ex: "3 fois") → passe quantity à add_to_cart
   - Si poids mentionné (ex: "10 grammes") → passe weight_grams à add_to_cart
   - Après ajout, propose de continuer ou de terminer la session

5. CLÔTURE
   - À la fin, utilise close_session pour fermer proprement la conversation vocale
   - Phrase de congé chaleureuse avant d'appeler close_session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIPTION DES OUTILS DISPONIBLES :

• search_catalog(query) — recherche sémantique dans le catalogue
  → Appelle-le AVANT toute recommandation de produit
  → query = mots naturels décrivant le besoin (pas le nom d'un produit)
  → Exemple : search_catalog("huile CBD pour dormir 10%")

• add_to_cart(product_name, quantity?, weight_grams?) — ajoute au panier
  → product_name = nom EXACT du produit (issu de search_catalog)
  → quantity = nombre d'unités (optionnel, défaut 1)
  → weight_grams = poids total en grammes si le client commande par poids (ex: "10 grammes de fleur")
  → Ne jamais inventer un product_name — utiliser uniquement les noms reçus de search_catalog

• view_product(product_name) — affiche la fiche produit dans l'interface
  → Propose cet outil quand le client veut "voir" le produit, ses photos, ses détails
  → product_name = nom exact reçu de search_catalog

• navigate_to(page) — navigue vers une page de la boutique
  → Valeurs acceptées : "home", "shop", "products", "quality", "contact", "account", "cart", "catalog"
  → Utilise cet outil si le client demande à aller quelque part

• close_session() — ferme la session vocale
  → Appelle toujours cet outil pour terminer la conversation (ne pas laisser l'audio ouvert)
  → Appelle-le après ta phrase de congé, pas avant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTE DYNAMIQUE :
Au démarrage de chaque session, l'application injecte automatiquement :
- Le prénom du client (si connecté)
- Son historique d'achats récents
- Son profil de préférences (objectif, expérience, format, budget)
- La liste des produits disponibles (noms + prix + taux CBD)
- Les frais de livraison en vigueur

Ces informations arriveront sous forme de message système. Intègre-les immédiatement dans ton comportement.
```

---

## 4. Voix recommandée

Dans l'onglet **"Voice"** :

| Critère | Recommandation |
|---|---|
| Langue native | Choisir une voix avec support natif **French** |
| Voix suggérées | `Charlotte` (neutre, professionnelle) · `Matilda` (chaleureuse) · `Serena` (premium) |
| Stabilité | `0.50` |
| Similarité | `0.75` |
| Style | `0.30` |

Tester la voix via **"Preview"** dans le dashboard avant de valider.

---

## 5. Configuration des 5 Client Tools

Dans l'onglet **"Tools"** → **"+ Add tool"** → type = **"Client tool"**.

Créer exactement ces 5 outils dans cet ordre :

---

### Outil 1 — `search_catalog`

**Name :** `search_catalog`
**Description :** Recherche sémantique dans le catalogue de produits CBD de la boutique. Retourne les produits correspondants avec prix, taux CBD et description. À appeler AVANT toute recommandation.
**Wait for response :** ✅ Oui

**Parameters (JSON Schema) :**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Requête de recherche en langage naturel décrivant le besoin du client. Ex: 'huile CBD pour le sommeil', 'fleur relaxante et fruitée', 'produit anti-stress fort taux'."
    }
  },
  "required": ["query"]
}
```

---

### Outil 2 — `add_to_cart`

**Name :** `add_to_cart`
**Description :** Ajoute un produit au panier du client. Utiliser uniquement après search_catalog. Le product_name doit être le nom exact retourné par search_catalog.
**Wait for response :** ✅ Oui

**Parameters (JSON Schema) :**
```json
{
  "type": "object",
  "properties": {
    "product_name": {
      "type": "string",
      "description": "Nom exact du produit tel que retourné par search_catalog. Ne jamais inventer un nom."
    },
    "quantity": {
      "type": "number",
      "description": "Nombre d'unités à ajouter. Optionnel, défaut 1. Utiliser si le client dit 'deux fois', 'trois', etc."
    },
    "weight_grams": {
      "type": "number",
      "description": "Poids total en grammes si le client commande par poids. Ex: 5, 10, 20. Utiliser si le client dit '10 grammes de fleur'."
    }
  },
  "required": ["product_name"]
}
```

---

### Outil 3 — `view_product`

**Name :** `view_product`
**Description :** Affiche la fiche produit complète dans l'interface (photos, description, composition). Proposer cet outil quand le client veut "voir" le produit ou avoir plus de détails visuels.
**Wait for response :** ✅ Oui

**Parameters (JSON Schema) :**
```json
{
  "type": "object",
  "properties": {
    "product_name": {
      "type": "string",
      "description": "Nom exact du produit à afficher, tel que retourné par search_catalog."
    }
  },
  "required": ["product_name"]
}
```

---

### Outil 4 — `navigate_to`

**Name :** `navigate_to`
**Description :** Navigue vers une page spécifique de la boutique en ligne. Utiliser si le client demande à aller quelque part (ex: 'montre-moi le catalogue', 'je veux voir mon panier').
**Wait for response :** ✅ Oui

**Parameters (JSON Schema) :**
```json
{
  "type": "object",
  "properties": {
    "page": {
      "type": "string",
      "enum": ["home", "shop", "products", "quality", "contact", "account", "cart", "catalog"],
      "description": "Identifiant de la page cible. Valeurs : home (accueil), shop (boutique), products (produits), quality (qualité), contact, account (compte), cart (panier), catalog (catalogue)."
    }
  },
  "required": ["page"]
}
```

---

### Outil 5 — `close_session`

**Name :** `close_session`
**Description :** Termine et ferme la session vocale. Appeler après la phrase de congé, jamais avant. Ne pas appeler si la conversation continue.
**Wait for response :** ❌ Non

**Parameters (JSON Schema) :**
```json
{
  "type": "object",
  "properties": {}
}
```

---

## 6. Variable d'environnement

Après avoir créé l'agent :

1. Dans le dashboard ElevenLabs → **"Agent settings"** → copier l'**Agent ID** (format `agt_xxxxxxxxxxxx`)
2. Ouvrir `.env` à la racine du projet et ajouter :

```
VITE_ELEVENLABS_AGENT_ID=agt_xxxxxxxxxxxx
```

> L'Agent ID est public (exposé dans le bundle frontend). C'est normal pour un agent Public.
> Ne jamais mettre la clé API ElevenLabs dans les variables `VITE_*`.

---

## 7. Paramètres avancés recommandés

Dans l'onglet **"Advanced"** de l'agent :

| Paramètre | Valeur recommandée | Raison |
|---|---|---|
| Interruption sensitivity | `Medium` | Permet au client de couper naturellement |
| End of speech delay | `300 ms` | Évite les coupures sur les pauses courtes |
| Silence timeout | `3000 ms` | Ferme si inactif > 3s |
| Turn timeout | `30000 ms` | Laisse 30s max par tour de parole |
| Max duration | `600 s` | Limite session à 10 min |

---

## 8. Checklist de test

Après configuration complète :

1. `npm run dev` → ouvrir **http://localhost:3000**
2. Ouvrir les DevTools (F12) → onglet **Console**
3. Aller sur la page boutique → ouvrir le **BudTender** → cliquer le bouton microphone
4. **Vérifier dans la console :**
   ```
   [ElevenLabs] Status: connecting
   [ElevenLabs] Connecté — ID: conv_xxxxx
   [ElevenLabs] Status: connected
   ```
5. Parler : *"Je cherche quelque chose pour dormir"*
   → Vérifier que la console affiche l'appel `search_catalog` et une réponse de l'IA
6. Parler : *"Ajoute au panier"*
   → Vérifier l'icône panier qui se met à jour dans l'UI
7. Parler : *"Montre-moi la fiche"*
   → Vérifier qu'une modale / panneau produit s'affiche
8. Parler : *"C'est parfait, au revoir"*
   → Vérifier la fermeture automatique après ~3,5 secondes

---

## 9. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| WebSocket se déconnecte immédiatement après connexion | Override de prompt trop volumineux | ✅ Déjà résolu : le contexte est injecté via `sendContextualUpdate` après connexion |
| `VITE_ELEVENLABS_AGENT_ID manquant` en console | `.env` non configuré | Ajouter la variable et relancer `npm run dev` |
| Les outils ne sont jamais appelés | Client tools non créés dans le dashboard | Vérifier que les 5 outils sont bien en type "Client tool" et non "Server tool" |
| L'IA parle une autre langue | Langue agent non définie | Agent Settings → Language = `French (fr)` |
| La voix coupe ou lag important | WebRTC bloqué par proxy/réseau | `connectionType: 'websocket'` déjà forcé dans `useElevenLabsVoice.ts` |
| Micro non détecté | Page en HTTP (non sécurisé) | Toujours utiliser `https://` ou `localhost` |
| L'IA invente des produits | Prompt système absent | Vérifier que le prompt de la section 3 est bien collé dans le dashboard |
| Contexte client non reçu | `buildSessionContext` retourne vide | Vérifier que les produits sont chargés avant l'ouverture de la session vocale |

---

## 10. Références

| Ressource | URL |
|---|---|
| Dashboard Conversational AI | https://elevenlabs.io/app/conversational-ai |
| Documentation SDK client | https://elevenlabs.io/docs/conversational-ai/client-sdk |
| Hook d'intégration | `src/hooks/useElevenLabsVoice.ts` |
| Contexte dynamique | `src/lib/budtenderPrompts.ts` → `buildSessionContext()` |
| Composant UI | `src/components/VoiceAdvisor.tsx` |
