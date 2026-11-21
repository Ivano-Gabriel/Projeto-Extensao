import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {prepararTransferencia} from '../src/portal/transferencia.ts'

const aluno={alunoId:71,alunoNome:'Aluno QA',turmaId:12,turmaCodigo:'QA27A',
  turmaNome:'Turma de homologacao',anoLetivo:2027}
const destino={id:13,codigo:'QA27B',nome:'Turma destino',anoLetivo:2027}

test('monta confirmação explícita somente para turma diferente do mesmo ano',()=>{
  assert.deepEqual(prepararTransferencia(aluno,destino),{
    alunoId:71,alunoNome:'Aluno QA',origemTurmaId:12,origemCodigo:'QA27A',
    destinoTurmaId:13,destinoCodigo:'QA27B',anoLetivo:2027,
  })
})

test('recusa transferência sem matrícula, sem destino ou mesma turma',()=>{
  assert.equal(prepararTransferencia(undefined,destino),null)
  assert.equal(prepararTransferencia(aluno,undefined),null)
  assert.equal(prepararTransferencia(aluno,{...destino,id:12}),null)
})

test('bloqueia destino de ano letivo diferente no cliente',()=>{
  assert.equal(prepararTransferencia(aluno,{...destino,anoLetivo:2026}),null)
})

test('confirmação de transferência usa etapa na tela e não janela nativa',()=>{
  const tela=readFileSync(new URL('../src/portal/DirecaoPainel.tsx',import.meta.url),'utf8')
  assert.doesNotMatch(tela,/window\.confirm\(/)
  assert.match(tela,/Confirmar movimentação/)
  assert.match(tela,/Cancelar transferência/)
  assert.match(tela,/prepararTransferencia/)
})
