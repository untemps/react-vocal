import { type MouseEvent as ReactMouseEvent } from 'react'
import { waitFor } from '@testing-library/dom'
import { act, fireEvent, render } from '@testing-library/react'
import { createVocal, isSupported, type VocalInstance } from '@untemps/vocal'

import { Vocal, type VocalProps } from '../Vocal'
import { createMockVocal } from './createMockVocal'

vi.mock('@untemps/vocal', async (importOriginal) => {
	const actual = (await importOriginal()) as typeof import('@untemps/vocal')
	return {
		...actual,
		isSupported: vi.fn(actual.isSupported),
		createVocal: vi.fn(actual.createVocal),
	}
})

const defaultProps: Partial<VocalProps> = {}
// getInstance routes the test-only `__rsInstance` shorthand to
// `vi.mocked(createVocal).mockReturnValue(...)` so test bodies stay concise.
// `__rsInstance` is internal to this harness — not a prop of <Vocal>.
const getInstance = (
	props: (Partial<VocalProps> & { __rsInstance?: VocalInstance }) | null = {},
	children: VocalProps['children'] = null
) => {
	const { __rsInstance, ...componentProps } = { ...defaultProps, ...(props ?? {}) }
	if (__rsInstance) {
		vi.mocked(createVocal).mockReturnValue(__rsInstance)
	}
	return <Vocal {...componentProps}>{children}</Vocal>
}

// vitest's `restoreMocks: true` resets `vi.fn(actual.createVocal)` to an empty
// stub between tests, dropping the delegation to the real `createVocal`. Re-stub
// the implementation before every test so the default path (no `__rsInstance`
// injected) still uses the real vocal factory.
beforeEach(async () => {
	const actual = await vi.importActual<typeof import('@untemps/vocal')>('@untemps/vocal')
	vi.mocked(createVocal).mockImplementation(actual.createVocal)
})

