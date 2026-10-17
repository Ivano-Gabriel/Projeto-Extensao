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
} from 'lucide-react'

type Compromisso = {
  tipo: 'Prova' | 'Trabalho' | 'Aviso'
  titulo: string
  disciplina: string
  quando: string
  cor: 'roxo' | 'coral' | 'amarelo'
}

const compromissos: Compromisso[] = [
  {
    tipo: 'Prova',
    titulo: 'Funções do 2º grau',
    disciplina: 'Matemática',
    quando: 'Amanhã, 8h',
    cor: 'roxo',
  },
  {
    tipo: 'Trabalho',
    titulo: 'Modernismo brasileiro',
    disciplina: 'Português',
    quando: 'Sexta, 23h59',
    cor: 'coral',
  },
  {
    tipo: 'Aviso',
    titulo: 'Feira de ciências confirmada',
    disciplina: 'Direção',
    quando: 'Publicado hoje',
    cor: 'amarelo',
  },
]

function Login({ onEntrar }: { onEntrar: () => void }) {
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">
          P
        </div>
        <p className="eyebrow">Pulso Escolar</p>
        <h1 id="login-title">Sua escola, no seu ritmo.</h1>
        <p className="login-copy">
          Veja provas, entregas e avisos sem precisar procurar em cinco lugares.
        </p>

        <label htmlFor="email">E-mail escolar</label>
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

function Painel() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sexta-feira, 17 de outubro</p>
          <h1>Oi, Gabriel!</h1>
        </div>
        <button className="icon-button" aria-label="Abrir notificações">
          <Bell size={21} />
          <span className="notification-dot" />
        </button>
      </header>

      <main className="dashboard">
        <section className="week-radar" aria-labelledby="radar-title">
          <div>
            <p className="eyebrow radar-eyebrow">Radar da semana</p>
            <h2 id="radar-title">Você está quase em dia.</h2>
            <p>Uma prova amanhã e um trabalho para sexta.</p>
          </div>
          <div className="progress-ring" aria-label="75% da semana organizada">
            <strong>75%</strong>
            <span>organizada</span>
          </div>
        </section>

        <section className="summary-grid" aria-label="Resumo de hoje">
          <article className="summary-card purple-card">
            <BookOpenCheck size={22} />
            <strong>2</strong>
            <span>pendências</span>
          </article>
          <article className="summary-card yellow-card">
            <CalendarDays size={22} />
            <strong>1</strong>
            <span>prova próxima</span>
          </article>
          <article className="summary-card green-card">
            <Check size={22} />
            <strong>4</strong>
            <span>concluídas</span>
          </article>
        </section>

        <section className="agenda-section" aria-labelledby="agenda-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Próximos passos</p>
              <h2 id="agenda-title">Sua agenda</h2>
            </div>
            <button className="text-button" type="button">
              Ver tudo <ArrowRight size={17} />
            </button>
          </div>

          <div className="commitment-list">
            {compromissos.map((item) => (
              <article className="commitment-card" key={item.titulo}>
                <span className={`commitment-stripe ${item.cor}`} />
                <div className="commitment-content">
                  <div className="commitment-meta">
                    <span>{item.tipo}</span>
                    <span>{item.disciplina}</span>
                  </div>
                  <h3>{item.titulo}</h3>
                  <p>
                    <Clock3 size={16} /> {item.quando}
                  </p>
                </div>
                <button aria-label={`Abrir ${item.titulo}`} className="open-item">
                  <ArrowRight size={18} />
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        <button className="active" type="button">
          <Home size={20} />
          <span>Início</span>
        </button>
        <button type="button">
          <CalendarDays size={20} />
          <span>Agenda</span>
        </button>
        <button type="button">
          <Bell size={20} />
          <span>Avisos</span>
        </button>
        <button type="button">
          <UserRound size={20} />
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  )
}

export default function App() {
  const [autenticado, setAutenticado] = useState(false)

  return autenticado ? <Painel /> : <Login onEntrar={() => setAutenticado(true)} />
}

