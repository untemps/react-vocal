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
		const { result } = renderHook(() => useCommands())
		expect(typeof result.current).toBe('function')
	})

	it('returns a stable triggerCommand across renders when commands prop is referentially equal', () => {
		const commands = { foo: () => 'bar' }
		const { result, rerender } = renderHook(({ c }: { c: typeof commands }) => useCommands(c), {
			initialProps: { c: commands },
		})
		const first = result.current
		rerender({ c: commands })
		expect(result.current).toBe(first)
	})

	it('returns a new triggerCommand when the commands prop identity changes', () => {
		const a = { foo: () => 'bar' }
		const b = { foo: () => 'bar' }
		const { result, rerender } = renderHook(({ c }: { c: typeof a }) => useCommands(c), {
			initialProps: { c: a },
		})
		const first = result.current
		rerender({ c: b })
		expect(result.current).not.toBe(first)
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

	it('normalizes command keys to lowercase so mixed-case keys match lowercase input', () => {
		const commands = {
			Foo: () => 'bar',
		}
		const {
			result: { current: triggerCommand },
		} = renderHook(() => useCommands(commands))
		expect(triggerCommand('foo')).toBe('bar')
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

	it('matches an embedded single-word command when words are separated by non-space whitespace', () => {
		const red = vi.fn(() => 'red')
		const commands = { red, blue: () => 'blue' }
		const {
			result: { current: triggerCommand },
		} = renderHook(() => useCommands(commands))
		expect(triggerCommand('red\tblue')).toBe('red')
		expect(triggerCommand('please\nred')).toBe('red')
		expect(red).toHaveBeenCalledWith('red', 'red')
	})

	describe('Mixed command map', () => {
		it('fires a single-word command embedded in a phrase even when a phrase key also exists', async () => {
			const red = vi.fn(() => 'red')
			const commands = {
				red,
				'change the background color': () => 'changed',
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			await act(async () => {})
			expect(triggerCommand('I want some red')).toBe('red')
			expect(red).toHaveBeenCalledWith('red', 'red')
		})

		it('prefers the phrase command over an embedded single-word key for an exact-phrase utterance', async () => {
			const color = vi.fn(() => 'single')
			const phrase = vi.fn(() => 'phrase')
			const commands = {
				color,
				'change the background color': phrase,
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			await act(async () => {})
			expect(triggerCommand('change the background color')).toBe('phrase')
			expect(phrase).toHaveBeenCalled()
			expect(color).not.toHaveBeenCalled()
		})

		it('prefers the exact single-word command over a phrase key that contains the word', async () => {
			const phrase = vi.fn(() => 'phrase')
			const commands = {
				red: () => 'red',
				'change the border to red': phrase,
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			await act(async () => {})
			expect(triggerCommand('red')).toBe('red')
			expect(phrase).not.toHaveBeenCalled()
		})

		it('falls through to the phrase command when a single-word callback returns null', async () => {
			const commands = {
				color: () => null,
				'change the background color': () => 'changed',
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			await act(async () => {})
			expect(triggerCommand('change the background color')).toBe('changed')
		})

		it('keeps scanning words when a single-word callback returns null', async () => {
			const commands = {
				red: () => null,
				blue: () => 'blue',
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			await act(async () => {})
			expect(triggerCommand('red or blue')).toBe('blue')
		})

		it('still fires the phrase command via fuzzy matching in a mixed map', async () => {
			const commands = {
				red: () => 'red',
				'change the background color': () => 'changed',
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			await act(async () => {})
			expect(triggerCommand('change the background color')).toBe('changed')
			expect(triggerCommand('change the background colour')).toBe('changed')
		})

		it('matches a single-word command exactly in a mixed map', async () => {
			const commands = {
				red: () => 'red',
				'change the background color': () => 'changed',
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			await act(async () => {})
			expect(triggerCommand('red')).toBe('red')
		})

		it('returns null in a mixed map when no command matches', async () => {
			const commands = {
				red: () => 'red',
				'change the background color': () => 'changed',
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			await act(async () => {})
			expect(triggerCommand('I want some blue')).toBeNull()
		})
	})

	describe('Fuse-present short-input guard', () => {
		it.each([
			['stop the music', 'the'],
			['stop the music', 'to'],
			['change the background color', 'a'],
			['change the background color', 'c'],
			['change the border to red', 'to'],
			['change the border to red', 'der'],
		])('does not fire phrase %p on the short single-word transcript %p', async (command, input) => {
			const phrase = vi.fn(() => 'fired')
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands({ [command]: phrase }))
			await act(async () => {})
			expect(triggerCommand(input)).toBeNull()
			expect(phrase).not.toHaveBeenCalled()
		})

		it('does not fire either of two near-identical phrases on a short single-word transcript', async () => {
			const toRed = vi.fn(() => 'red')
			const toBlue = vi.fn(() => 'blue')
			const {
				result: { current: triggerCommand },
			} = renderHook(() =>
				useCommands({ 'change the border to red': toRed, 'change the border to blue': toBlue })
			)
			await act(async () => {})
			for (const input of ['the', 'to', 'a']) {
				expect(triggerCommand(input)).toBeNull()
			}
			expect(toRed).not.toHaveBeenCalled()
			expect(toBlue).not.toHaveBeenCalled()
		})

		it('still fires a phrase command on a genuine multi-word transcript', async () => {
			const phrase = vi.fn(() => 'changed')
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands({ 'change the background color': phrase }))
			await act(async () => {})
			expect(triggerCommand('change the background colour')).toBe('changed')
			expect(phrase).toHaveBeenCalled()
		})
	})

	describe('Object-prototype key safety', () => {
		it('does not treat an inherited Object.prototype name as a registered command', () => {
			const commands = { red: () => 'red' }
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			expect(triggerCommand('constructor')).toBeNull()
		})

		it('does not throw when the input matches the inherited "__proto__" key', () => {
			const commands = { red: () => 'red' }
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			expect(() => triggerCommand('__proto__')).not.toThrow()
			expect(triggerCommand('__proto__')).toBeNull()
		})

		it('ignores an embedded prototype name when scanning the words of a phrase', () => {
			const commands = { red: () => 'red' }
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			expect(triggerCommand('the constructor pattern')).toBeNull()
		})

		it('still matches a command explicitly keyed with a prototype name', () => {
			const commands = { constructor: () => 'ctor' }
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			expect(triggerCommand('constructor')).toBe('ctor')
		})
	})

	describe('Fuse-absent fallback (fuse.js not installed)', () => {
		beforeEach(() => {
			vi.resetModules()
		})
		afterEach(() => {
			vi.doUnmock('fuse.js')
			vi.resetModules()
		})

		const renderWithoutFuse = async (commands: Parameters<typeof useCommands>[0]) => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			vi.doMock('fuse.js', () => {
				throw new Error('fuse.js not installed')
			})
			const { useCommands: useCommandsWithoutFuse } = await import('../useCommands')
			const view = renderHook(() => useCommandsWithoutFuse(commands))
			await act(async () => {})
			await vi.waitFor(() => expect(warnSpy).toHaveBeenCalled())
			warnSpy.mockRestore()
			return view
		}

		it('falls back to contains matching for an exact phrase', async () => {
			const {
				result: { current: triggerCommand },
			} = await renderWithoutFuse({ 'change color': () => 'matched' })
			expect(triggerCommand('change color')).toBe('matched')
		})

		it('matches a phrase key embedded in a longer utterance (lInput.includes(k))', async () => {
			const phrase = vi.fn(() => 'changed')
			const {
				result: { current: triggerCommand },
			} = await renderWithoutFuse({ 'change color': phrase })
			expect(triggerCommand('please change color now')).toBe('changed')
			expect(phrase).toHaveBeenCalledWith('please change color now', 'change color')
		})

		it('matches a short utterance contained in a phrase key (k.includes(lInput) — documented tradeoff)', async () => {
			const phrase = vi.fn(() => 'changed')
			const {
				result: { current: triggerCommand },
			} = await renderWithoutFuse({ 'change the border to red': phrase })
			expect(triggerCommand('red')).toBe('changed')
			expect(phrase).toHaveBeenCalledWith('red', 'change the border to red')
		})

		it('does not fire a phrase command on an empty or whitespace-only transcript', async () => {
			const phrase = vi.fn(() => 'changed')
			const {
				result: { current: triggerCommand },
			} = await renderWithoutFuse({ 'change the background color': phrase })
			expect(triggerCommand('')).toBeNull()
			expect(triggerCommand('   ')).toBeNull()
			expect(phrase).not.toHaveBeenCalled()
		})

		it('keeps single-word embedded matching working in a mixed map', async () => {
			const red = vi.fn(() => 'red')
			const {
				result: { current: triggerCommand },
			} = await renderWithoutFuse({ red, 'change the background color': () => 'changed' })
			expect(triggerCommand('I want some red')).toBe('red')
			expect(red).toHaveBeenCalledWith('red', 'red')
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
			const { unmount } = renderHook(() => useCommandsFresh({ 'change color': () => 'matched' }))
			unmount()
			await act(async () => {})
			expect(warnSpy).not.toHaveBeenCalled()
			warnSpy.mockRestore()
		})
	})
})
