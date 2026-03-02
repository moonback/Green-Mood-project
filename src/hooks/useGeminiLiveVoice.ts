import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from './useBudTenderMemory';

// ─── Constants ───────────────────────────────────────────────────────────────

const WS_ENDPOINT =
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
const INPUT_SAMPLE_RATE = 16000; // Gemini Live API requires 16kHz PCM input
const OUTPUT_SAMPLE_RATE = 24000; // Gemini Live API outputs 24kHz PCM
const CONNECTION_TIMEOUT_MS = 10000;

// Minimal scheduling ahead — keeps playback tight without gaps
const AUDIO_SCHEDULE_AHEAD_SEC = 0.008;

// ─── Types ───────────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

interface GeminiServerMessage {
    setupComplete?: boolean;
    goingAway?: boolean;
    serverContent?: {
        turnComplete?: boolean;
        interrupted?: boolean;
        modelTurn?: {
            parts?: Array<{
                inlineData?: { mimeType: string; data: string };
                text?: string;
            }>;
        };
        inputTranscription?: { text?: string; final?: boolean };
        outputTranscription?: { text?: string };
    };
    toolCall?: {
        functionCalls: Array<{
            name: string;
            args: any;
            id: string;
        }>;
    };
}

interface Options {
    products: Product[];
    pastProducts?: PastProduct[];
    savedPrefs?: SavedPrefs | null;
    userName?: string | null;
    onAddItem?: (product: Product) => void;
}

// ─── Audio utilities ─────────────────────────────────────────────────────────

/** Downsample Float32 audio by averaging blocks. */
function downsampleBuffer(buf: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return buf;
    const ratio = fromRate / toRate;
    const outLen = Math.floor(buf.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
        const start = Math.floor(i * ratio);
        const end = Math.min(Math.floor((i + 1) * ratio), buf.length);
        let sum = 0;
        for (let j = start; j < end; j++) sum += buf[j];
        out[i] = sum / (end - start);
    }
    return out;
}

