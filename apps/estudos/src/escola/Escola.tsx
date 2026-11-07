import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  ArrowRight, BookOpen, CalendarCheck, Check, CheckCheck, ClipboardCheck,
  Clock3, Download, Flame, Heart, Info, MessageSquareText, Newspaper,
  Send, ShieldAlert, SunMoon, TrendingUp, X,
} from 'lucide-react'
import { disciplinas, gerarFrequenciaDemo, notasDemo, publicacoes } from './dados'
import { faltasAteMeta, filtroPeriodo, formatarDataLocal, mediaNotas,
  proximoDiaLetivo, resumirFrequencia, type Periodo } from './regras'
import { diasConsecutivosEstudados, type EstadoEscola, type MensagemFeedback } from './estado'

type AbaEscola = 'frequencia' | 'notas' | 'feed' | 'feedback'
type Props = {
  estado: EstadoEscola
  atualizar: Dispatch<SetStateAction<EstadoEscola>>
  abrirMaterial: (id: string) => void
}
const referencias = ['semana', 'mes', 'ano'] as const
const meta = 80
const linkOficial = 'https://www.gov.br/mec/pt-br/pe-de-meia/pe-de-meia'
const labels: Record<Periodo, string> = {semana:'Esta semana',mes:'Este mês',ano:'Este ano'}
const dataBonita = (iso: string) => {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {weekday:'long',day:'2-digit',month:'long'})
}

function RotuloDemo({children}:{children:React.ReactNode}) {
  return <span className="escola-demo"><Info size={14} aria-hidden="true" /> {children}</span>
}

