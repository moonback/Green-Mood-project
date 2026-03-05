import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const bytezApiKey = process.env.VITE_BYTEZ_API_KEY;
const bytezEmbedModel = process.env.VITE_BYTEZ_EMBED_MODEL ?? 'BAAI/bge-large-en-v1.5';
const bytezBaseUrl = process.env.VITE_BYTEZ_BASE_URL ?? 'https://api.bytez.com/v1';

if (!supabaseUrl || !supabaseAnonKey || !bytezApiKey) {
    console.error('Missing required environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_BYTEZ_API_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateEmbedding(input: string): Promise<number[]> {
    const response = await fetch(`${bytezBaseUrl}/embeddings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${bytezApiKey}`,
        },
        body: JSON.stringify({
            model: bytezEmbedModel,
            input,
        }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`Bytez embedding error ${response.status}: ${JSON.stringify(payload)}`);
    }

    const embedding = payload?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Bytez returned an empty embedding vector.');
    }

    return embedding;
}

async function syncEmbeddings() {
    console.log('--- Starting Embeddings Sync ---');

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description, attributes')
        .is('embedding', null);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No products found needing embeddings.');
        return;
    }

    console.log(`Found ${products.length} products to process.`);

    for (const product of products) {
        try {
            const aromas = (product.attributes?.aromas ?? []).join(', ');
            const benefits = (product.attributes?.benefits ?? []).join(', ');

            const textToEmbed = `
        NOM: ${product.name}
        DESCRIPTION: ${product.description || ''}
        AROMES: ${aromas}
        EFFETS: ${benefits}
      `.trim();

            console.log(`Embedding: ${product.name}...`);
            const embedding = await generateEmbedding(textToEmbed);

            const { error: updateError } = await supabase
                .from('products')
                .update({ embedding })
                .eq('id', product.id);

            if (updateError) {
                console.error(`Error updating product ${product.name}:`, updateError);
            } else {
                console.log(`Successfully updated ${product.name}!`);
            }
        } catch (err) {
            console.error(`Unexpected error processing ${product.name}:`, err);
        }
    }

    console.log('--- Embeddings Sync Complete ---');
}

syncEmbeddings();
