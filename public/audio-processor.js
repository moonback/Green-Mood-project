/**
 * AudioWorklet processor — runs on the audio rendering thread (separate from the main JS thread).
 * Receives raw mic samples, downsamples them to the target rate (default 16kHz for Gemini),
 * and forwards the already-resampled Float32 chunks to the main thread via MessagePort.
 *
 * Downsampling is done here (in the worklet thread) instead of the main JS thread to avoid
 * saturating the main thread and causing UI micro-stutters.
 *
 * Registered as 'mic-processor'. Pass `processorOptions: { targetRate: 16000 }` when creating
 * the AudioWorkletNode. The main thread only needs to do float32→PCM16 + Base64 encode.
 */
class MicProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        // sampleRate is a global in the AudioWorklet scope (the browser's capture sample rate)
        this.targetRate = options?.processorOptions?.targetRate ?? 16000;
        this.ratio = sampleRate / this.targetRate;

        // Accumulate enough input samples to produce a meaningful downsampled chunk
        // 2048 input samples → ~683 output samples at 3:1 ratio (48kHz→16kHz)
        this.inputBuffer = new Float32Array(2048);
        this.writeIdx = 0;
    }

    /**
     * Downsample a Float32Array from the capture rate to targetRate using averaging.
     * @param {Float32Array} buf - Input samples at capture rate
     * @returns {Float32Array} - Downsampled samples at targetRate
     */
    _downsample(buf) {
        const outLen = Math.floor(buf.length / this.ratio);
        const out = new Float32Array(outLen);
        for (let i = 0; i < outLen; i++) {
            const start = Math.floor(i * this.ratio);
            const end = Math.min(Math.floor((i + 1) * this.ratio), buf.length);
            let sum = 0;
            for (let j = start; j < end; j++) sum += buf[j];
            out[i] = sum / (end - start);
        }
        return out;
    }

    process(inputs) {
        const input = inputs[0]?.[0];
        if (!input) return true;

        for (let i = 0; i < input.length; i++) {
            this.inputBuffer[this.writeIdx++] = input[i];

            if (this.writeIdx >= this.inputBuffer.length) {
                // Downsample on the worklet thread, send resampled chunk to main thread
                const downsampled = this._downsample(this.inputBuffer);
                this.port.postMessage(downsampled, [downsampled.buffer]);
                this.writeIdx = 0;
            }
        }
        return true;
    }
}

registerProcessor('mic-processor', MicProcessor);
