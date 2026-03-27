const CACHE = "velas-v1";
const FILES = [
  "/",
  "/index.html",
  "/checkout.html",
  "/success.html",
  "/css/styles.css",
  "/js/app.js",
  "/manifest.json",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", e => {
  // No cachear peticiones a Stripe ni al backend
  if (e.request.url.includes('stripe.com') || e.request.url.includes('localhost:4242')) {
    return fetch(e.request);
  }
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});