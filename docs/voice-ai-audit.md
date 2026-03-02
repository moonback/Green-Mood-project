# Audit expert — fonctionnalité BudTender IA vocale (React + Vite)

## 1) Résumé exécutif

La base actuelle est solide pour un MVP premium (AudioWorklet, streaming WebSocket bidirectionnel, VAD serveur Gemini, UI d’état claire). Cependant, plusieurs points bloquants limitent la robustesse production:

- **Couplage fort** entre orchestration session, audio DSP, protocole WS Gemini et logique de transcript dans un **seul hook**.
- **Gestion d’état implicite** (refs + `useState`) sans machine d’état formelle, ouvrant la porte à des transitions invalides.
- **Absence de garde de compatibilité navigateur/mobile** avant démarrage (support AudioWorklet / WebSocket / getUserMedia).
- **Gestion interruption / playback incomplète**: l’UI passe en listening mais l’audio déjà planifié peut continuer brièvement.
- **Dégradation limitée** vers mode texte en cas d’erreur vocale (l’utilisateur reste dans une vue orientée voix).

---

## 2) Analyse exhaustive de l’existant

## 2.1 Architecture technique

### Forces
- `useGeminiLiveVoice` centralise les états clés (`idle | connecting | listening | speaking | error`) avec API propre (`startSession`, `stopSession`, `toggleMute`).
- Pipeline audio moderne via `AudioWorkletNode` et PCM16 streamé en temps réel.
- Prompt système riche en contexte métier (catalogue + préférences + historique achats).

### Limites / dettes
- **Hook monolithique**: prompting, capture micro, downsampling, playback, parsing WS, transcript et erreurs sont réunis dans `useGeminiLiveVoice`.
- **État non déterministe**: absence de garde explicite sur transitions (ex: double `startSession`, race `onclose/onerror/cleanup`).
- **Lifecycle partiellement piloté par UI**: fermeture via `handleClose` appelle `stopSession`, mais pas de cleanup explicite garanti sur unmount du composant voix.
- **Prompt recalculé au démarrage seulement**: pas de mise à jour en session quand préférences/catalogue changent.

## 2.2 Pipeline vocal

### Forces
- Capture micro en mono + options navigateur (`echoCancellation`, `noiseSuppression`, `autoGainControl`).
- Downsample vers 16kHz conforme API Live.
- Scheduling audio continu pour limiter les gaps.
- Interruption serveur (`sc.interrupted`) prise en compte côté UI/transcript.

### Risques
- **Interruption partielle réelle**: `interruptAudio()` ne stoppe pas les `AudioBufferSourceNode` déjà programmés; seulement le pointeur de scheduling est reset.
- **Conversion base64 coûteuse CPU** (concat string caractère par caractère).
- **Aucune stratégie timeout/retry backoff** (WS, setup lent, freeze réseau).
- **Dépendance au module `/audio-processor.js` sans fallback** si AudioWorklet indisponible.
- **Aucune mesure de latence E2E** (TTFB vocal, first audio chunk, turn complete).

## 2.3 Intelligence conversationnelle

### Forces
- Prompt orienté commerce CBD et garde-fous conformité (pas de promesse thérapeutique).
- Contraintes de concision adaptées à la voix (1–2 phrases).
- Logique de découverte explicite avant recommandation produit.

### Limites
- **Prompt statique** sans adaptation dynamique au tour (ex: compression mémoire conversationnelle, heuristique d’intention).
- **Pas de régulation de longueur côté runtime** (si le modèle dépasse, pas de post-traitement).
- **Contexte conversationnel non persistant côté voix** (transcript local UI, pas de mémoire courte/longue dédiée à la session vocale).
- **Pas de policy de clarification basée sur slots manquants** (budget, format, timing, intensité).

## 2.4 UX/UI vocale

### Forces
- États visuels clairs (connecting/listening/speaking/error).
- Transcript temps réel affichable.
- Contrôles essentiels disponibles (mute / raccrocher / retry).

