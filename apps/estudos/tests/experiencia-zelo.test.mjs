import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const ler=caminho=>readFileSync(new URL('../src/'+caminho,import.meta.url),'utf8')

test('professor e direção usam navegação semântica em layout com seção ativa',()=>{
  const professor=ler('portal/ProfessorPainel.tsx')
  const direcao=ler('portal/DirecaoPainel.tsx')
  const nav=ler('portal/NavegacaoPortal.tsx')
  assert.match(professor,/NavegacaoPortal/)
  assert.match(direcao,/NavegacaoPortal/)
  assert.match(professor,/portal-ux-workspace/)
  assert.match(direcao,/portal-ux-workspace/)
  assert.match(nav,/role="tablist"/)
  assert.match(nav,/role="tab"/)
  assert.match(nav,/aria-selected=\{atual===/)
  assert.match(nav,/Navegação do professor|Navegação da direção/)
})

test('ação principal aparece antes das métricas na visão do professor',()=>{
  const src=ler('portal/ProfessorPainel.tsx')
  const a=src.indexOf('Sua próxima ação')
  const b=src.indexOf('portal-metricas',src.indexOf("aba==='inicio'"))
  assert.ok(a>0&&b>a, 'Sua próxima ação deve vir antes dos indicadores')
})

test('leitura dos materiais do aluno é expansível e pesquisável',()=>{
  const src=ler('portal/AlunoPainel.tsx')
  assert.match(src,/buscaMaterial/)
  assert.match(src,/materiaisFiltrados/)
  assert.match(src,/<details/)
  assert.match(src,/<summary/)
})

test('login desktop cabe no viewport e mantém rolagem em alturas reduzidas',()=>{
  const src=ler('experiencia-zelo.css')
  assert.match(src,/\.entrada-login[\s\S]*?height:\s*100dvh/)
  assert.match(src,/max-height:\s*calc\(100dvh/)
  assert.match(src,/@media[\s\S]*?max-height:\s*650px/)
})

test('livrinho central tem folhas animadas e respeita redução de movimento',()=>{
  const app=ler('App.tsx')
  const css=ler('experiencia-zelo.css')
  assert.match(app,/prime-livro-folha/)
  assert.match(css,/@keyframes zeloFolhear/)
  assert.match(css,/prefers-reduced-motion:\s*reduce/)
})

test('materiais e revisão têm identidade visual e leitura prioritária',()=>{
  const app=ler('App.tsx')
  const css=ler('experiencia-zelo.css')
  assert.match(app,/ux-pagina-materiais/)
  assert.match(app,/ux-pagina-revisao/)
  assert.match(css,/ux-pagina-materiais/)
  assert.match(css,/ux-pagina-revisao/)
})
