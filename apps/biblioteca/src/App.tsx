import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, BookMarked, BookOpen, CalendarDays, Check,
  ChevronRight, CircleHelp, Clock3, Home, Info, LibraryBig, RotateCcw,
  Search, SlidersHorizontal, X,
} from 'lucide-react'
import { categorias, livros, type Livro, type Categoria } from './dados/livros'
import { filtrarLivros, quantidadeDisponivel, resumoCatalogo } from './logica/catalogo'
import {
  carregarEmprestimos, dataPrevista, devolverLivro, emprestarLivro,
  salvarEmprestimos, type Emprestimo,
} from './logica/emprestimos'

type Tela = 'inicio' | 'acervo' | 'meus' | 'sobre'
type CategoriaFiltro = 'Todas' | Categoria

const navegacao = [
  { id: 'inicio', nome: 'Início', Icone: Home },
  { id: 'acervo', nome: 'Acervo', Icone: LibraryBig },
  { id: 'meus', nome: 'Meus livros', Icone: BookMarked },
  { id: 'sobre', nome: 'Sobre', Icone: CircleHelp },
] as const

function Marca() {
  return (
    <div className="marca" aria-label="Projeto de Extensão, biblioteca">
      <span className="marca-simbolo" aria-hidden="true"><BookOpen size={23} strokeWidth={2.2} /></span>
      <span className="marca-nomes">
        <strong>Projeto de Extensão</strong>
        <small>Biblioteca escolar</small>
      </span>
    </div>
  )
}

function CapaLivro({ livro, grande = false }: { livro: Livro; grande?: boolean }) {
  return (
    <div className={`capa capa-${livro.capa}${grande ? ' capa-grande' : ''}`} aria-hidden="true">
      <div className="capa-fio" />
      <div className="capa-conteudo">
        <span className="capa-etiqueta">{livro.etiqueta}</span>
        <strong>{livro.titulo}</strong>
        <small>{livro.autor}</small>
      </div>
      <span className="capa-ornamento" />
      <span className="capa-lombada" />
    </div>
  )
}

function EstadoLivro({ livro, emprestimos }: { livro: Livro; emprestimos: readonly Emprestimo[] }) {
  const disponiveis = quantidadeDisponivel(livro, emprestimos)
  return (
    <span className={`estado-livro ${disponiveis > 0 ? 'estado-disponivel' : 'estado-indisponivel'}`}>
      <span className="estado-ponto" aria-hidden="true" />
      {disponiveis > 0 ? `${disponiveis} ${disponiveis === 1 ? 'exemplar' : 'exemplares'}` : 'Indisponível'}
    </span>
  )
}

function LivroCard({ livro, emprestimos, onAbrir }: {
  livro: Livro
  emprestimos: readonly Emprestimo[]
  onAbrir: (livro: Livro) => void
}) {
  return (
    <article className="livro-card">
      <button className="livro-card-principal" type="button" onClick={() => onAbrir(livro)}
        aria-label={`Ver detalhes de ${livro.titulo}, de ${livro.autor}`}>
        <CapaLivro livro={livro} />
        <span className="livro-meta">{livro.categoria}</span>
        <h3>{livro.titulo}</h3>
        <p>{livro.autor}</p>
      </button>
      <div className="livro-card-rodape">
        <EstadoLivro livro={livro} emprestimos={emprestimos} />
        <button type="button" onClick={() => onAbrir(livro)} aria-label={`Abrir ${livro.titulo}`}>
          <ChevronRight size={20} />
        </button>
      </div>
    </article>
  )
}

function TituloSecao({ etiqueta, titulo, acao }: {
  etiqueta: string
  titulo: string
  acao?: ReactNode
}) {
  return (
    <div className="titulo-secao">
      <div><span>{etiqueta}</span><h2>{titulo}</h2></div>
      {acao}
    </div>
  )
}

