import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const apiKey = process.env.VITE_BYTEZ_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_BYTEZ_API_KEY');

  const response = await fetch('https://api.bytez.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: process.env.VITE_BYTEZ_EMBED_MODEL ?? 'BAAI/bge-large-en-v1.5', input: 'test' }),
  });

  const json = await response.json();
  console.log('dims:', json?.data?.[0]?.embedding?.length ?? 0);
}

check();
