import test from 'node:test'
import assert from 'node:assert/strict'
import { carregarEscola, salvarEscola, CHAVE_ESCOLA, estadoInicialEscola } from '../src/escola/estado.ts'

test('nao quebra com dados locais ilegíveis', () => {
  assert.deepEqual(carregarEscola({getItem:()=>'{ruim'}), estadoInicialEscola())
  assert.deepEqual(carregarEscola({getItem:()=>{throw Error('bloqueado')}}), estadoInicialEscola())
})

test('filtra entradas invalidas, feedback exagerado e valores desconhecidos', () => {
  const dado = {tema:'escuro', diasEstudo:['2026-11-06','nao', '2026-11-06'],
    previsao:{data:'2026-11-09',valor:'invadido'},
    lidos:['post-1','teste'], feedback:[{id:'1',categoria:'Sugestão',texto:'boa',data:'2026-11-07'}]}
  const estado = carregarEscola({getItem:()=>JSON.stringify(dado)})
  assert.equal(estado.tema, 'escuro')
  assert.deepEqual(estado.diasEstudo, ['2026-11-06'])
  assert.equal(estado.previsao, null)
  assert.deepEqual(estado.lidos, ['post-1'])
  assert.equal(estado.feedback.length, 1)
})

test('salvamento permanece apenas no navegador', () => {
  const mapa = new Map()
  const store = {getItem:x=>mapa.get(x)??null, setItem:(x,v)=>mapa.set(x,v)}
  const estado = {...estadoInicialEscola(), tema:'escuro'}
  assert.equal(salvarEscola(store,estado),true)
  assert.equal(carregarEscola(store).tema,'escuro')
  assert.ok(mapa.has(CHAVE_ESCOLA))
})
