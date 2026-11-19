import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle, Bell, Megaphone, Send } from 'lucide-react'
import type { Aviso, PublicoAviso, TurmaEscolar } from './api'
import { apiEscolar } from './api'
import { Aviso as MensagemStatus, falha, Vazio, type Feedback } from './ComponentesPortal'

export function Mural({avisos}:{avisos:readonly Aviso[]}){
  if(avisos.length===0)return <Vazio texto="Nenhum comunicado por enquanto."/>
  return <div className="portal-mural">{avisos.map(a=><article className={a.importante?'mural-card importante':'mural-card'} key={a.id}>
    <span className="mural-meta">{a.importante?<AlertTriangle size={16}/>:<Bell size={16}/>}
      {a.importante?'IMPORTANTE':'COMUNICADO'} · {a.turmaId? 'Turma #'+a.turmaId:'Escola'}</span>
    <h3>{a.titulo}</h3><p>{a.texto}</p>
    <small>{new Date(a.criadoEm).toLocaleDateString('pt-BR')}</small>
  </article>)}</div>
}
export function CriarAviso({turmas,como,enviado}:{turmas:readonly TurmaEscolar[];como:'DIRECAO'|'PROFESSOR';enviado:()=>Promise<void>}){
  const [turma,setTurma]=useState(como==='PROFESSOR'?String(turmas[0]?.id||''):'')
  const [publico,setPublico]=useState<PublicoAviso>(como==='PROFESSOR'?'ALUNOS':'TODOS')
  const [titulo,setTitulo]=useState('')
  const [texto,setTexto]=useState('')
  const [importante,setImportante]=useState(false)
  const [enviando,setEnviando]=useState(false)
  const [mensagem,setMensagem]=useState<Feedback>({})
  const enviar=async(e:FormEvent)=>{
    e.preventDefault();setMensagem({});setEnviando(true)
    try{
      const dados={turmaId:turma?Number(turma):null,publico,titulo,texto,importante}
      if(como==='PROFESSOR'){
        if(!dados.turmaId)throw new Error('Escolha uma turma.')
        await apiEscolar.enviarAvisoProfessor({...dados,turmaId:dados.turmaId,publico:'ALUNOS'})
      }else await apiEscolar.enviarAvisoDirecao(dados)
      setTitulo('');setTexto('');setImportante(false)
      await enviado()
      setMensagem({ok:'Comunicado publicado.'})
    }catch(e){setMensagem({erro:falha(e)})}
    finally{setEnviando(false)}
  }
  return <form className="portal-form" onSubmit={enviar}>
    <div className="portal-campos">
      <div><label htmlFor="mural-turma">Destino</label><select id="mural-turma"
        value={turma} onChange={e=>setTurma(e.target.value)} required={como==='PROFESSOR'}>
        {como==='DIRECAO'&&<option value="">Escola inteira</option>}
        {como==='PROFESSOR'&&<option value="">Escolha turma</option>}
        {turmas.map(t=><option key={t.id} value={t.id}>{t.codigo} · {t.nome}</option>)}
      </select></div>
      {como==='DIRECAO'&&<div><label htmlFor="mural-publico">Para quem?</label>
        <select id="mural-publico" value={publico}
          onChange={e=>setPublico(e.target.value as PublicoAviso)}>
          <option value="TODOS">Todos</option><option value="ALUNOS">Alunos</option>
          <option value="FUNCIONARIOS">Funcionários</option>
        </select></div>}
    </div>
    <label htmlFor="mural-titulo">Título</label>
    <input id="mural-titulo" value={titulo} required maxLength={120}
      placeholder="Ex.: Revisão de sexta" onChange={e=>setTitulo(e.target.value)}/>
    <label htmlFor="mural-texto">Mensagem</label>
    <textarea id="mural-texto" rows={3} required maxLength={1500}
      placeholder="O que a turma precisa saber?" value={texto} onChange={e=>setTexto(e.target.value)}/>
    <label className="portal-check"><input type="checkbox" checked={importante}
      onChange={e=>setImportante(e.target.checked)}/> Destacar como importante</label>
    <button className="botao-principal" type="submit" disabled={enviando}>
      <Send size={18}/>{enviando?'Publicando...':'Publicar aviso'}</button>
    <MensagemStatus estado={mensagem}/>
  </form>
}
