import { useState, useCallback, useRef } from 'react';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from './useBudTenderMemory';

// ─── Constants ───────────────────────────────────────────────────────────────

const WS_ENDPOINT =
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
const INPUT_SAMPLE_RATE = 16000; // Gemini Live API requires 16kHz PCM input
const OUTPUT_SAMPLE_RATE = 24000; // Gemini Live API outputs 24kHz PCM


// Minimal scheduling ahead — keeps playback tight without gaps
const AUDIO_SCHEDULE_AHEAD_SEC = 0.008;

// ─── Types ───────────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface VoiceUtterance {
    role: 'user' | 'assistant';
    text: string;
}

interface GeminiServerMessage {
    setupComplete?: boolean;
    goingAway?: boolean;
    serverContent?: {
        /** True when the model finishes its current turn */
        turnComplete?: boolean;
        /** True when the model has been interrupted by user speech */
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
}

interface Options {
    products: Product[];
    pastProducts?: PastProduct[];
    savedPrefs?: SavedPrefs | null;
    userName?: string | null;
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

export function useGeminiLiveVoice({ products, pastProducts = [], savedPrefs, userName }: Options) {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [transcript, setTranscript] = useState<VoiceUtterance[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    // All mutable session state lives in refs so audio callbacks always see current values
    const wsRef = useRef<WebSocket | null>(null);
    const captureCtxRef = useRef<AudioContext | null>(null);
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scheduledUntilRef = useRef<number>(0); // next available playback time
    const isSpeakingRef = useRef(false);
    const isMutedRef = useRef(false);

    // ── System prompt ────────────────────────────────────────────────────────

    const buildSystemPrompt = useCallback((): string => {
        const catalog = products
            .slice(0, 10) // cap to avoid token overflow
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

            // Add any other dynamic fields
            Object.entries(others).forEach(([key, val]) => {
                if (val) entries.push(`${key}: ${val}`);
            });

            prefsText = `CONTEXTE BIEN-ÊTRE DU CLIENT:\n- ${entries.join('\n- ')}`;
        }
        const history =
            pastProducts.length > 0
                ? `Achats récents: ${pastProducts.slice(0, 3).map(p => p.product_name).join(', ')}. `
                : '';

        return `
TU ES :
Le meilleur Budtender vocal de Green Moon CBD.
Un expert humain, pédagogue et crédible, comme en boutique physique.
Tu parles à voix haute : ton langage est ORAL, naturel et fluide.

${greeting}
${prefsText}
${history}

CATALOGUE DISPONIBLE (NE JAMAIS SORTIR DE CE CADRE) :
${catalog}

EXPERTISE PRODUITS :
- THCV : molécule stimulante orientée énergie, clarté mentale et contrôle de l’appétit. Utilisation plutôt en journée.
- THV-N10 : cannabinoïde nouvelle génération orienté détente profonde, lâcher-prise et relaxation mentale, sans effet planant type THC.
- Tu connais les synergies, dosages progressifs et profils utilisateurs.

RÈGLES ABSOLUES (OBLIGATOIRES) :
- Réponds UNIQUEMENT en français.
- Réponses ORALES, courtes et naturelles (1 à 2 phrases maximum).
- Jamais de listes, jamais de jargon médical.
- ZÉRO promesse thérapeutique (pas de soigner, traiter, guérir).
- Tu parles en bien-être, sensations, retours d’expérience.
- Propose UN SEUL produit à la fois.
- Uniquement des produits présents dans le catalogue ci-dessus.
- Si une info manque, pose UNE question simple et directe.
- Si l’utilisateur interrompt, tu t’arrêtes immédiatement.
- ANTICIPATION : Précède les besoins du client (ex: s'il choisit une fleur, propose brièvement le mode de consommation idéal ou le moment de la journée).

STRUCTURE MENTALE À RESPECTER À CHAQUE RÉPONSE :
1. Accusé de compréhension rapide
2. Recommandation OU question ciblée
3. Justification + ANTICIPATION (ex: "Idéal pour ta soirée, d'ailleurs tu as déjà de quoi le consommer ?")

EXEMPLES INTERNES (NE PAS AFFICHER) :
- “Dans ton cas, je partirais sur X, parce qu’il apporte une détente nette sans lourdeur. Tu comptes le consommer plutôt en infusion ou vaporisation ?”
- “C'est noté. Pour affiner, tu cherches plutôt un effet léger ou bien marqué ?”

OBJECTIF FINAL :
Guider le client vers le BON produit en anticipant ses besoins.
Être proactif comme un vrai vendeur expert, pas comme un chatbot passif.
`;
    }, [products, pastProducts, savedPrefs, userName]);

    // ── Audio playback ───────────────────────────────────────────────────────

    const getPlaybackCtx = useCallback((): AudioContext => {
        if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
            playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
        }
        // Resume if suspended (browser autoplay policy)
        if (playbackCtxRef.current.state === 'suspended') {
            playbackCtxRef.current.resume().catch(() => { });
        }
        return playbackCtxRef.current;
    }, []);

