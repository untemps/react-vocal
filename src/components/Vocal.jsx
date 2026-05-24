import React, { cloneElement, isValidElement, useCallback, useMemo, useRef } from 'react'
import { isSupported } from '@untemps/vocal'
import { isFunction } from '@untemps/utils/function/isFunction'

import useVocal from '../hooks/useVocal'
import useTimeout from '../hooks/useTimeout'
import useCommands from '../hooks/useCommands'

import Icon from './Icon'

const tryMatchCommand = (results, trigger) => {
	if (!results) return
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
	__rsInstance,
}) => {
	const buttonRef = useRef(null)

	const [, { start, stop, subscribe, unsubscribe, isRecording: isListening }] = useVocal(
		lang,
		grammars,
		maxAlternatives,
		continuous,
		__rsInstance
	)
	const triggerCommand = useCommands(commands, precision)

	const propsRef = useRef({})
	propsRef.current = { onStart, onEnd, onSpeechStart, onSpeechEnd, onResult, onError, onNoMatch }

	const continuousRef = useRef(continuous)
	continuousRef.current = continuous

	const triggerCommandRef = useRef(triggerCommand)
	triggerCommandRef.current = triggerCommand

	const unsubscribeAllRef = useRef(null)
	const onEndRef = useRef(null)

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
		(e) => {
			startTimer()
			propsRef.current.onStart?.(e)
		},
		[startTimer]
	)

	const _onSpeechStart = useCallback(
		(e) => {
			stopTimer()
			propsRef.current.onSpeechStart?.(e)
		},
		[stopTimer]
	)

	const _onSpeechEnd = useCallback(
		(e) => {
			startTimer()
			// silenceTimeout fires stop() after N ms of silence following speech in continuous mode.
			// Anchored on speechend because vocal 2.x intercepts intermediate result events in continuous mode,
			// so _onResult only runs once on the aggregated end-of-session event.
			if (continuousRef.current && silenceTimeoutRef.current > 0) startSilenceTimer()
			propsRef.current.onSpeechEnd?.(e)
		},
		[startTimer, startSilenceTimer]
	)

	const _onResult = useCallback(
		(event, bestAlternative) => {
			stopTimer()
			// In continuous mode, vocal 2.x emits a single aggregated synthetic event just before 'end' —
			// no need to accumulate. tryMatchCommand is skipped in continuous because commands are
			// intentionally not evaluated against the full session transcript.
			if (!continuousRef.current) {
				tryMatchCommand(event?.results, triggerCommandRef.current)
				stopRecognition()
			}
			propsRef.current.onResult?.(bestAlternative, event)
		},
		[stopTimer, stopRecognition]
	)

	const _onError = useCallback(
		(error) => {
			stopRecognition()
			propsRef.current.onError?.(error)
		},
		[stopRecognition]
	)

	const _onNoMatch = useCallback(
		(e) => {
			stopTimer()
			stopRecognition()
			propsRef.current.onNoMatch?.(e)
		},
		[stopTimer, stopRecognition]
	)

	const _onEnd = useCallback(
		(e) => {
			stopTimer()
			stopSilenceTimer()
			try {
				stopRecognition()
				unsubscribeAllRef.current?.()
			} finally {
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
	unsubscribeAllRef.current = () => Object.entries(HANDLERS).forEach(([event, fn]) => unsubscribe?.(event, fn))

	const startRecognition = useCallback(() => {
		try {
			stopSilenceTimer()
			Object.entries(HANDLERS).forEach(([event, fn]) => subscribe(event, fn))
			start({ signal })
		} catch (error) {
			_onError(error)
		}
	}, [HANDLERS, subscribe, start, stopSilenceTimer, _onError, signal])

	const _onFocus = () => {
		if (!className && outlineStyle) {
			buttonRef.current.style.outline = outlineStyle
		}
	}

	const _onBlur = () => {
		if (!className && outlineStyle) {
			buttonRef.current.style.outline = 'none'
		}
	}

	const _renderDefault = () => (
		<button
			data-testid="__vocal-root__"
			ref={buttonRef}
			aria-label={ariaLabel}
			aria-pressed={isListening}
			style={
				className
					? null
					: {
							width: 24,
							height: 24,
							backgroundColor: 'transparent', // `background: none` shorthand resets all sub-properties; jsdom 29 + jest-dom v6 don't reflect that correctly via getComputedStyle
							border: 'none',
							padding: 0,
							cursor: !continuous && isListening ? 'default' : 'pointer',
							...style,
					  }
			}
			className={className}
			onFocus={_onFocus}
			onBlur={_onBlur}
			onClick={isListening ? stopRecognition : startRecognition}
		>
			<Icon isActive={isListening} color="#aaa" />
		</button>
	)

	const _renderChildren = () => {
		if (isSupported()) {
			if (isFunction(children)) {
				return children(startRecognition, stopRecognition, isListening)
			} else if (isValidElement(children)) {
				return cloneElement(children, {
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
