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
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/data\.etabus\.gov\.hk\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'kmb-api-cache',
                  networkTimeoutSeconds: 10,
                  expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 60 * 5, // 5 minutes
                    purgeOnQuotaError: true,
                  },

                },
              },
              {
                urlPattern: /^https:\/\/esm\.sh\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'esm-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                    purgeOnQuotaError: true,
                  },
                },
              },
              {
                urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'map-tiles-cache',
                  expiration: {
                    maxEntries: 500,
                    maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                    purgeOnQuotaError: true,
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'google-fonts-stylesheets',
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-webfonts',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                },
              },
              {
                urlPattern: /^https:\/\/ai-proxy\.chatwise\.app\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'ai-proxy-cache',
                  networkTimeoutSeconds: 30,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 10, // 10 minutes
                    purgeOnQuotaError: true,
                  },
                },
              },
            ],
          },
          includeAssets: ['icon.png', 'browserconfig.xml'],
          manifest: {
            name: 'HK Transit Hub - Smart Journey Planner',
            short_name: 'HK Transit',
            description: 'Intelligent journey planner for Hong Kong\'s KMB and MTR networks with real-time ETAs and AI trip planning',
            theme_color: '#00f5d4',
            background_color: '#111827',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            lang: 'en-HK',
            categories: ['travel', 'navigation', 'utilities'],

            icons: [
              {
                src: 'icon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: 'icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ],
            shortcuts: [
              {
                name: 'Trip Planner',
                short_name: 'Plan Trip',
                description: 'Plan your journey with AI assistance',
                url: '/?tab=planner',
                icons: [{ src: 'icon.png', sizes: '192x192' }]
              },
              {
                name: 'Bus Routes',
                short_name: 'Buses',
                description: 'Browse KMB bus routes',
                url: '/?tab=kmb',
                icons: [{ src: 'icon.png', sizes: '192x192' }]
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      build: {
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              leaflet: ['leaflet', 'react-leaflet'],
              utils: ['lodash.debounce', 'lodash.sortby']
            },
          },
        },
        chunkSizeWarningLimit: 1000,
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
