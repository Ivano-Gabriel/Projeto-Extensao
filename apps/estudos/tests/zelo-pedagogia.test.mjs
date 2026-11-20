import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const ler=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('formulario docente e area do aluno exibem prazo persistido',()=>{
  const prof=ler('src/portal/ProfessorPainel.tsx')
  const aluno=ler('src/portal/AlunoPainel.tsx')
  assert.match(prof,/prazoEntrega/)
  assert.match(prof,/type="date"/)
  assert.match(aluno,/prazoEntrega/)
  assert.match(aluno,/Prazo encerrado/)
  assert.match(ler('src/portal/api.ts'),/prazoEntrega/)
})
test('exportacao de desempenho usa endpoint restrito, cookie e download seguro',()=>{
  const painel=ler('src/portal/ProfessorPainel.tsx')
  const helper=ler('src/portal/RelatorioCsv.ts')
  assert.match(painel,/baixarRelatorio/)
  assert.match(helper,/credentials:'same-origin'/)
  assert.match(helper,/desempenho\.csv/)
  assert.match(helper,/Number\.isSafeInteger/)
})
