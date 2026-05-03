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
global.SpeechRecognition = vi.fn(function () {
	const handlers = {}
	return {
		addEventListener: vi.fn(function (type, callback) {
			handlers[type] = callback
		}),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
		start: vi.fn(function () {
			handlers.start?.()
		}),
		stop: vi.fn(function () {
			handlers.end?.()
		}),
		abort: vi.fn(function () {
			handlers.end?.()
		}),
		say: vi.fn(function (sentence) {
			handlers.speechstart?.()

			const resultEvent = new Event('result')
			resultEvent.resultIndex = 0
			resultEvent.results = [[{ transcript: sentence }]]
			if (sentence) {
				handlers.result?.(resultEvent)
			} else {
				handlers.nomatch?.()
			}
			handlers.speechend?.()
		}),
	}
})
