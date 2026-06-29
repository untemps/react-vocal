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
		vi.useFakeTimers()
		try {
			const handler = vi.fn()
			const { result, rerender } = renderHook(({ timeout }) => useTimeout(handler, timeout), {
				initialProps: { timeout: 1000 },
			})
			const [startBefore] = result.current

			rerender({ timeout: 100 })

			expect(result.current[0]).toBe(startBefore)

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
