/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

const bundleFileName = (format: string, entryName: string): string => {
	if (format === 'es') return `${entryName}.es.js`
	if (format === 'cjs') return `${entryName}.cjs`
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
			entry: {
				index: 'src/index.ts',
				testing: 'src/testing/index.ts',
			},
			formats: ['es', 'cjs'],
			fileName: bundleFileName,
		},
		rollupOptions: {
			// vitest is a peer of the testing entry only — consumers of the root
			// entry never pull it in. Externalizing it keeps the published bundle
			// free of vitest internals.
			external: ['react', 'react-dom', 'fuse.js', 'vitest'],
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
