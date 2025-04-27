import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/wochenkocher/',
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hot-toast',
      '@supabase/auth-ui-react',
      'react-colorful',
      'date-fns',
      '@supabase/auth-ui-shared'
    ]
  }
});