    /**
     * Immediately stop any queued audio playback.
     * Called when the server signals `interrupted`.
     */
    const interruptAudio = useCallback(() => {
        const ctx = playbackCtxRef.current;
        if (!ctx || ctx.state === 'closed') return;
        // Reset the scheduling pointer to now — future chunks start fresh
        scheduledUntilRef.current = ctx.currentTime;
        isSpeakingRef.current = false;
        setVoiceState('listening');
    }, []);

    /** Decode a base64-encoded PCM 16-bit 24kHz chunk and schedule it for gapless playback. */
    const playPcmChunk = useCallback(
        (base64Data: string) => {
            try {
                const ctx = getPlaybackCtx();
                const binary = atob(base64Data);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

                // PCM Int16 → Float32
                const int16 = new Int16Array(bytes.buffer);
                const float32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

                // Create buffer — AudioContext handles resampling automatically
                const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
                audioBuffer.copyToChannel(float32, 0);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);

                // Schedule contiguously for gapless output, minimal ahead time for low latency
                const now = ctx.currentTime;
                const startAt = Math.max(now + AUDIO_SCHEDULE_AHEAD_SEC, scheduledUntilRef.current);
                source.start(startAt);
                scheduledUntilRef.current = startAt + audioBuffer.duration;

                isSpeakingRef.current = true;
                setVoiceState('speaking');

                source.onended = () => {
                    // Only transition back when the queue is truly empty
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

    /**
     * Start mic capture using AudioWorkletNode (replaces deprecated ScriptProcessorNode).
     *
     * AudioWorklet runs on the audio rendering thread (separate from the main JS thread),
     * which gives lower and more stable latency (~2.7ms per 128-sample block at 48kHz).
     *
     * The mic stays active even when the AI is speaking so Gemini's server-side
     * VAD can detect user speech and trigger interruption automatically.
     */
    const startMicCapture = useCallback(async (stream: MediaStream) => {
        const ctx = new AudioContext();
        captureCtxRef.current = ctx;
        const nativeRate = ctx.sampleRate;

        // Load the AudioWorklet processor module from the public folder
        await ctx.audioWorklet.addModule('/audio-processor.js');

        const source = ctx.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(ctx, 'mic-processor');
        processorRef.current = workletNode;

        // Receive Float32 chunks from the worklet thread
        workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
            if (wsRef.current?.readyState !== WebSocket.OPEN) return;
            // Only skip when manually muted — keep mic open when AI speaks
            // so the server VAD can trigger interruption naturally
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

        // Connect: mic → worklet → silent gain (no audio to speakers)
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        source.connect(workletNode);
        workletNode.connect(silentGain);
        silentGain.connect(ctx.destination);
    }, []);

    // ── Session lifecycle ────────────────────────────────────────────────────

    const cleanup = useCallback(() => {
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
    }, []);

    const stopSession = useCallback(() => {
        cleanup();
        setVoiceState('idle');
        setIsMuted(false);
    }, [cleanup]);

    const startSession = useCallback(async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
        if (!apiKey) {
            setError('Clé API Gemini manquante. Ajoutez VITE_GEMINI_API_KEY dans votre fichier .env');
            setVoiceState('error');
            return;
        }

        setVoiceState('connecting');
        setTranscript([]);
        setError(null);
        scheduledUntilRef.current = 0;
        isMutedRef.current = false;
        setIsMuted(false);

        // Request microphone
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
            return;
        }

        // Open WebSocket
        const ws = new WebSocket(`${WS_ENDPOINT}?key=${apiKey}`);
        wsRef.current = ws;

        ws.onopen = () => {
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
                    },
                })
            );
        };

