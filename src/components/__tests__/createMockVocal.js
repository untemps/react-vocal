import { vi } from 'vitest'

const buildResultEvent = (segments) => {
	const evt = new Event('result')
	evt.resultIndex = 0
	evt.results = segments
	return evt
}

const pickBest = (alternatives) => {
	let best = alternatives[0]
	for (const alt of alternatives) {
		if ((alt.confidence ?? 0) > (best.confidence ?? 0)) best = alt
	}
	return best.transcript ?? ''
}

// Mock VocalInstance for component tests — implements the contract of
// `createVocal()` from @untemps/vocal 2.x and exposes test helpers
// (.say, .error, .end, .fire) to simulate the recognition lifecycle
// without going through the global SpeechRecognition mock.
export const createMockVocal = (options = {}) => {
	const handlers = {}
	let isRecording = false
	const accumulated = []
	const continuous = !!options.continuous

	const fire = (type, ...args) => {
		const cbs = handlers[type]
		if (!cbs) return
		for (const cb of cbs.slice()) cb(...args)
	}

	const instance = {
		get isRecording() {
			return isRecording
		},
		start: vi.fn(async () => {
			accumulated.length = 0
			isRecording = true
			fire('start', new Event('start'))
		}),
		stop: vi.fn(() => {
			if (continuous && accumulated.length > 0) {
				const segments = accumulated.slice()
				accumulated.length = 0
				const joined = segments
					.map((seg) => pickBest(seg))
					.join(' ')
					.trim()
				const evt = buildResultEvent(segments)
				fire('result', evt, joined, [joined])
			}
			fire('end', new Event('end'))
			isRecording = false
		}),
		abort: vi.fn(() => {
			accumulated.length = 0
			fire('end', new Event('end'))
			isRecording = false
		}),
		on: vi.fn((type, cb) => {
			if (!handlers[type]) handlers[type] = []
			handlers[type].push(cb)
		}),
		off: vi.fn((type, cb) => {
			if (!handlers[type]) return
			if (cb) {
				handlers[type] = handlers[type].filter((h) => h !== cb)
				if (handlers[type].length === 0) delete handlers[type]
			} else {
				delete handlers[type]
			}
		}),
		cleanup: vi.fn(() => {
			for (const k of Object.keys(handlers)) delete handlers[k]
		}),
		fire,
		say(input) {
			fire('speechstart', new Event('speechstart'))
			const segments = Array.isArray(input) ? input : input ? [[{ transcript: input }]] : null
			fire('speechend', new Event('speechend'))
			if (!segments) {
				fire('nomatch', new Event('nomatch'))
				return
			}
			if (continuous) {
				// vocal 2.x intercepts intermediate results in continuous mode and accumulates
				// them internally — they are emitted as a single synthetic event on stop().
				accumulated.push(...segments)
				return
			}
			const firstSegment = segments[0]
			const evt = buildResultEvent(segments)
			const bestAlt = pickBest(firstSegment)
			const alts = firstSegment.map((a) => a.transcript ?? '')
			fire('result', evt, bestAlt, alts)
		},
		error(err) {
			fire('error', err)
		},
		end() {
			fire('end', new Event('end'))
		},
	}
	return instance
}
