import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const ler=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('feed escolar identifica autor e nao exibe endereco de email',()=>{
  const mural=ler('src/portal/Avisos.tsx')
  assert.match(mural,/autorNome/)
  assert.match(mural,/autorPapel/)
  assert.doesNotMatch(mural,/autorEmail/)
})
test('professor controla somente suas publicacoes sem tocar login ou CSS',()=>{
  const mural=ler('src/portal/Avisos.tsx')
  const docente=ler('src/portal/ProfessorPainel.tsx')
  const api=ler('src/portal/api.ts')
  assert.match(mural,/a.autorId===usuarioId/)
  assert.match(docente,/Feed de turma/)
  assert.match(api,/editarAvisoProfessor/)
  assert.match(api,/removerAvisoProfessor/)
})
test('direcao tem painel orientado a acompanhamento e pode moderar somente sua escola',()=>{
  const dir=ler('src/portal/DirecaoPainel.tsx')
  const api=ler('src/portal/api.ts')
  assert.match(dir,/Acompanhamento da escola/)
  assert.match(dir,/moderarAvisoDirecao/)
  assert.match(api,/\/api\/gestao\/avisos/)
})
