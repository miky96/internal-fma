import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuració Vite per a una SPA React + MUI sobre Firebase Hosting.
// L'output va a `dist/` (per defecte de Vite) i Firebase Hosting servirà des d'allà.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // false per a producció: no exposem source maps al públic
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 3000, // mateix port que CRA per minimitzar fricció
    open: true,
  },
});
