import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  base: '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ai': path.resolve(__dirname, './src/ai'),
      '@data': path.resolve(__dirname, './src/data'),
      '@prompts': path.resolve(__dirname, './src/prompts'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',

    rollupOptions: {
      output: {
        manualChunks: {
          'ai': ['@google/genai']
        }
      }
    },

    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },

  server: {
    port: 3002,
    host: true,
    open: true,
    cors: true
  },

  preview: {
    port: 4002
  }
});