import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_BYTEZ_API_KEY!;
const supaUrl = process.env.VITE_SUPABASE_URL!;
const supaKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supaUrl, supaKey);

async function embed(input: string): Promise<number[]> {
  const response = await fetch('https://api.bytez.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: process.env.VITE_BYTEZ_EMBED_MODEL ?? 'BAAI/bge-large-en-v1.5', input }),
  });
  const payload = await response.json();
  return payload?.data?.[0]?.embedding ?? [];
}

async function sync() {
  const { data: products } = await supabase.from('products').select('id, name').is('embedding', null).limit(1);
  if (!products?.length) return;

  const p = products[0];
  const embedding = await embed(p.name);
  const { error } = await supabase.from('products').update({ embedding }).eq('id', p.id);
  console.log(error ? 'Update failed' : 'Update successful');
}

sync();
