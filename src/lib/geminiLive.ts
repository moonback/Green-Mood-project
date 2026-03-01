/**
 * geminiLive.ts — Gestionnaire de session Gemini 2.5 Flash Native Audio Live
 *
 * Gère la connexion WebSocket bidirectionnelle avec l'API Gemini Live.
 * Capture l'audio micro (PCM 16kHz), l'envoie à l'API, reçoit l'audio
 * généré (PCM 24kHz) et le joue via l'AudioContext.
 */

import { GoogleGenAI, Modality, Type } from '@google/genai';

// ─── Constants ───────────────────────────────────────────────────────────────

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
const MIC_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeminiLiveCallbacks {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (err: Error) => void;
    onTranscript?: (text: string, role: 'user' | 'model') => void;
    onSpeakingChange?: (isSpeaking: boolean) => void;
    onToolCall?: (toolCall: any) => void;
}

// ─── AudioWorklet source (inline, injected as Blob URL) ──────────────────────

const WORKLET_CODE = `
class MicProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0]?.[0];
        if (input) {
            const buf = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
                buf[i] = Math.max(-32768, Math.min(32767, Math.round(input[i] * 32767)));
            }
            this.port.postMessage(buf.buffer, [buf.buffer]);
        }
        return true;
    }
}
registerProcessor('mic-processor', MicProcessor);
`;

// ─── GeminiLiveSession ────────────────────────────────────────────────────────

export class GeminiLiveSession {
    private genAI: GoogleGenAI;
    private session: any = null;
    private callbacks: GeminiLiveCallbacks;

    // Audio capture
    private audioContext: AudioContext | null = null;
    private micStream: MediaStream | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;

    // Audio playback — scheduled to avoid gaps between chunks
    private playbackContext: AudioContext | null = null;
    private nextPlayTime = 0; // when the next chunk should start

    // State
    private isConnected = false;
    private isMuted = false;
    private hasErrored = false; // prevent onclose from overriding error state

    constructor(apiKey: string, callbacks: GeminiLiveCallbacks) {
        this.genAI = new GoogleGenAI({ apiKey });
        this.callbacks = callbacks;
    }

    // ── Connect & start session ────────────────────────────────────────────────

