/**
 * aiService.ts
 *
 * Handles all AI-related business logic for the BudTender feature:
 * - Product scoring / recommendation ranking
 * - Terpene scoring
 * - Quiz recommendation text generation
 * - OpenRouter API calls (quiz + free chat)
 * - Supabase interaction logging
 * - Semantic product search (vector + keyword fallback)
 */

import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { getQuizPrompt, getChatPrompt } from '../lib/budtenderPrompts';
import { BudTenderSettings } from '../lib/budtenderSettings';
import { generateEmbedding } from '../lib/embeddings';
import { CATEGORY_SLUGS } from '../lib/constants';

// ─── Terpene chips ────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

export type Answers = Record<string, string>;

// ─── Scoring logic ────────────────────────────────────────────────────────────

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

// ─── OpenRouter API helpers ───────────────────────────────────────────────────

function buildProductCatalogText(products: Product[]): string {
    return products
        .map((p) => {
            const aromas = (p.attributes?.aromas ?? []).join(', ');
            const benefits = (p.attributes?.benefits ?? []).join(', ');
            return `- ${p.name} (${p.category?.slug}, CBD ${p.cbd_percentage ?? '?'}%, ${p.price}€). ${p.description ?? ''} ${aromas ? 'Arômes: ' + aromas : ''} ${benefits ? 'Effets: ' + benefits : ''}`;
        })
        .join('\n');
}

/**
 * Calls OpenRouter for quiz-based product recommendations.
 */
export async function callQuizAI(
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

    const catalog = buildProductCatalogText(topScored.map(({ p }) => p));

    const messages = [
        { role: 'system', content: getQuizPrompt(answers, settings.quiz_steps, catalog, context) },
        ...history,
    ];

    if (messages[messages.length - 1].role !== 'user') {
        messages.push({ role: 'user', content: "Basé sur mes réponses et notre échange, donne-moi tes conseils finaux." });
    }

    const modelToUse = settings.ai_model || 'google/gemini-2.0-flash-lite-preview-02-05:free';
    console.log('[aiService] callQuizAI Model:', modelToUse);

    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
        });

        const json = await res.json();
        if (!res.ok) {
            console.error('[aiService] callQuizAI API Error:', json);
            return null;
        }
        return json?.choices?.[0]?.message?.content ?? null;
    } catch (err) {
        console.error('[aiService] callQuizAI Fetch Error:', err);
        return null;
    }
}

export interface ChatAIToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

export interface ChatAIResult {
    text: string | null;
    toolCalls: Array<{ function: { name: string; arguments: string } }> | null;
    status: number;
    rawJson: Record<string, unknown>;
}

/**
 * Calls OpenRouter for free-form chat with optional tool calling.
 */
export async function callChatAI(
    userText: string,
    relevantProducts: Product[],
    settings: BudTenderSettings,
    memory: { savedPrefs: Record<string, unknown> | null; userName: string | null; pastProducts: Array<{ product_name: string }> },
    history: { role: 'user' | 'assistant'; content: string }[],
    tools: ChatAIToolDefinition[]
): Promise<ChatAIResult> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    const catalog = buildProductCatalogText(relevantProducts);

    let userContext = '';
    if (memory.userName) userContext += `Nom du client: ${memory.userName}\n`;
    if (memory.pastProducts.length > 0) {
        userContext += `Historique d'achats: ${memory.pastProducts.slice(0, 3).map(p => p.product_name).join(', ')}\n`;
    }
    if (memory.savedPrefs) {
        const prefs = memory.savedPrefs as Record<string, unknown>;
        const { goal, experience, format, budget, age, intensity, terpenes, ...others } = prefs;
        const entries = [
            `Objectif: ${goal}`,
            `Expérience: ${experience}`,
            `Format: ${format}`,
            `Budget: ${budget}`,
            `Âge: ${age || 'Non précisé'}`,
            `Intensité: ${intensity || 'Non précisé'}`,
            `Terpènes: ${Array.isArray(terpenes) ? terpenes.join(', ') : 'Aucun'}`
        ];
        Object.entries(others).forEach(([k, v]) => { if (v) entries.push(`${k}: ${v}`); });
        userContext += `Préférences: ${entries.join(' | ')}`;
    }

    const systemPrompt = getChatPrompt(userText, catalog, userContext);

    const messagesForAI: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...history,
    ];

    if (messagesForAI[messagesForAI.length - 1].role !== 'user') {
        messagesForAI.push({ role: 'user', content: userText });
    }

    const modelToUse = settings.ai_model || 'google/gemini-2.0-flash-lite-preview-02-05:free';
    console.log('[aiService] callChatAI Model:', modelToUse);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Title': 'Green Mood BudTender',
            'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
            model: modelToUse,
            messages: messagesForAI,
            tools,
            tool_choice: 'auto',
            temperature: settings.ai_temperature,
            max_tokens: settings.ai_max_tokens,
        }),
    });

    const json = await res.json();
    const choice = json?.choices?.[0];
    const responseMessage = choice?.message;

    return {
        text: responseMessage?.content ?? null,
        toolCalls: responseMessage?.tool_calls ?? null,
        status: res.status,
        rawJson: json,
    };
}