describe('Vocal', () => {
	it('matches snapshot', () => {
		const { asFragment } = render(getInstance())
		expect(asFragment()).toMatchSnapshot()
	})

	it('renders default children', () => {
		const { queryByTestId } = render(getInstance())
		expect(queryByTestId('__vocal-root__')).toBeInTheDocument()
	})

	it('renders custom children element', () => {
		const { queryByTestId } = render(getInstance(null, <div data-testid="__vocal-custom-root__" />))
		expect(queryByTestId('__vocal-root__')).not.toBeInTheDocument()
		expect(queryByTestId('__vocal-custom-root__')).toBeInTheDocument()
	})

	it('toggles recognition with custom children element (start then stop)', async () => {
		const onStart = vi.fn()
		const onEnd = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(
			getInstance({ __rsInstance: recognition, onStart, onEnd }, <button data-testid="__vocal-custom-root__" />)
		)

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-custom-root__'))
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-custom-root__'))
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})
	})

	it('preserves consumer onClick when toggling recognition with a child element', async () => {
		const onStart = vi.fn()
		const onEnd = vi.fn()
		const consumerOnClick = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(
			getInstance(
				{ __rsInstance: recognition, onStart, onEnd },
				<button data-testid="__vocal-custom-root__" onClick={consumerOnClick} />
			)
		)

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-custom-root__'))
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})
		expect(consumerOnClick).toHaveBeenCalledTimes(1)
		expect(consumerOnClick).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'click' }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-custom-root__'))
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})
		expect(consumerOnClick).toHaveBeenCalledTimes(2)
	})

	it('cancels the recognition toggle when the consumer onClick calls preventDefault', async () => {
		const onStart = vi.fn()
		const onEnd = vi.fn()
		const consumerOnClick = vi.fn((e: ReactMouseEvent) => e.preventDefault())
		const recognition = createMockVocal()
		const { getByTestId } = render(
			getInstance(
				{ __rsInstance: recognition, onStart, onEnd },
				<button data-testid="__vocal-custom-root__" onClick={consumerOnClick} />
			)
		)

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-custom-root__'))
		})

		expect(consumerOnClick).toHaveBeenCalledTimes(1)
		expect(onStart).not.toHaveBeenCalled()
		expect(onEnd).not.toHaveBeenCalled()
	})

	it('propagates aria-pressed=false on the cloned child while idle', () => {
		const { getByTestId } = render(getInstance(null, <button data-testid="__vocal-custom-root__" />))
		expect(getByTestId('__vocal-custom-root__')).toHaveAttribute('aria-pressed', 'false')
	})

	it('flips aria-pressed on the cloned child between idle, listening and end of session', async () => {
		const onStart = vi.fn()
		const onEnd = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(
			getInstance({ __rsInstance: recognition, onStart, onEnd }, <button data-testid="__vocal-custom-root__" />)
		)

		expect(getByTestId('__vocal-custom-root__')).toHaveAttribute('aria-pressed', 'false')

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-custom-root__'))
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})
		expect(getByTestId('__vocal-custom-root__')).toHaveAttribute('aria-pressed', 'true')

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})
		expect(getByTestId('__vocal-custom-root__')).toHaveAttribute('aria-pressed', 'false')
	})

	it('falls back to the ariaLabel prop on the cloned child when the child has no aria-label', () => {
		const { getByTestId } = render(
			getInstance({ ariaLabel: 'start mic' }, <button data-testid="__vocal-custom-root__" />)
		)
		expect(getByTestId('__vocal-custom-root__')).toHaveAttribute('aria-label', 'start mic')
	})

	it("preserves the child's own aria-label over the ariaLabel prop on the cloned child", () => {
		const { getByTestId } = render(
			getInstance(
				{ ariaLabel: 'start mic' },
				<button data-testid="__vocal-custom-root__" aria-label="custom label" />
			)
		)
		expect(getByTestId('__vocal-custom-root__')).toHaveAttribute('aria-label', 'custom label')
	})

	it('renders no children element if SpeechRecognition is not supported', () => {
		vi.mocked(isSupported).mockReturnValueOnce(false)
		const { queryByTestId } = render(getInstance(null, <div data-testid="__vocal-custom-root__" />))
		expect(queryByTestId('__vocal-root__')).not.toBeInTheDocument()
		expect(queryByTestId('__vocal-custom-root__')).not.toBeInTheDocument()
		vi.clearAllMocks()
	})

	it('renders custom children function', () => {
		const { queryByTestId } = render(getInstance(null, () => <div data-testid="__vocal-custom-root__" />))
		expect(queryByTestId('__vocal-root__')).not.toBeInTheDocument()
		expect(queryByTestId('__vocal-custom-root__')).toBeInTheDocument()
	})

	it('starts recognition with custom children function', async () => {
		const onStart = vi.fn()
		const { queryByTestId } = render(
			getInstance({ onStart }, (start) => <div data-testid="__vocal-custom-root__" onClick={start} />)
		)
		await act(async () => {
			fireEvent.click(queryByTestId('__vocal-custom-root__')!)
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})
	})

	it('stops recognition with custom children function', async () => {
		const onEnd = vi.fn()
		const { queryByText } = render(
			getInstance({ onEnd }, (start, stop) => (
				<div data-testid="__vocal-custom-root__">
					<button onClick={start}>start</button>
					<button onClick={stop}>stop</button>
				</div>
			))
		)
		await act(async () => {
			fireEvent.click(queryByText('start')!)
			fireEvent.click(queryByText('stop')!)
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})
	})

	it('gets recognition status with custom children function', async () => {
		const onEnd = vi.fn()
		const { queryByText } = render(
			getInstance({ onEnd }, (start, stop, isStarted) => (
				<div data-testid="__vocal-custom-root__">
					<div>{isStarted ? 'Started' : 'Stopped'}</div>
					<button onClick={start}>start</button>
					<button onClick={stop}>stop</button>
				</div>
			))
		)
		await act(async () => {
			fireEvent.click(queryByText('start')!)
			await waitFor(() => {
				expect(queryByText('Started')).toBeInTheDocument()
			})
			fireEvent.click(queryByText('stop')!)
			await waitFor(() => {
				expect(queryByText('Stopped')).toBeInTheDocument()
			})
		})
	})

	it.each<[label: string, continuous: boolean, clickToListen: boolean]>([
		['idle', false, false],
		['listening in non-continuous mode', false, true],
		['listening in continuous mode', true, true],
	])('renders pointer cursor when %s', (_label, continuous, clickToListen) => {
		const { getByTestId } = render(getInstance({ continuous }))
		if (clickToListen) fireEvent.click(getByTestId('__vocal-root__'))
		expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'pointer' })
	})

	it('sets aria-pressed when listening', () => {
		const { getByTestId } = render(getInstance())
		fireEvent.click(getByTestId('__vocal-root__'))
		expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true')
	})

	it('renders outline when focused', () => {
		const { getByTestId } = render(getInstance())
		fireEvent.focus(getByTestId('__vocal-root__'))
		expect(getByTestId('__vocal-root__')).toHaveStyle({ outline: '2px solid' })
	})

	it('remove outline when blurred', () => {
		const { getByTestId } = render(getInstance())
		fireEvent.blur(getByTestId('__vocal-root__'))
		expect(getByTestId('__vocal-root__')).toHaveStyle({ outline: 'none' })
	})

	it('not uses style when className is set', () => {
		const { getByTestId } = render(getInstance({ className: 'foo' }))
		expect(getByTestId('__vocal-root__')).not.toHaveStyle({ cursor: 'pointer' })
	})

	it('uses custom styles', () => {
		const { getByTestId } = render(getInstance({ style: { backgroundColor: 'blue' } }))
		// jest-dom v6 + jsdom 29: `div.style.color = 'blue'` reads back as 'blue' but getComputedStyle returns RGB; normalisation no longer bridges the gap
		expect(getByTestId('__vocal-root__')).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' })
	})

	it('responds to command', async () => {
		const callback = vi.fn()
		const recognition = createMockVocal()
		const commands = { foo: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(callback).toHaveBeenCalledWith('Foo', 'foo'))
		})
	})

	it('triggers onStart handler', async () => {
		const onStart = vi.fn()
		const { getByTestId } = render(getInstance({ onStart }))
		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})
	})

	it('triggers onResult handler', async () => {
		const onResult = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onResult }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('Foo', expect.anything()))
		})
	})

	it('triggers onNoMatch handler', async () => {
		const onNoMatch = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onNoMatch }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
		})

		await act(async () => {
			recognition.say(null)
			await waitFor(() => expect(onNoMatch).toHaveBeenCalled())
		})
	})

	it('triggers onSpeechStart handler', async () => {
		const onSpeechStart = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onSpeechStart }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onSpeechStart).toHaveBeenCalled())
		})
	})

	it('triggers onSpeechEnd handler', async () => {
		const onSpeechEnd = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onSpeechEnd }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onSpeechEnd).toHaveBeenCalled())
		})
	})

	it('triggers onEnd handler after timeout', async () => {
		const timeout = 100
		const onEnd = vi.fn()
		const { getByTestId } = render(getInstance({ timeout, onEnd }))
		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(onEnd).toHaveBeenCalled(), { timeout: timeout * 2 })
		})
	})

	it('triggers onEnd handler after speech', async () => {
		const onEnd = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onEnd }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})
	})

	it('calls the updated onEnd prop after a re-render during an active session', async () => {
		const onEndV1 = vi.fn()
		const onEndV2 = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onEnd: onEndV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onEnd: onEndV2 }))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onEndV2).toHaveBeenCalled())
		})

		expect(onEndV1).not.toHaveBeenCalled()
	})

	it('resets to idle after a re-render during an active session', async () => {
		const onEnd = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onEnd }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onEnd }))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})

		expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'false')
	})

	it('calls the updated onResult prop after a re-render during an active session', async () => {
		const onResultV1 = vi.fn()
		const onResultV2 = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onResult: onResultV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onResult: onResultV2 }))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onResultV2).toHaveBeenCalledWith('Foo', expect.anything()))
		})

		expect(onResultV1).not.toHaveBeenCalled()
	})

	it('calls the updated onSpeechStart prop after a re-render during an active session', async () => {
		const onSpeechStartV1 = vi.fn()
		const onSpeechStartV2 = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(
			getInstance({ __rsInstance: recognition, onSpeechStart: onSpeechStartV1 })
		)

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onSpeechStart: onSpeechStartV2 }))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onSpeechStartV2).toHaveBeenCalled())
		})

		expect(onSpeechStartV1).not.toHaveBeenCalled()
	})

	it('calls the updated onSpeechEnd prop after a re-render during an active session', async () => {
		const onSpeechEndV1 = vi.fn()
		const onSpeechEndV2 = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onSpeechEnd: onSpeechEndV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onSpeechEnd: onSpeechEndV2 }))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onSpeechEndV2).toHaveBeenCalled())
		})

		expect(onSpeechEndV1).not.toHaveBeenCalled()
	})

	it('calls the updated onNoMatch prop after a re-render during an active session', async () => {
		const onNoMatchV1 = vi.fn()
		const onNoMatchV2 = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onNoMatch: onNoMatchV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onNoMatch: onNoMatchV2 }))
		})

		await act(async () => {
			recognition.say(null)
			await waitFor(() => expect(onNoMatchV2).toHaveBeenCalled())
		})

		expect(onNoMatchV1).not.toHaveBeenCalled()
	})

	it('calls the updated onError prop after a re-render during an active session', async () => {
		const onErrorV1 = vi.fn()
		const onErrorV2 = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onError: onErrorV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onError: onErrorV2 }))
		})

		await act(async () => {
			recognition.error(new Error('mic failure'))
			await waitFor(() => expect(onErrorV2).toHaveBeenCalled())
		})

		expect(onErrorV1).not.toHaveBeenCalled()
	})

	describe('error classification', () => {
		it.each([
			['no-speech', 'no-speech', 'No speech detected'],
			['network', 'network', 'Network error'],
			['audio-capture', 'audio-capture', 'No microphone'],
			['service-not-allowed', 'service-not-allowed', 'Service blocked'],
			['not-allowed', 'permission-denied', 'Permission denied'],
			['aborted', 'aborted', 'Aborted by user'],
		])('classifies SpeechRecognition error "%s" as type "%s"', async (srErrorCode, expectedType, message) => {
			const onError = vi.fn()
			const recognition = createMockVocal()
			const { getByTestId } = render(getInstance({ __rsInstance: recognition, onError }))

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			const srEvent = { error: srErrorCode, message }
			await act(async () => {
				recognition.error(srEvent)
				await waitFor(() => expect(onError).toHaveBeenCalled())
			})

			expect(onError).toHaveBeenCalledWith({
				type: expectedType,
				message,
				original: srEvent,
			})
		})

		it.each([
			['NotAllowedError', 'permission-denied'],
			['NotFoundError', 'audio-capture'],
			['NotReadableError', 'audio-capture'],
			['AbortError', 'aborted'],
		])('classifies DOMException %s as type "%s"', async (name, expectedType) => {
			const onError = vi.fn()
			const recognition = createMockVocal()
			const { getByTestId } = render(getInstance({ __rsInstance: recognition, onError }))

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			const domException = new DOMException('Some message', name)
			await act(async () => {
				recognition.error(domException)
				await waitFor(() => expect(onError).toHaveBeenCalled())
			})

			expect(onError).toHaveBeenCalledWith({
				type: expectedType,
				message: 'Some message',
				original: domException,
			})
		})

		it('classifies an unknown Error as "unknown"', async () => {
			const onError = vi.fn()
			const recognition = createMockVocal()
			const { getByTestId } = render(getInstance({ __rsInstance: recognition, onError }))

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			const err = new Error('Boom')
			await act(async () => {
				recognition.error(err)
				await waitFor(() => expect(onError).toHaveBeenCalled())
			})

			expect(onError).toHaveBeenCalledWith({
				type: 'unknown',
				message: 'Boom',
				original: err,
			})
		})

		it('classifies a non-Error value as "unknown" with a fallback message', async () => {
			const onError = vi.fn()
			const recognition = createMockVocal()
			const { getByTestId } = render(getInstance({ __rsInstance: recognition, onError }))

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.error('weird string')
				await waitFor(() => expect(onError).toHaveBeenCalled())
			})

			expect(onError).toHaveBeenCalledWith({
				type: 'unknown',
				message: 'weird string',
				original: 'weird string',
			})
		})
	})

	it('triggers command matched on first segment in multi-segment result', async () => {
		const callback = vi.fn()
		const recognition = createMockVocal()
		const commands = { hello: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.say([[{ transcript: 'hello', confidence: 0.9 }], [{ transcript: 'world', confidence: 0.8 }]])
			await waitFor(() => expect(callback).toHaveBeenCalledWith('hello', 'hello'))
		})
	})

	it('triggers command matched on second segment in multi-segment result', async () => {
		const callback = vi.fn()
		const recognition = createMockVocal()
		const commands = { world: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.say([[{ transcript: 'hello', confidence: 0.9 }], [{ transcript: 'world', confidence: 0.8 }]])
			await waitFor(() => expect(callback).toHaveBeenCalledWith('world', 'world'))
		})
	})

	it('does not trigger command when no segment matches', async () => {
		const callback = vi.fn()
		const recognition = createMockVocal()
		const commands = { foo: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.say([[{ transcript: 'hello', confidence: 0.9 }], [{ transcript: 'world', confidence: 0.8 }]])
			await new Promise((r) => setTimeout(r, 100))
		})

		expect(callback).not.toHaveBeenCalled()
	})

	it('fires only the first matching command when multiple segments each match a different command', async () => {
		const callbackHello = vi.fn()
		const callbackWorld = vi.fn()
		const recognition = createMockVocal()
		const commands = { hello: callbackHello, world: callbackWorld }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.say([[{ transcript: 'hello', confidence: 0.9 }], [{ transcript: 'world', confidence: 0.8 }]])
			await waitFor(() => expect(callbackHello).toHaveBeenCalledWith('hello', 'hello'))
		})

		expect(callbackWorld).not.toHaveBeenCalled()
	})

	it('returns the most confident alternative as the onResult transcript', async () => {
		const onResult = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onResult }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.say([
				[
					{ transcript: 'bar', confidence: 0.4 },
					{ transcript: 'foo', confidence: 0.9 },
					{ transcript: 'baz', confidence: 0.1 },
				],
			])
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('foo', expect.anything()))
		})
	})

	it('triggers command matched on a word within a multi-word segment', async () => {
		const callback = vi.fn()
		const recognition = createMockVocal()
		const commands = { rouge: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.say([[{ transcript: 'je veux du rouge', confidence: 0.9 }]])
			await waitFor(() => expect(callback).toHaveBeenCalledWith('rouge', 'rouge'))
		})
	})

	it('triggers command matched on a secondary alternative (homophone)', async () => {
		const callback = vi.fn()
		const recognition = createMockVocal()
		const commands = { vert: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands, maxAlternatives: 3 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			// Primary alternative is the homophone; secondary is the correct word
			recognition.say([
				[
					{ transcript: 'verre', confidence: 0.9 },
					{ transcript: 'vert', confidence: 0.7 },
				],
			])
			await waitFor(() => expect(callback).toHaveBeenCalledWith('vert', 'vert'))
		})
	})

	it('passes the most confident transcript to onResult even when command matches a secondary alternative', async () => {
		const onResult = vi.fn()
		const recognition = createMockVocal()
		const commands = { vert: vi.fn() }
		const { getByTestId } = render(
			getInstance({ __rsInstance: recognition, commands, onResult, maxAlternatives: 3 })
		)

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.say([
				[
					{ transcript: 'verre', confidence: 0.9 },
					{ transcript: 'vert', confidence: 0.7 },
				],
			])
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('verre', expect.anything()))
		})
	})

	it('does not dispatch the start event when the signal prop is already aborted', async () => {
		const onStart = vi.fn()
		const controller = new AbortController()
		controller.abort()
		const { getByTestId } = render(getInstance({ onStart, signal: controller.signal }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await new Promise((r) => setTimeout(r, 50))
		})

		expect(onStart).not.toHaveBeenCalled()
	})

	it('reverts aria-pressed to false when the signal prop is already aborted', async () => {
		const onError = vi.fn()
		const controller = new AbortController()
		controller.abort()
		const { getByTestId } = render(getInstance({ signal: controller.signal, onError }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await new Promise((r) => setTimeout(r, 50))
		})

		expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'false')
		// Silent abort is not an error from the consumer's perspective —
		// no error event should surface.
		expect(onError).not.toHaveBeenCalled()
	})

	it('does not leak listeners when timeout changes during an active session', async () => {
		const onEnd = vi.fn()
		const onResult = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(
			getInstance({ __rsInstance: recognition, onEnd, onResult, timeout: 1000 })
		)

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onEnd, onResult, timeout: 2000 }))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			recognition.say('Bar')
			await waitFor(() => expect(onEnd).toHaveBeenCalledTimes(2))
		})

		expect(onEnd).toHaveBeenCalledTimes(2)
		expect(onResult).toHaveBeenCalledTimes(2)
		expect(onResult).toHaveBeenNthCalledWith(1, 'Foo', expect.anything())
		expect(onResult).toHaveBeenNthCalledWith(2, 'Bar', expect.anything())
	})

	it('does not leak listeners when silenceTimeout changes during an active continuous session', async () => {
		const onEnd = vi.fn()
		const onResult = vi.fn()
		const recognition = createMockVocal({ continuous: true })
		const { getByTestId, rerender } = render(
			getInstance({
				__rsInstance: recognition,
				onEnd,
				onResult,
				continuous: true,
				timeout: 10_000,
				silenceTimeout: 5000,
			})
		)

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(
				getInstance({
					__rsInstance: recognition,
					onEnd,
					onResult,
					continuous: true,
					timeout: 10_000,
					silenceTimeout: 7000,
				})
			)
		})

		await act(async () => {
			recognition.say('Hello')
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			recognition.say('World')
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(onEnd).toHaveBeenCalledTimes(2))
		})

		expect(onEnd).toHaveBeenCalledTimes(2)
		expect(onResult).toHaveBeenCalledTimes(2)
		expect(onResult).toHaveBeenNthCalledWith(1, 'Hello', expect.anything())
		expect(onResult).toHaveBeenNthCalledWith(2, 'World', expect.anything())
	})

	it('releases all listeners after a single session when timeout changes mid-session', async () => {
		const onEnd = vi.fn()
		const onResult = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId, rerender } = render(
			getInstance({ __rsInstance: recognition, onEnd, onResult, timeout: 1000 })
		)
		// useVocal subscribes a few internal listeners on mount — snapshot the baseline
		// AFTER render so we only measure what the click adds and the end-of-session removes.
		const baseline = recognition.handlerCount()

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onEnd, onResult, timeout: 2000 }))
		})

		await act(async () => {
			recognition.say('Foo')
			await waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
		})

		expect(onEnd).toHaveBeenCalledTimes(1)
		expect(onResult).toHaveBeenCalledTimes(1)
		expect(recognition.handlerCount()).toBe(baseline)
	})

	it('releases all listeners after a single session when silenceTimeout changes mid-session', async () => {
		const onEnd = vi.fn()
		const onResult = vi.fn()
		const recognition = createMockVocal({ continuous: true })
		const { getByTestId, rerender } = render(
			getInstance({
				__rsInstance: recognition,
				onEnd,
				onResult,
				continuous: true,
				timeout: 10_000,
				silenceTimeout: 5000,
			})
		)
		// useVocal subscribes a few internal listeners on mount — snapshot the baseline
		// AFTER render so we only measure what the click adds and the end-of-session removes.
		const baseline = recognition.handlerCount()

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(
				getInstance({
					__rsInstance: recognition,
					onEnd,
					onResult,
					continuous: true,
					timeout: 10_000,
					silenceTimeout: 7000,
				})
			)
		})

		await act(async () => {
			recognition.say('Hello')
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1))
		})

		expect(onEnd).toHaveBeenCalledTimes(1)
		expect(onResult).toHaveBeenCalledTimes(1)
		expect(recognition.handlerCount()).toBe(baseline)
	})

	it('calls onEnd via the end event when stop is asynchronous', async () => {
		const onEnd = vi.fn()
		const recognition = createMockVocal()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onEnd }))

		// Simulate async stop: override stop() so the end event does not fire immediately
		recognition.stop.mockImplementation(() => {})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.say('Foo')
			// stopRecognition was called but end has not fired yet — onEnd must not be called
			expect(onEnd).not.toHaveBeenCalled()
			// Browser fires end asynchronously after recognition stops
			recognition.end()
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})
	})

	describe('Continuous sessions', () => {
		it('keeps session active after first result without firing onResult', async () => {
			const onResult = vi.fn()
			const recognition = createMockVocal({ continuous: true })
			const { getByTestId } = render(getInstance({ __rsInstance: recognition, onResult, continuous: true }))

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.say('Foo')
			})

			expect(onResult).not.toHaveBeenCalled()
			expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true')
		})

		it('keeps session active on nomatch instead of stopping recognition', async () => {
			const onEnd = vi.fn()
			const onNoMatch = vi.fn()
			const recognition = createMockVocal({ continuous: true })
			const { getByTestId } = render(
				getInstance({ __rsInstance: recognition, onEnd, onNoMatch, continuous: true })
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				// say(null) dispatches speechstart → speechend → nomatch
				recognition.say(null)
			})

			expect(onNoMatch).toHaveBeenCalledTimes(1)
			expect(onEnd).not.toHaveBeenCalled()
			expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true')
		})

		it('fires onResult once at session end with full accumulated transcript', async () => {
			const onResult = vi.fn()
			const onEnd = vi.fn()
			// Vocal must be created with continuous: true so its internal listeners
			// intercept intermediate results and emit a single aggregated event on stop.
			const recognition = createMockVocal({ continuous: true })
			const { getByTestId } = render(
				getInstance({ __rsInstance: recognition, onResult, onEnd, continuous: true })
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.say('Hello')
			})

			await act(async () => {
				recognition.say('world')
			})

			expect(onResult).not.toHaveBeenCalled()

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
				await waitFor(() => expect(onEnd).toHaveBeenCalled())
			})

			expect(onResult).toHaveBeenCalledTimes(1)
			expect(onResult).toHaveBeenCalledWith('Hello world', expect.anything())
		})

		it('stops session on explicit button click while listening', async () => {
			const onEnd = vi.fn()
			const recognition = createMockVocal({ continuous: true })
			const { getByTestId } = render(getInstance({ __rsInstance: recognition, onEnd, continuous: true }))

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.say('Foo')
				await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
			})

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
				await waitFor(() => expect(onEnd).toHaveBeenCalled())
			})

			expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'false')
		})

		it('does not evaluate commands in continuous mode', async () => {
			const commandFn = vi.fn()
			const onEnd = vi.fn()
			const recognition = createMockVocal({ continuous: true })
			const { getByTestId } = render(
				getInstance({ __rsInstance: recognition, commands: { rouge: commandFn }, onEnd, continuous: true })
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.say('rouge')
				await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
			})

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
				await waitFor(() => expect(onEnd).toHaveBeenCalled())
			})

			expect(commandFn).not.toHaveBeenCalled()
		})

		it('auto-stops after silenceTimeout ms of inactivity following last result', async () => {
			vi.useFakeTimers()
			const onEnd = vi.fn()
			const onResult = vi.fn()
			const recognition = createMockVocal({ continuous: true })
			// timeout bumped above silenceTimeout so the regular timer cannot fire first —
			// both timers share stableTimerCb, so a shorter `timeout` would mask which one
			// actually triggered _onEnd.
			const { getByTestId } = render(
				getInstance({
					__rsInstance: recognition,
					onEnd,
					onResult,
					continuous: true,
					timeout: 10_000,
					silenceTimeout: 5000,
				})
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			act(() => {
				recognition.say('Hello')
			})

			expect(onEnd).not.toHaveBeenCalled()

			act(() => {
				vi.advanceTimersByTime(4999)
			})
			expect(onEnd).not.toHaveBeenCalled()

			act(() => {
				vi.advanceTimersByTime(1)
			})

			expect(onEnd).toHaveBeenCalledTimes(1)
			expect(onResult).toHaveBeenCalledTimes(1)
			expect(onResult).toHaveBeenCalledWith('Hello', expect.anything())
			vi.useRealTimers()
		})

		it('cancels then rearms the silence timer when speech resumes', async () => {
			vi.useFakeTimers()
			const onEnd = vi.fn()
			const recognition = createMockVocal({ continuous: true })
			const { getByTestId } = render(
				getInstance({
					__rsInstance: recognition,
					onEnd,
					continuous: true,
					timeout: 10_000,
					silenceTimeout: 5000,
				})
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			// speechstart → speechend arms the silence timer at t=0 (fires at t=5000).
			act(() => {
				recognition.fire('speechstart', new Event('speechstart'))
				recognition.fire('speechend', new Event('speechend'))
			})

			// Speech resumes at t=3000, before the threshold: the new speechstart cancels the timer.
			act(() => {
				vi.advanceTimersByTime(3000)
				recognition.fire('speechstart', new Event('speechstart'))
			})

			// Past the original deadline (t=5001): cancellation held, session still alive.
			act(() => {
				vi.advanceTimersByTime(2001)
			})
			expect(onEnd).not.toHaveBeenCalled()

			// speechend rearms the silence timer at t=5001 (fires at t=10001).
			act(() => {
				recognition.fire('speechend', new Event('speechend'))
			})

			// Just before the rearmed deadline (t=10000): still alive.
			act(() => {
				vi.advanceTimersByTime(4999)
			})
			expect(onEnd).not.toHaveBeenCalled()

			// Rearmed silence timer elapses at t=10001.
			act(() => {
				vi.advanceTimersByTime(1)
			})
			expect(onEnd).toHaveBeenCalledTimes(1)
			vi.useRealTimers()
		})

		it('does not start the silence timer when continuous is false', async () => {
			vi.useFakeTimers()
			const onEnd = vi.fn()
			const recognition = createMockVocal()
			const { getByTestId } = render(
				getInstance({
					__rsInstance: recognition,
					onEnd,
					continuous: false,
					timeout: 10_000,
					silenceTimeout: 5000,
				})
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			// Drive speechstart/speechend directly — a full say() would emit `result`,
			// which in non-continuous mode calls stopRecognition() and fires `end`
			// immediately, masking the silence-timer branch under test.
			act(() => {
				recognition.fire('speechstart', new Event('speechstart'))
				recognition.fire('speechend', new Event('speechend'))
			})

			act(() => {
				vi.advanceTimersByTime(5000)
			})

			expect(onEnd).not.toHaveBeenCalled()
			vi.useRealTimers()
		})
	})

	it('triggers onError handler when subscribe throws', async () => {
		// Mock useVocal so subscribe() throws synchronously inside startRecognition.
		// Scoped via vi.doMock + dynamic import so the rest of the suite uses the real hook.
		vi.doMock('../../hooks/useVocal', () => ({
			useVocal: () => [
				null,
				{
					subscribe: () => {
						throw new Error('Foo')
					},
				},
			],
		}))
		vi.resetModules()
		const { Vocal: VocalWithMockedUseVocal } = await import('../Vocal')
		const onError = vi.fn()
		const { getByTestId } = render(<VocalWithMockedUseVocal onError={onError} />)
		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(onError).toHaveBeenCalled())
		})
		vi.doUnmock('../../hooks/useVocal')
	})
})
