import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	build: {
		lib: {
			entry: 'src/index.js',
			name: 'ReactVocal',
			formats: ['es', 'cjs', 'umd'],
			fileName: (format) => ({ es: 'index.es.js', umd: 'index.umd.js', cjs: 'index.js' })[format],
		},
		rollupOptions: {
			external: ['react', 'react-dom', 'fuse.js'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
					'fuse.js': 'Fuse',
				},
			},
		},
		sourcemap: true,
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.js'],
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			reportsDirectory: './coverage',
		},
	},
})
