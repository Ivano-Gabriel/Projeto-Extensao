import test from 'node:test'
import assert from 'node:assert/strict'
import { areaDoUsuario, categoriaDoUsuario } from '../src/portal/perfis.ts'

const base = { id: 17, nome: 'Usuário Exemplo', email: 'conta@escola.test', escolaId: 9, administrador: false }
test('o servidor define a área: aluno, professor e direção', () => {
  assert.equal(areaDoUsuario({...base,papel:'ALUNO'}),'ALUNO')
  assert.equal(areaDoUsuario({...base,papel:'PROFESSOR'}),'PROFESSOR')
  assert.equal(areaDoUsuario({...base,papel:'DIRECAO'}),'DIRECAO')
  assert.equal(categoriaDoUsuario({...base,papel:'ALUNO'}),'aluno')
  assert.equal(categoriaDoUsuario({...base,papel:'PROFESSOR'}),'funcionario')
})
test('administrador da plataforma não é uma opção selecionável no formulário', () => {
  const admin={...base,papel:'DIRECAO',administrador:true,escolaId:null}
  assert.equal(areaDoUsuario(admin),'ADMIN')
  assert.equal(categoriaDoUsuario(admin),'funcionario')
})
test('nunca aceita perfil desconhecido vindo da resposta de login', () => {
  assert.throws(()=>areaDoUsuario({...base,papel:'ADMIN'}),/Perfil de usuário inválido/)
  assert.throws(()=>areaDoUsuario({...base,papel:'OUTRO'}),/Perfil de usuário inválido/)
})
