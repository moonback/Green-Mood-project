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
    setup_complete?: boolean;
    goingAway?: boolean;
    going_away?: boolean;
    serverContent?: {
        turnComplete?: boolean;
        interrupted?: boolean;
        modelTurn?: {
            parts?: Array<{
                inlineData?: { mimeType: string; data: string };
                text?: string;
            }>;
        };
    };
    server_content?: {
        turn_complete?: boolean;
        interrupted?: boolean;
        model_turn?: {
            parts?: Array<{
                inline_data?: { mime_type: string; data: string };
                text?: string;
            }>;
        };
    };
    toolCall?: {
        functionCalls: Array<{
            name: string;
            args: any;
            id: string;
        }>;
    };
    tool_call?: {
        function_calls: Array<{
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
    onAddItem?: (product: Product, quantity: number) => void;
    deliveryFee?: number;
    deliveryFreeThreshold?: number;
}

// ─── Audio utilities ─────────────────────────────────────────────────────────

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

function float32ToInt16(buf: Float32Array): Int16Array {
    const out = new Int16Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
        const s = Math.max(-1, Math.min(1, buf[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

function toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGeminiLiveVoice({
    products,
    pastProducts = [],
    savedPrefs,
    userName,
    onAddItem,
    deliveryFee = 5.9,
    deliveryFreeThreshold = 50
}: Options) {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    const [compatibilityError] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        if (!window.isSecureContext) return 'Sécurisé (HTTPS) requis.';
        if (!navigator.mediaDevices?.getUserMedia) return 'Microphone non supporté.';
        if (!('audioWorklet' in AudioContext.prototype)) return 'AudioWorklet non supporté.';
        return null;
    });

    const wsRef = useRef<WebSocket | null>(null);
    const captureCtxRef = useRef<AudioContext | null>(null);
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scheduledUntilRef = useRef<number>(0);
    const isSpeakingRef = useRef(false);
    const isMutedRef = useRef(false);
    const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const setupTimeoutRef = useRef<number | null>(null);
    const startInFlightRef = useRef(false);
    const sessionIdRef = useRef(0);
    const isManualCloseRef = useRef(false);

    const buildSystemPrompt = useCallback((): string => {
        const greeting = userName ? `Le client s'appelle ${userName}. ` : '';
        let prefsText = 'Profil non défini.';
        if (savedPrefs) {
            const { goal, experience, format, budget, terpenes } = savedPrefs;
            prefsText = `CONTEXTE CLIENT ACTUEL:\n- Objectif: ${goal}\n- Expérience: ${experience}\n- Format: ${format}\n- Budget: ${budget}\n- Terpènes: ${terpenes?.join(', ')}`;
        }

        const catalogStr = products.slice(0, 10).map(p => `• ${p.name} | ${p.price}€ | CBD ${p.cbd_percentage}%`).join('\n');

        return `
${greeting}
${prefsText}

CATALOGUE DISPONIBLE (Utilise UNIQUEMENT ces produits) :
${catalogStr}
FRAIS DE PORT : Standard ${deliveryFee}€, Gratuit dès ${deliveryFreeThreshold}€.

🎭 RÔLE & IDENTITÉ
Tu es un conseiller bien-être CBD expert, équivalent à un budtender professionnel en boutique spécialisée.
Tu n’es ni un médecin, ni un pharmacien, ni un vendeur agressif.
Tu es calme, précis, pédagogique, rassurant et orienté expérience client.
Ton objectif principal est d'aider l’utilisateur à choisir le bon produit CBD, éviter les mauvaises expériences, maximiser la satisfaction et augmenter la conversion sans manipulation.

⚖️ CADRE LÉGAL STRICT (OBLIGATOIRE)
- Interdiction : Diagnostic médical, promesses de guérison, conseils pour maladies (cancer, dépression, épilepsie, etc.), substitution à un traitement.
- Autorisé : Bien-être, relaxation, confort, gestion du stress/sommeil/récupération.
- Rappel obligatoire si nécessaire : “Le CBD n’est pas un médicament et ne remplace pas un avis médical.”

🧠 COMPORTEMENT GÉNÉRAL
- Pose une seule question à la fois.
- Utilise des phrases courtes. Ne surcharge jamais l’utilisateur.
- Reformule régulièrement : “Si je résume…”
- Justifie chaque recommandation. Ne force jamais l’achat.
- Ton : Professionnel, accessible, jamais familier ni agressif.

👤 PROFILAGE UTILISATEUR (PRIORITÉ ABSOLUE)
Ton premier objectif est de comprendre l’utilisateur (3 à 5 questions max) :
1. Objectif principal (stress, sommeil, douleurs, récupération, focus, détente, sevrage THC…)
2. Niveau d’expérience CBD (débutant / intermédiaire / habitué)
3. Sensibilité au THC (zéro tolérance / <0,3 % / indifférent)
4. Format préféré (huile, fleurs, résine, gélules, vape…)
5. Budget ou fréquence (si pertinent)

🧪 LOGIQUE DE RECOMMANDATION PRODUIT
- Justifie chaque recommandation : pourquoi adapté, moment de la journée, ressenti attendu, ce qu'il ne faut pas attendre, alternative.
- QUANTITÉ : Demande TOUJOURS "Combien de grammes ?" ou la quantité souhaitée avant d'ajouter.
- CONFIRMATION : Demande toujours "Je l'ajoute au panier ?" avant de déclencher l'outil 'add_to_cart'.

� DOSAGE & UTILISATION (NON MÉDICAL)
- Donne uniquement des repères progressifs et une logique d’augmentation douce.
- Conseils d’observation personnelle. Exemple : “Commence bas, observe 3 jours, puis ajuste légèrement si nécessaire.”
- JAMAIS de chiffres médicaux ni de dosage thérapeutique.

�🛒 CONVERSION & E-COMMERCE (SOFT)
- Suggère des compléments cohérents ou qualité/origine.
- CTA doux : “Tu veux que je t’explique comment l’utiliser ?” ou “Souhaites-tu une alternative ?”

🔁 POST-ACHAT & FIDÉLISATION
- Si l'utilisateur revient après achat : demande un retour, ajuste si besoin, préviens la frustration.

🛑 GESTION DES DEMANDES INTERDITES
- Si question médicale ou illégale : Refuse calmement, explique pourquoi, redirige vers un usage bien-être autorisé.

⭐ STANDARD DE QUALITÉ FINAL
Clair, utile, honnête, personnalisé, conforme légalement. Si incertain → dis-le.
STRICTEMENT EN FRANÇAIS, LANGAGE NATUREL ET ORAL.
`;
    }, [products, userName, deliveryFee, deliveryFreeThreshold, savedPrefs]);

    const stopAllPlayback = useCallback(() => {
        activeSourcesRef.current.forEach(s => { try { s.stop(0); } catch { } });
        activeSourcesRef.current.clear();
    }, []);

    const cleanup = useCallback(() => {
        isManualCloseRef.current = true;
        if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
        stopAllPlayback();
        processorRef.current?.disconnect();
        processorRef.current = null;
        captureCtxRef.current?.close().catch(() => { });
        captureCtxRef.current = null;
        playbackCtxRef.current?.close().catch(() => { });
        playbackCtxRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        wsRef.current?.close();
        wsRef.current = null;
        scheduledUntilRef.current = 0;
        isSpeakingRef.current = false;
        isMutedRef.current = false;
        startInFlightRef.current = false;
        sessionIdRef.current += 1;
    }, [stopAllPlayback]);

    useEffect(() => cleanup, [cleanup]);

    const stopSession = useCallback(() => {
        cleanup();
        setVoiceState('idle');
        setIsMuted(false);
    }, [cleanup]);

    const playPcmChunk = useCallback((base64: string) => {
        if (!playbackCtxRef.current) return;
        const ctx = playbackCtxRef.current;
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

        const buffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
        buffer.copyToChannel(float32, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        const startAt = Math.max(ctx.currentTime + AUDIO_SCHEDULE_AHEAD_SEC, scheduledUntilRef.current);
        source.start(startAt);
        scheduledUntilRef.current = startAt + buffer.duration;
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
    }, []);

    const startMicCapture = useCallback(async (stream: MediaStream) => {
        const ctx = new AudioContext();
        captureCtxRef.current = ctx;
        await ctx.audioWorklet.addModule('/audio-processor.js');
        const source = ctx.createMediaStreamSource(stream);
        const worklet = new AudioWorkletNode(ctx, 'mic-processor');
        processorRef.current = worklet;
        worklet.port.onmessage = (e) => {
            if (wsRef.current?.readyState !== WebSocket.OPEN || isMutedRef.current) return;
            const down = downsampleBuffer(e.data, ctx.sampleRate, INPUT_SAMPLE_RATE);
            const pcm = float32ToInt16(down);
            wsRef.current.send(JSON.stringify({
                realtime_input: { media_chunks: [{ mime_type: 'audio/pcm;rate=16000', data: toBase64(new Uint8Array(pcm.buffer)) }] }
            }));
        };
        const silent = ctx.createGain();
        silent.gain.value = 0;
        source.connect(worklet);
        worklet.connect(silent);
        silent.connect(ctx.destination);
    }, []);

    const startSession = useCallback(async () => {
        if (startInFlightRef.current) return;
        cleanup();
        isManualCloseRef.current = false;
        const sid = sessionIdRef.current + 1;
        sessionIdRef.current = sid;
        if (compatibilityError) { setError(compatibilityError); setVoiceState('error'); return; }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) { setError('Missing API Key.'); setVoiceState('error'); return; }

        startInFlightRef.current = true;
        setVoiceState('connecting');
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ws = new WebSocket(`${WS_ENDPOINT}?key=${apiKey}`);
            wsRef.current = ws;

            ws.onopen = () => {
                if (sessionIdRef.current !== sid) return;
                ws.send(JSON.stringify({
                    setup: {
                        model: LIVE_MODEL,
                        generation_config: {
                            response_modalities: ['AUDIO'],
                            speech_config: { voice_config: { prebuilt_voice_config: { voice_name: 'Aoede' } } }
                        },
                        system_instruction: { parts: [{ text: buildSystemPrompt() }] },
                        tools: [{
                            function_declarations: [{
                                name: 'add_to_cart',
                                description: 'Ajouter au panier.',
                                parameters: {
                                    type: 'OBJECT',
                                    properties: {
                                        product_name: { type: 'STRING' },
                                        quantity: { type: 'NUMBER' }
                                    },
                                    required: ['product_name', 'quantity']
                                }
                            }]
                        }]
                    }
                }));
            };

            ws.onmessage = async (e) => {
                if (sessionIdRef.current !== sid) return;
                const raw = e.data instanceof Blob ? await e.data.text() : (e.data as string);
                const msg = JSON.parse(raw);

                if (msg.setup_complete || msg.setupComplete) {
                    setVoiceState('listening');
                    await startMicCapture(stream);
                    startInFlightRef.current = false;
                    playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
                }

                const setupTurn = () => {
                    scheduledUntilRef.current = playbackCtxRef.current?.currentTime ?? 0;
                    isSpeakingRef.current = false;
                    setVoiceState('listening');
                };

                const content = msg.server_content || msg.serverContent;
                if (content) {
                    if (content.interrupted) { stopAllPlayback(); setupTurn(); return; }
                    if (content.turn_complete || content.turnComplete) { setupTurn(); return; }
                    const model_turn = content.model_turn || content.modelTurn;
                    if (model_turn?.parts) {
                        for (const p of model_turn.parts) {
                            const data = p.inline_data?.data || p.inlineData?.data;
                            if (data) playPcmChunk(data);
                        }
                    }
                }

                const tool = msg.tool_call || msg.toolCall;
                if (tool) {
                    const calls = tool.function_calls || tool.functionCalls;
                    if (calls) {
                        const responses = [];
                        for (const c of calls) {
                            if (c.name === 'add_to_cart') {
                                const prodName = (c.args.product_name || '').toLowerCase();
                                const qty = Number(c.args.quantity) || 1;
                                const p = products.find(i => i.name.toLowerCase().includes(prodName) || prodName.includes(i.name.toLowerCase()));
                                if (p && onAddItem) {
                                    onAddItem(p, qty);
                                    responses.push({ name: c.name, id: c.id, response: { result: "OK" } });
                                } else {
                                    responses.push({ name: c.name, id: c.id, response: { error: "Non trouvé" } });
                                }
                            }
                        }
                        if (responses.length > 0) {
                            ws.send(JSON.stringify({ tool_response: { function_responses: responses } }));
                        }
                    }
                }
            };
        } catch (err) {
            setError('Erreur media.');
            setVoiceState('error');
            startInFlightRef.current = false;
        }
    }, [cleanup, buildSystemPrompt, startMicCapture, playPcmChunk, stopAllPlayback, compatibilityError, products, onAddItem]);

    const toggleMute = useCallback(() => {
        isMutedRef.current = !isMutedRef.current;
        setIsMuted(isMutedRef.current);
    }, []);

    const isSupported = useMemo(() => !compatibilityError, [compatibilityError]);

    return { voiceState, error, isMuted, isSupported, compatibilityError, startSession, stopSession, toggleMute };
}
