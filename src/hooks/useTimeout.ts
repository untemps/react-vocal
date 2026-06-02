import { useCallback, useEffect, useRef } from 'react'

export const useTimeout = (handler: () => void, timeout: number = 0): [start: () => void, stop: () => void] => {
	const ref = useRef<ReturnType<typeof setTimeout> | null>(null)

	const stop = useCallback(() => {
		if (ref.current !== null) {
			clearTimeout(ref.current)
			ref.current = null
		}
	}, [])

	const start = useCallback(() => {
		stop()
		ref.current = setTimeout(handler, timeout)
	}, [handler, timeout, stop])

	useEffect(() => stop, [stop])

	return [start, stop]
}
