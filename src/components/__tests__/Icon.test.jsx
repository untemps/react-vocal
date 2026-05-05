import React from 'react'
import { render } from '@testing-library/react'

import Icon from '../Icon'

const defaultProps = {}
const getInstance = (props = {}) => <Icon {...defaultProps} {...props} />

describe('Icon', () => {
	it('matches snapshot', () => {
		const { asFragment } = render(getInstance())
		expect(asFragment()).toMatchSnapshot()
	})

	it('renders component', () => {
		const { queryByTestId } = render(getInstance())
		expect(queryByTestId('__icon-root__')).toBeInTheDocument()
	})

	it('renders component color', () => {
		const color = 'green'
		const { queryByTestId } = render(getInstance({ color }))
		expect(queryByTestId('__icon-path__')).toHaveAttribute('fill', color)
	})

	it('renders active component', () => {
		const isActive = true
		const { queryByTestId } = render(getInstance({ isActive }))
		expect(queryByTestId('__icon-active__')).toBeInTheDocument()
	})

	it('renders active component color', () => {
		const isActive = true
		const activeColor = 'blue'
		const { queryByTestId } = render(getInstance({ isActive, activeColor }))
		expect(queryByTestId('__icon-active__')).toHaveAttribute('fill', activeColor)
	})
})
