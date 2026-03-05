import dotenv from 'dotenv';
dotenv.config();

async function list() {
  const apiKey = process.env.VITE_BYTEZ_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_BYTEZ_API_KEY');

  const response = await fetch('https://api.bytez.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const payload = await response.json();
  console.log('Available models payload:', payload);
}

list();
