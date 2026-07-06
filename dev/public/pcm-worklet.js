const TARGET_SAMPLES = 1600

class PCMProcessor extends AudioWorkletProcessor {
	constructor() {
		super()
		this._chunks = []
		this._count = 0
		this.port.onmessage = (event) => {
			if (event.data === 'flush') {
				this._flush()
				this.port.postMessage('flushed')
			}
		}
	}

	_flush() {
		if (this._count === 0) return
		const pcm = new Int16Array(this._count)
		let offset = 0
		for (const chunk of this._chunks) {
			for (let i = 0; i < chunk.length; i++) {
				const s = Math.max(-1, Math.min(1, chunk[i]))
				pcm[offset++] = s < 0 ? s * 0x8000 : s * 0x7fff
			}
		}
		this.port.postMessage(pcm.buffer, [pcm.buffer])
		this._chunks = []
		this._count = 0
	}

	process(inputs) {
		const channel = inputs[0]?.[0]
		if (channel) {
			this._chunks.push(channel.slice(0))
			this._count += channel.length

			if (this._count >= TARGET_SAMPLES) this._flush()
		}
		return true
	}
}

registerProcessor('pcm-processor', PCMProcessor)
