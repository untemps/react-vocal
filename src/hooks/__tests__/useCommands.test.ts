import { act, renderHook } from '@testing-library/react'

import { useCommands } from '../useCommands'

// Static import anchors fuse.js in the module graph so vi.mock intercepts the
// dynamic import('fuse.js') inside the hook. Without it the dynamic import resolves
// against the real module before the async mock factory completes.
import 'fuse.js'

vi.mock('fuse.js', async () => {
	const actual = await vi.importActual('fuse.js')
	return actual
})

describe('useCommands', () => {
	it('returns triggerCommand function', () => {
		const triggerCommand = renderHook(() => useCommands())
		expect(triggerCommand).toBeDefined()
	})

	it('triggers callback mapped to the exact input', () => {
		const commands = {
			foo: () => 'bar',
		}
		const {
			result: { current: triggerCommand },
		} = renderHook(() => useCommands(commands))
		expect(triggerCommand('foo')).toBe('bar')
	})

	it('passes input as callback argument', () => {
		const commands = {
			foo: (input: string) => input,
		}
		const {
			result: { current: triggerCommand },
		} = renderHook(() => useCommands(commands))
		expect(triggerCommand('foo')).toBe('foo')
	})

	describe('Approximate inputs', () => {
		const value = 'foo'
		it.each([
			['Change la bordure en vert', 'Change la bordure en verre', value],
			['Change la bordure en vert', 'Change la bordure en verres', value],
			['Change la bordure en vert', 'Change la bordure en vers', value],
			['Change la bordure en vert', 'Change la bordure en vairs', value],
			['Change la bordure en vert', 'Changez la bordure en verre', value],
			['Change la bordure en vert', 'Changez la bodure en verre', null],
			['Change la bordure en vert', 'Change la bordure en rouge', null],
			['Change la bordure en vert', 'Change la bordure en verre de rouge', null],
			['Change la bordure en vert', 'Change la bordure en violet', null],
			['Change la bordure en vert', 'Modifie la bordure en violet', null],
		])('triggers callback mapped to approximate inputs', async (command, input, expected) => {
			const commands = {
				[command]: () => value,
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			// Flush the dynamic import microtask
			await act(async () => {})
			expect(triggerCommand(input)).toBe(expected)
		})
	})

	it('returns null as no command is mapped to the input', () => {
		const commands = {
			foo: () => 'bar',
		}
		const {
			result: { current: triggerCommand },
		} = renderHook(() => useCommands(commands))
		expect(triggerCommand('gag')).toBeNull()
	})

	it('triggers all registered commands when multiple commands are defined', () => {
		const commands = {
			rouge: () => 'red',
			bleu: () => 'blue',
			jaune: () => 'yellow',
		}
		const {
			result: { current: triggerCommand },
		} = renderHook(() => useCommands(commands))
		expect(triggerCommand('rouge')).toBe('red')
		expect(triggerCommand('bleu')).toBe('blue')
		expect(triggerCommand('jaune')).toBe('yellow')
	})

	it('does not match near-homophones with strict precision — rely on maxAlternatives instead', () => {
		const commands = { vert: () => 'green' }
		const {
			result: { current: triggerCommand },
		} = renderHook(() => useCommands(commands))
		// 'verre' scores 0.4 against 'vert' — not strictly < STRICT_PRECISION (0.4)
		expect(triggerCommand('verre')).toBeNull()
		// The engine surfaces 'vert' as a secondary alternative (score 0) — exact match
		expect(triggerCommand('vert')).toBe('green')
	})

	it('falls back to contains matching when fuse.js is not available', async () => {
		vi.doMock('fuse.js', () => {
			throw new Error('fuse.js not installed')
		})
		const { useCommands: useCommandsWithoutFuse } = await import('../useCommands')
		const commands = { 'change color': () => 'matched' }
		const {
			result: { current: triggerCommand },
		} = renderHook(() => useCommandsWithoutFuse(commands))
		await act(async () => {})
		expect(triggerCommand('change color')).toBe('matched')
		vi.doUnmock('fuse.js')
	})

	it('discards the dynamic fuse.js import result when the effect is cleaned up before it resolves', async () => {
		// Without the cancellation guard, the .catch() branch would fire console.warn
		// even after the component unmounted (stale effect). With the guard, the
		// cleanup runs before the import settles and the .catch() is skipped.
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		vi.doMock('fuse.js', () => {
			throw new Error('fuse.js not installed')
		})
		const { useCommands: useCommandsFresh } = await import('../useCommands')
		const commands = { 'change color': () => 'matched' }
		const { unmount } = renderHook(() => useCommandsFresh(commands))
		unmount()
		await act(async () => {})
		expect(warnSpy).not.toHaveBeenCalled()
		warnSpy.mockRestore()
		vi.doUnmock('fuse.js')
	})
})
