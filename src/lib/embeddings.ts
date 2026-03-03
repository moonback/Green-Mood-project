import { GoogleGenAI } from "@google/genai";
import { getCachedEmbedding, setCachedEmbedding } from './budtenderCache';

// ─── Singleton client ────────────────────────────────────────────────────────

let _genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
    if (!_genAI) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not found in environment');
        _genAI = new GoogleGenAI({ apiKey });
    }
    return _genAI;
}

/**
 * Generate embeddings with LRU cache.
 * Identical queries hit the cache instead of calling the API again.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = getCachedEmbedding(text);
    if (cached) return cached;

    const genAI = getGenAI();

    try {
        const response = await genAI.models.embedContent({
            model: "gemini-embedding-001",
            contents: [{ parts: [{ text }] }]
        });

        const embedding = response.embeddings?.[0]?.values || [];
        if (embedding.length > 0) setCachedEmbedding(text, embedding);
        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}
