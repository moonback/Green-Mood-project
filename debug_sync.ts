import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY!;
const supaUrl = process.env.VITE_SUPABASE_URL!;
const supaKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supaUrl, supaKey);
const genAI = new GoogleGenAI({ apiKey });

async function sync() {
    console.log('--- SYNC VECTORS DEBUG ---');

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .is('embedding', null)
        .limit(1);

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No products without embeddings found.');
        return;
    }

    const p = products[0];
    console.log(`Testing update for: ${p.name} (${p.id})`);

    const textToEmbed = `${p.name}`;
    try {
        const response = await genAI.models.embedContent({
            model: "gemini-embedding-001",
            contents: [{ parts: [{ text: textToEmbed }] }]
        });

        let embedding = response.embeddings?.[0]?.values || [];
        if (embedding.length > 768) embedding = embedding.slice(0, 768);

        const { data, error: upError } = await supabase
            .from('products')
            .update({ embedding })
            .eq('id', p.id)
            .select();

        if (upError) {
            console.error('Update error:', upError);
        } else {
            console.log('Update result data length:', data?.length);
            if (data && data.length > 0) {
                console.log('✅ Update SUCCESSFUL (verified by select)');
            } else {
                console.log('❌ Update FAILED (zero rows affected - likely RLS)');
            }
        }
    } catch (e) {
        console.error('Execution error:', e);
    }
}

sync();
