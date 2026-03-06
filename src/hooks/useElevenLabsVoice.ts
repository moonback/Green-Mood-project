import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Conversation } from '@elevenlabs/client';
import type { MessagePayload } from '@elevenlabs/types';
import { Product } from '../lib/types';
import { PastProduct, SavedPrefs } from './useBudTenderMemory';
import { supabase } from '../lib/supabase';
import { generateEmbedding } from '../lib/embeddings';
import { getVoicePrompt } from '../lib/budtenderPrompts';

const CONNECTION_TIMEOUT_MS = 10000;

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
    if (!window.isSecureContext) return 'Connexion sécurisée (HTTPS) requise.';
    if (!navigator.mediaDevices?.getUserMedia) return 'Microphone non supporté par ce navigateur.';
    return null;
  });

  // Keep latest callbacks + data in refs to avoid stale closures inside clientTools
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
  const savedPrefsRef = useRef(savedPrefs);
  savedPrefsRef.current = savedPrefs;
  const pastProductsRef = useRef(pastProducts);
  pastProductsRef.current = pastProducts;
  const deliveryFeeRef = useRef(deliveryFee);
  deliveryFeeRef.current = deliveryFee;
  const deliveryFreeThresholdRef = useRef(deliveryFreeThreshold);
  deliveryFreeThresholdRef.current = deliveryFreeThreshold;
  const userNameRef = useRef(userName);
  userNameRef.current = userName;

  const conversationRef = useRef<Conversation | null>(null);
  const setupTimeoutRef = useRef<number | null>(null);
  const startInFlightRef = useRef(false);
  const isMutedRef = useRef(false);
  const searchResultsRef = useRef<Product[]>([]);

  // ─── Tool handlers (same logic as useGeminiLiveVoice) ────────────────────────

  const handleSearchCatalog = useCallback(async (params: { query: string }): Promise<string> => {
    const query = (params.query || '').trim();
    if (!query) return 'Erreur : paramètre "query" vide.';
    try {
      const embedding = await generateEmbedding(query);
      const { data, error: rpcError } = await supabase.rpc('match_products', {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 10,
      });
      if (rpcError) throw rpcError;
      if (data && data.length > 0) searchResultsRef.current = data as Product[];
      const results = (data as any[])
        .map(p => `• ${p.name} | ${p.price}€ | CBD ${p.cbd_percentage}% | ${p.description}`)
        .join('\n');
      return results || 'Aucun produit trouvé pour cette recherche.';
    } catch (e) {
      console.error('[ElevenLabs] search_catalog error:', e);
      return 'Erreur technique lors de la recherche catalogue.';
    }
  }, []);

  const handleAddToCart = useCallback(async (params: {
    product_name: string;
    quantity?: number;
    weight_grams?: number;
  }): Promise<string> => {
    const prodName = (params.product_name || '').trim();
    const weightGrams = Number(params.weight_grams) || 0;
    let qty = Number(params.quantity) || 0;

    const prodNameLower = prodName.toLowerCase();
    const allKnown = [...productsRef.current, ...searchResultsRef.current];

    let p = allKnown.find(i => i.name.toLowerCase() === prodNameLower)
      || allKnown.find(i => i.name.toLowerCase().includes(prodNameLower) || prodNameLower.includes(i.name.toLowerCase()));

    if (!p) {
      const words = prodNameLower.split(/\s+/).filter(w => w.length > 2);
      p = allKnown.find(i => words.length > 0 && words.every(w => i.name.toLowerCase().includes(w)));
    }

    if (!p) return `Produit "${prodName}" non trouvé. Appelle search_catalog d'abord.`;

    if (weightGrams > 0) {
      const unitWeight = p.weight_grams || 1;
      qty = Math.max(1, Math.round(weightGrams / unitWeight));
    } else if (qty <= 0) {
      qty = 1;
    }

    if (onAddItemRef.current) {
      onAddItemRef.current(p, qty);
      return weightGrams > 0
        ? `OK — ${p.name} (${weightGrams}g, soit x${qty}) ajouté au panier.`
        : `OK — ${p.name} x${qty} ajouté au panier.`;
    }
    return 'Erreur : panier non disponible.';
  }, []);

  const handleViewProduct = useCallback(async (params: { product_name: string }): Promise<string> => {
    const prodName = (params.product_name || '').trim();
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
      return `OK — Fiche de "${p.name}" affichée.`;
    }
    return `Produit "${prodName}" non trouvé.`;
  }, []);

  const handleNavigateTo = useCallback(async (params: { page: string }): Promise<string> => {
    const page = (params.page || '').toLowerCase();
    const mapping: Record<string, string> = {
      home: '/', shop: '/boutique', products: '/produits', quality: '/qualite',
      contact: '/contact', account: '/compte', cart: '/panier', catalog: '/catalogue',
    };
    const path = mapping[page];
    if (path && onNavigateRef.current) {
      onNavigateRef.current(path);
      return `Navigation vers ${page} effectuée.`;
    }
    return `La page "${page}" n'existe pas.`;
  }, []);

  // ─── Session lifecycle ────────────────────────────────────────────────────────

  const stopSession = useCallback(() => {
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }
    conversationRef.current?.endSession().catch(() => {});
    conversationRef.current = null;
    startInFlightRef.current = false;
    searchResultsRef.current = [];
    setVoiceState('idle');
    setError(null);
  }, []);

  const startSession = useCallback(async () => {
    if (startInFlightRef.current) return;
    stopSession();

    if (compatibilityError) {
      setError(compatibilityError);
      setVoiceState('error');
      return;
    }

    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    if (!agentId) {
      setError('VITE_ELEVENLABS_AGENT_ID manquant dans .env');
      setVoiceState('error');
      return;
    }

    startInFlightRef.current = true;
    setVoiceState('connecting');
    setError(null);
    searchResultsRef.current = [];

    // Connection timeout
    setupTimeoutRef.current = window.setTimeout(() => {
      if (startInFlightRef.current) {
        setError('Délai de connexion dépassé. Vérifiez votre connexion.');
        stopSession();
      }
    }, CONNECTION_TIMEOUT_MS);

    try {
      const conversation = await Conversation.startSession({
        agentId,
        connectionType: 'websocket' as const,
        overrides: {
          agent: {
            prompt: {
              prompt: getVoicePrompt(
                productsRef.current,
                savedPrefsRef.current,
                userNameRef.current,
                pastProductsRef.current,
                deliveryFeeRef.current,
                deliveryFreeThresholdRef.current,
              ),
            },
            language: 'fr',
          },
        },

        clientTools: {
          search_catalog: handleSearchCatalog,
          add_to_cart: handleAddToCart,
          view_product: handleViewProduct,
          navigate_to: handleNavigateTo,
          close_session: async () => {
            setTimeout(() => {
              stopSession();
              onCloseSessionRef.current?.();
            }, 3500);
            return 'OK — Session en cours de fermeture.';
          },
        },

        onConnect: ({ conversationId }: { conversationId: string }) => {
          console.log('[ElevenLabs] Connecté — ID:', conversationId);
          if (setupTimeoutRef.current) {
            clearTimeout(setupTimeoutRef.current);
            setupTimeoutRef.current = null;
          }
          startInFlightRef.current = false;
        },

        onDisconnect: (_details: unknown) => {
          console.log('[ElevenLabs] Déconnecté');
          startInFlightRef.current = false;
          conversationRef.current = null;
          setVoiceState('idle');
        },

        onError: (message: string) => {
          console.error('[ElevenLabs] Erreur:', message);
          setError(message || 'Erreur de connexion ElevenLabs.');
          setVoiceState('error');
          startInFlightRef.current = false;
        },

        onStatusChange: ({ status }: { status: string }) => {
          console.log('[ElevenLabs] Status:', status);
          if (status === 'connecting') setVoiceState('connecting');
          else if (status === 'connected') setVoiceState('listening');
          else if (status === 'disconnecting' || status === 'disconnected') setVoiceState('idle');
        },

        onMessage: (_msg: MessagePayload) => {
          // Mode changes are handled via onModeChange below
        },

        onModeChange: ({ mode }: { mode: 'speaking' | 'listening' }) => {
          setVoiceState(mode === 'speaking' ? 'speaking' : 'listening');
        },
      });

      conversationRef.current = conversation;

      // Apply initial mute state if toggled before session started
      if (isMutedRef.current) {
        try { conversation.setMicMuted(true); } catch { /* ignore */ }
      }
    } catch (err: any) {
      console.error('[ElevenLabs] startSession failed:', err);
      if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
      setError(err?.message || 'Impossible de démarrer la session vocale.');
      setVoiceState('error');
      startInFlightRef.current = false;
    }
  }, [
    compatibilityError,
    stopSession,
    handleSearchCatalog,
    handleAddToCart,
    handleViewProduct,
    handleNavigateTo,
  ]);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
    try {
      conversationRef.current?.setMicMuted(isMutedRef.current);
    } catch { /* ignore if session not active */ }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current);
    conversationRef.current?.endSession().catch(() => {});
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
