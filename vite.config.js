import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuração mínima do Vite para um app React.
// Esse arquivo diz ao Vite que estamos usando React e nada mais.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
});
