import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiTarget =
      env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ||
      'https://csi-project-be.vercel.app';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/files': {
            target: apiTarget,
            changeOrigin: true,
            secure: true,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['html2pdf.js'],
      },
    };
});
