// キャッシュするのは一覧にある公開ファイルだけ。すべて暗号化済みか、データを含まない。
const CACHE = "dashboard-v1";
const FILES = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const ALLOWED = new Set(FILES.map((f) => new URL(f, self.registration.scope).pathname));
ALLOWED.add(new URL("index.html", self.registration.scope).pathname);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !ALLOWED.has(url.pathname)) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url.pathname.endsWith("index.html") ? new URL("./", self.registration.scope).href : url.href, copy));
        }
        return res;
      })
      .catch(() => caches.match(url.pathname.endsWith("index.html") ? new URL("./", self.registration.scope).href : url.href))
  );
});
