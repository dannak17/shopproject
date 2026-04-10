const CACHE_NAME = 'codecraft-merch-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('stripe.com') ||
      event.request.url.includes('https://shopproject-zpv1.onrender.com')) {
    return fetch(event.request);
  }
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});