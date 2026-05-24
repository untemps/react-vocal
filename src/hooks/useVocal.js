import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createVocal, isSupported } from '@untemps/vocal'

const useVocal = (lang = 'en-US', grammars = null, maxAlternatives = 1, continuous = false, __rsInstance = null) => {
	const ref = useRef(null)
	const [isRecording, setIsRecording] = useState(false)
	const supported = useMemo(() => isSupported(), [])

	useEffect(() => {
		if (supported) {
			const instance = __rsInstance || createVocal({ lang, grammars, maxAlternatives, continuous })
			ref.current = instance

			const handleStart = () => setIsRecording(true)
			const handleStop = () => setIsRecording(false)
			instance.on('start', handleStart)
			instance.on('end', handleStop)
			instance.on('error', handleStop)

			return () => {
				instance.off('start', handleStart)
				instance.off('end', handleStop)
				instance.off('error', handleStop)
				instance.abort()
				instance.cleanup()
				setIsRecording(false)
			}
		}
	}, [lang, grammars, maxAlternatives, continuous, __rsInstance, supported])

	const start = useCallback((options) => {
		if (!ref.current) return undefined
		// Optimistic update so the UI reacts immediately at click, before the
		// async permission/getUserMedia chain resolves and fires the 'start' event.
		setIsRecording(true)
		// vocal 2.x's start() returns a Promise that rejects on microphone/permission
		// errors. Returning it lets consumers await or attach a .catch handler.
		return ref.current.start(options)
	}, [])

	const stop = useCallback(() => {
		if (ref.current) {
			ref.current.stop()
		}
	}, [])

	const abort = useCallback(() => {
		if (ref.current) {
			ref.current.abort()
		}
	}, [])

	const subscribe = useCallback((eventType, handler) => {
		if (ref.current) {
			ref.current.on(eventType, handler)
		}
	}, [])

	const unsubscribe = useCallback((eventType, handler) => {
		if (ref.current) {
			ref.current.off(eventType, handler)
		}
	}, [])

	const clean = useCallback(() => {
		if (ref.current) {
			ref.current.cleanup()
		}
	}, [])

	return [ref, { start, stop, abort, subscribe, unsubscribe, clean, isRecording }]
}

export default useVocal
