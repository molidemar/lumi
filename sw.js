/* Lumi online: guarda la app para abrirla rápido y sin conexión. Las cuentas y las voces van por la red. */
const C='lumi-web-v14';
const CORE=['./','lib/react.production.min.js','lib/react-dom.production.min.js','lib/htm.umd.js','lib/jspdf.umd.min.js','iq.js','lib/supabase.js','icon.png','manifest.webmanifest'];
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{}))))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url);
  if(e.request.method!=='GET' || u.origin!==location.origin || u.pathname.includes('/models/')) return;
  const fresh = u.pathname.endsWith('/') || u.pathname.endsWith('.html') || u.pathname.endsWith('.json') || u.pathname.endsWith('.webmanifest');
  if(fresh){ e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; }).catch(()=>caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); } return r; }))); });