// ─── Product search ───────────────────────────────────────────────────────────

/**
 * Finds semantically relevant products for a user query using vector search,
 * with a keyword-based fallback.
 */
export async function findRelevantProducts(text: string, allProducts: Product[]): Promise<Product[]> {
    try {
        const embedding = await generateEmbedding(text);
        const { data, error } = await supabase.rpc('match_products', {
            query_embedding: embedding,
            match_threshold: 0.1,
            match_count: 10,
        });
        if (error) throw error;
        if (data && data.length > 0) return data as Product[];
    } catch (err) {
        console.warn('[aiService] Vector search failed, falling back to keywords:', err);
    }

    // Keyword fallback
    const keywords = text.toLowerCase().split(' ').filter(k => k.length > 3);
    const scored = allProducts
        .map(p => {
            let s = 0;
            const pName = p.name.toLowerCase();
            const pDesc = (p.description || '').toLowerCase();
            const pCat = (p.category?.name || '').toLowerCase();
            keywords.forEach(k => {
                if (pName.includes(k)) s += 5;
                if (pDesc.includes(k)) s += 2;
                if (pCat.includes(k)) s += 3;
            });
            return { p, s };
        })
        .sort((a, b) => b.s - a.s)
        .filter(x => x.s > 0)
        .slice(0, 10)
        .map(x => x.p);

    return scored.length > 0 ? scored : allProducts.filter(p => p.is_featured).slice(0, 5);
}

/**
 * Finds a product in the local cache first, then falls back to Supabase.
 */
export async function findProductByName(name: string, localProducts: Product[]): Promise<Product | null> {
    const nameLower = name.toLowerCase();
    const local = localProducts.find(i => i.name.toLowerCase() === nameLower)
        || localProducts.find(i => i.name.toLowerCase().includes(nameLower) || nameLower.includes(i.name.toLowerCase()));
    if (local) return local;

    try {
        const { data } = await supabase
            .from('products')
            .select('*, category:categories(slug, name)')
            .ilike('name', `%${name}%`)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
        return data as Product | null;
    } catch (e) {
        console.error('[aiService] findProductByName Supabase fallback failed:', e);
        return null;
    }
}

// ─── Interaction logging ──────────────────────────────────────────────────────

/**
 * Logs a BudTender interaction to Supabase.
 */
export async function logBudTenderInteraction(
    userId: string,
    data: Record<string, unknown>
): Promise<void> {
    try {
        const { error } = await supabase.from('budtender_interactions').insert({
            user_id: userId,
            created_at: new Date().toISOString(),
            ...data,
        });
        if (error) console.error('[aiService] logInteraction error:', error);
    } catch (err) {
        console.error('[aiService] logInteraction exception:', err);
    }
}
