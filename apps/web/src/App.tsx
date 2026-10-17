import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  Clock3,
  Database,
  Home,
  LogOut,
  UserRound,
} from 'lucide-react'
import Backend from './Backend'
import { corDoTipo, formatarQuando, ordenar, resumo, useCompromissos, type Banco } from './backend/banco'
import type { Compromisso } from './backend/tipos'
import './funcoes.css'

type Tela = 'inicio' | 'agenda' | 'avisos' | 'perfil'
type Filtro = 'Todos' | 'Prova' | 'Trabalho' | 'Aviso'

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

function Cartao({ item, onAbrir }: { item: Compromisso; onAbrir: (id: number) => void }) {
  return (
    <article className={`commitment-card ${item.status === 'concluido' ? 'feito' : ''}`}>
      <span className={`commitment-stripe ${corDoTipo(item.tipo)}`} />
      <div className="commitment-content">
        <div className="commitment-meta">
          <span>{item.tipo}</span>
          <span>{item.disciplina}</span>
        </div>
        <h3>{item.titulo}</h3>
        <p>
          <Clock3 size={16} /> {formatarQuando(item.quando)}
        </p>
      </div>
      <button aria-label={`Abrir ${item.titulo}`} className="open-item" type="button" onClick={() => onAbrir(item.id)}>
        <ArrowRight size={18} />
      </button>
    </article>
  )
}

function Lista({ itens, onAbrir, vazio }: { itens: Compromisso[]; onAbrir: (id: number) => void; vazio: string }) {
  if (itens.length === 0) return <p className="empty-note">{vazio}</p>
  return (
    <div className="commitment-list">
      {itens.map((item) => (
        <Cartao key={item.id} item={item} onAbrir={onAbrir} />
      ))}
    </div>
  )
}