### Limites
- **Barre d’action centrale ambiguë**: le bouton principal ne fait rien en session active (click désactivé), ce qui peut gêner certains usages.
- **Interruption utilisateur partielle**: support dépend du VAD serveur uniquement, sans barge-in local explicite.
- **Mode hybride texte+voix limité**: pas d’input texte dans l’overlay vocal pour continuer sans quitter l’écran.
- **Accessibilité**: pas d’indices ARIA live region pour états changeants / transcription.

## 2.5 Performance & stabilité

### Forces
- Nettoyage ressources prévu (`close`, `stop tracks`, `disconnect`).
- Échantillonnage réduit côté capture pour limiter bande passante.

### Limites
- **Risque de fuite logique** via callbacks WS tardifs après fermeture (pas de session token pour ignorer événements obsolètes).
- **Pas d’instrumentation perf** (logs structurés, métriques session).
- **Animations coûteuses potentielles** en mobile bas de gamme sans mécanisme `prefers-reduced-motion` dédié voix.

## 2.6 Sécurité & conformité

### Forces
- Utilisation WSS vers API fournisseur.
- Message d’erreur explicite sur permission micro refusée.

### Risques
- **Clé Gemini exposée côté client** (`VITE_GEMINI_API_KEY`) => risque d’abus de quota/facturation.
- **Politique RGPD non explicite dans l’UX vocale** (consentement, durée de conservation transcription, finalité).
- **Pas de mode anonymisation** (suppression/masquage entités potentiellement sensibles dans transcript).

---

## 3) Problèmes identifiés par gravité

## P0 — Critique (à traiter immédiatement)
1. Clé API fournisseur en frontend public (risque sécurité/coût).
2. Interruption audio incomplète (barge-in parfois perçu comme “l’IA continue de parler”).
3. Absence de fallback explicite de compatibilité (AudioWorklet/non support mobile).

## P1 — Important
1. Hook monolithique difficile à maintenir/tester.
2. Pas de machine d’état explicite => transitions non robustes.
3. Pas de timeout/retry/backoff réseau.
4. Pas d’observabilité latence/erreurs en production.

## P2 — Amélioration UX/Produit
1. Mode hybride texte+voix non fluide.
2. Accessibilité conversationnelle incomplète.
3. Personnalisation vocale limitée (voix unique, ton fixe).

---

## 4) Plan d’amélioration progressif et priorisé

## Sprint 1 (stabilisation prod)
- **Sécuriser l’accès LLM vocal**: passer par un backend token broker / ephemeral session key.
- **Compatibilité proactive**: `useVoiceCapabilities()` avant ouverture (getUserMedia, AudioWorklet, WebSocket).
- **Interruption hard-stop**: conserver les `AudioBufferSourceNode` actifs et appeler `stop()` sur interruption.
- **Timeouts et retry**: setup timeout (ex 10s), retry exponentiel (max 2), message UX contextualisé.

## Sprint 2 (architecture)
- Découper en services:
  - `voiceTransportService` (WS, protocol frames, reconnect)
  - `audioCaptureService` (mic, worklet, DSP)
  - `audioPlaybackService` (queue, interruption, volume)
  - `conversationService` (prompt runtime, slots, guardrails)
- Introduire une **state machine** (`xstate` ou reducer strict) pour transitions garanties.
- Ajouter tests unitaires des transitions et parseurs WS.

## Sprint 3 (UX conversationnelle)
- Mode hybride: champ texte inline pendant session vocale.
- Barge-in local: VAD local léger pour couper immédiatement la lecture.
- Accessibilité: `aria-live="polite"` pour statut + transcription.
- Compression de transcript et mémoire session courte (résumés toutes N interactions).

## Sprint 4 (intelligence avancée)
- Clarification par slots (intent extraction: objectif/budget/format/intensité/moment).
- Réponses adaptatives (longueur selon confiance et impatience détectée).
- Upsell vocal intelligent avec contraintes éthiques (1 suggestion complémentaire max).

---

## 5) Architecture cible (schéma logique)

