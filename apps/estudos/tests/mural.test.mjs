import test from 'node:test'
import assert from 'node:assert/strict'
import { criarPostDemo, adicionarPostDemo, removerPostDemo, validarPostsDemo, MAX_POSTS_DEMO } from '../src/escola/mural.ts'
import { carregarEscola, estadoInicialEscola } from '../src/escola/estado.ts'

const entrada={titulo:'Revisão de matemática',texto:'Vamos revisar as funções do segundo grau antes da próxima aula.',materia:'Matemática',criadoEm:'2026-11-17',materialId:'funcao-quadratica'}

test('cria publicação demonstrativa limpa e vincula material existente',()=>{
  const post=criarPostDemo({...entrada,titulo:'  Revisão de matemática  '},'demo-1')
  assert.equal(post.titulo,'Revisão de matemática')
  assert.equal(post.materialId,'funcao-quadratica')
  assert.equal(post.id,'demo-1')
})

test('recusa corpo/titulo vazios, materia inválida, data impossível e link inventado',()=>{
  for(const [campo,valor] of [['titulo','  '],['texto','curto'],['materia','Artes'],['criadoEm','2026-02-31'],['materialId','inventado']]){
    assert.throws(()=>criarPostDemo({...entrada,[campo]:valor},'demo-2'))
  }
  assert.throws(()=>criarPostDemo(entrada,'post-1'))
})

test('limita a 15 posts, nao permite ids duplicados e remove sem mutacao',()=>{
  let posts=[]
  for(let i=0;i<MAX_POSTS_DEMO;i++) posts=adicionarPostDemo(posts,entrada,'demo-'+i)
  assert.equal(posts.length,15)
  assert.throws(()=>adicionarPostDemo(posts,entrada,'demo-16'))
  assert.throws(()=>adicionarPostDemo(posts.slice(0,1),entrada,'demo-0'))
  const menores=removerPostDemo(posts,'demo-0')
  assert.equal(menores.length,14)
  assert.equal(posts.length,15)
})

test('recuperacao descarta itens invalidos, IDs repetidos e dados fora do limite',()=>{
  const x=criarPostDemo(entrada,'demo-1')
  const result=validarPostsDemo([x,x,{...x,id:'demo-2',texto:'oi'},{...x,id:'post-3'}])
  assert.deepEqual(result,[x])
  assert.deepEqual(validarPostsDemo(null),[])
})

test('estado antigo continua carregando e posts locais podem manter curtidas/lidos',()=>{
  const x=criarPostDemo(entrada,'demo-1')
  const estado=carregarEscola({getItem:()=>JSON.stringify({
    ...estadoInicialEscola(),postsDemo:[x],curtidos:['demo-1','sem-post'],lidos:['demo-1','sem-post'],
  })})
  assert.deepEqual(estado.postsDemo,[x])
  assert.deepEqual(estado.curtidos,['demo-1'])
  assert.deepEqual(estado.lidos,['demo-1'])
  assert.deepEqual(carregarEscola(null).postsDemo,[])
})
