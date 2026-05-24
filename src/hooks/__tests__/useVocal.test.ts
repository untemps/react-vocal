import { act, renderHook } from '@testing-library/react'
import { createVocal, isSupported } from '@untemps/vocal'

import useVocal from '../useVocal'

vi.mock('@untemps/vocal')

describe('useVocal', () => {
	const mockStart = vi.fn()
	const mockStop = vi.fn()
	const mockAbort = vi.fn()
	const mockOn = vi.fn()
	const mockOff = vi.fn()
	const mockCleanup = vi.fn()

	describe('with no SpeechRecognition support', () => {
		beforeAll(() => {
			vi.mocked(isSupported).mockReturnValue(false)
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
			subscribe('foo', vi.fn())
			expect(mockOn).not.toHaveBeenCalled()
		})

		it('not triggers unsubscribe function', () => {
			const {
				result: {
					current: [, { unsubscribe }],
				},
			} = renderHook(() => useVocal())
			unsubscribe('foo', vi.fn())
			expect(mockOff).not.toHaveBeenCalled()
		})
	})

	describe('with SpeechRecognition support', () => {
		beforeAll(() => {
			vi.mocked(isSupported).mockReturnValue(true)
		})

		beforeEach(() => {
			mockStart.mockClear()
			mockStop.mockClear()
			mockAbort.mockClear()
			mockOn.mockClear()
			mockOff.mockClear()
			mockCleanup.mockClear()
			vi.mocked(createVocal).mockImplementation(() => ({
				start: mockStart,
				stop: mockStop,
				abort: mockAbort,
				on: mockOn,
				off: mockOff,
				cleanup: mockCleanup,
				get isRecording() {
					return false
				},
			}))
		})

		afterEach(() => {
			vi.mocked(createVocal).mockReset()
		})

		it('creates SpeechRecognition instance', () => {
			const {
				result: {
					current: [ref],
				},
			} = renderHook(() => useVocal())
			expect(ref.current).toBeDefined()
		})

		it('passes maxAlternatives to createVocal factory', () => {
			renderHook(() => useVocal('en-US', null, 5))
			expect(createVocal).toHaveBeenCalledWith({
				lang: 'en-US',
				grammars: null,
				maxAlternatives: 5,
				continuous: false,
			})
		})

		it('uses custom SpeechRecognition instance', () => {
			const foo = createVocal()
			const {
				result: {
					current: [ref],
				},
			} = renderHook(() => useVocal(undefined, null, 1, false, foo))
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

		it('forwards start options (signal) to the vocal instance', () => {
			const controller = new AbortController()
			const {
				result: {
					current: [, { start }],
				},
			} = renderHook(() => useVocal())
			start({ signal: controller.signal })
			expect(mockStart).toHaveBeenCalledWith({ signal: controller.signal })
		})

		it('returns the promise from the vocal start() call', () => {
			const startPromise = Promise.resolve()
			mockStart.mockReturnValue(startPromise)
			const {
				result: {
					current: [, { start }],
				},
			} = renderHook(() => useVocal())
			expect(start()).toBe(startPromise)
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
			subscribe('foo', vi.fn())
			expect(mockOn).toHaveBeenCalled()
		})

		it('forwards the vocal 2.x result callback signature unchanged', () => {
			// Locks the contract: a handler subscribed via subscribe('result', cb)
			// receives (event, bestAlternative, alternatives) — matching
			// @untemps/vocal's ResultEventHandler. The README examples for both
			// useVocal and useCommands rely on this signature.
			const handler = vi.fn()
			const {
				result: {
					current: [, { subscribe }],
				},
			} = renderHook(() => useVocal())
			subscribe('result', handler)
			const registered = mockOn.mock.calls.find(([type]) => type === 'result')![1] as (
				event: Event,
				bestAlternative: string,
				alternatives: string[]
			) => void
			const fakeEvent = new Event('result')
			registered(fakeEvent, 'hello', ['hello'])
			expect(handler).toHaveBeenCalledWith(fakeEvent, 'hello', ['hello'])
		})

		it('triggers unsubscribe function', () => {
			const {
				result: {
					current: [, { unsubscribe }],
				},
			} = renderHook(() => useVocal())
			unsubscribe('foo', vi.fn())
			expect(mockOff).toHaveBeenCalled()
		})

		it('exposes isRecording as false initially', () => {
			const { result } = renderHook(() => useVocal())
			expect(result.current[1].isRecording).toBe(false)
		})

		it('flips isRecording to true on the start event', async () => {
			const { result } = renderHook(() => useVocal())
			const startCallback = mockOn.mock.calls.find(([type]) => type === 'start')![1]
			await act(async () => startCallback(new Event('start')))
			expect(result.current[1].isRecording).toBe(true)
		})

		it('flips isRecording back to false on the end event', async () => {
			const { result } = renderHook(() => useVocal())
			const startCallback = mockOn.mock.calls.find(([type]) => type === 'start')![1]
			const endCallback = mockOn.mock.calls.find(([type]) => type === 'end')![1]
			await act(async () => startCallback(new Event('start')))
			await act(async () => endCallback(new Event('end')))
			expect(result.current[1].isRecording).toBe(false)
		})

		it('flips isRecording back to false on the error event', async () => {
			const { result } = renderHook(() => useVocal())
			const startCallback = mockOn.mock.calls.find(([type]) => type === 'start')![1]
			const errorCallback = mockOn.mock.calls.find(([type]) => type === 'error')![1]
			await act(async () => startCallback(new Event('start')))
			await act(async () => errorCallback(new Event('error')))
			expect(result.current[1].isRecording).toBe(false)
		})

		it('optimistically flips isRecording to true when start() is called', async () => {
			const { result } = renderHook(() => useVocal())
			await act(async () => result.current[1].start())
			expect(result.current[1].isRecording).toBe(true)
		})
	})
})
