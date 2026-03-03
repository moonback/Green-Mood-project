import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from './useBudTenderMemory';
import { supabase } from '../lib/supabase';
import { generateEmbedding } from '../lib/embeddings';
import { getVoicePrompt } from '../lib/budtenderPrompts';

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
    onCloseSession?: () => void;
    onViewProduct?: (product: Product) => void;
    onNavigate?: (path: string) => void;
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
    deliveryFreeThreshold = 50,
    onCloseSession,
    onViewProduct,
    onNavigate
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

    // Stable refs — avoids recreating startSession when these change
    const productsRef = useRef(products);
    productsRef.current = products;
    const onAddItemRef = useRef(onAddItem);
    onAddItemRef.current = onAddItem;
    const onCloseSessionRef = useRef(onCloseSession);
    onCloseSessionRef.current = onCloseSession;
    const onViewProductRef = useRef(onViewProduct);
    onViewProductRef.current = onViewProduct;
    const onNavigateRef = useRef(onNavigate);
    onNavigateRef.current = onNavigate;

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
    const searchResultsRef = useRef<Product[]>([]);

    const buildSystemPrompt = useCallback((): string => {
        return getVoicePrompt(
            productsRef.current,
            savedPrefs,
            userName,
            pastProducts,
            deliveryFee,
            deliveryFreeThreshold
        );
    }, [userName, deliveryFee, deliveryFreeThreshold, savedPrefs, pastProducts]);

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
        searchResultsRef.current = [];
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
                            response_modalities: ['audio'],
                            speech_config: { voice_config: { prebuilt_voice_config: { voice_name: 'Puck' } } }
                        },
                        system_instruction: { parts: [{ text: buildSystemPrompt() }] },
                        tools: [{
                            function_declarations: [
                                {
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
                                },
                                {
                                    name: 'search_catalog',
                                    description: 'Rechercher des produits dans l\'intégralité du catalogue par mots-clés, effets ou arômes.',
                                    parameters: {
                                        type: 'OBJECT',
                                        properties: {
                                            query: { type: 'STRING', description: 'Le besoin du client (ex: "sommeil profond", "fleur fruitée", "budget serré")' }
                                        },
                                        required: ['query']
                                    }
                                },
                                {
                                    name: 'close_session',
                                    description: 'Terminer la discussion et fermer la fenêtre vocale (à utiliser après avoir dit au revoir).',
                                    parameters: { type: 'OBJECT', properties: {} }
                                },
                                {
                                    name: 'view_product',
                                    description: 'Ouvrir la fiche détaillée d\'un produit pour que le client puisse voir les images et détails.',
                                    parameters: {
                                        type: 'OBJECT',
                                        properties: {
                                            product_name: { type: 'STRING', description: 'Le nom du produit à afficher' }
                                        },
                                        required: ['product_name']
                                    }
                                },
                                {
                                    name: 'navigate_to',
                                    description: 'Naviguer vers une page spécifique du site.',
                                    parameters: {
                                        type: 'OBJECT',
                                        properties: {
                                            page: {
                                                type: 'STRING',
                                                description: 'La destination (home, shop, products, quality, contact, account, cart, catalog)'
                                            }
                                        },
                                        required: ['page']
                                    }
                                }
                            ]
                        }]
                    }
                }));

                // Auto-cancel if setup doesn't confirm in 10s
                setupTimeoutRef.current = window.setTimeout(() => {
                    if (sessionIdRef.current === sid && voiceState === 'connecting') {
                        setError('Délai de connexion dépassé.');
                        stopSession();
                    }
                }, CONNECTION_TIMEOUT_MS);
            };

            ws.onerror = (e) => {
                if (sessionIdRef.current !== sid) return;
                console.error("WS Error:", e);
                setError('Erreur de connexion Live.');
                setVoiceState('error');
                startInFlightRef.current = false;
            };

            ws.onclose = (e) => {
                if (sessionIdRef.current !== sid || isManualCloseRef.current) return;
                console.log("WS Closed:", e.code, e.reason);
                if (e.code !== 1000) {
                    setError(`Session interrompue (${e.code}).`);
                    setVoiceState('error');
                } else {
                    stopSession();
                }
                startInFlightRef.current = false;
            };

            ws.onmessage = async (e) => {
                if (sessionIdRef.current !== sid) return;
                const raw = e.data instanceof Blob ? await e.data.text() : (e.data as string);
                const msg = JSON.parse(raw);

                if (msg.setup_complete || msg.setupComplete) {
                    if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
                    console.info("Gemini Live: Setup Complete");
                    setVoiceState('listening');
                    await startMicCapture(stream);
                    startInFlightRef.current = false;

                    // Initialize audio context for playback
                    playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });

                    // Auto-trigger first greeting
                    ws.send(JSON.stringify({
                        client_content: {
                            turns: [{ role: 'user', parts: [{ text: "Bonjour" }] }],
                            turn_complete: true
                        }
                    }));
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
                        const responses = await Promise.all(calls.map(async (c) => {
                            if (c.name === 'add_to_cart') {
                                const prodName = (c.args.product_name || '').trim();
                                const qty = Number(c.args.quantity) || 1;
                                const prodNameLower = prodName.toLowerCase();

                                console.info(`[Voice] add_to_cart called: "${prodName}" x${qty}`);

                                // Search in both initial products AND search results
                                const allKnown = [
                                    ...productsRef.current,
                                    ...searchResultsRef.current
                                ];

                                // 1) Exact name match
                                let p = allKnown.find(i => i.name.toLowerCase() === prodNameLower);

                                // 2) Partial includes (bidirectional)
                                if (!p) {
                                    p = allKnown.find(i =>
                                        i.name.toLowerCase().includes(prodNameLower) ||
                                        prodNameLower.includes(i.name.toLowerCase())
                                    );
                                }

                                // 3) Word-level fuzzy: all words of query appear in product name
                                if (!p) {
                                    const words = prodNameLower.split(/\s+/).filter(w => w.length > 2);
                                    p = allKnown.find(i => {
                                        const nameLow = i.name.toLowerCase();
                                        return words.length > 0 && words.every(w => nameLow.includes(w));
                                    });
                                }

                                // 4) Reverse: all words of product name appear in query
                                if (!p) {
                                    p = allKnown.find(i => {
                                        const nameParts = i.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                                        return nameParts.length > 0 && nameParts.every(w => prodNameLower.includes(w));
                                    });
                                }

                                // 5) Last resort: Supabase text search
                                if (!p) {
                                    console.warn(`[Voice] Product not found locally: "${prodName}", trying Supabase…`);
                                    try {
                                        const { data } = await supabase
                                            .from('products')
                                            .select('*, category:categories(slug, name)')
                                            .ilike('name', `%${prodName}%`)
                                            .eq('is_active', true)
                                            .limit(1)
                                            .maybeSingle();
                                        if (data) p = data as Product;
                                    } catch (e) {
                                        console.error('[Voice] Supabase fallback failed:', e);
                                    }
                                }

                                if (p && onAddItemRef.current) {
                                    console.info(`[Voice] ✅ Adding to cart: "${p.name}" x${qty}`);
                                    onAddItemRef.current(p, qty);
                                    return { name: c.name, id: c.id, response: { result: `OK — ${p.name} x${qty} ajouté au panier` } };
                                } else {
                                    console.warn(`[Voice] ❌ Product NOT found: "${prodName}"`);
                                    return { name: c.name, id: c.id, response: { error: `Produit "${prodName}" non trouvé dans le catalogue. Vérifie le nom exact.` } };
                                }
                            }

                            if (c.name === 'close_session') {
                                console.info('[Voice] close_session called by AI');
                                setTimeout(() => {
                                    stopSession();
                                    if (onCloseSessionRef.current) onCloseSessionRef.current();
                                }, 1500); // Small delay so the user hears the final words
                                return { name: c.name, id: c.id, response: { result: "OK — Session en cours de fermeture" } };
                            }

                            if (c.name === 'view_product') {
                                const prodName = (c.args.product_name || '').trim();
                                const prodNameLower = prodName.toLowerCase();
                                console.info(`[Voice] view_product called: "${prodName}"`);

                                const allKnown = [...productsRef.current, ...searchResultsRef.current];
                                let p = allKnown.find(i => i.name.toLowerCase() === prodNameLower);

                                if (!p) {
                                    p = allKnown.find(i =>
                                        i.name.toLowerCase().includes(prodNameLower) ||
                                        prodNameLower.includes(i.name.toLowerCase())
                                    );
                                }

                                if (!p) {
                                    const words = prodNameLower.split(/\s+/).filter(w => w.length > 2);
                                    p = allKnown.find(i => words.length > 0 && words.every(w => i.name.toLowerCase().includes(w)));
                                }

                                if (p && onViewProductRef.current) {
                                    console.info(`[Voice] ✅ Viewing product: "${p.name}"`);
                                    onViewProductRef.current(p);
                                    return { name: c.name, id: c.id, response: { result: `OK — Fiche de "${p.name}" affichée` } };
                                } else {
                                    console.warn(`[Voice] ❌ Product NOT found for viewing: "${prodName}"`);
                                    return { name: c.name, id: c.id, response: { error: `Produit "${prodName}" non trouvé.` } };
                                }
                            }

                            if (c.name === 'navigate_to') {
                                const page = (c.args.page || '').toLowerCase();
                                const mapping: Record<string, string> = {
                                    'home': '/',
                                    'shop': '/boutique',
                                    'products': '/produits',
                                    'quality': '/qualite',
                                    'contact': '/contact',
                                    'account': '/compte',
                                    'cart': '/panier',
                                    'catalog': '/catalogue'
                                };

                                const path = mapping[page];
                                if (path && onNavigateRef.current) {
                                    console.info(`[Voice] ✅ Navigating to: ${page} -> ${path}`);
                                    onNavigateRef.current(path);
                                    return { name: c.name, id: c.id, response: { result: `Navigation vers ${page} effectuée.` } };
                                } else {
                                    console.warn(`[Voice] ❌ Page non reconnue: ${page}`);
                                    return { name: c.name, id: c.id, response: { error: `La page "${page}" n'existe pas.` } };
                                }
                            }

                            if (c.name === 'search_catalog') {
                                const query = c.args.query;
                                try {
                                    console.info(`[Voice] search_catalog: "${query}"`);
                                    const embedding = await generateEmbedding(query);
                                    const { data, error: rpcError } = await supabase.rpc('match_products', {
                                        query_embedding: embedding,
                                        match_threshold: 0.1,
                                        match_count: 10
                                    });

                                    if (rpcError) throw rpcError;

                                    // Store search results for subsequent add_to_cart calls
                                    if (data && data.length > 0) {
                                        searchResultsRef.current = data as Product[];
                                        console.info(`[Voice] search_catalog found ${data.length} results, stored for add_to_cart`);
                                    }

                                    const results = (data as any[]).map(p =>
                                        `• ${p.name} | ${p.price}€ | CBD ${p.cbd_percentage}% | ${p.description}`
                                    ).join('\n');

                                    return {
                                        name: c.name,
                                        id: c.id,
                                        response: {
                                            results,
                                            note: "Ce sont les produits les plus pertinents du catalogue complet."
                                        }
                                    };
                                } catch (e) {
                                    console.error("[Voice] Search Tool Error:", e);
                                    return { name: c.name, id: c.id, response: { error: "Erreur technique lors de la recherche" } };
                                }
                            }
                            return null;
                        }));

                        const filteredResponses = responses.filter(Boolean);
                        if (filteredResponses.length > 0) {
                            ws.send(JSON.stringify({
                                tool_response: { function_responses: filteredResponses }
                            }));
                        }
                    }
                }
            };
        } catch (err) {
            setError('Erreur media.');
            setVoiceState('error');
            startInFlightRef.current = false;
        }
    }, [cleanup, buildSystemPrompt, startMicCapture, playPcmChunk, stopAllPlayback, compatibilityError]);

    const toggleMute = useCallback(() => {
        isMutedRef.current = !isMutedRef.current;
        setIsMuted(isMutedRef.current);
    }, []);

    const isSupported = useMemo(() => !compatibilityError, [compatibilityError]);

    return { voiceState, error, isMuted, isSupported, compatibilityError, startSession, stopSession, toggleMute };
}
