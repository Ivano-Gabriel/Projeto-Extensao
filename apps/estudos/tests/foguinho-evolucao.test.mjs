import test from 'node:test'
import assert from 'node:assert/strict'
import {resumoFoguinho,calendarioFoguinho} from '../src/escola/foguinho.ts'

test('sequencia atual considera ontem, e recorde é historico',()=>{
  const hoje=new Date(2026,10,20,12)
  const historico=['2026-11-14','2026-11-15','2026-11-16','2026-11-18','2026-11-19']
  const r=resumoFoguinho(historico,hoje)
  assert.equal(r.sequencia,2)
  assert.equal(r.recorde,3)
  assert.equal(r.diasTotais,5)
  assert.equal(r.mesAtual,5)
  assert.equal(r.proximaMeta,3)
  assert.equal(r.ultimaAtividade,'2026-11-19')
})
test('calendario mostra 5 semanas reais sem inventar dias ativos',()=>{
  const hoje=new Date(2026,10,20,12)
  const dias=calendarioFoguinho(['2026-11-20','2026-11-19','2026-10-25'],hoje)
  assert.equal(dias.length,35)
  assert.equal(dias.filter(x=>x.estudado).length,3)
  assert.equal(dias.filter(x=>x.hoje).length,1)
  assert.ok(dias.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.data)))
  assert.equal(dias.at(-1).data,'2026-11-22')
})
test('ignora registros invalidos, duplicados ou futuros sem inflar conquistas',()=>{
  const r=resumoFoguinho(['2026-11-20','2026-11-20','2026-02-31','2026-11-22','foo'],new Date(2026,10,20,12))
  assert.equal(r.sequencia,1)
  assert.equal(r.diasTotais,1)
  assert.equal(r.recorde,1)
})
