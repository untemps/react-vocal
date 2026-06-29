import { vi, type MockedFunction } from 'vitest'
import type { VocalInstance } from '@untemps/vocal'

interface Alternative {
	transcript?: string
	confidence?: number
}

type Segment = Alternative[]

interface ResultEvent extends Event {
	resultIndex?: number
	results?: Segment[]
}

const buildResultEvent = (segments: Segment[]): ResultEvent => {
	const evt: ResultEvent = new Event('result') as ResultEvent
	evt.resultIndex = 0
	evt.results = segments
	return evt
}

const pickBest = (alternatives: Segment): string => {
	let best: Alternative = alternatives[0] ?? {}
	for (const alt of alternatives) {
		if ((alt.confidence ?? 0) > (best.confidence ?? 0)) best = alt
	}
	return best.transcript ?? ''
}

export interface MockVocalOptions {
	continuous?: boolean
	initialPermission?: PermissionState
}

export type MockVocalInput = string | Segment[] | null | undefined

// MockVocalInstance extends VocalInstance with test-only helpers (.say, .error,
// .end, .fire, .handlerCount). Production code consuming a VocalInstance MUST
// NOT call them — they exist only to drive lifecycle events during tests and
// inspect the listener map. Lifecycle methods are typed as MockedFunction so
// test bodies can call `.mockImplementation()` on them when they need to
// override behavior.
export interface MockVocalInstance extends Omit<VocalInstance, 'start' | 'stop' | 'abort' | 'on' | 'off' | 'cleanup'> {
	start: MockedFunction<VocalInstance['start']>
	stop: MockedFunction<VocalInstance['stop']>
	abort: MockedFunction<VocalInstance['abort']>
	on: MockedFunction<(type: string, cb: (...args: unknown[]) => void) => void>
	off: MockedFunction<(type: string, cb?: (...args: unknown[]) => void) => void>
	cleanup: MockedFunction<VocalInstance['cleanup']>
	fire: (type: string, ...args: unknown[]) => void
	say: (input: MockVocalInput) => void
	error: (err: unknown) => void
	end: () => void
	permission: (state: PermissionState) => void
	handlerCount: () => number
}

const buildPermissionEvent = (state: PermissionState): Event & { state: PermissionState } =>
	Object.assign(new Event('permission'), { state })

// Mock VocalInstance for component tests — implements the contract of
// `createVocal()` from @untemps/vocal 2.x and exposes test helpers
// (.say, .error, .end, .fire) to simulate the recognition lifecycle
// without going through the global SpeechRecognition mock.
//
// Known limitations vs. the real vocal 2.x:
// - `start(options)` accepts an options object but ignores `options.signal`.
//   Tests that need to assert signal pass-through should inspect
//   `instance.start.mock.calls` directly.
// - `start` is `async`, so `fire('start', ...)` resolves in a microtask. The
//   real vocal awaits getUserMediaStream first; the optimistic order in
//   useVocal is the same in both cases.
// - The helpers (`say`, `error`, `end`, `fire`) live alongside the public
//   VocalInstance API on the same object. They are test-only escape hatches;
//   production code consuming a `VocalInstance` MUST NOT call them.
export const createMockVocal = (options: MockVocalOptions = {}): MockVocalInstance => {
	const handlers: Record<string, Array<(...args: unknown[]) => void>> = {}
	let isRecording = false
	const accumulated: Segment[] = []
	const continuous = !!options.continuous
	const { initialPermission } = options

	const fire = (type: string, ...args: unknown[]) => {
		const cbs = handlers[type]
		if (!cbs) return
		for (const cb of cbs.slice()) cb(...args)
	}

	const instance: MockVocalInstance = {
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
		on: vi.fn((type: string, cb: (...args: unknown[]) => void) => {
			if (!handlers[type]) handlers[type] = []
			handlers[type].push(cb)
			if (type === 'permission' && initialPermission !== undefined) {
				cb(buildPermissionEvent(initialPermission), initialPermission)
			}
		}),
		off: vi.fn((type: string, cb?: (...args: unknown[]) => void) => {
			if (!handlers[type]) return
			if (cb) {
				const index = handlers[type].indexOf(cb)
				if (index !== -1) handlers[type].splice(index, 1)
				if (handlers[type].length === 0) delete handlers[type]
			} else {
				delete handlers[type]
			}
		}),
		cleanup: vi.fn(() => {
			for (const k of Object.keys(handlers)) delete handlers[k]
		}),
		fire,
		say(input: MockVocalInput) {
			fire('speechstart', new Event('speechstart'))
			const segments: Segment[] | null = Array.isArray(input) ? input : input ? [[{ transcript: input }]] : null
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
		error(err: unknown) {
			fire('error', err)
		},
		end() {
			fire('end', new Event('end'))
		},
		permission(state: PermissionState) {
			fire('permission', buildPermissionEvent(state), state)
		},
		handlerCount() {
			return Object.values(handlers).reduce((sum, arr) => sum + arr.length, 0)
		},
	}
	return instance
}
