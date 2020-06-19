import React, { cloneElement, isValidElement, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import SpeechRecognitionWrapper from './SpeechRecognitionWrapper'

import MicrophoneIcon from './MicrophoneIcon'

const Vocal = ({
	children,
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
	__recognitionInstance,
}) => {
	const timeoutRef = useRef(null)
	const recognitionRef = useRef(null)

	const [isListening, setIsListening] = useState(false)

	useEffect(() => {
		if (SpeechRecognitionWrapper.isSupported) {
			recognitionRef.current = __recognitionInstance || new SpeechRecognitionWrapper()
			return () => {
				recognitionRef.current.abort()
				recognitionRef.current.cleanup()
				clearTimeout(timeoutRef.current)
			}
		}
	}, [__recognitionInstance])

	const startTimer = () => {
		timeoutRef.current = setTimeout(_onEnd, timeout)
	}

	const stopTimer = () => {
		clearTimeout(timeoutRef.current)
		timeoutRef.current = null
	}

	const startRecognition = () => {
		try {
			setIsListening(true)

			const { current: r } = recognitionRef
			r.addEventListener('start', _onStart)
			r.addEventListener('end', _onEnd)
			r.addEventListener('speechstart', _onSpeechStart)
			r.addEventListener('speechend', _onSpeechEnd)
			r.addEventListener('result', _onResult)
			r.addEventListener('error', _onError)
			r.addEventListener('nomatch', _onNoMatch)
			r.start()
		} catch (error) {
			_onError(error)
		}
	}

	const stopRecognition = () => {
		try {
			setIsListening(false)

			const { current: r } = recognitionRef
			r.removeEventListener('start', _onStart)
			r.removeEventListener('end', _onEnd)
			r.removeEventListener('speechstart', _onSpeechStart)
			r.removeEventListener('speechend', _onSpeechEnd)
			r.removeEventListener('result', _onResult)
			r.removeEventListener('error', _onError)
			r.removeEventListener('nomatch', _onNoMatch)
			r.stop()
		} catch (error) {
			!!onError && onError(error)
		}
	}

	const start = () => {
		startTimer()
	}

	const end = () => {
		stopTimer()
		stopRecognition()
	}

	const _onClick = () => {
		startRecognition()
	}

	const _onStart = (e) => {
		start()

		!!onStart && onStart(e)
	}

	const _onEnd = (e) => {
		end()

		!!onEnd && onEnd(e)
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
		stopRecognition()

		!!onResult && onResult(result, event)
	}

	const _onError = (error) => {
		stopRecognition()

		!!onError && onError(error)
	}

	const _onNoMatch = (e) => {
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
		>
			<MicrophoneIcon isActive={isListening} iconColor="#aaa" />
		</div>
	)

	return (
		SpeechRecognitionWrapper.isSupported &&
		cloneElement(isValidElement(children) ? children : _renderDefault(), {
			...(!isListening && { onClick: _onClick }),
		})
	)
}

Vocal.propTypes = {
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
	/** Defines the handler called when a result is recognized */
	onResult: PropTypes.func,
	/** Defines the handler called when an error occurs */
	onError: PropTypes.func,
	/** Defines the handler called when no result can be recognized */
	onNoMatch: PropTypes.func,
}

Vocal.defaultProps = {
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