    async connect(systemInstruction: string): Promise<void> {
        if (this.isConnected) return;
        this.hasErrored = false;

        console.log('[GeminiLive] Connecting to model:', MODEL_NAME);

        try {
            this.session = await this.genAI.live.connect({
                model: MODEL_NAME,
                callbacks: {
                    onopen: () => {
                        console.log('[GeminiLive] ✅ WebSocket onopen — session active');
                        this.isConnected = true;
                        this.callbacks.onOpen?.();
                    },

                    onmessage: (message: any) => {
                        console.log('[GeminiLive] onmessage:', JSON.stringify(message).slice(0, 200));
                        this._handleMessage(message);
                    },

                    onerror: (err: any) => {
                        console.error('[GeminiLive] ❌ onerror:', err);
                        this.hasErrored = true;
                        const error = err instanceof Error ? err : new Error(String(err));
                        this.callbacks.onError?.(error);
                    },

                    onclose: (evt: any) => {
                        console.log('[GeminiLive] onclose — code:', evt?.code, 'reason:', evt?.reason);
                        this.isConnected = false;
                        // Only notify close if we didn't already signal an error
                        if (!this.hasErrored) {
                            this.callbacks.onClose?.();
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    tools: [
                        {
                            functionDeclarations: [
                                {
                                    name: 'add_to_cart',
                                    description: 'Ajoute un produit spécifique au panier. Utilise cette fonction dès que le client confirme son intention d\'achat.',
                                    parameters: {
                                        type: Type.OBJECT,
                                        properties: {
                                            product_slug: {
                                                type: Type.STRING,
                                                description: 'Le slug (identifiant technique) du produit tel qu\'il apparaît dans le catalogue. Obligatoire.',
                                            },
                                            product_name: {
                                                type: Type.STRING,
                                                description: 'Le nom affiché du produit (ex: Amnesia Haze).',
                                            },
                                        },
                                        required: ['product_slug'],
                                    },
                                },
                            ],
                        },
                    ],
                    systemInstruction: {
                        parts: [{ text: systemInstruction }],
                    },
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: 'Aoede',
                            },
                        },
                    },
                },
            });

            console.log('[GeminiLive] live.connect() resolved, starting mic...');

            // Start capturing microphone
            await this._startMicCapture();

            console.log('[GeminiLive] Mic capture started');

        } catch (err) {
            console.error('[GeminiLive] connect() threw:', err);
            this.hasErrored = true;
            const error = err instanceof Error ? err : new Error(String(err));
            this.callbacks.onError?.(error);
            throw error;
        }
    }

    // ── Message handler ────────────────────────────────────────────────────────

    private _handleMessage(message: any): void {
        console.log('[GeminiLive] message received:', JSON.stringify(message).slice(0, 500));

        // 1. Setup Complete
        if (message?.setupComplete) {
            console.log('[GeminiLive] Setup complete acknowledgement received.');
        }

        // 2. Server Content (Audio/Text from model)
        const serverContent = message?.serverContent;
        if (serverContent) {
            const modelTurn = serverContent.modelTurn;
            if (modelTurn?.parts) {
                let hasAudio = false;
                for (const part of modelTurn.parts) {
                    if (part.inlineData?.mimeType?.startsWith('audio/pcm') || part.inlineData?.mimeType?.startsWith('audio/l16')) {
                        hasAudio = true;
                        try {
                            const raw = atob(part.inlineData.data);
                            const buf = new ArrayBuffer(raw.length);
                            const view = new Uint8Array(buf);
                            for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
                            this.enqueueAudio(buf);
                        } catch (e) {
                            console.error('[GeminiLive] audio decode error:', e);
                        }
                    }
                    if (part.text) {
                        console.log('[GeminiLive] Model text:', part.text.slice(0, 100));
                        this.callbacks.onTranscript?.(part.text, 'model');
                    }
                    if (part.functionCall) {
                        console.log('[GeminiLive] 🛠️ Nested functionCall detected in part:', part.functionCall.name);
                        const toolCall = { functionCalls: [part.functionCall] };
                        this.callbacks.onToolCall?.(toolCall);
                        this.sendToolResponse(toolCall);
                    }
                }
                if (hasAudio) this.callbacks.onSpeakingChange?.(true);
            }

            if (serverContent.turnComplete) {
                console.log('[GeminiLive] turnComplete');
                this.callbacks.onSpeakingChange?.(false);
                // Reset scheduled playback time so next response starts immediately
                if (this.playbackContext) {
                    this.nextPlayTime = this.playbackContext.currentTime;
                }
            }
        }

        // 3. Tool calls (Function calls from model - top level)
        const toolCall = message?.toolCall;
        if (toolCall) {
            console.log('[GeminiLive] 🛠️ Top-level toolCall received:', JSON.stringify(toolCall));
            // Robustness: Ensure functionCalls is always an array if it's missing but function_calls is present
            if (!toolCall.functionCalls && toolCall.function_calls) {
                toolCall.functionCalls = toolCall.function_calls;
            }
            this.callbacks.onToolCall?.(toolCall);
            // Automatically respond to tool call to acknowledge
            this.sendToolResponse(toolCall);
        }

        // 4. Input transcription (user speech → text)
        const inputTranscript = message?.inputTranscription;
        if (inputTranscript?.text) {
            console.log('[GeminiLive] User said:', inputTranscript.text.slice(0, 100));
            this.callbacks.onTranscript?.(inputTranscript.text, 'user');
        }

        // 5. Output transcription
        const outputTranscript = message?.outputTranscription;
        if (outputTranscript?.text) {
            this.callbacks.onTranscript?.(outputTranscript.text, 'model');
        }
    }

    // ── Microphone capture via AudioWorklet ────────────────────────────────────

    private async _startMicCapture(): Promise<void> {
        this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: MIC_SAMPLE_RATE,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        });

        this.audioContext = new AudioContext({ sampleRate: MIC_SAMPLE_RATE });

        // Inject worklet as Blob URL
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);

        this.sourceNode = this.audioContext.createMediaStreamSource(this.micStream);
        this.workletNode = new AudioWorkletNode(this.audioContext, 'mic-processor');

        this.workletNode.port.onmessage = (event: MessageEvent) => {
            if (this.isMuted || !this.session || !this.isConnected) return;

            const int16Buffer: ArrayBuffer = event.data;
            const bytes = new Uint8Array(int16Buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Audio = btoa(binary);

            try {
                this.session.sendRealtimeInput({
                    audio: {
                        data: base64Audio,
                        mimeType: `audio/pcm;rate=${MIC_SAMPLE_RATE}`,
                    },
                });
            } catch (e) {
                // Session might have closed during sending
                console.warn('[GeminiLive] sendRealtimeInput error:', e);
            }
        };

        this.sourceNode.connect(this.workletNode);
        // Do NOT connect workletNode to audio destination (no mic echo)
    }

    // ── Audio playback — gapless scheduled ──────────────────────────────────────

    private enqueueAudio(buffer: ArrayBuffer): void {
        if (!this.playbackContext || this.playbackContext.state === 'closed') {
            this.playbackContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
            this.nextPlayTime = this.playbackContext.currentTime;
        }

        // Resume if suspended (browser autoplay policy)
        if (this.playbackContext.state === 'suspended') {
            this.playbackContext.resume();
        }

        const ctx = this.playbackContext;
        const int16 = new Int16Array(buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
        audioBuffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        // Schedule this chunk to start right after the previous one
        const startAt = Math.max(this.nextPlayTime, ctx.currentTime);
        source.start(startAt);
        this.nextPlayTime = startAt + audioBuffer.duration;
    }

    // ── Controls ───────────────────────────────────────────────────────────────

    setMuted(muted: boolean): void {
        this.isMuted = muted;
        console.log('[GeminiLive] Mic muted:', muted);
    }

    isMicMuted(): boolean { return this.isMuted; }
    isActive(): boolean { return this.isConnected; }

    sendText(text: string): void {
        if (!this.session || !this.isConnected) return;
        this.session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text }] }],
            turnComplete: true,
        });
    }

    sendToolResponse(toolCall: any): void {
        if (!this.session || !this.isConnected) return;

        // Support both functionCalls and function_calls
        const functionCalls = toolCall.functionCalls || toolCall.function_calls || [];
        if (functionCalls.length === 0) return;

        console.log('[GeminiLive] Sending tool response for IDs:', functionCalls.map((fc: any) => fc.id || fc.call_id || fc.callId));

        this.session.sendToolResponse({
            functionResponses: functionCalls.map((fc: any) => ({
                id: fc.id || fc.call_id || fc.callId,
                name: fc.name,
                response: { success: true },
            })),
        });
    }

    // ── Cleanup ────────────────────────────────────────────────────────────────

    async disconnect(): Promise<void> {
        console.log('[GeminiLive] disconnect()');

        this.workletNode?.disconnect();
        this.sourceNode?.disconnect();
        this.workletNode = null;
        this.sourceNode = null;

        if (this.micStream) {
            this.micStream.getTracks().forEach(t => t.stop());
            this.micStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            await this.audioContext.close().catch(() => { });
        }
        this.audioContext = null;

        if (this.playbackContext && this.playbackContext.state !== 'closed') {
            await this.playbackContext.close().catch(() => { });
        }
        this.playbackContext = null;

        if (this.session) {
            try { this.session.close(); } catch { }
            this.session = null;
        }

        this.isConnected = false;
    }
}
