/**
 * searchService.ts
 *
 * Handles product and category search with two strategies:
 * 1. Keyword search (fast, always reliable)
 * 2. Vector/semantic search (AI-powered, merged with keyword results)
 *
 * Used by the Layout header search overlay.
 */

import { supabase } from '../lib/supabase';
import { Product, Category } from '../lib/types';
import { generateEmbedding } from '../lib/embeddings';

export interface SearchResults {
    products: Product[];
    categories: Category[];
}

/**
 * Fast keyword search against product names and category names.
 */
export async function searchByKeyword(text: string): Promise<SearchResults> {
    const [kwRes, catRes] = await Promise.all([
        supabase
            .from('products')
            .select('*, category:categories(*)')
            .ilike('name', `%${text}%`)
            .eq('is_active', true)
            .limit(10),
        supabase
            .from('categories')
            .select('*')
            .ilike('name', `%${text}%`)
            .eq('is_active', true)
            .limit(3),
    ]);

    return {
        products: (kwRes.data as Product[]) || [],
        categories: (catRes.data as Category[]) || [],
    };
}

/**
 * Performs a combined keyword + vector search, merging results and enriching
 * with review ratings. Falls back gracefully to keyword-only if vector fails.
 */
export async function searchProducts(text: string): Promise<SearchResults> {
    console.log('[searchService] Searching for:', text);

    const { products: keywordProducts, categories } = await searchByKeyword(text);

    // Display keyword results immediately (caller can update state twice)
    try {
        const embedding = await generateEmbedding(text).catch((e) => {
            console.warn('[searchService] Embedding error (ignored):', e);
            return null;
        });

        if (!embedding) return { products: keywordProducts, categories };

        const { data: vectorProducts } = await supabase.rpc('match_products', {
            query_embedding: embedding,
            match_threshold: 0.1,
            match_count: 10,
        });

        if (!vectorProducts || vectorProducts.length === 0) {
            return { products: keywordProducts, categories };
        }

        // Merge keyword and vector results, keyword results take precedence (already have category data)
        const mergedMap = new Map<string, Product>();
        keywordProducts.forEach(p => mergedMap.set(p.id, p));
        (vectorProducts as Product[]).forEach(pv => {
            if (!mergedMap.has(pv.id)) mergedMap.set(pv.id, pv);
        });

        const mergedProducts = Array.from(mergedMap.values()).slice(0, 10);

        // Enrich with average ratings
        const { data: ratingsData } = await supabase
            .from('reviews')
            .select('product_id, rating')
            .in('product_id', mergedProducts.map(p => p.id))
            .eq('is_published', true);

        const ratingMap = new Map<string, { sum: number; count: number }>();
        (ratingsData || []).forEach((r) => {
            const cur = ratingMap.get(r.product_id) ?? { sum: 0, count: 0 };
            ratingMap.set(r.product_id, { sum: cur.sum + r.rating, count: cur.count + 1 });
        });

        const finalProducts = mergedProducts.map((p) => {
            const r = ratingMap.get(p.id);
            return r ? { ...p, avg_rating: r.sum / r.count, review_count: r.count } : p;
        });

        return { products: finalProducts, categories };
    } catch (err) {
        console.warn('[searchService] Vector search failed (soft error):', err);
        return { products: keywordProducts, categories };
    }
}
