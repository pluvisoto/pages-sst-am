import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        landingpage: resolve(__dirname, 'landingpage.html'),
        contadores: resolve(__dirname, 'contadores.html'),
      },
    },
  },
});
