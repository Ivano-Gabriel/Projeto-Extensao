import assert from 'node:assert/strict'
import test from 'node:test'
import { materiais } from '../src/dados/materiais.ts'
import { buscarMateriais, resumoEstudos } from '../src/logica/estudos.ts'

test('busca aceita palavras sem acento e caixa diferente', () => {
  const achados = buscarMateriais(materiais, '  FUNCOES  ', 'Todas')
  assert.ok(achados.some(item => item.titulo.includes('Funções')))
})

test('filtro por materia retorna apenas aquela materia', () => {
  const achados = buscarMateriais(materiais, '', 'Física')
  assert.ok(achados.length > 0)
  assert.ok(achados.every(item => item.materia === 'Física'))
})

test('busca sem resultado retorna lista vazia', () => {
  assert.deepEqual(buscarMateriais(materiais, 'nada-com-esse-nome', 'Todas'), [])
})

test('progresso nao conta materiais repetidos ou inventados', () => {
  const a = materiais[0].id
  const r = resumoEstudos(materiais, [a, a, 'falso'], [])
  assert.equal(r.revisados, 1)
  assert.equal(r.percentual, Math.round(100 / materiais.length))
})
