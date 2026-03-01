import { GoogleGenAI, Modality, Session, type LiveConnectConfig, type LiveServerMessage } from '@google/genai';
import type { LiveSessionStatus } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LiveSessionCallbacks {
    onTranscript: (text: string, sender: 'user' | 'ai') => void;
    onAudioLevel: (level: number, sender: 'user' | 'ai') => void;
    onFunctionCall: (name: string, args: Record<string, any>) => Promise<any>;
    onStatusChange: (status: LiveSessionStatus) => void;
    onError: (error: Error) => void;
}

export interface LiveSessionConfig {
    apiKey: string;
    model: string;
    systemPrompt: string;
    voiceName?: string;
    tools: any[];
    callbacks: LiveSessionCallbacks;
}

// ─── Audio helpers ───────────────────────────────────────────────────────────

function float32ToPcm16Base64(float32: Float32Array): string {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToPcm16Float32(base64: string): Float32Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
    }
    return float32;
}

function computeRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
        sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
}

// ─── Gemini Live Session ─────────────────────────────────────────────────────

export class GeminiLiveSession {
    private config: LiveSessionConfig;
    private ai: GoogleGenAI | null = null;
    private session: Session | null = null;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private processorNode: ScriptProcessorNode | null = null;
    private _isMicActive = false;
    private _status: LiveSessionStatus = 'idle';
    private playbackQueue: Float32Array[] = [];
    private isPlaying = false;
    private playbackContext: AudioContext | null = null;

    constructor(config: LiveSessionConfig) {
        this.config = config;
    }

    get isMicActive(): boolean {
        return this._isMicActive;
    }

    get status(): LiveSessionStatus {
        return this._status;
    }

    private setStatus(status: LiveSessionStatus) {
        this._status = status;
        this.config.callbacks.onStatusChange(status);
    }

    // ── Connect to Gemini Live API ───────────────────────────────────────────

