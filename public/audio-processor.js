/**
 * AudioWorklet processor — runs on the audio rendering thread (separate from the main JS thread).
 * Receives raw mic samples from the browser engine and forwards them to the main thread via MessagePort.
 *
 * Registered as 'mic-processor'. The main thread creates an AudioWorkletNode with this name,
 * calls node.port.onmessage to receive Float32 chunks, and then downsamples + converts to PCM16
 * before sending over the WebSocket.
 *
 * Buffer size equivalent: The Web Audio engine calls process() every 128 samples (fixed).
 * At 48kHz that's ~2.67ms per call — far lower latency than ScriptProcessorNode (which needed
 * at least 256 samples and typically 4096 to avoid glitches).
 */
class MicProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = new Float32Array(2048);
        this.writeIdx = 0;
    }

    process(inputs) {
        const input = inputs[0]?.[0];
        if (!input) return true;

        for (let i = 0; i < input.length; i++) {
            this.buffer[this.writeIdx++] = input[i];

            if (this.writeIdx >= this.buffer.length) {
                // Send a copy to the main thread
                const copy = this.buffer.slice();
                this.port.postMessage(copy, [copy.buffer]);
                this.writeIdx = 0;
            }
        }
        return true;
    }
}

registerProcessor('mic-processor', MicProcessor);
