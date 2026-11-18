import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { paginaDoUsuario,erroNaVerificacaoDeSessao } from '../src/portal/sessao.ts'
import { armazenamentoDaConta } from '../src/portal/armazenamento.ts'
import { ErroApi } from '../src/portal/api.ts'
import { apagarDadosDoEstudos } from '../src/logica/privacidade.ts'

const usuario={id:13,nome:'Estudante Teste',email:'teste@exemplo.test',papel:'ALUNO',escolaId:2,administrador:false}

test('login real roteia aluno para estudos e funcionarios para paineis',()=>{
  assert.equal(paginaDoUsuario(usuario),'estudos')
  assert.equal(paginaDoUsuario({...usuario,papel:'PROFESSOR'}),'funcionarios')
  assert.equal(paginaDoUsuario({...usuario,papel:'DIRECAO'}),'funcionarios')
  assert.equal(paginaDoUsuario({...usuario,papel:'DIRECAO',administrador:true,escolaId:null}),'funcionarios')
  assert.throws(()=>paginaDoUsuario({...usuario,papel:'INVALIDO'}),/Perfil de usuário inválido/)
})
test('sessao ausente mostra login, mas erro de rede nao libera acesso sem verificacao',()=>{
  assert.equal(erroNaVerificacaoDeSessao(new ErroApi('Login',401)),'login')
  assert.equal(erroNaVerificacaoDeSessao(new ErroApi('Backend indisponível',503)),'indisponivel')
  assert.equal(erroNaVerificacaoDeSessao(new TypeError('Failed to fetch')),'indisponivel')
})
test('progresso local de estudo é separado por conta e apagar nao afeta outros alunos',()=>{
  const dados=new Map()
  const storage={
    getItem:chave=>dados.get(chave)||null,
    setItem:(chave,valor)=>dados.set(chave,valor),
    removeItem:chave=>dados.delete(chave),
  }
  const a=armazenamentoDaConta(storage,13),b=armazenamentoDaConta(storage,42)
  a.setItem('extensao:estudos:progresso:v1','do aluno 13')
  b.setItem('extensao:estudos:progresso:v1','do aluno 42')
  assert.equal(a.getItem('extensao:estudos:progresso:v1'),'do aluno 13')
  assert.equal(b.getItem('extensao:estudos:progresso:v1'),'do aluno 42')
  assert.equal(apagarDadosDoEstudos(a),true)
  assert.equal(a.getItem('extensao:estudos:progresso:v1'),null)
  assert.equal(b.getItem('extensao:estudos:progresso:v1'),'do aluno 42')
  assert.equal(armazenamentoDaConta(storage,-1),null)
})
test('app exige sessao na entrada, e portal nao tenta novo login silenciosamente',()=>{
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8')
  const portal=readFileSync(new URL('../src/portal/Portal.tsx',import.meta.url),'utf8')
  assert.match(app,/apiEscolar\.me\(\)/)
  assert.match(app,/fase==='verificando'/)
  assert.match(app,/fase==='indisponivel'/)
  assert.match(app,/fase==='autenticado'&&usuario/)
  assert.match(app,/PortalLogin entrar=\{entrar\}/)
  assert.doesNotMatch(portal,/apiEscolar\.me\(\)/)
})
