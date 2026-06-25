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
		// Recognition may join segments with tabs/newlines, not only spaces; each word is still scanned.
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

	describe('Object-prototype key safety', () => {
		it('does not treat an inherited Object.prototype name as a registered command', () => {
			const commands = { red: () => 'red' }
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			// `'constructor' in normalized` is true via the prototype chain; Object.hasOwn
			// keeps it from invoking the inherited Object constructor as if it were a command.
			expect(triggerCommand('constructor')).toBeNull()
		})

		it('does not throw when the input matches the inherited "__proto__" key', () => {
			const commands = { red: () => 'red' }
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
			// `normalized['__proto__']` is Object.prototype (not callable) — `in` would
			// have reached it and thrown "is not a function".
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
			// An own property named 'constructor' is a legitimate command and must still fire.
			expect(triggerCommand('constructor')).toBe('ctor')
		})
	})

	describe('Fuse-absent fallback (fuse.js not installed)', () => {
		// Fresh module graph per test so `vi.doMock('fuse.js')` actually intercepts the
		// hook's lazy `import('fuse.js')`; `doUnmock` + reset afterwards so the throwing
		// module can never leak into a later fuzzy-matching test. (`restoreMocks` resets
		// spy state but neither clears the module cache nor removes `doMock` registrations.)
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
			// Flush the rejected dynamic import so fuseRef settles to null.
			await act(async () => {})
			// Sentinel: the hook warns *only* when import('fuse.js') rejects. Asserting it
			// fired proves fuse.js is genuinely absent here — not merely "real fuse not loaded
			// yet", which would also leave fuseRef null and silently pass the fallback paths.
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
			// Real fuse scores 'please change color now' vs 'change color' at ~0.59 > the
			// 0.4 threshold, so a match here can come *only* from the substring fallback —
			// combined with the warn sentinel above, this exercises the fuse-absent path.
			expect(triggerCommand('please change color now')).toBe('changed')
			expect(phrase).toHaveBeenCalledWith('please change color now', 'change color')
		})

		it('matches a short utterance contained in a phrase key (k.includes(lInput) — documented tradeoff)', async () => {
			// The source flags this as an accepted false positive of the fuse-absent
			// fallback: a single word that is a substring of a phrase key still fires it.
			// Pinned so a regression dropping the `|| k.includes(lInput)` clause is caught.
			const phrase = vi.fn(() => 'changed')
			const {
				result: { current: triggerCommand },
			} = await renderWithoutFuse({ 'change the border to red': phrase })
			expect(triggerCommand('red')).toBe('changed')
			expect(phrase).toHaveBeenCalledWith('red', 'change the border to red')
		})

		it('does not fire a phrase command on an empty or whitespace-only transcript', async () => {
			// Regression for the `trimmed` guard: `k.includes('')` is always true, so an
			// empty transcript would otherwise spuriously fire the first phrase command.
			const phrase = vi.fn(() => 'changed')
			const {
				result: { current: triggerCommand },
			} = await renderWithoutFuse({ 'change the background color': phrase })
			expect(triggerCommand('')).toBeNull()
			expect(triggerCommand('   ')).toBeNull()
			expect(phrase).not.toHaveBeenCalled()
		})

		it('keeps single-word embedded matching working in a mixed map', async () => {
			// A phrase key + missing fuse.js must not break single-word matching:
			// 'I want some red' resolves via the per-word scan (step 3), not fuse.
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
