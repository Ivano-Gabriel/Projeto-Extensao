import test from 'node:test'
import assert from 'node:assert/strict'
import { resumirFrequencia, faltasAteMeta, filtroPeriodo, proximoDiaLetivo, mediaNotas, diasConsecutivosEstudados } from '../src/escola/regras.ts'

test('calcula frequencia pela soma das horas ofertadas, nao pela media simples', () => {
  const aulas = [
    {data:'2026-11-02', materia:'Matemática', aulas:1, presencas:1},
    {data:'2026-11-03', materia:'Física', aulas:9, presencas:0},
  ]
  assert.equal(resumirFrequencia(aulas).percentual, 10)
  assert.equal(resumirFrequencia(aulas).faltas, 9)
  assert.equal(resumirFrequencia([]).percentual, null)
})

test('separa registros por materia e por janela de tempo', () => {
  const base = [{data:'2026-10-01', materia:'Física', aulas:3, presencas:2},
    {data:'2026-11-02', materia:'Física', aulas:2, presencas:2},
    {data:'2026-11-02', materia:'História', aulas:1, presencas:0}]
  const fisica = resumirFrequencia(base, 'Física')
  assert.equal(fisica.aulas, 5)
  assert.equal(fisica.presencas, 4)
  const recentes = filtroPeriodo(base, 'mes', new Date('2026-11-07T12:00:00'))
  assert.equal(recentes.length, 2)
})

test('nao usa contagem arbitraria de faltas na proximidade de 80%', () => {
  assert.equal(faltasAteMeta(9, 10, 80), 1)
  assert.equal(faltasAteMeta(8, 10, 80), 0)
  assert.equal(faltasAteMeta(6, 10, 80), 0)
})

test('dia letivo seguinte pula sabado e domingo', () => {
  assert.equal(proximoDiaLetivo(new Date('2026-11-06T12:00:00')), '2026-11-09')
  assert.equal(proximoDiaLetivo(new Date('2026-11-07T12:00:00')), '2026-11-09')
})

test('media de notas parciais desconsidera notas ausentes', () => {
  assert.equal(mediaNotas([7, null, 9]), 8)
  assert.equal(mediaNotas([null, null]), null)
})

test('streak so conta dias de estudo diferentes, consecutivos e perto de hoje', () => {
  assert.equal(diasConsecutivosEstudados(['2026-11-05','2026-11-06','2026-11-06'], new Date('2026-11-07T12:00:00')), 2)
  assert.equal(diasConsecutivosEstudados(['2026-11-01'], new Date('2026-11-07T12:00:00')), 0)
})
