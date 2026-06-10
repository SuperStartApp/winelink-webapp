import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ho rimosso tutto quello che riguardava il plugin PWA
export default defineConfig({
  plugins: [react()],
})