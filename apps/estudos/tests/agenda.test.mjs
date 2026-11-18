import test from 'node:test'
import assert from 'node:assert/strict'
import { agendaDoDia, reagendarTarefa } from '../src/plano/regras.ts'

const t=(id,data,feito=false)=>({id,titulo:`Revisão ${id}`,materia:'Matemática',data,feito})

test('agenda destaca atrasadas, hoje e proximos 7 dias, sem misturar concluidas',()=>{
  const itens=[t('t-3','2026-11-21'),t('t-1','2026-11-17'),t('t-2','2026-11-18'),t('t-4','2026-11-27'),t('t-5','2026-11-16',true)]
  const r=agendaDoDia(itens,new Date(2026,10,18,12))
  assert.deepEqual(r.atrasadas.map(x=>x.id),['t-1'])
  assert.deepEqual(r.hoje.map(x=>x.id),['t-2'])
  assert.deepEqual(r.proximas.map(x=>x.id),['t-3'])
  assert.equal(itens.length,5)
})

test('agenda lida com meses e ano que viram e ordena sempre pela data',()=>{
  const r=agendaDoDia([t('t-3','2027-01-09'),t('t-1','2026-12-31'),t('t-2','2027-01-02')],
    new Date(2026,11,31,12))
  assert.deepEqual(r.hoje.map(x=>x.id),['t-1'])
  assert.deepEqual(r.proximas.map(x=>x.id),['t-2'])
})

test('reagendar valida a data e so altera uma tarefa pendente',()=>{
  const antes=[t('t-1','2026-11-16'),t('t-2','2026-11-18')]
  const depois=reagendarTarefa(antes,'t-1','2026-11-20')
  assert.equal(depois[0].data,'2026-11-20')
  assert.equal(antes[0].data,'2026-11-16')
  assert.equal(depois[1],antes[1])
  assert.throws(()=>reagendarTarefa(antes,'t-1','2026-02-31'))
  assert.throws(()=>reagendarTarefa(antes,'t-9','2026-11-20'))
  assert.throws(()=>reagendarTarefa([t('t-1','2026-11-18',true)],'t-1','2026-11-20'))
})
