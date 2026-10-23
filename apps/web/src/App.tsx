import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Ajuda, Boletim, MenuPerfil, PreferenciasPagina, type SubpaginaPerfil } from './student/PaginasPerfil'
import { carregarPreferencias, salvarPreferencias, type Preferencias } from './preferences/preferencias'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  LogOut,
  Megaphone,
  NotebookTabs,
  UserRound,
} from 'lucide-react'

type Aba = 'inicio' | 'agenda' | 'avisos' | 'perfil'
type Tom = 'azul' | 'coral' | 'amarelo' | 'verde'

type Compromisso = {
  id: number
  tipo: 'Prova' | 'Trabalho' | 'Atividade'
  titulo: string
  disciplina: string
  quando: string
  detalhe: string
  tom: Tom
}

type Aviso = {
  id: number
  origem: string
  titulo: string
  resumo: string
  quando: string
  tom: Tom
}

const compromissos: Compromisso[] = [
  {
    id: 1,
    tipo: 'Prova',
    titulo: 'Funções do 2º grau',
    disciplina: 'Matemática',
    quando: 'Amanhã, 8h',
    detalhe: 'Capítulos 4 e 5 do livro',
    tom: 'coral',
  },
  {
    id: 2,
    tipo: 'Trabalho',
    titulo: 'Modernismo brasileiro',
    disciplina: 'Português',
    quando: 'Sexta, 23h59',
    detalhe: 'Enviar o arquivo em PDF',
    tom: 'azul',
  },
  {
    id: 3,
    tipo: 'Atividade',
    titulo: 'Lista sobre leis de Newton',
    disciplina: 'Física',
    quando: 'Segunda, 10h',
    detalhe: 'Questões 1 a 12',
    tom: 'amarelo',
  },
]

const avisos: Aviso[] = [
  {
    id: 1,
    origem: 'Direção',
    titulo: 'Feira de ciências confirmada',
    resumo: 'As inscrições dos projetos começam na próxima segunda-feira.',
    quando: 'Hoje, 10h20',
    tom: 'amarelo',
  },
  {
    id: 2,
    origem: 'Prof. Ricardo · Física',
    titulo: 'Gabarito da lista disponível',
    resumo: 'O material de revisão já pode ser consultado pela turma.',
    quando: 'Ontem, 14h20',
    tom: 'azul',
  },
]

const navegacao: Array<{
  id: Aba
  rotulo: string
  Icone: typeof Home
}> = [
  { id: 'inicio', rotulo: 'Início', Icone: Home },
  { id: 'agenda', rotulo: 'Agenda', Icone: CalendarDays },
  { id: 'avisos', rotulo: 'Avisos', Icone: Bell },
  { id: 'perfil', rotulo: 'Perfil', Icone: UserRound },
]

function Marca() {
  return (
    <div className="marca" aria-label="Projeto de Extensão">
      <span className="marca-simbolo" aria-hidden="true">
        <NotebookTabs size={22} strokeWidth={2.2} />
      </span>
      <span>
        <strong>Projeto de Extensão</strong>
        <small>agenda escolar</small>
      </span>
    </div>
  )
}

function Login({ onEntrar }: { onEntrar: () => void }) {
  const [mostrarSenha, setMostrarSenha] = useState(false)

  useEffect(() => {
    document.title = 'Entrar — Projeto de Extensão'
  }, [])

  function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onEntrar()
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-label="Apresentação">
        <Marca />
        <div className="login-manifesto">
          <span className="etiqueta-destaque">Tudo da escola em um lugar</span>
          <h1>Menos mensagem perdida. Mais tempo pra estudar.</h1>
          <p>
            Provas, trabalhos e avisos organizados do jeito que o aluno realmente
            precisa ver.
          </p>
        </div>

        <div className="folha-resumo" aria-hidden="true">
          <span className="folha-furo" />
          <span className="folha-furo" />
          <span className="folha-furo" />
          <p>AMANHÃ</p>
          <strong>Prova de matemática</strong>
          <span>8h · Funções do 2º grau</span>
          <i>revisar capítulos 4 e 5</i>
        </div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-mobile">
          <Marca />
        </div>
        <p className="sobretitulo">Área do aluno</p>
        <h2 id="login-title">Bora organizar sua semana?</h2>
        <p className="texto-apoio">Entre com os dados usados na sua escola.</p>

        <form className="login-form" onSubmit={entrar} noValidate>
          <div className="campo">
            <label htmlFor="email">E-mail ou matrícula</label>
            <input
              id="email"
              name="email"
              autoComplete="username"
              defaultValue="aluno@escola.com"
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <div className="campo-senha">
              <input
                id="senha"
                name="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                defaultValue="prototipo"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((valor) => !valor)}
                aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button className="botao-principal" type="submit">
            Entrar <ArrowRight size={19} />
          </button>
        </form>

        <p className="nota-prototipo">
          Protótipo: os dados acima são apenas para demonstração.
        </p>
      </section>
    </main>
  )
}

