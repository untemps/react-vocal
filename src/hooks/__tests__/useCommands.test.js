import { renderHook } from '@testing-library/react-hooks'

import useCommands from '../useCommands'

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
			foo: (input) => input,
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
		])('triggers callback mapped to approximate inputs', (command, input, expected) => {
			const commands = {
				[command]: () => value,
			}
			const {
				result: { current: triggerCommand },
			} = renderHook(() => useCommands(commands))
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
})
