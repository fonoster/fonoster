import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Add the JSX runtime to all files
      jsxRuntime: 'automatic',
      // Enable Fast Refresh
      fastRefresh: true,
      // Add Emotion's babel plugin for styled components
      babel: {
        plugins: [
          [
            '@emotion/babel-plugin',
            {
              // Enable source maps for styled components
              sourceMap: true,
              // Enable auto labels for better debugging
              autoLabel: 'always',
              // Use the filename as the label
              labelFormat: '[filename]--[local]',
            },
          ],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Add any path aliases here if needed
      '@': path.resolve(__dirname, './src'),
      '@stories': path.resolve(__dirname, './stories'),
    },
  },
  // Configure optimizations for the build
  build: {
    sourcemap: true,
    // Improve chunk size
    chunkSizeWarningLimit: 1000,
  },
  // Configure server options
  server: {
    port: 3000,
    // Enable HMR
    hmr: true,
  },
});
