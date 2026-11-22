import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const source=(path)=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8')

test('navegacao de aluno professor e direcao tem uma unica barra de cinco destinos no celular',()=>{
  const nav=source('portal/NavegacaoDireta.tsx')
  const css=source('portal-nav-v4.css')
  assert.match(nav,/zelo-nav-v4/)
  assert.match(nav,/createPortal/)
  assert.match(nav,/zelo-nav-texto-curto/)
  assert.match(css,/@media\s*\(max-width:899px\)/)
  assert.match(css,/@media\s*\(min-width:900px\)/)
  assert.match(css,/repeat\(5,minmax\(0,1fr\)\)/)
  assert.match(css,/\.zelo-nav-item\.zelo-nav-extra/)
  assert.match(css,/zelo-mais-v4/)
})

test('botao central do app de estudos tem icone simples e acessivel sem 3D defeituoso',()=>{
  const app=source('App.tsx')
  const css=source('portal-nav-v4.css')
  assert.match(app,/zelo-hub-v4-emblema/)
  assert.match(app,/zelo-hub-v4-nome/)
  assert.doesNotMatch(app,/zelo-livro-pagina|zelo-livro-overlay/)
  assert.doesNotMatch(app,/capitulosHub|paginaHub/)
  assert.match(css,/prefers-reduced-motion:reduce/)
  assert.match(css,/zelo-hub-v4-emblema/)
})

test('nav v4 tem modal acima da barra, fechamento por Escape e bloqueio de scroll',()=>{
  const nav=source('portal/NavegacaoDireta.tsx')
  const css=source('portal-nav-v4.css')
  assert.match(nav,/aria-modal="true"/)
  assert.match(nav,/event\.key==='Escape'/)
  assert.match(nav,/document\.body\.style\.overflow/)
  assert.match(css,/z-index:9999/)
  assert.match(css,/overscroll-behavior:contain/)
})

test('estilos aprovados de login e laboratorio nao sao modificados pela correcao do menu',()=>{
  const css=source('portal-nav-v4.css')
  assert.doesNotMatch(css,/\.entrada-login|\.prime-login-cena|\.escola-demo|\.escola-pagina/)
  assert.match(source('main.tsx'),/portal-nav-v4\.css/)
})