```text
UI VoiceAdvisor
   │
   ├─ useVoiceSessionMachine (state machine)
   │     ├─ states: idle → requestingPermission → connecting → listening ↔ speaking → error
   │     └─ events: START, PERMISSION_OK, WS_OPEN, AUDIO_CHUNK, INTERRUPT, STOP, FAIL
   │
   ├─ audioCaptureService
   │     ├─ getUserMedia + AudioWorklet
   │     └─ emits pcm16 chunks
   │
   ├─ voiceTransportService
   │     ├─ Gemini WS protocol
   │     ├─ timeout/retry
   │     └─ emits server events (setupComplete, interrupted, transcription, audio)
   │
   ├─ audioPlaybackService
   │     ├─ queue chunks
   │     ├─ play / stopAll / ducking
   │     └─ metrics: firstAudioMs, underruns
   │
   └─ conversationService
         ├─ prompt composer (context + slots)
         ├─ response length policy
         └─ guardrails compliance
```

---

## 6) Patterns recommandés

- **Custom hooks**
  - `useVoiceCapabilities()`
  - `useVoiceSessionMachine()`
  - `useVoiceMetrics()`
- **State machine**
  - Transitions déterministes et testables.
- **Service layer**
  - Injection de dépendances pour mock en test.
- **Event bus typed**
  - Typage fort des événements WS/audio pour éviter états fantômes.

---

## 7) Pseudo-code orienté production

### 7.1 Machine d’état simplifiée

```ts
type State = 'idle'|'requestingPermission'|'connecting'|'listening'|'speaking'|'error';

type Event =
  | { type: 'START' }
  | { type: 'PERMISSION_OK' }
  | { type: 'WS_OPEN' }
  | { type: 'MODEL_AUDIO' }
  | { type: 'INTERRUPT' }
  | { type: 'STOP' }
  | { type: 'FAIL'; reason: string };

function reducer(state: State, event: Event): State {
  switch (state) {
    case 'idle': return event.type === 'START' ? 'requestingPermission' : state;
    case 'requestingPermission':
      if (event.type === 'PERMISSION_OK') return 'connecting';
      if (event.type === 'FAIL') return 'error';
      return state;
    case 'connecting':
      if (event.type === 'WS_OPEN') return 'listening';
      if (event.type === 'FAIL') return 'error';
      return state;
    case 'listening':
      if (event.type === 'MODEL_AUDIO') return 'speaking';
      if (event.type === 'STOP') return 'idle';
      return state;
    case 'speaking':
      if (event.type === 'INTERRUPT') return 'listening';
      if (event.type === 'STOP') return 'idle';
      return state;
    default:
      return event.type === 'START' ? 'requestingPermission' : state;
  }
}
```

### 7.2 Interruption audio robuste

```ts
const activeSources = new Set<AudioBufferSourceNode>();

function scheduleChunk(buffer: AudioBuffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.onended = () => activeSources.delete(src);
  activeSources.add(src);
  src.start(nextTime);
}

function hardInterrupt() {
  for (const src of activeSources) {
    try { src.stop(0); } catch {}
  }
  activeSources.clear();
  nextTime = ctx.currentTime;
}
```

---

## 8) Features avancées recommandées

1. **Détection d’émotion / hésitation (lightweight)**
   - signaux: pauses longues, relances, variations prosodiques basiques.
   - usage: adapter rythme, simplifier phrase, proposer reformulation.

2. **Voix adaptative selon profil client**
   - novice: plus pédagogique / débit lent.
   - client expert: réponse plus dense.

3. **Reformulation automatique**
   - si score confiance intent faible, reformuler en 1 phrase + question fermée.

4. **Upsell vocal intelligent**
   - après recommandation acceptée, proposer 1 complément pertinent (ex huile + infusion)
   - règle stricte: jamais agressif, jamais hors budget déclaré.

---

## 9) Pourquoi ces recommandations

- Elles réduisent d’abord le **risque prod** (sécurité, fiabilité, UX interruption), puis améliorent la **maintenabilité** et enfin l’**impact business** (conversion, panier moyen, rétention).
- Le plan est **incrémental**: aucune réécriture complète, chaque sprint apporte une valeur mesurable.
- L’architecture cible permet de tester isolément audio/transport/conversation, indispensable pour un assistant vocal e-commerce en charge réelle.
