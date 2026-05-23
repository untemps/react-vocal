import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

Object.defineProperty(global, 'navigator', {
	value: { userAgent: 'node.js' },
	writable: true,
	configurable: true,
})
global.PermissionStatus = vi.fn(function () {
	return {
		state: 'granted',
		addEventListener: vi.fn(),
	}
})
global.Permissions = vi.fn(function () {
	return {
		query: vi.fn().mockResolvedValue(new PermissionStatus()),
	}
})
Object.defineProperty(global.navigator, 'permissions', {
	value: new Permissions(),
	writable: true,
	configurable: true,
})
global.MediaDevices = vi.fn(function () {
	return {
		getUserMedia: vi.fn().mockResolvedValue('foo'),
	}
})
Object.defineProperty(global.navigator, 'mediaDevices', {
	value: new MediaDevices(),
	writable: true,
	configurable: true,
})
global.SpeechGrammarList = vi.fn(function () {
	return {
		length: 0,
	}
})

let currentSr = null
global.__getSpeechRecognition = () => currentSr

global.SpeechRecognition = vi.fn(function () {
	const handlers = {}
	let accumulatedResults = []
	const sr = {
		addEventListener: vi.fn(function (type, callback) {
			handlers[type] = callback
		}),
		removeEventListener: vi.fn(function (type) {
			delete handlers[type]
		}),
		dispatchEvent: vi.fn(),
		start: vi.fn(function () {
			accumulatedResults = []
			handlers.start?.(new Event('start'))
		}),
		stop: vi.fn(function () {
			handlers.end?.(new Event('end'))
		}),
		abort: vi.fn(function () {
			handlers.end?.(new Event('end'))
		}),
		say: vi.fn(function (input) {
			handlers.speechstart?.(new Event('speechstart'))

			const newSegments = Array.isArray(input) ? input : input ? [[{ transcript: input }]] : []
			const resultIndex = accumulatedResults.length
			const segmentsWithFinal = newSegments.map((segment) => {
				const arr = segment.slice()
				Object.defineProperty(arr, 'isFinal', { value: true })
				Object.defineProperty(arr, 'item', { value: (i) => arr[i] })
				return arr
			})
			accumulatedResults = [...accumulatedResults, ...segmentsWithFinal]

			const resultsArray = accumulatedResults.slice()
			Object.defineProperty(resultsArray, 'item', { value: (i) => resultsArray[i] })

			const resultEvent = new Event('result')
			resultEvent.resultIndex = resultIndex
			resultEvent.results = resultsArray
			handlers.speechend?.(new Event('speechend'))
			if (input) {
				handlers.result?.(resultEvent)
			} else {
				handlers.nomatch?.(new Event('nomatch'))
			}
		}),
		end: vi.fn(function () {
			handlers.end?.(new Event('end'))
		}),
		error: vi.fn(function (err) {
			handlers.error?.(err)
		}),
	}
	currentSr = sr
	return sr
})
