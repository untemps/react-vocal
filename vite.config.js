import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	build: {
		lib: {
			entry: 'src/index.js',
			formats: ['es', 'cjs'],
			fileName: (format) => ({ es: 'index.es.js', cjs: 'index.cjs' })[format],
		},
		rollupOptions: {
			external: ['react', 'react-dom', 'fuse.js'],
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
			thresholds: {
				lines: 90,
				functions: 90,
				branches: 85,
				statements: 90,
			},
		},
	},
})
