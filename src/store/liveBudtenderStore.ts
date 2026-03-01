import { create } from 'zustand';
import {
    LiveSessionStatus,
    TranscriptEntry,
    LiveRecommendedProduct,
    LiveCartAction,
    LiveSubscriptionAction,
} from '../lib/types';

interface LiveBudtenderStore {
    // Session state
    isLiveMode: boolean;
    sessionStatus: LiveSessionStatus;

    // Audio state
    isMicActive: boolean;
    userAudioLevel: number;
    aiAudioLevel: number;

    // Transcript
    transcript: TranscriptEntry[];

    // Products surfaced by AI function calls
    recommendedProducts: LiveRecommendedProduct[];

    // Cart action notifications
    lastCartAction: LiveCartAction | null;

    // Subscription creation notifications
    lastSubscriptionAction: LiveSubscriptionAction | null;

    // Error
    error: string | null;

    // Actions
    setLiveMode: (active: boolean) => void;
    setSessionStatus: (status: LiveSessionStatus) => void;
    setMicActive: (active: boolean) => void;
    setUserAudioLevel: (level: number) => void;
    setAiAudioLevel: (level: number) => void;
    addTranscriptEntry: (entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => void;
    setRecommendedProducts: (products: LiveRecommendedProduct[]) => void;
    addRecommendedProduct: (product: LiveRecommendedProduct) => void;
    setLastCartAction: (action: LiveCartAction | null) => void;
    setLastSubscriptionAction: (action: LiveSubscriptionAction | null) => void;
    setError: (error: string | null) => void;
    resetSession: () => void;
}

export const useLiveBudtenderStore = create<LiveBudtenderStore>()((set) => ({
    isLiveMode: false,
    sessionStatus: 'idle',
    isMicActive: false,
    userAudioLevel: 0,
    aiAudioLevel: 0,
    transcript: [],
    recommendedProducts: [],
    lastCartAction: null,
    lastSubscriptionAction: null,
    error: null,

    setLiveMode: (active) => set({ isLiveMode: active }),

    setSessionStatus: (status) => set({ sessionStatus: status }),

    setMicActive: (active) => set({ isMicActive: active }),

    setUserAudioLevel: (level) => set({ userAudioLevel: level }),

    setAiAudioLevel: (level) => set({ aiAudioLevel: level }),

    addTranscriptEntry: (entry) =>
        set((state) => ({
            transcript: [
                ...state.transcript,
                {
                    ...entry,
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: Date.now(),
                },
            ],
        })),

    setRecommendedProducts: (products) => set({ recommendedProducts: products }),

    addRecommendedProduct: (product) =>
        set((state) => {
            // Avoid duplicates
            if (state.recommendedProducts.some((p) => p.product.id === product.product.id)) {
                return state;
            }
            return { recommendedProducts: [...state.recommendedProducts, product] };
        }),

    setLastCartAction: (action) => set({ lastCartAction: action }),

    setLastSubscriptionAction: (action) => set({ lastSubscriptionAction: action }),

    setError: (error) => set({ error }),

    resetSession: () =>
        set({
            sessionStatus: 'idle',
            isMicActive: false,
            userAudioLevel: 0,
            aiAudioLevel: 0,
            transcript: [],
            recommendedProducts: [],
            lastCartAction: null,
            lastSubscriptionAction: null,
            error: null,
        }),
}));
