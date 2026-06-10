import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- AGGIUNGI QUESTO

// Abbiamo rimosso il plugin PWA per la massima stabilità
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- AGGIUNGI QUESTO
  ],
})