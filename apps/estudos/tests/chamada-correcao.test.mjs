import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {apiEscolar,requisitar} from '../src/portal/api.ts'

const tela=()=>readFileSync(new URL('../src/portal/ProfessorPainel.tsx',import.meta.url),'utf8')

test('API expõe correção de presença e usa PUT com CSRF da mesma origem',async()=>{
  assert.equal(typeof apiEscolar.corrigirPresenca,'function')
  const chamadas=[]
  const req=async(url,opts)=>{
    chamadas.push({url,opts})
    return url==='/api/csrf'
      ?{ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({token:'csrf-qa'})}
      :{ok:true,status:204,headers:{get:()=> null},json:async()=>null}
  }
  await requisitar('PUT','/api/professor/aulas/9/presencas',{alunoId:3,presente:true},req)
  assert.deepEqual(chamadas.map(c=>c.url),['/api/csrf','/api/professor/aulas/9/presencas'])
  assert.equal(chamadas[1].opts.method,'PUT')
  assert.equal(chamadas[1].opts.headers['X-XSRF-TOKEN'],'csrf-qa')
  assert.equal(chamadas[1].opts.credentials,'same-origin')
})

test('chamada mostra correção controlada e permite cancelar sem alterar API',()=>{
  assert.match(tela(),/Confirmar correção/)
  assert.match(tela(),/Cancelar correção/)
  assert.match(tela(),/corrigirPresenca/)
  assert.match(tela(),/Object\.hasOwn\(marcadas,chave\)/)
})
