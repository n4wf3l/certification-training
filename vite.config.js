import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            manifest: {
                name: 'CertifLoop',
                short_name: 'CertifLoop',
                description: "Entrainement adaptatif aux certifications IT. Streaks, correction IA, examens blancs, revision offline.",
                theme_color: '#12ccb0',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                lang: 'fr',
                categories: ['education', 'productivity'],
                icons: [
                    {
                        src: '/pwa-icon-192.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-icon-512.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts',
                            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /\/storage\/logos\/.*/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'cert-logos',
                            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
                        },
                    },
                    {
                        // Pages HTML : NetworkFirst avec fallback offline (3s timeout)
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages',
                            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
                            networkTimeoutSeconds: 3,
                        },
                    },
                ],
                navigateFallback: '/offline',
                navigateFallbackDenylist: [/^\/api\//, /^\/admin\//, /^\/exam\/[0-9]+\/submit/, /^\/storage\//, /^\/certificate\/.*\/pdf/],
            },
            devOptions: {
                enabled: false, // desactive en dev pour eviter les caches pendant HMR
            },
        }),
    ],
});
