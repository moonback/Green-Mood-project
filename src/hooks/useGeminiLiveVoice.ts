import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { GoogleGenAI, Modality, type FunctionResponse, type LiveServerMessage, type Session } from '@google/genai';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from './useBudTenderMemory';
import { supabase } from '../lib/supabase';
import { generateEmbedding } from '../lib/embeddings';
import { getVoicePrompt } from '../lib/budtenderPrompts';

const LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// ── Timeouts & retry policy ──────────────────────────────────────────────────
const CONNECTION_TIMEOUT_MS = 18000;   // 18s — generous for slow mobile connections
const AUDIO_SCHEDULE_AHEAD_SEC = 0.008;
const MAX_AUTO_RETRIES = 2;           // Retry up to 2 times on non-intentional closes
const RETRY_DELAY_MS = 2000;          // Wait 2s between retries

// WebSocket close codes that are NOT worth retrying (user closed, server clean close, auth)
const NON_RETRYABLE_CODES = new Set([1000, 1001, 4000, 4001, 4003, 4008]);

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

interface Options {
  products: Product[];
  pastProducts?: PastProduct[];
  savedPrefs?: SavedPrefs | null;
  userName?: string | null;
  cartItems?: any[];
  onAddItem?: (product: Product, quantity: number) => void;
  deliveryFee?: number;
  deliveryFreeThreshold?: number;
  onCloseSession?: () => void;
  onViewProduct?: (product: Product) => void;
  onNavigate?: (path: string) => void;
}

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

/**
 * Maps browser MediaDevices/WebSocket errors to user-friendly French messages.
 */
function classifyError(err: unknown): string {
  if (err instanceof Error) {
    const name = err.name;
    const msg = err.message.toLowerCase();
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Accès au microphone refusé. Veuillez l\'autoriser dans les paramètres du navigateur.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'Aucun microphone détecté sur cet appareil.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'Microphone déjà utilisé par une autre application.';
    }
    if (name === 'OverconstrainedError') {
      return 'Configuration audio non supportée par ce microphone.';
    }
    if (msg.includes('timeout') || msg.includes('délai')) {
      return 'Délai de connexion dépassé. Vérifiez votre connexion internet.';
    }
    if (msg.includes('network') || msg.includes('réseau') || msg.includes('failed to fetch')) {
      return 'Problème réseau. Vérifiez votre connexion internet.';
    }
    if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('403')) {
      return 'Clé API invalide ou expirée.';
    }
  }
  return 'Erreur de connexion. Appuyez sur "Réessayer".';
}