function Ficha({ item, banco, onFechar }: { item: Compromisso; banco: Banco; onFechar: () => void }) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  const feito = item.status === 'concluido'
  const rotulo = item.tipo === 'Aviso' ? (feito ? 'Marcar como não lido' : 'Marcar como lido') : feito ? 'Reabrir' : 'Marcar como concluído'

  return (
    <div className="sheet-backdrop" onClick={onFechar}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={item.titulo} onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">{item.tipo} · {item.disciplina}</p>
        <h2>{item.titulo}</h2>
        <p><Clock3 size={15} /> {formatarQuando(item.quando)}</p>
        <p>Status: {feito ? 'concluído' : 'pendente'}</p>
        <div className="sheet-actions">
          <button className="primary-button" type="button" onClick={() => { banco.alternarConcluido(item.id); onFechar() }}>
            {rotulo}
          </button>
          <button
            className="danger-button"
            type="button"
            onClick={() => {
              if (window.confirm(`Excluir "${item.titulo}"?`)) {
                banco.excluir(item.id)
                onFechar()
              }
            }}
          >
            Excluir
          </button>
          <button className="secondary-button" type="button" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function Painel({ banco, onSair, onBackend }: { banco: Banco; onSair: () => void; onBackend: () => void }) {
  const [tela, setTela] = useState<Tela>('inicio')
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const [abertoId, setAbertoId] = useState<number | null>(null)

  const r = resumo(banco.itens)
  const aberto = banco.itens.find((i) => i.id === abertoId) ?? null
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dataTopo = hoje.charAt(0).toUpperCase() + hoje.slice(1)
  const proximos = ordenar(banco.itens.filter((i) => i.status === 'pendente')).slice(0, 3)
  const agenda = ordenar(banco.itens).filter((i) => filtro === 'Todos' || i.tipo === filtro)
  const avisos = ordenar(banco.itens.filter((i) => i.tipo === 'Aviso')).reverse()

  const titulos: Record<Tela, string> = { inicio: 'Oi, Gabriel!', agenda: 'Agenda', avisos: 'Avisos', perfil: 'Perfil' }
  const menu: { id: Tela; nome: string; icone: typeof Home }[] = [
    { id: 'inicio', nome: 'Início', icone: Home },
    { id: 'agenda', nome: 'Agenda', icone: CalendarDays },
    { id: 'avisos', nome: 'Avisos', icone: Bell },
    { id: 'perfil', nome: 'Perfil', icone: UserRound },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{dataTopo}</p>
          <h1>{titulos[tela]}</h1>
        </div>
        <button className="icon-button" type="button" aria-label="Abrir notificações" onClick={() => setTela('avisos')}>
          <Bell size={21} />
          {r.avisosNaoLidos > 0 && <span className="notification-dot" />}
        </button>
      </header>

      <main className="dashboard">
        {tela === 'inicio' && (
          <>
            <section className="week-radar" aria-labelledby="radar-title">
              <div>
                <p className="eyebrow radar-eyebrow">Radar da semana</p>
                <h2 id="radar-title">{r.pendencias === 0 ? 'Tudo em dia!' : 'Você está quase em dia.'}</h2>
                <p>
                  {r.pendencias === 0
                    ? 'Nenhuma pendência por agora.'
                    : `${r.provasPendentes} prova(s) e ${r.trabalhosPendentes} trabalho(s) pendentes.`}
                </p>
              </div>
              <div className="progress-ring" aria-label={`${r.organizada}% da semana organizada`}>
                <strong>{r.organizada}%</strong>
                <span>organizada</span>
              </div>
            </section>

            <section className="summary-grid" aria-label="Resumo de hoje">
              <article className="summary-card purple-card">
                <BookOpenCheck size={22} />
                <strong>{r.pendencias}</strong>
                <span>pendências</span>
              </article>
              <article className="summary-card yellow-card">
                <CalendarDays size={22} />
                <strong>{r.provasProximas}</strong>
                <span>prova próxima</span>
              </article>
              <article className="summary-card green-card">
                <Check size={22} />
                <strong>{r.concluidas}</strong>
                <span>concluídas</span>
              </article>
            </section>

            <section className="agenda-section" aria-labelledby="agenda-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Próximos passos</p>
                  <h2 id="agenda-title">Sua agenda</h2>
                </div>
                <button className="text-button" type="button" onClick={() => setTela('agenda')}>
                  Ver tudo <ArrowRight size={17} />
                </button>
              </div>
              <Lista itens={proximos} onAbrir={setAbertoId} vazio="Nada pendente. Aproveite!" />
            </section>
          </>
        )}

        {tela === 'agenda' && (
          <section aria-label="Agenda completa">
            <div className="chips">
              {(['Todos', 'Prova', 'Trabalho', 'Aviso'] as Filtro[]).map((f) => (
                <button key={f} type="button" className={`chip ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
                  {f === 'Todos' ? 'Todos' : `${f}s`}
                </button>
              ))}
            </div>
            <Lista itens={agenda} onAbrir={setAbertoId} vazio="Nenhum item nesse filtro." />
          </section>
        )}

        {tela === 'avisos' && (
          <section aria-label="Avisos">
            <Lista itens={avisos} onAbrir={setAbertoId} vazio="Nenhum aviso por enquanto." />
          </section>
        )}

        {tela === 'perfil' && (
          <section className="profile-card" aria-label="Perfil">
            <h2>Gabriel</h2>
            <p>aluno@escola.com</p>
            <button className="secondary-button" type="button" onClick={onBackend}>
              <Database size={16} /> Painel do backend
            </button>
            <button className="danger-button" type="button" onClick={onSair}>
              <LogOut size={16} /> Sair
            </button>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {menu.map(({ id, nome, icone: Icone }) => (
          <button key={id} className={tela === id ? 'active' : ''} type="button" onClick={() => setTela(id)}>
            <Icone size={20} />
            <span>{nome}</span>
          </button>
        ))}
      </nav>

      {aberto && <Ficha item={aberto} banco={banco} onFechar={() => setAbertoId(null)} />}
    </div>
  )
}

export default function App() {
  const banco = useCompromissos()
  const [autenticado, setAutenticado] = useState(false)
  const [noBackend, setNoBackend] = useState(false)

  const tela = !autenticado ? (
    <Login onEntrar={() => setAutenticado(true)} />
  ) : noBackend ? (
    <Backend banco={banco} onVoltar={() => setNoBackend(false)} />
  ) : (
    <Painel banco={banco} onSair={() => setAutenticado(false)} onBackend={() => setNoBackend(true)} />
  )

  return (
    <>
      {banco.erro && (
        <div className="api-erro" role="alert">
          {banco.erro}
        </div>
      )}
      {tela}
    </>
  )
}
