const CACHE = "trendingrepos-v1";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.json", "./icon.svg"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("api.github.com")) return; // always network
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
