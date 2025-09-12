import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is the important part
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }

})
