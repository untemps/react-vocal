import React from 'react'
import { waitFor } from '@testing-library/dom'
import { act, fireEvent, render } from '@testing-library/react'
import { toBeInTheDocument } from '@testing-library/jest-dom/matchers'

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

		global.PermissionStatus = jest.fn(() => ({
			state: 'granted',
			addEventListener: jest.fn(),
		}))
		const status = new PermissionStatus()
		global.Permissions = jest.fn(() => ({
			query: jest.fn().mockResolvedValue(status),
		}))
		global.navigator.permissions = new Permissions()
		global.MediaDevices = jest.fn(() => ({
			getUserMedia: jest.fn().mockResolvedValue('foo'),
		}))
		global.navigator.mediaDevices = new MediaDevices()
		global.SpeechRecognition = jest.fn(() => {
			const handlers = {}
			return {
				addEventListener: jest.fn((type, callback) => {
					handlers[type] = callback
				}),
				removeEventListener: jest.fn(),
				dispatchEvent: jest.fn(),
				start: jest.fn(() => {
					!!handlers.start && handlers.start()
				}),
				stop: jest.fn(() => {
					!!handlers.end && handlers.end()
				}),
				abort: jest.fn(() => {
					!!handlers.end && handlers.end()
				}),
				say: jest.fn((sentence) => {
					!!handlers.speechstart && handlers.speechstart()

					const resultEvent = new Event('result')
					resultEvent.resultIndex = 0
					resultEvent.results = [
						[
							{
								transcript: sentence,
							},
						],
					]

					!!handlers.result && handlers.result(resultEvent)
					!!handlers.speechend && handlers.speechend()
				}),
			}
		})
	})

	afterAll(() => {
		global.PermissionStatus.mockReset()
		global.Permissions.mockReset()
		global.MediaDevices.mockReset()
		global.SpeechRecognition.mockReset()
	})

	it('matches snapshot', () => {
		const { asFragment } = render(getInstance())
		expect(asFragment()).toMatchSnapshot()
	})

	it('renders default children', () => {
		const { queryByTestId } = render(getInstance())
		expect(queryByTestId('__vocal-root__')).toBeInTheDocument()
	})

	it('renders custom children', () => {
		const { queryByTestId } = render(getInstance(null, <div data-testid="__vocal-custom-root__" />))
		expect(queryByTestId('__vocal-root__')).not.toBeInTheDocument()
		expect(queryByTestId('__vocal-custom-root__')).toBeInTheDocument()
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
		const { getByTestId } = render(getInstance({ __recognitionInstance: recognition, onResult }))

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

	it('triggers onSpeechStart handler', async () => {
		const onSpeechStart = jest.fn()
		const recognition = new SpeechRecognitionWrapper()
		const { getByTestId } = render(getInstance({ __recognitionInstance: recognition, onSpeechStart }))

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
		const { getByTestId } = render(getInstance({ __recognitionInstance: recognition, onSpeechEnd }))

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
		const { getByTestId } = render(getInstance({ __recognitionInstance: recognition, onEnd }))

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
