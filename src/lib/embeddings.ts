import { getCachedEmbedding, setCachedEmbedding } from './budtenderCache';

const OPENROUTER_EMBED_URL = 'https://openrouter.ai/api/v1/embeddings';
const OPENROUTER_EMBED_MODEL = import.meta.env.VITE_OPENROUTER_EMBED_MODEL ?? 'openai/text-embedding-3-small';
const OPENROUTER_EMBED_DIMENSIONS = Number(import.meta.env.VITE_OPENROUTER_EMBED_DIMENSIONS ?? 768);

/**
 * Generate embeddings with LRU cache.
 * Identical queries hit the cache instead of calling the API again.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const normalized = text.trim();
    if (!normalized) return [];

    const cached = getCachedEmbedding(normalized);
    if (cached) return cached;

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY not found in environment');

    const response = await fetch(OPENROUTER_EMBED_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
            'X-Title': 'Green Mood Vector Sync',
        },
        body: JSON.stringify({
            model: OPENROUTER_EMBED_MODEL,
            input: normalized,
            dimensions: OPENROUTER_EMBED_DIMENSIONS,
        }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(`OpenRouter embedding error ${response.status}: ${JSON.stringify(payload)}`);
    }

    const embedding = payload?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('OpenRouter returned an empty embedding vector.');
    }

    setCachedEmbedding(normalized, embedding);
    return embedding;
}
