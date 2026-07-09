import {
	cloneElement,
	isValidElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type MouseEvent as ReactMouseEvent,
	type ReactElement,
	type ReactNode,
} from 'react'
import { isSupported as isSupportedFn, type SpeechEngineFactory } from '@untemps/vocal'
import { isFunction } from '@untemps/utils/function/isFunction'

import { useVocal } from '../hooks/useVocal'
import { useTimeout } from '../hooks/useTimeout'
import { useCommands, type CommandsMap, type TriggerCommand } from '../hooks/useCommands'

import { Icon } from './Icon'

export type OnResultCallback = (bestAlternative: string, event: SpeechRecognitionEvent | Event) => void

export type VocalErrorType =
	| 'permission-denied'
	| 'no-speech'
	| 'network'
	| 'audio-capture'
	| 'service-not-allowed'
	| 'aborted'
	| 'unknown'

export interface VocalError {
	type: VocalErrorType
	message: string
	original: unknown
}

export type OnErrorCallback = (error: VocalError) => void

const SR_ERROR_TO_TYPE: Record<string, VocalErrorType> = {
	'no-speech': 'no-speech',
	network: 'network',
	'audio-capture': 'audio-capture',
	'service-not-allowed': 'service-not-allowed',
	'not-allowed': 'permission-denied',
	aborted: 'aborted',
}

const DOM_EXCEPTION_NAME_TO_TYPE: Record<string, VocalErrorType> = {
	NotAllowedError: 'permission-denied',
	NotFoundError: 'audio-capture',
	NotReadableError: 'audio-capture',
	AbortError: 'aborted',
}

export const classifyError = (err: unknown): VocalError => {
	// SpeechRecognition error event carries an `error` discriminator string
	if (err && typeof err === 'object' && 'error' in err && typeof (err as { error: unknown }).error === 'string') {
		const sre = err as { error: string; message?: string }
		const type = SR_ERROR_TO_TYPE[sre.error] ?? 'unknown'
		return { type, message: sre.message || sre.error, original: err }
	}
	// DOMException from getUserMedia / permissions APIs is identified by `name`
	if (err && typeof err === 'object' && 'name' in err && typeof (err as { name: unknown }).name === 'string') {
		const e = err as Error
		const knownType = DOM_EXCEPTION_NAME_TO_TYPE[e.name]
		if (knownType) {
			return { type: knownType, message: e.message || e.name, original: err }
		}
	}
	if (err instanceof Error) {
		return { type: 'unknown', message: err.message || 'unknown', original: err }
	}
	return { type: 'unknown', message: typeof err === 'string' && err ? err : 'unknown', original: err }
}

export interface VocalProps {
	children?:
		| ReactNode
		| ((
				start: () => void,
				stop: () => void,
				isStarted: boolean,
				permissionState: PermissionState | null
		  ) => ReactElement | null)
	commands?: CommandsMap | null
	lang?: string
	grammars?: SpeechGrammarList | null
	timeout?: number
	silenceTimeout?: number | null
	precision?: number
	maxAlternatives?: number
	continuous?: boolean
	interimResults?: boolean
	engine?: SpeechEngineFactory
	ariaLabel?: string
	style?: CSSProperties | null
	className?: string | null
	outlineStyle?: string | null
	onStart?: ((event: Event) => void) | null
	onEnd?: ((event?: Event) => void) | null
	onSpeechStart?: ((event: Event) => void) | null
	onSpeechEnd?: ((event: Event) => void) | null
	onResult?: OnResultCallback | null
	onError?: OnErrorCallback | null
	onNoMatch?: ((event: Event) => void) | null
	onPermission?: ((state: PermissionState) => void) | null
	signal?: AbortSignal | null
}

interface ResultSegmentLike {
	transcript?: string
}

const tryMatchCommand = (results: Iterable<Iterable<ResultSegmentLike>>, trigger: TriggerCommand) => {
	for (const segment of results) {
		for (const alt of segment) {
			if (trigger(alt.transcript ?? '') !== null) return
		}
	}
}

export const DEFAULT_OUTLINE_STYLE = '2px solid'

