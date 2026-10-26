import type { Materia } from '../dados/materiais'

export type Prova = {
  id: string
  materia: Materia
  titulo: string
  data: string // formato AAAA-MM-DD
}

const CHAVE = 'estude-melhor-provas'

export function carregarProvas(storage: Storage | null): Prova[] {
  try {
    const bruto = storage?.getItem(CHAVE)
    if (!bruto) return []
    const lista = JSON.parse(bruto)
    if (!Array.isArray(lista)) return []
    return lista.filter((p) =>
      p && typeof p.id === 'string' && typeof p.titulo === 'string' &&
      typeof p.data === 'string' && typeof p.materia === 'string')
  } catch {
    return []
  }
}

export function salvarProvas(storage: Storage | null, provas: Prova[]) {
  try { storage?.setItem(CHAVE, JSON.stringify(provas)) } catch { /* sem espaço ou bloqueado */ }
}

export function chaveData(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

export function dataDeChave(chave: string) {
  const [a, m, d] = chave.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function diasAte(chave: string, hoje = new Date()) {
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return Math.round((dataDeChave(chave).getTime() - base.getTime()) / 86400000)
}

export function textoPrazo(dias: number) {
  if (dias < 0) return 'Já passou'
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Amanhã'
  return `Em ${dias} dias`
}

export function celulasDoMes(ano: number, mes: number): (string | null)[] {
  const vazios = new Date(ano, mes, 1).getDay()
  const total = new Date(ano, mes + 1, 0).getDate()
  const celulas: (string | null)[] = Array(vazios).fill(null)
  for (let d = 1; d <= total; d++) celulas.push(chaveData(new Date(ano, mes, d)))
  while (celulas.length % 7 !== 0) celulas.push(null)
  return celulas
}