export function useGeminiLiveVoice({
  products,
  pastProducts = [],
  savedPrefs,
  userName,
  cartItems = [],
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

  const sessionRef = useRef<Session | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scheduledUntilRef = useRef<number>(0);
  const isMutedRef = useRef(false);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const interruptedRef = useRef(false);
  const setupTimeoutRef = useRef<number | null>(null);
  const startInFlightRef = useRef(false);
  const sessionIdRef = useRef(0);
  const isManualCloseRef = useRef(false);
  const canStreamInputRef = useRef(false);
  const searchResultsRef = useRef<Product[]>([]);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);

  // ── Unified product lookup with 4 fallback levels ────────────────────────
  // Level 1: exact name match
  // Level 2: one name contains the other (substring)
  // Level 3: ALL words of the query appear somewhere in the product name
  // Level 4: Supabase ilike fallback (catches typos, accent differences, etc.)
  // This runs in both add_to_cart and view_product so neither fails on first call.
  const findProduct = useCallback(async (prodName: string): Promise<Product | undefined> => {
    const q = prodName.toLowerCase().trim();
    const allKnown = [...productsRef.current, ...searchResultsRef.current];

    // L1 – exact
    let found = allKnown.find(i => i.name.toLowerCase() === q);
    if (found) return found;

    // L2 – substring (either direction)
    found = allKnown.find(i => i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase()));
    if (found) return found;

    // L3 – ALL words present (min length 1 to catch short words like "OG", "CB")
    const words = q.split(/\s+/).filter(w => w.length > 1);
    if (words.length > 0) {
      found = allKnown.find(i => words.every(w => i.name.toLowerCase().includes(w)));
      if (found) return found;

      // L3b – ANY word present (looser)
      found = allKnown.find(i => words.some(w => i.name.toLowerCase().includes(w)));
      if (found) return found;
    }

    // L4 – Supabase ilike (last resort, handles accent differences & typos)
    try {
      // Try exact name first, then a broader search
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(slug, name)')
        .ilike('name', `%${prodName}%`)
        .eq('is_active', true)
        .limit(3);
      if (data && data.length > 0) {
        // Pick the closest match by name length proximity
        const sorted = [...data].sort((a, b) =>
          Math.abs(a.name.length - prodName.length) - Math.abs(b.name.length - prodName.length)
        );
        return sorted[0] as Product;
      }
    } catch (e) {
      console.error('[Voice] Supabase product lookup failed:', e);
    }

    return undefined;
  }, []);

  const canSendRealtimeInput = useCallback(() => {
    if (!sessionRef.current || !canStreamInputRef.current || isManualCloseRef.current) return false;
    const ws = (sessionRef.current as any)?._ws;
    if (!ws || typeof ws.readyState !== 'number') return true;
    return typeof WebSocket === 'undefined' || ws.readyState === WebSocket.OPEN;
  }, []);

  const buildSystemPrompt = useCallback((): string => {
    return getVoicePrompt(productsRef.current, savedPrefs, userName, pastProducts, deliveryFee, deliveryFreeThreshold, cartItems);
  }, [userName, deliveryFee, deliveryFreeThreshold, savedPrefs, pastProducts, cartItems]);

  const stopAllPlayback = useCallback(() => {
    interruptedRef.current = true;
    activeSourcesRef.current.forEach(s => {
      try {
        s.disconnect();
        s.stop(0);
      } catch { }
    });
    activeSourcesRef.current.clear();
    // Reset the scheduling timeline so future chunks don't play at stale offsets
    scheduledUntilRef.current = 0;
  }, []);

  const cleanup = useCallback(() => {
    isManualCloseRef.current = true;
    canStreamInputRef.current = false;

    // Cancel any pending retry
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    (sessionRef.current as any)?._ws?.close?.();
    sessionRef.current?.close();
    sessionRef.current = null;

    if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
    stopAllPlayback();
    if (processorRef.current) processorRef.current.port.onmessage = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    captureCtxRef.current?.close().catch(() => { });
    captureCtxRef.current = null;
    playbackCtxRef.current?.close().catch(() => { });
    playbackCtxRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    scheduledUntilRef.current = 0;
    isMutedRef.current = false;
    interruptedRef.current = false;
    startInFlightRef.current = false;
    sessionIdRef.current += 1;
    searchResultsRef.current = [];
  }, [stopAllPlayback]);


  useEffect(() => cleanup, [cleanup]);

  const stopSession = useCallback(() => {
    retryCountRef.current = 0;
    cleanup();
    setVoiceState('idle');
    setIsMuted(false);
  }, [cleanup]);

  const playPcmChunk = useCallback((base64: string) => {
    // Guard: discard any audio chunks that arrive after an interruption
    if (interruptedRef.current) return;
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
    setVoiceState('speaking');
    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (!interruptedRef.current && ctx.currentTime >= scheduledUntilRef.current - 0.05) {
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
      if (isMutedRef.current || !canSendRealtimeInput()) return;

      try {
        const down = downsampleBuffer(e.data, ctx.sampleRate, INPUT_SAMPLE_RATE);
        const pcm = float32ToInt16(down);

        sessionRef.current?.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm',
            data: toBase64(new Uint8Array(pcm.buffer))
          }
        });
      } catch (err: any) {
        // Silently catch socket closed/closing errors during teardown
        if (err?.message?.includes('CLOSED') || err?.message?.includes('CLOSING')) {
          return;
        }
        console.warn('[Voice] Mic capture error:', err);
      }
    };

    const silent = ctx.createGain();
    silent.gain.value = 0;
    source.connect(worklet);
    worklet.connect(silent);
    silent.connect(ctx.destination);
  }, [canSendRealtimeInput]);

  // Forward declaration so startSession can call itself for retry
  const startSessionRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const startSession = useCallback(async () => {
    if (startInFlightRef.current) return;
    cleanup();
    isManualCloseRef.current = false;
    const sid = sessionIdRef.current + 1;
    sessionIdRef.current = sid;

    if (compatibilityError) {
      setError(compatibilityError);
      setVoiceState('error');
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Clé API Gemini manquante (VITE_GEMINI_API_KEY).');
      setVoiceState('error');
      return;
    }

    startInFlightRef.current = true;
    setVoiceState('connecting');
    setError(null);

    // ── Connection timeout ────────────────────────────────────────────────────
    setupTimeoutRef.current = window.setTimeout(() => {
      if (sessionIdRef.current === sid && startInFlightRef.current) {
        console.warn('[Voice] Connection timeout after', CONNECTION_TIMEOUT_MS, 'ms');
        setError('Délai de connexion dépassé. Vérifiez votre connexion internet.');
        stopSession();
      }
    }, CONNECTION_TIMEOUT_MS);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ai = new GoogleGenAI({ apiKey });

      const session = await ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
          tools: [{
            functionDeclarations: [
              {
                name: 'add_to_cart',
                description: 'Ajouter un ou plusieurs produits au panier. Précisez soit la quantité d\'unités (ex: 4 fois), soit le poids total en grammes (ex: 10 grammes).',
                parametersJsonSchema: {
                  type: 'object',
                  properties: {
                    product_name: { type: 'string', description: 'Le nom du produit à ajouter.' },
                    quantity: { type: 'number', description: 'Nombre d\'unités (ex: 4 pour quatre fois).' },
                    weight_grams: { type: 'number', description: 'Poids total en grammes souhaité (ex: 10 pour 10 grammes).' }
                  },
                  required: ['product_name']
                }
              },
              {
                name: 'search_catalog',
                description: 'Rechercher des produits dans l\'intégralité du catalogue par mots-clés, effets ou arômes.',
                parametersJsonSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Le besoin du client (ex: "sommeil profond", "fleur fruitée", "budget serré")' }
                  },
                  required: ['query']
                }
              },
              {
                name: 'close_session',
                description: 'Terminer la discussion et fermer la fenêtre vocale (à utiliser après avoir dit au revoir).',
                parametersJsonSchema: { type: 'object', properties: {} }
              },
              {
                name: 'view_product',
                description: 'Ouvrir la fiche détaillée d\'un produit pour que le client puisse voir les images et détails.',
                parametersJsonSchema: {
                  type: 'object',
                  properties: {
                    product_name: { type: 'string', description: 'Le nom du produit à afficher' }
                  },
                  required: ['product_name']
                }
              },
              {
                name: 'navigate_to',
                description: 'Naviguer vers une page spécifique du site.',
                parametersJsonSchema: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'string',
                      description: 'La destination (home, shop, products, quality, contact, account, cart, catalog)'
                    }
                  },
                  required: ['page']
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: async () => {
            if (sessionIdRef.current !== sid) return;
            if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
            canStreamInputRef.current = true;
            retryCountRef.current = 0; // Reset retry count on successful connection
            console.info('[Voice] Gemini Live: Setup Complete');
            setVoiceState('listening');
            await startMicCapture(stream);
            startInFlightRef.current = false;
            playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
            sessionRef.current?.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: 'Bonjour' }] }],
              turnComplete: true
            });
          },
          onerror: (e: ErrorEvent) => {
            if (sessionIdRef.current !== sid) return;
            canStreamInputRef.current = false;
            console.error('[Voice] Live Error:', e);
            // onerror is always followed by onclose, so we let onclose handle retry logic
            startInFlightRef.current = false;
          },
          onclose: (e: CloseEvent) => {
            if (sessionIdRef.current !== sid || isManualCloseRef.current) return;
            canStreamInputRef.current = false;
            startInFlightRef.current = false;
            console.log('[Voice] Live Closed:', e.code, e.reason);

            // ── Clean close: normal end ──────────────────────────────────────
            if (e.code === 1000) {
              stopSession();
              return;
            }

            // ── Abnormal close: decide whether to retry ──────────────────────
            const canRetry = !NON_RETRYABLE_CODES.has(e.code) && retryCountRef.current < MAX_AUTO_RETRIES;

            if (canRetry) {
              retryCountRef.current += 1;
              const attempt = retryCountRef.current;
              const delay = RETRY_DELAY_MS * attempt; // Exponential-ish back-off
              console.info(`[Voice] Auto-retry ${attempt}/${MAX_AUTO_RETRIES} in ${delay}ms (code ${e.code})`);
              setError(`Reconnexion automatique (${attempt}/${MAX_AUTO_RETRIES})…`);
              setVoiceState('connecting');

              // Re-use the stream already acquired so we don't need to re-prompt for mic permission
              retryTimerRef.current = window.setTimeout(() => {
                if (isManualCloseRef.current) return;
                // Partial cleanup: close session & audio but keep stream
                (sessionRef.current as any)?._ws?.close?.();
                sessionRef.current?.close();
                sessionRef.current = null;
                if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
                stopAllPlayback();
                if (processorRef.current) processorRef.current.port.onmessage = null;
                processorRef.current?.disconnect();
                processorRef.current = null;
                captureCtxRef.current?.close().catch(() => { });
                captureCtxRef.current = null;
                playbackCtxRef.current?.close().catch(() => { });
                playbackCtxRef.current = null;
                scheduledUntilRef.current = 0;
                interruptedRef.current = false;
                // Don't reset sessionIdRef — we keep the same sid guard
                startSessionRef.current?.();
              }, delay);
            } else {
              // Max retries exceeded or non-retryable code
              const reason = e.reason ? `(${e.reason})` : `(code ${e.code})`;
              setError(`Session interrompue ${reason}. Appuyez sur "Réessayer".`);
              setVoiceState('error');
              cleanup();
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (sessionIdRef.current !== sid) return;

            const setupTurn = () => {
              scheduledUntilRef.current = playbackCtxRef.current?.currentTime ?? 0;
              setVoiceState('listening');
            };

            if (msg.serverContent) {
              if (msg.serverContent.interrupted) {
                // Server detected barge-in: immediately stop all scheduled audio
                stopAllPlayback();
                setupTurn();
                return;
              }
              if (msg.serverContent.turnComplete) {
                setupTurn();
                return;
              }

              // A new model turn: clear the interrupted flag so fresh chunks can play
              if (msg.serverContent.modelTurn?.parts?.length) {
                interruptedRef.current = false;
              }

              for (const p of msg.serverContent.modelTurn?.parts || []) {
                if (p.inlineData?.mimeType?.startsWith('audio/pcm') && p.inlineData.data) {
                  playPcmChunk(p.inlineData.data);
                }
              }
            }

            const calls = msg.toolCall?.functionCalls;
            if (!calls) return;

            const responses = await Promise.all(calls.map(async c => {
              const args = (c.args || {}) as Record<string, any>;
              if (c.name === 'add_to_cart') {
                const prodName = (args.product_name || '').trim();
                const weightGrams = Number(args.weight_grams) || 0;
                let qty = Number(args.quantity) || 0;

                const p = await findProduct(prodName);

                if (p) {
                  if (weightGrams > 0) {
                    const unitWeight = p.weight_grams || 1;
                    qty = Math.max(1, Math.round(weightGrams / unitWeight));
                  } else if (qty <= 0) {
                    qty = 1;
                  }

                  if (onAddItemRef.current) {
                    onAddItemRef.current(p, qty);
                    const msg = weightGrams > 0
                      ? `OK — ${p.name} (${weightGrams}g, soit x${qty}) ajouté au panier`
                      : `OK — ${p.name} x${qty} ajouté au panier`;
                    return { name: c.name, id: c.id, response: { result: msg } };
                  }
                }
                return { name: c.name, id: c.id, response: { error: `Produit "${prodName}" non trouvé dans le catalogue.` } };
              }

              if (c.name === 'close_session') {
                setTimeout(() => {
                  stopSession();
                  onCloseSessionRef.current?.();
                }, 3500);
                return { name: c.name, id: c.id, response: { result: 'OK — Session en cours de fermeture' } };
              }

              if (c.name === 'view_product') {
                const prodName = (args.product_name || '').trim();
                const p = await findProduct(prodName);
                if (p && onViewProductRef.current) {
                  onViewProductRef.current(p);
                  return { name: c.name, id: c.id, response: { result: `OK — Fiche de "${p.name}" affichée` } };
                }
                return { name: c.name, id: c.id, response: { error: `Produit "${prodName}" non trouvé dans le catalogue.` } };
              }

              if (c.name === 'navigate_to') {
                const page = (args.page || '').toLowerCase();
                const mapping: Record<string, string> = {
                  home: '/', shop: '/boutique', products: '/produits', quality: '/qualite',
                  contact: '/contact', account: '/compte', cart: '/panier', catalog: '/catalogue'
                };
                const path = mapping[page];
                if (path && onNavigateRef.current) {
                  onNavigateRef.current(path);
                  return { name: c.name, id: c.id, response: { result: `Navigation vers ${page} effectuée.` } };
                }
                return { name: c.name, id: c.id, response: { error: `La page "${page}" n'existe pas.` } };
              }

              if (c.name === 'search_catalog') {
                try {
                  const query = (args.query || '').trim();
                  if (!query) {
                    return { name: c.name, id: c.id, response: { error: 'Recherche impossible : le paramètre "query" est vide.' } };
                  }
                  const embedding = await generateEmbedding(query);
                  const { data, error: rpcError } = await supabase.rpc('match_products', {
                    query_embedding: embedding,
                    match_threshold: 0.1,
                    match_count: 10
                  });
                  if (rpcError) throw rpcError;
                  if (data && data.length > 0) searchResultsRef.current = data as Product[];
                  const results = (data as any[]).map(p => `• ${p.name} | ${p.price}€ | CBD ${p.cbd_percentage}% | ${p.description}`).join('\n');
                  return { name: c.name, id: c.id, response: { results, note: 'Ce sont les produits les plus pertinents du catalogue complet.' } };
                } catch (e) {
                  console.error('[Voice] Search Tool Error:', e);
                  return { name: c.name, id: c.id, response: { error: 'Erreur technique lors de la recherche' } };
                }
              }

              return null;
            }));

            const filteredResponses = responses.filter(Boolean) as FunctionResponse[];
            if (filteredResponses.length > 0) {
              sessionRef.current?.sendToolResponse({ functionResponses: filteredResponses });
            }
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
      startInFlightRef.current = false;

      // Don't show error if this session was superseded (e.g. rapid open/close)
      if (sessionIdRef.current !== sid) return;

      const userMessage = classifyError(err);
      console.error('[Voice] Session setup failed:', err);
      setError(userMessage);
      setVoiceState('error');
    }
  }, [cleanup, buildSystemPrompt, compatibilityError, playPcmChunk, startMicCapture, stopAllPlayback, stopSession]);

  // Keep startSession accessible inside the onclose retry callback via ref
  useEffect(() => {
    startSessionRef.current = startSession;
  }, [startSession]);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  }, []);

  const isSupported = useMemo(() => !compatibilityError, [compatibilityError]);

  return { voiceState, error, isMuted, isSupported, compatibilityError, startSession, stopSession, toggleMute };
}
