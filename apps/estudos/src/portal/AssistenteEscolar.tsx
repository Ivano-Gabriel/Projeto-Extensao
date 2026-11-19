import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUp, BrainCircuit, MessageCircle, Sparkles } from 'lucide-react'
import { apiEscolar, type RespostaAssistente } from './api'
import { falha } from './ComponentesPortal'
import TutorPedagogico from './TutorPedagogico'

type Mensagem = {id:number;pergunta:string;resultado:RespostaAssistente}
const exemplos=['Quais são minhas atividades?','Quem são meus professores?','Tenho algum aviso?','Como revisar melhor?']
export default function AssistenteEscolar(){
  const [modo,setModo]=useState<'escola'|'conteudo'>('escola')
  const [texto,setTexto]=useState('')
  const [historico,setHistorico]=useState<Mensagem[]>([])
  const [enviando,setEnviando]=useState(false)
  const [erro,setErro]=useState('')
  const perguntar=async(e?:FormEvent,exemplo?:string)=>{
    e?.preventDefault()
    const pergunta=(exemplo||texto).trim()
    if(pergunta.length<3||pergunta.length>500||enviando)return
    setEnviando(true);setErro('')
    try{
      const resultado=await apiEscolar.assistente(pergunta)
      setHistorico(prev=>[...prev.slice(-9),{id:Date.now(),pergunta,resultado}])
      setTexto('')
    }catch(e){setErro(falha(e))}
    finally{setEnviando(false)}
  }
  return <div className="ext-assistente-integrado">
    <nav className="ext-assistente-modos" aria-label="Tipo de assistente">
      <button type="button" className={modo==='escola'?'ativo':''}
        aria-pressed={modo==='escola'} onClick={()=>setModo('escola')}>Minha escola</button>
      <button type="button" className={modo==='conteudo'?'ativo':''}
        aria-pressed={modo==='conteudo'} onClick={()=>setModo('conteudo')}>Entender matéria com IA</button>
    </nav>
    {modo==='conteudo'?<TutorPedagogico/>:<section className="assistente-escolar" aria-labelledby="titulo-assistente">
    <div className="assistente-topo">
      <span className="assistente-avatar"><BrainCircuit size={25}/></span>
      <div><span className="sobretitulo">ASSISTENTE ESCOLAR · BETA</span>
        <h2 id="titulo-assistente">Pergunte ao Extensão</h2>
        <p>Atividades, turmas, professores e dicas de estudo.</p></div>
    </div>
    {historico.length===0&&<div className="assistente-sugestoes">
      {exemplos.map(x=><button type="button" key={x} disabled={enviando}
        onClick={()=>void perguntar(undefined,x)}><Sparkles size={14}/>{x}</button>)}
    </div>}
    <div className="assistente-mensagens" aria-live="polite">
      {historico.map(m=><div className="assistente-turno" key={m.id}>
        <p className="assistente-pergunta"><MessageCircle size={15}/>{m.pergunta}</p>
        <div className="assistente-resposta"><strong>Extensão</strong><p>{m.resultado.resposta}</p>
          {m.resultado.fontes.length>0&&<small>Base: {m.resultado.fontes.join(' · ')}</small>}</div>
      </div>)}
      {enviando&&<p className="portal-vazio">Consultando informações autorizadas da sua escola...</p>}
    </div>
    <form className="assistente-form" onSubmit={e=>void perguntar(e)}>
      <label htmlFor="assistente-mensagem">Sua pergunta</label>
      <div className="assistente-escrita">
        <input id="assistente-mensagem" value={texto} maxLength={500}
          placeholder="Ex.: Quais minhas atividades?" onChange={e=>setTexto(e.target.value)}/>
        <button type="submit" aria-label="Enviar pergunta" disabled={enviando||texto.trim().length<3}>
          <ArrowUp size={21}/></button>
      </div>
    </form>
    {erro&&<p role="alert" className="portal-feedback falha">{erro}</p>}
    <p className="assistente-aviso">Consulta escolar guiada, sem IA generativa nesta versão. Não há notas ou faltas oficiais no banco. Não compartilhe dados pessoais.</p>
  </section>}
  </div>
}
