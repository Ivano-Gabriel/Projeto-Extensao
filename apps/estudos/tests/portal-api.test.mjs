import test from 'node:test'
import assert from 'node:assert/strict'
import {requisitar} from '../src/portal/api.ts'

function resposta(valor,status=200,tipo='application/json'){
  return {ok:status>=200&&status<300,status,headers:{get:()=>tipo},json:async()=>valor}
}
test('GET real usa mesma origem, cookies e nunca manda senha no armazenamento',async()=>{
  const chamadas=[]
  const req=async(url,opts)=>{chamadas.push({url,opts});return resposta({id:1,papel:'ALUNO'})}
  const user=await requisitar('GET','/api/me',undefined,req)
  assert.equal(user.id,1)
  assert.deepEqual(chamadas.map(x=>x.url),['/api/me'])
  assert.equal(chamadas[0].opts.credentials,'same-origin')
  assert.equal(chamadas[0].opts.cache,'no-store')
  assert.equal(chamadas[0].opts.method,'GET')
})
test('POST pede novo CSRF antes de login e publica com token e cookies',async()=>{
  const calls=[]
  const req=async(url,opts)=>{
    calls.push({url,opts})
    return url==='/api/csrf'?resposta({token:'token-teste'}):resposta({id:2,papel:'PROFESSOR'})
  }
  const out=await requisitar('POST','/api/login',{email:'docente@exemplo.com',senha:'segredo'},req)
  assert.equal(out.papel,'PROFESSOR')
  assert.deepEqual(calls.map(x=>x.url),['/api/csrf','/api/login'])
  assert.equal(calls[1].opts.headers['X-XSRF-TOKEN'],'token-teste')
  assert.equal(calls[1].opts.credentials,'same-origin')
  assert.equal(JSON.parse(calls[1].opts.body).email,'docente@exemplo.com')
})
test('nao aceita URL externa e nao manda POST sem csrf valido',async()=>{
  await assert.rejects(()=>requisitar('GET','https://site-malicioso.com/api/me'),/inválido/)
  let n=0
  const transport=async()=>{n++;return resposta({token:''})}
  await assert.rejects(()=>requisitar('POST','/api/login',{email:'teste'},transport),/indisponível/)
  assert.equal(n,1)
})
test('falha fechada em HTML inesperado, 403 e sessao expirada',async()=>{
  await assert.rejects(()=>requisitar('GET','/api/me',undefined,async()=>resposta('<html>',200,'text/html')),/não está disponível/)
  await assert.rejects(()=>requisitar('GET','/api/me',undefined,async()=>resposta(null,401)),/login/)
  await assert.rejects(()=>requisitar('GET','/api/portal/turmas',undefined,async()=>resposta(null,403)),/permissão/)
})