function Frequencia({estado, atualizar}: Pick<Props,'estado' | 'atualizar'>) {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const hoje = useMemo(() => new Date(), [])
  const aulas = useMemo(() => gerarFrequenciaDemo(hoje), [hoje])
  const filtradas = filtroPeriodo(aulas, periodo, hoje)
  const resumo = resumirFrequencia(filtradas)
  const proximo = proximoDiaLetivo(hoje)
  const previsao = estado.previsao?.data === proximo ? estado.previsao.valor : null
  const percentual = resumo.percentual
  return (
    <div className="escola-secao">
      <div className="escola-heading">
        <div>
          <span className="sobretitulo">FREQUÊNCIA ESCOLAR</span>
          <h2>Fica de olho na presença ✳</h2>
          <p>Confira como seria acompanhar a frequência da escola, incluindo cada matéria</p>
        </div>
        <RotuloDemo>dados de exemplo</RotuloDemo>
      </div>
      <div className="escola-tabs escola-periodos" role="group" aria-label="Período da frequência">
        {referencias.map((p) => <button key={p} type="button" className={periodo === p ? 'ativo':''}
          aria-pressed={periodo === p} onClick={() => setPeriodo(p)}>{labels[p]}</button>)}
      </div>
      <div className="escola-resumo-grade">
        <section className="escola-resumo-principal" aria-label="Frequência do período">
          <span>FREQUÊNCIA GERAL · {labels[periodo].toUpperCase()}</span>
          <div className="escola-resumo-valor">
            <strong>{percentual === null ? '—' : `${percentual}%`}</strong>
            <span>{percentual === null ? 'Sem aulas registradas' : percentual >= meta ? 'Acima da referência de 80%' : 'Abaixo da referência de 80%'}</span>
          </div>
          <div className="escola-progresso" role="progressbar" aria-label="Frequência geral"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentual ?? 0}>
            <span style={{width:`${percentual ?? 0}%`}}/>
          </div>
          <small>Simulação baseada em aulas; não é registro oficial nem análise de benefício</small>
        </section>
        <div className="escola-mini">
          <span className="escola-mini-icon"><CalendarCheck size={21}/></span>
          <strong>{resumo.presencas}</strong><span>Aulas presentes</span>
        </div>
        <div className="escola-mini">
          <span className="escola-mini-icon aviso"><Clock3 size={21}/></span>
          <strong>{resumo.faltas}</strong><span>Aulas ausentes</span>
        </div>
      </div>

      <section className="escola-bloco" aria-label="Frequência por disciplina">
        <div className="escola-bloco-titulo">
          <div><span className="sobretitulo">DETALHE POR MATÉRIA</span><h3>Onde preciso prestar atenção?</h3></div>
          <span>{labels[periodo]}</span>
        </div>
        <div className="escola-disciplinas">
          {disciplinas.map((disciplina) => {
            const r = resumirFrequencia(filtradas, disciplina)
            const limite = faltasAteMeta(r.presencas,r.aulas,meta)
            return <article className="escola-disciplina" key={disciplina}>
              <div className="escola-materia-topo">
                <div><strong>{disciplina}</strong><small>{r.presencas} presentes de {r.aulas} aulas</small></div>
                <strong className={r.percentual !== null && r.percentual < meta ? 'escola-atenção' : ''}>{r.percentual === null ? '—' : `${r.percentual}%`}</strong>
              </div>
              <div className="escola-progresso pequeno" role="progressbar" aria-label={`Frequência em ${disciplina}`}
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.percentual ?? 0}>
                <span style={{width:`${r.percentual ?? 0}%`}} />
              </div>
              <p>{r.aulas === 0 ? 'Sem registros neste período' :
                r.percentual !== null && r.percentual < meta ? 'Atenção: abaixo de 80% na simulação' :
                `Até ${limite} ${limite === 1 ? 'falta adicional' : 'faltas adicionais'} sem cair abaixo de 80%, se não houver novas presenças`}</p>
            </article>
          })}
        </div>
        <p className="escola-explicacao"><Info size={17}/> As estimativas por matéria são educativas. As regras oficiais de benefícios consideram a frequência geral em horas letivas e os dados enviados pela escola.</p>
      </section>

      <section className="escola-bloco pe-de-meia">
        <div className="escola-alerta-icon"><ShieldAlert size={22}/></div>
        <div>
          <h3>Pé-de-Meia: informação, não decisão</h3>
          <p>O programa federal utiliza referência de frequência mínima de 80%, considerando regras mensais e acumuladas. O aplicativo não informa se você tem direito, perdeu ou receberá parcelas.</p>
          <a href={linkOficial} target="_blank" rel="noopener noreferrer">Consultar informações oficiais <ArrowRight size={16}/></a>
        </div>
      </section>

      <section className="escola-bloco escola-proxima-presenca">
        <div className="escola-bloco-titulo"><div>
          <span className="sobretitulo">PLANEJAMENTO</span><h3>Você pretende ir à próxima aula?</h3>
        </div></div>
        <p>Próximo dia de semana: <strong>{dataBonita(proximo)}</strong>. Isso é só uma previsão pessoal; não registra presença ou justifica falta.</p>
        <div className="escola-opcoes" role="group" aria-label="Sua previsão para o próximo dia de semana">
          {([{valor:'vou',nome:'Vou sim 🙌'},{valor:'talvez',nome:'Talvez 🤔'},{valor:'nao',nome:'Não vou'}] as const).map((opcao) =>
            <button key={opcao.valor} type="button" aria-pressed={previsao === opcao.valor}
              className={previsao === opcao.valor ? 'ativo':''}
              onClick={() => atualizar((atual) => ({...atual,previsao:{data:proximo,valor:opcao.valor}}))}>
              {opcao.nome}{previsao === opcao.valor && <Check size={17}/>}
            </button>)}
        </div>
        {previsao && <p className="escola-confirmacao" role="status"><Check size={17}/> Previsão salva apenas neste navegador</p>}
      </section>
    </div>
  )
}

function Notas() {
  const medias = notasDemo.map((n) => mediaNotas(n.bimestres)).filter((n):n is number => n !== null)
  const geral = medias.length ? (medias.reduce((a,b)=>a+b,0)/medias.length).toFixed(1).replace('.',',') : '—'
  return (
    <div className="escola-secao">
      <div className="escola-heading">
        <div><span className="sobretitulo">NOTAS POR MATÉRIA</span><h2>Seu boletim, sem confusão</h2>
          <p>Um exemplo de como acompanhar notas, médias parciais e disciplinas num só lugar</p></div>
        <RotuloDemo>boletim fictício</RotuloDemo>
      </div>
      <div className="escola-nota-hero"><span>MÉDIA DAS DISCIPLINAS · EXEMPLO</span>
        <strong>{geral}</strong><p>Média ilustrativa das notas parciais; não determina aprovação nem substitui boletim oficial</p>
      </div>
      <div className="escola-notas-grade">
        {notasDemo.map((linha) => {
          const media = mediaNotas(linha.bimestres)
          return <section className="escola-nota-card" key={linha.materia}>
            <div className="escola-nota-topo"><span>{linha.materia}</span><strong>{media?.toFixed(1).replace('.',',') ?? '—'}</strong></div>
            <div className="escola-nota-bimestres">{linha.bimestres.map((nota, i) =>
              <div key={i}><small>{i+1}º BIM</small><strong>{nota === null ? '—':nota.toFixed(1).replace('.',',')}</strong></div>)}</div>
            <p>Parcial das notas disponíveis · exemplo didático</p>
          </section>
        })}
      </div>
      <div className="escola-lembrete"><Info size={20}/> O cálculo de nota final, recuperação e aprovação depende das regras da escola. Aqui não existe cadastro nem dados reais de alunos.</div>
    </div>
  )
}

