const CACHE='pujo-ledger-v83';
const ASSETS=['./','./index.html','./styles.css?v=56','./app.js?v=91','./vendor/exceljs.min.js?v=4.4.0','./manifest.webmanifest','./icon-192.png','./icon-512.png','./resources/icon.png','./resources/durga-collection.jpg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./'))));});
