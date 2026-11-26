import test from 'node:test'
import assert from 'node:assert/strict'
import {procurarAcoes,orientarAluno,lerModo,salvarModo} from '../src/portal/experiencia.ts'

test('busca lista apenas acoes permitidas e encontra sinônimos comuns',()=>{
  assert.deepEqual(procurarAcoes('ALUNO','').map(a=>a.id),['atividades','materiais','avisos'])
  assert.deepEqual(procurarAcoes('ALUNO','vinculos'),[])
  assert.deepEqual(procurarAcoes('PROFESSOR','presença').map(a=>a.id),['presenca'])
  assert.deepEqual(procurarAcoes('DIRECAO','contas').map(a=>a.id),['pessoas'])
  assert.deepEqual(procurarAcoes('ALUNO','lIcAo').map(a=>a.id),['atividades'])
})

test('sugestão do aluno usa as atividades efetivamente pendentes',()=>{
  const passo=orientarAluno({turmas:1,pendentes:3,materiais:2,avisos:1})
  assert.equal(passo.aba,'atividades')
  assert.match(passo.descricao,/3 atividades/i)
})

test('sem turma ou sem atividades, não inventa tarefas',()=>{
  const espera=orientarAluno({turmas:0,pendentes:0,materiais:0,avisos:0})
  assert.equal(espera.aba,null)
  assert.match(espera.descricao,/direção/i)
  assert.equal(orientarAluno({turmas:1,pendentes:0,materiais:0,avisos:1}).aba,'avisos')
  assert.equal(orientarAluno({turmas:1,pendentes:0,materiais:2,avisos:0}).aba,'materiais')
})

test('preferência do modo é individual por conta e inválida volta ao essencial',()=>{
  const values=new Map()
  const store={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}
  assert.equal(lerModo(10,store),'essencial')
  assert.equal(salvarModo(10,'completo',store),true)
  assert.equal(lerModo(10,store),'completo')
  assert.equal(lerModo(11,store),'essencial')
  values.set('zelo:experiencia:v1:12','valor-invalido')
  assert.equal(lerModo(12,store),'essencial')
})

test('funciona sem acesso ao armazenamento do navegador',()=>{
  const bloqueado={getItem(){throw Error('bloqueado')},setItem(){throw Error('bloqueado')}}
  assert.equal(lerModo(23,bloqueado),'essencial')
  assert.equal(salvarModo(23,'completo',bloqueado),false)
  assert.equal(lerModo(23,null),'essencial')
})
