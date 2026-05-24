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

// Minimal SpeechRecognition mock used by tests that create a real `createVocal()`
// instance (i.e. tests that don't inject a __rsInstance mock). Just enough to make
// vocal 2.x's isSupported()/start() chain succeed and forward start/end events.
// Tests that need to simulate speech results inject a createMockVocal() instance
// instead — see src/components/__tests__/createMockVocal.js.
global.SpeechRecognition = vi.fn(function () {
	const handlers = {}
	const fire = (type, event) => {
		const list = handlers[type]
		if (!list) return
		for (const cb of list.slice()) cb(event)
	}
	return {
		addEventListener: vi.fn(function (type, callback) {
			if (!handlers[type]) handlers[type] = []
			handlers[type].push(callback)
		}),
		removeEventListener: vi.fn(function (type, callback) {
			if (!handlers[type]) return
			if (callback) {
				handlers[type] = handlers[type].filter((cb) => cb !== callback)
				if (handlers[type].length === 0) delete handlers[type]
			} else {
				delete handlers[type]
			}
		}),
		dispatchEvent: vi.fn(),
		start: vi.fn(function () {
			fire('start', new Event('start'))
		}),
		stop: vi.fn(function () {
			fire('end', new Event('end'))
		}),
		abort: vi.fn(function () {
			fire('end', new Event('end'))
		}),
	}
})
