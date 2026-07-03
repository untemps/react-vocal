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
	start: (options?: { signal?: AbortSignal }) => Promise<void>
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
	permissionState: PermissionState | null
}

export type UseVocalReturn = [RefObject<VocalInstance | null>, UseVocalActions]

export const useVocal = (
	lang: string = 'en-US',
	grammars: SpeechGrammarList | null = null,
	maxAlternatives: number = 1,
	continuous: boolean = false,
	interimResults: boolean = false
): UseVocalReturn => {
	const ref = useRef<VocalInstance | null>(null)
	const [isRecording, setIsRecording] = useState(false)
	const [permissionState, setPermissionState] = useState<PermissionState | null>(null)
	const supported = useMemo(() => isSupported(), [])

	useEffect(() => {
		if (supported) {
			const instance = createVocal({ lang, grammars, maxAlternatives, continuous, interimResults })
			ref.current = instance

			const handleStart = () => setIsRecording(true)
			const handleStop = () => setIsRecording(false)
			instance.on('start', handleStart)
			instance.on('end', handleStop)
			instance.on('error', handleStop)

			const handlePermission: EventHandlerFor<'permission'> = (_event, state) => setPermissionState(state)
			instance.on('permission', handlePermission)

			return () => {
				instance.off('start', handleStart)
				instance.off('end', handleStop)
				instance.off('error', handleStop)
				instance.off('permission', handlePermission)
				instance.abort()
				instance.cleanup()
				setIsRecording(false)
				setPermissionState(null)
			}
		}
	}, [lang, grammars, maxAlternatives, continuous, interimResults, supported])

	const start = useCallback(async (options?: { signal?: AbortSignal }): Promise<void> => {
		const instance = ref.current
		if (!instance) return
		// Optimistic update so the UI reacts immediately at click, before the
		// async permission/getUserMedia chain resolves and fires the 'start' event.
		setIsRecording(true)
		// vocal 2.x's start() may resolve without ever firing 'start' (e.g. a swallowed
		// AbortError), leaving the optimistic flag stuck on `true`. Roll back only when the
		// real 'start' event never fired, so a late abort racing a genuine success is safe.
		let startEventFired = false
		const onStart = () => {
			startEventFired = true
		}
		instance.on('start', onStart)
		try {
			await instance.start(options)
			if (!startEventFired) setIsRecording(false)
		} catch (err) {
			setIsRecording(false)
			throw err
		} finally {
			instance.off('start', onStart)
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

	return [ref, { start, stop, abort, subscribe, unsubscribe, clean, isRecording, permissionState }]
}
