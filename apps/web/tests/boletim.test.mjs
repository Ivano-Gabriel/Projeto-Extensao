import assert from 'node:assert/strict'
import test from 'node:test'
import { calcularMedia, classificarMedia, formatarNota, resumirBoletim } from '../src/academic/boletim.ts'

test('calcula a média só com as notas que já saíram', () => {
  assert.equal(calcularMedia([9, 7, null, null]), 8)
})

test('não inventa média quando ainda não há notas', () => {
  assert.equal(calcularMedia([null, null, null, null]), null)
  assert.equal(formatarNota(null), '—')
})

test('mostra as faixas de atenção do boletim demonstrativo', () => {
  assert.equal(classificarMedia(8).rotulo, 'Na média')
  assert.equal(classificarMedia(6).rotulo, 'Atenção')
  assert.equal(classificarMedia(4).rotulo, 'Em risco')
  assert.equal(classificarMedia(null).rotulo, 'Sem notas')
})

test('resumo calcula faltas, alunos em atenção e médias sem dividir por zero', () => {
  const vazio = resumirBoletim([])
  assert.equal(vazio.mediaGeral, null)
  assert.equal(vazio.totalFaltas, 0)
  assert.equal(vazio.emAtencao, 0)

  const comNotas = resumirBoletim([
    { nome: 'Matemática', notas: [9, 7, null, null], faltas: 1 },
    { nome: 'Física', notas: [4, 6, null, null], faltas: 3 },
    { nome: 'Química', notas: [null, null, null, null], faltas: 0 },
  ])
  assert.equal(comNotas.mediaGeral, 6.5)
  assert.equal(comNotas.totalFaltas, 4)
  assert.equal(comNotas.emAtencao, 1)
})
