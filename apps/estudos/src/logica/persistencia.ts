import type { Material } from '../dados/materiais.ts'
import type { Questao } from '../dados/questoes.ts'
import type { Resposta } from './revisao.ts'

export type EstadoEstudos = { revisados: string[]; respostas: Resposta[] }
export const CHAVE_ESTUDOS = 'extensao:estudos:progresso:v1'
type Leitura = { getItem: (chave: string) => string | null }
type Escrita = { setItem: (chave: string, valor: string) => void }

export function carregarEstado(
  store: Leitura | null | undefined,
  materiais: readonly Material[],
  questoes: readonly Questao[],
): EstadoEstudos {
  const vazio = (): EstadoEstudos => ({ revisados: [], respostas: [] })
  try {
    const salvo = store?.getItem(CHAVE_ESTUDOS)
    if (!salvo) return vazio()
    const dados: unknown = JSON.parse(salvo)
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return vazio()
    const bruto = dados as Record<string, unknown>
    const ids = new Set(materiais.map((material) => material.id))
    const revisados = Array.isArray(bruto.revisados)
      ? [...new Set(bruto.revisados.slice(0, 100).filter((id): id is string => typeof id === 'string' && ids.has(id)))]
      : []
    const questaoPorId = new Map(questoes.map((q) => [q.id, q]))
    const usados = new Set<string>()
    const respostas: Resposta[] = []
    if (Array.isArray(bruto.respostas)) {
      for (const item of bruto.respostas.slice(0, 100)) {
        if (!item || typeof item !== 'object') continue
        const questaoId = (item as Record<string, unknown>).questaoId
        const opcao = (item as Record<string, unknown>).opcao
        if (typeof questaoId !== 'string' || usados.has(questaoId)) continue
        const questao = questaoPorId.get(questaoId)
        if (!questao || typeof opcao !== 'number' || !Number.isInteger(opcao)
            || opcao < 0 || opcao >= questao.opcoes.length) continue
        usados.add(questaoId)
        respostas.push({ questaoId, opcao })
      }
    }
    return { revisados, respostas }
  } catch {
    return vazio()
  }
}

export function salvarEstado(store: Escrita | null | undefined, estado: EstadoEstudos): boolean {
  try {
    if (!store) return false
    store.setItem(CHAVE_ESTUDOS, JSON.stringify(estado))
    return true
  } catch {
    return false
  }
}
