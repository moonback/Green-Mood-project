import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useAuthStore } from '../store/authStore';
import { getBudTenderSettings, QuizOption, BudTenderSettings } from '../lib/budtenderSettings';
import { CATEGORY_SLUGS } from '../lib/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SavedPrefs {
    goal: string;
    experience: string;
    format: string;
    budget: string;
    age?: string;
    intensity?: string;
    terpenes?: string[]; // Multiple choice possible
    [key: string]: any; // Support for dynamic/extra fields
}

export interface ChatMessage {
    id: string;
    sender: 'bot' | 'user';
    text?: string;
    type?: string;
    isResult?: boolean;
    isOptions?: boolean;
    options?: QuizOption[];
    stepId?: string;
    recommended?: Product[];
}

export interface PastProduct {
    product_id: string;
    product_name: string;
    slug: string | null;
    image_url: string | null;
    price: number;
    orderedAt: string;
    categorySlug: string | null;
}

export interface RestockCandidate extends PastProduct {
    daysSince: number;
    threshold: number;
}

// Shape of each order_items row returned by the join query
interface OrderHistoryItem {
    product_id: string;
    product_name: string;
    unit_price: number;
    product: {
        slug: string;
        image_url: string | null;
        category: { slug: string } | null;
    } | null;
}

// Maps a category slug to the matching BudTenderSettings threshold key.
// Any slug not present falls back to 'restock_threshold_other'.
const CATEGORY_THRESHOLD_KEYS: Partial<Record<string, keyof BudTenderSettings>> = {
    [CATEGORY_SLUGS.OILS]: 'restock_threshold_oils',
    [CATEGORY_SLUGS.FLOWERS]: 'restock_threshold_flowers',
    [CATEGORY_SLUGS.RESINS]: 'restock_threshold_flowers',
};

// Fallback defaults if settings fail
const FALLBACK_THRESHOLDS: Record<string, number> = {
    [CATEGORY_SLUGS.OILS]: 30,
    [CATEGORY_SLUGS.FLOWERS]: 14,
    [CATEGORY_SLUGS.RESINS]: 14,
    [CATEGORY_SLUGS.INFUSIONS]: 21,
};
const FALLBACK_DEFAULT = 21;

