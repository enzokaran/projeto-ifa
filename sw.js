const CACHE_NAME = "vai-imarui-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/config.js",
  "./js/utils.js",
  "./js/components.js",
  "./js/views.js",
  "./js/views-imarui.js",
  "./imarui.json",
  "./js/router.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // dados: network-first, cai para cache se estiver offline
  if(url.pathname.endsWith("data.json") || url.pathname.endsWith("imarui.json")){
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // app shell e demais recursos same-origin: usa o cache e atualiza em segundo plano
  // (assim edições nos arquivos aparecem na visita seguinte, sem precisar trocar a versão do cache)
  if(url.origin === location.origin){
    event.respondWith(
      caches.match(event.request).then(cached => {
        const rede = fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        }).catch(() => cached);
        return cached || rede;
      })
    );
  }
});
