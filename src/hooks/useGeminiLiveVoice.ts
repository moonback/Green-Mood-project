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
const CONNECTION_TIMEOUT_MS = 10000;
const AUDIO_SCHEDULE_AHEAD_SEC = 0.008;

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

  const canSendRealtimeInput = useCallback(() => {
    if (!sessionRef.current || !canStreamInputRef.current || isManualCloseRef.current) return false;

    // Defensive check of the internal WebSocket state
    const session = sessionRef.current as any;
    const ws = session._ws || session.ws || session.messenger?.ws;

    if (ws && typeof ws.readyState === 'number') {
      return ws.readyState === 1; // 1 = OPEN
    }

    return canStreamInputRef.current;
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
    (sessionRef.current as any)?._ws?.close?.(); // Attempt direct WS close if accessible to speed up state change
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
    cleanup();
    setVoiceState('idle');
    setIsMuted(false);
  }, [cleanup]);

  const playPcmChunk = useCallback((base64: string) => {
    // Guard: discard any audio chunks that arrive after an interruption
    // These are in-flight chunks sent before the server acknowledged the barge-in
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
        // Silently catch socket closed/closing errors during teardown to prevent console noise
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
      setError('Missing API Key.');
      setVoiceState('error');
      return;
    }

    startInFlightRef.current = true;
    setVoiceState('connecting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ai = new GoogleGenAI({ apiKey });

      setupTimeoutRef.current = window.setTimeout(() => {
        if (sessionIdRef.current === sid && startInFlightRef.current) {
          setError('Délai de connexion dépassé.');
          stopSession();
        }
      }, CONNECTION_TIMEOUT_MS);

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
            console.info('Gemini Live: Setup Complete');
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
            console.error('Live Error:', e);
            setError('Erreur de connexion Live.');
            setVoiceState('error');
            startInFlightRef.current = false;
          },
          onclose: (e: CloseEvent) => {
            if (sessionIdRef.current !== sid || isManualCloseRef.current) return;
            canStreamInputRef.current = false;
            console.log('Live Closed:', e.code, e.reason);
            if (e.code !== 1000) {
              setError(`Session interrompue (${e.code}).`);
              setVoiceState('error');
            } else {
              stopSession();
            }
            startInFlightRef.current = false;
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (sessionIdRef.current !== sid) return;

            const setupTurn = () => {
              scheduledUntilRef.current = playbackCtxRef.current?.currentTime ?? 0;
              setVoiceState('listening');
            };

            if (msg.serverContent) {
              if (msg.serverContent.interrupted) {
                stopAllPlayback();
                setupTurn();
                return;
              }
              if (msg.serverContent.turnComplete) {
                setupTurn();
                return;
              }

              // A new model turn with audio data means the server is speaking fresh content;
              // clear the interrupted flag so these new chunks are allowed to play.
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

                const prodNameLower = prodName.toLowerCase();
                const allKnown = [...productsRef.current, ...searchResultsRef.current];
                let p = allKnown.find(i => i.name.toLowerCase() === prodNameLower)
                  || allKnown.find(i => i.name.toLowerCase().includes(prodNameLower) || prodNameLower.includes(i.name.toLowerCase()));

                if (!p) {
                  const words = prodNameLower.split(/\s+/).filter(w => w.length > 2);
                  p = allKnown.find(i => words.length > 0 && words.every(w => i.name.toLowerCase().includes(w)));
                }

                if (!p) {
                  try {
                    const { data } = await supabase.from('products').select('*, category:categories(slug, name)').ilike('name', `%${prodName}%`).eq('is_active', true).limit(1).maybeSingle();
                    if (data) p = data as Product;
                  } catch (e) {
                    console.error('[Voice] Supabase fallback failed:', e);
                  }
                }

                if (p) {
                  // Logic for weight vs quantity
                  if (weightGrams > 0) {
                    const unitWeight = p.weight_grams || 1; // Fallback to 1g if not specified
                    qty = Math.max(1, Math.round(weightGrams / unitWeight));
                  } else if (qty <= 0) {
                    qty = 1; // Default
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
                const prodNameLower = prodName.toLowerCase();
                const allKnown = [...productsRef.current, ...searchResultsRef.current];
                let p = allKnown.find(i => i.name.toLowerCase() === prodNameLower)
                  || allKnown.find(i => i.name.toLowerCase().includes(prodNameLower) || prodNameLower.includes(i.name.toLowerCase()));
                if (!p) {
                  const words = prodNameLower.split(/\s+/).filter(w => w.length > 2);
                  p = allKnown.find(i => words.length > 0 && words.every(w => i.name.toLowerCase().includes(w)));
                }
                if (p && onViewProductRef.current) {
                  onViewProductRef.current(p);
                  return { name: c.name, id: c.id, response: { result: `OK — Fiche de "${p.name}" affichée` } };
                }
                return { name: c.name, id: c.id, response: { error: `Produit "${prodName}" non trouvé.` } };
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
      console.error('Live session setup failed:', err);
      if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
      setError('Erreur media.');
      setVoiceState('error');
      startInFlightRef.current = false;
    }
  }, [cleanup, buildSystemPrompt, compatibilityError, playPcmChunk, startMicCapture, stopAllPlayback, stopSession]);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
  }, []);

  const isSupported = useMemo(() => !compatibilityError, [compatibilityError]);

  return { voiceState, error, isMuted, isSupported, compatibilityError, startSession, stopSession, toggleMute };
}
