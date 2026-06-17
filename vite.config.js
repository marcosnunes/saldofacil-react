import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('firebase/app') || id.includes('firebase/auth') || id.includes('firebase/database')) {
            return 'firebase';
          }
          if (id.includes('recharts')) {
            return 'charts';
          }
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor';
          }
        }
      }
    }
  }
})