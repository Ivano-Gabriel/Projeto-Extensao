export type Disciplina = { nome: string; notas: [number | null, number | null, number | null, number | null]; faltas: number }

export const disciplinasDemo: Disciplina[] = [
  { nome: 'Matemática', notas: [9, 8.5, 9.5, null], faltas: 1 },
  { nome: 'Português', notas: [9.5, 9, 8, null], faltas: 0 },
  { nome: 'Física', notas: [7, 6.5, 5.5, null], faltas: 3 },
  { nome: 'Química', notas: [8, 8, 7.5, null], faltas: 2 },
  { nome: 'História', notas: [10, 9.5, 9.5, null], faltas: 0 },
  { nome: 'Biologia', notas: [4.5, 5, 4, null], faltas: 4 },
]

export function calcularMedia(notas: readonly (number | null)[]): number | null {
  const validas = notas.filter((nota): nota is number => nota !== null && Number.isFinite(nota) && nota >= 0 && nota <= 10)
  if (validas.length === 0) return null
  return validas.reduce((total, nota) => total + nota, 0) / validas.length
}

export function classificarMedia(media: number | null): { rotulo: string; classe: string } {
  if (media === null) return { rotulo: 'Sem notas', classe: 'neutro' }
  if (media >= 7) return { rotulo: 'Na média', classe: 'ok' }
  if (media >= 5) return { rotulo: 'Atenção', classe: 'alerta' }
  return { rotulo: 'Em risco', classe: 'risco' }
}

export const formatarNota = (nota: number | null): string => nota === null ? '—' : nota.toFixed(1).replace('.', ',')

export function resumirBoletim(disciplinas: readonly Disciplina[]) {
  const medias = disciplinas.map((d) => calcularMedia(d.notas))
  const validas = medias.filter((media): media is number => media !== null)
  return {
    mediaGeral: validas.length ? validas.reduce((soma, media) => soma + media, 0) / validas.length : null,
    totalFaltas: disciplinas.reduce((total, disciplina) => total + disciplina.faltas, 0),
    emAtencao: medias.filter((media) => media !== null && media < 7).length,
  }
}
