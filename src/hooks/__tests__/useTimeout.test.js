import { renderHook } from '@testing-library/react-hooks'

import useTimeout from '../useTimeout'

const wait = (delay) => {
	return new Promise((resolve) => {
		setTimeout(resolve, delay)
	})
}

describe('useTimeout', () => {
	it('not triggers handler before calling start', () => {
		const handler = jest.fn()
		renderHook(() => useTimeout(handler))
		expect(handler).not.toHaveBeenCalled()
	})

	it('not triggers handler before timeout', async () => {
		const handler = jest.fn()
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
		const handler = jest.fn()
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
		const handler = jest.fn()
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
		const handler = jest.fn()
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
})
