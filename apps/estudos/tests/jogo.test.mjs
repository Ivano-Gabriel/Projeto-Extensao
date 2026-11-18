import test from 'node:test'
import assert from 'node:assert/strict'
import {estadoInicial,iniciarJogo,responder,avancar,pontos,missoes} from '../src/jogo/regras.ts'

test('tres missoes de ensino medio com tres situacoes e explicacoes',()=>{
  assert.equal(missoes.length,3)
  for(const missao of missoes){
    assert.equal(missao.perguntas.length,3)
    for(const pergunta of missao.perguntas){
      assert.equal(pergunta.opcoes.length,4)
      assert.ok(pergunta.explicacao.length>30)
      assert.ok(pergunta.correta>=0&&pergunta.correta<=3)
    }
  }
})
test('nao avanca sem resposta, nem aceita a segunda alternativa',()=>{
  let jogo=iniciarJogo('tecnologia')
  assert.equal(avancar(jogo),jogo)
  assert.equal(responder(jogo,99),jogo)
  jogo=responder(jogo,1)
  assert.equal(responder(jogo,2),jogo)
  assert.equal(jogo.respostas.length,1)
  const segundo=avancar(jogo)
  assert.equal(segundo.indice,1)
  assert.equal(segundo.respostas.length,1)
})
test('pontuacao depende de acertos e partida termina apos tres desafios',()=>{
  const missao=missoes.find(m=>m.id==='negocios')
  let jogo=iniciarJogo('negocios')
  for(let i=0;i<3;i++){
    jogo=responder(jogo,missao.perguntas[i].correta)
    jogo=avancar(jogo)
  }
  assert.equal(jogo.concluido,true)
  assert.equal(jogo.respostas.length,3)
  assert.equal(pontos(jogo),300)
  assert.equal(responder(jogo,0),jogo)
  assert.equal(avancar(jogo),jogo)
  assert.deepEqual(estadoInicial(),{missao:null,indice:0,respostas:[],concluido:false})
})
test('resposta errada nao impede conclusao e o jogo nao tem temporizador',()=>{
  let jogo=iniciarJogo('jornalismo')
  const perguntas=missoes.find(m=>m.id==='jornalismo').perguntas
  for(const pergunta of perguntas){jogo=avancar(responder(jogo,(pergunta.correta+1)%4))}
  assert.equal(jogo.concluido,true)
  assert.equal(pontos(jogo),0)
})
