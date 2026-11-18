import test from 'node:test'
import assert from 'node:assert/strict'
import { estadoInicial, iniciarJogo, pular, avancar, DURACAO_TICKS } from '../src/jogo/regras.ts'

test('inicia rodada limpa, pula apenas quando esta no chao e termina em tempo finito',()=>{
  const inicial=estadoInicial()
  assert.equal(inicial.fase,'pronto')
  const inicio=iniciarJogo()
  assert.equal(inicio.fase,'jogando')
  const pulando=pular(inicio)
  assert.ok(pulando.pulo>0)
  assert.equal(pular(pulando).pulo,pulando.pulo)
  let jogo=iniciarJogo()
  for(let i=0;i<DURACAO_TICKS;i++){
    jogo=avancar({...jogo,vidas:999,obstaculos:[]})
  }
  assert.equal(jogo.fase,'fim')
  assert.equal(jogo.ticks,DURACAO_TICKS)
})
test('pontua apenas obstaculos evitados e reduz vidas em colisoes',()=>{
  let jogo={...iniciarJogo(),ticks:3,obstaculos:[9],vidas:2}
  jogo=avancar(jogo)
  assert.equal(jogo.vidas,1)
  assert.equal(jogo.pontos,0)
  assert.equal(jogo.obstaculos.length,0)
  const evitando=avancar({...iniciarJogo(),ticks:4,obstaculos:[1],pulo:6})
  assert.equal(evitando.pontos,10)
})
test('finaliza com zero vidas e ignora cliques em rodadas encerradas',()=>{
  const fim=avancar({...iniciarJogo(),ticks:2,obstaculos:[9],vidas:1})
  assert.equal(fim.fase,'fim')
  assert.equal(fim.vidas,0)
  assert.equal(pular(fim),fim)
  assert.equal(avancar(fim),fim)
})
test('gera obstaculos deterministicamente sem ultrapassar o limite do jogo',()=>{
  const criado=avancar({...iniciarJogo(),ticks:19,obstaculos:[]})
  assert.equal(criado.obstaculos.length,1)
  const desativado=avancar({...iniciarJogo(),ticks:DURACAO_TICKS-1,obstaculos:[]})
  assert.equal(desativado.fase,'fim')
})