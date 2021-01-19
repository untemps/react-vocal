import { getUserMediaStream } from '@untemps/user-permissions-utils'
import { EventDispatcher } from '@untemps/event-dispatcher'

import VocalAnalyser from './VocalAnalyser'
import MediaRecorderWrapper from './MediaRecorderWrapper'

class VocalConverter extends EventDispatcher {
	static eventTypes = {
		BLOB_AVAILABLE: 'blobavailable',
		ERROR: 'error',
	}

	_recorder = null
	_analyser = null

	constructor() {
		super()
	}

	static get isSupported() {
		return MediaRecorderWrapper.isSupported && VocalAnalyser.isSupported
	}

	static set isSupported(_) {
		throw new Error('You cannot set isSupported directly.')
	}

	async start() {
		try {
			const stream = await getUserMediaStream('microphone', { audio: true })
			if (!stream) {
				throw new Error('Unable to retrieve the stream from media device')
			}

			this._recorder = new MediaRecorderWrapper(stream)
			const audioChunks = []
			this._recorder.addEventListener('dataavailable', (event) => {
				audioChunks.push(event.data)
			})
			this._recorder.addEventListener('stop', () => {
				const blob = new Blob(audioChunks, { type: 'audio/wav' })
				this.dispatchEvent(new CustomEvent('blobavailable', { detail: blob }))
			})
			this._recorder.addEventListener('error', (event) => {
				throw event.error
			})

			this._analyser = new VocalAnalyser(stream)
			this._analyser.addEventListener('start', () => {
				this._recorder.start()
			})
			this._analyser.addEventListener('end', () => {
				this._recorder.stop()
			})
			this._analyser.addEventListener('error', (event) => {
				throw event.error
			})
			this._analyser.start()
		} catch (error) {
			this.dispatchEvent(new ErrorEvent('error', { message: error.message, error }))
		}
	}

	stop() {
		this._recorder.cleanup()
		this._analyser.cleanup()
	}
}

export default VocalConverter
