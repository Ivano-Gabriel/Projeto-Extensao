import test from 'node:test'
import assert from 'node:assert/strict'
import { livros } from '../src/dados/livros.ts'
import { filtrarLivros, quantidadeDisponivel, resumoCatalogo } from '../src/logica/catalogo.ts'

test('busca ignora acentos e letras maiusculas, inclusive nome do autor', () => {
  assert.ok(filtrarLivros(livros, { busca: '  CONCEICAO  ', categoria: 'Todas', disponiveis: false }, []).some(livro => livro.autor.includes('Conceição')))
  assert.ok(filtrarLivros(livros, { busca: 'CIENCIAS', categoria: 'Todas', disponiveis: false }, []).some(livro => livro.categoria === 'Ciências'))
})

test('filtra categoria e disponibilidade usando emprestimos do proprio navegador', () => {
  const resultado = filtrarLivros(livros, { busca: '', categoria: 'Literatura', disponiveis: true }, [])
  assert.ok(resultado.length > 0)
  assert.ok(resultado.every(livro => livro.categoria === 'Literatura' && livro.disponiveisBase > 0))
  const unico = livros.find(livro => livro.disponiveisBase === 1)
  assert.ok(unico)
  const comEmprestimo = filtrarLivros([unico], { busca: '', categoria: 'Todas', disponiveis: true },
    [{ livroId: unico.id, data: '2026-10-24T00:00:00.000Z' }])
  assert.equal(comEmprestimo.length, 0)
})

test('livro sem exemplares fica indisponivel sem emprestimo', () => {
  const zerado = livros.find(livro => livro.disponiveisBase === 0)
  assert.ok(zerado)
  assert.equal(quantidadeDisponivel(zerado, []), 0)
})

test('contagens do catalogo acompanham emprestimos sem alterar o catalogo original', () => {
  const livro = livros.find(livro => livro.disponiveisBase === 1)
  const emprestimos = [{ livroId: livro.id, data: '2026-10-24T00:00:00.000Z' }]
  assert.equal(quantidadeDisponivel(livro, emprestimos), 0)
  assert.equal(livro.disponiveisBase, 1)
  assert.equal(resumoCatalogo(livros, emprestimos).meusEmprestimos, 1)
})
