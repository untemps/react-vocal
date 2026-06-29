/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

const bundleFileName = (format: string): string => {
	if (format === 'es') return 'index.es.js'
	if (format === 'cjs') return 'index.cjs'
	throw new Error(`Unsupported library format: ${format}`)
}

export default defineConfig({
	plugins: [
		react(),
		dts({
			tsconfigPath: './tsconfig.json',
			include: ['src/**/*.ts', 'src/**/*.tsx'],
			exclude: ['src/**/__tests__/**', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
			entryRoot: 'src',
			bundleTypes: true,
		}),
	],
	build: {
		lib: {
			entry: 'src/index.ts',
			formats: ['es', 'cjs'],
			fileName: bundleFileName,
		},
		rollupOptions: {
			external: [/^react($|\/)/, /^react-dom($|\/)/, 'fuse.js', '@untemps/vocal'],
		},
		sourcemap: true,
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
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
