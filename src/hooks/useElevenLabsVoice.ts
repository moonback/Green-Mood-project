import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Conversation } from '@elevenlabs/client';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from './useBudTenderMemory';
import { supabase } from '../lib/supabase';
import { generateEmbedding } from '../lib/embeddings';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

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

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_MAP: Record<string, string> = {
  home: '/',
  shop: '/boutique',
  products: '/produits',
  quality: '/qualite',
  contact: '/contact',
  account: '/compte',
  cart: '/panier',
  catalog: '/catalogue',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useElevenLabsVoice({
  products,
  pastProducts = [],
  savedPrefs,
  userName,
  onAddItem,
  deliveryFee = 5.9,
  deliveryFreeThreshold = 50,
  onCloseSession,
  onViewProduct,
  onNavigate,
}: Options) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [compatibilityError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    if (!window.isSecureContext) return 'Sécurisé (HTTPS) requis.';
    if (!navigator.mediaDevices?.getUserMedia) return 'Microphone non supporté.';
    return null;
  });

  // ── Stable refs so callbacks always see the latest values ──────────────────
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

  // ── Session bookkeeping ────────────────────────────────────────────────────
  // conversationRef is nulled BEFORE endSession() so all callbacks can bail early,
  // which eliminates the "WebSocket already CLOSING or CLOSED" console error that
  // appears when the SDK's internal audio worklet fires one last message during teardown.
  const conversationRef = useRef<Conversation | null>(null);
  const isManualCloseRef = useRef(false);
  const startInFlightRef = useRef(false);
  const isMutedRef = useRef(false);
  const sessionIdRef = useRef(0);
  const searchResultsRef = useRef<Product[]>([]);

  // ── Product lookup helper ──────────────────────────────────────────────────

  const findProduct = useCallback((name: string): Product | undefined => {
    const lower = name.toLowerCase().trim();
    const all = [...productsRef.current, ...searchResultsRef.current];
    return (
      all.find((p) => p.name.toLowerCase() === lower) ||
      all.find(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          lower.includes(p.name.toLowerCase()),
      ) ||
      (() => {
        const words = lower.split(/\s+/).filter((w) => w.length > 2);
        return words.length > 0
          ? all.find((p) =>
              words.every((w) => p.name.toLowerCase().includes(w)),
            )
          : undefined;
      })()
    );
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────

  const cleanup = useCallback(async () => {
    isManualCloseRef.current = true;
    startInFlightRef.current = false;
    isMutedRef.current = false;
    searchResultsRef.current = [];
    sessionIdRef.current += 1;

    // Null the ref first — any SDK callback still in flight will see null and skip.
    const conv = conversationRef.current;
    conversationRef.current = null;

    if (conv) {
      try {
        await conv.endSession();
      } catch {
        // Silently ignore; the session may already be closed.
      }
    }
  }, []);

  useEffect(() => () => { cleanup(); }, [cleanup]);

  // ── stopSession ────────────────────────────────────────────────────────────

  const stopSession = useCallback(async () => {
    await cleanup();
    setVoiceState('idle');
    setIsMuted(false);
    setError(null);
  }, [cleanup]);

  // ── startSession ───────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    if (startInFlightRef.current) return;

    await cleanup();
    isManualCloseRef.current = false;
    const sid = ++sessionIdRef.current;

    if (compatibilityError) {
      setError(compatibilityError);
      setVoiceState('error');
      return;
    }

    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;
    if (!agentId) {
      setError('VITE_ELEVENLABS_AGENT_ID manquant.');
      setVoiceState('error');
      return;
    }

    startInFlightRef.current = true;
    setVoiceState('connecting');
    setError(null);

    try {
      const conversation = await Conversation.startSession({
        agentId,

        // ── Dynamic variables passed to the agent prompt ──────────────────
        dynamicVariables: {
          user_name: userName ?? 'Client',
          delivery_fee: String(deliveryFee),
          delivery_free_threshold: String(deliveryFreeThreshold),
          product_count: String(products.length),
        },

        // ── Client-side tool handlers ─────────────────────────────────────
        clientTools: {
          add_to_cart: async ({
            product_name,
            quantity,
            weight_grams,
          }: {
            product_name: string;
            quantity?: number;
            weight_grams?: number;
          }) => {
            if (sessionIdRef.current !== sid) return 'Session expirée.';

            let product = findProduct(product_name);

            // Supabase fallback if not found locally
            if (!product) {
              try {
                const { data } = await supabase
                  .from('products')
                  .select('*, category:categories(slug, name)')
                  .ilike('name', `%${product_name}%`)
                  .eq('is_active', true)
                  .limit(1)
                  .maybeSingle();
                if (data) product = data as Product;
              } catch { /* ignore */ }
            }

            if (product) {
              let qty = Number(quantity) || 0;
              const weightG = Number(weight_grams) || 0;
              if (weightG > 0) {
                const unitWeight = product.weight_grams || 1;
                qty = Math.max(1, Math.round(weightG / unitWeight));
              } else if (qty <= 0) {
                qty = 1;
              }
              onAddItemRef.current?.(product, qty);
              return weightG > 0
                ? `${product.name} (${weightG}g, soit x${qty}) ajouté au panier.`
                : `${product.name} x${qty} ajouté au panier.`;
            }

            return `Produit "${product_name}" introuvable dans le catalogue.`;
          },

          search_catalog: async ({ query }: { query: string }) => {
            if (sessionIdRef.current !== sid) return 'Session expirée.';
            try {
              const embedding = await generateEmbedding((query || '').trim());
              const { data, error: rpcError } = await supabase.rpc(
                'match_products',
                { query_embedding: embedding, match_threshold: 0.1, match_count: 10 },
              );
              if (rpcError) throw rpcError;
              if (data?.length) searchResultsRef.current = data as Product[];
              return (
                (data as Product[])
                  .map(
                    (p) =>
                      `• ${p.name} | ${p.price}€ | CBD ${p.cbd_percentage}% | ${p.description}`,
                  )
                  .join('\n') || 'Aucun résultat trouvé.'
              );
            } catch (e) {
              console.error('[ElevenLabs] search_catalog error:', e);
              return 'Erreur lors de la recherche.';
            }
          },

          view_product: async ({ product_name }: { product_name: string }) => {
            if (sessionIdRef.current !== sid) return 'Session expirée.';
            const product = findProduct(product_name);
            if (product && onViewProductRef.current) {
              onViewProductRef.current(product);
              return `Fiche de "${product.name}" affichée.`;
            }
            return `Produit "${product_name}" introuvable.`;
          },

          navigate_to: async ({ page }: { page: string }) => {
            if (sessionIdRef.current !== sid) return 'Session expirée.';
            const path = PAGE_MAP[(page || '').toLowerCase()];
            if (path && onNavigateRef.current) {
              onNavigateRef.current(path);
              return `Navigation vers ${page} effectuée.`;
            }
            return `Page "${page}" non reconnue.`;
          },

          close_session: async () => {
            setTimeout(() => {
              stopSession();
              onCloseSessionRef.current?.();
            }, 3500);
            return 'Session en cours de fermeture.';
          },
        },

        // ── Lifecycle callbacks ───────────────────────────────────────────

        onConnect: ({ conversationId }) => {
          if (sessionIdRef.current !== sid || !conversationRef.current) return;
          console.info(`[ElevenLabs] Connecté — ID: ${conversationId}`);
          startInFlightRef.current = false;
        },

        onDisconnect: () => {
          console.info('[ElevenLabs] Déconnecté');
          // conversationRef may already be null if we triggered the close.
          conversationRef.current = null;
          startInFlightRef.current = false;
          if (sessionIdRef.current === sid && !isManualCloseRef.current) {
            setVoiceState('idle');
          }
        },

        onError: (message: string) => {
          if (sessionIdRef.current !== sid) return;
          console.error('[ElevenLabs] Erreur:', message);
          setError('Erreur de connexion ElevenLabs.');
          setVoiceState('error');
          startInFlightRef.current = false;
        },

        onStatusChange: ({ status }: { status: string }) => {
          if (sessionIdRef.current !== sid) return;
          console.info(`[ElevenLabs] Status: ${status}`);
          switch (status) {
            case 'connected':
              setVoiceState('listening');
              break;
            case 'connecting':
              setVoiceState('connecting');
              break;
            case 'disconnecting':
            case 'disconnected':
              if (!isManualCloseRef.current) setVoiceState('idle');
              break;
          }
        },

        onModeChange: ({ mode }: { mode: { mode: string } }) => {
          if (sessionIdRef.current !== sid || !conversationRef.current) return;
          setVoiceState(mode.mode === 'speaking' ? 'speaking' : 'listening');
        },
      });

      // Guard: if the session was superseded while awaiting startSession()
      if (sessionIdRef.current !== sid) {
        try { await conversation.endSession(); } catch { /* ignore */ }
        return;
      }

      conversationRef.current = conversation;
    } catch (err) {
      if (sessionIdRef.current !== sid) return;
      console.error('[ElevenLabs] Session start failed:', err);
      setError('Impossible de démarrer la session vocale.');
      setVoiceState('error');
      startInFlightRef.current = false;
    }
  }, [
    cleanup,
    compatibilityError,
    deliveryFee,
    deliveryFreeThreshold,
    findProduct,
    products.length,
    stopSession,
    userName,
  ]);

  // ── toggleMute ─────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
    const conv = conversationRef.current;
    if (!conv) return;
    try {
      // setVolume controls the agent's output volume (speaker-side mute).
      // Microphone muting is handled internally by the ElevenLabs SDK in v0.12+
      // via setInputMuted if the method is available.
      if (typeof (conv as any).setInputMuted === 'function') {
        (conv as any).setInputMuted(isMutedRef.current);
      } else {
        conv.setVolume({ volume: isMutedRef.current ? 0 : 1 });
      }
    } catch { /* ignore */ }
  }, []);

  const isSupported = useMemo(() => !compatibilityError, [compatibilityError]);

  return {
    voiceState,
    error,
    isMuted,
    isSupported,
    compatibilityError,
    startSession,
    stopSession,
    toggleMute,
  };
}