function Navegacao({ aba, onNavegar }: { aba: Aba; onNavegar: (aba: Aba) => void }) {
  return (
    <nav className="navegacao" aria-label="Navegação principal">
      <div className="navegacao-marca">
        <Marca />
      </div>
      <div className="navegacao-itens">
        {navegacao.map(({ id, rotulo, Icone }) => (
          <button
            className={aba === id ? 'ativo' : ''}
            type="button"
            key={id}
            onClick={() => onNavegar(id)}
            aria-current={aba === id ? 'page' : undefined}
          >
            <Icone size={21} />
            <span>{rotulo}</span>
            {id === 'avisos' && <b aria-label="2 avisos não lidos">2</b>}
          </button>
        ))}
      </div>
    </nav>
  )
}

function Cabecalho({ aba, onAbrirAvisos }: { aba: Aba; onAbrirAvisos: () => void }) {
  const data = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    [],
  )

  const titulos: Record<Aba, string> = {
    inicio: 'Oi, Gabriel!',
    agenda: 'Minha agenda',
    avisos: 'Avisos da escola',
    perfil: 'Meu perfil',
  }

  return (
    <header className="cabecalho">
      <div>
        <p>{aba === 'inicio' ? data : 'Área do aluno'}</p>
        <h1>{titulos[aba]}</h1>
      </div>
      <button className="botao-icone" type="button" onClick={onAbrirAvisos} aria-label="Abrir avisos">
        <Bell size={21} />
        <span aria-hidden="true">2</span>
      </button>
    </header>
  )
}

function CartaoCompromisso({ item, onAbrir }: { item: Compromisso; onAbrir?: () => void }) {
  return (
    <article className={`compromisso compromisso-${item.tom}`}>
      <div className="compromisso-data" aria-hidden="true">
        <span>{item.tipo}</span>
        <strong>{item.disciplina.slice(0, 3).toUpperCase()}</strong>
      </div>
      <div className="compromisso-conteudo">
        <span className="etiqueta-materia">{item.disciplina}</span>
        <h3>{item.titulo}</h3>
        <p>{item.detalhe}</p>
        <span className="prazo">
          <Clock3 size={15} /> {item.quando}
        </span>
      </div>
      {onAbrir && (
        <button type="button" onClick={onAbrir} aria-label={`Abrir ${item.titulo}`}>
          <ChevronRight size={20} />
        </button>
      )}
    </article>
  )
}

function Inicio({ onNavegar }: { onNavegar: (aba: Aba) => void }) {
  return (
    <div className="pagina pagina-inicio">
      <section className="faixa-dia" aria-labelledby="resumo-title">
        <div>
          <span className="faixa-indice">HOJE</span>
          <h2 id="resumo-title">Seu dia está tranquilo.</h2>
          <p>Nada vence hoje. A próxima prova é amanhã às 8h.</p>
        </div>
        <button type="button" onClick={() => onNavegar('agenda')}>
          Ver agenda <ArrowRight size={18} />
        </button>
      </section>

      <section className="atalhos" aria-label="Resumo da semana">
        <button type="button" onClick={() => onNavegar('agenda')}>
          <span className="atalho-icone azul"><BookOpen size={22} /></span>
          <span><strong>3</strong><small>compromissos</small></span>
        </button>
        <button type="button" onClick={() => onNavegar('avisos')}>
          <span className="atalho-icone amarelo"><Megaphone size={22} /></span>
          <span><strong>2</strong><small>avisos novos</small></span>
        </button>
        <div className="atalho-concluido">
          <span className="atalho-icone verde"><Check size={22} /></span>
          <span><strong>4</strong><small>já concluídos</small></span>
        </div>
      </section>

      <section className="bloco-conteudo" aria-labelledby="proximos-title">
        <div className="titulo-secao">
          <div>
            <span>PRÓXIMOS PASSOS</span>
            <h2 id="proximos-title">O que vem por aí</h2>
          </div>
          <button type="button" onClick={() => onNavegar('agenda')}>Ver tudo</button>
        </div>
        <div className="lista-compromissos">
          {compromissos.slice(0, 2).map((item) => (
            <CartaoCompromisso key={item.id} item={item} onAbrir={() => onNavegar('agenda')} />
          ))}
        </div>
      </section>

      <aside className="dica-estudo">
        <GraduationCap size={24} />
        <div>
          <strong>Uma coisa de cada vez.</strong>
          <p>Comece pela prova de amanhã e depois revise o trabalho de português.</p>
        </div>
      </aside>
    </div>
  )
}

