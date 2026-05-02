import '@testing-library/jest-dom/extend-expect'
import { toBeInTheDocument, toHaveAttribute, toHaveStyle } from '@testing-library/jest-dom/matchers'

expect.extend({ toBeInTheDocument, toHaveAttribute, toHaveStyle })

Object.defineProperty(global, 'navigator', {
	value: { userAgent: 'node.js' },
	writable: true,
	configurable: true,
})
global.PermissionStatus = jest.fn(() => ({
	state: 'granted',
	addEventListener: jest.fn(),
}))
const status = new PermissionStatus()
global.Permissions = jest.fn(() => ({
	query: jest.fn().mockResolvedValue(status),
}))
Object.defineProperty(global.navigator, 'permissions', {
	value: new Permissions(),
	writable: true,
	configurable: true,
})
global.MediaDevices = jest.fn(() => ({
	getUserMedia: jest.fn().mockResolvedValue('foo'),
}))
Object.defineProperty(global.navigator, 'mediaDevices', {
	value: new MediaDevices(),
	writable: true,
	configurable: true,
})
global.SpeechGrammarList = jest.fn(() => ({
	length: 0,
}))
global.SpeechRecognition = jest.fn(() => {
	const handlers = {}
	return {
		addEventListener: jest.fn((type, callback) => {
			handlers[type] = callback
		}),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
		start: jest.fn(() => {
			!!handlers.start && handlers.start()
		}),
		stop: jest.fn(() => {
			!!handlers.end && handlers.end()
		}),
		abort: jest.fn(() => {
			!!handlers.end && handlers.end()
		}),
		say: jest.fn((sentence) => {
			!!handlers.speechstart && handlers.speechstart()

			const resultEvent = new Event('result')
			resultEvent.resultIndex = 0
			resultEvent.results = [
				[
					{
						transcript: sentence,
					},
				],
			]
			if (sentence) {
				!!handlers.result && handlers.result(resultEvent)
			} else {
				!!handlers.nomatch && handlers.nomatch()
			}
			!!handlers.speechend && handlers.speechend()
		}),
	}
})
