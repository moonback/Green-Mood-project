/**
 * AudioWorklet processor — runs on the audio rendering thread (separate from the main JS thread).
 *
 * Responsibilities moved from main thread:
 * 1) Downsample mic input to 16kHz
 * 2) Convert Float32 -> PCM16
 * 3) Basic VAD gating (skip pure-silence frames)
 */
class MicProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();

        const processorOptions = options?.processorOptions ?? {};
        this.targetSampleRate = processorOptions.targetSampleRate ?? 16000;
        this.frameSize = processorOptions.frameSize ?? 320; // 20ms @ 16kHz
        this.vadThreshold = processorOptions.vadThreshold ?? 0.008;
        this.vadHangoverFrames = processorOptions.vadHangoverFrames ?? 12;

        this.sourceSampleRate = sampleRate;
        this.resampleRatio = this.sourceSampleRate / this.targetSampleRate;
        this.resampleCursor = 0;

        this.frameBuffer = new Float32Array(this.frameSize);
        this.frameWrite = 0;
        this.silentFrames = this.vadHangoverFrames;

        this.port.onmessage = (event) => {
            const data = event.data ?? {};
            if (data.type !== 'configure') return;
            this.targetSampleRate = data.targetSampleRate ?? this.targetSampleRate;
            this.frameSize = data.frameSize ?? this.frameSize;
            this.vadThreshold = data.vadThreshold ?? this.vadThreshold;
            this.vadHangoverFrames = data.vadHangoverFrames ?? this.vadHangoverFrames;
            this.resampleRatio = this.sourceSampleRate / this.targetSampleRate;
            this.resampleCursor = 0;
            this.frameBuffer = new Float32Array(this.frameSize);
            this.frameWrite = 0;
            this.silentFrames = this.vadHangoverFrames;
        };
    }

    flushFrame() {
        if (this.frameWrite < this.frameSize) return;

        let sumSquares = 0;
        for (let i = 0; i < this.frameSize; i++) {
            const sample = this.frameBuffer[i];
            sumSquares += sample * sample;
        }
        const rms = Math.sqrt(sumSquares / this.frameSize);
        const hasVoice = rms >= this.vadThreshold;

        if (hasVoice) {
            this.silentFrames = 0;
        } else {
            this.silentFrames += 1;
        }

        if (hasVoice || this.silentFrames <= this.vadHangoverFrames) {
            const pcm16 = new Int16Array(this.frameSize);
            for (let i = 0; i < this.frameSize; i++) {
                const s = Math.max(-1, Math.min(1, this.frameBuffer[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            this.port.postMessage({ type: 'pcm16', payload: pcm16.buffer }, [pcm16.buffer]);
        }

        this.frameWrite = 0;
    }

    process(inputs) {
        const input = inputs[0]?.[0];
        if (!input || input.length === 0) return true;

        if (!isFinite(this.resampleRatio) || this.resampleRatio <= 0) return true;

        while (this.resampleCursor < input.length) {
            const idx = Math.floor(this.resampleCursor);
            const nextIdx = Math.min(idx + 1, input.length - 1);
            const frac = this.resampleCursor - idx;
            const sample = input[idx] + (input[nextIdx] - input[idx]) * frac;

            this.frameBuffer[this.frameWrite++] = sample;
            this.resampleCursor += this.resampleRatio;

            if (this.frameWrite >= this.frameSize) {
                this.flushFrame();
            }
        }

        this.resampleCursor -= input.length;
        return true;
    }
}

registerProcessor('mic-processor', MicProcessor);
