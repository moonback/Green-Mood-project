import { Product } from './types';
import { BudTenderSettings, QuizOption } from './budtenderSettings';
import { getQuizPrompt, getChatPrompt } from './budtenderPrompts';
import { CATEGORY_SLUGS } from './constants';

export interface TerpeneChip {
    label: string;
    emoji: string;
    group: 'arome' | 'effet';
}

export const TERPENE_CHIPS: TerpeneChip[] = [
    // Arômes
    { label: 'Citronné', emoji: '🍋', group: 'arome' },
    { label: 'Terreux', emoji: '🌍', group: 'arome' },
    { label: 'Fruité', emoji: '🍓', group: 'arome' },
    { label: 'Floral', emoji: '🌸', group: 'arome' },
    { label: 'Épicé', emoji: '🌶️', group: 'arome' },
    { label: 'Boisé', emoji: '🪵', group: 'arome' },
    { label: 'Herbacé', emoji: '🌿', group: 'arome' },
    { label: 'Sucré', emoji: '🍬', group: 'arome' },
    // Effets terpéniques
    { label: 'Focus', emoji: '🎯', group: 'effet' },
    { label: 'Créativité', emoji: '🎨', group: 'effet' },
    { label: 'Détente', emoji: '🛁', group: 'effet' },
    { label: 'Énergie', emoji: '⚡', group: 'effet' },
    { label: 'Récupération', emoji: '💆', group: 'effet' },
    { label: 'Anti-stress', emoji: '🧘', group: 'effet' },
];

export type Answers = Record<string, string>;

export function scoreProduct(product: Product, answers: Answers): number {
    let score = 0;
    const cat = product.category?.slug ?? '';
    const name = product.name.toLowerCase();
    const desc = (product.description ?? '').toLowerCase();

    if (answers.goal === 'sleep') {
        if (name.includes('sommeil') || desc.includes('sommeil') || desc.includes('nuit')) score += 5;
        if (cat === CATEGORY_SLUGS.OILS && (product.cbd_percentage ?? 0) >= 15) score += 3;
        if (cat === CATEGORY_SLUGS.INFUSIONS) score += 2;
    }
    if (answers.goal === 'stress') {
        if (desc.includes('détente') || desc.includes('stress') || desc.includes('relaxat')) score += 5;
        if (cat === CATEGORY_SLUGS.INFUSIONS) score += 3;
        if (cat === CATEGORY_SLUGS.OILS) score += 2;
    }
    if (answers.goal === 'pain') {
        if ((product.cbd_percentage ?? 0) >= 20) score += 5;
        if (cat === CATEGORY_SLUGS.OILS) score += 3;
        if (desc.includes('douleur') || desc.includes('récupér')) score += 4;
    }
    if (answers.goal === 'wellness') {
        if (product.is_featured) score += 3;
        score += 1;
    }

    if (answers.experience === 'beginner') {
        if ((product.cbd_percentage ?? 0) <= 10) score += 3;
        if (cat === CATEGORY_SLUGS.INFUSIONS) score += 2;
        if (product.is_bundle) score += 2;
    }
    if (answers.experience === 'expert') {
        if ((product.cbd_percentage ?? 0) >= 20) score += 3;
    }

    if (answers.format === 'oil' && cat === CATEGORY_SLUGS.OILS) score += 4;
    if (answers.format === 'flower' && (cat === CATEGORY_SLUGS.FLOWERS || cat === CATEGORY_SLUGS.RESINS)) score += 4;
    if (answers.format === 'infusion' && cat === CATEGORY_SLUGS.INFUSIONS) score += 4;
    if (answers.format === 'bundle' && product.is_bundle) score += 6;

    const price = product.price;
    if (answers.budget === 'low' && price < 20) score += 3;
    if (answers.budget === 'mid' && price >= 20 && price <= 50) score += 3;
    if (answers.budget === 'high' && price > 50) score += 3;

    if (product.stock_quantity > 10) score += 1;
    if (product.is_featured) score += 1;

    return score;
}

