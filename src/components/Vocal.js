import React, { cloneElement, isValidElement, useState } from 'react'
import PropTypes from 'prop-types'

import SpeechRecognitionWrapper from '../core/SpeechRecognitionWrapper'

import isFunc from '../utils/isFunc'

import useVocal from '../hooks/useVocal'
import useTimeout from '../hooks/useTimeout'

import Icon from './Icon'

const Vocal = ({
	children,
	lang,
	grammars,
	timeout,
	ariaLabel,
	tabIndex,
	style,
	className,
	onStart,
	onEnd,
	onSpeechStart,
	onSpeechEnd,
	onResult,
	onError,
	onNoMatch,
	__rsInstance,
}) => {
	const [isListening, setIsListening] = useState(false)

	const [, { start, stop, subscribe, unsubscribe }] = useVocal(lang, grammars, __rsInstance)

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

	const _onResult = (result, event) => {
		stopTimer()
		stopRecognition()

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
		<div
			data-testid="__vocal-root__"
			role="button"
			aria-label={ariaLabel}
			tabIndex={tabIndex}
			style={className ? null : { width: 24, height: 24, cursor: !isListening ? 'pointer' : null, ...style }}
			className={className}
			onClick={_onClick}
		>
			<Icon isActive={isListening} iconColor="#aaa" />
		</div>
	)

	const _renderChildren = (children) => {
		if (SpeechRecognitionWrapper.isSupported) {
			if (isFunc(children)) {
				return children(startRecognition, stopRecognition)
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
	/** Defines the language understood by the recognition (https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang) */
	lang: PropTypes.string,
	/** Defines the grammars understood by the recognition (https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/grammars) */
	grammars: PropTypes.object,
	/** Defines the time in ms to wait before discarding the recognition */
	timeout: PropTypes.number,
	/** Defines the a11y label for the default button */
	ariaLabel: PropTypes.string,
	/** Defines the a11y tab index for the default button */
	tabIndex: PropTypes.number,
	/** Defines the styles of the default element if className is not specified */
	style: PropTypes.object,
	/** Defines the class of the default element */
	className: PropTypes.string,
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
	lang: 'en-US',
	grammars: null,
	timeout: 3000,
	ariaLabel: 'speech',
	tabIndex: -1,
	style: null,
	className: null,
	onStart: null,
	onEnd: null,
	onSpeechStart: null,
	onSpeechEnd: null,
	onResult: null,
	onError: null,
	onNoMatch: null,
}

export default Vocal
