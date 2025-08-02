import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/data\.etabus\.gov\.hk\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'kmb-api-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 5, // 5 minutes
                  },
                },
              },
              {
                urlPattern: /^https:\/\/esm\.sh\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'esm-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                  },
                },
              },
            ],
          },
          includeAssets: ['icon.png'],
          manifest: {
            name: 'HK Transit Hub',
            short_name: 'HK Transit',
            description: 'Smart journey planner for Hong Kong\'s KMB and MTR networks',
            theme_color: '#00f5d4',
            background_color: '#f9fafb',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: 'icon.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'icon.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          '/api/kmb': {
            target: 'https://data.etabus.gov.hk/v1/transport/kmb',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/kmb/, ''),
            secure: true,
            headers: {
              'User-Agent': 'HK-Transit-Hub/1.0'
            }
          }
        }
      }
    };
});
