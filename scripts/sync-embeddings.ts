import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const bytezApiKey = process.env.VITE_BYTEZ_API_KEY;
const bytezEmbedModel = (process.env.VITE_BYTEZ_EMBED_MODEL ?? 'BAAI/bge-large-en-v1.5').replace(/:free$/i, '');
const rawBytezBaseUrl = process.env.VITE_BYTEZ_BASE_URL ?? 'https://api.bytez.com/v1';

if (!supabaseUrl || !supabaseAnonKey || !bytezApiKey) {
    console.error('Missing required environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_BYTEZ_API_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getBaseCandidates(rawBaseUrl: string): string[] {
    const safe = (rawBaseUrl || '').trim().replace(/\/$/, '');
    if (!safe) return ['https://api.bytez.com', 'https://api.bytez.com/v1'];

    const withoutSuffix = safe.replace(/\/(v1|run)$/i, '');
    const candidates = new Set<string>([
        safe,
        withoutSuffix,
        `${withoutSuffix}/v1`,
        `${withoutSuffix}/run`,
    ]);

    return [...candidates].filter(Boolean);
}

async function generateEmbedding(input: string): Promise<number[]> {
    const routes = getBaseCandidates(rawBytezBaseUrl)
        .flatMap(base => [
            `${base}/models/${encodeURIComponent(bytezEmbedModel)}/run`,
            `${base}/run/${encodeURIComponent(bytezEmbedModel)}`,
            `${base}/models/${encodeURIComponent(bytezEmbedModel)}`,
        ]);

    let lastError: any = null;

    for (const url of routes) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${bytezApiKey}`,
            },
            body: JSON.stringify({ input, text: input }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            lastError = { status: response.status, payload, url };
            if (response.status === 404) continue;
            throw new Error(`Bytez embedding error ${response.status}: ${JSON.stringify(payload)}`);
        }

        const embedding = payload?.output?.embedding
            ?? payload?.output
            ?? payload?.data?.[0]?.embedding;

        if (!Array.isArray(embedding) || embedding.length === 0) {
            throw new Error(`Bytez returned an empty embedding vector: ${JSON.stringify(payload)}`);
        }

        return embedding;
    }

    throw new Error(`Bytez embedding route not found: ${JSON.stringify(lastError)}`);
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
            const textToEmbed = `NOM: ${product.name}\nDESCRIPTION: ${product.description || ''}\nAROMES: ${aromas}\nEFFETS: ${benefits}`;

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
