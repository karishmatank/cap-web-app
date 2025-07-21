// importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// /* eslint-disable no-restricted-globals */

// // Load the workbox runtime
// importScripts(
//     'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js'
// );

// // Import each SPAs generated worker
// importScripts('/sw-community.js');
// importScripts('/sw-chat.js');
// importScripts('/sw-applications.js');

// // Add global navigation handler or offline fallback
// const { registerRoute } = workbox.routing;
// const { NetworkFirst } = workbox.strategies;

// // Network-first for server-rendered HTML (Django pages)
// registerRoute(
//     ({ request }) => request.mode == 'navigate',
//     new NetworkFirst({ cacheName: 'pages', networkTimeoutSeconds: 3 })
// );

// // To add offline page

// // Immediate update lines
// self.skipWaiting();
// self.clients.claim();