import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    plugins: [react()],
    build: {
      target: 'esnext',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        }
      }
    },
    define: {
      ...(isProd ? {
        'console.log': '(() => {})',
        'console.info': '(() => {})',
        'console.warn': '(() => {})',
        'console.debug': '(() => {})',
      } : {})
    }
  };
});
