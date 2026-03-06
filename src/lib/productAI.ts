import { supabase } from './supabase';
import { Product } from './types';

const PROXY_URL = 'http://localhost:3001/api/ai/chat';
const AI_MODEL = 'liquid/lfm-2-24b-a2b:latest';

export interface GeneratedProductData {
    description?: string;
    cbd_percentage?: number;
    thc_max?: number;
    attributes?: {
        benefits?: string[];
        aromas?: string[];
    };
}

/**
 * Uses OpenRouter via secure proxy to generate missing product information based on the name.
 */
export async function generateProductInfo(productName: string, categoryName?: string): Promise<GeneratedProductData | null> {
    const prompt = `
    Tu es un expert en CBD et cannabis légal. 
    Génère des informations précises pour un produit nommé : "${productName}" ${categoryName ? `dans la catégorie "${categoryName}"` : ''}.
    
    Réponds EXCLUSIVEMENT au format JSON avec la structure suivante :
    {
        "description": "Une description marketing attrayante de 2-3 phrases mettant en avant les caractéristiques du produit.",
        "cbd_percentage": 15.5, (un nombre entre 0 et 30, ou null si inconnu)
        "thc_max": 0.2, (un nombre entre 0 et 0.3)
        "attributes": {
            "benefits": ["Relaxation", "Anti-stress", "Sommeil"], (minimum 3 bénéfices)
            "aromas": ["Citron", "Terreux", "Sucré"] (minimum 3 arômes/saveurs)
        }
    }
    
    IMPORTANT : 
    - Sois réaliste par rapport au nom du produit.
    - Si c'est une fleur connue comme "Amnesia", utilise ses vraies propriétés.
    - Langue : Français.
    `;

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }]
            }),
        });

        if (!response.ok) throw new Error(`AI error: ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) return null;

        // Clean markdown blocks if present
        const jsonString = content.replace(/```json\s?|```/g, '').trim();

        return JSON.parse(jsonString) as GeneratedProductData;
    } catch (err) {
        console.error('[AI] Error generating product info:', err);
        return null;
    }
}

/**
 * Automatically fill empty fields for a product in the database.
 */
export async function autoFillProductSync(product: Product): Promise<boolean> {
    const generated = await generateProductInfo(product.name, (product.category as any)?.name);
    if (!generated) return false;

    const updates: any = {};
    if (!product.description && generated.description) updates.description = generated.description;
    if (!product.cbd_percentage && generated.cbd_percentage) updates.cbd_percentage = generated.cbd_percentage;
    if (!product.thc_max && generated.thc_max) updates.thc_max = generated.thc_max;

    const currentAttrs = product.attributes || {};
    const hasBenefits = currentAttrs.benefits && currentAttrs.benefits.length > 0;
    const hasAromas = currentAttrs.aromas && currentAttrs.aromas.length > 0;

    if (!hasBenefits || !hasAromas) {
        updates.attributes = {
            ...currentAttrs,
            benefits: hasBenefits ? currentAttrs.benefits : generated.attributes?.benefits || [],
            aromas: hasAromas ? currentAttrs.aromas : generated.attributes?.aromas || [],
        };
    }

    if (Object.keys(updates).length === 0) return true;

    const { error } = await supabase.from('products').update(updates).eq('id', product.id);
    if (error) {
        console.error('[AI] Update error:', error);
        return false;
    }

    return true;
}
