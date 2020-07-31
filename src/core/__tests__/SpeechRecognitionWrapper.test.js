import SpeechRecognitionWrapper from '../SpeechRecognitionWrapper'

describe('SpeechRecognitionWrapper', () => {
	it('throws error when setting isSupported explicitly', () => {
		expect(() => (SpeechRecognitionWrapper.isSupported = false)).toThrow()
	})

	it('throws error when setting instance explicitly', () => {
		const wrapper = new SpeechRecognitionWrapper()
		expect(() => (wrapper.instance = null)).toThrow()
	})
})
