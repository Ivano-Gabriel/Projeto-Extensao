type Armazenamento = {
  getItem:(chave:string)=>string|null
  setItem:(chave:string,valor:string)=>void
  removeItem:(chave:string)=>void
}

export function armazenamentoDaConta(store:Armazenamento|null|undefined,id:number):Armazenamento|null {
  if(!store||!Number.isSafeInteger(id)||id<=0)return null
  const prefixo=`extensao:conta:${id}:`
  return {
    getItem:chave=>store.getItem(prefixo+chave),
    setItem:(chave,valor)=>store.setItem(prefixo+chave,valor),
    removeItem:chave=>store.removeItem(prefixo+chave),
  }
}
