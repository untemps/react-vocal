import React, { useState } from 'react'

import Vocal from '@untemps/react-vocal'

const App = () => {
	const [result, setResult] = useState('')

	const _onVocalStart = () => setResult('')

	const _onVocalResult = (result) => setResult(result)

	const _onInputChange = (e) => setResult(e.target.value)

	return (
		<div className="container mx-auto p-10 min-w-full h-screen flex flex-col items-center justify-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="100%"
				height="100%"
				viewBox="0 0 24 24"
				className="text-teal-500 inline-block h-12 w-12"
			>
				<g>
					<path
						fill="black"
						d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
					/>
					<circle fill="red" cx="16" cy="4" r="4" />
				</g>
			</svg>
			<h1 className="font-display font-bold text-2xl xs:text-4xl text-center leading-none mb-6">react-vocal</h1>
			<p className="font-display text-base text-center leading-none mb-6">
				Click the microphone icon below and say something...
			</p>
			<span className="relative w-full max-w-4xl mb-10">
				<Vocal
					onStart={_onVocalStart}
					onResult={_onVocalResult}
					className="absolute w-6 right-0 mr-4 top-0 mt-6"
				/>
				<input
					value={result}
					onChange={_onInputChange}
					className="font-display text-gray-700 leading-tight appearance-none border rounded-full w-full py-6 pl-6 pr-12 focus:outline-none focus:shadow-outline"
				/>
			</span>
			<hr className="h-4 w-4 border-none rounded-full bg-primary" />
		</div>
	)
}

export default App
