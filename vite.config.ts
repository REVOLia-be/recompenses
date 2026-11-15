/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Chemins relatifs : l'app fonctionne dans n'importe quel sous-dossier d'hébergement statique.
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
