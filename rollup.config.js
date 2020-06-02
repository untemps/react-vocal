import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import { terser } from 'rollup-plugin-terser'
import visualizer from 'rollup-plugin-visualizer'

const production = process.env.NODE_ENV === 'production'
const target = process.env.BABEL_ENV

export default {
	input: 'src/index.js',
	output: {
		name: 'react-vocal',
		file: {
			cjs: 'dist/index.js',
			es: 'dist/index.es.js',
			umd: 'dist/index.umd.js',
		}[target],
		format: target,
		globals: {
			react: 'React',
			'react-dom': 'ReactDOM',
			'prop-types': 'PropTypes',
		},
		sourcemap: 'inline',
	},
	external: ['react', 'react-dom', 'prop-types', '@babel/plugin-transform-runtime'],
	plugins: [
		babel({
			exclude: 'node_modules/**',
			babelHelpers: 'bundled',
		}),
		resolve(),
		commonjs(),
		production && terser(),
		filesize(),
		visualizer({
			sourcemap: true
		})
	],
}
