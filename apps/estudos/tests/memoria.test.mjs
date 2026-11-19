import test from 'node:test'
import assert from 'node:assert/strict'
import { iniciarMemoria, revelarCarta, paresMemoria, estadoDaMemoria } from '../src/jogo/memoria.ts'

test('mini game de memoria oferece quatro pares de conteudo verificavel',()=>{
  const deck=iniciarMemoria('matematica')
  assert.equal(deck.cartas.length,8)
  assert.equal(new Set(deck.cartas.map(x=>x.id)).size,8)
  assert.equal(new Set(deck.cartas.map(x=>x.par)).size,4)
  assert.ok(paresMemoria().includes('matematica'))
})
test('duas cartas iguais pontuam, cartas distintas podem ser fechadas',()=>{
  let jogo=iniciarMemoria('matematica')
  const par=jogo.cartas[0].par
  const indices=jogo.cartas.map((c,i)=>c.par===par?i:-1).filter(i=>i>=0)
  jogo=revelarCarta(jogo,indices[0])
  jogo=revelarCarta(jogo,indices[1])
  assert.equal(jogo.acertos,1)
  assert.equal(jogo.finalizado,false)
  assert.equal(revelarCarta(jogo,indices[0]),jogo)
  const diferente=jogo.cartas.findIndex(c=>c.par!==par)
  jogo=revelarCarta(jogo,diferente)
  const outro=jogo.cartas.findIndex((c,i)=>i!==diferente&&c.par!==jogo.cartas[diferente].par&&c.par!==par)
  jogo=revelarCarta(jogo,outro)
  assert.equal(jogo.abertas.length,2)
  jogo=estadoDaMemoria(jogo)
  assert.equal(jogo.abertas.length,0)
})
test('partida termina com quatro pares sem cronometro infinito',()=>{
  let jogo=iniciarMemoria('historia')
  for(const par of new Set(jogo.cartas.map(c=>c.par))){
    const pos=jogo.cartas.map((c,i)=>c.par===par?i:-1).filter(i=>i>=0)
    jogo=revelarCarta(jogo,pos[0])
    jogo=revelarCarta(jogo,pos[1])
  }
  assert.equal(jogo.acertos,4)
  assert.equal(jogo.finalizado,true)
})
