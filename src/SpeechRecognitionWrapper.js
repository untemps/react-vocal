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
		return (
			!!window.SpeechRecognition ||
			!!window.webkitSpeechRecognition ||
			!!window.mozSpeechRecognition ||
			!!window.msSpeechRecognition
		)
	}

	static set isSupported(_) {
		throw new Error('You cannot set isSupported directly.')
	}

	_instance = null
	_listeners = null

	constructor(options) {
		const SpeechRecognition =
			window.SpeechRecognition ||
			window.webkitSpeechRecognition ||
			window.mozSpeechRecognition ||
			window.msSpeechRecognition ||
			{}
		this._instance = new SpeechRecognition()
		this._listeners = {}

		if(!!options && !options.grammars) {
			const SpeechGrammarList =
				window.SpeechGrammarList ||
				window.webkitSpeechGrammarList ||
				window.mozSpeechGrammarList ||
				window.msSpeechGrammarList ||
				{}
			this._instance.grammars = new SpeechGrammarList()
		}

		Object.entries({ ...SpeechRecognitionWrapper.defaultOptions, ...(options || {}) }).forEach(
			([key, value]) => (this._instance[key] = value)
		)
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

	addEventListener(type, callback) {
		if (!!this._instance && this._includesEventType(type)) {
			if (!!this._listeners[type]) {
				this.removeEventListener(type)
			}

			const handler = (event) => {
				let additionalArgs = []
				if (type === SpeechRecognitionWrapper.eventTypes.RESULT) {
					if (!!event.results && event.results.length > 0) {
						additionalArgs.push(event.results[0][0].transcript)
					}
				}

				!!callback && callback.apply(this, [...additionalArgs, event])
			}
			this._instance.addEventListener(type, (e) => handler(e))

			this._listeners[type] = handler
		}

		return this
	}

	removeEventListener(type) {
		const handler = this._listeners[type]
		this._instance.removeEventListener(type, handler)

		delete this._listeners[type]

		return this
	}

	cleanup() {
		this.stop()

		Object.keys(this._listeners).forEach((key) => this.removeEventListener(key))
		this._instance = null

		return this
	}

	_includesEventType = (eventType) =>
		Object.values(SpeechRecognitionWrapper.eventTypes).find((type) => type === eventType)
}

export default SpeechRecognitionWrapper
