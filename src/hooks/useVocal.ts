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
		const instance = ref.current
		if (!instance) return undefined
		// Optimistic update so the UI reacts immediately at click, before the
		// async permission/getUserMedia chain resolves and fires the 'start' event.
		setIsRecording(true)
		// vocal 2.x's start() can either reject (microphone/permission errors) or
		// silently resolve without dispatching 'start' (AbortError on the signal —
		// caught and swallowed internally). In both cases the instance never fires
		// 'end'/'error', so the optimistic flag would stay stuck on `true`.
		//
		// To distinguish a silent abort from a late abort that races a real
		// success (consumer aborts the controller after the recognition truly
		// started), track whether 'start' actually fired before rolling back.
		const signal = options?.signal
		let startEventFired = false
		const onceStart = () => {
			startEventFired = true
		}
		instance.on('start', onceStart)
		const unbind = () => instance.off('start', onceStart)
		let promise: Promise<void>
		try {
			promise = instance.start(options)
		} catch (err) {
			unbind()
			setIsRecording(false)
			throw err
		}
		return promise
			.then(
				() => {
					if (!startEventFired && signal?.aborted) setIsRecording(false)
				},
				(err) => {
					setIsRecording(false)
					throw err
				}
			)
			.finally(unbind)
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
