import { renderHook } from '@testing-library/react-hooks'

import SpeechRecognitionWrapper from '../../core/SpeechRecognitionWrapper'
import useVocal from '../useVocal'

jest.mock('../../core/SpeechRecognitionWrapper')

describe('useVocal', () => {
	const mockStart = jest.fn()
	const mockStop = jest.fn()
	const mockAbort = jest.fn()
	const mockAddEventListener = jest.fn()
	const mockRemoveEventListener = jest.fn()
	const mockCleanup = jest.fn()

	const mockIsSupported = jest.fn()
	Object.defineProperty(SpeechRecognitionWrapper, 'isSupported', {
		get: mockIsSupported,
	})

	describe('with no SpeechRecognition support', () => {
		beforeAll(() => {
			mockIsSupported.mockReturnValue(false)
		})

		it('cannot create SpeechRecognition instance', () => {
			const {
				result: {
					current: [ref],
				},
			} = renderHook(() => useVocal())
			expect(ref.current).toBeNull()
		})

		it('not triggers start function', () => {
			const {
				result: {
					current: [, { start }],
				},
			} = renderHook(() => useVocal())
			start()
			expect(mockStart).not.toHaveBeenCalled()
		})

		it('not triggers stop function', () => {
			const {
				result: {
					current: [, { stop }],
				},
			} = renderHook(() => useVocal())
			stop()
			expect(mockStop).not.toHaveBeenCalled()
		})

		it('not triggers abort function', () => {
			const {
				result: {
					current: [, { abort }],
				},
			} = renderHook(() => useVocal())
			abort()
			expect(mockAbort).not.toHaveBeenCalled()
		})

		it('not triggers clean function', () => {
			const {
				result: {
					current: [, { clean }],
				},
			} = renderHook(() => useVocal())
			clean()
			expect(mockCleanup).not.toHaveBeenCalled()
		})

		it('not triggers subscribe function', () => {
			const {
				result: {
					current: [, { subscribe }],
				},
			} = renderHook(() => useVocal())
			subscribe('foo', jest.fn())
			expect(mockAddEventListener).not.toHaveBeenCalled()
		})

		it('not triggers unsubscribe function', () => {
			const {
				result: {
					current: [, { unsubscribe }],
				},
			} = renderHook(() => useVocal())
			unsubscribe('foo', jest.fn())
			expect(mockRemoveEventListener).not.toHaveBeenCalled()
		})
	})

	describe('with SpeechRecognition support', () => {
		beforeAll(() => {
			mockIsSupported.mockReturnValue(true)
		})

		beforeEach(() => {
			SpeechRecognitionWrapper.mockImplementation(() => {
				return {
					start: mockStart,
					stop: mockStop,
					abort: mockAbort,
					addEventListener: mockAddEventListener,
					removeEventListener: mockRemoveEventListener,
					cleanup: mockCleanup,
				}
			})
		})

		afterEach(() => {
			SpeechRecognitionWrapper.mockReset()
		})

		it('creates SpeechRecognition instance', () => {
			const {
				result: {
					current: [ref],
				},
			} = renderHook(() => useVocal())
			expect(ref.current).toBeDefined()
		})

		it('uses custom SpeechRecognition instance', () => {
			const foo = new SpeechRecognitionWrapper()
			const {
				result: {
					current: [ref],
				},
			} = renderHook(() => useVocal(null, null, foo))
			expect(ref.current).toBe(foo)
		})

		it('triggers start function', () => {
			const {
				result: {
					current: [, { start }],
				},
			} = renderHook(() => useVocal())
			start()
			expect(mockStart).toHaveBeenCalled()
		})

		it('triggers stop function', () => {
			const {
				result: {
					current: [, { stop }],
				},
			} = renderHook(() => useVocal())
			stop()
			expect(mockStop).toHaveBeenCalled()
		})

		it('triggers abort function', () => {
			const {
				result: {
					current: [, { abort }],
				},
			} = renderHook(() => useVocal())
			abort()
			expect(mockAbort).toHaveBeenCalled()
		})

		it('triggers clean function', () => {
			const {
				result: {
					current: [, { clean }],
				},
			} = renderHook(() => useVocal())
			clean()
			expect(mockCleanup).toHaveBeenCalled()
		})

		it('triggers subscribe function', () => {
			const {
				result: {
					current: [, { subscribe }],
				},
			} = renderHook(() => useVocal())
			subscribe('foo', jest.fn())
			expect(mockAddEventListener).toHaveBeenCalled()
		})

		it('triggers unsubscribe function', () => {
			const {
				result: {
					current: [, { unsubscribe }],
				},
			} = renderHook(() => useVocal())
			unsubscribe('foo', jest.fn())
			expect(mockRemoveEventListener).toHaveBeenCalled()
		})
	})
})
