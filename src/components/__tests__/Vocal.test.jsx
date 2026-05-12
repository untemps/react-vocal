import React from 'react'
import { waitFor } from '@testing-library/dom'
import { act, fireEvent, render } from '@testing-library/react'
import { Vocal as SpeechRecognitionWrapper } from '@untemps/vocal'

import Vocal from '../Vocal'

const defaultProps = {}
const getInstance = (props = {}, children = null) => (
	<Vocal {...defaultProps} {...props}>
		{children}
	</Vocal>
)

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

	it('renders no children element if SpeechRecognition is not supported', () => {
		vi.spyOn(SpeechRecognitionWrapper, 'isSupported', 'get').mockReturnValueOnce(false)
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
			fireEvent.click(queryByTestId('__vocal-custom-root__'))
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
			fireEvent.click(queryByText('start'))
			fireEvent.click(queryByText('stop'))
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
			fireEvent.click(queryByText('start'))
			await waitFor(() => {
				expect(queryByText('Started')).toBeInTheDocument()
			})
			fireEvent.click(queryByText('stop'))
			await waitFor(() => {
				expect(queryByText('Stopped')).toBeInTheDocument()
			})
		})
	})

	it('renders pointer cursor when idle', () => {
		const { getByTestId } = render(getInstance())
		expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'pointer' })
	})

	it('renders default cursor when listening in non-continuous mode', () => {
		const { getByTestId } = render(getInstance())
		fireEvent.click(getByTestId('__vocal-root__'))
		expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' })
	})

	it('renders pointer cursor when listening in continuous mode', () => {
		const { getByTestId } = render(getInstance({ continuous: true }))
		fireEvent.click(getByTestId('__vocal-root__'))
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
		const recognition = new SpeechRecognitionWrapper()
		const commands = { foo: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		let flag = false
		recognition.addEventListener('start', async () => {
			flag = true
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))

			await waitFor(() => flag)

			recognition.instance.say('Foo')
			await waitFor(() => expect(callback).toHaveBeenCalledWith('Foo'))
		})
	})

	it('triggers onStart handler', async () => {
		const onStart = vi.fn()
		const { queryByTestId } = render(getInstance({ onStart }))
		await act(async () => {
			fireEvent.click(queryByTestId('__vocal-root__'))
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})
	})

	it('triggers onResult handler', async () => {
		const onResult = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onResult }))

		let flag = false
		recognition.addEventListener('start', async () => {
			flag = true
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))

			await waitFor(() => flag)

			recognition.instance.say('Foo')
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('Foo', expect.anything()))
		})
	})

	it('triggers onNoMatch handler', async () => {
		const onNoMatch = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onNoMatch }))

		let flag = false
		recognition.addEventListener('start', async () => {
			flag = true
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))

			await waitFor(() => flag)

			recognition.instance.say(null)
			await waitFor(() => expect(onNoMatch).toHaveBeenCalled())
		})
	})

	it('triggers onSpeechStart handler', async () => {
		const onSpeechStart = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onSpeechStart }))

		let flag = false
		recognition.addEventListener('start', async () => {
			flag = true
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))

			await waitFor(() => flag)

			recognition.instance.say('Foo')
			await waitFor(() => expect(onSpeechStart).toHaveBeenCalled())
		})
	})

	it('triggers onSpeechEnd handler', async () => {
		const onSpeechEnd = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onSpeechEnd }))

		let flag = false
		recognition.addEventListener('start', async () => {
			flag = true
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))

			await waitFor(() => flag)

			recognition.instance.say('Foo')
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
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onEnd }))

		let flag = false
		recognition.addEventListener('start', async () => {
			flag = true
		})

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))

			await waitFor(() => flag)

			recognition.instance.say('Foo')
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})
	})

	it('calls the updated onEnd prop after a re-render during an active session', async () => {
		const onEndV1 = vi.fn()
		const onEndV2 = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onEnd: onEndV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onEnd: onEndV2 }))
		})

		await act(async () => {
			recognition.instance.say('Foo')
			await waitFor(() => expect(onEndV2).toHaveBeenCalled())
		})

		expect(onEndV1).not.toHaveBeenCalled()
	})

	it('resets to idle after a re-render during an active session', async () => {
		const onEnd = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onEnd }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onEnd }))
		})

		await act(async () => {
			recognition.instance.say('Foo')
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})

		expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'false')
	})

	it('calls the updated onResult prop after a re-render during an active session', async () => {
		const onResultV1 = vi.fn()
		const onResultV2 = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onResult: onResultV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onResult: onResultV2 }))
		})

		await act(async () => {
			recognition.instance.say('Foo')
			await waitFor(() => expect(onResultV2).toHaveBeenCalledWith('Foo', expect.anything()))
		})

		expect(onResultV1).not.toHaveBeenCalled()
	})

	it('calls the updated onSpeechStart prop after a re-render during an active session', async () => {
		const onSpeechStartV1 = vi.fn()
		const onSpeechStartV2 = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onSpeechStart: onSpeechStartV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onSpeechStart: onSpeechStartV2 }))
		})

		await act(async () => {
			recognition.instance.say('Foo')
			await waitFor(() => expect(onSpeechStartV2).toHaveBeenCalled())
		})

		expect(onSpeechStartV1).not.toHaveBeenCalled()
	})

	it('calls the updated onSpeechEnd prop after a re-render during an active session', async () => {
		const onSpeechEndV1 = vi.fn()
		const onSpeechEndV2 = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onSpeechEnd: onSpeechEndV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onSpeechEnd: onSpeechEndV2 }))
		})

		await act(async () => {
			recognition.instance.say('Foo')
			await waitFor(() => expect(onSpeechEndV2).toHaveBeenCalled())
		})

		expect(onSpeechEndV1).not.toHaveBeenCalled()
	})

	it('calls the updated onNoMatch prop after a re-render during an active session', async () => {
		const onNoMatchV1 = vi.fn()
		const onNoMatchV2 = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onNoMatch: onNoMatchV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onNoMatch: onNoMatchV2 }))
		})

		await act(async () => {
			recognition.instance.say(null)
			await waitFor(() => expect(onNoMatchV2).toHaveBeenCalled())
		})

		expect(onNoMatchV1).not.toHaveBeenCalled()
	})

	it('calls the updated onError prop after a re-render during an active session', async () => {
		const onErrorV1 = vi.fn()
		const onErrorV2 = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onError: onErrorV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true'))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onError: onErrorV2 }))
		})

		await act(async () => {
			recognition.instance.error(new Error('mic failure'))
			await waitFor(() => expect(onErrorV2).toHaveBeenCalled())
		})

		expect(onErrorV1).not.toHaveBeenCalled()
	})

	it('triggers command matched on first segment in multi-segment result', async () => {
		const callback = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const commands = { hello: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([
				[{ transcript: 'hello', confidence: 0.9 }],
				[{ transcript: 'world', confidence: 0.8 }],
			])
			await waitFor(() => expect(callback).toHaveBeenCalledWith('hello'))
		})
	})

	it('triggers command matched on second segment in multi-segment result', async () => {
		const callback = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const commands = { world: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([
				[{ transcript: 'hello', confidence: 0.9 }],
				[{ transcript: 'world', confidence: 0.8 }],
			])
			await waitFor(() => expect(callback).toHaveBeenCalledWith('world'))
		})
	})

	it('does not trigger command when no segment matches', async () => {
		const callback = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const commands = { foo: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([
				[{ transcript: 'hello', confidence: 0.9 }],
				[{ transcript: 'world', confidence: 0.8 }],
			])
			await new Promise((r) => setTimeout(r, 100))
		})

		expect(callback).not.toHaveBeenCalled()
	})

	it('fires only the first matching command when multiple segments each match a different command', async () => {
		const callbackHello = vi.fn()
		const callbackWorld = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const commands = { hello: callbackHello, world: callbackWorld }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([
				[{ transcript: 'hello', confidence: 0.9 }],
				[{ transcript: 'world', confidence: 0.8 }],
			])
			await waitFor(() => expect(callbackHello).toHaveBeenCalledWith('hello'))
		})

		expect(callbackWorld).not.toHaveBeenCalled()
	})

	it('passes full joined transcript to onResult regardless of command segment matching', async () => {
		const onResult = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const commands = { hello: vi.fn() }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands, onResult }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([
				[{ transcript: 'hello ', confidence: 0.9 }],
				[{ transcript: 'world', confidence: 0.8 }],
			])
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('hello world', expect.anything()))
		})
	})

	it('returns the most confident alternative as the onResult transcript', async () => {
		const onResult = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onResult }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([[
				{ transcript: 'bar', confidence: 0.4 },
				{ transcript: 'foo', confidence: 0.9 },
				{ transcript: 'baz', confidence: 0.1 },
			]])
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('foo', expect.anything()))
		})
	})

	it('joins all segments into the onResult transcript', async () => {
		const onResult = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onResult }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([
				[{ transcript: 'hello ', confidence: 0.9 }],
				[{ transcript: 'world', confidence: 0.8 }],
			])
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('hello world', expect.anything()))
		})
	})

	it('triggers command matched on a word within a multi-word segment', async () => {
		const callback = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const commands = { rouge: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([[{ transcript: 'je veux du rouge', confidence: 0.9 }]])
			await waitFor(() => expect(callback).toHaveBeenCalledWith('rouge'))
		})
	})

	it('triggers command matched on a secondary alternative (homophone)', async () => {
		const callback = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const commands = { vert: callback }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands, maxAlternatives: 3 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			// Primary alternative is the homophone; secondary is the correct word
			recognition.instance.say([[
				{ transcript: 'verre', confidence: 0.9 },
				{ transcript: 'vert', confidence: 0.7 },
			]])
			await waitFor(() => expect(callback).toHaveBeenCalledWith('vert'))
		})
	})

	it('passes the most confident transcript to onResult even when command matches a secondary alternative', async () => {
		const onResult = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const commands = { vert: vi.fn() }
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, commands, onResult, maxAlternatives: 3 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([[
				{ transcript: 'verre', confidence: 0.9 },
				{ transcript: 'vert', confidence: 0.7 },
			]])
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('verre', expect.anything()))
		})
	})

	it('calls onEnd via the end event when stop is asynchronous', async () => {
		const onEnd = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onEnd }))

		// Simulate async stop: override stop() so the end event does not fire immediately
		recognition.instance.stop = vi.fn()

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say('Foo')
			// stopRecognition was called but end has not fired yet — onEnd must not be called
			expect(onEnd).not.toHaveBeenCalled()
			// Browser fires end asynchronously after recognition stops
			recognition.instance.end()
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})
	})

	describe('Continuous sessions', () => {
		it('keeps session active after first result without firing onResult', async () => {
			const onResult = vi.fn()
			const recognition = new SpeechRecognitionWrapper()
			const { getByTestId } = render(getInstance({ __rsInstance: recognition, onResult, continuous: true }))

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.instance.say('Foo')
			})

			expect(onResult).not.toHaveBeenCalled()
			expect(getByTestId('__vocal-root__')).toHaveAttribute('aria-pressed', 'true')
		})

		it('fires onResult once at session end with full accumulated transcript', async () => {
			const onResult = vi.fn()
			const onEnd = vi.fn()
			const recognition = new SpeechRecognitionWrapper()
			const { getByTestId } = render(
				getInstance({ __rsInstance: recognition, onResult, onEnd, continuous: true })
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.instance.say('Hello')
			})

			await act(async () => {
				recognition.instance.say(' world')
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
			const recognition = new SpeechRecognitionWrapper()
			const { getByTestId } = render(getInstance({ __rsInstance: recognition, onEnd, continuous: true }))

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.instance.say('Foo')
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
			const recognition = new SpeechRecognitionWrapper()
			const { getByTestId } = render(
				getInstance({ __rsInstance: recognition, commands: { rouge: commandFn }, onEnd, continuous: true })
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			await act(async () => {
				recognition.instance.say('rouge')
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
			const recognition = new SpeechRecognitionWrapper()
			const { getByTestId } = render(
				getInstance({ __rsInstance: recognition, onEnd, onResult, continuous: true, silenceTimeout: 5000 })
			)

			await act(async () => {
				fireEvent.click(getByTestId('__vocal-root__'))
			})

			act(() => {
				recognition.instance.say('Hello')
			})

			expect(onEnd).not.toHaveBeenCalled()

			act(() => {
				vi.advanceTimersByTime(5000)
			})

			expect(onEnd).toHaveBeenCalled()
			expect(onResult).toHaveBeenCalledWith('Hello', expect.anything())
			vi.useRealTimers()
		})
	})
})