function Agenda() {
  return (
    <div className="pagina">
      <section className="resumo-pagina">
        <span>SEMANA ATUAL</span>
        <h2>3 coisas para resolver</h2>
        <p>Organizadas pela data mais próxima.</p>
      </section>
      <section className="bloco-conteudo" aria-labelledby="agenda-lista-title">
        <div className="titulo-secao">
          <div>
            <span>AGENDA</span>
            <h2 id="agenda-lista-title">Provas e entregas</h2>
          </div>
        </div>
        <div className="lista-compromissos">
          {compromissos.map((item) => (
            <CartaoCompromisso key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Avisos() {
  const [lidos, setLidos] = useState<number[]>([])

  return (
    <div className="pagina">
      <section className="resumo-pagina resumo-avisos">
        <span>MURAL DA ESCOLA</span>
        <h2>2 avisos novos</h2>
        <p>Comunicados da direção e dos seus professores.</p>
      </section>
      <section className="mural" aria-label="Lista de avisos">
        {avisos.map((aviso) => {
          const lido = lidos.includes(aviso.id)
          return (
            <article className={`aviso aviso-${aviso.tom} ${lido ? 'lido' : ''}`} key={aviso.id}>
              <div className="aviso-topo">
                <span>{aviso.origem}</span>
                {!lido && <i>Novo</i>}
              </div>
              <h2>{aviso.titulo}</h2>
              <p>{aviso.resumo}</p>
              <footer>
                <span>{aviso.quando}</span>
                <button type="button" onClick={() => setLidos((atuais) => [...atuais, aviso.id])} disabled={lido}>
                  {lido ? 'Lido' : 'Marcar como lido'}
                </button>
              </footer>
            </article>
          )
        })}
      </section>
    </div>
  )
}

function Perfil({ onSair, onAbrir }: { onSair: () => void; onAbrir: (pagina: SubpaginaPerfil) => void }) {
  return (
    <div className="pagina">
      <section className="perfil-cartao">
        <div className="perfil-avatar" aria-hidden="true">G</div>
        <div>
          <span>ALUNO</span>
          <h2>Gabriel Santos</h2>
          <p>3º ano A · Ensino médio</p>
        </div>
      </section>

      <section className="bloco-conteudo" aria-labelledby="conta-title">
        <div className="titulo-secao">
          <div>
            <span>CONTA</span>
            <h2 id="conta-title">Seus dados</h2>
          </div>
        </div>
        <dl className="dados-aluno">
          <div><dt>Matrícula</dt><dd>2026-0982</dd></div>
          <div><dt>Turma</dt><dd>3º ano A</dd></div>
          <div><dt>Turno</dt><dd>Matutino</dd></div>
        </dl>
      </section>

      <MenuPerfil onAbrir={onAbrir} />
      <button className="botao-sair" type="button" onClick={onSair}>
        <LogOut size={19} /> Sair da demonstração
      </button>
    </div>
  )
}

function Painel({ onSair }: { onSair: () => void }) {
  const [aba, setAba] = useState<Aba>('inicio')
  const [subpagina, setSubpagina] = useState<SubpaginaPerfil | null>(null)
  const [preferencias, setPreferencias] = useState<Preferencias>(() => carregarPreferencias(typeof window === 'undefined' ? null : window.localStorage))

  useEffect(() => {
    salvarPreferencias(window.localStorage, preferencias)
    document.documentElement.classList.toggle('texto-maior', preferencias.tamanhoTexto === 'grande')
    document.documentElement.classList.toggle('reduzir-animacoes', preferencias.reduzirAnimacoes)
  }, [preferencias])

  function navegar(destino: Aba) {
    setAba(destino)
    setSubpagina(null)
  }

  useEffect(() => {
    const nomes: Record<Aba, string> = {
      inicio: 'Início',
      agenda: 'Agenda',
      avisos: 'Avisos',
      perfil: 'Perfil',
    }
    document.title = `${subpagina === 'boletim' ? 'Meu boletim' : subpagina === 'preferencias' ? 'Preferências' : subpagina === 'ajuda' ? 'Central de ajuda' : nomes[aba]} — Projeto de Extensão`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [aba, subpagina])

  return (
    <div className="app-layout">
      <Navegacao aba={aba} onNavegar={navegar} />
      <div className="conteudo-layout">
        <Cabecalho aba={aba} onAbrirAvisos={() => navegar('avisos')} />
        <main className="conteudo-principal">
          {subpagina === 'boletim' && <Boletim onVoltar={() => setSubpagina(null)} />}
          {subpagina === 'preferencias' && <PreferenciasPagina preferencias={preferencias} onAlterar={setPreferencias} onVoltar={() => setSubpagina(null)} />}
          {subpagina === 'ajuda' && <Ajuda onVoltar={() => setSubpagina(null)} />}
          {!subpagina && aba === 'inicio' && <Inicio onNavegar={navegar} />}
          {!subpagina && aba === 'agenda' && <Agenda />}
          {!subpagina && aba === 'avisos' && <Avisos />}
          {!subpagina && aba === 'perfil' && <Perfil onSair={onSair} onAbrir={setSubpagina} />}
        </main>
      </div>
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
