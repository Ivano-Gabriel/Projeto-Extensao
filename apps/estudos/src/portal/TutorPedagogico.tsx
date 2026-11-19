import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { BookOpen, Bot, ShieldCheck, Sparkles } from 'lucide-react'
import { apiEscolar } from './api'
import type { DisciplinaIaAluno, ExplicacaoIa, StatusIa } from './api'
import { falha } from './ComponentesPortal'

export default function TutorPedagogico(){
  const [status,setStatus]=useState<StatusIa|null>(null)
  const [disciplinas,setDisciplinas]=useState<DisciplinaIaAluno[]>([])
  const [chave,setChave]=useState('')
  const [pergunta,setPergunta]=useState('')
  const [resposta,setResposta]=useState<ExplicacaoIa|null>(null)
  const [carregando,setCarregando]=useState(true)
  const [enviando,setEnviando]=useState(false)
  const [erro,setErro]=useState('')
  useEffect(()=>{
    let ativo=true
    Promise.all([apiEscolar.statusIa(),apiEscolar.disciplinasIaAluno()])
      .then(([s,d])=>{
        if(ativo){setStatus(s);setDisciplinas(d);setChave(d[0]?String(d[0].turmaId)+':'+d[0].disciplina:'')}
      }).catch(e=>{if(ativo)setErro(falha(e))})
      .finally(()=>{if(ativo)setCarregando(false)})
    return()=>{ativo=false}
  },[])
  const enviar=async(e:FormEvent)=>{
    e.preventDefault()
    const alvo=disciplinas.find(d=>String(d.turmaId)+':'+d.disciplina===chave)
    if(!alvo||!status?.habilitada||enviando)return
    setErro('');setResposta(null);setEnviando(true)
    try{
      const r=await apiEscolar.explicarIa({
        turmaId:alvo.turmaId,disciplina:alvo.disciplina,pergunta:pergunta.trim(),
      })
      setResposta(r)
      setStatus(anterior=>anterior?{...anterior,restantesHoje:r.restantesHoje}:anterior)
    }catch(e){setErro(falha(e))}
    finally{setEnviando(false)}
  }
  return <section className="ext-surface ext-ia" aria-labelledby="titulo-tutor">
    <h3 id="titulo-tutor"><Bot size={22}/> Entender um conteúdo</h3>
    <p className="ext-ajuda">Um tutor por IA que explica conceitos passo a passo e propõe uma pergunta para você praticar. Não é um boletim nem substitui seu professor.</p>
    {carregando?<p className="ext-empty">Carregando disponibilidade do tutor...</p>:<>
      <p className="ext-ia-disponibilidade" role="status">
        {status?.habilitada?'Tutor IA habilitado · '+status.restantesHoje+' perguntas restantes hoje':
          'Tutor IA ainda não ativado pela escola neste ambiente.'}
      </p>
      <form className="portal-form" onSubmit={e=>void enviar(e)}>
        <label htmlFor="tutor-disciplina">Disciplina e turma</label>
        <select id="tutor-disciplina" required disabled={!status?.habilitada||enviando}
          value={chave} onChange={e=>{setChave(e.target.value);setResposta(null)}}>
          {disciplinas.length===0&&<option value="">Nenhuma disciplina vinculada ainda</option>}
          {disciplinas.map(d=><option key={d.turmaId+':'+d.disciplina}
            value={d.turmaId+':'+d.disciplina}>{d.turmaNome} · {d.disciplina}</option>)}
        </select>
        <label htmlFor="tutor-duvida">Qual é sua dúvida?</label>
        <textarea id="tutor-duvida" rows={4} minLength={3} maxLength={500}
          value={pergunta} disabled={!status?.habilitada||enviando}
          placeholder="Ex.: Por que o discriminante muda a quantidade de raízes?"
          onChange={e=>setPergunta(e.target.value)}/>
        <p className="ext-aviso-ia"><ShieldCheck size={16}/>
          Não digite nome completo, telefone, documento, notas ou dados pessoais.
          Suas perguntas não são salvas no histórico escolar.</p>
        <button className="botao-principal" type="submit"
          disabled={!status?.habilitada||!chave||pergunta.trim().length<3||enviando||!status.restantesHoje}>
          <Sparkles size={18}/>{enviando?'Preparando explicação...':'Explicar com IA'}</button>
      </form>
      {resposta&&<div className="ext-resposta" aria-live="polite">
        <strong><BookOpen size={19}/> Explicação para estudo</strong>
        <p>{resposta.texto}</p><small>{resposta.aviso}</small>
      </div>}
    </>}
    {erro&&<p role="alert" className="portal-feedback falha">{erro}</p>}
  </section>
}
