import test from 'node:test'
import assert from 'node:assert/strict'
import { questaoDoDia, registrarRespostaDiaria, validarDesafiosDiarios } from '../src/desafio/regras.ts'
import { questoes } from '../src/dados/questoes.ts'
import { carregarEscola, estadoInicialEscola } from '../src/escola/estado.ts'

test('mesma data recebe mesma pergunta e datas diferentes rotacionam',()=>{
  const d1=questaoDoDia('2026-11-18')
  assert.ok(questoes.some(q=>q.id===d1.id))
  assert.equal(questaoDoDia('2026-11-18').id,d1.id)
  assert.notEqual(questaoDoDia('2026-11-19').id,d1.id)
})
test('registra uma unica resposta por dia, com validacao e limite de historico',()=>{
  const dia='2026-11-18'
  const q=questaoDoDia(dia)
  const r=registrarRespostaDiaria([],dia,q.id,1)
  assert.equal(r.length,1)
  assert.deepEqual(registrarRespostaDiaria(r,dia,q.id,0),r)
  assert.throws(()=>registrarRespostaDiaria([],dia,'q-inventada',0))
  assert.throws(()=>registrarRespostaDiaria([],dia,q.id,9))
  assert.throws(()=>registrarRespostaDiaria([],'2026-02-31',q.id,0))
})
test('estado local aceita formato antigo e limpa registros invalidos',()=>{
  const dia='2026-11-18'
  const q=questaoDoDia(dia)
  const r=carregarEscola({getItem:()=>JSON.stringify({...estadoInicialEscola(),
    desafiosDiarios:[{data:dia,questaoId:q.id,opcao:0},{data:dia,questaoId:q.id,opcao:1},
      {data:'2026-02-31',questaoId:'falso',opcao:5}]})})
  assert.equal(r.desafiosDiarios.length,1)
  assert.deepEqual(validarDesafiosDiarios(null),[])
  assert.deepEqual(carregarEscola(null).desafiosDiarios,[])
})
