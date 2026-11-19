import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/prime-v2.css',import.meta.url),'utf8')
const login=readFileSync(new URL('../src/portal/PortalLogin.tsx',import.meta.url),'utf8')
const main=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8')

test('inicio do aluno nao repete blocos que geravam rolagem excessiva',()=>{
  const inicio=app.slice(app.indexOf('function Inicio('),app.indexOf('function MateriaisPagina('))
  assert.match(inicio,/prime-home-hero/)
  assert.match(inicio,/<DesafioDia /)
  assert.match(inicio,/prime-progress-home/)
  assert.match(inicio,/prime-quiz-chamada/)
  assert.doesNotMatch(inicio,/PROPOSTA 03|MEU DIA|SEU PONTO DE PARTIDA|PRA COMEÇAR AGORA|UM PLANO PRA REVISAR/i)
  assert.doesNotMatch(inicio,/escola-chamada-inicio|arcade-chamada|agenda-hoje/)
})

test('menu do livro oferece acesso a todas as funcoes de estudo',()=>{
  assert.match(app,/prime-menu-livro/)
  assert.match(app,/aria-expanded=\{menuAberto\}/)
  assert.match(app,/prime-menu-painel/)
  assert.match(app,/menu\.map\(/)
  assert.match(app,/navegar\('plano'\)/)
  assert.match(app,/navegar\('jogo'\)/)
  assert.match(app,/navegar\('portal'\)/)
  assert.match(app,/prime-config-painel/)
})

test('layout mobile elimina os filtros horizontais e acomoda cartoes em uma coluna',()=>{
  assert.match(css,/\.filtros\{display:grid;grid-template-columns:/)
  assert.match(css,/\.escola-seletores\{display:grid;grid-template-columns:/)
  assert.match(css,/\.portal-mobile>\.portal-abas\{display:grid;grid-template-columns:/)
  assert.match(css,/\.prime-menu-grid\{display:grid;grid-template-columns:/)
  assert.match(css,/\.grade-materiais\{grid-template-columns:1fr/)
  assert.match(css,/@media\(max-width:899px\)/)
})

test('login ganhou cenario ilustrado e suporta movimento reduzido',()=>{
  assert.match(login,/prime-login-cena/)
  assert.match(login,/prime-login-folha/)
  assert.match(login,/Bem-vindo ao Extensão/)
  assert.match(css,/prefers-reduced-motion:reduce/)
  assert.match(css,/\.entrada-extensao>\.portal-login\.prime-login\{display:grid/)
  assert.match(main,/prime-v2\.css/)
})

test('progresso nao ensina incorretamente que contas nao existem',()=>{
  assert.doesNotMatch(app,/Este aplicativo não tem contas/)
  assert.doesNotMatch(app,/Usando um computador compartilhado\?/)
  assert.match(app,/Apagar dados locais de estudo/)
  assert.match(app,/Reiniciar demonstração/)
})