        ws.onmessage = async (event) => {
            try {
                // Gemini Live API sends WebSocket frames as Blobs (binary), not plain strings.
                const raw: string =
                    event.data instanceof Blob ? await event.data.text() : (event.data as string);
                const msg = JSON.parse(raw) as GeminiServerMessage;

                if (msg.setupComplete) {
                    setVoiceState('listening');
                    await startMicCapture(stream);
                    return;
                }

                if (msg.goingAway) {
                    cleanup();
                    setVoiceState('idle');
                    return;
                }

                const sc = msg.serverContent;
                if (!sc) return;

                // ── Interruption: server detected user speaking over the AI
                if (sc.interrupted) {
                    interruptAudio();
                    // Add visual marker in transcript
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.role === 'assistant' && !last.text.endsWith('…')) {
                            return [...prev.slice(0, -1), { role: 'assistant', text: last.text + ' …' }];
                        }
                        return prev;
                    });
                    return;
                }

                // ── End of AI turn: model finished speaking
                if (sc.turnComplete) {
                    scheduledUntilRef.current = playbackCtxRef.current?.currentTime ?? 0;
                    isSpeakingRef.current = false;
                    setVoiceState('listening');
                    return;
                }

                // ── Audio and text parts from the model
                if (sc.modelTurn?.parts) {
                    for (const part of sc.modelTurn.parts) {
                        if (part.inlineData?.data && part.inlineData.mimeType.includes('audio')) {
                            playPcmChunk(part.inlineData.data);
                        }
                        // Text transcript of AI response (some model variants include this)
                        if (part.text?.trim()) {
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.role === 'assistant') {
                                    return [...prev.slice(0, -1), { role: 'assistant', text: last.text + part.text }];
                                }
                                return [...prev, { role: 'assistant', text: part.text!.trim() }];
                            });
                        }
                    }
                }

                // ── What the user said (speech → text by VAD)
                const inputText = sc.inputTranscription?.text;
                if (inputText?.trim()) {
                    setTranscript(prev => {
                        // If the transcription is final, push a new utterance; otherwise update the last user line
                        const last = prev[prev.length - 1];
                        if (last?.role === 'user' && sc.inputTranscription?.final !== true) {
                            // Live partial update
                            return [...prev.slice(0, -1), { role: 'user', text: inputText.trim() }];
                        }
                        return [...prev, { role: 'user', text: inputText.trim() }];
                    });
                }

                // ── Alternative AI output transcription field
                const outputText = sc.outputTranscription?.text;
                if (outputText?.trim()) {
                    setTranscript(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.role === 'assistant') {
                            return [...prev.slice(0, -1), { role: 'assistant', text: last.text + outputText }];
                        }
                        return [...prev, { role: 'assistant', text: outputText.trim() }];
                    });
                }
            } catch (e) {
                if (import.meta.env.DEV) console.error('[VoiceAdvisor] WS message error:', e);
            }
        };

        ws.onerror = () => {
            setError('Erreur de connexion WebSocket. Vérifiez votre clé API Gemini et votre connexion internet.');
            setVoiceState('error');
            cleanup();
        };

        ws.onclose = (e) => {
            // 1000 = normal closure (we closed it), anything else is unexpected
            if (e.code !== 1000) {
                setVoiceState('idle');
            }
        };
    }, [buildSystemPrompt, startMicCapture, playPcmChunk, interruptAudio, cleanup]);

    const toggleMute = useCallback(() => {
        isMutedRef.current = !isMutedRef.current;
        setIsMuted(m => !m);
    }, []);

    return { voiceState, transcript, error, isMuted, startSession, stopSession, toggleMute };
}
