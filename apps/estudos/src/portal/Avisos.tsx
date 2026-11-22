import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle, Send } from 'lucide-react'
import type { Aviso, PublicoAviso, TurmaEscolar } from './api'
import { apiEscolar } from './api'
import { Aviso as MensagemStatus, falha, Vazio, type Feedback } from './ComponentesPortal'

type PermissaoMural={usuarioId?:number;perfil?:'PROFESSOR'|'DIRECAO';atualizado?:()=>Promise<void>}
export function Mural({avisos,usuarioId,perfil,atualizado}:{avisos:readonly Aviso[]}&PermissaoMural){
  const [editando,setEditando]=useState<number|null>(null)
  const [titulo,setTitulo]=useState('')
  const [texto,setTexto]=useState('')
  const [importante,setImportante]=useState(false)
  const [ocupado,setOcupado]=useState(false)
  const [erro,setErro]=useState('')
  const iniciar=(aviso:Aviso)=>{
    setEditando(aviso.id);setTitulo(aviso.titulo);setTexto(aviso.texto)
    setImportante(aviso.importante);setErro('')
  }
  const editar=async(id:number)=>{
    setOcupado(true);setErro('')
    try{
      await apiEscolar.editarAvisoProfessor(id,{titulo,texto,importante})
      await atualizado?.();setEditando(null)
    }catch(e){setErro(falha(e))}finally{setOcupado(false)}
  }
  const remover=async(a:Aviso)=>{
    if(!window.confirm('Remover esta publicação da turma?'))return
    setOcupado(true);setErro('')
    try{
      if(perfil==='DIRECAO')await apiEscolar.moderarAvisoDirecao(a.id)
      else await apiEscolar.removerAvisoProfessor(a.id)
      await atualizado?.()
    }catch(e){setErro(falha(e))}finally{setOcupado(false)}
  }
  if(avisos.length===0)return <Vazio texto="Nenhuma publicação no feed ainda."/>
  return <div className="portal-mural" aria-label="Feed de publicações escolares">
    {erro&&<p className="portal-feedback falha" role="alert">{erro}</p>}
    {avisos.map(a=>{
      const podeEditar=perfil==='PROFESSOR'&&a.autorId===usuarioId
      const podeRemover=perfil==='DIRECAO'||podeEditar
      return <article className={a.importante?'mural-card importante':'mural-card'} key={a.id}>
        <header className="zelo-feed-identidade">
          <span className="zelo-feed-avatar" aria-hidden="true">{a.autorNome.trim().charAt(0).toLocaleUpperCase('pt-BR')||'E'}</span>
          <div className="zelo-feed-autor">
            <strong>{a.autorNome}</strong>
            <span className="mural-meta">
              {a.autorPapel==='PROFESSOR'?'Professor':a.autorPapel==='DIRECAO'?'Direção':'Escola'}
              <span aria-hidden="true">·</span>
              {a.turmaId?'Turma #'+a.turmaId:'Escola inteira'}
            </span>
          </div>
          <time dateTime={a.criadoEm} className="zelo-feed-data">
            {new Date(a.criadoEm).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
          </time>
        </header>
        {a.importante&&<span className="zelo-feed-importante"><AlertTriangle size={14}/> Comunicado importante</span>}
        {editando===a.id?<form className="portal-form" onSubmit={e=>{e.preventDefault();void editar(a.id)}}>
          <label htmlFor={`feed-titulo-${a.id}`}>Título</label>
          <input id={`feed-titulo-${a.id}`} required maxLength={120} value={titulo}
            onChange={e=>setTitulo(e.target.value)}/>
          <label htmlFor={`feed-texto-${a.id}`}>Publicação</label>
          <textarea id={`feed-texto-${a.id}`} rows={4} required maxLength={1500} value={texto}
            onChange={e=>setTexto(e.target.value)}/>
          <label className="portal-check"><input type="checkbox" checked={importante}
            onChange={e=>setImportante(e.target.checked)}/> Destacar como importante</label>
          <div className="portal-acoes-rapidas">
            <button className="botao-principal" type="submit" disabled={ocupado}>Salvar publicação</button>
            <button className="botao-secundario" type="button" onClick={()=>setEditando(null)}>Cancelar</button>
          </div>
        </form>:<>
          <h3>{a.titulo}</h3><p>{a.texto}</p>
        </>}
        {podeRemover&&editando!==a.id&&<div className="portal-acoes-rapidas">
          {podeEditar&&<button type="button" className="botao-secundario" disabled={ocupado}
            onClick={()=>iniciar(a)}>Editar minha publicação</button>}
          <button type="button" className="botao-secundario" disabled={ocupado}
            onClick={()=>void remover(a)}>{perfil==='DIRECAO'?'Moderar publicação':'Remover'}</button>
        </div>}
      </article>
    })}
  </div>
}
export function CriarAviso({turmas,como,enviado,turmaInicial}:{turmas:readonly TurmaEscolar[];como:'DIRECAO'|'PROFESSOR';enviado:()=>Promise<void>;turmaInicial?:number}){
  const [turma,setTurma]=useState(como==='PROFESSOR'?String(turmaInicial||turmas[0]?.id||''):'')
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
