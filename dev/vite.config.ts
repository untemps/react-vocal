import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@untemps/react-vocal': new URL('../src', import.meta.url).pathname,
		},
		dedupe: ['react', 'react-dom'],
	},
	server: {
		port: 10001,
		open: true,
	},
})
