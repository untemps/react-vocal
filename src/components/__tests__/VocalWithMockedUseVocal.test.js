import React from 'react'
import { waitFor } from '@testing-library/dom'
import { act, fireEvent, render } from '@testing-library/react'

import Vocal from '../Vocal'

jest.mock('../../hooks/useVocal', () => {
	return () => [
		null,
		{
			subscribe: () => {
				throw new Error('Foo')
			},
		},
	]
})

const defaultProps = {}
const getInstance = (props = {}, children = null) => (
	<Vocal {...defaultProps} {...props}>
		{children}
	</Vocal>
)

describe('Vocal', () => {
	it('triggers onError handler', async () => {
		const onError = jest.fn()
		const { queryByTestId } = render(getInstance({ onError }))
		await act(async () => {
			fireEvent.click(queryByTestId('__vocal-root__'))
			await waitFor(() => expect(onError).toHaveBeenCalled())
		})
	})
})

// TODO: Merge this file with Vocal.test.js
