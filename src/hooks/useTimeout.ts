import { useCallback, useEffect, useRef } from 'react'

export const useTimeout = (handler: () => void, timeout: number = 0): [start: () => void, stop: () => void] => {
	const ref = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Keep the handler and duration in refs refreshed every render so `start` can stay a
	// stable callback that always arms with the *current* values. Otherwise the duration is
	// baked into the `start` closure: a consumer that subscribes the handler once (e.g. <Vocal>
	// binds its handlers to the recognition instance only at session start) keeps re-arming the
	// timer with the value captured when the session began, silently ignoring later prop changes
	// — and a null→positive silenceTimeout change would re-arm the stale 0ms timer.
	const handlerRef = useRef(handler)
	handlerRef.current = handler
	const timeoutRef = useRef(timeout)
	timeoutRef.current = timeout

	const stop = useCallback(() => {
		if (ref.current !== null) {
			clearTimeout(ref.current)
			ref.current = null
		}
	}, [])

	const start = useCallback(() => {
		stop()
		ref.current = setTimeout(() => handlerRef.current(), timeoutRef.current)
	}, [stop])

	useEffect(() => stop, [stop])

	return [start, stop]
}
