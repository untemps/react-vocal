import { getUserMediaStream } from '@untemps/user-permissions-utils'

class MediaRecorderWrapper {
	static eventTypes = {
		DATA_AVAILABLE: 'dataavailable',
		ERROR: 'error',
		PAUSE: 'pause',
		RESUME: 'resume',
		START: 'start',
		STOP: 'stop',
	}

	static get isSupported() {
		return !!MediaRecorderWrapper._resolveMediaRecorder()
	}

	static set isSupported(_) {
		throw new Error('You cannot set isSupported directly.')
	}

	_instance = null
	_listeners = null

	constructor(stream, options) {
		const MediaRecorder = MediaRecorderWrapper._resolveMediaRecorder() || {}
		this._instance = new MediaRecorder(stream, options)
		this._listeners = {}
	}

	get instance() {
		return this._instance
	}

	set instance(_) {
		throw new Error('You cannot set instance directly.')
	}

	start() {
		if (!!this._instance) {
			this._instance.start()
		}

		return this
	}

	stop() {
		if (!!this._instance) {
			this._instance.stop()
		}

		return this
	}

	addEventListener(eventType, callback) {
		if (!!this._instance && this._includesEventType(eventType)) {
			if (!!this._listeners[eventType]) {
				this.removeEventListener(eventType)
			}

			this._instance.addEventListener(eventType, callback)

			this._listeners[eventType] = callback
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
		this._listeners = null

		return this
	}

	_includesEventType(eventType) {
		return !!Object.values(MediaRecorderWrapper.eventTypes).find((type) => type === eventType)
	}

	static _resolveMediaRecorder() {
		let MediaRecorderClass =
			window.MediaRecorder || window.webkitMediaRecorder || window.mozMediaRecorder || window.msMediaRecorder
		if (!MediaRecorderClass) {
			MediaRecorderClass = require('audio-recorder-polyfill')
		}
		return MediaRecorderClass
	}
}

export default MediaRecorderWrapper
