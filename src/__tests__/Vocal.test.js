import React from 'react'
import { waitFor } from '@testing-library/dom'
import { act, fireEvent, render } from '@testing-library/react'
import { toBeInTheDocument } from '@testing-library/jest-dom/matchers'

import SpeechRecognitionMock from './SpeechRecognitionMock'
import NavigatorPermissionsMock from './NavigatorPermissionsMock'
import NavigatorMediaDevicesMock from './NavigatorMediaDevicesMock'

import SpeechRecognitionWrapper from '../SpeechRecognitionWrapper'
import Vocal from '../Vocal'

const defaultProps = {}
const getInstance = (props = {}, children = null) => (
	<Vocal {...defaultProps} {...props}>
		{children}
	</Vocal>
)

describe('Vocal', () => {
	beforeAll(() => {
		expect.extend({ toBeInTheDocument })

		SpeechRecognitionMock.mock()
		NavigatorPermissionsMock.mock('granted')
		NavigatorMediaDevicesMock.mock('foo')
	})

	afterAll(() => {
		SpeechRecognitionMock.unmock()
		NavigatorPermissionsMock.unmock()
		NavigatorMediaDevicesMock.unmock()
	})

	it('matches snapshot', () => {
		const { asFragment } = render(getInstance())
		expect(asFragment()).toMatchSnapshot()
	})

	it('renders default children', () => {
		const { queryByTestId } = render(getInstance())
		expect(queryByTestId('__speech-root__')).toBeInTheDocument()
	})

	it('renders custom children', () => {
		const { queryByTestId } = render(getInstance(null, <div data-testid="__speech-custom-root__" />))
		expect(queryByTestId('__speech-root__')).not.toBeInTheDocument()
		expect(queryByTestId('__speech-custom-root__')).toBeInTheDocument()
	})

	it('triggers onStart handler', async () => {
		const onStart = jest.fn()
		const { queryByTestId } = render(getInstance({ onStart }))
		await act(async () => {
			fireEvent.click(queryByTestId('__speech-root__'))
			await waitFor(() => expect(onStart).toHaveBeenCalled())
		})
	})

	it('triggers onResult handler', async () => {
		const onResult = jest.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { queryByTestId } = render(getInstance({ __recognitionInstance: recognition, onResult }))
		await act(async () => {
			recognition.instance.addEventListener('start', async () => {
				recognition.instance.say('Foo')
				await waitFor(() => expect(onResult).toHaveBeenCalledWith('Foo', expect.anything()))
			})
			fireEvent.click(queryByTestId('__speech-root__'))
		})
	})

	it('triggers onSpeechStart handler', async () => {
		const onSpeechStart = jest.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { queryByTestId } = render(getInstance({ __recognitionInstance: recognition, onSpeechStart }))
		await act(async () => {
			recognition.instance.addEventListener('start', async () => {
				recognition.instance.say('Foo')
				await waitFor(() => expect(onSpeechStart).toHaveBeenCalled())
			})
			fireEvent.click(queryByTestId('__speech-root__'))
		})
	})

	it('triggers onSpeechEnd handler', async () => {
		const onSpeechEnd = jest.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { queryByTestId } = render(getInstance({ __recognitionInstance: recognition, onSpeechEnd }))
		await act(async () => {
			recognition.instance.addEventListener('start', async () => {
				recognition.instance.say('Foo')
				await waitFor(() => expect(onSpeechEnd).toHaveBeenCalled())
			})
			fireEvent.click(queryByTestId('__speech-root__'))
		})
	})

	it('triggers onEnd handler after timeout', async () => {
		const timeout = 100
		const onEnd = jest.fn()
		const { queryByTestId } = render(getInstance({ timeout, onEnd }))
		await act(async () => {
			fireEvent.click(queryByTestId('__speech-root__'))
			await waitFor(() => expect(onEnd).toHaveBeenCalled(), { timeout: 200 })
		})
	})

	it('triggers onEnd handler after speech', async () => {
		const onEnd = jest.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { queryByTestId } = render(getInstance({ __recognitionInstance: recognition, onEnd }))
		await act(async () => {
			fireEvent.click(queryByTestId('__speech-root__'))
			recognition.instance.addEventListener('start', async () => {
				recognition.instance.say('Foo')
				await waitFor(() => expect(onEnd).toHaveBeenCalled())
			})
		})
	})
})
