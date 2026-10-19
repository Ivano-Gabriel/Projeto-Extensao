import { useState } from 'react'
import {
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
} from 'lucide-react'

type Aba = 'inicio' | 'agenda' | 'avisos' | 'perfil'

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

function Login({ onEntrar }: { onEntrar: () => void }) {
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">
          P
        </div>
        <p className="eyebrow">Projeto de Extensão</p>
        <h1 id="login-title">Sua escola, no seu ritmo.</h1>
        <p className="login-copy">
          Veja provas, entregas e avisos sem precisar procurar em cinco lugares.
        </p>

        <label htmlFor="email">Matrícula escolar</label>
        <input id="email" type="email" defaultValue="aluno@escola.com" />

        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" defaultValue="prototipo" />

        <button className="primary-button" type="button" onClick={onEntrar}>
          Entrar como aluno <ArrowRight size={19} />
        </button>
        <p className="prototype-note">Demonstração: nenhuma senha é enviada.</p>
      </section>
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
function TelaAgenda() {
  const [diaSelecionado, setDiaSelecionado] = useState('18')

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

/* --- TELA DE PERFIL --- */
function TelaPerfil({ onSair }: { onSair: () => void }) {
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
            <button className="menu-row-btn" type="button">
              <div className="menu-btn-left">
                <GraduationCap size={20} color="#4f46e5" />
                <span>Boletim Acadêmico</span>
              </div>
              <ChevronRight size={18} color="#9ca3af" />
            </button>

            <button className="menu-row-btn" type="button">
              <div className="menu-btn-left">
                <Settings size={20} color="#4f46e5" />
                <span>Preferências do App</span>
              </div>
              <ChevronRight size={18} color="#9ca3af" />
            </button>

            <button className="menu-row-btn" type="button">
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
function Painel({ onSair }: { onSair: () => void }) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('inicio')

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sexta-feira, 17 de outubro</p>
          <h1>Oi, Gabriel!</h1>
        </div>
        <button
          className="icon-button"
          aria-label="Abrir avisos"
          onClick={() => setAbaAtiva('avisos')}
        >
          <Bell size={21} />
          <span className="notification-dot" />
        </button>
      </header>

      <main className="dashboard-content">
        {abaAtiva === 'inicio' && <TelaInicio onNavegar={setAbaAtiva} />}
        {abaAtiva === 'agenda' && <TelaAgenda />}
        {abaAtiva === 'avisos' && <TelaAvisos />}
        {abaAtiva === 'perfil' && <TelaPerfil onSair={onSair} />}
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
  const [autenticado, setAutenticado] = useState(false)

  return autenticado ? (
    <Painel onSair={() => setAutenticado(false)} />
  ) : (
    <Login onEntrar={() => setAutenticado(true)} />
  )
}