// Service worker de Fotos Vial: solo recibe las fotos compartidas desde WhatsApp.
// No intercepta nada más (los otros módulos del repo no se ven afectados).
const CACHE = 'fotosvial-compartido';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'POST' || !req.url.includes('fotosvial.html')) return;
  event.respondWith((async () => {
    const fd = await req.formData();
    const fotos = fd.getAll('fotos').filter(f => f && f.size);
    const texto = [fd.get('title'), fd.get('text')].filter(Boolean).join(' ').trim();
    const cache = await caches.open(CACHE);
    for (const k of await cache.keys()) await cache.delete(k);
    for (let i = 0; i < fotos.length; i++) {
      await cache.put('compartido/foto-' + i,
        new Response(fotos[i], { headers: { 'Content-Type': fotos[i].type || 'image/jpeg' } }));
    }
    await cache.put('compartido/meta',
      new Response(JSON.stringify({ cantidad: fotos.length, texto })));
    return Response.redirect('./fotosvial.html?compartido=1', 303);
  })());
});
