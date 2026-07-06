import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
	createVocal,
	isSupported,
	type EventHandlerFor,
	type EventType,
	type GenericEventHandler,
	type SpeechEngineFactory,
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
	interimResults: boolean = false,
	engine?: SpeechEngineFactory
): UseVocalReturn => {
	const ref = useRef<VocalInstance | null>(null)
	const subscriptionsRef = useRef<Array<[EventType | string, EventHandlerFor<EventType> | GenericEventHandler]>>([])
	const [isRecording, setIsRecording] = useState(false)
	const [permissionState, setPermissionState] = useState<PermissionState | null>(null)
	const supported = useMemo(() => isSupported(engine), [engine])

	useEffect(() => {
		if (supported) {
			const instance = createVocal({ lang, grammars, maxAlternatives, continuous, interimResults, engine })
			ref.current = instance

			const handleStart = () => setIsRecording(true)
			const handleStop = () => setIsRecording(false)
			instance.on('start', handleStart)
			instance.on('end', handleStop)
			instance.on('error', handleStop)

			const handlePermission: EventHandlerFor<'permission'> = (_event, state) => setPermissionState(state)
			instance.on('permission', handlePermission)

			for (const [eventType, handler] of subscriptionsRef.current) {
				instance.on(eventType as EventType, handler as EventHandlerFor<EventType>)
			}

			return () => {
				instance.off('start', handleStart)
				instance.off('end', handleStop)
				instance.off('error', handleStop)
				instance.off('permission', handlePermission)
				for (const [eventType, handler] of subscriptionsRef.current) {
					instance.off(eventType as EventType, handler as EventHandlerFor<EventType>)
				}
				instance.abort()
				instance.cleanup()
				setIsRecording(false)
				setPermissionState(null)
			}
		}
	}, [lang, grammars, maxAlternatives, continuous, interimResults, engine, supported])

	const start = useCallback(async (options?: { signal?: AbortSignal }): Promise<void> => {
		const instance = ref.current
		if (!instance) return
		setIsRecording(true)
		try {
			await instance.start(options)
			if (!instance.isRecording) setIsRecording(false)
		} catch (err) {
			setIsRecording(false)
			throw err
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
			if (!supported) return
			subscriptionsRef.current.push([eventType, handler])
			ref.current?.on(eventType as EventType, handler as EventHandlerFor<EventType>)
		},
		[supported]
	) as UseVocalActions['subscribe']

	const unsubscribe = useCallback(
		(eventType: EventType | string, handler?: EventHandlerFor<EventType> | GenericEventHandler) => {
			if (!supported) return
			subscriptionsRef.current = subscriptionsRef.current.filter(
				([type, registered]) => !(type === eventType && (handler === undefined || registered === handler))
			)
			ref.current?.off(eventType as EventType, handler as EventHandlerFor<EventType>)
		},
		[supported]
	) as UseVocalActions['unsubscribe']

	const clean = useCallback(() => {
		if (ref.current) {
			ref.current.cleanup()
		}
	}, [])

	return [ref, { start, stop, abort, subscribe, unsubscribe, clean, isRecording, permissionState }]
}
