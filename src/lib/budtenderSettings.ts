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
    ai_enabled: boolean;
    ai_model: string;
    ai_temperature: number;
    ai_max_tokens: number;
    recommendations_count: number;
    typing_speed: 'normal' | 'fast' | 'slow';
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
    {
        id: 'age',
        question: 'Quel est votre âge ?',
        options: [
            { label: '18 – 65 ans', value: 'adult', emoji: '🙂' },
            { label: 'Plus de 65 ans', value: 'senior', emoji: '👵' },
        ],
    },
    // Dans budtenderSettings.ts, ajoutez simplement un objet à la liste :
    // {
    //     id: 'intensity',
    //     question: 'Quelle intensité recherchez-vous ?',
    //     options: [
    //         { label: 'Légère', value: 'low', emoji: '🍃' },
    //         { label: 'Modérée', value: 'mid', emoji: '🌿' },
    //         { label: 'Puissante', value: 'high', emoji: '🔥' },
    //     ],
    // },
    // {
    //     id: 'terpenes',
    //     question: 'Quels arômes préférez-vous ? (Terpènes)',
    //     options: [
    //         { label: 'Citronné (Limonène)', value: 'limonene', emoji: '🍋' },
    //         { label: 'Terreux (Myrcène)', value: 'myrcene', emoji: '🌍' },
    //         { label: 'Floral (Linalol)', value: 'linalool', emoji: '🌸' },
    //         { label: 'Boisé/Pin (Pinène)', value: 'pinene', emoji: '🌲' },
    //         { label: 'Poivré (Caryophyllène)', value: 'caryophyllene', emoji: '🌶️' },
    //     ],
    // },

];

export const BUDTENDER_DEFAULTS: BudTenderSettings = {
    enabled: true,
    ai_enabled: true,
    ai_model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    ai_temperature: 0.7,
    ai_max_tokens: 1500,
    recommendations_count: 3,
    typing_speed: 'normal',
    memory_enabled: true,
    restock_threshold_oils: 30,
    restock_threshold_flowers: 14,
    restock_threshold_other: 21,
    welcome_message: "Bienvenue ! 🌿 Je suis BudTender, votre conseiller CBD de confiance. Comment puis-je vous aider aujourd'hui ?",
    pulse_delay: 3,
    quiz_steps: BUDTENDER_DEFAULT_QUIZ,
};

export const BUDTENDER_LS_KEY = 'budtender_admin_settings_v1';

/**
 * Helper to migrate old settings keys (gemini_*) to new generic AI keys
 */
function migrateSettings(raw: any): BudTenderSettings {
    const migrated = { ...BUDTENDER_DEFAULTS, ...raw };

    // Migrate old keys if present and new ones aren't specifically set in the raw data
    if (raw.gemini_enabled !== undefined && raw.ai_enabled === undefined) {
        migrated.ai_enabled = raw.gemini_enabled;
    }
    if (raw.gemini_temperature !== undefined && raw.ai_temperature === undefined) {
        migrated.ai_temperature = raw.gemini_temperature;
    }
    if (raw.gemini_max_tokens !== undefined && raw.ai_max_tokens === undefined) {
        migrated.ai_max_tokens = raw.gemini_max_tokens;
    }

    // Ensure ai_model is set to a valid OpenRouter default if missing
    if (!migrated.ai_model) {
        migrated.ai_model = BUDTENDER_DEFAULTS.ai_model;
    }

    return migrated;
}

/**
 * Global helper to load BudTender settings from localStorage (Sync)
 */
export function getBudTenderSettings(): BudTenderSettings {
    try {
        const raw = localStorage.getItem(BUDTENDER_LS_KEY);
        if (raw) return migrateSettings(JSON.parse(raw));
    } catch (err) {
        if (import.meta.env.DEV) console.error('[budtenderSettings] Error loading settings:', err);
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
        if (data?.value) return migrateSettings(data.value);
    } catch (err) {
        // Quietly fallback if it's just a missing row or initial setup
        if (import.meta.env.DEV) console.warn('[budtenderSettings] No config found in DB, using defaults');
    }
    // Fallback if DB fails or is empty
    return getBudTenderSettings();
}
