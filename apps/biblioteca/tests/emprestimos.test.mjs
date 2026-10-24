import test from 'node:test'
import assert from 'node:assert/strict'
import { livros } from '../src/dados/livros.ts'
import { emprestarLivro, devolverLivro, carregarEmprestimos, salvarEmprestimos, CHAVE_EMPRESTIMOS } from '../src/logica/emprestimos.ts'

const emprestavel = livros.find(livro => livro.disponiveisBase >= 1)
const indisponivel = livros.find(livro => livro.disponiveisBase === 0)
const data = '2026-10-24T12:00:00.000Z'

test('empresta um livro e impede emprestimo duplicado no navegador', () => {
  const primeiro = emprestarLivro(emprestavel, [], data)
  assert.equal(primeiro.ok, true)
  assert.equal(primeiro.emprestimos.length, 1)
  const segundo = emprestarLivro(emprestavel, primeiro.emprestimos, data)
  assert.equal(segundo.ok, false)
  assert.equal(segundo.emprestimos.length, 1)
})

test('nao empresta livro sem exemplares disponiveis', () => {
  const resultado = emprestarLivro(indisponivel, [], data)
  assert.equal(resultado.ok, false)
  assert.deepEqual(resultado.emprestimos, [])
})

test('devolver restaura disponibilidade e nao remove outros emprestimos', () => {
  const [a, b] = livros.filter(livro => livro.disponiveisBase >= 1).slice(0, 2)
  const emprestimos = [{ livroId: a.id, data }, { livroId: b.id, data }]
  const atualizados = devolverLivro(emprestimos, a.id)
  assert.deepEqual(atualizados, [{ livroId: b.id, data }])
  assert.equal(emprestimos.length, 2)
})

test('dados malformados no armazenamento nao quebram o aplicativo', () => {
  assert.deepEqual(carregarEmprestimos({ getItem: () => '{invalido' }, livros), [])
  assert.deepEqual(carregarEmprestimos({ getItem: () => JSON.stringify([{ livroId: 'hack', data }]) }, livros), [])
  assert.deepEqual(carregarEmprestimos({ getItem: () => { throw Error('bloqueado') } }, livros), [])
})

test('salva e recupera apenas emprestimos validos', () => {
  const estado = new Map()
  const store = {
    getItem: chave => estado.get(chave) ?? null,
    setItem: (chave, valor) => estado.set(chave, valor)
  }
  const emprestimos = [{ livroId: emprestavel.id, data }]
  assert.equal(salvarEmprestimos(store, emprestimos), true)
  assert.ok(estado.has(CHAVE_EMPRESTIMOS))
  assert.deepEqual(carregarEmprestimos(store, livros), emprestimos)
})
