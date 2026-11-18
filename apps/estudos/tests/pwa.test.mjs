import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const root=new URL('../',import.meta.url)
test('manifest publica aplicativo standalone com icone relativo ao proprio dominio',()=>{
  const manifest=JSON.parse(readFileSync(new URL('public/manifest.webmanifest',root),'utf8'))
  assert.equal(manifest.display,'standalone')
  assert.equal(manifest.start_url,'/')
  assert.equal(manifest.scope,'/')
  assert.ok(manifest.icons.some(icon=>icon.src==='/app-icon.svg'))
  const svg=readFileSync(new URL('public/app-icon.svg',root),'utf8')
  assert.match(svg,/<svg /)
  const html=readFileSync(new URL('index.html',root),'utf8')
  assert.match(html,/rel="manifest"/)
})
