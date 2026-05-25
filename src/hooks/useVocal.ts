import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
	createVocal,
	isSupported,
	type EventHandlerFor,
	type EventType,
	type GenericEventHandler,
	type VocalInstance,
} from '@untemps/vocal'

export interface UseVocalActions {
	start: (options?: { signal?: AbortSignal }) => Promise<void> | undefined
	stop: () => void
	abort: () => void
	subscribe: {
		<T extends EventType>(eventType: T, handler: EventHandlerFor<T>): void
		(eventType: string, handler: GenericEventHandler): void
	}
	unsubscribe: {
		<T extends EventType>(eventType: T, handler?: EventHandlerFor<T>): void
		(eventType: string, handler?: GenericEventHandler): void
	}
	clean: () => void
	isRecording: boolean
}

export type UseVocalReturn = [RefObject<VocalInstance | null>, UseVocalActions]

const useVocal = (
	lang: string = 'en-US',
	grammars: SpeechGrammarList | null = null,
	maxAlternatives: number = 1,
	continuous: boolean = false
): UseVocalReturn => {
	const ref = useRef<VocalInstance | null>(null)
	const [isRecording, setIsRecording] = useState(false)
	const supported = useMemo(() => isSupported(), [])

	useEffect(() => {
		if (supported) {
			const instance = createVocal({ lang, grammars, maxAlternatives, continuous })
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
	}, [lang, grammars, maxAlternatives, continuous, supported])

	const start = useCallback((options?: { signal?: AbortSignal }): Promise<void> | undefined => {
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

	const subscribe = useCallback(
		(eventType: EventType | string, handler: EventHandlerFor<EventType> | GenericEventHandler) => {
			if (ref.current) {
				ref.current.on(eventType as EventType, handler as EventHandlerFor<EventType>)
			}
		},
		[]
	) as UseVocalActions['subscribe']

	const unsubscribe = useCallback(
		(eventType: EventType | string, handler?: EventHandlerFor<EventType> | GenericEventHandler) => {
			if (ref.current) {
				ref.current.off(eventType as EventType, handler as EventHandlerFor<EventType>)
			}
		},
		[]
	) as UseVocalActions['unsubscribe']

	const clean = useCallback(() => {
		if (ref.current) {
			ref.current.cleanup()
		}
	}, [])

	return [ref, { start, stop, abort, subscribe, unsubscribe, clean, isRecording }]
}

export default useVocal
