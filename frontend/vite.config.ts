import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiOrigin = (env.VITE_API_ORIGIN || 'http://127.0.0.1:8000').replace(/\/$/, '')

  return {
    plugins: [react()],
    // Existing components still contain local API origins. Replace those literals at
    // build time so one VITE_API_ORIGIN setting configures the deployed frontend.
    define: {
      '"http://localhost:8000"': JSON.stringify(apiOrigin),
      '"http://127.0.0.1:8000"': JSON.stringify(apiOrigin),
    },
  }
})
