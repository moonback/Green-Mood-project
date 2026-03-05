import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

async function list() {
    const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY! });
    const response = await genAI.models.list();
    const models = [];
    for await (const model of response) {
        models.push(model.name);
    }
    console.log('Available models:', models);
}

list();