export const Vocal = ({
	children,
	commands = null,
	lang = 'en-US',
	grammars = null,
	timeout = 3000,
	silenceTimeout = null,
	precision = 0.4, // Fuse.js score threshold for phrase commands only; single-word commands always use exact lookup
	maxAlternatives = 1,
	continuous = false,
	interimResults = false,
	engine,
	ariaLabel = 'start recognition',
	style = null,
	className = null,
	outlineStyle = DEFAULT_OUTLINE_STYLE,
	onStart = null,
	onEnd = null,
	onSpeechStart = null,
	onSpeechEnd = null,
	onResult = null,
	onError = null,
	onNoMatch = null,
	onPermission = null,
	signal = null,
}: VocalProps) => {
	const [isFocused, setIsFocused] = useState(false)
	const isSupported = useMemo(() => isSupportedFn(engine), [engine])

	const [, { start, stop, subscribe, unsubscribe, isRecording: isListening, permissionState }] = useVocal(
		lang,
		grammars,
		maxAlternatives,
		continuous,
		interimResults,
		engine
	)
	const triggerCommand = useCommands(commands, precision)

	const propsRef = useRef<{
		onStart: VocalProps['onStart']
		onEnd: VocalProps['onEnd']
		onSpeechStart: VocalProps['onSpeechStart']
		onSpeechEnd: VocalProps['onSpeechEnd']
		onResult: VocalProps['onResult']
		onError: VocalProps['onError']
		onNoMatch: VocalProps['onNoMatch']
		onPermission: VocalProps['onPermission']
	}>({
		onStart: null,
		onEnd: null,
		onSpeechStart: null,
		onSpeechEnd: null,
		onResult: null,
		onError: null,
		onNoMatch: null,
		onPermission: null,
	})
	propsRef.current = { onStart, onEnd, onSpeechStart, onSpeechEnd, onResult, onError, onNoMatch, onPermission }

	useEffect(() => {
		if (permissionState !== null) propsRef.current.onPermission?.(permissionState)
	}, [permissionState])

	const fireError = useCallback((err: unknown) => {
		propsRef.current.onError?.(classifyError(err))
	}, [])

	const continuousRef = useRef(continuous)
	continuousRef.current = continuous

	const triggerCommandRef = useRef(triggerCommand)
	triggerCommandRef.current = triggerCommand

	const unsubscribeAllRef = useRef<(() => void) | null>(null)
	const onEndRef = useRef<((e?: Event) => void) | null>(null)
	const isEndingRef = useRef(false)

	const silenceTimeoutRef = useRef(silenceTimeout)
	silenceTimeoutRef.current = silenceTimeout

	// Breaks the circular dep: _onEnd → useTimeout(handler) → startTimer captures _onEnd
	const stableTimerCb = useCallback(() => onEndRef.current?.(), [])
	const [startTimer, stopTimer] = useTimeout(stableTimerCb, timeout)
	const [startSilenceTimer, stopSilenceTimer] = useTimeout(stableTimerCb, silenceTimeout ?? 0)

	const stopRecognition = useCallback(() => {
		try {
			stop()
		} catch (error) {
			fireError(error)
			unsubscribeAllRef.current?.()
		}
	}, [stop, fireError])

	const _onStart = useCallback(
		(e: Event) => {
			if (!continuousRef.current) startTimer()
			propsRef.current.onStart?.(e)
		},
		[startTimer]
	)

	const _onSpeechStart = useCallback(
		(e: Event) => {
			stopTimer()
			stopSilenceTimer()
			propsRef.current.onSpeechStart?.(e)
		},
		[stopTimer, stopSilenceTimer]
	)

	const _onSpeechEnd = useCallback(
		(e: Event) => {
			if (continuousRef.current) {
				if ((silenceTimeoutRef.current ?? 0) > 0) startSilenceTimer()
			} else {
				startTimer()
			}
			propsRef.current.onSpeechEnd?.(e)
		},
		[startTimer, startSilenceTimer]
	)

	const _onResult = useCallback(
		(event: SpeechRecognitionEvent | Event, bestAlternative: string) => {
			stopTimer()
			// Continuous mode: vocal 2.x emits one aggregated synthetic event before 'end'; commands are
			// intentionally not matched against the full session transcript
			if (!continuousRef.current) {
				const srEvent = event as SpeechRecognitionEvent
				const segment = srEvent.results?.[srEvent.resultIndex ?? 0]
				const isFinal = segment ? segment.isFinal !== false : true
				if (isFinal) {
					const results =
						srEvent.results !== undefined ? Array.from(srEvent.results, (seg) => Array.from(seg)) : []
					tryMatchCommand(results, triggerCommandRef.current)
					stopRecognition()
				}
			}
			propsRef.current.onResult?.(bestAlternative, event)
		},
		[stopTimer, stopRecognition]
	)

	const _onError = useCallback(
		(error: unknown) => {
			stopRecognition()
			fireError(error)
		},
		[stopRecognition, fireError]
	)

	const _onNoMatch = useCallback(
		(e: Event) => {
			stopTimer()
			// In continuous mode an unrecognized segment must not end the session — the
			// contract is "keep listening across segments". Mirrors the gate in _onResult.
			if (!continuousRef.current) stopRecognition()
			propsRef.current.onNoMatch?.(e)
		},
		[stopTimer, stopRecognition]
	)

	const _onEnd = useCallback(
		(e?: Event) => {
			// Guard against re-entry: a timer firing _onEnd calls stop(), which dispatches 'end'
			// and would re-enter _onEnd, double-firing onEnd
			if (isEndingRef.current) return
			isEndingRef.current = true
			stopTimer()
			stopSilenceTimer()
			try {
				stopRecognition()
				unsubscribeAllRef.current?.()
			} finally {
				isEndingRef.current = false
				propsRef.current.onEnd?.(e)
			}
		},
		[stopTimer, stopSilenceTimer, stopRecognition]
	)

	onEndRef.current = _onEnd

	const HANDLERS = useMemo(
		() => ({
			start: _onStart,
			end: _onEnd,
			speechstart: _onSpeechStart,
			speechend: _onSpeechEnd,
			result: _onResult,
			error: _onError,
			nomatch: _onNoMatch,
		}),
		[_onStart, _onEnd, _onSpeechStart, _onSpeechEnd, _onResult, _onError, _onNoMatch]
	)

	const startRecognition = useCallback(() => {
		try {
			stopSilenceTimer()
			unsubscribeAllRef.current?.()
			Object.entries(HANDLERS).forEach(([event, fn]) => subscribe(event, fn as (e: Event) => void))
			unsubscribeAllRef.current = () =>
				Object.entries(HANDLERS).forEach(([event, fn]) => unsubscribe(event, fn as (e: Event) => void))
			// useVocal's start() rejects on microphone/permission errors — catch
			// the async rejection so it doesn't surface as an UnhandledPromiseRejection.
			start({ signal: signal ?? undefined }).catch(_onError)
		} catch (error) {
			_onError(error)
		}
	}, [HANDLERS, subscribe, unsubscribe, start, stopSilenceTimer, _onError, signal])

	const _renderDefault = () => (
		<button
			type="button"
			data-testid="__vocal-root__"
			aria-label={ariaLabel}
			aria-pressed={isListening}
			style={
				className
					? undefined
					: {
							width: 24,
							height: 24,
							backgroundColor: 'transparent', // `background: none` shorthand resets all sub-properties; jsdom 29 + jest-dom v6 don't reflect that correctly via getComputedStyle
							border: 'none',
							padding: 0,
							cursor: 'pointer',
							...(style ?? {}),
							...(outlineStyle ? { outline: isFocused ? outlineStyle : 'none' } : {}),
						}
			}
			className={className ?? undefined}
			onFocus={() => setIsFocused(true)}
			onBlur={() => setIsFocused(false)}
			onClick={isListening ? stopRecognition : startRecognition}
		>
			<Icon isActive={isListening} color="#aaa" />
		</button>
	)

	const _renderChildren = () => {
		if (isSupported) {
			if (isFunction(children)) {
				return (
					children as (
						start: () => void,
						stop: () => void,
						isStarted: boolean,
						permissionState: PermissionState | null
					) => ReactElement | null
				)(startRecognition, stopRecognition, isListening, permissionState)
			} else if (isValidElement(children)) {
				const typed = children as ReactElement<{
					onClick?: (e: ReactMouseEvent) => void
					'aria-pressed'?: boolean
					'aria-label'?: string
				}>
				const childOnClick = typed.props.onClick
				const childAriaLabel = typed.props['aria-label']
				return cloneElement(typed, {
					onClick: (e: ReactMouseEvent) => {
						childOnClick?.(e)
						if (e.defaultPrevented) return
						;(isListening ? stopRecognition : startRecognition)()
					},
					'aria-pressed': isListening,
					'aria-label': childAriaLabel ?? ariaLabel,
				})
			} else {
				return _renderDefault()
			}
		}
		return null
	}

	return _renderChildren()
}