export function scoreTerpenes(product: Product, selected: string[]): number {
    if (selected.length === 0) return 0;
    const productAromas: string[] = (product.attributes?.aromas ?? []).map((a: string) => a.toLowerCase());
    const productDesc = (product.description ?? '').toLowerCase();
    let bonus = 0;
    for (const chip of selected) {
        const chipLow = chip.toLowerCase();
        if (productAromas.some(a => a.includes(chipLow) || chipLow.includes(a))) bonus += 4;
        if (productDesc.includes(chipLow)) bonus += 2;
    }
    return bonus;
}

export function generateAdvice(answers: Answers, terpenes: string[] = []): string {
    const lines: string[] = [];
    if (answers.goal === 'sleep') lines.push('Pour favoriser un sommeil de qualité, je recommande les huiles à fort dosage le soir au coucher.');
    if (answers.goal === 'stress') lines.push("Contre le stress quotidien, les infusions ou une huile à dosage modéré sont d'excellentes alliées.");
    if (answers.goal === 'pain') lines.push('Pour les douleurs, une huile haute concentration (20%+) appliquée régulièrement donne les meilleurs résultats.');
    if (answers.goal === 'wellness') lines.push('Pour un bien-être global, démarrez doucement avec une huile classique ou une infusion.');
    if (answers.experience === 'beginner') lines.push("En tant que débutant, commencez à faible dose et augmentez progressivement selon vos ressentis.");
    if (answers.format === 'bundle') lines.push("Les packs découverte sont idéaux pour tester plusieurs formes de CBD à prix réduit.");
    if (terpenes.length > 0) lines.push(`Votre profil terpénique (${terpenes.join(', ')}) guidera notre sélection vers des arômes et effets précis.`);
    return lines.join(' ');
}

export async function callAI(
    answers: Answers,
    products: Product[],
    settings: BudTenderSettings,
    history: { role: string; content: string }[] = [],
    context?: string
): Promise<string | null> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey || !settings.ai_enabled) return null;

    const topScored = [...products]
        .map(p => ({ p, s: scoreProduct(p, answers) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 15);

    const catalog = topScored
        .map(({ p }) => {
            const aromas = (p.attributes?.aromas ?? []).join(', ');
            const benefits = (p.attributes?.benefits ?? []).join(', ');
            return `- ${p.name} (${p.category?.slug}, CBD ${p.cbd_percentage ?? '?'}%, ${p.price}€). ${p.description ?? ''} ${aromas ? 'Arômes: ' + aromas : ''} ${benefits ? 'Effets: ' + benefits : ''}`;
        })
        .join('\n');

    const systemPromptMessage = {
        role: 'system',
        content: getQuizPrompt(answers, settings.quiz_steps, catalog, context)
    };

    const messages = [
        systemPromptMessage,
        ...history
    ];

    if (messages[messages.length - 1].role !== 'user') {
        messages.push({ role: 'user', content: "Basé sur mes réponses et notre échange, donne-moi tes conseils finaux." });
    }

    const modelToUse = settings.ai_model || 'google/gemini-2.0-flash-lite-preview-02-05:free';

    try {
        const res = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Title': 'Green Mood BudTender',
                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
                },
                body: JSON.stringify({
                    model: modelToUse,
                    messages,
                    temperature: settings.ai_temperature,
                    max_tokens: settings.ai_max_tokens,
                }),
            }
        );

        const json = await res.json();
        if (!res.ok) return null;
        return json?.choices?.[0]?.message?.content ?? null;
    } catch (err) {
        return null;
    }
}

export type MessageType = 'standard' | 'restock' | 'skip-quiz' | 'terpene';

export interface Message {
    id: string;
    sender: 'bot' | 'user';
    text?: string;
    type?: MessageType;
    isResult?: boolean;
    isOptions?: boolean;
    options?: QuizOption[];
    stepId?: string;
    recommended?: Product[];
    restockProduct?: {
        product_id: string;
        product_name: string;
        slug: string | null;
        image_url: string | null;
        price: number;
        daysSince: number;
    };
}
