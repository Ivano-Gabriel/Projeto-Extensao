import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, BookOpenCheck, Brain, CalendarDays, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Clock3, Download, Home, Info,
  Lightbulb, ListChecks, Plus, RotateCcw, Search, Sparkles, Target, Trash2, X,
} from 'lucide-react'
import { materiais, materias, type Material, type Materia } from './dados/materiais'
import { questoes, type Questao } from './dados/questoes'
import { alternarRevisado, buscarMateriais, resumoEstudos } from './logica/estudos'
import { responderQuestao, resumirRespostas } from './logica/revisao'
import { carregarEstado, salvarEstado, type EstadoEstudos } from './logica/persistencia'
import { gerarPdf, nomeSeguro } from './logica/pdf'
import {
  carregarProvas, salvarProvas, chaveData, dataDeChave, diasAte, textoPrazo, celulasDoMes, type Prova,
} from './logica/provas'

type Tela = 'inicio' | 'materiais' | 'revisao' | 'progresso' | 'downloads' | 'calendario'
type FiltroMateria = 'Todas' | Materia
const menu = [
  { id: 'inicio', nome: 'Início', Icone: Home },
  { id: 'materiais', nome: 'Materiais', Icone: BookOpen },
  { id: 'revisao', nome: 'Revisão', Icone: Brain },
  { id: 'calendario', nome: 'Provas', Icone: CalendarDays },
  { id: 'progresso', nome: 'Progresso', Icone: Target },
  { id: 'downloads', nome: 'Downloads', Icone: Download },
] as const
const cores: Record<Materia, string> = {
  'Matemática': 'azul',
  'Português': 'coral',
  'Física': 'verde',
  'História': 'amarelo',
}
const materiasDisponiveis: Materia[] = ['Matemática', 'Português', 'Física', 'História']

function armazenamento(): Storage | null {
  try { return typeof window !== 'undefined' ? window.localStorage : null }
  catch { return null }
}

function Marca() {
  return (
    <div className="marca" aria-label="Gerenciador de estudos, ferramenta de estudos">
      <span className="marca-simbolo" aria-hidden="true"><BookOpenCheck size={23} /></span>
      <span><strong>Estude Melhor</strong><small>Ferramenta de estudos</small></span>
    </div>
  )
}

function Barrinha({ valor }: { valor: number }) {
  return <div className="barra-progresso" role="progressbar" aria-valuemin={0} aria-valuemax={100}
    aria-valuenow={valor} aria-label="Progresso dos materiais"><span style={{ width: `${valor}%` }} /></div>
}

function CabecalhoSecao({ etiqueta, titulo, descricao }: { etiqueta: string; titulo: string; descricao: string }) {
  return (
    <header className="cabecalho-secao">
      <span className="sobretitulo">{etiqueta}</span>
      <h1>{titulo}</h1>
      <p>{descricao}</p>
    </header>
  )
}

function CartaoMaterial({ material, revisado, onAbrir }: {
  material: Material
  revisado: boolean
  onAbrir: (item: Material) => void
}) {
  return (
    <article className="cartao-material">
      <span className={`icone-materia materia-${cores[material.materia]}`} aria-hidden="true"><BookOpen size={22} /></span>
      <div className="cartao-conteudo">
        <div className="cartao-etiquetas">
          <span>{material.materia}</span><span>{material.etiqueta}</span>
        </div>
        <h3>{material.titulo}</h3>
        <p>{material.descricao}</p>
        <div className="cartao-prazo">
          <span><Clock3 size={15} /> {material.minutos} min de leitura</span>
          {revisado && <span className="revisado"><Check size={16} /> Revisado</span>}
        </div>
      </div>
      <button className="abrir-material" type="button" onClick={() => onAbrir(material)}
        aria-label={`Abrir material ${material.titulo}`}><ChevronRight size={21} /></button>
    </article>
  )
}

