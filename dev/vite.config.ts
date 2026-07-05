import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	resolve: {
		dedupe: ['react', 'react-dom'],
	},
	server: {
		port: 10001,
		open: true,
	},
})
