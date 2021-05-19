import { getUserMediaStream } from '@untemps/user-permissions-utils'

class SpeechRecognitionWrapper {
	static defaultOptions = {
		grammars: null,
		lang: 'en-US',
		continuous: false,
		interimResults: false,
		maxAlternatives: 1,
		serviceURI: null,
	}

	static eventTypes = {
		AUDIO_END: 'audioend',
		AUDIO_START: 'audiostart',
		END: 'end',
		ERROR: 'error',
		NO_MATCH: 'nomatch',
		RESULT: 'result',
		SOUND_END: 'soundend',
		SOUND_START: 'soundstart',
		SPEECH_END: 'speechend',
		SPEECH_START: 'speechstart',
		START: 'start',
	}

	static get isSupported() {
		return !!SpeechRecognitionWrapper._resolveSpeechRecognition()
	}

	static set isSupported(_) {
		throw new Error('You cannot set isSupported directly.')
	}

	_instance = null
	_listeners = null

	constructor(options) {
		const SpeechRecognition = SpeechRecognitionWrapper._resolveSpeechRecognition() || {}
		this._instance = new SpeechRecognition()
		this._listeners = {}

		Object.entries({
			...SpeechRecognitionWrapper.defaultOptions,
			...(options || {}),
		}).forEach(([key, value]) => {
			if (key === 'grammars' && !value) {
				const SpeechGrammarList = SpeechRecognitionWrapper._resolveSpeechGrammarList() || {}
				value = new SpeechGrammarList()
			}
			this._instance[key] = value
		})
	}

	get instance() {
		return this._instance
	}

	set instance(_) {
		throw new Error('You cannot set instance directly.')
	}

	async start() {
		if (!!this._instance) {
			try {
				const stream = await getUserMediaStream('microphone', { audio: true })
				if (!stream) {
					throw new Error('Unable to retrieve the stream from media device')
				}
				this._instance.start()
			} catch (error) {
				const errorHandler = this._listeners.error
				if (!!errorHandler) {
					errorHandler(error)
				}
			}
		}

		return this
	}

	stop() {
		if (!!this._instance) {
			this._instance.stop()
		}

		return this
	}

	abort() {
		if (!!this._instance) {
			this._instance.abort()
		}

		return this
	}

	addEventListener(eventType, callback) {
		if (!!this._instance && this._includesEventType(eventType)) {
			if (!!this._listeners[eventType]) {
				this.removeEventListener(eventType)
			}

			const handler = (event) => {
				let additionalArgs = []
				if (eventType === SpeechRecognitionWrapper.eventTypes.RESULT) {
					if (!!event.results && event.results.length > 0) {
						const transcripts = []
						for (let i = 0; i < event.results.length; ++i) {
							let mostConfident = { confidence: 0, transcript: '' }
							for (let j = 0; j < event.results[i].length; ++j) {
								if (
									event.results[i][j].confidence > mostConfident.confidence ||
									// Programmatic use (instance.say(...)) returns no confidence.
									event.results[i][j].confidence === undefined
								) {
									mostConfident = event.results[i][j]
								}
							}
							transcripts.push(mostConfident.transcript)
						}
						additionalArgs.push(transcripts.join(''))
					}
				}

				!!callback && callback.apply(this, [event, ...additionalArgs])
			}
			this._instance.addEventListener(eventType, handler)

			this._listeners[eventType] = handler
		}

		return this
	}

	removeEventListener(eventType) {
		const handler = this._listeners[eventType]
		this._instance.removeEventListener(eventType, handler)

		delete this._listeners[eventType]

		return this
	}

	cleanup() {
		this.stop()

		Object.keys(this._listeners).forEach((key) => this.removeEventListener(key))
		this._instance = null

		return this
	}

	_includesEventType(eventType) {
		return !!Object.values(SpeechRecognitionWrapper.eventTypes).find((type) => type === eventType)
	}

	static _resolveSpeechRecognition() {
		return (
			window.SpeechRecognition ||
			window.webkitSpeechRecognition ||
			window.mozSpeechRecognition ||
			window.msSpeechRecognition
		)
	}

	static _resolveSpeechGrammarList() {
		return (
			window.SpeechGrammarList ||
			window.webkitSpeechGrammarList ||
			window.mozSpeechGrammarList ||
			window.msSpeechGrammarList
		)
	}
}

export default SpeechRecognitionWrapper
