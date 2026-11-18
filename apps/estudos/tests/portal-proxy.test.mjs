import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'))

test('proxy apenas de API usa mesmo dominio e encaminha para servidor escolar',()=>{
  assert.deepEqual(config.rewrites,[{
    source:'/api/:path*',
    destination:'https://extensao-api-staging.onrender.com/api/:path*',
  }])
})

test('portal escolar nao persiste tokens ou senhas no armazenamento local',()=>{
  const src=readFileSync(new URL('../src/portal/api.ts',import.meta.url),'utf8')
  assert.doesNotMatch(src,/localStorage|sessionStorage/)
  assert.match(src,/credentials:'same-origin'/)
  assert.match(src,/X-XSRF-TOKEN/)
})
