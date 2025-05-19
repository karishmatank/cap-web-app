const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = {
    webpack: {
        configure: (config) => {
            config.plugins.push(
                new GenerateSW({
                    swDest: 'sw-applications.js',  // emits to build/sw-applications.js
                    cleanupOutdatedCaches: true,
                    clientsClaim: false,  
                    skipWaiting: false,
                    navigateFallback: '/applications/index.html',  // serve index.html for SPA routes if it can't find URL in cache or network
                    navigateFallbackDenylist: [
                        new RegExp('^/api/'),
                        new RegExp('\\.(?:png|jpe?g|svg|ico|css|js)$')
                    ],
                    runtimeCaching: [
                        {
                            // Images: cache-first
                            urlPattern: /\.(?:png|jpg|jpeg|svg|ico)$/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'images-cache',
                                expiration: { maxEntries: 60, maxAgeSeconds: 30*24*60*60 }
                            }
                        },
                        {
                            // API calls: network-first
                            urlPattern: new RegExp('/api/'),  // any request whose URL contains '/api/'
                            handler: 'NetworkFirst',
                            options: { cacheName: 'api-cache' }
                        },
                    ],
                })
            );
            return config;
        },
    },
};