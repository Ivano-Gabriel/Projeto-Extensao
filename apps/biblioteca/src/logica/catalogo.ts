import type { Categoria, Livro } from '../dados/livros.ts'
import type { Emprestimo } from './emprestimos.ts'

export type FiltrosCatalogo = {
  busca: string
  categoria: 'Todas' | Categoria
  disponiveis: boolean
}

export function textoNormalizado(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
}

export function quantidadeDisponivel(livro: Livro, emprestimos: readonly Emprestimo[]): number {
  const meus = emprestimos.filter((emprestimo) => emprestimo.livroId === livro.id).length
  return Math.max(0, livro.disponiveisBase - meus)
}

export function filtrarLivros(
  acervo: readonly Livro[], filtros: FiltrosCatalogo, emprestimos: readonly Emprestimo[],
): Livro[] {
  const busca = textoNormalizado(filtros.busca)
  return acervo.filter((livro) => {
    const combinado = textoNormalizado(`${livro.titulo} ${livro.autor} ${livro.categoria} ${livro.etiqueta}`)
    return (!busca || combinado.includes(busca))
      && (filtros.categoria === 'Todas' || livro.categoria === filtros.categoria)
      && (!filtros.disponiveis || quantidadeDisponivel(livro, emprestimos) > 0)
  })
}

export function resumoCatalogo(acervo: readonly Livro[], emprestimos: readonly Emprestimo[]) {
  return {
    titulos: acervo.length,
    disponiveis: acervo.filter((livro) => quantidadeDisponivel(livro, emprestimos) > 0).length,
    meusEmprestimos: emprestimos.length,
    categorias: new Set(acervo.map((livro) => livro.categoria)).size,
  }
}
