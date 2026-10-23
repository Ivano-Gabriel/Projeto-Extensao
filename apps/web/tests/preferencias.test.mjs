import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CHAVE_PREFERENCIAS,
  carregarPreferencias,
  normalizarPreferencias,
  preferenciasPadrao,
  salvarPreferencias,
} from '../src/preferences/preferencias.ts'

test('valores salvos quebrados não afetam o app', () => {
  const p = normalizarPreferencias({ tamanhoTexto: 'gigante', reduzirAnimacoes: 'sim', notificarProvas: false })
  assert.equal(p.tamanhoTexto, 'normal')
  assert.equal(p.reduzirAnimacoes, false)
  assert.equal(p.notificarProvas, false)
})

test('carrega os padrões com dados inválidos no navegador', () => {
  const store = { getItem: () => '{json quebrado' }
  assert.deepEqual(carregarPreferencias(store), preferenciasPadrao)
})

test('salva e recupera preferências no navegador', () => {
  const dados = new Map()
  const store = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  }
  assert.equal(salvarPreferencias(store, { ...preferenciasPadrao, tamanhoTexto: 'grande' }), true)
  assert.ok(dados.has(CHAVE_PREFERENCIAS))
  assert.equal(carregarPreferencias(store).tamanhoTexto, 'grande')
})

test('sem acesso ao armazenamento, segue com os padrões', () => {
  const store = {
    getItem: () => { throw new Error('bloqueado') },
    setItem: () => { throw new Error('bloqueado') },
  }
  assert.deepEqual(carregarPreferencias(store), preferenciasPadrao)
  assert.equal(salvarPreferencias(store, preferenciasPadrao), false)
})
