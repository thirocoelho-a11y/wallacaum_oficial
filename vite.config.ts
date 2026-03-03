import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Cria o atalho '@' para a pasta 'src', facilitando os imports
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Garante que o build use caminhos relativos (evita erros de carregamento de sprites)
  base: './',
})
