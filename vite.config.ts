import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forwards PHP endpoints to the local PHP server
      '/submit_contact.php': 'http://localhost:8001',
      '/geo.php': 'http://localhost:8001',
    }
  }
})

