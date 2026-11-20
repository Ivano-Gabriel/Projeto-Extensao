const PREFIX = 'zelo-app-'
const CACHE = PREFIX + 'v4'

async function guardarApp() {
  const cache = await caches.open(CACHE)
  const inicio = self.registration.scope
  const htmlUrl = new URL('index.html',inicio).href
  const resposta = await fetch(inicio,{cache:'no-store'})
  if (!resposta.ok) throw new Error('Sem resposta para pagina inicial')
  const html = await resposta.clone().text()
  const ativos = Array.from(html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|svg)(?:\?[^"]*)?)"/g),(x)=>x[1])
    .map((caminho)=>new URL(caminho,inicio))
    .filter((url)=>url.origin === self.location.origin && url.href.startsWith(inicio))
    .map((url)=>url.href)
  await cache.addAll([inicio,htmlUrl,new URL('manifest.webmanifest',inicio).href,new URL('app-icon.svg',inicio).href,new URL('zelo-icon-192.png',inicio).href,new URL('zelo-wordmark.svg',inicio).href,...ativos])
  return true
}

self.addEventListener('install',(evento)=>{
  evento.waitUntil((async()=>{
    await guardarApp()
    await self.skipWaiting()
  })())
})
self.addEventListener('activate',(evento)=>{
  evento.waitUntil((async()=>{
    const nomes = await caches.keys()
    await Promise.all(nomes.filter((nome)=>(nome.startsWith(PREFIX)||nome.startsWith('extensao-estudos-'))&&nome!==CACHE)
      .map((nome)=>caches.delete(nome)))
    await self.clients.claim()
  })())
})
self.addEventListener('message',(evento)=>{
  if (evento.data?.tipo !== 'CACHE_APP') return
  evento.waitUntil(guardarApp().then(()=>evento.ports[0]?.postMessage({ok:true}))
    .catch(()=>evento.ports[0]?.postMessage({ok:false})))
})
self.addEventListener('fetch',(evento)=>{
  const pedido = evento.request
  const destino = new URL(pedido.url)
  if (destino.pathname === '/api' || destino.pathname.startsWith('/api/')) return
  if (pedido.method !== 'GET' || destino.origin !== self.location.origin ||
    !destino.href.startsWith(self.registration.scope)) return
  const recursoEstatico = /\.(?:js|css|svg|webmanifest|png|webp|ico|woff2?)$/i.test(destino.pathname)
  if (pedido.mode !== 'navigate' && !recursoEstatico) return
  if (pedido.mode === 'navigate') {
    evento.respondWith(fetch(pedido).then(async resposta=>{
      if (resposta.ok) (await caches.open(CACHE)).put(pedido,resposta.clone())
      return resposta
    }).catch(async()=> (await caches.match(pedido)) || (await caches.match(self.registration.scope)) ||
      Response.error()))
    return
  }
  evento.respondWith(caches.match(pedido).then(async salva=>{
    if (salva) return salva
    const resposta = await fetch(pedido)
    if (resposta.ok) (await caches.open(CACHE)).put(pedido,resposta.clone())
    return resposta
  }))
})
