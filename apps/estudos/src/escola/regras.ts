export type Aula = { data: string; materia: string; aulas: number; presencas: number }
export type Periodo = 'semana' | 'mes' | 'ano'
export type ResumoFrequencia = { aulas: number; presencas: number; faltas: number; percentual: number | null }

export function formatarDataLocal(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function filtroPeriodo(aulas: readonly Aula[], periodo: Periodo, hoje = new Date()): Aula[] {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  if (periodo === 'semana') inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7))
  if (periodo === 'mes') inicio.setDate(1)
  if (periodo === 'ano') { inicio.setMonth(0); inicio.setDate(1) }
  const comeco = formatarDataLocal(inicio)
  const fim = formatarDataLocal(hoje)
  return aulas.filter((aula) => aula.data >= comeco && aula.data <= fim)
}

export function resumirFrequencia(aulas: readonly Aula[], materia?: string): ResumoFrequencia {
  const selecionadas = materia && materia !== 'Todas' ? aulas.filter((a) => a.materia === materia) : aulas
  const total = selecionadas.reduce((soma, a) => soma + a.aulas, 0)
  const presentes = selecionadas.reduce((soma, a) => soma + a.presencas, 0)
  return {
    aulas: total,
    presencas: presentes,
    faltas: total - presentes,
    percentual: total > 0 ? Math.round(100 * presentes / total) : null,
  }
}

// Quantas aulas inteiramente faltadas caberiam ANTES de cair abaixo da meta,
// considerando que nenhuma outra aula seria frequentada nesse intervalo.
export function faltasAteMeta(presencas: number, aulas: number, meta = 80): number {
  if (aulas <= 0 || meta <= 0 || meta > 100 || presencas < 0 || presencas > aulas) return 0
  return Math.max(0, Math.floor(((presencas * 100) - (meta * aulas)) / meta))
}

export function proximoDiaLetivo(hoje = new Date()): string {
  const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  do { data.setDate(data.getDate() + 1) } while (data.getDay() === 0 || data.getDay() === 6)
  return formatarDataLocal(data)
}

export function mediaNotas(notas: readonly (number | null)[]): number | null {
  const disponiveis = notas.filter((nota): nota is number => nota !== null && nota >= 0 && nota <= 10)
  if (!disponiveis.length) return null
  return Math.round((disponiveis.reduce((soma, nota) => soma + nota, 0) / disponiveis.length) * 10) / 10
}

// A sequencia e voluntaria, iniciada somente quando aluno marca material ou responde quiz.
export function diasConsecutivosEstudados(dias: readonly string[], agora = new Date()): number {
  const conhecidos = new Set(dias)
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  if (!conhecidos.has(formatarDataLocal(hoje))) hoje.setDate(hoje.getDate() - 1)
  let sequencia = 0
  while (conhecidos.has(formatarDataLocal(hoje)) && sequencia < 366) {
    sequencia++
    hoje.setDate(hoje.getDate() - 1)
  }
  return sequencia
}
