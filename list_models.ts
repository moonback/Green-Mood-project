import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

async function list() {
    const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY!);
    const models = await genAI.models.list();
    console.log('Available models:', models.map(m => m.name));
}

list();
