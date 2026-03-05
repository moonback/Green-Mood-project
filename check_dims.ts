import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("VITE_GEMINI_API_KEY is null!");
        return;
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        const res = await genAI.models.embedContent({
            model: "text-embedding-004",
            contents: [{ parts: [{ text: "test" }] }]
        });
        console.log("text-embedding-004 dims:", res.embeddings[0].values.length);
    } catch (e: any) {
        console.log("text-embedding-004 failed:", e.message);
    }

    try {
        const res2 = await genAI.models.embedContent({
            model: "gemini-embedding-001",
            contents: [{ parts: [{ text: "test" }] }]
        });
        console.log("gemini-embedding-001 dims:", res2.embeddings[0].values.length);
    } catch (e: any) {
        console.log("gemini-embedding-001 failed:", e.message);
    }
}

check();
