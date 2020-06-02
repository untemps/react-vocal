import { EventDispatcher } from '@untemps/event-dispatcher'

class SpeechRecognition extends EventDispatcher {
	_maxAlternatives = 1
	_lang = ''
	_continuous = false
	_interimResults = false

	_started = false

	get maxAlternatives() {
		return this._maxAlternatives
	}

	set maxAlternatives(value) {
		if (typeof value === 'number') {
			this._maxAlternatives = Math.floor(value)
		} else {
			this._maxAlternatives = 0
		}
	}

	get lang() {
		return this._lang
	}

	set lang(value) {
		if (value === undefined) {
			value = 'undefined'
		}
		this._lang = value.toString()
	}

	get continuous() {
		return this._continuous
	}

	set continuous(value) {
		this._continuous = Boolean(value)
	}

	get interimResults() {
		return this._interimResults
	}

	set interimResults(value) {
		this._interimResults = Boolean(value)
	}

	get isStarted() {
		return this._started
	}

	set isStarted(value) {}

	constructor() {
		super()
	}

	start() {
		if (this._started) {
			throw new DOMException("Failed to execute 'start' on 'SpeechRecognition': recognition has already started.")
		}
		this._started = true
		this.dispatchEvent(new Event('start', { bubbles: false, cancelable: false, composed: false }))
	}

	abort() {
		if (!this._started) {
			return
		}
		this._started = false
		this.dispatchEvent(new Event('end', { bubbles: false, cancelable: false, composed: false }))
	}

	stop() {
		return this.abort()
	}

	say(sentence) {
		if (!this._started) {
			return
		}

		this.dispatchEvent(new Event('speechstart', { bubbles: false, cancelable: false, composed: false }))

		const resultEvent = new Event('result', { bubbles: false, cancelable: false, composed: false })
		resultEvent.resultIndex = 0
		resultEvent.results = [
			[
				{
					transcript: sentence,
					confidence: 1,
				},
			],
		]
		resultEvent.interpretation = null
		resultEvent.emma = null
		this.dispatchEvent(resultEvent)

		if (!this._continuous) {
			this.dispatchEvent(new Event('speechend', { bubbles: false, cancelable: false, composed: false }))
			this.abort()
		}
	}
}

export default {
	mock: () => {
		global.SpeechRecognition = SpeechRecognition
	},
	unmock: () => {
		delete global.SpeechRecognition
	},
}
