import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cd-proxy': {
        target: 'https://api.comfydeploy.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/cd-proxy/, ''),
      },
    },
  },
})
