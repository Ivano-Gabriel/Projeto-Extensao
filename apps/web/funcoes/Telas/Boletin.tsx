import { SubtelaCabecalho } from './subtelacabecalho' 

type Disciplina = {
  nome: string
  // null = bimestre que ainda não aconteceu
  notas: [number | null, number | null, number | null, number | null]
  faltas: number
}

// Dados fictícios. Quando existir a API, este array virá de um fetch().
const disciplinas: Disciplina[] = [
  { nome: 'Matemática', notas: [9.0, 8.5, 9.5, null], faltas: 1 },
  { nome: 'Português', notas: [9.5, 9.0, 8.0, null], faltas: 0 },
  { nome: 'Física', notas: [7.0, 6.5, 5.5, null], faltas: 3 },
  { nome: 'Química', notas: [8.0, 8.0, 7.5, null], faltas: 2 },
  { nome: 'História', notas: [10, 9.5, 9.5, null], faltas: 0 },
  { nome: 'Biologia', notas: [4.5, 5.0, 4.0, null], faltas: 4 },
]

const MEDIA_APROVACAO = 7
const MEDIA_RECUPERACAO = 5

/** Média apenas dos bimestres que já têm nota. */
function calcularMedia(notas: Disciplina['notas']): number | null {
  const lancadas = notas.filter((n): n is number => n !== null)
  if (lancadas.length === 0) return null
  return lancadas.reduce((soma, n) => soma + n, 0) / lancadas.length
}

function situacao(media: number | null) {
  if (media === null) return { texto: 'Sem nota', classe: 'neutro' }
  if (media >= MEDIA_APROVACAO) return { texto: 'Aprovado', classe: 'ok' }
  if (media >= MEDIA_RECUPERACAO) return { texto: 'Recuperação', classe: 'alerta' }
  return { texto: 'Em risco', classe: 'risco' }
}

const formatar = (n: number | null) =>
  n === null ? '—' : n.toFixed(1).replace('.', ',')

export function Boletim({ onVoltar }: { onVoltar: () => void }) {
  const medias = disciplinas
    .map((d) => calcularMedia(d.notas))
    .filter((m): m is number => m !== null)
  const mediaGeral = medias.reduce((s, m) => s + m, 0) / medias.length
  const totalFaltas = disciplinas.reduce((s, d) => s + d.faltas, 0)
  const emAtencao = disciplinas.filter(
    (d) => (calcularMedia(d.notas) ?? 10) < MEDIA_APROVACAO,
  ).length

  return (
    <div className="tab-container">
      <SubtelaCabecalho
        titulo="Boletim Acadêmico"
        subtitulo="3º Ano A • 2026"
        onVoltar={onVoltar}
      />

      <section className="summary-grid">
        <article className="summary-card purple-card">
          <div className="summary-info">
            <strong>{formatar(mediaGeral)}</strong>
            <span>média geral</span>
          </div>
        </article>
        <article className="summary-card yellow-card">
          <div className="summary-info">
            <strong>{emAtencao}</strong>
            <span>em atenção</span>
          </div>
        </article>
        <article className="summary-card green-card">
          <div className="summary-info">
            <strong>{totalFaltas}</strong>
            <span>faltas no ano</span>
          </div>
        </article>
      </section>

      <section className="main-card-block">
        <div className="tabela-scroll">
          <table className="boletim-table">
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>1º Bim</th>
                <th>2º Bim</th>
                <th>3º Bim</th>
                <th>4º Bim</th>
                <th>Média</th>
                <th>Faltas</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {disciplinas.map((d) => {
                const media = calcularMedia(d.notas)
                const sit = situacao(media)
                return (
                  <tr key={d.nome}>
                    <td className="disciplina-nome">{d.nome}</td>
                    {d.notas.map((nota, i) => (
                      <td key={i}>{formatar(nota)}</td>
                    ))}
                    <td>
                      <strong>{formatar(media)}</strong>
                    </td>
                    <td>{d.faltas}</td>
                    <td>
                      <span className={`situacao-badge ${sit.classe}`}>
                        {sit.texto}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="boletim-legenda">
          Média para aprovação: {MEDIA_APROVACAO},0 • Recuperação a partir de{' '}
          {MEDIA_RECUPERACAO},0. O 4º bimestre ainda não foi lançado.
        </p>
      </section>
    </div>
  )
}