/** Convert Float32 [-1, 1] samples to Int16 PCM. */
function float32ToInt16(buf: Float32Array): Int16Array {
    const out = new Int16Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
        const s = Math.max(-1, Math.min(1, buf[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

/** Convert Uint8Array to base64 string. */
function toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGeminiLiveVoice({ products, pastProducts = [], savedPrefs, userName, onAddItem }: Options) {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    const [compatibilityError] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        if (!window.isSecureContext) return 'La voix nécessite une connexion sécurisée (HTTPS).';
        if (!navigator.mediaDevices?.getUserMedia) return 'Microphone non supporté par ce navigateur.';
        if (typeof window.AudioContext === 'undefined') return 'AudioContext non supporté par ce navigateur.';
        if (typeof window.WebSocket === 'undefined') return 'WebSocket non supporté par ce navigateur.';
        if (!('audioWorklet' in AudioContext.prototype)) {
            return 'AudioWorklet non supporté. Utilisez une version récente de Chrome, Edge ou Safari.';
        }
        return null;
    });

    // All mutable session state lives in refs so audio callbacks always see current values
    const wsRef = useRef<WebSocket | null>(null);
    const captureCtxRef = useRef<AudioContext | null>(null);
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scheduledUntilRef = useRef<number>(0); // next available playback time
    const isSpeakingRef = useRef(false);
    const isMutedRef = useRef(false);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const setupTimeoutRef = useRef<number | null>(null);
    const startInFlightRef = useRef(false);
    const sessionIdRef = useRef(0);
    const isManualCloseRef = useRef(false);

    // ── System prompt ────────────────────────────────────────────────────────

    const buildSystemPrompt = useCallback((): string => {
        const greeting = userName ? `Le client s'appelle ${userName}. ` : '';

        let prefsText = 'Le client n\'a pas encore défini de préférences de profil.';
        if (savedPrefs) {
            const { goal, experience, format, budget, age, intensity, terpenes, ...others } = savedPrefs;
            const entries = [
                `Objectif: ${goal}`,
                `Expérience: ${experience}`,
                `Format: ${format}`,
                `Budget: ${budget}`,
                `Âge: ${age || 'Non précisé'}`,
                `Intensité: ${intensity || 'Non précisé'}`,
                `Terpènes: ${Array.isArray(terpenes) ? terpenes.join(', ') : 'Aucun'}`
            ];

            Object.entries(others).forEach(([key, val]) => {
                if (val) entries.push(`${key}: ${val}`);
            });

            prefsText = `CONTEXTE BIEN-ÊTRE DU CLIENT:\n- ${entries.join('\n- ')}`;
        }

        const catalogStr = products
            .slice(0, 10)
            .map(p => {
                const aromas = (p.attributes?.aromas ?? []).join(', ');
                const benefits = (p.attributes?.benefits ?? []).join(', ');
                return (
                    `• ${p.name} | ${p.category?.name ?? ''} | CBD ${p.cbd_percentage ?? '?'}% | ${p.price}€` +
                    (p.description ? ` | ${p.description.slice(0, 100)}` : '') +
                    (aromas ? ` | Arômes: ${aromas}` : '') +
                    (benefits ? ` | Effets: ${benefits}` : '')
                );
            })
            .join('\n');

        const historyStr = pastProducts.length > 0
            ? `Achats récents: ${pastProducts.slice(0, 3).map(p => p.product_name).join(', ')}. `
            : '';

        return `
TU ES :
Le meilleur Budtender vocal de Green Moon CBD.
Un expert humain, pédagogue et crédible, comme en boutique physique.
Tu parles à voix haute : ton langage est ORAL, naturel et fluide.

${greeting}
${prefsText}
${historyStr}

CATALOGUE DISPONIBLE (NE JAMAIS SORTIR DE CE CADRE) :
${catalogStr}

EXPERTISE PRODUITS :
- THCV : molécule stimulante orientée énergie, clarté mentale et contrôle de l’appétit. Utilisation plutôt en journée.
- THV-N10 : cannabinoïde nouvelle génération orienté détente profonde, lâcher-prise et relaxation mentale, sans effet planant type THC.
- Tu connais les synergies, dosages progressifs et profils utilisateurs.

RÈGLES ABSOLUES (OBLIGATOIRES) :
- Réponds UNIQUEMENT en français.
- Réponses ORALES et naturelles (1 à 4 phrases maximum).
- Jamais de listes, jamais de jargon médical.
- ZÉRO promesse thérapeutique (pas de soigner, traiter, guérir).
- Tu parles en bien-être, sensations, retours d’expérience.
- Propose UN SEUL produit à la fois.
- Uniquement des produits présents dans le catalogue ci-dessus.
- Si une info manque, pose UNE question simple et directe.
- Si l’utilisateur interrompt, tu t’arrêtes immédiatement.
- PRIORITÉ DÉCOUVERTE : Ne propose AUCUN produit avant d'avoir qualifié le besoin (objectif, moment de la journée, expérience souhaitée).
- ANTICIPATION : Une fois le besoin qualifié, précède les questions futures (ex: mode de consommation idéal).
- CONFIRMATION : Demande TOUJOURS "Est-ce que tu veux que je l'ajoute à ton panier ?" avant d'utiliser l'outil 'add_to_cart'. N'utilise JAMAIS l'outil 'add_to_cart' sans un accord explicite du client.

GEOFENCING / ACTIONS :
- Commande 'add_to_cart' : À utiliser UNIQUEMENT après que le client a confirmé vouloir acheter le produit proposé.

STRUCTURE MENTALE À RESPECTER À CHAQUE RÉPONSE :
1. Accueil chaleureux ou Accusé de compréhension
2. Qualification (Question pour affiner le besoin) OU Recommandation (si le besoin est déjà clair)
3. Justification + ANTICIPATION (ex: "Tu cherches plutôt à te détendre après le travail ou à rester actif ?")
4. CONTEXTE PANIER : Si tu recommandes un produit spécifique, demande s'il faut l'ajouter au panier.

EXEMPLES INTERNES (NE PAS AFFICHER) :
- “Bienvenu chez Green Moon ! Dis-moi, pour t'orienter au mieux, tu recherches quel type de ressenti aujourd'hui ?”
- “C'est noté pour la détente. Tu cherches plutôt un effet léger pour rester focus ou quelque chose de plus marqué pour décrocher ?”
- “Je te recommande la Blue Dream pour son côté relaxant mais créatif. C'est exactement ce qu'il te faut pour ta soirée. Est-ce que tu veux que je l'ajoute à ton panier ?”

OBJECTIF FINAL :
Écouter et comprendre avant de conseiller.
Être un guide attentionné qui qualifie le besoin pour garantir la satisfaction client.
`;
    }, [products, pastProducts, savedPrefs, userName]);

    const clearSetupTimeout = useCallback(() => {
        if (setupTimeoutRef.current) {
            window.clearTimeout(setupTimeoutRef.current);
            setupTimeoutRef.current = null;
        }
    }, []);

    const stopAllPlayback = useCallback(() => {
        activeSourcesRef.current.forEach(source => {
            try {
                source.stop(0);
            } catch {
                // already stopped
            }
        });
        activeSourcesRef.current.clear();
    }, []);

    // ── Audio playback ───────────────────────────────────────────────────────

    const getPlaybackCtx = useCallback((): AudioContext => {
        if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
            playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
        }
        if (playbackCtxRef.current.state === 'suspended') {
            playbackCtxRef.current.resume().catch(() => { });
        }
        return playbackCtxRef.current;
    }, []);

    const interruptAudio = useCallback(() => {
        const ctx = playbackCtxRef.current;
        if (!ctx || ctx.state === 'closed') return;
        stopAllPlayback();
        scheduledUntilRef.current = ctx.currentTime;
        isSpeakingRef.current = false;
        setVoiceState('listening');
    }, [stopAllPlayback]);

    const playPcmChunk = useCallback(
        (base64Data: string) => {
            try {
                const ctx = getPlaybackCtx();
                const binary = atob(base64Data);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

                const int16 = new Int16Array(bytes.buffer);
                const float32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

                const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
                audioBuffer.copyToChannel(float32, 0);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);

                const now = ctx.currentTime;
                const startAt = Math.max(now + AUDIO_SCHEDULE_AHEAD_SEC, scheduledUntilRef.current);
                source.start(startAt);
                scheduledUntilRef.current = startAt + audioBuffer.duration;

                activeSourcesRef.current.add(source);
                isSpeakingRef.current = true;
                setVoiceState('speaking');

                source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    if (ctx.currentTime >= scheduledUntilRef.current - 0.05) {
                        isSpeakingRef.current = false;
                        setVoiceState('listening');
                    }
                };
            } catch (e) {
                if (import.meta.env.DEV) console.error('[VoiceAdvisor] Playback error:', e);
            }
        },
        [getPlaybackCtx]
    );

    // ── Audio capture ────────────────────────────────────────────────────────

    const startMicCapture = useCallback(async (stream: MediaStream) => {
        const ctx = new AudioContext();
        captureCtxRef.current = ctx;
        const nativeRate = ctx.sampleRate;

        await ctx.audioWorklet.addModule('/audio-processor.js');

        const source = ctx.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(ctx, 'mic-processor');
        processorRef.current = workletNode;

        workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
            if (wsRef.current?.readyState !== WebSocket.OPEN) return;
            if (isMutedRef.current) return;

            const raw: Float32Array = event.data;
            const downsampled = downsampleBuffer(raw, nativeRate, INPUT_SAMPLE_RATE);
            const pcm16 = float32ToInt16(downsampled);
            const b64 = toBase64(new Uint8Array(pcm16.buffer));

            wsRef.current.send(
                JSON.stringify({
                    realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: b64 }] },
                })
            );
        };

        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        source.connect(workletNode);
        workletNode.connect(silentGain);
        silentGain.connect(ctx.destination);
    }, []);

    const cleanup = useCallback(() => {
        isManualCloseRef.current = true;
        clearSetupTimeout();
        stopAllPlayback();
        processorRef.current?.disconnect();
        processorRef.current = null;
        captureCtxRef.current?.close().catch(() => { });
        captureCtxRef.current = null;
        playbackCtxRef.current?.close().catch(() => { });
        playbackCtxRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        wsRef.current?.close(1000);
        wsRef.current = null;
        scheduledUntilRef.current = 0;
        isSpeakingRef.current = false;
        isMutedRef.current = false;
        startInFlightRef.current = false;
        sessionIdRef.current += 1;
    }, [clearSetupTimeout, stopAllPlayback]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const stopSession = useCallback(() => {
        cleanup();
        setVoiceState('idle');
        setIsMuted(false);
    }, [cleanup]);

    const startSession = useCallback(async () => {
        if (startInFlightRef.current || voiceState === 'connecting') return;

        if (wsRef.current || streamRef.current || captureCtxRef.current || playbackCtxRef.current) {
            cleanup();
        }

        isManualCloseRef.current = false;
        const sessionId = sessionIdRef.current + 1;
        sessionIdRef.current = sessionId;

        if (compatibilityError) {
            setError(compatibilityError);
            setVoiceState('error');
            return;
        }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
        if (!apiKey) {
            setError('Clé API Gemini manquante. Ajoutez VITE_GEMINI_API_KEY dans votre fichier .env');
            setVoiceState('error');
            return;
        }

        startInFlightRef.current = true;
        setVoiceState('connecting');
        setError(null);
        scheduledUntilRef.current = 0;
        isMutedRef.current = false;
        setIsMuted(false);

        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: INPUT_SAMPLE_RATE,
                },
            });
            streamRef.current = stream;
        } catch (err) {
            const isDenied = err instanceof DOMException && err.name === 'NotAllowedError';
            setError(
                isDenied
                    ? "Accès au microphone refusé. Autorisez le micro dans les paramètres de votre navigateur."
                    : "Impossible d'accéder au microphone."
            );
            setVoiceState('error');
            startInFlightRef.current = false;
            return;
        }

        const ws = new WebSocket(`${WS_ENDPOINT}?key=${apiKey}`);
        wsRef.current = ws;

        setupTimeoutRef.current = window.setTimeout(() => {
            if (sessionIdRef.current !== sessionId) return;
            setError('La connexion vocale met trop de temps. Vérifiez votre réseau et réessayez.');
            setVoiceState('error');
            cleanup();
        }, CONNECTION_TIMEOUT_MS);

        ws.onopen = () => {
            if (sessionIdRef.current !== sessionId) return;
            ws.send(
                JSON.stringify({
                    setup: {
                        model: LIVE_MODEL,
                        generationConfig: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: 'Aoede' },
                                },
                            },
                        },
                        systemInstruction: {
                            parts: [{ text: buildSystemPrompt() }],
                        },
                        tools: [
                            {
                                function_declarations: [
                                    {
                                        name: 'add_to_cart',
                                        description: 'Ajouter un produit du catalogue au panier du client.',
                                        parameters: {
                                            type: 'OBJECT',
                                            properties: {
                                                product_name: {
                                                    type: 'STRING',
                                                    description: 'Le nom du produit à ajouter au panier.',
                                                },
                                            },
                                            required: ['product_name'],
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                })
            );
        };

        ws.onmessage = async (event) => {
            if (sessionIdRef.current !== sessionId) return;
            try {
                const raw: string =
                    event.data instanceof Blob ? await event.data.text() : (event.data as string);
                const msg = JSON.parse(raw) as GeminiServerMessage;

                if (msg.setupComplete) {
                    clearSetupTimeout();
                    setVoiceState('listening');
                    await startMicCapture(stream);
                    startInFlightRef.current = false;
                    return;
                }

                if (msg.goingAway) {
                    cleanup();
                    setVoiceState('idle');
                    startInFlightRef.current = false;
                    return;
                }

                const sc = msg.serverContent;
                if (sc) {
                    if (sc.interrupted) {
                        interruptAudio();
                        return;
                    }

                    if (sc.turnComplete) {
                        scheduledUntilRef.current = playbackCtxRef.current?.currentTime ?? 0;
                        isSpeakingRef.current = false;
                        setVoiceState('listening');
                        return;
                    }

                    if (sc.modelTurn?.parts) {
                        for (const part of sc.modelTurn.parts) {
                            if (part.inlineData?.data && part.inlineData.mimeType.includes('audio')) {
                                playPcmChunk(part.inlineData.data);
                            }
                        }
                    }
                }

                if (msg.toolCall?.functionCalls) {
                    const responses = [];
                    for (const fc of msg.toolCall.functionCalls) {
                        if (fc.name === 'add_to_cart') {
                            const name = fc.args.product_name?.toLowerCase() || '';
                            const product = products.find(p => p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase()));
                            if (product && onAddItem) {
                                onAddItem(product);
                                responses.push({
                                    name: fc.name,
                                    id: fc.id,
                                    response: { result: `Produit "${product.name}" ajouté au panier.` },
                                });
                            } else {
                                responses.push({
                                    name: fc.name,
                                    id: fc.id,
                                    response: { error: `Produit "${fc.args.product_name}" non trouvé dans le catalogue.` },
                                });
                            }
                        }
                    }
                    if (responses.length > 0) {
                        ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
                    }
                }

            } catch (e) {
                if (import.meta.env.DEV) console.error('[VoiceAdvisor] WS message error:', e);
            }
        };

        ws.onerror = () => {
            if (sessionIdRef.current !== sessionId) return;
            clearSetupTimeout();
            setError('Erreur de connexion WebSocket. Vérifiez votre clé API Gemini et votre connexion internet.');
            setVoiceState('error');
            cleanup();
        };

        ws.onclose = (e) => {
            if (sessionIdRef.current !== sessionId) return;
            clearSetupTimeout();
            startInFlightRef.current = false;
            if (!isManualCloseRef.current && e.code !== 1000) {
                setError('Session vocale fermée de manière inattendue.');
                setVoiceState('error');
            }
        };
    }, [buildSystemPrompt, startMicCapture, playPcmChunk, interruptAudio, cleanup, voiceState, compatibilityError, clearSetupTimeout, products, onAddItem]);

    const toggleMute = useCallback(() => {
        isMutedRef.current = !isMutedRef.current;
        setIsMuted(m => !m);
    }, []);

    const isSupported = useMemo(() => !compatibilityError, [compatibilityError]);

    return { voiceState, error, isMuted, isSupported, compatibilityError, startSession, stopSession, toggleMute };
}
