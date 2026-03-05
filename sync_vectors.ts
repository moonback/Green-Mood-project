import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY!;
const supaUrl = process.env.VITE_SUPABASE_URL!;
const supaKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supaUrl, supaKey);
const genAI = new GoogleGenAI({ apiKey });

async function sync() {
    console.log('--- GENERATING EMBEDDINGS SQL (768 DIMS) ---');

    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    console.log(`Vectorizing ${products.length} products...`);
    let allLines: string[] = [];

    for (const p of products) {
        const textToEmbed = `${p.name} ${p.description || ''} ${p.cbd_percentage ? 'CBD ' + p.cbd_percentage + '%' : ''} ${(p.attributes?.benefits || []).join(' ')}`;

        try {
            const response = await genAI.models.embedContent({
                model: "gemini-embedding-001",
                contents: [{ parts: [{ text: textToEmbed }] }],
                config: {
                    outputDimensionality: 768
                }
            });

            let embedding = response.embeddings?.[0]?.values || [];

            // Validate dimension
            if (embedding.length === 768) {
                allLines.push(`UPDATE products SET embedding = '${JSON.stringify(embedding)}'::vector WHERE id = '${p.id}';`);
                console.log(`✅ ${p.name}`);
            } else {
                console.warn(`⚠️ ${p.name}: Got ${embedding.length} dims, expected 768`);
            }
        } catch (e) {
            console.error(`❌ ${p.name}`, e);
        }
        await new Promise(r => setTimeout(r, 2000)); // Rate limit delay
    }

    // Split and Save
    const part1 = allLines.slice(0, 50).join('\n');
    const part2 = allLines.slice(50, 100).join('\n');
    const part3 = allLines.slice(100).join('\n');

    fs.writeFileSync('supabase/apply_vectors_part1.sql', part1);
    fs.writeFileSync('supabase/apply_vectors_part2.sql', part2);
    fs.writeFileSync('supabase/apply_vectors_part3.sql', part3);

    console.log('\n--- FINISHED ---');
    console.log('768-dim SQL files regenerated in supabase/ directory.');
}

sync();
