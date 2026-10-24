import type { Livro } from '../dados/livros.ts'
import { quantidadeDisponivel } from './catalogo.ts'

export type Emprestimo = { livroId: string; data: string }
export const CHAVE_EMPRESTIMOS = 'extensao:biblioteca:emprestimos:v1'
type Leitura = { getItem: (chave: string) => string | null }
type Escrita = { setItem: (chave: string, valor: string) => void }

export function emprestarLivro(
  livro: Livro, emprestimos: readonly Emprestimo[], data = new Date().toISOString(),
): { ok: boolean; mensagem: string; emprestimos: Emprestimo[] } {
  if (emprestimos.some((emprestimo) => emprestimo.livroId === livro.id)) {
    return { ok: false, mensagem: 'Esse livro ja esta na sua lista de emprestimos', emprestimos: [...emprestimos] }
  }
  if (quantidadeDisponivel(livro, emprestimos) === 0) {
    return { ok: false, mensagem: 'Esse titulo esta indisponivel no momento', emprestimos: [...emprestimos] }
  }
  return {
    ok: true,
    mensagem: 'Emprestimo simulado com sucesso! Confira em Meus livros',
    emprestimos: [...emprestimos, { livroId: livro.id, data }],
  }
}

export function devolverLivro(emprestimos: readonly Emprestimo[], livroId: string): Emprestimo[] {
  return emprestimos.filter((emprestimo) => emprestimo.livroId !== livroId)
}

export function dataPrevista(data: string, dias = 7): Date {
  const prevista = new Date(data)
  prevista.setUTCDate(prevista.getUTCDate() + dias)
  return prevista
}

export function carregarEmprestimos(store: Leitura | null | undefined, acervo: readonly Livro[]): Emprestimo[] {
  try {
    const texto = store?.getItem(CHAVE_EMPRESTIMOS)
    if (!texto) return []
    const dados: unknown = JSON.parse(texto)
    if (!Array.isArray(dados)) return []
    const ids = new Set(acervo.filter((livro) => livro.disponiveisBase > 0).map((livro) => livro.id))
    const usados = new Set<string>()
    const validos: Emprestimo[] = []
    for (const item of dados.slice(0, 100)) {
      if (!item || typeof item !== 'object') continue
      const livroId = (item as Record<string, unknown>).livroId
      const data = (item as Record<string, unknown>).data
      if (typeof livroId !== 'string' || !ids.has(livroId) || usados.has(livroId)) continue
      if (typeof data !== 'string' || !Number.isFinite(Date.parse(data))) continue
      usados.add(livroId)
      validos.push({ livroId, data })
    }
    return validos
  } catch {
    return []
  }
}

export function salvarEmprestimos(store: Escrita | null | undefined, emprestimos: readonly Emprestimo[]): boolean {
  try {
    if (!store) return false
    store.setItem(CHAVE_EMPRESTIMOS, JSON.stringify(emprestimos))
    return true
  } catch {
    return false
  }
}
