import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

type Handler = (event?: Event) => void

const PermissionStatusMock = vi.fn(function () {
	return {
		state: 'granted',
		addEventListener: vi.fn(),
	}
})
const PermissionsMock = vi.fn(function () {
	return {
		query: vi.fn().mockResolvedValue(new (PermissionStatusMock as unknown as new () => unknown)()),
	}
})
const MediaDevicesMock = vi.fn(function () {
	return {
		getUserMedia: vi.fn().mockResolvedValue({
			getTracks: () => [],
			getAudioTracks: () => [],
		}),
	}
})

Object.defineProperty(globalThis.navigator, 'permissions', {
	value: new (PermissionsMock as unknown as new () => unknown)(),
	writable: true,
	configurable: true,
})
Object.defineProperty(globalThis.navigator, 'mediaDevices', {
	value: new (MediaDevicesMock as unknown as new () => unknown)(),
	writable: true,
	configurable: true,
})

;(globalThis as unknown as { SpeechGrammarList: unknown }).SpeechGrammarList = vi.fn(function () {
	return { length: 0 }
})

// Minimal SpeechRecognition mock used by tests that create a real `createVocal()`
// instance (i.e. tests that don't inject a __rsInstance mock). Just enough to make
// vocal 2.x's isSupported()/start() chain succeed and forward start/end events.
// Tests that need to simulate speech results inject a createMockVocal() instance
// instead — see src/components/__tests__/createMockVocal.ts.
;(globalThis as unknown as { SpeechRecognition: unknown }).SpeechRecognition = vi.fn(function () {
	const handlers: Record<string, Handler[]> = {}
	const fire = (type: string, event?: Event) => {
		const list = handlers[type]
		if (!list) return
		for (const cb of list.slice()) cb(event)
	}
	return {
		addEventListener: vi.fn(function (type: string, callback: Handler) {
			if (!handlers[type]) handlers[type] = []
			handlers[type].push(callback)
		}),
		removeEventListener: vi.fn(function (type: string, callback?: Handler) {
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
