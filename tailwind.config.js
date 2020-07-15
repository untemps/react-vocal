module.exports = {
	purge: false,
	theme: {
		screens: (theme) => ({
			...theme,
			xs: '320px',
		}),
		fontFamily: {
			display: ['Elsie'],
			mono: ['SFMono-Regular', 'Menlo'],
		},
		backgroundColor: (theme) => ({ ...theme('colors'), primary: 'red' }),
		extend: {},
	},
	variants: {},
	plugins: [],
}