function Feed({estado,atualizar,abrirMaterial}:Props) {
  return <div className="escola-secao">
    <div className="escola-heading">
      <div><span className="sobretitulo">MURAL DE CONTEÚDOS</span><h2>O que os professores postaram?</h2>
        <p>Um feed escolar organizado por matéria, inspirado no jeito simples de acompanhar as novidades</p></div>
      <RotuloDemo>publicações fictícias</RotuloDemo>
    </div>
    <div className="escola-feed">
      {publicacoes.map((post) => {
        const curtiu = estado.curtidos.includes(post.id)
        const leu = estado.lidos.includes(post.id)
        return <article className="escola-post" key={post.id}>
          <header className="escola-post-cabecalho">
            <span className="escola-avatar">{post.iniciais}</span>
            <div><strong>{post.nome} <span>· perfil demonstrativo</span></strong><small>{post.disciplina} · {post.quando}</small></div>
            {post.fixado && <span className="escola-fixado">FIXADO</span>}
          </header>
          <div className="escola-post-conteudo"><h3>{post.titulo}</h3><p>{post.texto}</p></div>
          <div className="escola-post-acoes">
            <button type="button" aria-pressed={curtiu} className={curtiu ? 'ativo':''} onClick={() =>
              atualizar((anterior) => ({...anterior,curtidos:curtiu ?
                anterior.curtidos.filter((id)=>id!==post.id) : [...anterior.curtidos,post.id]}))}>
              <Heart size={18} fill={curtiu ? 'currentColor':'none'}/> {curtiu ? 'Gostei' : 'Curtir'}
            </button>
            <button type="button" aria-pressed={leu} onClick={() => atualizar((atual) =>
              ({...atual,lidos:leu ? atual.lidos.filter((id)=>id!==post.id) : [...atual.lidos,post.id]}))}>
              <CheckCheck size={18}/> {leu ? 'Lido' : 'Marcar lido'}
            </button>
            {post.materialId && <button className="escola-abrir" type="button" onClick={() => abrirMaterial(post.materialId!)}>
              Ver material <ArrowRight size={17}/></button>}
          </div>
        </article>
      })}
    </div>
  </div>
}

function Feedback({estado,atualizar}:Pick<Props,'estado'|'atualizar'>) {
  const [categoria,setCategoria] = useState<MensagemFeedback['categoria']>('Sugestão')
  const [texto,setTexto] = useState('')
  const [status,setStatus] = useState('')
  const hoje = formatarDataLocal(new Date())
  const salvar = () => {
    const mensagem = texto.trim()
    if (mensagem.length < 3) {setStatus('Escreva pelo menos 3 caracteres.');return}
    const novo: MensagemFeedback = {id:`${Date.now()}-${Math.round(Math.random()*9999)}`,categoria,texto:mensagem.slice(0,350),data:hoje}
    atualizar((atual) => ({...atual,feedback:[...atual.feedback.slice(-19),novo]}))
    setTexto('')
    setStatus('Feedback salvo neste navegador. Para enviar à equipe, copie a mensagem abaixo.')
  }
  const copiar = async (mensagem: MensagemFeedback) => {
    try {
      await navigator.clipboard.writeText(`Projeto Extensão - ${mensagem.categoria}\n${mensagem.texto}`)
      setStatus('Mensagem copiada! Agora pode enviar à equipe.')
    } catch {setStatus('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.')}
  }
  return <div className="escola-secao">
    <div className="escola-heading"><div><span className="sobretitulo">SUA VOZ IMPORTA</span><h2>O que a gente pode melhorar?</h2>
      <p>O próximo passo do projeto começa com a opinião de quem vai usar</p></div><RotuloDemo>rascunho local</RotuloDemo></div>
    <div className="escola-feedback-layout">
      <section className="escola-bloco">
        <h3>Conta pra gente</h3>
        <p>Esta versão não envia mensagens para ninguém. O texto fica no navegador e você pode copiar para mandar à equipe.</p>
        <form className="escola-form" onSubmit={(evento) => {evento.preventDefault();salvar()}}>
          <label htmlFor="escola-categoria">Tipo de mensagem</label>
          <select id="escola-categoria" value={categoria} onChange={(e)=>setCategoria(e.target.value as MensagemFeedback['categoria'])}>
            <option>Sugestão</option><option>Problema</option><option>Elogio</option>
          </select>
          <label htmlFor="escola-texto">Sua mensagem (sem informações pessoais)</label>
          <textarea id="escola-texto" rows={5} minLength={3} maxLength={350} value={texto}
            onChange={(e)=>setTexto(e.target.value)} placeholder="Ex.: seria legal ter exercícios de química..." required/>
          <div className="escola-form-final"><small>{texto.length}/350 caracteres</small>
            <button className="botao-principal" type="submit"><MessageSquareText size={18}/> Salvar rascunho</button></div>
          {status && <p className="escola-feedback-status" role="status">{status}</p>}
        </form>
      </section>
      <section className="escola-bloco">
        <h3>Minhas mensagens</h3>
        {estado.feedback.length ? <div className="escola-feedback-lista">{[...estado.feedback].reverse().map((m) =>
          <article key={m.id}><span>{m.categoria} · {m.data.split('-').reverse().join('/')}</span>
            <p>{m.texto}</p><button type="button" className="botao-secundario" onClick={()=>copiar(m)}>Copiar pra enviar <ArrowRight size={16}/></button>
          </article>)}</div> : <p>Nenhum rascunho salvo ainda. Sua opinião vai ajudar muito!</p>}
      </section>
    </div>
  </div>
}

