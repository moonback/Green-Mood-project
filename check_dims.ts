import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const apiKey = process.env.VITE_BYTEZ_API_KEY;
  if (!apiKey) {
    console.error('VITE_BYTEZ_API_KEY is null!');
    return;
  }

  const res = await fetch('https://api.bytez.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: process.env.VITE_BYTEZ_EMBED_MODEL ?? 'BAAI/bge-large-en-v1.5', input: 'test' }),
  });

  const payload = await res.json();
  console.log('status:', res.status);
  console.log('dims:', payload?.data?.[0]?.embedding?.length ?? 0);
}

check();
