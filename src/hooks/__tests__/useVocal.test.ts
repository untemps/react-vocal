import { act, renderHook } from '@testing-library/react'
import { createVocal, isSupported } from '@untemps/vocal'

import { useVocal } from '../useVocal'

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
			// mockReset clears both calls and any per-test implementation overrides
			// (mockReturnValue / mockImplementation). mockClear would leak those overrides
			// across tests — see the start() rejection / throw cases below.
			mockStart.mockReset()
			mockStop.mockReset()
			mockAbort.mockReset()
			mockOn.mockReset()
			mockOff.mockReset()
			mockCleanup.mockReset()
			// vocal 2.x's start() always returns a Promise — default the mock to
			// match the real contract so tests don't have to opt in every time.
			mockStart.mockReturnValue(Promise.resolve())
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

		it('returns a promise that resolves with the vocal start() value', async () => {
			mockStart.mockReturnValue(Promise.resolve())
			const {
				result: {
					current: [, { start }],
				},
			} = renderHook(() => useVocal())
			await expect(start()).resolves.toBeUndefined()
		})

		it('propagates the rejection from vocal start() to the caller', async () => {
			const err = new Error('mic denied')
			mockStart.mockReturnValue(Promise.reject(err))
			const {
				result: {
					current: [, { start }],
				},
			} = renderHook(() => useVocal())
			await expect(start()).rejects.toBe(err)
		})

		it('flips isRecording back to false when start() rejects asynchronously', async () => {
			mockStart.mockReturnValue(Promise.reject(new Error('aborted')))
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await result.current[1].start()?.catch(() => {})
			})
			expect(result.current[1].isRecording).toBe(false)
		})

		it('flips isRecording back to false when start() silently resolves with an aborted signal', async () => {
			// vocal 2.x swallows AbortError internally — start() resolves without
			// dispatching 'start'. Detect the post-hoc abort and reset the flag.
			mockStart.mockReturnValue(Promise.resolve())
			const controller = new AbortController()
			controller.abort()
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await result.current[1].start({ signal: controller.signal })
			})
			expect(result.current[1].isRecording).toBe(false)
		})

		it('flips isRecording back to false when start() silently resolves without firing start (no signal)', async () => {
			// Even without a signal, an absent 'start' event means the session did not begin —
			// the optimistic flag must be rolled back so the UI does not stay stuck on listening.
			mockStart.mockReturnValue(Promise.resolve())
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await result.current[1].start()
			})
			expect(result.current[1].isRecording).toBe(false)
		})

		it('flips isRecording back to false when vocal.start() throws synchronously', async () => {
			// vocal.start() throwing synchronously is caught by the async wrapper
			// and surfaces as a rejected promise — the rollback still applies.
			mockStart.mockImplementation(() => {
				throw new Error('boom')
			})
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await expect(result.current[1].start()).rejects.toThrow('boom')
			})
			expect(result.current[1].isRecording).toBe(false)
		})

		it('keeps isRecording true when start() resolves and the signal is not aborted', async () => {
			// Guard against regression: the silent-resolve rollback must not fire
			// on a normal successful start. Simulate vocal's real contract by
			// dispatching 'start' from inside start() before resolution.
			mockStart.mockImplementation(async () => {
				mockOn.mock.calls
					.filter(([type]) => type === 'start')
					.forEach(([, handler]) => (handler as () => void)())
			})
			const controller = new AbortController() // not aborted
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await result.current[1].start({ signal: controller.signal })
			})
			expect(result.current[1].isRecording).toBe(true)
		})

		it('keeps isRecording true when the start event fires and the signal aborts late', async () => {
			// Race scenario: vocal.start() succeeds (the real 'start' event has
			// already been dispatched), then the consumer aborts the signal
			// before the wrapper's .then microtask runs. The rollback must rely
			// on whether 'start' actually fired, not just on signal.aborted, so
			// the real-recording flag stays `true`.
			let resolveStart: (() => void) | undefined
			mockStart.mockReturnValue(
				new Promise<void>((res) => {
					resolveStart = res
				})
			)
			const controller = new AbortController()
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				const p = result.current[1].start({ signal: controller.signal })
				// Simulate vocal dispatching 'start' to every subscriber, including
				// the wrapper's internal tracker.
				mockOn.mock.calls
					.filter(([type]) => type === 'start')
					.forEach(([, handler]) => (handler as () => void)())
				// Consumer aborts after recognition truly started.
				controller.abort()
				resolveStart?.()
				await p
			})
			expect(result.current[1].isRecording).toBe(true)
		})

		it('unsubscribes the internal start tracker once the promise settles', async () => {
			// Each start() call adds a transient 'start' listener used for the
			// silent-abort detection. It must be removed once the promise settles
			// so repeated calls do not leak listeners on the vocal instance.
			mockStart.mockReturnValue(Promise.resolve())
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await result.current[1].start()
			})
			expect(mockOff).toHaveBeenCalledWith('start', expect.any(Function))
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

		it('exposes isStarting as false initially', () => {
			const { result } = renderHook(() => useVocal())
			expect(result.current[1].isStarting).toBe(false)
		})

		it('optimistically flips isStarting to true on start(), then clears it once the start event fires', async () => {
			let resolveStart: (() => void) | undefined
			mockStart.mockReturnValue(
				new Promise<void>((res) => {
					resolveStart = res
				})
			)
			const { result } = renderHook(() => useVocal())
			let startPromise: Promise<void> | undefined
			await act(async () => {
				startPromise = result.current[1].start()
			})
			expect(result.current[1].isStarting).toBe(true)
			expect(result.current[1].isRecording).toBe(true)

			await act(async () => {
				mockOn.mock.calls
					.filter(([type]) => type === 'start')
					.forEach(([, handler]) => (handler as () => void)())
				resolveStart?.()
				await startPromise
			})
			expect(result.current[1].isStarting).toBe(false)
			expect(result.current[1].isRecording).toBe(true)
		})

		it('clears isStarting when start() silently resolves without firing start', async () => {
			mockStart.mockReturnValue(Promise.resolve())
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await result.current[1].start()
			})
			expect(result.current[1].isStarting).toBe(false)
			expect(result.current[1].isRecording).toBe(false)
		})

		it('clears isStarting when start() rejects', async () => {
			mockStart.mockReturnValue(Promise.reject(new Error('mic denied')))
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await result.current[1].start()?.catch(() => {})
			})
			expect(result.current[1].isStarting).toBe(false)
		})

		it('optimistically flips isRecording to true when start() is called', async () => {
			// Simulate vocal's real contract: 'start' fires before start() resolves.
			mockStart.mockImplementation(async () => {
				mockOn.mock.calls
					.filter(([type]) => type === 'start')
					.forEach(([, handler]) => (handler as () => void)())
			})
			const { result } = renderHook(() => useVocal())
			await act(async () => result.current[1].start())
			expect(result.current[1].isRecording).toBe(true)
		})

		it('runs cleanup on unmount: removes listeners, aborts, and cleans up the instance', () => {
			const { unmount } = renderHook(() => useVocal())
			expect(createVocal).toHaveBeenCalledTimes(1)
			unmount()
			expect(mockOff).toHaveBeenCalledWith('start', expect.any(Function))
			expect(mockOff).toHaveBeenCalledWith('end', expect.any(Function))
			expect(mockOff).toHaveBeenCalledWith('error', expect.any(Function))
			expect(mockOff).toHaveBeenCalledWith('permission', expect.any(Function))
			expect(mockAbort).toHaveBeenCalledTimes(1)
			expect(mockCleanup).toHaveBeenCalledTimes(1)
		})

		it('subscribes to the permission event on mount', () => {
			renderHook(() => useVocal())
			expect(mockOn).toHaveBeenCalledWith('permission', expect.any(Function))
		})

		it('exposes permissionState as null initially', () => {
			const { result } = renderHook(() => useVocal())
			expect(result.current[1].permissionState).toBeNull()
		})

		it('updates permissionState when the permission event fires', async () => {
			const { result } = renderHook(() => useVocal())
			const permissionCallback = mockOn.mock.calls.find(([type]) => type === 'permission')![1] as (
				event: Event,
				state: PermissionState
			) => void
			await act(async () => permissionCallback(new Event('permission'), 'denied'))
			expect(result.current[1].permissionState).toBe('denied')
		})

		it('tears down and recreates the instance when lang changes', () => {
			const { rerender } = renderHook(({ lang }) => useVocal(lang), {
				initialProps: { lang: 'en-US' },
			})
			expect(createVocal).toHaveBeenCalledTimes(1)
			expect(createVocal).toHaveBeenLastCalledWith(expect.objectContaining({ lang: 'en-US' }))

			const offCallsBefore = mockOff.mock.calls.length

			rerender({ lang: 'fr-FR' })

			expect(createVocal).toHaveBeenCalledTimes(2)
			expect(createVocal).toHaveBeenLastCalledWith(expect.objectContaining({ lang: 'fr-FR' }))
			expect(mockOff.mock.calls.length).toBe(offCallsBefore + 4)
			expect(mockAbort).toHaveBeenCalledTimes(1)
			expect(mockCleanup).toHaveBeenCalledTimes(1)
		})

		it('tears down and recreates the instance when grammars identity changes', () => {
			const g1 = {} as SpeechGrammarList
			const g2 = {} as SpeechGrammarList
			const { rerender } = renderHook(({ grammars }) => useVocal('en-US', grammars), {
				initialProps: { grammars: g1 },
			})
			expect(createVocal).toHaveBeenCalledTimes(1)
			expect(createVocal).toHaveBeenLastCalledWith(expect.objectContaining({ grammars: g1 }))

			rerender({ grammars: g2 })

			expect(createVocal).toHaveBeenCalledTimes(2)
			expect(createVocal).toHaveBeenLastCalledWith(expect.objectContaining({ grammars: g2 }))
			expect(mockAbort).toHaveBeenCalledTimes(1)
			expect(mockCleanup).toHaveBeenCalledTimes(1)
		})
	})
})
