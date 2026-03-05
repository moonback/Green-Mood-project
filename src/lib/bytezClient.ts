type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

const BYTEZ_BASE_URL = import.meta.env.VITE_BYTEZ_BASE_URL ?? 'https://api.bytez.com/v1';
const BYTEZ_CHAT_MODEL = import.meta.env.VITE_BYTEZ_CHAT_MODEL ?? 'Qwen/Qwen2-7B-Instruct';
const BYTEZ_EMBED_MODEL = import.meta.env.VITE_BYTEZ_EMBED_MODEL ?? 'BAAI/bge-large-en-v1.5';

function resolveApiKey(): string {
  const key = import.meta.env.VITE_BYTEZ_API_KEY;
  if (!key) throw new Error('VITE_BYTEZ_API_KEY not found in environment');
  return key;
}

function extractTextContent(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;

  const textParts = content
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item?.type === 'text' && typeof item?.text === 'string') return item.text;
      return '';
    })
    .filter(Boolean);

  return textParts.length > 0 ? textParts.join('\n') : null;
}

export async function runChatModel(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  const apiKey = resolveApiKey();

  const response = await fetch(`${BYTEZ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model ?? BYTEZ_CHAT_MODEL,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Bytez chat error ${response.status}: ${JSON.stringify(payload)}`);
  }

  const text = extractTextContent(payload?.choices?.[0]?.message?.content);
  if (!text) throw new Error('Bytez returned an empty chat response.');
  return text;
}

export async function runEmbeddingModel(input: string, options: EmbeddingOptions = {}): Promise<number[]> {
  const apiKey = resolveApiKey();

  const response = await fetch(`${BYTEZ_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model ?? BYTEZ_EMBED_MODEL,
      input,
      dimensions: options.dimensions,
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
