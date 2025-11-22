import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Inject environment variables safely
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY || ""),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN || ""),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID || ""),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET || ""),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID || ""),
      'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID || "")
    },
    build: {
      rollupOptions: {
        // CRITICAL: This tells Vite "Do not look for these files in node_modules, they are in index.html"
        external: [
          'react',
          'react-dom',
          'react-dom/client',
          'react/jsx-runtime',
          '@google/genai',
          'firebase/app',
          'firebase/auth',
          'firebase/firestore',
          'docx',
          'file-saver'
        ]
      }
    }
  };
});