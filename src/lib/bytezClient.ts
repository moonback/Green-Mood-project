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

const BYTEZ_BASE_URL = (import.meta.env.VITE_BYTEZ_BASE_URL ?? 'https://api.bytez.com/v1').replace(/\/$/, '');
const BYTEZ_CHAT_MODEL = import.meta.env.VITE_BYTEZ_CHAT_MODEL ?? 'Qwen/Qwen2-7B-Instruct';
const BYTEZ_EMBED_MODEL = import.meta.env.VITE_BYTEZ_EMBED_MODEL ?? 'BAAI/bge-large-en-v1.5';

function resolveApiKey(): string {
  const key = import.meta.env.VITE_BYTEZ_API_KEY;
  if (!key) throw new Error('VITE_BYTEZ_API_KEY not found in environment');
  return key;
}

function sanitizeModelId(model: string): string {
  return model.trim().replace(/:free$/i, '');
}

function getRunUrls(modelId: string): string[] {
  const encoded = encodeURIComponent(modelId);
  return [
    `${BYTEZ_BASE_URL}/models/${encoded}/run`,
    `${BYTEZ_BASE_URL}/run/${encoded}`,
  ];
}

async function postJson(url: string, apiKey: string, body: unknown): Promise<{ ok: boolean; status: number; payload: any }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

async function runBytezModel(modelId: string, input: Record<string, unknown>): Promise<any> {
  const apiKey = resolveApiKey();
  const attempted: Array<{ url: string; status: number; payload: any }> = [];

  for (const url of getRunUrls(modelId)) {
    const result = await postJson(url, apiKey, input);
    if (result.ok) return result.payload;

    attempted.push({ url, status: result.status, payload: result.payload });

    // Keep probing alternate route for 404s only. For all other HTTP errors, stop early.
    if (result.status !== 404) {
      throw new Error(`Bytez run error ${result.status} on ${url}: ${JSON.stringify(result.payload)}`);
    }
  }

  throw new Error(`Bytez run error 404 on all routes: ${JSON.stringify(attempted)}`);
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

function extractChatOutput(payload: any): string | null {
  const directOutput = payload?.output;
  if (typeof directOutput === 'string') return directOutput;
  if (Array.isArray(directOutput)) {
    const joined = extractTextContent(directOutput);
    if (joined) return joined;
  }
  if (directOutput && typeof directOutput === 'object') {
    const fromMessage = extractTextContent(directOutput?.message?.content);
    if (fromMessage) return fromMessage;
    const fromChoices = extractTextContent(directOutput?.choices?.[0]?.message?.content);
    if (fromChoices) return fromChoices;
  }

  const fromChoices = extractTextContent(payload?.choices?.[0]?.message?.content);
  if (fromChoices) return fromChoices;

  return null;
}

function extractEmbeddingOutput(payload: any): number[] | null {
  const directOutput = payload?.output;
  if (Array.isArray(directOutput) && directOutput.every((v: unknown) => typeof v === 'number')) {
    return directOutput as number[];
  }
  if (Array.isArray(directOutput?.embedding) && directOutput.embedding.every((v: unknown) => typeof v === 'number')) {
    return directOutput.embedding as number[];
  }

  const embedding = payload?.data?.[0]?.embedding;
  if (Array.isArray(embedding) && embedding.every((v: unknown) => typeof v === 'number')) {
    return embedding as number[];
  }

  return null;
}

export async function runChatModel(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  const requestedModel = sanitizeModelId(options.model ?? BYTEZ_CHAT_MODEL);
  const fallbackModel = sanitizeModelId(BYTEZ_CHAT_MODEL);

  const body = {
    messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  };

  try {
    const payload = await runBytezModel(requestedModel, body);
    const text = extractChatOutput(payload);
    if (!text) throw new Error(`Bytez returned an empty chat response: ${JSON.stringify(payload)}`);
    return text;
  } catch (err: any) {
    const details = String(err?.message ?? err);
    const mayRetryWithDefault = requestedModel !== fallbackModel
      && /Model does not exist|404|not found/i.test(details);

    if (!mayRetryWithDefault) throw err;

    const payload = await runBytezModel(fallbackModel, body);
    const text = extractChatOutput(payload);
    if (!text) throw new Error(`Bytez returned an empty chat response after fallback: ${JSON.stringify(payload)}`);
    return text;
  }
}

export async function runEmbeddingModel(input: string, options: EmbeddingOptions = {}): Promise<number[]> {
  const model = sanitizeModelId(options.model ?? BYTEZ_EMBED_MODEL);

  const payload = await runBytezModel(model, {
    input,
    text: input,
    dimensions: options.dimensions,
  });

  const embedding = extractEmbeddingOutput(payload);
  if (!embedding || embedding.length === 0) {
    throw new Error(`Bytez returned an empty embedding vector: ${JSON.stringify(payload)}`);
  }

  return embedding;
}
