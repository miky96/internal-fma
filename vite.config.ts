import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuració Vite per a una SPA React + Mantine sobre Firebase Hosting.
// L'output va a `dist/` (per defecte de Vite) i Firebase Hosting servirà des d'allà.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // false per a producció: no exposem source maps al públic
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vendor chunks: separem les dependències grans del codi d'app perquè
        // un canvi al codi propi no invalidi el cache del navegador d'aquestes
        // dependències. Combinat amb els headers immutables del firebase.json,
        // els usuaris recurrents només baixen el chunk de l'app.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('@mantine') || id.includes('@tabler')) return 'vendor-mantine';
          if (id.includes('react-router')) return 'vendor-router';
          if (
            id.includes('node_modules/react/')
            || id.includes('node_modules/react-dom/')
            || id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 3000, // mateix port que CRA per minimitzar fricció
    open: true,
  },
});
