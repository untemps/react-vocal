import {
	cloneElement,
	isValidElement,
	useCallback,
	useMemo,
	useRef,
	type CSSProperties,
	type ReactElement,
	type ReactNode,
} from 'react'
import { isSupported as isSupportedFn, type VocalInstance } from '@untemps/vocal'
import { isFunction } from '@untemps/utils/function/isFunction'

import useVocal from '../hooks/useVocal'
import useTimeout from '../hooks/useTimeout'
import useCommands, { type CommandsMap, type TriggerCommand } from '../hooks/useCommands'

import Icon from './Icon'

export type OnResultCallback = (bestAlternative: string, event: SpeechRecognitionEvent | Event) => void

export interface VocalProps {
	children?: ReactNode | ((start: () => void, stop: () => void, isStarted: boolean) => ReactElement | null)
	commands?: CommandsMap | null
	lang?: string
	grammars?: SpeechGrammarList | null
	timeout?: number
	silenceTimeout?: number | null
	precision?: number
	maxAlternatives?: number
	continuous?: boolean
	ariaLabel?: string
	style?: CSSProperties | null
	className?: string | null
	outlineStyle?: string | null
	onStart?: ((event: Event) => void) | null
	onEnd?: ((event?: Event) => void) | null
	onSpeechStart?: ((event: Event) => void) | null
	onSpeechEnd?: ((event: Event) => void) | null
	onResult?: OnResultCallback | null
	onError?: ((error: unknown) => void) | null
	onNoMatch?: ((event: Event) => void) | null
	signal?: AbortSignal | null
	/**
	 * Internal/testing escape hatch. Injects a custom vocal instance. Not part of the
	 * stable public API — see issue #136 for the redesign of this surface.
	 */
	__rsInstance?: VocalInstance | null
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

const Vocal = ({
	children,
	commands = null,
	lang = 'en-US',
	grammars = null,
	timeout = 3000,
	silenceTimeout = null,
	precision = 0.4, // Fuse.js score threshold for phrase commands only; single-word commands always use exact lookup
	maxAlternatives = 1,
	continuous = false,
	ariaLabel = 'start recognition',
	style = null,
	className = null,
	outlineStyle = '2px solid',
	onStart = null,
	onEnd = null,
	onSpeechStart = null,
	onSpeechEnd = null,
	onResult = null,
	onError = null,
	onNoMatch = null,
	signal = null,
	__rsInstance = null,
}: VocalProps) => {
	const buttonRef = useRef<HTMLButtonElement | null>(null)
	const isSupported = useMemo(() => isSupportedFn(), [])

	const [, { start, stop, subscribe, unsubscribe, isRecording: isListening }] = useVocal(
		lang,
		grammars,
		maxAlternatives,
		continuous,
		__rsInstance
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
	}>({
		onStart: null,
		onEnd: null,
		onSpeechStart: null,
		onSpeechEnd: null,
		onResult: null,
		onError: null,
		onNoMatch: null,
	})
	propsRef.current = { onStart, onEnd, onSpeechStart, onSpeechEnd, onResult, onError, onNoMatch }

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
			propsRef.current.onError?.(error)
			unsubscribeAllRef.current?.()
		}
	}, [stop])

	const _onStart = useCallback(
		(e: Event) => {
			startTimer()
			propsRef.current.onStart?.(e)
		},
		[startTimer]
	)

	const _onSpeechStart = useCallback(
		(e: Event) => {
			stopTimer()
			propsRef.current.onSpeechStart?.(e)
		},
		[stopTimer]
	)

	const _onSpeechEnd = useCallback(
		(e: Event) => {
			startTimer()
			// silenceTimeout fires stop() after N ms of silence following speech in continuous mode.
			// Anchored on speechend because vocal 2.x intercepts intermediate result events in continuous mode,
			// so _onResult only runs once on the aggregated end-of-session event.
			if (continuousRef.current && (silenceTimeoutRef.current ?? 0) > 0) startSilenceTimer()
			propsRef.current.onSpeechEnd?.(e)
		},
		[startTimer, startSilenceTimer]
	)

	const _onResult = useCallback(
		(event: SpeechRecognitionEvent | Event, bestAlternative: string) => {
			stopTimer()
			// In continuous mode, vocal 2.x emits a single aggregated synthetic event just before 'end' —
			// no need to accumulate. tryMatchCommand is skipped in continuous because commands are
			// intentionally not evaluated against the full session transcript.
			if (!continuousRef.current) {
				const results =
					(event as SpeechRecognitionEvent).results !== undefined
						? Array.from((event as SpeechRecognitionEvent).results, (segment) => Array.from(segment))
						: []
				tryMatchCommand(results, triggerCommandRef.current)
				stopRecognition()
			}
			propsRef.current.onResult?.(bestAlternative, event)
		},
		[stopTimer, stopRecognition]
	)

	const _onError = useCallback(
		(error: unknown) => {
			stopRecognition()
			propsRef.current.onError?.(error)
		},
		[stopRecognition]
	)

	const _onNoMatch = useCallback(
		(e: Event) => {
			stopTimer()
			stopRecognition()
			propsRef.current.onNoMatch?.(e)
		},
		[stopTimer, stopRecognition]
	)

	const _onEnd = useCallback(
		(e?: Event) => {
			// Guard against re-entry: when a timer (timeout/silenceTimeout) fires _onEnd,
			// stopRecognition() calls vocal.stop() which dispatches the 'end' event, which
			// would re-enter _onEnd and double-fire onEnd.
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

	// Assigned inline (not in useEffect) so it's ready before any event fires
	unsubscribeAllRef.current = () =>
		Object.entries(HANDLERS).forEach(([event, fn]) => unsubscribe?.(event, fn as (e: Event) => void))

	const startRecognition = useCallback(() => {
		try {
			stopSilenceTimer()
			Object.entries(HANDLERS).forEach(([event, fn]) => subscribe(event, fn as (e: Event) => void))
			// vocal 2.x rejects on microphone/permission errors — catch the async
			// rejection so it doesn't surface as an UnhandledPromiseRejection.
			start({ signal: signal ?? undefined })?.catch?.(_onError)
		} catch (error) {
			_onError(error)
		}
	}, [HANDLERS, subscribe, start, stopSilenceTimer, _onError, signal])

	const _onFocus = useCallback(() => {
		if (!className && outlineStyle && buttonRef.current) {
			buttonRef.current.style.outline = outlineStyle
		}
	}, [className, outlineStyle])

	const _onBlur = useCallback(() => {
		if (!className && outlineStyle && buttonRef.current) {
			buttonRef.current.style.outline = 'none'
		}
	}, [className, outlineStyle])

	const _renderDefault = () => (
		<button
			data-testid="__vocal-root__"
			ref={buttonRef}
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
							cursor: !continuous && isListening ? 'default' : 'pointer',
							...(style ?? {}),
						}
			}
			className={className ?? undefined}
			onFocus={_onFocus}
			onBlur={_onBlur}
			onClick={isListening ? stopRecognition : startRecognition}
		>
			<Icon isActive={isListening} color="#aaa" />
		</button>
	)

	const _renderChildren = () => {
		if (isSupported) {
			if (isFunction(children)) {
				return (children as (start: () => void, stop: () => void, isStarted: boolean) => ReactElement | null)(
					startRecognition,
					stopRecognition,
					isListening
				)
			} else if (isValidElement(children)) {
				return cloneElement(children as ReactElement<{ onClick?: () => void }>, {
					...(!isListening && { onClick: startRecognition }),
				})
			} else {
				return _renderDefault()
			}
		}
		return null
	}

	return _renderChildren()
}

export default Vocal
