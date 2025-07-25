import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        // sw: 'public/sw.js'
      },
    },
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  assetsInclude: ['**/*.wasm'],
});
