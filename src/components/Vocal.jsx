import React, { cloneElement, isValidElement, useCallback, useMemo, useRef, useState } from 'react'
import { Vocal as SpeechRecognitionWrapper } from '@untemps/vocal'
import { isFunction } from '@untemps/utils/function/isFunction'

import useVocal from '../hooks/useVocal'
import useTimeout from '../hooks/useTimeout'
import useCommands from '../hooks/useCommands'

import Icon from './Icon'

const tryMatchCommand = (segmentData, trigger) => {
	for (const { alternatives } of segmentData) {
		for (const a of alternatives) {
			if (trigger(a) !== null) return
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
	__rsInstance,
}) => {
	const buttonRef = useRef(null)
	const [isListening, setIsListening] = useState(false)

	const [, { start, stop, subscribe, unsubscribe }] = useVocal(lang, grammars, maxAlternatives, continuous, __rsInstance)
	const triggerCommand = useCommands(commands, precision)

	const propsRef = useRef({})
	propsRef.current = { onStart, onEnd, onSpeechStart, onSpeechEnd, onResult, onError, onNoMatch }

	const continuousRef = useRef(continuous)
	continuousRef.current = continuous

	// In continuous mode, transcript accumulates across segments and is only emitted via onResult on session end
	const accumulatedRef = useRef({ transcript: '', event: null })

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
			setIsListening(false)
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
			propsRef.current.onSpeechEnd?.(e)
		},
		[startTimer]
	)

	const _onResult = useCallback(
		(event) => {
			const segmentData = Array.from(event?.results ?? [], (segment) => {
				let best = { confidence: -Infinity, transcript: '' }
				const alternatives = []
				for (let j = 0; j < segment.length; j++) {
					const alt = segment[j]
					alternatives.push(alt.transcript ?? '')
					if (alt.confidence === undefined || alt.confidence > best.confidence) {
						best = alt
					}
				}
				return { best: best.transcript ?? '', alternatives }
			})
			const transcript = segmentData.map((s) => s.best).join('')

			stopTimer()
			if (continuousRef.current) {
				// Accumulate — onResult fires once at session end, not after each segment
				accumulatedRef.current.transcript = transcript
				accumulatedRef.current.event = event
				if (silenceTimeoutRef.current > 0) startSilenceTimer()
			} else {
				tryMatchCommand(segmentData, triggerCommandRef.current)
				stopRecognition()
				propsRef.current.onResult?.(transcript, event)
			}
		},
		[stopTimer, startSilenceTimer, stopRecognition]
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
				if (continuousRef.current && accumulatedRef.current.transcript) {
					propsRef.current.onResult?.(accumulatedRef.current.transcript, accumulatedRef.current.event)
					accumulatedRef.current.transcript = ''
					accumulatedRef.current.event = null
				}
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
			accumulatedRef.current.transcript = ''
			accumulatedRef.current.event = null
			stopSilenceTimer()
			setIsListening(true)
			Object.entries(HANDLERS).forEach(([event, fn]) => subscribe(event, fn))
			start()
		} catch (error) {
			_onError(error)
		}
	}, [HANDLERS, subscribe, start, stopSilenceTimer, _onError])

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
		if (SpeechRecognitionWrapper.isSupported) {
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
