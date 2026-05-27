import { useCallback, useEffect, useRef } from 'react'

export const useTimeout = (handler: () => void, timeout: number = 0): [start: () => void, stop: () => void] => {
	const ref = useRef<ReturnType<typeof setTimeout> | number>(-1)

	const stop = useCallback(() => {
		clearTimeout(ref.current as ReturnType<typeof setTimeout>)
		ref.current = -1
	}, [])

	const start = useCallback(() => {
		stop()
		ref.current = setTimeout(handler, timeout)
	}, [handler, timeout, stop])

	useEffect(() => stop, [stop])

	return [start, stop]
}
