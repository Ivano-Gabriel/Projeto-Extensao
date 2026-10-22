
import { useEffect, useRef, useState, type FormEvent } from 'react'

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  Clock3,
  Home,
  UserRound,
  LogOut,
  ChevronRight,
  GraduationCap,
  Settings,
  HelpCircle,
  Megaphone,
  Calendar as CalendarIcon,
  Sparkles,
   ChevronDown,
  Search,
  Send,
  CheckCircle2,
  
} from 'lucide-react'

type Aba = 'inicio' | 'agenda' | 'avisos' | 'perfil'

type Estado = { aba: Aba; dia: string }
type Sessao = { token: string; nome: string; estado: Estado | null }

function salvarEstado(token: string, estado: Estado) {
  // keepalive deixa o envio terminar mesmo se a aba estiver fechando
  return fetch('/api/estado', {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(estado),
  })
}

type Compromisso = {
  id: number
  tipo: 'Prova' | 'Trabalho' | 'Aviso'
  titulo: string
  disciplina: string
  quando: string
  cor: 'roxo' | 'coral' | 'amarelo'
  dia: string
}

const compromissos: Compromisso[] = [
  {
    id: 1,
    tipo: 'Prova',
    titulo: 'Funções do 2º grau',
    disciplina: 'Matemática',
    quando: 'Amanhã, 8h',
    cor: 'roxo',
    dia: '18',
  },
  {
    id: 2,
    tipo: 'Trabalho',
    titulo: 'Modernismo brasileiro',
    disciplina: 'Português',
    quando: 'Sexta, 23h59',
    cor: 'coral',
    dia: '19',
  },
  {
    id: 3,
    tipo: 'Aviso',
    titulo: 'Feira de ciências confirmada',
    disciplina: 'Direção',
    quando: 'Publicado hoje',
    cor: 'amarelo',
    dia: '17',
  },
  {
    id: 4,
    tipo: 'Prova',
    titulo: 'Leis de Newton e Dinâmica',
    disciplina: 'Física',
    quando: 'Quarta-feira, 10h',
    cor: 'roxo',
    dia: '20',
  },
]

