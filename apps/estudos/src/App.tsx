import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, BookOpenCheck, Brain, Calculator, Atom, Landmark, PenLine, Check, CheckCircle2,
  ChevronRight, Clock3, Home, Info, Settings2,
  Lightbulb, ListChecks, RotateCcw, Search, Sparkles, Target, X, School, Moon, Sun, LogOut,
} from 'lucide-react'
import { materiais, materias, type Material, type Materia } from './dados/materiais'
import { questoes, type Questao } from './dados/questoes'
import { alternarRevisado, buscarMateriais, resumoEstudos } from './logica/estudos'
import { responderQuestao, resumirRespostas } from './logica/revisao'
import { carregarEstado, salvarEstado, type EstadoEstudos } from './logica/persistencia'
import Escola from './escola/Escola'
import { carregarEscola, estadoInicialEscola, salvarEscola } from './escola/estado'
import { apagarDadosDoEstudos } from './logica/privacidade'
import { diasConsecutivosEstudados, formatarDataLocal } from './escola/regras'
import Plano from './plano/Plano'
import Jogo from './jogo/Jogo'
import Portal from './portal/Portal'
import PortalLogin from './portal/PortalLogin'
import ResumoTurmaReal from './portal/ResumoTurmaReal'
import ZeloMarca from './marca/ZeloMarca'
import { apiEscolar, type UsuarioEscolar, type MeuDesempenho } from './portal/api'
import { paginaDoUsuario, erroNaVerificacaoDeSessao } from './portal/sessao'
import { armazenamentoDaConta } from './portal/armazenamento'
import DesafioDia from './desafio/DesafioDia'
import { registrarRespostaDiaria, type RespostaDiaria } from './desafio/regras'
import { adicionarTarefa, alternarTarefa, agendaDoDia, carregarPlano, reagendarTarefa, removerTarefa, resumoPlano, salvarPlano, type NovaTarefa, type TarefaPlano } from './plano/regras'

