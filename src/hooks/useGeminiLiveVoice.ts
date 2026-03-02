import { useState, useCallback, useRef } from 'react';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from './useBudTenderMemory';

// ─── Constants ───────────────────────────────────────────────────────────────

const WS_ENDPOINT =
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
const INPUT_SAMPLE_RATE = 16000; // Gemini Live API requires 16kHz PCM input
const OUTPUT_SAMPLE_RATE = 24000; // Gemini Live API outputs 24kHz PCM

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
        modelTurn?: {
            parts?: Array<{
                inlineData?: { mimeType: string; data: string };
                text?: string;
            }>;
        };
        inputTranscription?: { text?: string };
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
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scheduledUntilRef = useRef<number>(0); // next available playback time
    const isSpeakingRef = useRef(false);
    const isMutedRef = useRef(false);

    // ── System prompt ────────────────────────────────────────────────────────

    const buildSystemPrompt = useCallback((): string => {
        const catalog = products
            .slice(0, 25) // cap to avoid token overflow
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
        const prefs = savedPrefs
            ? `CONTEXTE BIEN-ÊTRE DU CLIENT:
- Objectif: ${savedPrefs.goal}
- Expérience: ${savedPrefs.experience}
- Format préféré: ${savedPrefs.format}
- Budget: ${savedPrefs.budget}
- Âge: ${savedPrefs.age ?? 'Non précisé'}
- Intensité recherchée: ${savedPrefs.intensity ?? 'Non précisé'}
- Arômes/Terpènes préférés: ${Array.isArray(savedPrefs.terpenes) ? savedPrefs.terpenes.join(', ') : 'Aucun spécifique'}
`
            : 'Le client n\'a pas encore défini de préférences de profil.';
        const history =
            pastProducts.length > 0
                ? `Achats récents: ${pastProducts.slice(0, 3).map(p => p.product_name).join(', ')}. `
                : '';

        return `Tu es l'Expert BudTender n°1 chez Green Moon CBD Paris, spécialiste mondial du THCV et du THV-N10. Tu réponds en VOCAL — ultra-direct, naturel et percutant.
${greeting}${prefs}${history}
CATALOGUE GREEN MOON:
${catalog}

EXPERTISE THCV & N10:
- THCV : Molécule de l'énergie, focus intense, et effet coupe-faim (surnommé "Diet Weed"). Parfait pour la journée.
- THV-N10 : Nouvelle génération pour une relaxation profonde, anti-stress, sans les effets négatifs du THC.
- Tu maîtrises les dosages et les synergies entre ces molécules.

RÈGLES D'OR POUR LE VOCAL:
- Réponds UNIQUEMENT en français.
- Réponses TRÈS COURTES (1 à 2 phrases max). C'est une conversation fluide, pas un monologue.
- Ton : Expert passionné, dynamique et précis.
- Propose UNIQUEMENT des produits présents dans le catalogue ci-dessus.
- Pas de promesses thérapeutiques illégales, reste dans le cadre du bien-être.
- Pose une question courte si tu as besoin de plus de détails sur le besoin du client.`;
    }, [products, pastProducts, savedPrefs, userName]);

    // ── Audio playback ───────────────────────────────────────────────────────

    const getPlaybackCtx = useCallback((): AudioContext => {
        if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
            playbackCtxRef.current = new AudioContext();
        }
        return playbackCtxRef.current;
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

                // Create buffer at 24kHz — AudioContext handles resampling automatically
                const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
                audioBuffer.copyToChannel(float32, 0);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);

                // Schedule contiguously for gapless output
                const startAt = Math.max(ctx.currentTime + 0.04, scheduledUntilRef.current);
                source.start(startAt);
                scheduledUntilRef.current = startAt + audioBuffer.duration;

                isSpeakingRef.current = true;
                setVoiceState('speaking');

                source.onended = () => {
                    // Only transition back when the queue is truly empty
                    if (ctx.currentTime >= scheduledUntilRef.current - 0.1) {
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
     * Start mic capture using ScriptProcessorNode.
     * Captures at the browser's native rate, downsamples to 16kHz, and streams
     * base64-encoded PCM chunks over the WebSocket.
     *
     * Note: ScriptProcessorNode is deprecated; migrate to AudioWorklet for future-proofing.
     */
    const startMicCapture = useCallback((stream: MediaStream) => {
        const ctx = new AudioContext();
        captureCtxRef.current = ctx;
        const nativeRate = ctx.sampleRate;

        const source = ctx.createMediaStreamSource(stream);

        // eslint-disable-next-line @typescript-eslint/no-deprecated
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
            if (wsRef.current?.readyState !== WebSocket.OPEN) return;
            // Don't send mic while muted or AI is speaking (avoids echo feedback)
            if (isMutedRef.current || isSpeakingRef.current) return;

            const raw = e.inputBuffer.getChannelData(0);
            const downsampled = downsampleBuffer(raw, nativeRate, INPUT_SAMPLE_RATE);
            const pcm16 = float32ToInt16(downsampled);
            const b64 = toBase64(new Uint8Array(pcm16.buffer));

            wsRef.current.send(
                JSON.stringify({
                    realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: b64 }] },
                })
            );
        };

        // Connect through a silent gain to keep the node in the graph without
        // feeding mic audio back to the speakers
        const silentGain = ctx.createGain();
        silentGain.gain.value = 0;
        source.connect(processor);
        processor.connect(silentGain);
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
                    startMicCapture(stream);
                    return;
                }

                if (msg.goingAway) {
                    cleanup();
                    setVoiceState('idle');
                    return;
                }

                // Audio and text parts from the model
                if (msg.serverContent?.modelTurn?.parts) {
                    for (const part of msg.serverContent.modelTurn.parts) {
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

                // What the user said (speech → text by VAD)
                const inputText = msg.serverContent?.inputTranscription?.text;
                if (inputText?.trim()) {
                    setTranscript(prev => [...prev, { role: 'user', text: inputText.trim() }]);
                }

                // Alternative AI output transcription field
                const outputText = msg.serverContent?.outputTranscription?.text;
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
    }, [buildSystemPrompt, startMicCapture, playPcmChunk, cleanup]);

    const toggleMute = useCallback(() => {
        isMutedRef.current = !isMutedRef.current;
        setIsMuted(m => !m);
    }, []);

    return { voiceState, transcript, error, isMuted, startSession, stopSession, toggleMute };
}