function Inicio({ emprestimos, irAcervo, irCategoria, abrirLivro }: {
  emprestimos: readonly Emprestimo[]
  irAcervo: () => void
  irCategoria: (categoria: CategoriaFiltro) => void
  abrirLivro: (livro: Livro) => void
}) {
  const resumo = resumoCatalogo(livros, emprestimos)
  const recomendado = livros[1]
  return (
    <div className="pagina inicio">
      <section className="hero">
        <div className="hero-texto">
          <span className="hero-selo"><span aria-hidden="true">✳</span> PROPOSTA 02 · BIBLIOTECA</span>
          <h1>Uma boa história começa <mark>aqui.</mark></h1>
          <p>Encontre livros, descubra novas histórias e experimente como seria pegar um título na biblioteca da escola</p>
          <button className="botao-principal hero-acao" type="button" onClick={irAcervo}>
            Explorar o acervo <ArrowRight size={19} />
          </button>
          <span className="hero-anotacao">feito pra você encontrar sua próxima leitura ↗</span>
        </div>
        <div className="hero-destaque">
          <div className="hero-papel" aria-hidden="true"><span>LEITURA DA SEMANA</span><i>uma dica pra começar</i></div>
          <button className="hero-livro" type="button" onClick={() => abrirLivro(recomendado)}
            aria-label={`Conhecer o livro ${recomendado.titulo}`}>
            <CapaLivro livro={recomendado} grande />
            <span className="hero-livro-legenda">Nossa indicação <ArrowRight size={17} /></span>
          </button>
        </div>
      </section>

      <div className="demo-nota" role="note"><Info size={19} />
        <span><strong>Isso é uma demonstração.</strong> Os livros e a disponibilidade são exemplos, não dados da escola</span>
      </div>

      <section className="resumo-blocos" aria-label="Resumo do acervo fictício">
        <div><span className="resumo-icone resumo-azul"><BookOpen size={22} /></span><strong>{resumo.titulos}</strong><small>Títulos no acervo</small></div>
        <div><span className="resumo-icone resumo-verde"><Check size={22} /></span><strong>{resumo.disponiveis}</strong><small>Títulos disponíveis</small></div>
        <div><span className="resumo-icone resumo-amarelo"><BookMarked size={22} /></span><strong>{resumo.meusEmprestimos}</strong><small>Na minha lista</small></div>
      </section>

      <section className="sessao" aria-label="Explorar por assunto">
        <TituloSecao etiqueta="ESCOLHA SEU CAMINHO" titulo="O que você quer ler?" />
        <div className="trilhas">
          {(['Literatura', 'Ciências', 'História', 'Tecnologia', 'Humanas'] as const).map((categoria, indice) => (
            <button className={`trilha trilha-${indice}`} type="button" key={categoria} onClick={() => irCategoria(categoria)}>
              <span className="trilha-numero">0{indice + 1}</span>
              <strong>{categoria}</strong>
              <ArrowRight size={21} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="sessao" aria-label="Livros em destaque">
        <TituloSecao etiqueta="PRA COMEÇAR" titulo="Dá uma olhada nesses aqui"
          acao={<button type="button" className="botao-link" onClick={irAcervo}>Ver todos <ArrowRight size={17} /></button>} />
        <div className="livro-grade">
          {livros.filter((livro) => livro.destaque).concat(livros[5]).slice(0, 4).map((livro) =>
            <LivroCard key={livro.id} livro={livro} emprestimos={emprestimos} onAbrir={abrirLivro} />)}
        </div>
      </section>
    </div>
  )
}

function Acervo({ emprestimos, busca, setBusca, categoria, setCategoria, soDisponiveis, setSoDisponiveis, abrirLivro }: {
  emprestimos: readonly Emprestimo[]
  busca: string
  setBusca: (valor: string) => void
  categoria: CategoriaFiltro
  setCategoria: (categoria: CategoriaFiltro) => void
  soDisponiveis: boolean
  setSoDisponiveis: (valor: boolean) => void
  abrirLivro: (livro: Livro) => void
}) {
  const encontrados = useMemo(
    () => filtrarLivros(livros, { busca, categoria, disponiveis: soDisponiveis }, emprestimos),
    [busca, categoria, soDisponiveis, emprestimos],
  )
  const limpar = () => { setBusca(''); setCategoria('Todas'); setSoDisponiveis(false) }
  return (
    <div className="pagina">
      <div className="cabecalho-secao">
        <span className="sobretitulo">NOSSA ESTANTE</span>
        <h1>Explore o acervo <span className="rabisco-azul" aria-hidden="true">✳</span></h1>
        <p>Um cantinho pra descobrir leituras novas. Escolhe um título e veja como funciona o empréstimo</p>
      </div>
      <section className="painel-filtros" aria-label="Busca e filtros do acervo">
        <label htmlFor="buscar-livro" className="rotulo-busca">Qual livro você procura?</label>
        <div className="campo-busca">
          <Search size={20} aria-hidden="true" />
          <input id="buscar-livro" type="search" placeholder="Busque por título, autor ou matéria..."
            value={busca} onChange={(evento) => setBusca(evento.target.value)} />
        </div>
        <div className="filtros-titulo"><span><SlidersHorizontal size={17} /> Filtrar por assunto</span></div>
        <div className="categorias-filtro" role="group" aria-label="Categoria dos livros">
          {categorias.map((opcao) => <button type="button" key={opcao}
            className={`categoria-chip ${categoria === opcao ? 'ativo' : ''}`}
            aria-pressed={categoria === opcao} onClick={() => setCategoria(opcao)}>{opcao}</button>)}
        </div>
        <label className="check-disponiveis">
          <input type="checkbox" checked={soDisponiveis} onChange={(evento) => setSoDisponiveis(evento.target.checked)} />
          Mostrar só livros disponíveis
        </label>
      </section>
      <div className="resultados-barra" role="status">
        <strong>{encontrados.length} {encontrados.length === 1 ? 'livro encontrado' : 'livros encontrados'}</strong>
        {(busca || categoria !== 'Todas' || soDisponiveis) && <button type="button" onClick={limpar}>Limpar filtros <X size={16} /></button>}
      </div>
      {encontrados.length > 0 ? (
        <div className="livro-grade">{encontrados.map((livro) =>
          <LivroCard key={livro.id} livro={livro} emprestimos={emprestimos} onAbrir={abrirLivro} />)}</div>
      ) : (
        <div className="estado-vazio">
          <span className="ilustracao-vazia"><Search size={34} /></span>
          <h2>Hmm, não achamos esse livro</h2>
          <p>Tenta outra palavra ou muda os filtros pra ver mais opções</p>
          <button type="button" className="botao-secundario" onClick={limpar}>Ver todos os livros</button>
        </div>
      )}
    </div>
  )
}

function Detalhes({ livro, emprestimos, voltar, emprestar, irMeus }: {
  livro: Livro
  emprestimos: readonly Emprestimo[]
  voltar: () => void
  emprestar: (livro: Livro) => void
  irMeus: () => void
}) {
  const disponiveis = quantidadeDisponivel(livro, emprestimos)
  const jaPegou = emprestimos.some((item) => item.livroId === livro.id)
  return (
    <div className="pagina detalhes">
      <button className="botao-voltar" onClick={voltar} type="button"><ArrowLeft size={19} /> Voltar aos livros</button>
      <div className="detalhes-layout">
        <div className="detalhes-capa"><CapaLivro livro={livro} grande /><span>CAPA ILUSTRATIVA</span></div>
        <div className="detalhes-info">
          <span className="sobretitulo">{livro.categoria.toUpperCase()} · {livro.etiqueta}</span>
          <h1>{livro.titulo}</h1>
          <p className="detalhes-autor">por {livro.autor}</p>
          <EstadoLivro livro={livro} emprestimos={emprestimos} />
          <p className="detalhes-sinopse">{livro.descricao}</p>
          <dl className="detalhes-ficha">
            <div><dt>Publicação</dt><dd>{livro.ano}</dd></div>
            <div><dt>Páginas</dt><dd>{livro.paginas}</dd></div>
            <div><dt>Prazo simulado</dt><dd>7 dias</dd></div>
          </dl>
          <div className="detalhes-acoes">
            {jaPegou ? (
              <button className="botao-principal" type="button" onClick={irMeus}>Já está na sua lista <ArrowRight size={19} /></button>
            ) : (
              <button className="botao-principal" type="button" disabled={!disponiveis} onClick={() => emprestar(livro)}>
                {disponiveis ? 'Simular empréstimo' : 'Sem exemplares no momento'} <BookMarked size={19} />
              </button>
            )}
            <p><Info size={17} /> Ação só de demonstração. Nenhum livro real será reservado</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MeusLivros({ emprestimos, abrirLivro, devolver, pendente, setPendente, irAcervo }: {
  emprestimos: readonly Emprestimo[]
  abrirLivro: (livro: Livro) => void
  devolver: (id: string) => void
  pendente: string | null
  setPendente: (id: string | null) => void
  irAcervo: () => void
}) {
  const itens = emprestimos.flatMap((emprestimo) => {
    const livro = livros.find((livroAtual) => livroAtual.id === emprestimo.livroId)
    return livro ? [{ livro, emprestimo }] : []
  })
  const formatar = (data: Date) => data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <div className="pagina">
      <div className="cabecalho-secao">
        <span className="sobretitulo">MINHA ESTANTE</span>
        <h1>Meus livros <span className="rabisco-azul" aria-hidden="true">✳</span></h1>
        <p>Acompanhe os empréstimos que você simulou neste navegador</p>
      </div>
      <div className="demo-nota" role="note"><Info size={19} /><span>As retiradas e devoluções são fictícias e ficam só neste dispositivo</span></div>
      {itens.length === 0 ? (
        <div className="estado-vazio">
          <span className="ilustracao-vazia"><BookOpen size={36} /></span>
          <h2>Essa estante ainda tá vazia</h2>
          <p>Que tal começar por um livro? Escolha um título no acervo e simule um empréstimo</p>
          <button className="botao-principal" type="button" onClick={irAcervo}>Explorar acervo <ArrowRight size={18} /></button>
        </div>
      ) : (
        <section className="lista-emprestimos" aria-label="Seus empréstimos simulados">
          <div className="emprestimos-total"><BookMarked size={20} /><strong>{itens.length} {itens.length === 1 ? 'livro na sua lista' : 'livros na sua lista'}</strong></div>
          {itens.map(({ livro, emprestimo }) => (
            <article className="emprestimo-card" key={livro.id}>
              <button type="button" className="emprestimo-capa" onClick={() => abrirLivro(livro)} aria-label={`Ver ${livro.titulo}`}><CapaLivro livro={livro} /></button>
              <div className="emprestimo-dados">
                <span className="livro-meta">{livro.categoria}</span>
                <h2>{livro.titulo}</h2>
                <p>{livro.autor}</p>
                <span className="data-devolucao"><CalendarDays size={17} /> Devolução fictícia até {formatar(dataPrevista(emprestimo.data))}</span>
                {pendente === livro.id ? (
                  <div className="confirmar-devolucao">
                    <strong>Devolver esse livro na simulação?</strong>
                    <div>
                      <button type="button" className="botao-confirmar" onClick={() => devolver(livro.id)}>Sim, devolver</button>
                      <button type="button" className="botao-cancelar" onClick={() => setPendente(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="botao-secundario devolver-botao" onClick={() => setPendente(livro.id)}>
                    <RotateCcw size={17} /> Simular devolução
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

function Sobre({ irAcervo }: { irAcervo: () => void }) {
  return (
    <div className="pagina">
      <div className="cabecalho-secao">
        <span className="sobretitulo">CONHEÇA A IDEIA</span>
        <h1>Uma biblioteca mais perto de todo mundo</h1>
        <p>Essa é uma das três propostas do Projeto de Extensão. A ideia nasceu das necessidades apontadas pelos alunos</p>
      </div>
      <div className="sobre-mosaico">
        <section className="sobre-papel">
          <span className="sobre-numero">02 / 03</span>
          <h2>Proposta 2: Biblioteca</h2>
          <p>Em vez de procurar tudo no caderno, o aluno poderia consultar o acervo, ver o que está disponível e acompanhar suas retiradas num só lugar</p>
          <button className="botao-principal" type="button" onClick={irAcervo}>Testar biblioteca <ArrowRight size={18} /></button>
        </section>
        <section className="sobre-card" aria-labelledby="como-funciona">
          <h2 id="como-funciona">Como usar essa demonstração</h2>
          <ol className="passos">
            <li><span>01</span><div><strong>Procure um livro</strong><p>Busque pelo título, autor ou matéria</p></div></li>
            <li><span>02</span><div><strong>Abra os detalhes</strong><p>Confira a sinopse e a disponibilidade de exemplo</p></div></li>
            <li><span>03</span><div><strong>Simule um empréstimo</strong><p>Depois acompanhe ou devolva em Meus livros</p></div></li>
          </ol>
        </section>
      </div>
      <section className="sobre-observacao" aria-labelledby="limites-demo">
        <Info size={23} aria-hidden="true" />
        <div>
          <h2 id="limites-demo">Antes de votar, vale saber</h2>
          <p>Esse é um protótipo, não o sistema real da escola. Os exemplares são inventados, as capas são ilustrações, os empréstimos não chegam à biblioteca e não pedimos nenhum dado pessoal. Assim dá pra testar a ideia sem mexer em registros reais</p>
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [tela, setTela] = useState<Tela>('inicio')
  const [detalhe, setDetalhe] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<CategoriaFiltro>('Todas')
  const [soDisponiveis, setSoDisponiveis] = useState(false)
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>(() =>
    carregarEmprestimos(typeof window === 'undefined' ? null : window.localStorage, livros))
  const [aviso, setAviso] = useState('')
  const [pendente, setPendente] = useState<string | null>(null)
  const selecionado = detalhe ? livros.find((livro) => livro.id === detalhe) : undefined

  useEffect(() => {
    salvarEmprestimos(window.localStorage, emprestimos)
  }, [emprestimos])

  useEffect(() => {
    const nome = selecionado?.titulo ?? navegacao.find((item) => item.id === tela)?.nome ?? 'Biblioteca'
    document.title = `${nome} — Biblioteca · Projeto de Extensão`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tela, selecionado])

  const navegar = (destino: Tela) => {
    setTela(destino)
    setDetalhe(null)
    setPendente(null)
    setAviso('')
  }
  const abrirLivro = (livro: Livro) => { setDetalhe(livro.id); setAviso('') }
  const irCategoria = (opcao: CategoriaFiltro) => { setCategoria(opcao); setBusca(''); setSoDisponiveis(false); navegar('acervo') }
  const emprestar = (livro: Livro) => {
    const resultado = emprestarLivro(livro, emprestimos)
    if (resultado.ok) setEmprestimos(resultado.emprestimos)
    setAviso(resultado.mensagem)
  }
  const devolver = (id: string) => {
    setEmprestimos((atual) => devolverLivro(atual, id))
    setPendente(null)
    setAviso('Devolução simulada! O livro voltou a ficar disponível neste navegador')
  }

  return (
    <div className="app-layout">
      <nav className="navegacao" aria-label="Navegação principal da biblioteca">
        <div className="navegacao-marca"><Marca /><p>Um cantinho pra descobrir histórias e aprender mais</p></div>
        <div className="navegacao-itens">
          {navegacao.map(({ id, nome, Icone }) => (
            <button key={id} type="button" className={tela === id && !detalhe ? 'ativo' : ''}
              aria-current={tela === id && !detalhe ? 'page' : undefined} onClick={() => navegar(id)}>
              <Icone size={21} strokeWidth={2} aria-hidden="true" />
              <span>{nome}</span>
              {id === 'meus' && emprestimos.length > 0 && <b aria-label={`${emprestimos.length} livros`}>{emprestimos.length}</b>}
            </button>
          ))}
        </div>
        <div className="navegacao-rodape">PROJETO DE EXTENSÃO <span>•</span> PROTÓTIPO 2</div>
      </nav>

      <div className="layout-corpo">
        <header className="cabecalho-app">
          <div><span>PROJETO DE EXTENSÃO</span><strong>Biblioteca escolar</strong></div>
          <span className="demo-tag"><span className="demo-ponto" /> DEMONSTRAÇÃO</span>
        </header>
        <main id="conteudo" className="conteudo-principal">
          {selecionado ? (
            <Detalhes livro={selecionado} emprestimos={emprestimos} voltar={() => setDetalhe(null)}
              emprestar={emprestar} irMeus={() => navegar('meus')} />
          ) : (
            <>
              {tela === 'inicio' && <Inicio emprestimos={emprestimos} irAcervo={() => navegar('acervo')}
                irCategoria={irCategoria} abrirLivro={abrirLivro} />}
              {tela === 'acervo' && <Acervo emprestimos={emprestimos} busca={busca} setBusca={setBusca}
                categoria={categoria} setCategoria={setCategoria} soDisponiveis={soDisponiveis}
                setSoDisponiveis={setSoDisponiveis} abrirLivro={abrirLivro} />}
              {tela === 'meus' && <MeusLivros emprestimos={emprestimos} abrirLivro={abrirLivro}
                devolver={devolver} pendente={pendente} setPendente={setPendente}
                irAcervo={() => navegar('acervo')} />}
              {tela === 'sobre' && <Sobre irAcervo={() => navegar('acervo')} />}
            </>
          )}
        </main>
        <footer className="rodape-app">Projeto de Extensão · Biblioteca · Proposta 2 de 3 <span>—</span> Dados fictícios para demonstração</footer>
      </div>
      {aviso && <div className="aviso-flutuante" role="status">
        <span><Check size={18} /> {aviso}</span>
        <button type="button" aria-label="Fechar aviso" onClick={() => setAviso('')}><X size={20} /></button>
      </div>}
    </div>
  )
}
