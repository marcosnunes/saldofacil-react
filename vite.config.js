import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import process from 'node:process'

export default defineConfig(() => {
  const isDesktopBuild = process.env.VITE_DESKTOP_BUILD === 'true';

  return {
    base: isDesktopBuild ? './' : '/',
    plugins: [
      react(),
      VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'Saldo Fácil',
        short_name: 'SaldoFácil',
        description: 'Gerencie suas finanças pessoais com facilidade',
        theme_color: '#1a7a4a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        categories: ['finance', 'productivity'],
        icons: [
          { src: 'icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: 'icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: 'icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: 'screenshot-wide.png', sizes: '1280x512', type: 'image/png', form_factor: 'wide' },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(.*\.)?firebaseio\.com\/.*$/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*$/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/securetoken\.googleapis\.com\/.*$/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/api\.bcb\.gov\.br\/.*$/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*$/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/api\.frankfurter\.app\/.*$/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('firebase/app') || id.includes('firebase/auth') || id.includes('firebase/database')) {
              return 'firebase';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
          }
        },
      }
    },
    worker: {
      format: 'es',
      plugins: () => [react()],
    },
    server: {
      headers: {
        'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com; worker-src 'self' blob:; connect-src 'self' https://firebase.googleapis.com https://firebaseappcheck.googleapis.com https://apis.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.google.com https://accounts.google.com https://*.firebaseio.com wss://*.firebaseio.com https://api.bcb.gov.br https://api.frankfurter.app"
      }
    }
  }
})