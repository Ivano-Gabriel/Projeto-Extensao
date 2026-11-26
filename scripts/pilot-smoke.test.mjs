import test from 'node:test'
import assert from 'node:assert/strict'
import { verificarPiloto } from './pilot-smoke.mjs'

const resposta=(status,dados)=>new Response(JSON.stringify(dados),{
  status,headers:{'content-type':'application/json'}
})

test('espera a API acordar e confirma banco, CSRF e login protegido',async()=>{
  const acessos=[]
  let tentativasHealth=0
  const fakeFetch=async(url)=>{
    const caminho=new URL(url).pathname
    acessos.push(caminho)
    if(caminho==='/healthz'){
      tentativasHealth++
      return tentativasHealth===1?resposta(503,{status:'unavailable'}):resposta(200,{status:'ok'})
    }
    if(caminho==='/readyz')return resposta(200,{status:'ready'})
    if(caminho==='/api/csrf')return resposta(200,{token:'somente-teste'})
    if(caminho==='/api/me')return resposta(401,{erro:'login necessario'})
    throw new Error('rota desconhecida')
  }
  const resultado=await verificarPiloto({
    baseApi:'https://api.exemplo.test',baseSite:'https://escola.exemplo.test',
    buscar:fakeFetch,dormir:async()=>{},tentativas:3,intervaloMs:1,
  })
  assert.equal(resultado.tentativas,2)
  assert.deepEqual(resultado.verificacoes,['healthz','readyz','csrf','me protegido'])
  assert.deepEqual(acessos,['/healthz','/healthz','/readyz','/api/csrf','/api/me'])
})

test('nao aceita API online quando banco esta indisponivel',async()=>{
  const fakeFetch=async(url)=>{
    if(url.endsWith('/healthz'))return resposta(200,{status:'ok'})
    if(url.endsWith('/readyz'))return resposta(503,{status:'unavailable'})
    throw new Error('nao deveria consultar dados')
  }
  await assert.rejects(verificarPiloto({
    baseApi:'https://api.exemplo.test',baseSite:'https://escola.exemplo.test',
    buscar:fakeFetch,dormir:async()=>{},tentativas:2,intervaloMs:1,
  }),/readyz HTTP 503/)
})

test('falha quando login anonimo recebe acesso indevido ou csrf nao funciona',async()=>{
  const fakeFetch=async(url)=>{
    if(url.endsWith('/healthz'))return resposta(200,{status:'ok'})
    if(url.endsWith('/readyz'))return resposta(200,{status:'ready'})
    if(url.endsWith('/api/csrf'))return resposta(200,{token:'teste'})
    if(url.endsWith('/api/me'))return resposta(200,{id:1})
    throw new Error('rota inesperada')
  }
  await assert.rejects(verificarPiloto({
    baseApi:'https://api.exemplo.test',baseSite:'https://escola.exemplo.test',
    buscar:fakeFetch,dormir:async()=>{},tentativas:1,
  }),/me HTTP 200/)
})
