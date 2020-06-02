module.exports = api => ({
	"presets": [
		"@babel/preset-env",
		"@babel/preset-react"
	],
	"plugins": [
		"@babel/plugin-proposal-class-properties",
		"@babel/plugin-transform-react-jsx",
		...(api.env('test') ? ["@babel/plugin-transform-runtime"] : [])
	]
})

