import { getCachedEmbedding, setCachedEmbedding } from './budtenderCache';

const PROXY_URL = 'http://localhost:3001/api/ai/embeddings';
const OPENROUTER_EMBED_MODEL = import.meta.env.VITE_OPENROUTER_EMBED_MODEL ?? 'openai/text-embedding-3-small';
const OPENROUTER_EMBED_DIMENSIONS = Number(import.meta.env.VITE_OPENROUTER_EMBED_DIMENSIONS ?? 768);

/**
 * Generate embeddings with LRU cache via secure proxy.
 * Identical queries hit the cache instead of calling the API again.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const normalized = text.trim();
    if (!normalized) return [];

    const cached = getCachedEmbedding(normalized);
    if (cached) return cached;

    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
