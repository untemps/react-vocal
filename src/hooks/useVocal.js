import { useCallback, useEffect, useRef } from 'react'

import SpeechRecognitionWrapper from '../core/SpeechRecognitionWrapper'

const useVocal = (lang = 'en-US', grammars = null, __rsInstance = null) => {
	const ref = useRef(null)

	useEffect(() => {
		if (SpeechRecognitionWrapper.isSupported) {
			ref.current = __rsInstance || new SpeechRecognitionWrapper({ lang, grammars })
			return () => {
				ref.current.abort()
				ref.current.cleanup()
			}
		}
	}, [lang, grammars, __rsInstance])

	const start = useCallback(() => {
		if (ref.current) {
			ref.current.start()
		}
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
			ref.current.addEventListener(eventType, handler)
		}
	}, [])

	const unsubscribe = useCallback((eventType, handler) => {
		if (ref.current) {
			ref.current.removeEventListener(eventType, handler)
		}
	}, [])

	const clean = useCallback(() => {
		if (ref.current) {
			ref.current.cleanup()
		}
	}, [])

	return [ref, { start, stop, abort, subscribe, unsubscribe, clean }]
}

export default useVocal

// TODO: Return the instance, not the ref
