import { renderHook } from '@testing-library/react'

import { useTimeout } from '../useTimeout'

const wait = (delay: number): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(resolve, delay)
	})
}

describe('useTimeout', () => {
	it('not triggers handler before calling start', () => {
		const handler = vi.fn()
		renderHook(() => useTimeout(handler))
		expect(handler).not.toHaveBeenCalled()
	})

	it('not triggers handler before timeout', async () => {
		const handler = vi.fn()
		const timeout = 500
		const {
			result: {
				current: [start],
			},
		} = renderHook(() => useTimeout(handler, timeout))
		start()
		await wait(timeout - 50)
		expect(handler).not.toHaveBeenCalled()
	})

	it('triggers handler immediately', async () => {
		const handler = vi.fn()
		const {
			result: {
				current: [start],
			},
		} = renderHook(() => useTimeout(handler))
		start()
		await wait(0)
		expect(handler).toHaveBeenCalled()
	})

	it('triggers handler after delay', async () => {
		const handler = vi.fn()
		const timeout = 500
		const {
			result: {
				current: [start],
			},
		} = renderHook(() => useTimeout(handler, timeout))
		start()
		await wait(timeout)
		expect(handler).toHaveBeenCalled()
	})

	it('not triggers handler if stop is called before timeout', async () => {
		const handler = vi.fn()
		const timeout = 500
		const {
			result: {
				current: [start, stop],
			},
		} = renderHook(() => useTimeout(handler, timeout))
		start()
		stop()
		await wait(timeout)
		expect(handler).not.toHaveBeenCalled()
	})

	it('arms with the latest duration even from a start captured before the duration changed', () => {
		// Mirrors how <Vocal> uses the hook: it captures `start` once (its handlers are
		// subscribed to the recognition instance at session start) and never re-reads it. A
		// stale reference must still arm with the current duration, otherwise a mid-session
		// timeout/silenceTimeout prop change is silently ignored — see issue #263.
		vi.useFakeTimers()
		try {
			const handler = vi.fn()
			const { result, rerender } = renderHook(({ timeout }) => useTimeout(handler, timeout), {
				initialProps: { timeout: 1000 },
			})
			const [startBefore] = result.current

			rerender({ timeout: 100 })

			// `start` identity is stable across duration changes...
			expect(result.current[0]).toBe(startBefore)

			// ...and the captured reference fires at the new 100ms value, not the old 1000ms.
			startBefore()
			vi.advanceTimersByTime(99)
			expect(handler).not.toHaveBeenCalled()
			vi.advanceTimersByTime(1)
			expect(handler).toHaveBeenCalledTimes(1)
		} finally {
			vi.useRealTimers()
		}
	})
})
