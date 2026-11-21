import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const fonte=(path)=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8')
test('mobile usa 4 destinos fixos e Mais, sem lista horizontal arrastável',()=>{
  const s=fonte('portal/NavegacaoDireta.tsx')
  const css=fonte('zelo-redesign-v2.css')
  for(const x of ["ALUNO:['inicio','atividades','prova','materiais']",
    "PROFESSOR:['inicio','turmas','atividades','materiais']",
    "DIRECAO:['inicio','turmas','pessoas','vinculos']"]){
    assert.ok(s.includes(x),x)
  }
  assert.match(s,/aria-label="Mais áreas"/)
  assert.match(s,/role="dialog"/)
  assert.match(s,/aria-expanded=\{mais\}/)
  assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/)
  assert.match(css,/\.zelo-nav-item\.zelo-nav-extra\{display:none!important\}/)
})

test('redesign de fotografias inclui home, biblioteca, estudos e professor',()=>{
  const css=fonte('zelo-redesign-v2.css')
  assert.match(css,/zelo-home-fotografia/)
  assert.match(css,/zelo-biblioteca-topo/)
  assert.match(css,/zelo-portal-professor/)
  assert.match(css,/images\.unsplash\.com/)
  assert.match(fonte('App.tsx'),/zelo-materia-foto/)
  assert.match(fonte('portal/Portal.tsx'),/zelo-hero-fotografia/)
})

test('o livro central virou capa e folhas articuladas ativadas pelo clique',()=>{
  const app=fonte('App.tsx'),css=fonte('zelo-redesign-v2.css')
  assert.match(app,/zelo-livro-esquerda/)
  assert.match(app,/zelo-livro-direita/)
  assert.match(app,/zelo-livro-pagina-3/)
  assert.match(css,/@keyframes zeloVirarPagina/)
  assert.match(css,/\.prime-menu-livro\.aberto \.zelo-livro-direita/)
  assert.match(css,/prefers-reduced-motion:reduce/)
})

test('professor e direção mantêm áreas e exibem ações principais antes de métricas',()=>{
  for(const path of ['portal/ProfessorPainel.tsx','portal/DirecaoPainel.tsx']){
    const s=fonte(path)
    assert.match(s,/NavegacaoDireta/)
    assert.match(s,/zelo-destaque-tarefa/)
    const p=s.indexOf('zelo-destaque-tarefa')
    const k=s.indexOf('portal-metricas',p)
    assert.ok(p>0&&k>p,path)
  }
})

test('aluno pode filtrar, ler e acessar simulado sem menu escondido',()=>{
  const s=fonte('portal/AlunoPainel.tsx')
  assert.match(s,/zelo-biblioteca-real/)
  assert.match(s,/materiaisFiltrados/)
  assert.match(s,/<details/)
  assert.match(s,/<summary/)
  assert.match(s,/setAba\('prova'\)/)
})

test('login desktop cabe em viewport comum sem mexer no layout mobile aprovado',()=>{
  const css=fonte('zelo-redesign-v2.css')
  assert.match(css,/@media\(min-width:760px\) and \(min-height:690px\)/)
  assert.match(css,/\.entrada-login\{height:100dvh/)
  assert.match(css,/@media\(min-width:760px\) and \(max-height:689px\)/)
})


test('regressão visual V3: login mobile mantém fotografia, acabamento azul e conteúdo visível',()=>{
  const css=fonte('zelo-redesign-v2.css')
  assert.match(css,/\.entrada-login \.prime-login-cena\{[\s\S]*?background-image:/)
  assert.match(css,/\.entrada-login \.prime-login \.portal-form \.botao-principal\{[\s\S]*?background:/)
  assert.match(css,/\.entrada-login \.prime-login-cena \.prime-login-arte\{[\s\S]*?transform:/)
})
test('regressão visual V3: livro abre no sentido direito e o menu permanece centralizado',()=>{
  const css=fonte('zelo-redesign-v2.css')
  assert.match(css,/@keyframes zeloPaginaParaDireita/)
  assert.match(css,/\.prime-menu-livro\.aberto \.zelo-livro-direita\{transform:rotateY\(158deg\)/)
  assert.match(css,/\.zelo-livro-cenario\{[\s\S]*?perspective:/)
})
test('regressão visual V3: revisão, progresso e desafios têm cabeçalhos claros e hierarquia',()=>{
  const css=fonte('zelo-redesign-v2.css')
  const app=fonte('App.tsx')
  const jogo=fonte('jogo/Jogo.tsx')
  assert.match(app,/className="pagina zelo-revisao-pagina"/)
  assert.match(css,/\.zelo-revisao-pagina \.quiz-topo/)
  assert.match(css,/\.zelo-progresso-pagina \.progresso-layout/)
  assert.match(jogo,/className="missao-card-foto"/)
  assert.match(jogo,/Casos para resolver/)
  assert.doesNotMatch(app,/materiais,\s*materiais/)
})
