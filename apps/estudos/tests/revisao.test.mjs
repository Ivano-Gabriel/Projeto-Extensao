import assert from 'node:assert/strict'
import test from 'node:test'
import { questoes } from '../src/dados/questoes.ts'
import { responderQuestao, resumirRespostas } from '../src/logica/revisao.ts'

test('resposta correta pontua uma vez', () => {
  const q = questoes[0]
  const respostas = responderQuestao([], q, q.correta)
  assert.equal(respostas.length, 1)
  assert.equal(resumirRespostas(questoes, respostas).acertos, 1)
  assert.equal(responderQuestao(respostas, q, q.correta).length, 1)
})

test('erro nao pontua e tem a explicacao disponivel nos dados', () => {
  const q = questoes[0]
  const errada = (q.correta + 1) % q.opcoes.length
  const respostas = responderQuestao([], q, errada)
  assert.equal(resumirRespostas(questoes, respostas).acertos, 0)
  assert.ok(q.explicacao.length > 15)
})

test('nao aceita alternativa fora das opcoes', () => {
  assert.deepEqual(responderQuestao([], questoes[0], 99), [])
  assert.deepEqual(responderQuestao([], questoes[0], -1), [])
})

test('desempenho calcula total sem dividir por zero', () => {
  assert.equal(resumirRespostas([], []).percentual, 0)
  assert.equal(resumirRespostas(questoes, []).respondidas, 0)
})
