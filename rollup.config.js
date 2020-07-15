import replace from 'rollup-plugin-replace'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import postcss from 'rollup-plugin-postcss'

const production = process.env.NODE_ENV === 'production'

export default {
	input: 'src/index.js',
	output: {
		name: 'react-vocal',
		file: 'dist/index.js',
		format: 'umd',
		globals: {
			react: 'React',
			'react-dom': 'ReactDOM',
		},
		sourcemap: 'inline',
	},
	plugins: [
		babel({
			exclude: 'node_modules/**',
			babelHelpers: 'bundled',
		}),
		postcss({
			config: {
				path: "./postcss.config.js",
			},
			extensions: [".css"],
			modules: true,
			minimize: production
		}),
		replace({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		resolve(),
		commonjs(),
		production && terser(),
		!production && serve({
			open: true,
			contentBase: '',
		}),
		!production && livereload({
			watch: 'dist',
		}),
	],
}
