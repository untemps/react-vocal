import { useCallback, useEffect, useRef } from 'react'

const useTimeout = (handler, timeout = 0) => {
	const ref = useRef(-1)

	const stop = useCallback(() => {
		clearTimeout(ref.current)
		ref.current = -1
	}, [])

	const start = useCallback(() => {
		stop()
		ref.current = setTimeout(handler, timeout)
	}, [handler, timeout, stop])

	useEffect(() => stop, [stop])

	return [start, stop]
}

export default useTimeout

// TODO: Return a promise
