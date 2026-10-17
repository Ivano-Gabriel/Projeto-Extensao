export type TipoCompromisso = 'Prova' | 'Trabalho' | 'Aviso'
export type StatusCompromisso = 'pendente' | 'concluido'

/** Uma linha da tabela `compromissos` (no futuro, o JSON devolvido pela API). */
export type Compromisso = {
  id: number
  tipo: TipoCompromisso
  titulo: string
  disciplina: string
  /** Data e hora no formato ISO 8601 (UTC). */
  quando: string
  /** Para avisos, "concluido" significa "lido". */
  status: StatusCompromisso
  criadoEm: string
}

export type NovoCompromisso = Omit<Compromisso, 'id' | 'status' | 'criadoEm'>
