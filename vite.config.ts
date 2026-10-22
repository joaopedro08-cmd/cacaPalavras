import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'inline',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Deduzi — jogo casual de palavras',
        short_name: 'Deduzi',
        description: 'Duas formas de descobrir uma palavra: deduzindo pelas cores ou arriscando letras.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f4ee',
        theme_color: '#f6f4ee',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,webmanifest}'],
        navigateFallback: 'index.html'
      }
    })
  ]
});
