// So funciona no app publicado/preview, onde o service worker foi registrado.
export async function baixarAplicativo(): Promise<void> {
  if (!('serviceWorker' in navigator)) throw new Error('Navegador sem Service Worker')
  const registro = await navigator.serviceWorker.ready
  if (!registro.active) throw new Error('Service Worker ainda nao ativo')
  await new Promise<void>((resolve, reject) => {
    const canal = new MessageChannel()
    const limite = window.setTimeout(() => { canal.port1.close(); reject(new Error('Timeout do cache offline')) }, 20000)
    canal.port1.onmessage = (evento: MessageEvent<{ok:boolean}>) => {
      window.clearTimeout(limite)
      canal.port1.close()
      evento.data?.ok ? resolve() : reject(new Error('Falha ao preparar offline'))
    }
    registro.active!.postMessage({tipo:'CACHE_APP'},[canal.port2])
  })
}
