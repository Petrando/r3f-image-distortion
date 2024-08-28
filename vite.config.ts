import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'r3f-image-distortion',
        short_name: 'AppName',
        description: 'Your app description',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-icon.png',
            sizes: '497x502',
            type: 'image/png',
          },          
        ],
      },
    }),
  ],
})