const LS_KEY = 'budtender_prefs_v1';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBudTenderMemory() {
    const { user, profile } = useAuthStore();

    const [pastProducts, setPastProducts] = useState<PastProduct[]>([]);
    const [restockCandidates, setRestockCandidates] = useState<RestockCandidate[]>([]);
    const [savedPrefs, setSavedPrefs] = useState<SavedPrefs | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [allChatSessions, setAllChatSessions] = useState<{ id: string, messages: ChatMessage[], title: string, created_at: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const isLoggedIn = !!user;
    const userName = profile?.full_name
        ? profile.full_name.split(' ')[0]
        : null;

    // ── Load saved prefs and chat history from localStorage ──────────────────
    useEffect(() => {
        try {
            const rawPrefs = localStorage.getItem(LS_KEY);
            if (rawPrefs) setSavedPrefs(JSON.parse(rawPrefs) as SavedPrefs);

            const rawChat = localStorage.getItem('budtender_chat_history_v1');
            if (rawChat) setChatHistory(JSON.parse(rawChat));
        } catch {
            // ignore corrupt data
        }
    }, []);

    // ── Fetch order history for logged-in users ──────────────────────────────
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const { data: orders } = await supabase
                    .from('orders')
                    .select('id, created_at, status, order_items(product_id, product_name, unit_price, product:products(slug, image_url, category:categories(slug)))')
                    .eq('user_id', user.id)
                    .in('status', ['paid', 'processing', 'ready', 'shipped', 'delivered'])
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!orders) return;

                const settings = getBudTenderSettings();
                if (!settings.memory_enabled) {
                    setIsLoading(false);
                    return;
                }

                const now = Date.now();
                const seen = new Set<string>();
                const past: PastProduct[] = [];
                const restock: RestockCandidate[] = [];

                for (const order of orders) {
                    const items = (order.order_items as unknown as OrderHistoryItem[]) ?? [];
                    const orderedAt = order.created_at as string;
                    const daysSince = (now - new Date(orderedAt).getTime()) / (1000 * 60 * 60 * 24);

                    for (const item of items) {
                        const catSlug = item.product?.category?.slug ?? null;
                        const candidate: PastProduct = {
                            product_id: item.product_id,
                            product_name: item.product_name,
                            slug: item.product?.slug ?? null,
                            image_url: item.product?.image_url ?? null,
                            price: item.unit_price,
                            orderedAt,
                            categorySlug: catSlug,
                        };

                        // Deduplicate — keep only most recent per product
                        if (!seen.has(item.product_id)) {
                            seen.add(item.product_id);
                            past.push(candidate);
                        }

                        // Restock check — map category slug to its threshold setting key
                        const thresholdKey = (catSlug && CATEGORY_THRESHOLD_KEYS[catSlug]) ?? 'restock_threshold_other';
                        const threshold = settings[thresholdKey] as number;

                        if (daysSince >= threshold && !restock.find(r => r.product_id === item.product_id)) {
                            restock.push({ ...candidate, daysSince: Math.round(daysSince), threshold });
                        }
                    }
                }

                setPastProducts(past.slice(0, 5));
                setRestockCandidates(restock.slice(0, 2)); // max 2 restock suggestions
            } catch (err) {
                if (import.meta.env.DEV) console.error('[BudTenderMemory]', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    // ─── Save preferences ─────────────────────────────────────────────────────
    const savePrefs = async (prefs: SavedPrefs) => {
        try {
            // Local fallback
            localStorage.setItem(LS_KEY, JSON.stringify(prefs));
            setSavedPrefs(prefs);

            // Supabase sync
            if (user) {
                // Separate fixed DB columns from dynamic ones
                const { goal, experience, format, budget, age, intensity, terpenes, ...extra } = prefs as any;

                if (import.meta.env.DEV) {
                    console.log('[BudTenderMemory] Supabase Upsert Payload:', {
                        user_id: user.id,
                        goal, experience, format, budget, age, intensity, terpenes, extra
                    });
                }

                await supabase.from('user_ai_preferences').upsert({
                    user_id: user.id,
                    goal: goal,
                    experience_level: experience,
                    preferred_format: format,
                    budget_range: budget,
                    age_range: age,
                    intensity_preference: intensity,
                    terpene_preferences: terpenes ?? [],
                    extra_prefs: extra, // This can store any dynamic questions added in Admin
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error('[BudTenderMemory] Error saving prefs:', err);
        }
    };

    const saveChatHistory = async (history: ChatMessage[]) => {
        try {
            // Local fallback
            localStorage.setItem('budtender_chat_history_v1', JSON.stringify(history));
            setChatHistory(history);

            // Supabase sync (Record interaction session)
            if (user && history.length > 0) {
                // We use a simple session_id based on the first message id or date
                const sessionId = history[0].id || new Date().toISOString();

                await supabase.from('budtender_interactions').upsert({
                    user_id: user.id,
                    session_id: sessionId,
                    interaction_type: 'chat_session',
                    quiz_answers: { messages: history },
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id,session_id' });
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error('[BudTenderMemory] Error saving history:', err);
        }
    };

    const fetchAllSessions = async () => {
        if (!user) return;
        setIsHistoryLoading(true);
        try {
            const { data } = await supabase
                .from('budtender_interactions')
                .select('session_id, quiz_answers, created_at')
                .eq('user_id', user.id)
                .eq('interaction_type', 'chat_session')
                .order('created_at', { ascending: false });

            if (data) {
                const sessions = data.map(d => {
                    const messages = (d.quiz_answers?.messages as ChatMessage[]) || [];

                    // Filter out "button-like" user messages that shouldn't be the title
                    const nonSystemUserMessages = messages.filter(m =>
                        m.sender === 'user' &&
                        !m.text.includes("Utilise mes préférences") &&
                        !m.text.includes("conseiller moi") &&
                        !m.text.includes("Recommencer")
                    );

                    const firstRealMessage = nonSystemUserMessages[0]?.text ||
                        messages.find(m => m.sender === 'user')?.text ||
                        "Diagnostic personnalisé";

                    return {
                        id: d.session_id as string,
                        messages,
                        title: firstRealMessage,
                        created_at: d.created_at as string
                    };
                }).filter(s => s.messages.length > 1); // Keep if there's at least one exchange

                setAllChatSessions(sessions);
            }
        } catch (err) {
            console.error('[BudTenderMemory] Error fetching sessions:', err);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const logQuestion = async (question: string) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('budtender_interactions').insert({
                user_id: user.id,
                interaction_type: 'question',
                quiz_answers: { question },
                created_at: new Date().toISOString()
            });
            if (error) console.error('[BudTenderMemory] Question log error:', error);
        } catch (err) {
            console.error('[BudTenderMemory] Question log exception:', err);
        }
    };

    const clearChatHistory = () => {
        localStorage.removeItem('budtender_chat_history_v1');
        setChatHistory([]);
    };

    const clearPrefs = () => {
        localStorage.removeItem(LS_KEY);
        localStorage.removeItem('budtender_chat_history_v1');
        setSavedPrefs(null);
        setChatHistory([]);
    };

    // ── Load from Supabase on Login ───────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const syncWithSupabase = async () => {
            try {
                // 1. Fetch AI Preferences
                const { data: prefsData } = await supabase
                    .from('user_ai_preferences')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (prefsData) {
                    const syncedPrefs: SavedPrefs = {
                        goal: prefsData.goal ?? '',
                        experience: prefsData.experience_level ?? '',
                        format: prefsData.preferred_format ?? '',
                        budget: prefsData.budget_range ?? '',
                        age: prefsData.age_range ?? '',
                        intensity: prefsData.intensity_preference ?? '',
                        terpenes: prefsData.terpene_preferences ?? [],
                        ...(prefsData.extra_prefs || {}) // Restore any dynamic/custom questions
                    };
                    setSavedPrefs(syncedPrefs);
                    localStorage.setItem(LS_KEY, JSON.stringify(syncedPrefs));
                }

                // 2. Fetch Latest Chat Session
                const { data: interactionData } = await supabase
                    .from('budtender_interactions')
                    .select('quiz_answers')
                    .eq('user_id', user.id)
                    .eq('interaction_type', 'chat_session')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (interactionData && interactionData.quiz_answers?.messages) {
                    const history = interactionData.quiz_answers.messages as ChatMessage[];
                    setChatHistory(history);
                    localStorage.setItem('budtender_chat_history_v1', JSON.stringify(history));
                }
            } catch {
                // Likely no data yet or single() error, normal
            }
        };

        syncWithSupabase();
    }, [user]);

    return {
        isLoggedIn,
        userName,
        pastProducts,
        restockCandidates,
        savedPrefs,
        chatHistory,
        allChatSessions,
        isHistoryLoading,
        savePrefs,
        saveChatHistory,
        fetchAllSessions,
        logQuestion,
        clearChatHistory,
        clearPrefs,
        isLoading,
    };
}
