// Minimal shell cache: network-first so updates are never blocked; only used when offline.
const V='nfl-v1',SHELL=['./','./index.html','./manifest.json','./apple-touch-icon.png','./icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
  if(r.mode==='navigate'||SHELL.some(p=>u.pathname.endsWith(p.slice(1))&&p!=='./')){e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{if(res.ok&&!u.search){const cp=res.clone();caches.open(V).then(c=>c.put(r.mode==='navigate'?'./index.html':r,cp))}return res}).catch(()=>caches.match(r.mode==='navigate'?'./index.html':r).then(m=>m||caches.match('./'))))}});