function Login({ onEntrar }: { onEntrar: (sessao: Sessao) => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      if (resp.ok) {
        onEntrar(await resp.json())
      } else if (resp.status === 401) {
        setErro('E-mail ou senha incorretos.')
      } else {
        setErro('Não foi possível entrar agora. Tente novamente.')
      }
    } catch {
      setErro('Servidor indisponível. Confira se o Backend está rodando.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" aria-labelledby="login-title" onSubmit={entrar}>
        <div className="brand-mark" aria-hidden="true">
          P
        </div>
        <p className="eyebrow">Projeto de Extensão</p>
        <h1 id="login-title">Sua escola, no seu ritmo.</h1>
        <p className="login-copy">
          Veja provas, entregas e avisos sem precisar procurar em cinco lugares.
        </p>

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="seuemail@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {erro && (
          <p className="login-error" role="alert">
            {erro}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar como aluno'} <ArrowRight size={19} />
        </button>
      </form>
    </main>
  )
}

/* --- TELA INÍCIO (HOME) --- */
function TelaInicio({ onNavegar }: { onNavegar: (aba: Aba) => void }) {
  return (
    <div className="tab-container">
      {/* Grid Principal do Dashboard na Home */}
      <div className="home-dashboard-grid">
        {/* Banner do Radar da Semana */}
        <section className="week-radar">
          <div className="radar-info">
            <p className="eyebrow radar-eyebrow">Radar da semana</p>
            <h2>Você está quase em dia.</h2>
            <p>Uma prova amanhã e um trabalho para sexta-feira.</p>
          </div>
          <div className="progress-ring" aria-label="75% da semana organizada">
            <strong>75%</strong>
            <span>organizada</span>
          </div>
        </section>

        {/* Métrica / Atentados rápidos */}
        <section className="summary-grid">
          <article
            className="summary-card purple-card"
            onClick={() => onNavegar('agenda')}
          >
            <BookOpenCheck size={28} />
            <div className="summary-info">
              <strong>2</strong>
              <span>pendências</span>
            </div>
          </article>

          <article
            className="summary-card yellow-card"
            onClick={() => onNavegar('agenda')}
          >
            <CalendarDays size={28} />
            <div className="summary-info">
              <strong>1</strong>
              <span>prova próxima</span>
            </div>
          </article>

          <article
            className="summary-card green-card"
            onClick={() => onNavegar('avisos')}
          >
            <Check size={28} />
            <div className="summary-info">
              <strong>4</strong>
              <span>concluídas</span>
            </div>
          </article>
        </section>
      </div>

      {/* Seção da Agenda Recente */}
      <section className="main-card-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Próximos passos</p>
            <h2>Sua agenda</h2>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={() => onNavegar('agenda')}
          >
            Ver tudo <ArrowRight size={17} />
          </button>
        </div>

        <div className="commitment-list">
          {compromissos.map((item) => (
            <article className="commitment-card" key={item.id}>
              <span className={`commitment-stripe ${item.cor}`} />
              <div className="commitment-content">
                <div className="commitment-meta">
                  <span>{item.tipo}</span>
                  <span>•</span>
                  <span>{item.disciplina}</span>
                </div>
                <h3>{item.titulo}</h3>
                <p>
                  <Clock3 size={16} /> {item.quando}
                </p>
              </div>
              <button
                aria-label={`Abrir ${item.titulo}`}
                className="open-item"
                onClick={() =>
                  onNavegar(item.tipo === 'Aviso' ? 'avisos' : 'agenda')
                }
              >
                <ArrowRight size={18} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

/* --- TELA AGENDA / CALENDÁRIO --- */
function TelaAgenda({
  diaSelecionado,
  setDiaSelecionado,
}: {
  diaSelecionado: string
  setDiaSelecionado: (dia: string) => void
}) {
  const dias = [
    { dia: 'Seg', num: '15' },
    { dia: 'Ter', num: '16' },
    { dia: 'Qua', num: '17' },
    { dia: 'Qui', num: '18' },
    { dia: 'Sex', num: '19' },
    { dia: 'Sáb', num: '20' },
  ]

  const compromissosFiltrados = compromissos.filter(
    (item) => item.dia === diaSelecionado
  )

  return (
    <div className="tab-container">
      <div className="grid-2-cols">
        {/* Painel do Seletor de Datas */}
        <section className="main-card-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Organização</p>
              <h2>Calendário do Mês</h2>
            </div>
          </div>

          <div className="calendar-strip">
            {dias.map((d) => {
              const ativo = d.num === diaSelecionado
              return (
                <button
                  key={d.num}
                  type="button"
                  className={`calendar-day-btn ${ativo ? 'active' : ''}`}
                  onClick={() => setDiaSelecionado(d.num)}
                >
                  <span className="day-name">{d.dia}</span>
                  <span className="day-number">{d.num}</span>
                </button>
              )
            })}
          </div>

          <div className="agenda-summary-box">
            <Sparkles color="#4f46e5" size={20} />
            <p>Selecione um dia da semana acima para ver as atividades escolares programadas.</p>
          </div>
        </section>

        {/* Lista de Avaliações / Atividades */}
        <section className="main-card-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Atividades do Dia {diaSelecionado}</p>
              <h2>Avaliações e Entregas</h2>
            </div>
          </div>

          <div className="commitment-list">
            {compromissosFiltrados.length > 0 ? (
              compromissosFiltrados.map((item) => (
                <article className="commitment-card" key={item.id}>
                  <span className={`commitment-stripe ${item.cor}`} />
                  <div className="commitment-content">
                    <div className="commitment-meta">
                      <span>{item.tipo}</span>
                      <span>•</span>
                      <span>{item.disciplina}</span>
                    </div>
                    <h3>{item.titulo}</h3>
                    <p>
                      <Clock3 size={16} /> {item.quando}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <CalendarDays size={38} opacity={0.3} />
                <p>Sem compromissos marcados para este dia.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

/* --- TELA DE AVISOS --- */
function TelaAvisos() {
  return (
    <div className="tab-container">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Mural Escolar</p>
          <h2>Avisos e Comunicados</h2>
        </div>
      </div>

      <div className="grid-3-cols">
        <article className="notice-card featured-notice">
          <div className="notice-badge amarelo">DIREÇÃO • COMUNICADO</div>
          <h3>Feira de Ciências 2026 Confirmada</h3>
          <p>
            As inscrições para os estandes de projetos de inovação abrem na próxima segunda-feira na coordenação pedagógica.
          </p>
          <span className="notice-date">Publicado hoje</span>
        </article>

        <article className="notice-card">
          <div className="notice-badge roxo">PROF. RICARDO • FÍSICA</div>
          <h3>Gabarito da Lista de Exercícios</h3>
          <p>
            Disponibilizado o gabarito comentado da lista sobre Funções e Cinética para a prova do final do mês.
          </p>
          <span className="notice-date">Ontem às 14h20</span>
        </article>

        <article className="notice-card">
          <div className="notice-badge coral">COORDENAÇÃO</div>
          <h3>Reunião Trimestral de Pais</h3>
          <p>
            Lembrete: O encontro de pais e mestres será realizado neste sábado às 09:00 no auditório da escola.
          </p>
          <span className="notice-date">15 de Outubro</span>
        </article>
      </div>
    </div>
  )
}

/* --- TELA DE BOLETIM --- */
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

function Boletim({ onVoltar }: { onVoltar: () => void }) {
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
      {/* Cabeçalho com botão Voltar */}
      <div className="subtela-header">
        <button className="back-button" type="button" onClick={onVoltar}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div>
          <p className="eyebrow">3º Ano A • 2026</p>
          <h2>Boletim Acadêmico</h2>
        </div>
      </div>

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
/* --- TELA DE PREFERÊNCIAS --- */
type TamanhoTexto = 'pequeno' | 'normal' | 'grande'

type Preferencias = {
  notificarProvas: boolean
  notificarTrabalhos: boolean
  notificarAvisos: boolean
  tamanhoTexto: TamanhoTexto
  reduzirAnimacoes: boolean
}

const preferenciasPadrao: Preferencias = {
  notificarProvas: true,
  notificarTrabalhos: true,
  notificarAvisos: true,
  tamanhoTexto: 'normal',
  reduzirAnimacoes: false,
}

const CHAVE_PREFS = 'preferencias-app'

/** Lê do navegador as preferências salvas (ou usa as padrão). */
function carregarPrefs(): Preferencias {
  try {
    const salvo = localStorage.getItem(CHAVE_PREFS)
    return salvo
      ? { ...preferenciasPadrao, ...JSON.parse(salvo) }
      : preferenciasPadrao
  } catch {
    return preferenciasPadrao
  }
}

/** Interruptor liga/desliga reutilizado em várias linhas. */
function Interruptor({
  rotulo,
  descricao,
  ligado,
  onAlternar,
}: {
  rotulo: string
  descricao: string
  ligado: boolean
  onAlternar: () => void
}) {
  return (
    <div className="pref-row">
      <div>
        <strong>{rotulo}</strong>
        <p>{descricao}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label={rotulo}
        className={`switch ${ligado ? 'on' : ''}`}
        onClick={onAlternar}
      >
        <span className="switch-knob" />
      </button>
    </div>
  )
}

function PreferenciasApp({
  prefs,
  onChange,
  onVoltar,
}: {
  prefs: Preferencias
  onChange: (novas: Preferencias) => void
  onVoltar: () => void
}) {
  // Troca só uma preferência e mantém as outras iguais
  const alterar = <K extends keyof Preferencias>(
    chave: K,
    valor: Preferencias[K],
  ) => onChange({ ...prefs, [chave]: valor })

  const tamanhos: { valor: TamanhoTexto; rotulo: string }[] = [
    { valor: 'pequeno', rotulo: 'Pequeno' },
    { valor: 'normal', rotulo: 'Normal' },
    { valor: 'grande', rotulo: 'Grande' },
  ]

  return (
    <div className="tab-container">
      <div className="subtela-header">
        <button className="back-button" type="button" onClick={onVoltar}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div>
          <p className="eyebrow">Personalização</p>
          <h2>Preferências do App</h2>
        </div>
      </div>

      <div className="grid-2-cols">
        <section className="main-card-block">
          <div className="section-heading">
            <h2>Notificações</h2>
          </div>
          <Interruptor
            rotulo="Provas"
            descricao="Lembretes de avaliações marcadas."
            ligado={prefs.notificarProvas}
            onAlternar={() => alterar('notificarProvas', !prefs.notificarProvas)}
          />
          <Interruptor
            rotulo="Trabalhos"
            descricao="Prazos de entrega se aproximando."
            ligado={prefs.notificarTrabalhos}
            onAlternar={() =>
              alterar('notificarTrabalhos', !prefs.notificarTrabalhos)
            }
          />
          <Interruptor
            rotulo="Avisos da escola"
            descricao="Comunicados da direção e dos professores."
            ligado={prefs.notificarAvisos}
            onAlternar={() => alterar('notificarAvisos', !prefs.notificarAvisos)}
          />
        </section>

        <section className="main-card-block">
          <div className="section-heading">
            <h2>Aparência</h2>
          </div>

          <div className="pref-row pref-column">
            <div>
              <strong>Tamanho do texto</strong>
              <p>Aplicado em todo o aplicativo.</p>
            </div>
            <div className="segmented" role="group" aria-label="Tamanho do texto">
              {tamanhos.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  className={prefs.tamanhoTexto === t.valor ? 'active' : ''}
                  onClick={() => alterar('tamanhoTexto', t.valor)}
                >
                  {t.rotulo}
                </button>
              ))}
            </div>
          </div>

          <Interruptor
            rotulo="Reduzir animações"
            descricao="Remove transições e movimentos."
            ligado={prefs.reduzirAnimacoes}
            onAlternar={() => alterar('reduzirAnimacoes', !prefs.reduzirAnimacoes)}
          />

          <button
            type="button"
            className="text-button reset-button"
            onClick={() => onChange(preferenciasPadrao)}
          >
            Restaurar padrão
          </button>
        </section>
      </div>
    </div>
  )
}
/* --- TELA CENTRAL DE AJUDA --- */
type Pergunta = { id: number; pergunta: string; resposta: string }

const perguntas: Pergunta[] = [
  {
    id: 1,
    pergunta: 'Como vejo minhas provas da semana?',
    resposta:
      'Abra a aba Agenda e toque no dia desejado. As provas aparecem em roxo e os trabalhos em coral.',
  },
  {
    id: 2,
    pergunta: 'Onde encontro meu boletim?',
    resposta:
      'Vá em Perfil > Boletim Acadêmico. Lá você vê as notas por bimestre, a média e as faltas de cada disciplina.',
  },
  {
    id: 3,
    pergunta: 'Como desativo as notificações?',
    resposta:
      'Em Perfil > Preferências do App você liga ou desliga os avisos de provas, trabalhos e comunicados.',
  },
  {
    id: 4,
    pergunta: 'Esqueci minha senha. E agora?',
    resposta:
      'Procure a secretaria da escola para redefinir seu acesso. Em breve isso poderá ser feito pelo próprio app.',
  },
  {
    id: 5,
    pergunta: 'As informações do app são oficiais?',
    resposta:
      'Esta é uma versão de demonstração com dados fictícios. Na versão final, os dados virão do sistema da escola.',
  },
]

function CentralAjuda({ onVoltar }: { onVoltar: () => void }) {
  const [busca, setBusca] = useState('')
  const [abertaId, setAbertaId] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState('')
  const [assunto, setAssunto] = useState('Dúvida')
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  // Filtra enquanto o aluno digita (ignora maiúsculas e acentos)
  const normalizar = (t: string) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const filtradas = perguntas.filter((p) =>
    normalizar(p.pergunta + ' ' + p.resposta).includes(normalizar(busca)),
  )

  function enviar() {
    if (mensagem.trim().length < 10) {
      setErro('Escreva pelo menos 10 caracteres para a gente entender.')
      return
    }
    setErro('')
    // TODO: quando existir API, trocar por fetch('/api/suporte', { method: 'POST', ... })
    setEnviado(true)
    setMensagem('')
  }

  return (
    <div className="tab-container">
      <div className="subtela-header">
        <button className="back-button" type="button" onClick={onVoltar}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <div>
          <p className="eyebrow">Suporte</p>
          <h2>Central de Ajuda</h2>
        </div>
      </div>

      <div className="grid-2-cols">
        <section className="main-card-block">
          <div className="section-heading">
            <h2>Perguntas frequentes</h2>
          </div>

          <label className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar uma dúvida..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>

          <div className="faq-list">
            {filtradas.map((p) => {
              const aberta = abertaId === p.id
              return (
                <div className={`faq-item ${aberta ? 'open' : ''}`} key={p.id}>
                  <button
                    type="button"
                    aria-expanded={aberta}
                    onClick={() => setAbertaId(aberta ? null : p.id)}
                  >
                    <span>{p.pergunta}</span>
                    <ChevronDown size={18} />
                  </button>
                  {aberta && <p>{p.resposta}</p>}
                </div>
              )
            })}
            {filtradas.length === 0 && (
              <div className="empty-state">
                <p>Nenhuma resposta encontrada. Fale com a gente ao lado.</p>
              </div>
            )}
          </div>
        </section>

        <section className="main-card-block">
          <div className="section-heading">
            <h2>Fale com a gente</h2>
          </div>

          {enviado ? (
            <div className="empty-state">
              <CheckCircle2 size={40} color="#10b981" />
              <p>Mensagem enviada! Responderemos em até 2 dias úteis.</p>
              <button
                type="button"
                className="text-button"
                onClick={() => setEnviado(false)}
              >
                Enviar outra
              </button>
            </div>
          ) : (
            <div className="contact-form">
              <label htmlFor="assunto">Assunto</label>
              <select
                id="assunto"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
              >
                <option>Dúvida</option>
                <option>Problema técnico</option>
                <option>Sugestão</option>
              </select>

              <label htmlFor="mensagem">Mensagem</label>
              <textarea
                id="mensagem"
                rows={5}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Conte o que aconteceu..."
              />
              {erro && <p className="form-error">{erro}</p>}

              <button className="primary-button" type="button" onClick={enviar}>
                Enviar mensagem <Send size={18} />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
/* --- TELA DE PERFIL --- */
function TelaPerfil({
  onSair,
  prefs,
  onChangePrefs,
}: {
  onSair: () => void
  prefs: Preferencias
  onChangePrefs: (novas: Preferencias) => void
}) {
  const [mostrarBoletim, setMostrarBoletim] = useState(false)
  const [mostrarPreferencias, setMostrarPreferencias] = useState(false)
  const [mostrarAjuda, setMostrarAjuda] = useState(false)   // ← NOVO (1)

  if (mostrarBoletim) {
    return <Boletim onVoltar={() => setMostrarBoletim(false)} />
  }

  if (mostrarPreferencias) {
    return (
      <PreferenciasApp
        prefs={prefs}
        onChange={onChangePrefs}
        onVoltar={() => setMostrarPreferencias(false)}
      />
    )
  }

  if (mostrarAjuda) {                                        // ← NOVO (2)
    return <CentralAjuda onVoltar={() => setMostrarAjuda(false)} />
  }

  return (
    <div className="tab-container">
      <div className="grid-2-cols">
        {/* Cartão com dados do Aluno */}
        <section className="main-card-block profile-box">
          <div className="profile-avatar">G</div>
          <h2>Gabriel Santos</h2>
          <p className="profile-subtitle">3º Ano A • Ensino Médio</p>
          <span className="profile-tag">Matrícula #2026-0982</span>

          <div className="profile-stats-row">
            <div className="stat-pill">
              <strong>75%</strong>
              <span>Organizado</span>
            </div>
            <div className="stat-pill">
              <strong>98%</strong>
              <span>Presença</span>
            </div>
            <div className="stat-pill">
              <strong>9.4</strong>
              <span>Média</span>
            </div>
          </div>
        </section>

        {/* Menu do Aluno e Opções */}
        <section className="main-card-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Minha Conta</p>
              <h2>Configurações do Perfil</h2>
            </div>
          </div>

          <div className="profile-menu-stack">
            <button
              className="menu-row-btn"
              type="button"
              onClick={() => setMostrarBoletim(true)}
            >
              <div className="menu-btn-left">
                <GraduationCap size={20} color="#4f46e5" />
                <span>Boletim Acadêmico</span>
              </div>
              <ChevronRight size={18} color="#9ca3af" />
            </button>

                <button
                className="menu-row-btn"
                type="button"
                onClick={() => setMostrarPreferencias(true)}
              >
                <div className="menu-btn-left">
                  <Settings size={20} color="#4f46e5" />
                  <span>Preferências do App</span>
                </div>
                <ChevronRight size={18} color="#9ca3af" />
              </button>

                <button
                className="menu-row-btn"
                type="button"
                onClick={() => setMostrarAjuda(true)}
              >
                <div className="menu-btn-left">
                  <HelpCircle size={20} color="#4f46e5" />
                  <span>Central de Ajuda</span>
                </div>
                <ChevronRight size={18} color="#9ca3af" />
              </button>

            <button
              className="menu-row-btn logout-row"
              type="button"
              onClick={onSair}
            >
              <div className="menu-btn-left">
                <LogOut size={20} color="#ef4444" />
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Sair da Conta</span>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

/* --- PAINEL PRINCIPAL --- */
function Painel({ sessao, onSair }: { sessao: Sessao; onSair: () => void }) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>(sessao.estado?.aba ?? 'inicio')
  const [diaSelecionado, setDiaSelecionado] = useState(sessao.estado?.dia ?? '18')
  const [prefs, setPrefs] = useState<Preferencias>(carregarPrefs)

  // sempre guarda o valor mais recente para salvar na saída
  const atual = useRef<Estado>({ aba: abaAtiva, dia: diaSelecionado })
  atual.current = { aba: abaAtiva, dia: diaSelecionado }

  // salva quando o usuário fecha ou recarrega a página
  useEffect(() => {
    const aoFechar = () => {
      void salvarEstado(sessao.token, atual.current)
    }
    window.addEventListener('pagehide', aoFechar)
    return () => window.removeEventListener('pagehide', aoFechar)
  }, [sessao.token])

  // salva e encerra a sessão ao clicar em "Sair da Conta"
  async function sair() {
    try {
      await salvarEstado(sessao.token, atual.current)
      await fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessao.token}` },
      })
    } finally {
      onSair()
    }
  }

  // Sempre que as preferências mudam: salva e aplica no app inteiro
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_PREFS, JSON.stringify(prefs))
    } catch {
      /* localStorage indisponível: ignora */
    }
    const tamanhos = { pequeno: '87.5%', normal: '100%', grande: '115%' }
    document.documentElement.style.fontSize = tamanhos[prefs.tamanhoTexto]
    document.documentElement.classList.toggle(
      'reduzir-animacoes',
      prefs.reduzirAnimacoes,
    )
  }, [prefs])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sexta-feira, 17 de outubro</p>
          <h1>Oi, {sessao.nome}!</h1>
        </div>
          <button
          className="icon-button"
          aria-label="Abrir avisos"
          onClick={() => setAbaAtiva('avisos')}
          >
            <Bell size={21} />
            {prefs.notificarAvisos && <span className="notification-dot" />}
          </button>
      </header>

              <main className="dashboard-content">
            {abaAtiva === 'inicio' && <TelaInicio onNavegar={setAbaAtiva} />}
            {abaAtiva === 'agenda' && (
              <TelaAgenda diaSelecionado={diaSelecionado} setDiaSelecionado={setDiaSelecionado} />
            )}
            {abaAtiva === 'avisos' && <TelaAvisos />}
            {abaAtiva === 'perfil' && (
              <TelaPerfil onSair={sair} prefs={prefs} onChangePrefs={setPrefs} />
            )}
          </main>

      {/* NAVEGAÇÃO INFERIOR */}
      <nav className="bottom-nav" aria-label="Navegação principal">
        <button
          className={abaAtiva === 'inicio' ? 'active' : ''}
          type="button"
          onClick={() => setAbaAtiva('inicio')}
        >
          <Home size={20} />
          <span>Início</span>
        </button>

        <button
          className={abaAtiva === 'agenda' ? 'active' : ''}
          type="button"
          onClick={() => setAbaAtiva('agenda')}
        >
          <CalendarDays size={20} />
          <span>Agenda</span>
        </button>

        <button
          className={abaAtiva === 'avisos' ? 'active' : ''}
          type="button"
          onClick={() => setAbaAtiva('avisos')}
        >
          <Bell size={20} />
          <span>Avisos</span>
        </button>

        <button
          className={abaAtiva === 'perfil' ? 'active' : ''}
          type="button"
          onClick={() => setAbaAtiva('perfil')}
        >
          <UserRound size={20} />
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  )
}

export default function App() {
  const [sessao, setSessao] = useState<Sessao | null>(null)

  return sessao ? (
    <Painel sessao={sessao} onSair={() => setSessao(null)} />
  ) : (
    <Login onEntrar={setSessao} />
  )
}