function Inicio({ estado, abrirMaterial, escolherMateria, irMateriais, irRevisao, irProgresso }: {
  estado: EstadoEstudos
  abrirMaterial: (material: Material) => void
  escolherMateria: (materia: FiltroMateria) => void
  irMateriais: () => void
  irRevisao: () => void
  irProgresso: () => void
}) {
  const resumo = resumoEstudos(materiais, estado.revisados, estado.respostas)
  const desempenho = resumirRespostas(questoes, estado.respostas)
  return (
    <div className="pagina">
      <section className="hero">
        <div className="hero-texto">
          <span className="hero-selo">PROPOSTA 03 · ESTUDOS</span>
          <h1>Estudar fica mais leve quando tem um <mark>plano.</mark></h1>
          <p>Resumos rápidos, materiais organizados e perguntas pra testar o que você aprendeu</p>
          <button className="botao-principal" type="button" onClick={irMateriais}>
            Escolher uma matéria <ArrowRight size={19} />
          </button>
          <small className="hero-rodape">Um passo de cada vez. Bora revisar?</small>
        </div>
        <div className="hero-arte" aria-hidden="true">
          <div className="folha-estudo">
            <span>REVISÃO DE HOJE</span>
            <div className="folha-linha"><span className="quadrinho ok"><Check size={16}/></span> Escolher um assunto</div>
            <div className="folha-linha"><span className="quadrinho" /> Entender o conteúdo</div>
            <div className="folha-linha"><span className="quadrinho" /> Testar o que aprendi</div>
            <i>feito com calma, sem correria ✳</i>
          </div>
        </div>
      </section>

      <div className="demo-nota" role="note"><Info size={19} />
        <span><strong>Protótipo demonstrativo.</strong> Os resumos e as questões são exemplos, não materiais oficiais da escola</span>
      </div>

      <section className="inicio-resumo" aria-label="Seu progresso neste navegador">
        <div className="resumo-destaque">
          <span className="resumo-topo"><ListChecks size={19} /> SEUS ESTUDOS</span>
          <div className="resumo-valor"><strong>{resumo.percentual}%</strong><span>dos materiais revisados</span></div>
          <Barrinha valor={resumo.percentual} />
          <button type="button" className="botao-link" onClick={irProgresso}>Ver meu progresso <ArrowRight size={17}/></button>
        </div>
        <div className="resumo-metrica"><span className="resumo-icone"><BookOpen size={23}/></span><strong>{resumo.revisados}/{resumo.materiais}</strong><small>Materiais revisados</small></div>
        <div className="resumo-metrica"><span className="resumo-icone icone-amarelo"><Brain size={23}/></span><strong>{desempenho.acertos}/{desempenho.respondidas}</strong><small>Acertos no quiz</small></div>
      </section>

      <section className="secao" aria-labelledby="materias-titulo">
        <div className="secao-titulo"><div><span>SEU PONTO DE PARTIDA</span><h2 id="materias-titulo">O que vamos estudar hoje?</h2></div></div>
        <div className="grade-materias">
          {materiasDisponiveis.map((materia, indice) => (
            <button key={materia} className={`escolha-materia materia-bg-${cores[materia]}`}
              type="button" onClick={() => escolherMateria(materia)}>
              <span className="escolha-numero">0{indice + 1} / MATÉRIA</span>
              <strong>{materia}</strong>
              <span className="escolha-contagem">{materiais.filter((item) => item.materia === materia).length} materiais</span>
              <ArrowRight size={23} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="secao" aria-labelledby="materiais-sugeridos">
        <div className="secao-titulo">
          <div><span>PRA COMEÇAR AGORA</span><h2 id="materiais-sugeridos">Materiais pra você</h2></div>
          <button type="button" className="botao-link" onClick={irMateriais}>Ver todos <ArrowRight size={16}/></button>
        </div>
        <div className="grade-materiais">
          {materiais.slice(0, 4).map((material) =>
            <CartaoMaterial key={material.id} material={material}
              revisado={estado.revisados.includes(material.id)} onAbrir={abrirMaterial}/>)}
        </div>
      </section>

      <section className="chamada-quiz">
        <span className="chamada-icone"><Brain size={29} /></span>
        <div><span>TESTE SEU CONHECIMENTO</span><h2>8 perguntas pra praticar</h2><p>Errou? Sem problema. A gente explica o raciocínio depois de cada resposta</p></div>
        <button type="button" className="botao-principal" onClick={irRevisao}>Começar revisão <ArrowRight size={18}/></button>
      </section>
    </div>
  )
}

function MateriaisPagina({ estado, busca, setBusca, materia, setMateria, abrirMaterial }: {
  estado: EstadoEstudos
  busca: string
  setBusca: (termo: string) => void
  materia: FiltroMateria
  setMateria: (materia: FiltroMateria) => void
  abrirMaterial: (material: Material) => void
}) {
  const encontrados = useMemo(() => buscarMateriais(materiais, busca, materia), [busca, materia])
  return (
    <div className="pagina">
      <CabecalhoSecao etiqueta="BIBLIOTECA DE ESTUDOS" titulo="Materiais pra revisar"
        descricao="Encontre um assunto, leia o resumo e marque quando terminar de estudar" />
      <section className="painel-busca" aria-label="Busca e filtros de materiais">
        <label htmlFor="pesquisa-material">Qual assunto você procura?</label>
        <div className="campo-busca"><Search size={21}/><input id="pesquisa-material" type="search"
          placeholder="Ex.: funções, modernismo, Newton..." value={busca}
          onChange={(e) => setBusca(e.target.value)} /></div>
        <div className="filtros" role="group" aria-label="Filtrar por matéria">
          {materias.map((opcao) =>
            <button key={opcao} type="button" className={`chip ${materia === opcao ? 'ativo' : ''}`}
              aria-pressed={materia === opcao} onClick={() => setMateria(opcao)}>{opcao}</button>)}
        </div>
      </section>
      <div className="resultados" role="status">
        <strong>{encontrados.length} {encontrados.length === 1 ? 'material encontrado' : 'materiais encontrados'}</strong>
        {(busca || materia !== 'Todas') &&
          <button type="button" onClick={() => {setBusca('');setMateria('Todas')}}>Limpar filtros <X size={16}/></button>}
      </div>
      {encontrados.length ? (
        <div className="grade-materiais">{encontrados.map((material) =>
          <CartaoMaterial key={material.id} material={material} revisado={estado.revisados.includes(material.id)}
            onAbrir={abrirMaterial}/>)}</div>
      ) : (
        <div className="estado-vazio"><Search size={33}/><h2>Nada por aqui ainda</h2>
          <p>Busca outra palavra ou limpa os filtros pra encontrar um material</p>
          <button className="botao-secundario" type="button" onClick={() => {setBusca('');setMateria('Todas')}}>Ver todos os materiais</button></div>
      )}
    </div>
  )
}

function LerMaterial({ material, revisado, onVoltar, onAlternar, irRevisao }: {
  material: Material
  revisado: boolean
  onVoltar: () => void
  onAlternar: (id: string) => void
  irRevisao: () => void
}) {
  return (
    <div className="pagina">
      <button type="button" className="botao-voltar" onClick={onVoltar}><ArrowLeft size={18}/> Voltar aos materiais</button>
      <div className="artigo-layout">
        <article className="artigo" aria-labelledby="artigo-titulo">
          <div className="artigo-cabecalho">
            <span className="sobretitulo">{material.materia.toUpperCase()} · {material.etiqueta}</span>
            <h1 id="artigo-titulo">{material.titulo}</h1>
            <p>{material.descricao}</p>
            <span className="tempo-leitura"><Clock3 size={18}/> {material.minutos} min de leitura · {material.tema}</span>
          </div>
          {material.conteudo.map((item, indice) => (
            <section className="artigo-secao" key={item.subtitulo}>
              <span className="artigo-indice">0{indice + 1}</span>
              <div><h2>{item.subtitulo}</h2><p>{item.texto}</p></div>
            </section>
          ))}
          <div className="exemplo">
            <span><Lightbulb size={19}/> EXEMPLO NA PRÁTICA</span>
            <p>{material.exemplo}</p>
          </div>
          <div className="dica">
            <Sparkles size={20}/><div><strong>Pra guardar na cabeça</strong><p>{material.dica}</p></div>
          </div>
        </article>
        <aside className="coluna-estudo" aria-label="Ações do estudo">
          <span className="sobretitulo">DEPOIS DE LER</span>
          <h2>Seu ritmo, seu progresso</h2>
          <p>Marque quando terminar, depois testa oq aprendeu no quiz</p>
          <button type="button" className={`botao-principal ${revisado ? 'revisado-acao' : ''}`}
            aria-pressed={revisado} onClick={() => onAlternar(material.id)}>
            {revisado ? <CheckCircle2 size={18}/> : <Check size={18}/>}
            {revisado ? 'Material revisado' : 'Marcar como revisado'}
          </button>
          <button type="button" className="botao-secundario" onClick={irRevisao}>Fazer revisão <ArrowRight size={18}/></button>
          <small>Salvo apenas neste navegador</small>
        </aside>
      </div>
    </div>
  )
}

function QuizPagina({ estado, indice, setIndice, responder, irMateriais, reiniciar }: {
  estado: EstadoEstudos
  indice: number
  setIndice: (indice: number) => void
  responder: (questao: Questao, opcao: number) => void
  irMateriais: () => void
  reiniciar: () => void
}) {
  const resumo = resumirRespostas(questoes, estado.respostas)
  if (indice >= questoes.length) {
    return (
      <div className="pagina">
        <CabecalhoSecao etiqueta="RESULTADO DA REVISÃO" titulo="Mandou bem por ter tentado!"
          descricao="O mais importante é entender os erros e continuar revisando, no seu ritmo" />
        <div className="resultado-quiz">
          <span className="resultado-icone"><Target size={38}/></span>
          <span>SEU RESULTADO</span>
          <strong>{resumo.acertos}<small> / {resumo.total}</small></strong>
          <p>{resumo.percentual}% de acertos nas perguntas respondidas. Esse é só um treino, não vale nota!</p>
          <div className="resultado-acoes">
            <button type="button" className="botao-principal" onClick={reiniciar}><RotateCcw size={18}/> Refazer quiz</button>
            <button type="button" className="botao-secundario" onClick={irMateriais}>Revisar materiais <ArrowRight size={18}/></button>
          </div>
        </div>
      </div>
    )
  }
  const questao = questoes[indice]
  const resposta = estado.respostas.find((item) => item.questaoId === questao.id)
  const acertou = resposta?.opcao === questao.correta
  return (
    <div className="pagina">
      <CabecalhoSecao etiqueta="HORA DE PRATICAR" titulo="Vamos testar o que ficou?"
        descricao="Responda com calma e veja a explicação antes de ir pra próxima pergunta" />
      <div className="revisao-layout">
        <section className="quiz" aria-labelledby="pergunta-atual">
          <div className="quiz-topo">
            <span>PERGUNTA {indice + 1} DE {questoes.length}</span><span>{questao.materia.toUpperCase()}</span>
          </div>
          <div className="quiz-barra"><span style={{width: `${(resumo.respondidas / resumo.total) * 100}%`}} /></div>
          <h2 id="pergunta-atual">{questao.pergunta}</h2>
          <fieldset className="alternativas" disabled={resposta !== undefined}>
            <legend>Escolha uma alternativa</legend>
            {questao.opcoes.map((alternativa, numero) => (
              <button key={numero} type="button"
                className={`alternativa ${resposta?.opcao === numero ? 'selecionada' : ''} ${resposta && numero === questao.correta ? 'correta' : ''}`}
                onClick={() => responder(questao, numero)} disabled={resposta !== undefined}>
                <span className="alternativa-letra">{'ABCD'[numero]}</span>
                <span>{alternativa}</span>
                {resposta && numero === questao.correta && <CheckCircle2 size={21} aria-hidden="true"/>}
              </button>
            ))}
          </fieldset>
          {resposta && (
            <div className={`feedback ${acertou ? 'feedback-certo' : 'feedback-erro'}`} role="status">
              <strong>{acertou ? 'Boa! Você acertou ✳' : 'Quase! Bora entender o motivo'}</strong>
              <p>{questao.explicacao}</p>
            </div>
          )}
          <div className="quiz-acoes">
            <button type="button" className="botao-secundario" disabled={indice === 0} onClick={() => setIndice(indice - 1)}>
              <ArrowLeft size={17}/> Voltar
            </button>
            <button type="button" className="botao-principal" disabled={!resposta} onClick={() => setIndice(indice + 1)}>
              {indice === questoes.length - 1 ? 'Ver resultado' : 'Próxima pergunta'} <ArrowRight size={18}/>
            </button>
          </div>
        </section>
        <aside className="quiz-ajuda">
          <span className="quiz-ajuda-icone"><Brain size={24}/></span>
          <h3>Errar faz parte</h3>
          <p>Essa revisão é pra praticar, não pra colar. Cada resposta vem com uma explicação pra você aprender de verdade</p>
          <div className="quiz-estatistica"><strong>{resumo.respondidas}/{resumo.total}</strong><span>respondidas até agora</span></div>
        </aside>
      </div>
    </div>
  )
}

function Progresso({ estado, irMateriais, irRevisao, limparProgresso }: {
  estado: EstadoEstudos
  irMateriais: () => void
  irRevisao: () => void
  limparProgresso: () => void
}) {
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false)
  const resumo = resumoEstudos(materiais, estado.revisados, estado.respostas)
  const quiz = resumirRespostas(questoes, estado.respostas)
  return (
    <div className="pagina">
      <CabecalhoSecao etiqueta="NO SEU RITMO" titulo="Meu progresso"
        descricao="Veja o que você já revisou e quais assuntos ainda pode explorar" />
      <div className="progresso-layout">
        <section className="progresso-destaque">
          <span className="sobretitulo">MATERIAIS REVISADOS</span>
          <div className="progresso-numero"><strong>{resumo.percentual}%</strong><span>{resumo.revisados} de {resumo.materiais} materiais</span></div>
          <Barrinha valor={resumo.percentual} />
          <p>Não precisa correr. Cada material revisado é um passo adiante</p>
          <button type="button" className="botao-principal" onClick={irMateriais}>Continuar estudando <ArrowRight size={18}/></button>
        </section>
        <section className="progresso-quiz">
          <span className="sobretitulo">SUA REVISÃO</span>
          <span className="progresso-quiz-icone"><Brain size={29}/></span>
          <strong>{quiz.acertos}/{quiz.respondidas}</strong>
          <p>Acertos nas questões respondidas</p>
          <button type="button" className="botao-secundario" onClick={irRevisao}>Ir pro quiz <ArrowRight size={18}/></button>
        </section>
      </div>
      <section className="materias-progresso" aria-labelledby="andamento">
        <h2 id="andamento">Por matéria</h2>
        {materiasDisponiveis.map((materia) => {
          const lista = materiais.filter((item) => item.materia === materia)
          const feitos = lista.filter((item) => estado.revisados.includes(item.id)).length
          return (
            <div className="linha-materia" key={materia}>
              <div><strong>{materia}</strong><span>{feitos} de {lista.length} revisados</span></div>
              <div className="barra-progresso" role="progressbar"
                aria-label={`Progresso em ${materia}`} aria-valuemin={0} aria-valuemax={100}
                aria-valuenow={Math.round(100 * feitos / lista.length)}>
                <span style={{width: `${100 * feitos / lista.length}%`}}/>
              </div>
            </div>
          )
        })}
      </section>
      <section className="limpar-progresso" aria-label="Reiniciar a demonstração">
        <h2>Quer começar do zero?</h2>
        <p>Isso apaga só as marcações e respostas desta simulação neste navegador</p>
        {confirmarLimpeza ? (
          <div className="confirmar-limpeza" role="group" aria-label="Confirmar limpeza do progresso">
            <strong>Apagar seu progresso de demonstração?</strong>
            <button type="button" className="botao-perigo" onClick={() => { limparProgresso(); setConfirmarLimpeza(false) }}>Sim, apagar</button>
            <button type="button" className="botao-secundario" onClick={() => setConfirmarLimpeza(false)}>Cancelar</button>
          </div>
        ) : <button type="button" className="botao-secundario" onClick={() => setConfirmarLimpeza(true)}>Reiniciar demonstração</button>}
      </section>
    </div>
  )
}

function DownloadsPagina({ abrirMaterial }: { abrirMaterial: (material: Material) => void }) {
  const [erro, setErro] = useState('')

  function baixar(lista: Material[], titulo: string, arquivo: string) {
    try {
      setErro('')
      gerarPdf(lista, titulo, arquivo)
    } catch {
      setErro('Não foi possível gerar o PDF. Tente novamente.')
    }
  }

  return (
    <div className="pagina">
      <CabecalhoSecao etiqueta="LEVE PRA ESTUDAR OFFLINE" titulo="Baixar PDFs"
        descricao="Baixe os resumos em PDF por assunto, por matéria ou todos de uma vez" />

      {erro && <div className="demo-nota" role="alert"><Info size={19} /><span>{erro}</span></div>}

      <section className="secao" aria-labelledby="pdf-tudo">
        <div className="secao-titulo">
          <div><span>PACOTE COMPLETO</span><h2 id="pdf-tudo">Todos os materiais</h2></div>
        </div>
        <button type="button" className="botao-principal"
          onClick={() => baixar(materiais, 'Estude Melhor - Todos os materiais', 'estude-melhor-todos-os-materiais')}>
          <Download size={18} /> Baixar tudo em um PDF ({materiais.length} materiais)
        </button>
      </section>

      {materiasDisponiveis.map((nomeMateria) => {
        const lista = materiais.filter((item) => item.materia === nomeMateria)
        return (
          <section className="secao" key={nomeMateria} aria-labelledby={`pdf-${nomeSeguro(nomeMateria)}`}>
            <div className="secao-titulo">
              <div><span>MATÉRIA</span><h2 id={`pdf-${nomeSeguro(nomeMateria)}`}>{nomeMateria}</h2></div>
              <button type="button" className="botao-secundario"
                onClick={() => baixar(lista, `Estude Melhor - ${nomeMateria}`, `estude-melhor-${nomeSeguro(nomeMateria)}`)}>
                <Download size={17} /> PDF da matéria
              </button>
            </div>
            <ul className="lista-download">
              {lista.map((material) => (
                <li className="linha-download" key={material.id}>
                  <span className={`icone-materia materia-${cores[nomeMateria]}`} aria-hidden="true"><BookOpen size={20} /></span>
                  <div className="linha-download-texto">
                    <strong>{material.titulo}</strong>
                    <small>{material.etiqueta} · {material.minutos} min de leitura</small>
                  </div>
                  <button type="button" className="botao-link" onClick={() => abrirMaterial(material)}>Ler</button>
                  <button type="button" className="botao-secundario"
                    onClick={() => baixar([material], `Estude Melhor - ${material.materia}`, `${nomeSeguro(material.materia)}-${nomeSeguro(material.titulo)}`)}
                    aria-label={`Baixar PDF de ${material.titulo}`}>
                    <Download size={17} /> PDF
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}


const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const letrasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function CalendarioPagina({ provas, onAdicionar, onRemover, estudar }: {
  provas: Prova[]
  onAdicionar: (prova: Prova) => void
  onRemover: (id: string) => void
  estudar: (materia: Materia) => void
}) {
  const hoje = new Date()
  const chaveHoje = chaveData(hoje)
  const [mes, setMes] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [dia, setDia] = useState(chaveHoje)
  const [materiaForm, setMateriaForm] = useState<Materia>('Matemática')
  const [titulo, setTitulo] = useState('')
  const [data, setData] = useState(chaveHoje)
  const [erro, setErro] = useState('')

  const celulas = useMemo(() => celulasDoMes(mes.getFullYear(), mes.getMonth()), [mes])
  const porDia = useMemo(() => {
    const mapa = new Map<string, Prova[]>()
    provas.forEach((p) => mapa.set(p.data, [...(mapa.get(p.data) ?? []), p]))
    return mapa
  }, [provas])
  const proximas = useMemo(
    () => provas.filter((p) => diasAte(p.data) >= 0).sort((a, b) => a.data.localeCompare(b.data)),
    [provas],
  )
  const doDia = porDia.get(dia) ?? []

  const mudarMes = (delta: number) =>
    setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1))

  function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setErro('Escreva o assunto da prova'); return }
    if (!data) { setErro('Escolha a data da prova'); return }
    onAdicionar({ id: `${Date.now()}`, materia: materiaForm, titulo: titulo.trim(), data })
    const alvo = dataDeChave(data)
    setMes(new Date(alvo.getFullYear(), alvo.getMonth(), 1))
    setDia(data)
    setTitulo('')
    setErro('')
  }

  return (
    <div className="pagina">
      <CabecalhoSecao etiqueta="ORGANIZE SUAS DATAS" titulo="Calendário de provas"
        descricao="Cadastre as provas, veja quantos dias faltam e vá direto estudar a matéria" />

      <div className="calendario-layout">
        <section className="calendario-cartao" aria-label="Calendário do mês">
          <div className="calendario-topo">
            <h2>{nomesMeses[mes.getMonth()]} de {mes.getFullYear()}</h2>
            <div className="calendario-nav">
              <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
              <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="calendario-grade">
            {letrasSemana.map((letra, i) => <span key={i} className="dia-semana" aria-hidden="true">{letra}</span>)}
            {celulas.map((chave, i) => {
              if (!chave) return <span key={`vazio-${i}`} className="dia-vazio" aria-hidden="true" />
              const lista = porDia.get(chave) ?? []
              const numero = Number(chave.slice(8))
              return (
                <button key={chave} type="button"
                  className={`dia ${chave === chaveHoje ? 'hoje' : ''} ${chave === dia ? 'selecionado' : ''}`}
                  aria-pressed={chave === dia}
                  aria-label={`${numero} de ${nomesMeses[mes.getMonth()]}${lista.length ? `, ${lista.length} prova${lista.length > 1 ? 's' : ''}` : ''}`}
                  onClick={() => setDia(chave)}>
                  <span>{numero}</span>
                  <span className="pontos" aria-hidden="true">
                    {lista.slice(0, 3).map((p) => <i key={p.id} className={`ponto-prova ponto-${cores[p.materia]}`} />)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="calendario-lateral">
          <section className="calendario-cartao" aria-labelledby="dia-titulo">
            <h2 id="dia-titulo" className="titulo-dia">
              {dataDeChave(dia).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {doDia.length ? (
              <ul className="lista-provas">
                {doDia.map((p) => (
                  <li className="linha-prova" key={p.id}>
                    <span className={`icone-materia materia-${cores[p.materia]}`} aria-hidden="true"><BookOpen size={18} /></span>
                    <div className="linha-prova-texto"><strong>{p.titulo}</strong><small>{p.materia}</small></div>
                    <button type="button" className="botao-link" onClick={() => estudar(p.materia)}>Estudar</button>
                    <button type="button" className="botao-icone" onClick={() => onRemover(p.id)}
                      aria-label={`Remover prova ${p.titulo}`}><Trash2 size={17} /></button>
                  </li>
                ))}
              </ul>
            ) : <p className="sem-provas">Nenhuma prova neste dia.</p>}
          </section>

          <form className="calendario-cartao form-prova" onSubmit={adicionar} noValidate>
            <h2 className="titulo-dia">Nova prova</h2>
            <label>Matéria
              <select value={materiaForm} onChange={(e) => setMateriaForm(e.target.value as Materia)}>
                {materiasDisponiveis.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label>Assunto da prova
              <input type="text" value={titulo} placeholder="Ex.: Funções do 1º grau"
                onChange={(e) => { setTitulo(e.target.value); setErro('') }} />
            </label>
            <label>Data
              <input type="date" value={data} onChange={(e) => { setData(e.target.value); setErro('') }} />
            </label>
            {erro && <p className="erro-campo" role="alert">{erro}</p>}
            <button type="submit" className="botao-principal"><Plus size={18} /> Adicionar ao calendário</button>
          </form>
        </aside>
      </div>

      <section className="secao" aria-labelledby="proximas-titulo">
        <div className="secao-titulo"><div><span>NÃO ESQUEÇA</span><h2 id="proximas-titulo">Próximas provas</h2></div></div>
        {proximas.length ? (
          <ul className="lista-provas">
            {proximas.map((p) => {
              const dias = diasAte(p.data)
              return (
                <li className="linha-prova" key={p.id}>
                  <span className={`icone-materia materia-${cores[p.materia]}`} aria-hidden="true"><BookOpen size={18} /></span>
                  <div className="linha-prova-texto">
                    <strong>{p.titulo}</strong>
                    <small>{p.materia} · {dataDeChave(p.data).toLocaleDateString('pt-BR')}</small>
                  </div>
                  <span className={`prazo ${dias <= 2 ? 'urgente' : ''}`}>{textoPrazo(dias)}</span>
                  <button type="button" className="botao-link" onClick={() => estudar(p.materia)}>Estudar</button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="estado-vazio"><CalendarDays size={33} /><h2>Nenhuma prova marcada</h2>
            <p>Escolha uma data no calendário e adicione a primeira prova</p></div>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const [tela, setTela] = useState<Tela>('inicio')
  const [materialAberto, setMaterialAberto] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [materia, setMateria] = useState<FiltroMateria>('Todas')
  const [indiceQuiz, setIndiceQuiz] = useState(0)
  const [estado, setEstado] = useState<EstadoEstudos>(() => carregarEstado(armazenamento(), materiais, questoes))
  const [aviso, setAviso] = useState('')
  const [provas, setProvas] = useState<Prova[]>(() => carregarProvas(armazenamento()))
  const materialAtual = materialAberto ? materiais.find((item) => item.id === materialAberto) : undefined

  useEffect(() => { salvarEstado(armazenamento(), estado) }, [estado])

  useEffect(() => {
    document.title = `${materialAtual?.titulo ?? menu.find((item) => item.id === tela)?.nome ?? 'Estudos'} — Projeto de Extensão`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tela, materialAtual, indiceQuiz])

  useEffect(() => { salvarProvas(armazenamento(), provas) }, [provas])

  function navegar(destino: Tela) {
    setTela(destino)
    setMaterialAberto(null)
    setAviso('')
    if (destino === 'revisao') {
      const proxima = questoes.findIndex((questao) =>
        !estado.respostas.some((resposta) => resposta.questaoId === questao.id))
      setIndiceQuiz(proxima === -1 ? questoes.length : proxima)
    }
  }
  const adicionarProva = (prova: Prova) => {
  setProvas((atual) => [...atual, prova])
  setAviso('Prova adicionada ao calendário')
}
const removerProva = (id: string) => {
  setProvas((atual) => atual.filter((p) => p.id !== id))
  setAviso('Prova removida')
}

  const abrirMaterial = (item: Material) => { setTela('materiais'); setMaterialAberto(item.id); setAviso('') }
  const escolherMateria = (opcao: FiltroMateria) => { setMateria(opcao); setBusca(''); navegar('materiais') }
  const alternar = (id: string) => {
    const novo = alternarRevisado(estado.revisados, id, materiais)
    setEstado((atual) => ({ ...atual, revisados: novo }))
    setAviso(novo.includes(id) ? 'Material marcado como revisado!' : 'Marcação removida')
  }
  const responder = (questao: Questao, opcao: number) =>
    setEstado((atual) => ({ ...atual, respostas: responderQuestao(atual.respostas, questao, opcao) }))
  const reiniciarQuiz = () => { setEstado((atual) => ({ ...atual, respostas: [] })); setIndiceQuiz(0); setAviso('Quiz reiniciado! Bora tentar novamente') }

  return (
    <div className="app-layout">
      <nav className="navegacao" aria-label="Navegação da ferramenta de estudos">
        <div className="navegacao-marca"><Marca /><p>Um lugar pra revisar e aprender do seu jeito</p></div>
        <div className="navegacao-itens">
          {menu.map(({ id, nome, Icone }) => (
            <button key={id} type="button" className={tela === id ? 'ativo' : ''}
              aria-current={tela === id ? 'page' : undefined} onClick={() => navegar(id)}>
              <Icone size={21} aria-hidden="true" />
              <span>{nome}</span>
            </button>
          ))}
        </div>
        <span className="navegacao-rodape">PROJETO DE EXTENSÃO · PROTÓTIPO 3</span>
      </nav>
      <div className="layout-corpo">
        <header className="cabecalho-app">
          <div><span>PROJETO DE EXTENSÃO</span><strong>Ferramenta de estudos</strong></div>
          <span className="demo-tag"><span className="demo-ponto"/> DEMONSTRAÇÃO</span>
        </header>
        <main className="conteudo-principal">
          {materialAtual ? (
            <LerMaterial material={materialAtual} revisado={estado.revisados.includes(materialAtual.id)}
              onVoltar={() => setMaterialAberto(null)} onAlternar={alternar} irRevisao={() => navegar('revisao')} />
          ) : (
            <>
              {tela === 'inicio' && <Inicio estado={estado} abrirMaterial={abrirMaterial}
                escolherMateria={escolherMateria} irMateriais={() => navegar('materiais')}
                irRevisao={() => navegar('revisao')} irProgresso={() => navegar('progresso')}/>}
              {tela === 'materiais' && <MateriaisPagina estado={estado} busca={busca} setBusca={setBusca}
                materia={materia} setMateria={setMateria} abrirMaterial={abrirMaterial}/>}
              {tela === 'revisao' && <QuizPagina estado={estado} indice={indiceQuiz} setIndice={setIndiceQuiz}
                responder={responder} irMateriais={() => navegar('materiais')} reiniciar={reiniciarQuiz}/>}
              {tela === 'progresso' && <Progresso estado={estado} irMateriais={() => navegar('materiais')}
                irRevisao={() => navegar('revisao')}
                limparProgresso={() => {setEstado({ revisados: [], respostas: [] }); setAviso('Demonstração reiniciada')}} />}
              {tela === 'downloads' && <DownloadsPagina abrirMaterial={abrirMaterial} />}
              {tela === 'calendario' && <CalendarioPagina provas={provas}
               onAdicionar={adicionarProva} onRemover={removerProva} estudar={escolherMateria} />}  
            </>
          )}
        </main>
        <footer className="rodape-app">Projeto de Extensão · Proposta 3 de 3 · Conteúdo demonstrativo para estudo</footer>
      </div>
      {aviso && <div className="aviso-flutuante" role="status">
        <span><Check size={18}/>{aviso}</span>
        <button type="button" onClick={() => setAviso('')} aria-label="Fechar aviso"><X size={20}/></button>
      </div>}
    </div>
  )
}
