import { getCachedEmbedding, setCachedEmbedding } from './budtenderCache';
import { runEmbeddingModel } from './bytezClient';

const BYTEZ_EMBED_DIMENSIONS = Number(import.meta.env.VITE_BYTEZ_EMBED_DIMENSIONS ?? 768);

/**
 * Generate embeddings with LRU cache.
 * Identical queries hit the cache instead of calling the API again.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const normalized = text.trim();
    if (!normalized) return [];

    const cached = getCachedEmbedding(normalized);
    if (cached) return cached;

    const embedding = await runEmbeddingModel(normalized, {
        dimensions: BYTEZ_EMBED_DIMENSIONS,
    });

    setCachedEmbedding(normalized, embedding);
    return embedding;
}
