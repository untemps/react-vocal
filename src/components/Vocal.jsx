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

		unsubscribe('start', _onStart)
		unsubscribe('end', _onEnd)
		unsubscribe('speechstart', _onSpeechStart)
		unsubscribe('speechend', _onSpeechEnd)
		unsubscribe('result', _onResult)
		unsubscribe('error', _onError)
		unsubscribe('nomatch', _onNoMatch)

		!!onEnd && onEnd(e)
	}

	const [startTimer, stopTimer] = useTimeout(_onEnd, timeout)

	const startRecognition = () => {
		try {
			setIsListening(true)

			subscribe('start', _onStart)
			subscribe('end', _onEnd)
			subscribe('speechstart', _onSpeechStart)
			subscribe('speechend', _onSpeechEnd)
			subscribe('result', _onResult)
			subscribe('error', _onError)
			subscribe('nomatch', _onNoMatch)

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
			!!onError && onError(error)
		}
	}

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

	const _onStart = (e) => {
		startTimer()

		!!onStart && onStart(e)
	}

	const _onSpeechStart = (e) => {
		stopTimer()

		!!onSpeechStart && onSpeechStart(e)
	}

	const _onSpeechEnd = (e) => {
		startTimer()

		!!onSpeechEnd && onSpeechEnd(e)
	}

	const _onResult = (event, result) => {
		stopTimer()
		stopRecognition()

		triggerCommand(result)

		!!onResult && onResult(result, event)
	}

	const _onError = (error) => {
		stopRecognition()

		!!onError && onError(error)
	}

	const _onNoMatch = (e) => {
		stopTimer()
		stopRecognition()

		!!onNoMatch && onNoMatch(e)
	}

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
			onClick={_onClick}
		>
			<Icon isActive={isListening} color="#aaa" />
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

export default Vocal
