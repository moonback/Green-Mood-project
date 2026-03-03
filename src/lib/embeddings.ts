import { GoogleGenAI } from "@google/genai";

/**
 * Helper to generate embeddings using Google's text-embedding-004 model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY not found in environment');
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        const response = await genAI.models.embedContent({
            model: "gemini-embedding-001",
            contents: [{ parts: [{ text }] }]
        });

        return response.embeddings?.[0]?.values || [];
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}
