import {useEffect,useState} from 'react'
import type {FormEvent} from 'react'
import {ArrowRight,BookOpen,CheckCircle2,FileText,Sparkles} from 'lucide-react'
import {apiEscolar} from './api'
import type {DisciplinaIaAluno,SimuladoDetalhe,SimuladoResumo,StatusIa} from './api'
import {Aviso,Cartao,Vazio,falha} from './ComponentesPortal'

type Nivel='FACIL'|'MEDIO'|'DIFICIL'
const niveis:Record<Nivel,string>={
  FACIL:'Fácil — conceitos e aplicação direta',
  MEDIO:'Médio — interpretação e raciocínio',
  DIFICIL:'Difícil — problemas complexos',
}

export default function ProvaAluno(){
  const [disciplinas,setDisciplinas]=useState<DisciplinaIaAluno[]>([])
  const [ia,setIa]=useState<StatusIa|null>(null)
  const [historico,setHistorico]=useState<SimuladoResumo[]>([])
  const [selecionado,setSelecionado]=useState('')
  const [tema,setTema]=useState('')
  const [nivel,setNivel]=useState<Nivel>('MEDIO')
  const [texto,setTexto]=useState('')
  const [pdf,setPdf]=useState<File|null>(null)
  const [prova,setProva]=useState<SimuladoDetalhe|null>(null)
  const [escolhas,setEscolhas]=useState<Record<number,number>>({})
  const [confirmar,setConfirmar]=useState(false)
  const [ocupado,setOcupado]=useState(false)
  const [carregando,setCarregando]=useState(true)
  const [erro,setErro]=useState('')
  const [ok,setOk]=useState('')

  useEffect(()=>{
    let ativo=true
    Promise.all([apiEscolar.disciplinasIaAluno(),apiEscolar.statusIa(),apiEscolar.listarSimulados()])
      .then(([d,s,h])=>{
        if(!ativo)return
        setDisciplinas(d);setIa(s);setHistorico(h)
        if(d.length)setSelecionado(d[0].turmaId+':'+d[0].disciplina)
      }).catch(e=>{if(ativo)setErro(falha(e))})
      .finally(()=>{if(ativo)setCarregando(false)})
    return()=>{ativo=false}
  },[])
  const materia=disciplinas.find(d=>d.turmaId+':'+d.disciplina===selecionado)
  const completo=prova?.questoes.length===5&&prova.questoes.every(q=>Number.isInteger(escolhas[q.id]))

  const lerPdf=async()=>{
    if(!pdf||!materia||ocupado)return
    setOcupado(true);setErro('');setOk('')
    try{
      const r=await apiEscolar.extrairPdfAluno(materia.turmaId,materia.disciplina,pdf)
      setTexto(r.texto)
      setOk('Texto extraído. Revise-o antes de enviar à IA.'+
        (r.truncado?' Foram utilizados apenas os primeiros 6.000 caracteres.':''))
    }catch(e){setErro(falha(e))}
    finally{setOcupado(false)}
  }
  const gerar=async(e:FormEvent)=>{
    e.preventDefault()
    if(!materia||!ia?.habilitada||ia.restantesHoje<1||ocupado)return
    setOcupado(true);setErro('');setOk('');setConfirmar(false)
    try{
      const r=await apiEscolar.gerarSimulado({
        turmaId:materia.turmaId,disciplina:materia.disciplina,tema:tema.trim(),
        dificuldade:nivel,fonteTexto:texto})
      setProva(r);setEscolhas({})
      setIa(atual=>atual?{...atual,restantesHoje:Math.max(0,atual.restantesHoje-1)}:atual)
      setOk('Prova gerada. Responda às cinco questões.')
      try{setHistorico(await apiEscolar.listarSimulados())}
      catch{setErro('A prova foi criada, mas o histórico não atualizou. Recarregue para conferir.')}
    }catch(e){setErro(falha(e))}
    finally{setOcupado(false)}
  }
  const abrir=async(id:number)=>{
    if(ocupado)return
    setOcupado(true);setErro('');setOk('');setConfirmar(false)
    try{
      setProva(await apiEscolar.detalharSimulado(id));setEscolhas({})
    }catch(e){setErro(falha(e))}
    finally{setOcupado(false)}
  }
  const entregar=async()=>{
    if(!prova||prova.nota!==null||!completo||!confirmar||ocupado)return
    setOcupado(true);setErro('');setConfirmar(false)
    try{
      const respostas=prova.questoes.map(q=>({questaoId:q.id,opcao:escolhas[q.id]}))
      const resultado=await apiEscolar.responderSimulado(prova.id,respostas)
      setProva(resultado)
      setOk('Simulado corrigido. Confira as explicações.')
      try{setHistorico(await apiEscolar.listarSimulados())}
      catch{setErro('Sua nota foi salva, mas o histórico não atualizou. Recarregue para conferir.')}
    }catch(e){setErro(falha(e)+' Se a entrega foi salva, reabra pelo histórico.')}
    finally{setOcupado(false)}
  }

  return <div className="ext-docente">
    <Cartao titulo="Prova · Preparação individual" classe="prova-valida">
      <p className="portal-aviso-discreto">
        <BookOpen size={17}/> Cinco questões para estudar. A nota vai de 0 a 10.
        <strong> Não é nota escolar</strong> e não altera boletim ou avaliação do professor.
      </p>
      <Aviso estado={{ok,erro}}/>
      {carregando&&<p>Carregando suas disciplinas...</p>}
      {!carregando&&disciplinas.length===0&&
        <Vazio texto="A direção precisa matricular você numa turma com disciplina vinculada."/>}
      {!carregando&&disciplinas.length>0&&<>
        <p className="portal-aviso-discreto" role="status">
          {ia?.habilitada?
            'IA disponível · '+ia.restantesHoje+' gerações restantes hoje.':
            'IA generativa indisponível neste ambiente. O histórico continua acessível.'}
        </p>
        <form className="portal-form" onSubmit={e=>void gerar(e)}>
          <label htmlFor="prova-disciplina">Disciplina</label>
          <select id="prova-disciplina" value={selecionado} required
            onChange={e=>{setSelecionado(e.target.value);setTexto('');setPdf(null)}}>
            {disciplinas.map(d=><option key={d.turmaId+':'+d.disciplina}
              value={d.turmaId+':'+d.disciplina}>{d.disciplina} · {d.turmaNome}</option>)}
          </select>
          <label htmlFor="prova-tema">Assunto da prova</label>
          <textarea id="prova-tema" rows={2} required minLength={3} maxLength={300}
            value={tema} onChange={e=>setTema(e.target.value)}
            placeholder="Ex.: equações, Bhaskara, gráficos e interpretação"/>
          <label htmlFor="prova-nivel">Escolha a dificuldade</label>
          <select id="prova-nivel" value={nivel}
            onChange={e=>setNivel(e.target.value as Nivel)}>
            {Object.entries(niveis).map(([id,descricao])=>
              <option key={id} value={id}>{descricao}</option>)}
          </select>
          <label htmlFor="prova-pdf">PDF de referência (opcional)</label>
          <input id="prova-pdf" type="file" accept=".pdf,application/pdf"
            onChange={e=>setPdf(e.target.files?.[0]||null)}/>
          <button type="button" className="botao-secundario" disabled={!pdf||ocupado}
            onClick={()=>void lerPdf()}><FileText size={17}/> Ler PDF para revisão</button>
          <small>PDF com texto selecionável, sem senha, até 2 MB e 12 páginas. Arquivo não é guardado.</small>
          <label htmlFor="prova-texto">Texto para estudo (opcional)</label>
          <textarea id="prova-texto" rows={4} maxLength={6000} value={texto}
            onChange={e=>setTexto(e.target.value)}
            placeholder="Cole anotações ou revise aqui o texto extraído."/>
          <small>Não envie nomes, dados de colegas nem documentos pessoais. Este texto será enviado ao provedor de IA ao gerar.</small>
          <button type="submit" className="botao-principal"
            disabled={ocupado||!ia?.habilitada||!ia.restantesHoje||!materia||tema.trim().length<3}>
            <Sparkles size={18}/> {ocupado?'Gerando...':'Gerar prova de treino'} <ArrowRight size={17}/>
          </button>
        </form>
      </>}
    </Cartao>

    {prova&&<Cartao titulo={prova.nota===null?'Responder simulado':'Resultado da prova'}>
      <p className="portal-aviso-discreto">{prova.disciplina} · {niveis[prova.dificuldade]} · {prova.tema}</p>
      {prova.nota!==null&&<div className="portal-resultado" role="status">
        <strong>Nota de treino: {prova.nota}/10</strong>
        <p>{prova.acertos} de 5 acertos. Não é nota escolar.</p>
      </div>}
      {prova.questoes.map((q,i)=><article key={q.id} className="portal-atividade">
        <span className="sobretitulo">Questão {i+1} de 5</span>
        <h3>{q.titulo}</h3><p>{q.pergunta}</p>
        <div className="portal-alternativas" role="group" aria-label={'Questão '+(i+1)}>
          {q.opcoes.map((alt,n)=><button key={n} type="button"
            disabled={ocupado||prova.nota!==null}
            className={(prova.nota===null?escolhas[q.id]===n:q.opcaoMarcada===n)?'selecionada':''}
            aria-pressed={prova.nota===null?escolhas[q.id]===n:q.opcaoMarcada===n}
            onClick={()=>{setEscolhas(prev=>({...prev,[q.id]:n}));setConfirmar(false)}}>
            <strong>{String.fromCharCode(65+n)}</strong> {alt}
          </button>)}
        </div>
        {prova.nota!==null&&<div className="portal-resultado">
          <strong>{q.acertou?'Você acertou.':'Revise esta questão.'}
            {' '}Gabarito: {String.fromCharCode(65+(q.correta??0))}</strong>
          <p>{q.explicacao}</p>
        </div>}
      </article>)}
      {prova.nota===null&&<>
        <p className="portal-aviso-discreto">{prova.questoes.filter(q=>escolhas[q.id]!==undefined).length} de 5 respondidas.</p>
        {!confirmar?<button type="button" className="botao-principal" disabled={!completo||ocupado}
          onClick={()=>setConfirmar(true)}><CheckCircle2 size={17}/> Finalizar prova</button>:
          <div className="portal-feedback" role="group" aria-label="Confirmar entrega">
            <p>Entregar agora? A resposta será salva e não poderá ser alterada.</p>
            <div className="ext-acoes">
              <button type="button" className="botao-principal" disabled={ocupado}
                onClick={()=>void entregar()}>Confirmar entrega</button>
              <button type="button" className="botao-secundario" disabled={ocupado}
                onClick={()=>setConfirmar(false)}>Cancelar entrega</button>
            </div>
          </div>}
      </>}
    </Cartao>}

    <Cartao titulo="Meus simulados">
      {historico.length===0?<Vazio texto="Nenhum simulado ainda."/>:
        <div className="ext-registros">{historico.map(item=><article key={item.id} className="ext-registro">
          <div>
            <strong>{item.tema}</strong>
            <small>{item.disciplina} · {niveis[item.dificuldade]}</small>
            <p>{item.nota===null?'Em andamento':'Nota de treino: '+item.nota+'/10'}</p>
          </div>
          <button type="button" className="botao-secundario" disabled={ocupado}
            onClick={()=>void abrir(item.id)}>{item.nota===null?'Continuar':'Revisar'}</button>
        </article>)}</div>}
    </Cartao>
  </div>
}
