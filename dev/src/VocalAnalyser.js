// Analyser algorithm from https://github.com/latentflip/hark
import { EventDispatcher } from '@untemps/event-dispatcher'

class VocalAnalyser extends EventDispatcher {
	static defaultOptions = {
		smoothing: 0.1,
		interval: 50,
		threshold: -50,
		history: 10,
	}

	static eventTypes = {
		END: 'end',
		ERROR: 'error',
		SPEECH_END: 'speechend',
		SPEECH_START: 'speechstart',
		START: 'start',
	}

	static get isSupported() {
		return !!VocalAnalyser._resolveAudioContext()
	}

	static set isSupported(_) {
		throw new Error('You cannot set isSupported directly.')
	}

	_stream = null
	_isRunning = false
	_timeout = null

	constructor(stream, options) {
		super()

		this._stream = stream

		Object.entries({
			...VocalAnalyser.defaultOptions,
			...(options || {}),
		}).forEach(([key, value]) => {
			this[key] = value
		})
	}

	start() {
		try {
			this._isRunning = true
			this.dispatchEvent(new Event('start'))

			const audioContext = new AudioContext(this._stream)

			const sourceNode = audioContext.createMediaStreamSource(this._stream)

			const gainNode = audioContext.createGain()
			gainNode.gain.value = 0
			gainNode.connect(audioContext.destination)

			const analyser = audioContext.createAnalyser()
			analyser.fftSize = 512
			analyser.smoothingTimeConstant = this.smoothing
			const fftBins = new Float32Array(analyser.fftSize)
			sourceNode.connect(analyser)

			let isSpeaking = false

			const speakingHistory = Array(this.history).fill(0, 0, this.history)

			const looper = () => {
				this._timeout = setTimeout(() => {
					if (!this._isRunning) {
						return
					}

					const currentVolume = this._getMaxVolume(analyser, fftBins)

					let history = 0
					if (currentVolume > this.threshold && !isSpeaking) {
						for (let i = speakingHistory.length - 3; i < speakingHistory.length; i++) {
							history += speakingHistory[i]
						}
						if (history >= 2) {
							isSpeaking = true
							this.dispatchEvent(new Event('speechstart'))
						}
					} else if (currentVolume < this.threshold && isSpeaking) {
						for (let j = 0; j < speakingHistory.length; j++) {
							history += speakingHistory[j]
						}
						if (history === 0) {
							isSpeaking = false
							this.dispatchEvent(new Event('speechend'))

							this.stop()
						}
					}
					speakingHistory.shift()
					speakingHistory.push(0 + (currentVolume > this.threshold))

					looper()
				}, this.interval)
			}
			looper()
		} catch (error) {
			this.dispatchEvent(new ErrorEvent('error', { message: error.message, error }))
		}

		return this
	}

	stop() {
		this._isRunning = false
		this.dispatchEvent(new Event('end'))

		if (!!this._timeout) {
			clearTimeout(this._timeout)
			this._timeout = null
		}

		return this
	}

	_getMaxVolume(analyser, fftBins) {
		let maxVolume = -Infinity
		analyser.getFloatFrequencyData(fftBins)
		for (let i = 4, ii = fftBins.length; i < ii; i++) {
			if (fftBins[i] > maxVolume && fftBins[i] < 0) {
				maxVolume = fftBins[i]
			}
		}
		return maxVolume
	}

	static _resolveAudioContext() {
		return window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext
	}
}

export default VocalAnalyser
