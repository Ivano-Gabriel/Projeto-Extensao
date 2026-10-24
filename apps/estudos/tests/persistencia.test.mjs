import assert from 'node:assert/strict'
import test from 'node:test'
import { materiais } from '../src/dados/materiais.ts'
import { questoes } from '../src/dados/questoes.ts'
import { carregarEstado, salvarEstado, CHAVE_ESTUDOS } from '../src/logica/persistencia.ts'

test('dados corrompidos devolvem progresso vazio', () => {
  assert.deepEqual(carregarEstado({ getItem: () => '{bug' }, materiais, questoes), { revisados: [], respostas: [] })
  assert.deepEqual(carregarEstado({ getItem: () => { throw Error('bloqueio') } }, materiais, questoes), { revisados: [], respostas: [] })
})

test('ignora IDs inventados e alternativas invalidas', () => {
  const store = { getItem: () => JSON.stringify({
    revisados: ['inexistente', materiais[0].id, materiais[0].id],
    respostas: [{ questaoId: 'nada', opcao: 0 }, { questaoId: questoes[0].id, opcao: 99 }],
  }) }
  assert.deepEqual(carregarEstado(store, materiais, questoes), { revisados: [materiais[0].id], respostas: [] })
})

test('salva e recupera progresso neste navegador', () => {
  const mapa = new Map()
  const store = { getItem: chave => mapa.get(chave) ?? null, setItem: (chave, valor) => mapa.set(chave, valor) }
  const estado = { revisados: [materiais[0].id], respostas: [{ questaoId: questoes[0].id, opcao: questoes[0].correta }] }
  assert.equal(salvarEstado(store, estado), true)
  assert.ok(mapa.has(CHAVE_ESTUDOS))
  assert.deepEqual(carregarEstado(store, materiais, questoes), estado)
})
