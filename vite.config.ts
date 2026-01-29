import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'demo'),
  build: {
    outDir: resolve(__dirname, 'demo-dist'),
  },
  resolve: {
    alias: {
      '@webzicon/progress-nav-scrollspy': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3100,
  },
});
