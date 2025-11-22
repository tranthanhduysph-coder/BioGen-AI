import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This configuration tells Vite to exclude specific libraries from the final bundle.
// Instead, the application will use the CDN links defined in the importmap in index.html.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@google/genai',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'docx',
        'file-saver'
      ]
    }
  }
});