export default function Escola({estado,atualizar,abrirMaterial}:Props) {
  const [aba,setAba] = useState<AbaEscola>('frequencia')
  const [offlineStatus,setOfflineStatus] = useState('')
  const seq = diasConsecutivosEstudados(estado.diasEstudo)
  const baixarOffline = async () => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
      setOfflineStatus('O download offline funciona na versão compilada/publicada (build + preview), não no servidor de desenvolvimento.')
      return
    }
    try {
      const {baixarAplicativo} = await import('./offline')
      await baixarAplicativo()
      setOfflineStatus('Conteúdos do app guardados no dispositivo. Abra novamente offline para testar.')
    } catch {
      setOfflineStatus('Não foi possível preparar o cache. Conecte à internet e tente novamente.')
    }
  }
  return (
    <div className="pagina escola-app">
      <header className="cabecalho-secao escola-cabecalho">
        <span className="sobretitulo">FEITO COM AS IDEIAS DOS ALUNOS</span>
        <h1>A escola, do seu jeito.</h1>
        <p>Frequência, notas, conteúdos e sugestões, tudo no mesmo cantinho do seu estudo</p>
      </header>
      <div className="escola-barra-superior">
        <span><Flame size={20}/> {seq} {seq===1 ? 'dia seguido de estudo':'dias seguidos de estudo'}</span>
        <button type="button" onClick={baixarOffline}><Download size={18}/> Guardar para offline</button>
      </div>
      {offlineStatus && <div className="escola-lembrete" role="status"><Info size={18}/>{offlineStatus}
        <button type="button" aria-label="Fechar aviso" onClick={()=>setOfflineStatus('')}><X size={17}/></button></div>}
      <nav className="escola-seletores" aria-label="Áreas da escola">
        {([
          {id:'frequencia',nome:'Frequência',Icone:CalendarCheck},
          {id:'notas',nome:'Notas',Icone:ClipboardCheck},
          {id:'feed',nome:'Feed',Icone:Newspaper},
          {id:'feedback',nome:'Feedback',Icone:MessageSquareText},
        ] as const).map(({id,nome,Icone}) =>
          <button type="button" key={id} className={aba === id ? 'ativo':''}
            aria-current={aba === id ? 'page':undefined} onClick={()=>setAba(id)}>
            <Icone size={19}/>{nome}</button>)}
      </nav>
      {aba === 'frequencia' && <Frequencia estado={estado} atualizar={atualizar}/>}
      {aba === 'notas' && <Notas/>}
      {aba === 'feed' && <Feed estado={estado} atualizar={atualizar} abrirMaterial={abrirMaterial}/>}
      {aba === 'feedback' && <Feedback estado={estado} atualizar={atualizar}/>}
    </div>
  )
}
