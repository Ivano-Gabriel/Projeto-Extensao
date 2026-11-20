import { useEffect, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { apiEscolar, type EventoAuditoria } from './api'
import { falha } from './ComponentesPortal'

const nomes:Record<string,string>={
  ALUNO_TRANSFERIDO:'Aluno transferido',
  VINCULO_REMOVIDO:'Vínculo de professor removido',
}
export default function AuditoriaEscola(){
  const [eventos,setEventos]=useState<EventoAuditoria[]>([])
  const [erro,setErro]=useState('')
  const [carregando,setCarregando]=useState(true)
  useEffect(()=>{
    let ativo=true
    apiEscolar.auditoria().then(x=>{if(ativo)setEventos(x)})
      .catch(e=>{if(ativo)setErro(falha(e))})
      .finally(()=>{if(ativo)setCarregando(false)})
    return()=>{ativo=false}
  },[])
  return <section className="ext-surface" aria-label="Histórico administrativo da escola">
    <h2><ClipboardCheck size={20}/> Histórico de ações</h2>
    <p>Eventos administrativos da sua escola, sem senhas ou detalhes de respostas de alunos.
      Esta é a primeira etapa da trilha de auditoria, ainda não uma auditoria completa.</p>
    {carregando&&<p>Carregando histórico...</p>}
    {erro&&<p className="portal-feedback falha" role="alert">{erro}</p>}
    {!carregando&&!erro&&eventos.length===0&&<p>Sem ações auditadas até agora.</p>}
    <ol className="ext-auditoria-lista">
      {eventos.map(e=><li key={e.id}><strong>{nomes[e.acao]||e.acao}</strong>
        <span> · ID {e.entidadeId} · Responsável #{e.atorId}</span>
        <small>{e.data}</small></li>)}
    </ol>
  </section>
}
