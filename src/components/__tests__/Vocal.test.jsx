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

	it('renders default cursor when listening', () => {
		const { getByTestId } = render(getInstance())
		fireEvent.click(getByTestId('__vocal-root__'))
		expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' })
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
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' }))
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
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' }))
		})

		await act(async () => {
			rerender(getInstance({ __rsInstance: recognition, onEnd }))
		})

		await act(async () => {
			recognition.instance.say('Foo')
			await waitFor(() => expect(onEnd).toHaveBeenCalled())
		})

		expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'pointer' })
	})

	it('calls the updated onResult prop after a re-render during an active session', async () => {
		const onResultV1 = vi.fn()
		const onResultV2 = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId, rerender } = render(getInstance({ __rsInstance: recognition, onResult: onResultV1 }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' }))
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
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' }))
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
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' }))
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
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' }))
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
			await waitFor(() => expect(getByTestId('__vocal-root__')).toHaveStyle({ cursor: 'default' }))
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

	it('returns the most confident alternative when multiple alternatives are provided', async () => {
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

	it('joins all segments when multiple result segments are provided', async () => {
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

	it('picks highest-confidence alternative per segment when multi-segment with multi-alternative', async () => {
		const onResult = vi.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __rsInstance: recognition, onResult }))

		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			recognition.instance.say([
				[{ transcript: 'good ', confidence: 0.8 }, { transcript: 'bad ', confidence: 0.2 }],
				[{ transcript: 'day', confidence: 0.95 }, { transcript: 'dey', confidence: 0.3 }],
			])
			await waitFor(() => expect(onResult).toHaveBeenCalledWith('good day', expect.anything()))
		})
	})
})
