import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const apiKey = process.env.VITE_GEMINI_API_KEY!;
    const genAI = new GoogleGenAI({ apiKey });

    try {
        const res = await genAI.models.embedContent({
            model: "models/text-embedding-004",
            contents: [{ parts: [{ text: "test" }] }]
        });
        console.log("models/text-embedding-004 dims:", res.embeddings[0].values.length);
    } catch (e: any) {
        console.log("models/text-embedding-004 failed:", e.message);
    }
}

check();
