import test from 'node:test'
import assert from 'node:assert/strict'
import { apagarDadosDoEstudos, chavesDoEstudos } from '../src/logica/privacidade.ts'
import { CHAVE_ESTUDOS } from '../src/logica/persistencia.ts'
import { CHAVE_ESCOLA } from '../src/escola/estado.ts'
import { CHAVE_PLANO } from '../src/plano/regras.ts'

test('apaga exatamente as tres chaves do Estudos sem tocar em outros projetos',()=>{
  const dados=new Map([[CHAVE_ESTUDOS,'a'],[CHAVE_ESCOLA,'b'],[CHAVE_PLANO,'c'],['gabgym:estado','seguro'],['nummo:caixa','intacto']])
  const storage={removeItem:(key)=>dados.delete(key)}
  const resultado=apagarDadosDoEstudos(storage)
  assert.equal(resultado,true)
  assert.deepEqual(chavesDoEstudos(),[CHAVE_ESTUDOS,CHAVE_ESCOLA,CHAVE_PLANO])
  assert.equal(dados.size,2)
  assert.equal(dados.get('gabgym:estado'),'seguro')
  assert.equal(dados.get('nummo:caixa'),'intacto')
})

test('se armazenamento foi bloqueado, avisa sem lançar exceções',()=>{
  assert.equal(apagarDadosDoEstudos(null),false)
  assert.equal(apagarDadosDoEstudos({removeItem:()=>{throw new Error('negado')}}),false)
})
