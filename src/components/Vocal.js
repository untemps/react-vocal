import React, { cloneElement, isValidElement, useRef, useState, useCallback, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Vocal as SpeechRecognitionWrapper } from '@untemps/vocal'
import { isFunction } from '@untemps/utils/function/isFunction'

import useVocal from '../hooks/useVocal'
import useTimeout from '../hooks/useTimeout'
import useCommands from '../hooks/useCommands'

import Icon from './Icon'

const Vocal = ({
	children,
	commands,
	lang,
	grammars,
	timeout,
	ariaLabel,
	style,
	className,
	outlineStyle,
	onStart,
	onEnd,
	onSpeechStart,
	onSpeechEnd,
	onResult,
	onError,
	onNoMatch,
	__rsInstance,
}) => {
	const buttonRef = useRef(null)
	const [isListening, setIsListening] = useState(false)

	const [, { start, stop, subscribe, unsubscribe }] = useVocal(lang, grammars, __rsInstance)

	const stopRef = useRef(stop)
	stopRef.current = stop

	const triggerCommand = useCommands(commands)
	const triggerCommandRef = useRef(triggerCommand)
	triggerCommandRef.current = triggerCommand

	const unsubscribeAllRef = useRef(null)
	const onEndRef = useRef(null)

	const propsRef = useRef({})
	propsRef.current = { onStart, onEnd, onSpeechStart, onSpeechEnd, onResult, onError, onNoMatch }

	const _onClick = () => {
		startRecognition()
	}

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

	const stopRecognition = useCallback(() => {
		try {
			setIsListening(false)
			stopRef.current()
			unsubscribeAllRef.current?.()
		} catch (error) {
			propsRef.current.onError?.(error)
		}
	}, [])

	const stableTimerCb = useCallback(() => onEndRef.current?.(), [])
	const [startTimer, stopTimer] = useTimeout(stableTimerCb, timeout)

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
		(event, result) => {
			stopTimer()
			stopRecognition()
			triggerCommandRef.current(result)
			propsRef.current.onResult?.(result, event)
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
			stopRecognition()
			propsRef.current.onEnd?.(e)
		},
		[stopTimer, stopRecognition]
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

	useEffect(() => {
		unsubscribeAllRef.current = () => Object.entries(HANDLERS).forEach(([event, fn]) => unsubscribe(event, fn))
	}, [HANDLERS, unsubscribe])

	const startRecognition = useCallback(() => {
		try {
			setIsListening(true)
			Object.entries(HANDLERS).forEach(([event, fn]) => subscribe(event, fn))
			start()
		} catch (error) {
			_onError(error)
		}
	}, [HANDLERS, subscribe, start, _onError])

	const _renderDefault = () => (
		<button
			data-testid="__vocal-root__"
			ref={buttonRef}
			role="button"
			aria-label={ariaLabel}
			style={
				className
					? null
					: {
							width: 24,
							height: 24,
							background: 'none',
							border: 'none',
							padding: 0,
							cursor: !isListening ? 'pointer' : 'default',
							...style,
					  }
			}
			className={className}
			onFocus={_onFocus}
			onBlur={_onBlur}
			onClick={_onClick}
		>
			<Icon isActive={isListening} iconColor="#aaa" />
		</button>
	)

	const _renderChildren = (children) => {
		if (SpeechRecognitionWrapper.isSupported) {
			if (isFunction(children)) {
				return children(startRecognition, stopRecognition, isListening)
			} else if (isValidElement(children)) {
				return cloneElement(children, {
					...(!isListening && { onClick: _onClick }),
				})
			} else {
				return _renderDefault()
			}
		}
		return null
	}

	return _renderChildren(children)
}

Vocal.propTypes = {
	/** Defines callbacks to be triggered when keys are detected by the recognition */
	commands: PropTypes.objectOf(PropTypes.func),
	/** Defines the language understood by the recognition (https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang) */
	lang: PropTypes.string,
	/** Defines the grammars understood by the recognition (https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/grammars) */
	grammars: PropTypes.object,
	/** Defines the time in ms to wait before discarding the recognition */
	timeout: PropTypes.number,
	/** Defines the a11y label for the default button */
	ariaLabel: PropTypes.string,
	/** Defines the styles of the default element if className is not specified */
	style: PropTypes.object,
	/** Defines the class of the default element */
	className: PropTypes.string,
	/** Defines the default style of the focus outline. if null the default behaviour is used */
	outlineStyle: PropTypes.string,
	/** Defines the handler called when the recognition starts */
	onStart: PropTypes.func,
	/** Defines the handler called when the recognition ends */
	onEnd: PropTypes.func,
	/** Defines the handler called when the speech starts */
	onSpeechStart: PropTypes.func,
	/** Defines the handler called when the speech ends */
	onSpeechEnd: PropTypes.func,
	/** Defines the handler called when a result is returned from te recognition */
	onResult: PropTypes.func,
	/** Defines the handler called when an error occurs */
	onError: PropTypes.func,
	/** Defines the handler called when no result can be recognized */
	onNoMatch: PropTypes.func,
}

Vocal.defaultProps = {
	commands: null,
	lang: 'en-US',
	grammars: null,
	timeout: 3000,
	ariaLabel: 'start recognition',
	style: null,
	className: null,
	outlineStyle: '2px solid',
	onStart: null,
	onEnd: null,
	onSpeechStart: null,
	onSpeechEnd: null,
	onResult: null,
	onError: null,
	onNoMatch: null,
}

export default Vocal
