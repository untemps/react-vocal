import { classifyError, type VocalErrorType } from '../Vocal'

describe('classifyError', () => {
	describe('SpeechRecognitionErrorEvent shapes', () => {
		it.each<[string, VocalErrorType]>([
			['no-speech', 'no-speech'],
			['network', 'network'],
			['audio-capture', 'audio-capture'],
			['service-not-allowed', 'service-not-allowed'],
			['not-allowed', 'permission-denied'],
			['aborted', 'aborted'],
		])('maps SR error "%s" to type "%s"', (srErrorCode, expectedType) => {
			const event = { error: srErrorCode, message: `SR ${srErrorCode}` }
			expect(classifyError(event)).toEqual({
				type: expectedType,
				message: `SR ${srErrorCode}`,
				original: event,
			})
		})

		it('falls back to "unknown" for unrecognized SR error codes', () => {
			const event = { error: 'language-not-supported', message: 'lang error' }
			expect(classifyError(event)).toEqual({
				type: 'unknown',
				message: 'lang error',
				original: event,
			})
		})

		it('uses the SR error code as message when message is missing', () => {
			const event = { error: 'no-speech' }
			expect(classifyError(event)).toEqual({
				type: 'no-speech',
				message: 'no-speech',
				original: event,
			})
		})
	})

	describe('DOMException shapes', () => {
		it.each<[string, VocalErrorType]>([
			['NotAllowedError', 'permission-denied'],
			['NotFoundError', 'audio-capture'],
			['NotReadableError', 'audio-capture'],
			['AbortError', 'aborted'],
		])('maps DOMException name "%s" to type "%s"', (name, expectedType) => {
			const exception = new DOMException('Some details', name)
			expect(classifyError(exception)).toEqual({
				type: expectedType,
				message: 'Some details',
				original: exception,
			})
		})

		it('uses the DOMException name as message when message is empty', () => {
			const exception = new DOMException('', 'NotAllowedError')
			expect(classifyError(exception)).toEqual({
				type: 'permission-denied',
				message: 'NotAllowedError',
				original: exception,
			})
		})

		it('falls through to "unknown" for unrecognized DOMException names', () => {
			// Unrecognized DOMException name with an empty message falls back to 'unknown',
			// not the name (unlike the recognized-name branch above).
			const exception = new DOMException('', 'SomeUnknownError')
			expect(classifyError(exception)).toEqual({
				type: 'unknown',
				message: 'unknown',
				original: exception,
			})
		})
	})

	describe('generic and edge values', () => {
		it('classifies a generic Error as "unknown" with its message', () => {
			const err = new Error('Boom')
			expect(classifyError(err)).toEqual({ type: 'unknown', message: 'Boom', original: err })
		})

		it('falls back to "unknown" message when a generic Error has no message', () => {
			const err = new Error('')
			expect(classifyError(err)).toEqual({ type: 'unknown', message: 'unknown', original: err })
		})

		it('classifies a non-Error string as "unknown" using the string as message', () => {
			expect(classifyError('weird string')).toEqual({
				type: 'unknown',
				message: 'weird string',
				original: 'weird string',
			})
		})

		it.each([null, undefined, 42, true, { foo: 'bar' }, ''])(
			'classifies non-Error value %p as "unknown" with fallback message',
			(value) => {
				expect(classifyError(value)).toEqual({
					type: 'unknown',
					message: 'unknown',
					original: value,
				})
			}
		)
	})
})
