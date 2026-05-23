import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite Configuration for 3D Sailing Adventure.
 * Optimized for WebGL, heavy asset loading (GLTF/KTX2), and WASM decoders.
 */
export default defineConfig({
  plugins: [
    react(),
    // Automatically splits the vendor chunk to optimize initial load time,
    // preventing the main app bundle from blocking the 3D canvas rendering.
    splitVendorChunkPlugin(),
  ],
  resolve: {
    alias: {
      // Enables clean imports like: import { useShipStore } from '@/stores/shipStore'
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: [
    '**/*.gltf',
    '**/*.glb',
    '**/*.hdr',
    '**/*.ktx2',
    '**/*.basis',
    '**/*.draco.wasm',
  ],
  build: {
    target: 'es2020', // Ensure BigInt and modern JS features are supported for physics math
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk Three.js separately to allow browser caching across deployments
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          state: ['zustand'],
        },
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle heavy WASM decoders to avoid stuttering on first asset load
    include: ['three'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  server: {
    open: true,
    // Required for loading local .ktx2 and .wasm files during development
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});