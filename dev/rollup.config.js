import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import commonjs from '@rollup/plugin-commonjs'

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/index.js',
	},
	plugins: [
		babel({
			exclude: 'node_modules/**',
			babelHelpers: 'bundled',
		}),
		resolve({
			browser: true,
		}),
		replace({
			'process.env.NODE_ENV': JSON.stringify( 'production' )
		}),
		commonjs(),
		serve({
			open: true,
			contentBase: ['dist', 'public'],
		}),
		livereload(),
	],
}
