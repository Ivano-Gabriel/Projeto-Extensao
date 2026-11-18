import test from 'node:test'
import assert from 'node:assert/strict'
import { criarRascunhoDeTema, questaoDoMaterial, registrarAtividade, validarAtividades } from '../src/escola/atividade.ts'
import { carregarEscola, estadoInicialEscola } from '../src/escola/estado.ts'
import { publicacoes } from '../src/escola/dados.ts'

test('um tema cadastrado cria rascunho de aula com quiz ja preparado',()=>{
  const novo=criarRascunhoDeTema('porcentagem')
  assert.equal(novo.materia,'Matemática')
  assert.equal(novo.materialId,'porcentagem')
  assert.match(novo.titulo,/Porcentagem/)
  assert.ok(questaoDoMaterial('porcentagem')?.pergunta)
  assert.equal(questaoDoMaterial('inventado'),undefined)
  assert.throws(()=>criarRascunhoDeTema('inventado'))
})
test('resposta valida é unica, pode ser refeita e nao substitui outra atividade',()=>{
  const q=questaoDoMaterial('funcao-quadratica')
  const r=registrarAtividade([], 'post-1', q.id, 1, publicacoes)
  assert.deepEqual(r,[{postId:'post-1',questaoId:q.id,opcao:1}])
  assert.deepEqual(registrarAtividade(r,'post-1',q.id,0,publicacoes),r)
  assert.throws(()=>registrarAtividade([], 'post-1','q-vargas',2,publicacoes))
  assert.throws(()=>registrarAtividade([], 'post-1',q.id,99,publicacoes))
  assert.throws(()=>registrarAtividade([], 'post-999',q.id,1,publicacoes))
})
test('descarta respostas invalidas e posts que foram apagados',()=>{
  const val=validarAtividades([
    {postId:'post-1',questaoId:'q-funcao',opcao:1},
    {postId:'post-1',questaoId:'q-funcao',opcao:0},
    {postId:'post-2',questaoId:'q-vargas',opcao:2},
    {postId:'post-3',questaoId:'q-figuras',opcao:100},
    {postId:'post-999',questaoId:'q-funcao',opcao:1},
  ],publicacoes)
  assert.deepEqual(val,[{postId:'post-1',questaoId:'q-funcao',opcao:1}])
})
test('estado persistido antigo permanece valido e aceita respostas demonstrativas',()=>{
  const raw={...estadoInicialEscola(),atividades:[{postId:'post-1',questaoId:'q-funcao',opcao:1}]}
  const out=carregarEscola({getItem:()=>JSON.stringify(raw)})
  assert.equal(out.atividades.length,1)
  const old=carregarEscola({getItem:()=>JSON.stringify({...raw,atividades:undefined})})
  assert.deepEqual(old.atividades,[])
})