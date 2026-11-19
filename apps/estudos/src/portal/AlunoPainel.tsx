import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, Flame, ShieldCheck, Sparkles } from 'lucide-react'
import { apiEscolar } from './api'
import type { AtividadeEscolar, Aviso, FrequenciaEscolar, MeuDesempenho, RespostaSalva, TurmaEscolar } from './api'
import { Abas, Aviso as MensagemStatus, Cartao, Selo, Vazio, falha, type Feedback } from './ComponentesPortal'
import { Mural } from './Avisos'
import AssistenteEscolar from './AssistenteEscolar'
import { acoesPorPerfil } from './navegacao'

export default function AlunoPainel(){
  const [aba,setAba]=useState('inicio')
  const [turmas,setTurmas]=useState<TurmaEscolar[]>([])
  const [atividades,setAtividades]=useState<AtividadeEscolar[]>([])
  const [avisos,setAvisos]=useState<Aviso[]>([])
  const [respostas,setRespostas]=useState<RespostaSalva[]>([])
  const [desempenho,setDesempenho]=useState<MeuDesempenho|null>(null)
  const [frequencia,setFrequencia]=useState<FrequenciaEscolar|null>(null)
  const [escolhas,setEscolhas]=useState<Record<number,number>>({})
  const [enviando,setEnviando]=useState<number|null>(null)
  const [carregando,setCarregando]=useState(true)
  const [mensagem,setMensagem]=useState<Feedback>({})
  const recarregar=async()=>{
    const [t,a,v,r,d,f]=await Promise.all([
      apiEscolar.turmas(),apiEscolar.atividades(),apiEscolar.avisos(),
      apiEscolar.minhasRespostas(),apiEscolar.meuDesempenho(),apiEscolar.minhaFrequencia(),
    ])
    setTurmas(t);setAtividades(a);setAvisos(v);setRespostas(r);setDesempenho(d);setFrequencia(f)
  }
  useEffect(()=>{
    let ativo=true
    Promise.all([
      apiEscolar.turmas(),apiEscolar.atividades(),apiEscolar.avisos(),
      apiEscolar.minhasRespostas(),apiEscolar.meuDesempenho(),apiEscolar.minhaFrequencia(),
    ]).then(([t,a,v,r,d,f])=>{
      if(!ativo)return
      setTurmas(t);setAtividades(a);setAvisos(v);setRespostas(r);setDesempenho(d);setFrequencia(f)
    }).catch(e=>{if(ativo)setMensagem({erro:falha(e)})})
      .finally(()=>{if(ativo)setCarregando(false)})
    return()=>{ativo=false}
  },[])
  const enviar=async(id:number)=>{
    if(escolhas[id]===undefined||enviando!==null)return
    setEnviando(id);setMensagem({})
    try{await apiEscolar.responder(id,escolhas[id]);await recarregar()
      setMensagem({ok:'Resposta registrada. Confira a explicação.'})}
    catch(e){setMensagem({erro:falha(e)})}
    finally{setEnviando(null)}
  }
  const pendentes=atividades.filter(a=>!respostas.some(r=>r.atividadeId===a.id))
  const importante=avisos.find(a=>a.importante)
  return <div className="portal-paineis portal-mobile">
    <Abas abas={acoesPorPerfil('ALUNO')} atual={aba} mudar={setAba}/>
    <MensagemStatus estado={mensagem}/>
    {carregando&&<p className="portal-vazio">Carregando sua escola...</p>}
    {!carregando&&aba==='inicio'&&<>
      <div className="portal-metricas">
        <Selo valor={turmas.length} legenda="Turmas"/>
        <Selo valor={pendentes.length} legenda="Para fazer"/>
        <Selo valor={desempenho?.acertos||0} legenda="Acertos"/>
      </div>
      {importante&&<Cartao titulo="Aviso importante">
        <div className="mural-card importante"><strong>{importante.titulo}</strong><p>{importante.texto}</p></div>
        <button type="button" className="portal-link" onClick={()=>setAba('avisos')}>Ver avisos <ArrowRight size={17}/></button>
      </Cartao>}
      <Cartao titulo="Sua escola">
        {turmas.length?<div className="portal-etiquetas">{turmas.map(t=><span key={t.id}>{t.codigo} · {t.nome}</span>)}</div>:
          <Vazio texto="Ainda sem turma vinculada. Procure a direção."/>}
        {pendentes.length>0&&<button type="button" className="botao-principal" onClick={()=>setAba('atividades')}>
          <BookOpen size={17}/> Fazer atividade <ArrowRight size={17}/></button>}
      </Cartao>
      <Cartao titulo="Tire uma dúvida">
        <p>Atividades, comunicados e professores da sua turma.</p>
        <button type="button" className="portal-link" onClick={()=>setAba('assistente')}>
          <Sparkles size={18}/> Perguntar ao assistente <ArrowRight size={18}/></button>
      </Cartao>
    </>}
    {!carregando&&aba==='atividades'&&<Cartao titulo="Atividades da turma">
      {atividades.length===0&&<Vazio texto="Nenhuma atividade publicada ainda."/>}
      <div className="portal-atividades">{atividades.map(a=>{
        const salva=respostas.find(r=>r.atividadeId===a.id)
        return <article key={a.id} className="portal-atividade">
          <span className="sobretitulo">{a.disciplina}</span><h3>{a.titulo}</h3><p>{a.pergunta}</p>
          {salva?<div className="portal-resultado" role="status">
            <strong><CheckCircle2 size={17}/> {salva.acertou?'Acertou!':'Revise este conceito'}</strong>
            <p>{salva.explicacao}</p>
            <small>Resposta salva no servidor. Você pode rever esta explicação quando quiser.</small>
          </div>:<>
            <div className="portal-alternativas" role="group" aria-label={`Respostas de ${a.titulo}`}>
              {a.opcoes.map((alt,i)=><button type="button" key={i}
                className={escolhas[a.id]===i?'selecionada':''} aria-pressed={escolhas[a.id]===i}
                onClick={()=>setEscolhas(prev=>({...prev,[a.id]:i}))}>
                <strong>{String.fromCharCode(65+i)}</strong>{alt}</button>)}
            </div>
            <button type="button" className="botao-principal" disabled={enviando!==null||escolhas[a.id]===undefined}
              onClick={()=>void enviar(a.id)}>{enviando===a.id?'Enviando...':'Responder'} <ArrowRight size={18}/></button>
          </>}
        </article>
      })}</div>
    </Cartao>}
    {!carregando&&aba==='avisos'&&<Cartao titulo="Mural da escola"><Mural avisos={avisos}/></Cartao>}
    {aba==='assistente'&&<AssistenteEscolar/>}
    {!carregando&&aba==='progresso'&&<>
      <Cartao titulo="Seu aprendizado">
        <div className="portal-metricas">
          <Selo valor={desempenho?.atividades||0} legenda="Atividades"/>
          <Selo valor={desempenho?.respondidas||0} legenda="Feitas"/>
          <Selo valor={desempenho?.acertos||0} legenda="Acertos"/>
        </div>
        <p className="portal-aviso-discreto"><ShieldCheck size={16}/> Acertos em atividades, não notas do boletim.</p>
        {respostas.filter(r=>!r.acertou).length>0&&<button className="portal-link" type="button"
          onClick={()=>setAba('atividades')}><Flame size={18}/> Revisar erros <ArrowRight size={17}/></button>}
      </Cartao>
      <Cartao titulo="Presença de teste">
        <div className="portal-metricas">
          <Selo valor={frequencia?.presencas||0} legenda="Presenças"/>
          <Selo valor={frequencia?.faltas||0} legenda="Ausências"/>
          <Selo valor={frequencia?.registrosDePresenca||0} legenda="Registros"/>
        </div>
        <p className="portal-aviso-discreto">Somente aulas registradas no Extensão. Não é frequência oficial nem indica quantas faltas são permitidas.</p>
      </Cartao>
    </>}
  </div>
}
