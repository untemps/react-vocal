import React from 'react'
import PropTypes from 'prop-types'

const Icon = ({ color, activeColor, isActive }) => {
	return (
		<svg
			data-testid="__icon-root__"
			xmlns="http://www.w3.org/2000/svg"
			width="100%"
			height="100%"
			viewBox="0 0 24 24"
		>
			<g>
				<path
					data-testid="__icon-path__"
					fill={color}
					d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
				/>
				{isActive && <circle data-testid="__icon-active__" fill={activeColor} cx="16" cy="4" r="4" />}
			</g>
		</svg>
	)
}

Icon.propTypes = {
	color: PropTypes.string,
	activeColor: PropTypes.string,
	isActive: PropTypes.bool,
}

Icon.defaultProps = {
	color: 'black',
	activeColor: 'red',
	isActive: false,
}

export default Icon
