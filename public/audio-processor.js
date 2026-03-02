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
    process(inputs) {
        const channel = inputs[0]?.[0];
        if (channel && channel.length > 0) {
            // Transfer the buffer to avoid a copy where possible
            const copy = channel.slice();
            this.port.postMessage(copy, [copy.buffer]);
        }
        // Return true to keep the processor alive
        return true;
    }
}

registerProcessor('mic-processor', MicProcessor);
