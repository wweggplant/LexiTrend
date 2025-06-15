import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import type { Plugin } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    crx({ manifest }),
    mode === 'production' && visualizer({
      open: true,
      filename: 'dist/stats.html', 
    }) as Plugin,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'popup.html'),
        sidepanel: path.resolve(__dirname, 'sidepanel.html'),
      },
      output: {
        chunkFileNames: 'assets/chunk-[hash].js',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})) 