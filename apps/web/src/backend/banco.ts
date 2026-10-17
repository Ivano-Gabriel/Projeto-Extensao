import { useCallback, useEffect, useState } from 'react'
import type { Compromisso, NovoCompromisso, StatusCompromisso, TipoCompromisso } from './tipos'

/**
 * Camada de acesso à API Python (apps/api). Em desenvolvimento, o Vite encaminha
 * /api para http://127.0.0.1:8000 (ver vite.config.ts).
 */
const MENSAGEM_API =
  'Não consegui falar com a API. Em apps/api, rode: uvicorn main:app --reload'

async function pedir<T = void>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`/api${caminho}`, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json' },
  })
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
  return (resposta.status === 204 ? undefined : await resposta.json()) as T
}

const enviar = (metodo: string, corpo: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(corpo) })

/** Hook com as operações do banco. Cada ação chama a API e depois recarrega a lista. */
export function useCompromissos() {
  const [itens, setItens] = useState<Compromisso[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(async () => {
    try {
      setItens(await pedir<Compromisso[]>('/compromissos'))
      setErro('')
    } catch {
      setErro(MENSAGEM_API)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const executar = useCallback(
    async (acao: () => Promise<unknown>) => {
      try {
        await acao()
      } catch {
        setErro(MENSAGEM_API)
        return
      }
      await recarregar()
    },
    [recarregar],
  )

  const criar = (novo: NovoCompromisso) => executar(() => pedir('/compromissos', enviar('POST', novo)))
  const atualizar = (id: number, dados: NovoCompromisso) =>
    executar(() => pedir(`/compromissos/${id}`, enviar('PUT', dados)))
  const excluir = (id: number) => executar(() => pedir(`/compromissos/${id}`, { method: 'DELETE' }))
  const alternarConcluido = (id: number) => {
    const atual = itens.find((i) => i.id === id)
    if (!atual) return Promise.resolve()
    const status: StatusCompromisso = atual.status === 'concluido' ? 'pendente' : 'concluido'
    return executar(() => pedir(`/compromissos/${id}/status`, enviar('PATCH', { status })))
  }
  const restaurarExemplo = () => executar(() => pedir('/admin/restaurar', { method: 'POST' }))

  return { itens, carregando, erro, criar, atualizar, excluir, alternarConcluido, restaurarExemplo }
}

export type Banco = ReturnType<typeof useCompromissos>

export const ordenar = (itens: Compromisso[]) => [...itens].sort((a, b) => a.quando.localeCompare(b.quando))

export const corDoTipo = (tipo: TipoCompromisso) =>
  tipo === 'Prova' ? 'roxo' : tipo === 'Trabalho' ? 'coral' : 'amarelo'

export function resumo(itens: Compromisso[]) {
  const tarefas = itens.filter((i) => i.tipo !== 'Aviso')
  const pendentes = tarefas.filter((i) => i.status === 'pendente')
  const agora = Date.now()
  const semana = agora + 7 * 86400000
  const provasProximas = pendentes.filter((i) => {
    const t = new Date(i.quando).getTime()
    return i.tipo === 'Prova' && t >= agora && t <= semana
  }).length
  const concluidas = tarefas.length - pendentes.length
  return {
    pendencias: pendentes.length,
    provasProximas,
    concluidas,
    organizada: tarefas.length ? Math.round((concluidas / tarefas.length) * 100) : 100,
    provasPendentes: pendentes.filter((i) => i.tipo === 'Prova').length,
    trabalhosPendentes: pendentes.filter((i) => i.tipo === 'Trabalho').length,
    avisosNaoLidos: itens.filter((i) => i.tipo === 'Aviso' && i.status === 'pendente').length,
  }
}

export function formatarQuando(iso: string) {
  const d = new Date(iso)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dia = new Date(d)
  dia.setHours(0, 0, 0, 0)
  const dif = Math.round((dia.getTime() - hoje.getTime()) / 86400000)
  const hora = `${d.getHours()}h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}`
  if (dif === 0) return `Hoje, ${hora}`
  if (dif === 1) return `Amanhã, ${hora}`
  if (dif === -1) return `Ontem, ${hora}`
  const semana = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${semana}, ${data} · ${hora}`
}
