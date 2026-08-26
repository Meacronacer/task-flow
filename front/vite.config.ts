import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@app': resolve(import.meta.dirname, 'src/app'),
      '@pages': resolve(import.meta.dirname, 'src/pages'),
      '@widgets': resolve(import.meta.dirname, 'src/widgets'),
      '@features': resolve(import.meta.dirname, 'src/features'),
      '@entities': resolve(import.meta.dirname, 'src/entities'),
      '@shared': resolve(import.meta.dirname, 'src/shared'),
    },
  },

  server: {
    port: 5173,
  },
});