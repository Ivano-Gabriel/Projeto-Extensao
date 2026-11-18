import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

function registrar(){
  const listeners={}
  const self={
    location:{origin:'https://estudos.test'},
    registration:{scope:'https://estudos.test/'},
    clients:{claim:async()=>{}},
    addEventListener:(tipo,callback)=>{listeners[tipo]=callback},
  }
  runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),
    {self,URL,caches:{match:async()=>null,open:async()=>({put:async()=>{}})},fetch:async()=>({ok:true,clone(){return this}}),Response:{error:()=>({})}})
  return listeners
}
test('nunca intercepta ou armazena respostas de API, mesmo se navegador abrir a URL diretamente',()=>{
  const listeners=registrar()
  for(const path of ['/api/me','/api/csrf','/api/portal/atividades','/api/portal/atividades/5','/api/login']){
    let interceptou=false
    listeners.fetch({request:{method:'GET',url:'https://estudos.test'+path,mode:'navigate'},
      respondWith:()=>{interceptou=true}})
    assert.equal(interceptou,false,path)
  }
})
test('páginas normais ainda podem usar o cache offline',()=>{
  const listeners=registrar()
  let interceptou=false
  listeners.fetch({request:{method:'GET',url:'https://estudos.test/',mode:'navigate'},
    respondWith:()=>{interceptou=true}})
  assert.equal(interceptou,true)
})
