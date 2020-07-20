import React from 'react'

const RedDot = ({ size, className }) => (
	<span className={`h-${size} w-${size} border-none rounded-full bg-primary inline-flex${!!className ? ` ${className}` : ''}`} />
)

export default RedDot
