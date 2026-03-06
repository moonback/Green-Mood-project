import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const openRouterApiKey = process.env.OPENROUTER_API_KEY!;
const openRouterModel = process.env.VITE_OPENROUTER_EMBED_MODEL ?? 'openai/text-embedding-3-large';
const supaUrl = process.env.VITE_SUPABASE_URL!;
const supaKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supaUrl, supaKey);

async function embedText(text: string): Promise<number[]> {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:3000',
            'X-Title': process.env.OPENROUTER_APP_NAME ?? 'Green Mood Vector Sync'
        },
        body: JSON.stringify({
            model: openRouterModel,
            input: text,
            dimensions: 3072
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${errorText}`);
    }

    const payload = await response.json();
    return payload?.data?.[0]?.embedding ?? [];
}

async function sync() {
    if (!openRouterApiKey) {
        throw new Error('OPENROUTER_API_KEY is required.');
    }

    console.log(`--- GENERATING EMBEDDINGS SQL (3072 DIMS) VIA ${openRouterModel} ---`);

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
            const embedding = await embedText(textToEmbed);

            // Validate dimension
            if (embedding.length === 3072) {
                allLines.push(`UPDATE products SET embedding = '${JSON.stringify(embedding)}'::vector WHERE id = '${p.id}';`);
                console.log(`✅ ${p.name}`);
            } else {
                console.warn(`⚠️ ${p.name}: Got ${embedding.length} dims, expected 3072`);
            }
        } catch (e) {
            console.error(`❌ ${p.name}`, e);
        }
        await new Promise(r => setTimeout(r, 700)); // Light pacing for provider rate limits
    }

    // Split and Save
    const part1 = allLines.slice(0, 50).join('\n');
    const part2 = allLines.slice(50, 100).join('\n');
    const part3 = allLines.slice(100).join('\n');

    fs.writeFileSync('supabase/apply_vectors_part1.sql', part1);
    fs.writeFileSync('supabase/apply_vectors_part2.sql', part2);
    fs.writeFileSync('supabase/apply_vectors_part3.sql', part3);

    console.log('\n--- FINISHED ---');
    console.log('3072-dim SQL files regenerated in supabase/ directory.');
}

sync();
