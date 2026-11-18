import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

test('Vercel mantém o proxy da API e proíbe cache de dados escolares',()=>{
  const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'))
  const rewrite=config.rewrites.find(item=>item.source==='/api/:path*')
  assert.equal(rewrite?.destination,'https://extensao-api-staging.onrender.com/api/:path*')
  const api=config.headers.find(item=>item.source==='/api/:path*')
  const headers=Object.fromEntries(api.headers.map(({key,value})=>[key.toLowerCase(),value]))
  assert.match(headers['cache-control'],/no-store/)
  assert.equal(headers['x-content-type-options'],'nosniff')
  const global=config.headers.find(item=>item.source==='/(.*)')
  assert.ok(global.headers.some(h=>h.key==='X-Frame-Options'&&h.value==='DENY'))
})
test('login continua de mesma origem, CSRF e sem armazenar tokens em localStorage',()=>{
  const source=readFileSync(new URL('../src/portal/api.ts',import.meta.url),'utf8')
  assert.match(source,/credentials:'same-origin'/)
  assert.match(source,/X-XSRF-TOKEN/)
  assert.doesNotMatch(source,/localStorage|sessionStorage/)
  const login=readFileSync(new URL('../src/portal/PortalLogin.tsx',import.meta.url),'utf8')
  assert.match(login,/Sou aluno/)
  assert.match(login,/Sou funcionário/)
  assert.match(login,/apiEscolar\.login\(email\.trim\(\),senha\)/)
})