    async connect(): Promise<void> {
        try {
            this.setStatus('connecting');

            this.ai = new GoogleGenAI({ apiKey: this.config.apiKey });

            const connectConfig: any = {
                responseModalities: [Modality.AUDIO, Modality.TEXT],
                systemInstruction: { parts: [{ text: this.config.systemPrompt }] },
                tools: [{ functionDeclarations: this.config.tools }],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: this.config.voiceName || 'Aoede',
                        },
                    },
                },
            };

            this.session = await this.ai.live.connect({
                model: this.config.model,
                config: connectConfig,
                callbacks: {
                    onopen: () => {
                        console.log('[GeminiLive] Connected');
                        this.setStatus('connected');
                    },
                    onmessage: (message: LiveServerMessage) => {
                        this.handleMessage(message);
                    },
                    onerror: (error: any) => {
                        console.error('[GeminiLive] Error:', error);
                        this.config.callbacks.onError(
                            error instanceof Error ? error : new Error(String(error))
                        );
                        this.setStatus('error');
                    },
                    onclose: (event: any) => {
                        console.log('[GeminiLive] Disconnected', event);
                        this.setStatus('disconnected');
                    },
                },
            });

            // Initialize playback context
            this.playbackContext = new AudioContext({ sampleRate: 24000 });

        } catch (error) {
            console.error('[GeminiLive] Connection failed:', error);
            this.config.callbacks.onError(
                error instanceof Error ? error : new Error(String(error))
            );
            this.setStatus('error');
            throw error;
        }
    }

    // ── Handle incoming messages ─────────────────────────────────────────────

    private handleMessage(message: LiveServerMessage) {
        // Handle server content (audio + text)
        if (message.serverContent) {
            const content = message.serverContent;

            // Model turn (partial or complete)
            if (content.modelTurn?.parts) {
                for (const part of content.modelTurn.parts) {
                    // Text transcript from model
                    if (part.text) {
                        this.config.callbacks.onTranscript(part.text, 'ai');
                    }
                    // Audio data from model
                    if (part.inlineData?.data) {
                        this.setStatus('ai_speaking');
                        this.enqueueAudio(part.inlineData.data);
                    }
                }
            }

            // Turn complete
            if (content.turnComplete) {
                this.setStatus(this._isMicActive ? 'listening' : 'connected');
            }
        }

        // Handle tool calls
        if (message.toolCall) {
            this.handleToolCallMessage(message.toolCall);
        }

        // Handle setup complete
        if (message.setupComplete) {
            console.log('[GeminiLive] Setup complete');
            this.setStatus('connected');
        }
    }

    // ── Function calling ─────────────────────────────────────────────────────

    private async handleToolCallMessage(toolCall: { functionCalls?: any[] }) {
        const functionCalls = toolCall.functionCalls ?? [];

        for (const fc of functionCalls) {
            console.log(`[GeminiLive] Tool call: ${fc.name}`, fc.args);
            try {
                const result = await this.config.callbacks.onFunctionCall(fc.name, fc.args ?? {});

                // Send tool response back using the correct SDK method
                if (this.session) {
                    this.session.sendToolResponse({
                        functionResponses: [{
                            id: fc.id,
                            name: fc.name,
                            response: result,
                        }],
                    });
                }
            } catch (error) {
                console.error(`[GeminiLive] Tool error (${fc.name}):`, error);
                if (this.session) {
                    this.session.sendToolResponse({
                        functionResponses: [{
                            id: fc.id,
                            name: fc.name,
                            response: { error: String(error) },
                        }],
                    });
                }
            }
        }
    }

    // ── Audio playback ───────────────────────────────────────────────────────

    private enqueueAudio(base64Data: string) {
        const samples = base64ToPcm16Float32(base64Data);

        // Compute RMS for visualizer
        const rms = computeRMS(samples);
        this.config.callbacks.onAudioLevel(Math.min(1, rms * 5), 'ai');

        this.playbackQueue.push(samples);
        if (!this.isPlaying) {
            this.playNextAudio();
        }
    }

    private playNextAudio() {
        if (!this.playbackContext || this.playbackQueue.length === 0) {
            this.isPlaying = false;
            this.config.callbacks.onAudioLevel(0, 'ai');
            return;
        }

        this.isPlaying = true;
        const samples = this.playbackQueue.shift()!;

        const buffer = this.playbackContext.createBuffer(1, samples.length, 24000);
        buffer.getChannelData(0).set(samples);

        const source = this.playbackContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.playbackContext.destination);

        source.onended = () => {
            this.playNextAudio();
        };

        source.start();
    }

    // ── Microphone control ───────────────────────────────────────────────────

    async startMicrophone(): Promise<void> {
        if (this._isMicActive) return;

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Use ScriptProcessorNode for audio processing
            this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processorNode.onaudioprocess = (event) => {
                if (!this._isMicActive || !this.session) return;

                const inputData = event.inputBuffer.getChannelData(0);

                // Compute RMS for visualizer
                const rms = computeRMS(inputData);
                this.config.callbacks.onAudioLevel(Math.min(1, rms * 8), 'user');

                // Convert to PCM16 base64 and send via sendRealtimeInput
                const audioBase64 = float32ToPcm16Base64(inputData);
                try {
                    this.session!.sendRealtimeInput({
                        audio: { data: audioBase64, mimeType: 'audio/pcm;rate=16000' },
                    });
                } catch (err) {
                    // Session might be closed
                    console.warn('[GeminiLive] Send audio error:', err);
                }
            };

            this.sourceNode.connect(this.processorNode);
            this.processorNode.connect(this.audioContext.destination);

            this._isMicActive = true;
            this.setStatus('listening');
        } catch (error) {
            console.error('[GeminiLive] Microphone error:', error);
            this.config.callbacks.onError(
                new Error('Impossible d\'accéder au microphone. Vérifiez les permissions.')
            );
        }
    }

    stopMicrophone(): void {
        this._isMicActive = false;
        this.config.callbacks.onAudioLevel(0, 'user');

        if (this.processorNode) {
            this.processorNode.disconnect();
            this.processorNode = null;
        }
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
            this.mediaStream = null;
        }

        if (this._status === 'listening') {
            this.setStatus('connected');
        }
    }

    toggleMicrophone(): boolean {
        if (this._isMicActive) {
            this.stopMicrophone();
            return false;
        } else {
            this.startMicrophone();
            return true;
        }
    }

    // ── Send text message ────────────────────────────────────────────────────

    sendText(message: string): void {
        if (!this.session) {
            console.warn('[GeminiLive] No active session');
            return;
        }

        this.config.callbacks.onTranscript(message, 'user');

        // Use sendClientContent for text messages
        this.session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: message }] }],
            turnComplete: true,
        });
    }

    // ── Disconnect ───────────────────────────────────────────────────────────

    async disconnect(): Promise<void> {
        this.stopMicrophone();

        if (this.playbackContext) {
            await this.playbackContext.close();
            this.playbackContext = null;
        }

        this.playbackQueue = [];
        this.isPlaying = false;

        if (this.session) {
            try {
                this.session.close();
            } catch {
                // Ignore close errors
            }
            this.session = null;
        }

        this.ai = null;
        this.setStatus('disconnected');
    }
}
