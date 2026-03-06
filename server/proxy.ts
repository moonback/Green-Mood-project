/**
 * API Proxy Server — keeps secret keys on the server side only.
 *
 * Endpoints:
 *   POST /api/ai/chat        →  Proxies to OpenRouter /chat/completions
 *   POST /api/ai/embeddings  →  Proxies to OpenRouter /embeddings
 *   WS   /api/gemini-live    →  Proxies Gemini Live WebSocket (audio streaming)
 *
 * Environment variables (read from .env at project root — NOT prefixed with VITE_):
 *   OPENROUTER_API_KEY
 *   GEMINI_API_KEY
 */

import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = Number(process.env.PROXY_PORT ?? 3001);

if (!OPENROUTER_API_KEY) console.warn('⚠️  OPENROUTER_API_KEY not set — OpenRouter proxy will fail');
if (!GEMINI_API_KEY) console.warn('⚠️  GEMINI_API_KEY not set — Gemini Live proxy will fail');

const app = express();
app.use(express.json({ limit: '2mb' }));

// ─── CORS (allow the Vite dev server origin) ────────────────────────────────
app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // tighten in production
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (_req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// ─── OpenRouter Chat Proxy ──────────────────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
    if (!OPENROUTER_API_KEY) return res.status(500).json({ error: 'Server API key not configured' });

    try {
        const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'X-Title': 'Green Mood BudTender',
                'HTTP-Referer': req.headers.referer || req.headers.origin || 'http://localhost:3000',
            },
            body: JSON.stringify(req.body),
        });

        const data = await upstream.json();
        res.status(upstream.status).json(data);
    } catch (err: any) {
        console.error('[Proxy] Chat error:', err);
        res.status(502).json({ error: 'Upstream error', detail: err.message });
    }
});

// ─── OpenRouter Embeddings Proxy ────────────────────────────────────────────
app.post('/api/ai/embeddings', async (req, res) => {
    if (!OPENROUTER_API_KEY) return res.status(500).json({ error: 'Server API key not configured' });

    try {
        const upstream = await fetch('https://openrouter.ai/api/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'X-Title': 'Green Mood Vector Sync',
                'HTTP-Referer': req.headers.referer || req.headers.origin || 'http://localhost:3000',
            },
            body: JSON.stringify(req.body),
        });

        const data = await upstream.json();
        res.status(upstream.status).json(data);
    } catch (err: any) {
        console.error('[Proxy] Embeddings error:', err);
        res.status(502).json({ error: 'Upstream error', detail: err.message });
    }
});

// ─── HTTP + WebSocket server ────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/gemini-live' });

// Gemini Live API requires the full service path for BiDiSession
const GEMINI_LIVE_WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiSession';

wss.on('connection', (clientWs, req) => {
    if (!GEMINI_API_KEY) {
        clientWs.close(4001, 'Server GEMINI_API_KEY not configured');
        return;
    }

    // The client sends the setup message as its first frame, which contains:
    //   { setup: { model, config } }
    // We need to connect to the real Gemini API and relay.

    let geminiWs: WebSocket | null = null;
    let setupReceived = false;
    const bufferedMessages: string[] = [];

    clientWs.on('message', (raw) => {
        const msg = raw.toString();

        if (!setupReceived) {
            // First message = setup. Parse it to get the model.
            setupReceived = true;
            try {
                const parsed = JSON.parse(msg);
                const model = parsed?.setup?.model || 'models/gemini-2.0-flash-exp';

                // Build the upstream Gemini WebSocket URL
                const geminiUrl = `${GEMINI_LIVE_WS_BASE}?key=${GEMINI_API_KEY}`;

                geminiWs = new WebSocket(geminiUrl);

                geminiWs.on('open', () => {
                    // Forward the setup message
                    geminiWs!.send(msg);
                    // Drain any buffered messages
                    for (const m of bufferedMessages) {
                        geminiWs!.send(m);
                    }
                    bufferedMessages.length = 0;
                });

                geminiWs.on('message', (data) => {
                    // Relay Gemini → Client
                    if (clientWs.readyState === WebSocket.OPEN) {
                        clientWs.send(data.toString());
                    }
                });

                geminiWs.on('close', (code, reason) => {
                    console.warn(`[Proxy] Gemini closed connection: ${code} - ${reason}`);
                    if (clientWs.readyState === WebSocket.OPEN) {
                        clientWs.close(code, reason.toString());
                    }
                });

                geminiWs.on('error', (err) => {
                    console.error('[Proxy] Gemini WS error:', err);
                    if (clientWs.readyState === WebSocket.OPEN) {
                        clientWs.close(4002, 'Gemini upstream error');
                    }
                });
            } catch (e: any) {
                console.error('[Proxy] Setup parse error:', e.message);
                clientWs.close(4003, 'Invalid setup message');
                return;
            }
        } else if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            // Relay Client → Gemini
            geminiWs.send(msg);
        } else {
            // Buffer if Gemini WS isn't open yet
            bufferedMessages.push(msg);
        }
    });

    clientWs.on('close', () => {
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.close();
        }
    });

    clientWs.on('error', (err) => {
        console.error('[Proxy] Client WS error:', err.message);
        if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.close();
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🛡️  API Proxy running on http://localhost:${PORT}`);
    console.log(`   POST /api/ai/chat        → OpenRouter`);
    console.log(`   POST /api/ai/embeddings  → OpenRouter`);
    console.log(`   WS   /api/gemini-live    → Gemini Live\n`);
});
