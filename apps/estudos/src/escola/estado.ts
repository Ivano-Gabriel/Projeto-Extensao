import { publicacoes } from './dados.ts'

export type Tema = 'claro' | 'escuro'
export type Previsao = { data: string; valor: 'vou' | 'talvez' | 'nao' }
export type MensagemFeedback = { id: string; categoria: 'Sugestão' | 'Problema' | 'Elogio'; texto: string; data: string }
export type EstadoEscola = {
  tema: Tema
  diasEstudo: string[]
  previsao: Previsao | null
  lidos: string[]
  curtidos: string[]
  feedback: MensagemFeedback[]
}
export const CHAVE_ESCOLA = 'extensao:estudos:escola-demo:v1'
export function estadoInicialEscola(): EstadoEscola {
  return {tema:'claro',diasEstudo:[],previsao:null,lidos:[],curtidos:[],feedback:[]}
}
type Leitura = {getItem:(key:string)=>string|null}
type Escrita = {setItem:(key:string,valor:string)=>void}
const dataValida = (data: unknown): data is string =>
  typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data) &&
  !Number.isNaN(Date.parse(`${data}T12:00:00`))
const idsPosts = new Set(publicacoes.map((post) => post.id))

export function carregarEscola(store?: Leitura | null): EstadoEscola {
  const novo = estadoInicialEscola()
  try {
    const texto = store?.getItem(CHAVE_ESCOLA)
    if (!texto) return novo
    const dados: unknown = JSON.parse(texto)
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return novo
    const bruto = dados as Record<string,unknown>
    const lista = (valor:unknown, validar:(v:unknown)=>v is string) =>
      Array.isArray(valor) ? [...new Set(valor.slice(0,400).filter(validar))] : []
    const postValido = (id:unknown):id is string => typeof id === 'string' && idsPosts.has(id)
    const previsaoBruta = bruto.previsao
    let previsao: Previsao | null = null
    if (previsaoBruta && typeof previsaoBruta === 'object') {
      const p = previsaoBruta as Record<string, unknown>
      if (dataValida(p.data) && (p.valor === 'vou' || p.valor === 'talvez' || p.valor === 'nao'))
        previsao = {data:p.data, valor:p.valor}
    }
    const categorias = new Set(['Sugestão', 'Problema', 'Elogio'])
    const feedback: MensagemFeedback[] = []
    if (Array.isArray(bruto.feedback)) {
      for (const item of bruto.feedback.slice(-20)) {
        if (!item || typeof item !== 'object') continue
        const f = item as Record<string,unknown>
        if (typeof f.id === 'string' && f.id.length <= 80 && typeof f.texto === 'string'
          && f.texto.trim().length >= 3 && f.texto.length <= 350
          && typeof f.categoria === 'string' && categorias.has(f.categoria)
          && dataValida(f.data)) feedback.push({id:f.id,categoria:f.categoria as MensagemFeedback['categoria'],texto:f.texto,data:f.data})
      }
    }
    return {
      tema:bruto.tema === 'escuro' ? 'escuro' : 'claro',
      diasEstudo:lista(bruto.diasEstudo,dataValida).slice(-200),
      previsao,
      lidos:lista(bruto.lidos,postValido),
      curtidos:lista(bruto.curtidos,postValido),
      feedback,
    }
  } catch { return novo }
}
export function salvarEscola(store: Escrita | null | undefined, estado: EstadoEscola): boolean {
  try { if (!store) return false; store.setItem(CHAVE_ESCOLA,JSON.stringify(estado)); return true }
  catch { return false }
}
