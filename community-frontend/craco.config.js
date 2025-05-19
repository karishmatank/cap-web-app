const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = {
    webpack: {
        configure: (config) => {
            config.plugins.push(
                new GenerateSW({
                    swDest: 'sw-community.js',  // emits to build/sw-community.js
                    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,  // 3 MB
                    exclude: [/index\.html$/],
                    cleanupOutdatedCaches: true,
                    clientsClaim: false,  
                    skipWaiting: false,
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