import React, { cloneElement, isValidElement, useRef, useState } from 'react'
import { Vocal as SpeechRecognitionWrapper } from '@untemps/vocal'
import { isFunction } from '@untemps/utils/function/isFunction'

import useVocal from '../hooks/useVocal'
import useTimeout from '../hooks/useTimeout'
import useCommands from '../hooks/useCommands'

import Icon from './Icon'

const Vocal = ({
	children,
	commands = null,
	lang = 'en-US',
	grammars = null,
	timeout = 3000,
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

	const [, { start, stop, subscribe, unsubscribe }] = useVocal(lang, grammars, __rsInstance)
	const triggerCommand = useCommands(commands)

	const _onEnd = (e) => {
		stopTimer()
		stopRecognition()
		unsubscribeAll()
		onEnd?.(e)
	}

	const [startTimer, stopTimer] = useTimeout(_onEnd, timeout)

	const startRecognition = () => {
		try {
			setIsListening(true)
			subscribeAll()
			start()
		} catch (error) {
			_onError(error)
		}
	}

	const stopRecognition = () => {
		try {
			setIsListening(false)
			stop()
		} catch (error) {
			onError?.(error)
		}
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

	const _onStart = (e) => {
		startTimer()
		onStart?.(e)
	}

	const _onSpeechStart = (e) => {
		stopTimer()
		onSpeechStart?.(e)
	}

	const _onSpeechEnd = (e) => {
		startTimer()
		onSpeechEnd?.(e)
	}

	const _onResult = (event, result) => {
		stopTimer()
		stopRecognition()
		triggerCommand(result)
		onResult?.(result, event)
	}

	const _onError = (error) => {
		stopRecognition()
		onError?.(error)
	}

	const _onNoMatch = (e) => {
		stopTimer()
		stopRecognition()
		onNoMatch?.(e)
	}

	const HANDLERS = {
		start: _onStart,
		end: _onEnd,
		speechstart: _onSpeechStart,
		speechend: _onSpeechEnd,
		result: _onResult,
		error: _onError,
		nomatch: _onNoMatch,
	}

	const subscribeAll = () => Object.entries(HANDLERS).forEach(([event, handler]) => subscribe(event, handler))
	const unsubscribeAll = () => Object.entries(HANDLERS).forEach(([event, handler]) => unsubscribe(event, handler))

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
							backgroundColor: 'transparent', // `background: none` shorthand resets all sub-properties; jsdom 29 + jest-dom v6 don't reflect that correctly via getComputedStyle
							border: 'none',
							padding: 0,
							cursor: !isListening ? 'pointer' : 'default',
							...style,
					  }
			}
			className={className}
			onFocus={_onFocus}
			onBlur={_onBlur}
			onClick={startRecognition}
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
