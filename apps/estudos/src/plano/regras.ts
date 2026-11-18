import { materiais, type Materia } from '../dados/materiais.ts'
import { formatarDataLocal } from '../escola/regras.ts'

export const CHAVE_PLANO = 'extensao:estudos:plano:v1'
export const LIMITE_PLANO = 50
export type TarefaPlano = {
  id: string
  titulo: string
  materia: Materia
  data: string
  feito: boolean
  materialId?: string
}
export type NovaTarefa = Omit<TarefaPlano, 'id' | 'feito'>
export type FiltroPlano = 'todas' | 'pendentes' | 'concluidas'
export type ResumoPlano = { total: number; pendentes: number; concluidas: number; atrasadas: number; proximos7Dias: number }

const materiasValidas = new Set<Materia>(['Matemática','Português','Física','História'])
const materiaisValidos = new Set(materiais.map((m) => m.id))
const idValido = (id: unknown): id is string =>
  typeof id === 'string' && /^t-[a-zA-Z0-9-]{1,70}$/.test(id)

export function dataPlanoValida(data: unknown): data is string {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false
  const [ano, mes, dia] = data.split('-').map(Number)
  if (ano < 2000 || ano > 2100) return false
  const convertida = new Date(Date.UTC(ano, mes - 1, dia))
  return convertida.toISOString().slice(0,10) === data
}

export function adicionarTarefa(lista: readonly TarefaPlano[], item: NovaTarefa, id: string): TarefaPlano[] {
  if (lista.length >= LIMITE_PLANO) throw new Error('Limite de 50 tarefas atingido. Termine ou remova algumas.')
  if (!idValido(id) || lista.some((t) => t.id === id)) throw new Error('Não foi possível criar uma tarefa única.')
  const titulo = item.titulo.trim()
  if (titulo.length < 3 || titulo.length > 90) throw new Error('Escreva um título de 3 a 90 caracteres.')
  if (!materiasValidas.has(item.materia)) throw new Error('Escolha uma matéria válida.')
  if (!dataPlanoValida(item.data)) throw new Error('Escolha uma data válida.')
  if (item.materialId && !materiaisValidos.has(item.materialId)) throw new Error('Material não encontrado.')
  return [...lista,{id,titulo,materia:item.materia,data:item.data,feito:false,
    ...(item.materialId ? {materialId:item.materialId} : {})}]
}

export function alternarTarefa(lista: readonly TarefaPlano[], id: string): TarefaPlano[] {
  return lista.map((t)=>t.id===id ? {...t,feito:!t.feito} : t)
}

export function removerTarefa(lista: readonly TarefaPlano[], id: string): TarefaPlano[] {
  return lista.filter((t)=>t.id!==id)
}

export function filtrarPlano(lista: readonly TarefaPlano[], filtro: FiltroPlano): TarefaPlano[] {
  return lista.filter((t)=>filtro==='todas'||(filtro==='pendentes'&&!t.feito)||(filtro==='concluidas'&&t.feito))
    .sort((a,b)=>Number(a.feito)-Number(b.feito)||a.data.localeCompare(b.data)||a.titulo.localeCompare(b.titulo,'pt-BR'))
}

export function resumoPlano(lista: readonly TarefaPlano[], hoje = new Date()): ResumoPlano {
  const dataHoje = formatarDataLocal(hoje)
  const limite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  limite.setDate(limite.getDate()+7)
  const dataLimite = formatarDataLocal(limite)
  const pendentes = lista.filter((t)=>!t.feito)
  return {
    total:lista.length,
    pendentes:pendentes.length,
    concluidas:lista.length-pendentes.length,
    atrasadas:pendentes.filter((t)=>t.data<dataHoje).length,
    proximos7Dias:pendentes.filter((t)=>t.data>=dataHoje&&t.data<=dataLimite).length,
  }
}

export type AgendaDia = { atrasadas: TarefaPlano[]; hoje: TarefaPlano[]; proximas: TarefaPlano[] }

export function agendaDoDia(tarefas: readonly TarefaPlano[], agora = new Date()): AgendaDia {
  const hoje = formatarDataLocal(agora)
  const fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  fim.setDate(fim.getDate() + 7)
  const dataFinal = formatarDataLocal(fim)
  const pendentes = tarefas.filter((tarefa)=>!tarefa.feito)
    .sort((a,b)=>a.data.localeCompare(b.data)||a.titulo.localeCompare(b.titulo,'pt-BR'))
  return {
    atrasadas: pendentes.filter((t)=>t.data<hoje),
    hoje: pendentes.filter((t)=>t.data===hoje),
    proximas: pendentes.filter((t)=>t.data>hoje&&t.data<=dataFinal),
  }
}

export function reagendarTarefa(tarefas: readonly TarefaPlano[], id: string, data: string): TarefaPlano[] {
  if(!dataPlanoValida(data)) throw new Error('Informe uma data válida.')
  const tarefa=tarefas.find((t)=>t.id===id)
  if(!tarefa||tarefa.feito) throw new Error('Só é possível reagendar uma tarefa pendente.')
  return tarefas.map((item)=>item.id===id?{...item,data}:item)
}

type Leitura = {getItem:(key:string)=>string|null}
type Escrita = {setItem:(key:string,value:string)=>void}

export function carregarPlano(store: Leitura | null | undefined): TarefaPlano[] {
  try {
    const bruto = store?.getItem(CHAVE_PLANO)
    if (!bruto) return []
    const json:unknown = JSON.parse(bruto)
    if (!Array.isArray(json)) return []
    const ids = new Set<string>()
    const tarefas:TarefaPlano[] = []
    for(const dado of json.slice(0,300)){
      if(tarefas.length>=LIMITE_PLANO) break
      if(!dado||typeof dado!=='object'||Array.isArray(dado)) continue
      const t = dado as Record<string,unknown>
      if(!idValido(t.id)||ids.has(t.id)||
        typeof t.titulo!=='string'||t.titulo.trim().length<3||t.titulo.trim().length>90||
        !materiasValidas.has(t.materia as Materia)||!dataPlanoValida(t.data)||typeof t.feito!=='boolean') continue
      if(t.materialId!==undefined && (typeof t.materialId!=='string'||!materiaisValidos.has(t.materialId))) continue
      ids.add(t.id)
      tarefas.push({id:t.id,titulo:t.titulo.trim(),materia:t.materia as Materia,data:t.data,feito:t.feito,
        ...(typeof t.materialId==='string' ? {materialId:t.materialId}: {})})
    }
    return tarefas
  }catch{return []}
}

export function salvarPlano(store: Escrita | null | undefined, plano: readonly TarefaPlano[]): boolean {
  try {
    if(!store) return false
    store.setItem(CHAVE_PLANO, JSON.stringify(plano))
    return true
  }catch{return false}
}
