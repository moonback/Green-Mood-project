import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      // Force a single React instance — prevents "Invalid hook call" when motion/react
      // is pre-bundled with a separate CJS React copy alongside the ESM one used by react-dom.
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      // Pre-bundle React as ESM so all packages share the exact same instance.
      include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
