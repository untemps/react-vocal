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
		jest.spyOn(SpeechRecognitionWrapper, 'isSupported', 'get').mockReturnValueOnce(false)
		const { queryByTestId } = render(getInstance(null, <div data-testid="__vocal-custom-root__" />))
		expect(queryByTestId('__vocal-root__')).not.toBeInTheDocument()
		expect(queryByTestId('__vocal-custom-root__')).not.toBeInTheDocument()
		jest.clearAllMocks()
	})

	it('renders custom children function', () => {
		const { queryByTestId } = render(getInstance(null, () => <div data-testid="__vocal-custom-root__" />))
		expect(queryByTestId('__vocal-root__')).not.toBeInTheDocument()
		expect(queryByTestId('__vocal-custom-root__')).toBeInTheDocument()
	})

	it('starts recognition with custom children function', async () => {
		const onStart = jest.fn()
		const { queryByTestId } = render(
			getInstance({ onStart }, (start) => <div data-testid="__vocal-custom-root__" onClick={start} />)
		)
		await act(async () => {
			fireEvent.click(queryByTestId('__vocal-custom-root__'))
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})
	})

	it('stops recognition with custom children function', async () => {
		const onEnd = jest.fn()
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
		const onEnd = jest.fn()
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
		expect(getByTestId('__vocal-root__')).toHaveStyle({ backgroundColor: 'blue' })
	})

	it('triggers onStart handler', async () => {
		const onStart = jest.fn()
		const { queryByTestId } = render(getInstance({ onStart }))
		await act(async () => {
			fireEvent.click(queryByTestId('__vocal-root__'))
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})
	})

	it('triggers onResult handler', async () => {
		const onResult = jest.fn()
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
		const onNoMatch = jest.fn()
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
		const onSpeechStart = jest.fn()
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
		const onSpeechEnd = jest.fn()
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
		const onEnd = jest.fn()
		const { getByTestId } = render(getInstance({ timeout, onEnd }))
		await act(async () => {
			fireEvent.click(getByTestId('__vocal-root__'))
			await waitFor(() => expect(onEnd).toHaveBeenCalled(), { timeout: timeout * 2 })
		})
	})

	it('triggers onEnd handler after speech', async () => {
		const onEnd = jest.fn()
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
})
