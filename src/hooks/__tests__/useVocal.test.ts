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
		// Mirrors vocal 2.x: isRecording flips true synchronously on a genuine start and
		// stays false on a silent abort. Tests opt out via mockStart to simulate aborts.
		let mockIsRecording = false

		beforeAll(() => {
			vi.mocked(isSupported).mockReturnValue(true)
		})

		beforeEach(() => {
			// mockReset (not mockClear) also drops per-test implementation overrides,
			// so they don't leak across tests — see the start() rejection/throw cases below.
			mockStart.mockReset()
			mockStop.mockReset()
			mockAbort.mockReset()
			mockOn.mockReset()
			mockOff.mockReset()
			mockCleanup.mockReset()
			mockIsRecording = false
			// Default to vocal's genuine-start contract: start() resolves and the instance
			// reports isRecording === true. Silent-abort tests override this below.
			mockStart.mockImplementation(async () => {
				mockIsRecording = true
			})
			vi.mocked(createVocal).mockImplementation(() => ({
				start: mockStart,
				stop: mockStop,
				abort: mockAbort,
				on: mockOn,
				off: mockOff,
				cleanup: mockCleanup,
				get isRecording() {
					return mockIsRecording
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
			const instance = vi.mocked(createVocal).mock.results[0].value
			expect(ref.current).toBe(instance)
		})

		it('passes maxAlternatives to createVocal factory', () => {
			renderHook(() => useVocal('en-US', null, 5))
			expect(createVocal).toHaveBeenCalledWith({
				lang: 'en-US',
				grammars: null,
				maxAlternatives: 5,
				continuous: false,
				interimResults: false,
			})
		})

		it('defaults interimResults to false', () => {
			renderHook(() => useVocal())
			expect(createVocal).toHaveBeenCalledWith(expect.objectContaining({ interimResults: false }))
		})

		it('passes interimResults to createVocal factory', () => {
			renderHook(() => useVocal('en-US', null, 1, false, true))
			expect(createVocal).toHaveBeenCalledWith(expect.objectContaining({ interimResults: true }))
		})

		it('tears down and recreates the instance when interimResults changes', () => {
			const { rerender } = renderHook(({ interimResults }) => useVocal('en-US', null, 1, false, interimResults), {
				initialProps: { interimResults: false },
			})
			expect(createVocal).toHaveBeenCalledTimes(1)
			expect(createVocal).toHaveBeenLastCalledWith(expect.objectContaining({ interimResults: false }))

			rerender({ interimResults: true })

			expect(createVocal).toHaveBeenCalledTimes(2)
			expect(createVocal).toHaveBeenLastCalledWith(expect.objectContaining({ interimResults: true }))
			expect(mockAbort).toHaveBeenCalledTimes(1)
			expect(mockCleanup).toHaveBeenCalledTimes(1)
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

		it('keeps isRecording true when start() resolves and recognition actually started', async () => {
			// Regression guard: the reconciliation must not roll back a genuine start, where the
			// instance reports isRecording === true even though 'start' dispatches asynchronously.
			const controller = new AbortController()
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				await result.current[1].start({ signal: controller.signal })
			})
			expect(result.current[1].isRecording).toBe(true)
		})

		it('keeps isRecording true when recognition started even if the signal aborts late', async () => {
			// Race: recognition truly started (instance.isRecording === true), then the consumer
			// aborts. Reconciliation reads the instance's own state, so the late abort is a no-op.
			const controller = new AbortController()
			const { result } = renderHook(() => useVocal())
			await act(async () => {
				const p = result.current[1].start({ signal: controller.signal })
				controller.abort()
				await p
			})
			expect(result.current[1].isRecording).toBe(true)
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
			// Locks the contract: subscribe('result', cb) receives (event, bestAlternative, alternatives),
			// matching @untemps/vocal's ResultEventHandler — README examples rely on this signature.
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

		it('re-attaches consumer subscriptions to the recreated instance when lang changes', () => {
			const handler = vi.fn()
			const { result, rerender } = renderHook(({ lang }) => useVocal(lang), {
				initialProps: { lang: 'en-US' },
			})
			result.current[1].subscribe('result', handler)
			expect(mockOn).toHaveBeenCalledWith('result', handler)
			const resultOnsBefore = mockOn.mock.calls.filter(([type]) => type === 'result').length

			rerender({ lang: 'fr-FR' })

			// The disposed instance detached the handler and the new instance re-attached it,
			// so a subscribe() made before the switch keeps receiving events afterwards.
			expect(mockOff).toHaveBeenCalledWith('result', handler)
			const resultOnsAfter = mockOn.mock.calls.filter(([type]) => type === 'result').length
			expect(resultOnsAfter).toBe(resultOnsBefore + 1)
		})

		it('stops re-attaching a subscription after it is unsubscribed', () => {
			const handler = vi.fn()
			const { result, rerender } = renderHook(({ lang }) => useVocal(lang), {
				initialProps: { lang: 'en-US' },
			})
			result.current[1].subscribe('result', handler)
			result.current[1].unsubscribe('result', handler)
			const resultOnsBefore = mockOn.mock.calls.filter(([type]) => type === 'result').length

			rerender({ lang: 'fr-FR' })

			// Unsubscribed handlers leave the registry, so the recreated instance does not re-attach them.
			const resultOnsAfter = mockOn.mock.calls.filter(([type]) => type === 'result').length
			expect(resultOnsAfter).toBe(resultOnsBefore)
		})
	})
})
