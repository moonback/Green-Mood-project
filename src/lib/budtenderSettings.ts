import { supabase } from './supabase';

// ─── Shared BudTender Settings Logic ──────────────────────────────────────────

export interface QuizOption {
    label: string;
    value: string;
    emoji: string;
}

export interface QuizStep {
    id: string;
    question: string;
    options: QuizOption[];
}

export interface BudTenderSettings {
    enabled: boolean;
    gemini_enabled: boolean;
    gemini_temperature: number;
    gemini_max_tokens: number;
    recommendations_count: number;
    typing_speed: 'slow' | 'normal' | 'fast';
    memory_enabled: boolean;
    restock_threshold_oils: number;
    restock_threshold_flowers: number;
    restock_threshold_other: number;
    welcome_message: string;
    pulse_delay: number;
    quiz_steps: QuizStep[];
}

export const BUDTENDER_DEFAULT_QUIZ: QuizStep[] = [
    {
        id: 'goal',
        question: 'Quel est votre principal besoin ?',
        options: [
            { label: 'Sommeil & Relaxation', value: 'sleep', emoji: '🌙' },
            { label: 'Stress & Anxiété', value: 'stress', emoji: '🧘' },
            { label: 'Douleurs & Récupération', value: 'pain', emoji: '💪' },
            { label: 'Bien-être général', value: 'wellness', emoji: '🌿' },
        ],
    },
    {
        id: 'experience',
        question: 'Quelle est votre expérience avec le CBD ?',
        options: [
            { label: "Débutant — c'est ma première fois", value: 'beginner', emoji: '👋' },
            { label: "Intermédiaire — j'ai déjà essayé", value: 'intermediate', emoji: '🙂' },
            { label: "Expert — je connais bien", value: 'expert', emoji: '🌟' },
        ],
    },
    {
        id: 'format',
        question: 'Quel format vous attire le plus ?',
        options: [
            { label: 'Huile sublinguale (rapide & précis)', value: 'oil', emoji: '💧' },
            { label: 'Fleur ou résine (tradition)', value: 'flower', emoji: '🌸' },
            { label: 'Infusion (doux & relaxant)', value: 'infusion', emoji: '☕' },
            { label: 'Pack découverte (tout essayer)', value: 'bundle', emoji: '📦' },
        ],
    },
    {
        id: 'budget',
        question: 'Quel est votre budget approximatif ?',
        options: [
            { label: 'Moins de 20 €', value: 'low', emoji: '💶' },
            { label: '20 € – 50 €', value: 'mid', emoji: '💶💶' },
            { label: 'Plus de 50 €', value: 'high', emoji: '💎' },
        ],
    },
];

export const BUDTENDER_DEFAULTS: BudTenderSettings = {
    enabled: true,
    gemini_enabled: true,
    gemini_temperature: 0.7,
    gemini_max_tokens: 1500,
    recommendations_count: 3,
    typing_speed: 'normal',
    memory_enabled: true,
    restock_threshold_oils: 30,
    restock_threshold_flowers: 14,
    restock_threshold_other: 21,
    welcome_message:
        "Bonjour ! Je suis BudTender, votre conseiller CBD personnel. J'aimerais vous aider à trouver les produits idéaux. On commence ?",
    pulse_delay: 8,
    quiz_steps: BUDTENDER_DEFAULT_QUIZ,
};

export const BUDTENDER_LS_KEY = 'budtender_admin_settings_v1';

/**
 * Global helper to load BudTender settings from localStorage (Sync)
 */
export function getBudTenderSettings(): BudTenderSettings {
    try {
        const raw = localStorage.getItem(BUDTENDER_LS_KEY);
        if (raw) return { ...BUDTENDER_DEFAULTS, ...JSON.parse(raw) };
    } catch (err) {
        console.error('[budtenderSettings] Error loading settings:', err);
    }
    return BUDTENDER_DEFAULTS;
}

/**
 * Global helper to fetch BudTender settings from Supabase (Async)
 */
export async function fetchBudTenderSettings(): Promise<BudTenderSettings> {
    try {
        const { data, error } = await supabase
            .from('store_settings')
            .select('value')
            .eq('key', 'budtender_config')
            .maybeSingle(); // maybeSingle allows 0 rows without erroring

        if (error) throw error;
        if (data?.value) return { ...BUDTENDER_DEFAULTS, ...data.value };
    } catch (err) {
        // Quietly fallback if it's just a missing row or initial setup
        console.warn('[budtenderSettings] No config found in DB, using defaults');
    }
    // Fallback if DB fails or is empty
    return getBudTenderSettings();
}
