/**
 * AudioWorkletProcessor to capture audio with low latency.
 */
class VoiceProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 1024; // Lower buffer size for lower latency (approx 21ms at 48kHz)
        this._buffer = new Float32Array(this.bufferSize);
        this._ptr = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const channelData = input[0];

            // Copy data to internal buffer
            for (let i = 0; i < channelData.length; i++) {
                this._buffer[this._ptr++] = channelData[i];

                // If buffer full, send to main thread
                if (this._ptr >= this.bufferSize) {
                    this.port.postMessage(this._buffer);
                    this._ptr = 0;
                }
            }
        }
        return true;
    }
}

registerProcessor('voice-processor', VoiceProcessor);