type Tela = 'inicio' | 'materiais' | 'revisao' | 'escola' | 'progresso' | 'plano' | 'jogo' | 'portal'
type FiltroMateria = 'Todas' | Materia
const capitulosHub=[
  {esquerda:'Minha',direita:'turma'},
  {esquerda:'Bons',direita:'planos'},
  {esquerda:'Novas',direita:'ideias'},
  {esquerda:'Hora',direita:'de ler'},
] as const
const menu = [
  { id: 'inicio', nome: 'Início', Icone: Home },
  { id: 'materiais', nome: 'Materiais', Icone: BookOpen },
  { id: 'revisao', nome: 'Revisão', Icone: Brain },
  { id: 'escola', nome: 'Laboratório', Icone: Sparkles },
  { id: 'portal', nome: 'Minha turma', Icone: School },
  { id: 'progresso', nome: 'Progresso', Icone: Target },
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
    <div className="marca" aria-label="zELO+ — plataforma escolar">
      <ZeloMarca variante="compacta"/>
      <span className="marca-subtitulo">Aprender e conectar</span>
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

const iconesMaterias:Record<Materia,typeof BookOpen>={
  'Matemática':Calculator,'Português':PenLine,'Física':Atom,'História':Landmark,
}

function CartaoMaterial({ material, revisado, onAbrir }: {
  material: Material
  revisado: boolean
  onAbrir: (item: Material) => void
}) {
  const Icone=iconesMaterias[material.materia]
  return (
    <article className="cartao-material zelo-cartao-estudo" data-materia={material.materia}>
      <span className="zelo-materia-foto" aria-hidden="true"/>
      <span className={`icone-materia materia-${cores[material.materia]}`} aria-hidden="true"><Icone size={25} /></span>
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

function Inicio({estado,dataDesafio,respostaDesafio,responderDesafio,abrirMaterial,irMateriais,irRevisao,irProgresso,irTurma}:{
  estado:EstadoEstudos
  sequencia:number
  pendentesPlano:number
  tarefasPlano:readonly TarefaPlano[]
  concluirTarefa:(id:string)=>void
  abrirMaterial:(material:Material)=>void
  escolherMateria:(materia:FiltroMateria)=>void
  irMateriais:()=>void
  irRevisao:()=>void
  irProgresso:()=>void
  irTurma:()=>void
  irEscola:()=>void
  irPlano:()=>void
  irJogo:()=>void
  dataDesafio:string
  respostaDesafio?:RespostaDiaria
  responderDesafio:(questaoId:string,opcao:number)=>void
}){
  const resumo=resumoEstudos(materiais,estado.revisados,estado.respostas)
  const desempenho=resumirRespostas(questoes,estado.respostas)
  return <div className="pagina prime-inicio">
    <section className="prime-home-hero" aria-label="Bem-vindo aos estudos">
      <div className="prime-hero-conteudo">
        <span className="prime-eyebrow"><Sparkles size={16}/> SEU ESPAÇO DE ESTUDOS</span>
        <h1>Aprenda algo <em>novo hoje.</em></h1>
        <p>Escolha um assunto e comece. Sem enrolação.</p>
        <button type="button" className="prime-hero-cta" onClick={irMateriais}>
          Explorar materiais <ArrowRight size={20}/>
        </button>
      </div>
      <div className="zelo-home-fotografia" aria-hidden="true">
        <span>Estude, descubra, avance.</span>
      </div>
    </section>
    <ResumoTurmaReal abrirTurma={irTurma} abrirAtividades={irTurma}/>
    <div className="prime-atalhos zelo-atalhos-imagem" aria-label="Acesso rápido">
      <button type="button" onClick={irMateriais}>
        <span className="zelo-atalho-foto zelo-atalho-foto-materiais" aria-hidden="true"/>
        <span className="zelo-atalho-texto"><strong>Materiais</strong><small>Leia o que você quer aprender</small></span>
        <ArrowRight size={21} aria-hidden="true"/>
      </button>
      <button type="button" onClick={irRevisao}>
        <span className="zelo-atalho-foto zelo-atalho-foto-revisao" aria-hidden="true"/>
        <span className="zelo-atalho-texto"><strong>Revisar</strong><small>Teste o que já aprendeu</small></span>
        <ArrowRight size={21} aria-hidden="true"/>
      </button>
    </div>
    <p className="prime-demo-nota"><Info size={15}/> Resumos e quizzes desta área são conteúdos demonstrativos, não notas da escola.</p>
    <DesafioDia data={dataDesafio} resposta={respostaDesafio} responder={responderDesafio}
      abrirMaterial={(id)=>{const item=materiais.find(m=>m.id===id);if(item)abrirMaterial(item)}}/>
    <section className="prime-progress-home" aria-label="Seu progresso">
      <div className="prime-progress-visual"><span className="prime-progress-brilho">✦</span>
        <BookOpenCheck size={48}/></div>
      <div className="prime-progress-conteudo">
        <span className="sobretitulo">SEU PROGRESSO</span>
        <div className="prime-progress-numeros"><strong>{resumo.percentual}%</strong>
          <span>{resumo.revisados} de {resumo.materiais} materiais revisados</span></div>
        <Barrinha valor={resumo.percentual}/>
        <p>{desempenho.acertos} acertos em {desempenho.respondidas} questões</p>
        <button type="button" className="botao-link" onClick={irProgresso}>
          Ver detalhes <ArrowRight size={18}/></button>
      </div>
    </section>
    <section className="chamada-quiz prime-quiz-chamada">
      <span className="chamada-icone"><Brain size={29}/></span>
      <div><span>TESTE SEU CONHECIMENTO</span><h2>8 perguntas pra praticar</h2>
        <p>Responda, descubra o porquê e siga aprendendo.</p></div>
      <button type="button" className="botao-principal" onClick={irRevisao}>
        Começar revisão <ArrowRight size={18}/></button>
    </section>
  </div>
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
    <div className="pagina zelo-materiais-pagina">
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
    <div className="pagina zelo-leitura-pagina">
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
          <span className="sobretitulo">CONCLUINDO O ESTUDO</span>
          <h2>Seu ritmo, seu progresso</h2>
          <p>Terminou? Registre e faça uma revisão.</p>
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
      <div className="pagina zelo-revisao-pagina">
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
    <div className="pagina zelo-revisao-pagina">
      <CabecalhoSecao etiqueta="HORA DE PRATICAR" titulo="Vamos testar o que ficou?"
        descricao="Responda com calma e veja a explicação antes de ir pra próxima pergunta" />
      <div className="zelo-revisao-orientacao">
        <span><Brain size={19} aria-hidden="true"/> Revisão guiada</span>
        <strong>{resumo.respondidas} de {resumo.total} respostas registradas</strong>
      </div>
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
          <h3>Seu treino em números</h3>
          <p>Cada questão tem explicação. Use os erros para escolher o que revisar.</p>
          <div className="quiz-estatistica"><strong>{resumo.respondidas}/{resumo.total}</strong><span>respondidas até agora</span></div>
        </aside>
      </div>
    </div>
  )
}

function Progresso({ estado, pendentesPlano, irMateriais, irRevisao, irPlano, irTurma, limparProgresso }: {
  pendentesPlano: number
  estado: EstadoEstudos
  irMateriais: () => void
  irRevisao: () => void
  limparProgresso: () => void
  irPlano: () => void
  irTurma: () => void
}) {
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false)
  const [escolar,setEscolar]=useState<MeuDesempenho|null>(null)
  const [erroEscolar,setErroEscolar]=useState(false)
  useEffect(()=>{
    let ativo=true
    apiEscolar.meuDesempenho().then(resultado=>{
      if(ativo){setEscolar(resultado);setErroEscolar(false)}
    }).catch(()=>{if(ativo)setErroEscolar(true)})
    return()=>{ativo=false}
  },[])

  const resumo = resumoEstudos(materiais, estado.revisados, estado.respostas)
  const quiz = resumirRespostas(questoes, estado.respostas)
  return (
    <div className="pagina zelo-progresso-pagina">
      <CabecalhoSecao etiqueta="NO SEU RITMO" titulo="Meu progresso"
        descricao="Veja o que você já revisou e quais assuntos ainda pode explorar" />
      <section className="zelo-progresso-escolar" aria-labelledby="progresso-real-titulo">
        <div><span className="zelo-kicker">DADOS DO PORTAL ESCOLAR</span>
          <h2 id="progresso-real-titulo">O que você fez na sua turma</h2>
          <p>São atividades que os professores publicaram e suas respostas guardadas pela escola.
            Estes acertos não substituem notas escolares.</p></div>
        {!escolar&&!erroEscolar&&<p role="status">Carregando suas atividades escolares…</p>}
        {erroEscolar&&<p role="status">Não foi possível consultar o servidor agora. Seus dados escolares não foram substituídos por exemplos.</p>}
        {escolar&&<div className="zelo-escolar-numeros">
          <div><strong>{escolar.atividades}</strong><span>Publicadas</span></div>
          <div><strong>{escolar.respondidas}</strong><span>Respondidas</span></div>
          <div><strong>{escolar.acertos}</strong><span>Acertos</span></div>
        </div>}
        <button type="button" className="botao-principal" onClick={irTurma}>
          Abrir atividades da escola <ArrowRight size={18}/></button>
      </section>
      <p className="zelo-progresso-distincao"><Info size={16}/>
        Abaixo está seu estudo pessoal: marcações neste dispositivo, separadas do desempenho escolar.</p>
      <div className="progresso-layout">
        <section className="progresso-destaque">
          <span className="sobretitulo">MATERIAIS REVISADOS</span>
          <div className="progresso-numero"><strong>{resumo.percentual}%</strong><span>{resumo.revisados} de {resumo.materiais} materiais</span></div>
          <Barrinha valor={resumo.percentual} />
          <p>{resumo.percentual===100?'Biblioteca concluída! Revise suas respostas quando quiser.':resumo.revisados===0?'Comece por um material e acompanhe seu avanço aqui.':'Bom progresso. Continue com o próximo material no seu ritmo.'}</p>
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
      <section className="plano-progresso-atalho">
        <h2>Seu plano semanal</h2>
        <p>{pendentesPlano ? `${pendentesPlano} ${pendentesPlano === 1 ? 'tarefa pendente' : 'tarefas pendentes'} para organizar.` : 'Monte um plano de estudos por matéria.'}</p>
        <button type="button" className="botao-principal" onClick={irPlano}>Abrir plano <ArrowRight size={17}/></button>
      </section>
      <section className="limpar-progresso" aria-label="Reiniciar a demonstração">
        <h2>Quer começar do zero?</h2>
        <p>Reinicie apenas as marcações de materiais e as respostas dos quizzes demonstrativos.</p>
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

function EstudosApp({usuario,onSair}:{usuario:UsuarioEscolar;onSair:()=>Promise<void>}) {
  const [tela, setTela] = useState<Tela>('inicio')
  const [materialAberto, setMaterialAberto] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [materia, setMateria] = useState<FiltroMateria>('Todas')
  const [indiceQuiz, setIndiceQuiz] = useState(0)
  const [estado, setEstado] = useState<EstadoEstudos>(() => carregarEstado(armazenamentoDaConta(armazenamento(),usuario.id), materiais, questoes))
  const [escola, setEscola] = useState(() => carregarEscola(armazenamentoDaConta(armazenamento(),usuario.id)))
  const [plano, setPlano] = useState(() => carregarPlano(armazenamentoDaConta(armazenamento(),usuario.id)))
  const [aviso, setAviso] = useState('')
  const [saindo,setSaindo] = useState(false)
  const [menuAberto,setMenuAberto] = useState(false)
  const [paginaHub,setPaginaHub]=useState(0)
  const [configAberta,setConfigAberta] = useState(false)
  const materialAtual = materialAberto ? materiais.find((item) => item.id === materialAberto) : undefined

  useEffect(() => { salvarEstado(armazenamentoDaConta(armazenamento(),usuario.id), estado) }, [estado])
  useEffect(() => { salvarEscola(armazenamentoDaConta(armazenamento(),usuario.id), escola) }, [escola])
  useEffect(() => { salvarPlano(armazenamentoDaConta(armazenamento(),usuario.id), plano) }, [plano])
  useEffect(()=>{
    if(!menuAberto){setPaginaHub(0);return}
    const tempo=window.setInterval(()=>setPaginaHub(v=>(v+1)%capitulosHub.length),3300)
    return()=>window.clearInterval(tempo)
  },[menuAberto])
  useEffect(() => {
    document.documentElement.dataset.tema = escola.tema
    return () => { delete document.documentElement.dataset.tema }
  }, [escola.tema])

  const registrarEstudo = () => {
    const hoje = formatarDataLocal(new Date())
    setEscola((atual) => atual.diasEstudo.includes(hoje) ? atual :
      {...atual, diasEstudo: [...atual.diasEstudo.slice(-199), hoje]})
  }

  useEffect(() => {
    document.title = `${materialAtual?.titulo ?? menu.find((item) => item.id === tela)?.nome ?? 'Estudos'} — zELO+`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tela, materialAtual, indiceQuiz])

  function navegar(destino: Tela) {
    setMenuAberto(false)
    setConfigAberta(false)
    setTela(destino)
    setMaterialAberto(null)
    setAviso('')
    if (destino === 'revisao') {
      const proxima = questoes.findIndex((questao) =>
        !estado.respostas.some((resposta) => resposta.questaoId === questao.id))
      setIndiceQuiz(proxima === -1 ? questoes.length : proxima)
    }
  }
  const abrirMaterial = (item: Material) => { setMenuAberto(false); setConfigAberta(false); setTela('materiais'); setMaterialAberto(item.id); setAviso('') }
  const abrirPorId = (id: string) => {
    const material = materiais.find((item) => item.id === id)
    if (material) abrirMaterial(material)
  }
  const escolherMateria = (opcao: FiltroMateria) => { setMateria(opcao); setBusca(''); navegar('materiais') }
  const alternar = (id: string) => {
    const novo = alternarRevisado(estado.revisados, id, materiais)
    if (!estado.revisados.includes(id) && novo.includes(id)) registrarEstudo()
    setEstado((atual) => ({ ...atual, revisados: novo }))
    setAviso(novo.includes(id) ? 'Material marcado como revisado!' : 'Marcação removida')
  }
  const responder = (questao: Questao, opcao: number) => {
    if (estado.respostas.some((r) => r.questaoId === questao.id)
      || !Number.isInteger(opcao) || opcao < 0 || opcao >= questao.opcoes.length) return
    registrarEstudo()
    setEstado((atual) => ({ ...atual, respostas: responderQuestao(atual.respostas, questao, opcao) }))
  }
  const incluirTarefa = (tarefa: NovaTarefa) => {
    const id = `t-${crypto.randomUUID()}`
    const proximo = adicionarTarefa(plano, tarefa, id)
    setPlano(proximo)
  }
  const concluirTarefa = (id: string) => {
    if (plano.some((t) => t.id === id && !t.feito)) registrarEstudo()
    setPlano((atual) => alternarTarefa(atual, id))
  }
  const excluirTarefa = (id: string) => setPlano((atual) => removerTarefa(atual, id))
  const reagendar = (id: string, data: string) => setPlano((atual) => reagendarTarefa(atual, id, data))
  const dataDesafio = formatarDataLocal(new Date())
  const responderDesafio = (questaoId:string,opcao:number) => {
    if(escola.desafiosDiarios.some((r)=>r.data===dataDesafio))return
    setEscola((atual)=>({...atual,desafiosDiarios:registrarRespostaDiaria(atual.desafiosDiarios,dataDesafio,questaoId,opcao)}))
    registrarEstudo()
  }

  const apagarTudo = (): boolean => {
    const apagado=apagarDadosDoEstudos(armazenamentoDaConta(armazenamento(),usuario.id))
    if(!apagado) return false
    setEstado({revisados:[],respostas:[]})
    setPlano([])
    setEscola(estadoInicialEscola())
    setIndiceQuiz(0)
    setAviso('')
    return true
  }
  const encerrarSessao = async () => {
    if (saindo) return
    setSaindo(true)
    try { await onSair() }
    catch { setAviso('Não foi possível sair. Tente novamente.'); setSaindo(false) }
  }
  const reiniciarQuiz = () => { setEstado((atual) => ({ ...atual, respostas: [] })); setIndiceQuiz(0); setAviso('Quiz reiniciado! Bora tentar novamente') }

  return (
    <div className={`app-layout ${tela==='portal'?'zelo-modo-portal':''}`}>
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
        <div className="prime-navegacao-extras">
          <button type="button" onClick={()=>navegar('plano')}><ListChecks size={20}/> Meu plano</button>
          <button type="button" onClick={()=>navegar('jogo')}><Sparkles size={20}/> Desafios práticos</button>
        </div>
        <span className="navegacao-rodape">zELO+ · APRENDER E CONECTAR</span>
      </nav>
      <div className="layout-corpo">
        <header className="cabecalho-app prime-header">
          <div className="prime-brand"><ZeloMarca variante="compacta"/>
            <span className="prime-brand-legenda">Meu espaço de estudos</span>
          </div>
          <div className="prime-config">
            <button type="button" className="prime-config-botao" aria-label="Abrir configurações"
              aria-expanded={configAberta} aria-controls="prime-config-painel"
              onClick={()=>setConfigAberta(x=>!x)}><Settings2 size={23}/><span>Configurações</span></button>
            {configAberta&&<div className="prime-config-painel" id="prime-config-painel">
              <strong>Minha conta</strong>
              <p>{usuario.nome}</p>
              <button type="button" onClick={()=>setEscola(atual=>({...atual,tema:atual.tema==='claro'?'escuro':'claro'}))}>
                {escola.tema==='escuro'?<Sun size={19}/>:<Moon size={19}/>}
                {escola.tema==='escuro'?'Ativar modo claro':'Ativar modo escuro'}</button>
              <button type="button" onClick={()=>navegar('portal')}><School size={19}/> Minha turma</button>
              <button type="button" onClick={()=>{
                setConfigAberta(false)
                if(window.confirm('Apagar seus exercícios, plano e demonstrações salvas neste dispositivo? Sua conta escolar permanece ativa.'))apagarTudo()
              }}><RotateCcw size={19}/> Apagar dados locais de estudo</button>
              <button type="button" disabled={saindo} onClick={()=>void encerrarSessao()}>
                <LogOut size={19}/> {saindo?'Saindo...':'Sair da conta'}</button>
            </div>}
          </div>
        </header>
        <main className="conteudo-principal">
          {materialAtual ? (
            <LerMaterial material={materialAtual} revisado={estado.revisados.includes(materialAtual.id)}
              onVoltar={() => setMaterialAberto(null)} onAlternar={alternar} irRevisao={() => navegar('revisao')} />
          ) : (
            <>
              {tela === 'inicio' && <Inicio estado={estado} sequencia={diasConsecutivosEstudados(escola.diasEstudo)}
                pendentesPlano={resumoPlano(plano).pendentes} tarefasPlano={plano} concluirTarefa={concluirTarefa}
                dataDesafio={dataDesafio} respostaDesafio={escola.desafiosDiarios.find((r)=>r.data===dataDesafio)}
                responderDesafio={responderDesafio}
                irPlano={() => navegar('plano')}
                irEscola={() => navegar('escola')} irJogo={() => navegar('jogo')} abrirMaterial={abrirMaterial}
                escolherMateria={escolherMateria} irMateriais={() => navegar('materiais')}
                irRevisao={() => navegar('revisao')} irProgresso={() => navegar('progresso')}
                irTurma={() => navegar('portal')}/>}
              {tela === 'materiais' && <MateriaisPagina estado={estado} busca={busca} setBusca={setBusca}
                materia={materia} setMateria={setMateria} abrirMaterial={abrirMaterial}/>}
              {tela === 'revisao' && <QuizPagina estado={estado} indice={indiceQuiz} setIndice={setIndiceQuiz}
                responder={responder} irMateriais={() => navegar('materiais')} reiniciar={reiniciarQuiz}/>}
              {tela === 'escola' && <Escola estado={escola} atualizar={setEscola} abrirMaterial={abrirPorId}/>}
              {tela === 'jogo' && <Jogo voltar={() => navegar('inicio')}/>}
              {tela === 'portal' && <Portal usuario={usuario} onSair={onSair} voltar={() => navegar('inicio')}/>}
              {tela === 'plano' && <Plano tarefas={plano} adicionar={incluirTarefa} alternar={concluirTarefa}
                remover={excluirTarefa} reagendar={reagendar} abrirMaterial={abrirPorId} voltar={() => navegar('inicio')}
                irTurma={() => navegar('portal')}/>}
              {tela === 'progresso' && <Progresso estado={estado} pendentesPlano={resumoPlano(plano).pendentes}
                irPlano={() => navegar('plano')} irMateriais={() => navegar('materiais')}
                irRevisao={() => navegar('revisao')} irTurma={() => navegar('portal')}
                limparProgresso={() => {setEstado({ revisados: [], respostas: [] }); setAviso('Demonstração reiniciada')}}
                />}
            </>
          )}
        </main>
        <footer className="rodape-app">zELO+ · Biblioteca demonstrativa · Registros escolares somente no portal</footer>
      </div>
      {tela!=='portal'&&<div className="prime-mobile-nav">
        {menuAberto&&<>
          <button type="button" className="prime-menu-sombra" aria-label="Fechar menu" onClick={()=>setMenuAberto(false)}/>
          <nav className="prime-menu-painel" aria-label="Todas as áreas de estudos" id="prime-menu-areas">
            <div className="prime-menu-cabecalho"><div><span>ESCOLHA UM DESTINO</span><strong>Onde vamos agora?</strong></div>
              <button type="button" aria-label="Fechar menu" onClick={()=>setMenuAberto(false)}><X size={22}/></button>
            </div>
            <div className="prime-menu-destaques" aria-label="Mais opções de estudo">
              {menu.filter(x=>x.id==='escola'||x.id==='portal').map(({id,nome,Icone})=>
                <button type="button" key={id} className="prime-menu-destaque"
                  onClick={()=>navegar(id)}>
                  <span className="prime-menu-destaque-icon"><Icone size={27}/></span>
                  <span className="zelo-destino"><strong>{nome}</strong><small>{id==='portal'?'Sua escola e professores':'Experimente novos desafios'}</small></span><ArrowRight size={18}/>
                </button>)}
              <button type="button" className="prime-menu-destaque" onClick={()=>navegar('plano')}>
                <span className="prime-menu-destaque-icon"><ListChecks size={27}/></span>
                <span className="zelo-destino"><strong>Meu plano</strong><small>Organize a semana</small></span><ArrowRight size={18}/>
              </button>
              <button type="button" className="prime-menu-destaque" onClick={()=>navegar('jogo')}>
                <span className="prime-menu-destaque-icon"><Sparkles size={27}/></span>
                <span className="zelo-destino"><strong>Desafios práticos</strong><small>Aprenda jogando</small></span><ArrowRight size={18}/>
              </button>
            </div>
            <span className="prime-menu-subtitulo">Acesso rápido</span>
            <div className="prime-menu-secundarios" aria-label="Navegação principal">
              {menu.filter(x=>['inicio','materiais','revisao','progresso'].includes(x.id))
                .map(({id,nome,Icone})=><button type="button" key={id}
                  className={tela===id?'ativo':''} onClick={()=>navegar(id)}>
                  <Icone size={19}/><span>{nome}</span>
                </button>)}
            </div>
          </nav>
        </>}
        <nav className="prime-bottom-nav" aria-label="Navegação rápida">
          <button type="button" className={tela==='inicio'?'ativo':''} aria-current={tela==='inicio'?'page':undefined}
            onClick={()=>navegar('inicio')}><Home size={23}/><span>Início</span></button>
          <button type="button" className={tela==='materiais'?'ativo':''} aria-current={tela==='materiais'?'page':undefined}
            onClick={()=>navegar('materiais')}><BookOpen size={23}/><span>Materiais</span></button>
          <button type="button" className={'prime-menu-livro '+(menuAberto?'aberto':'')}
            aria-label={menuAberto?'Fechar menu de áreas':'Abrir menu de áreas'} aria-expanded={menuAberto}
            aria-controls="prime-menu-areas" onClick={()=>setMenuAberto(x=>!x)}>
            <span className="zelo-livro-cenario" aria-hidden="true">
              <span className="zelo-livro-esquerda"><span/></span>
              <span className="zelo-livro-pagina zelo-livro-pagina-1"/>
              <span className="zelo-livro-pagina zelo-livro-pagina-2"/>
              <span className="zelo-livro-pagina zelo-livro-pagina-3"/>
              <span className="zelo-livro-direita"><BookOpenCheck size={20}/></span>
              <span className="zelo-livro-espinha"/>
              {menuAberto&&<span className="zelo-livro-overlay" key={paginaHub}>
                <span className="zelo-livro-conteudo">{capitulosHub[paginaHub].esquerda}</span>
                <span className="zelo-livro-conteudo">{capitulosHub[paginaHub].direita}</span>
              </span>}
            </span>
          </button>
          <button type="button" className={tela==='revisao'?'ativo':''} aria-current={tela==='revisao'?'page':undefined}
            onClick={()=>navegar('revisao')}><Brain size={23}/><span>Revisão</span></button>
          <button type="button" onClick={()=>navegar('portal')}>
              <School size={23}/><span>Minha turma</span>
            </button>
        </nav>
      </div>}
      {aviso && <div className="aviso-flutuante" role="status">
        <span><Check size={18}/>{aviso}</span>
        <button type="button" onClick={() => setAviso('')} aria-label="Fechar aviso"><X size={20}/></button>
      </div>}
    </div>
  )
}

type FaseSessao = 'verificando' | 'login' | 'autenticado' | 'indisponivel'

export default function App() {
  const [fase,setFase]=useState<FaseSessao>('verificando')
  const [usuario,setUsuario]=useState<UsuarioEscolar|null>(null)
  const loginManual=useRef(false)
  useEffect(()=>{
    let ativa=true
    apiEscolar.me()
      .then(pessoa=>{
        paginaDoUsuario(pessoa)
        if(ativa&&!loginManual.current){setUsuario(pessoa);setFase('autenticado')}
      })
      .catch(erro=>{if(ativa&&!loginManual.current)setFase(erroNaVerificacaoDeSessao(erro))})
    return ()=>{ativa=false}
  },[])
  const entrar=(pessoa:UsuarioEscolar)=>{
    paginaDoUsuario(pessoa)
    loginManual.current=true
    setUsuario(pessoa)
    setFase('autenticado')
  }
  const sair=async()=>{
    await apiEscolar.logout()
    setUsuario(null)
    setFase('login')
  }
  if(fase==='verificando')return <main className="entrada-extensao entrada-login">
    <div className="entrada-marca"><ZeloMarca variante="compacta"/></div>
    <PortalLogin entrar={entrar}/>
    <p className="entrada-rodape" role="status">Verificando sessão existente. A primeira conexão pode demorar no servidor gratuito.</p>
  </main>
  if(fase==='indisponivel')return <main className="entrada-extensao">
    <section className="entrada-status" role="alert">
      <School size={29}/>
      <h1>Acesso temporariamente indisponível</h1>
      <p>Não foi possível confirmar sua sessão. Tente novamente quando a API estiver disponível.</p>
      <button type="button" className="botao-principal" onClick={()=>window.location.reload()}>Tentar novamente</button>
    </section>
  </main>
  if(fase==='autenticado'&&usuario){
    if(paginaDoUsuario(usuario)==='estudos')
      return <EstudosApp key={usuario.id} usuario={usuario} onSair={sair}/>
    return <div className="entrada-funcionario">
      <Portal key={usuario.id} usuario={usuario} onSair={sair}/>
    </div>
  }
  return <main className="entrada-extensao entrada-login">
    <div className="entrada-marca"><ZeloMarca variante="compacta"/></div>
    <PortalLogin entrar={entrar}/>
    <p className="entrada-rodape">Área escolar protegida · Alunos, professores e direção</p>
  </main>
}
