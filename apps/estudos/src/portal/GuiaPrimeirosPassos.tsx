import {ArrowRight,Check,CheckCircle2,ClipboardCheck,Route} from 'lucide-react'
import {progressoImplantacao,type EtapaImplantacao} from './implantacao'

export default function GuiaPrimeirosPassos({perfil,etapas,navegar}:{perfil:'DIRECAO'|'PROFESSOR';etapas:readonly EtapaImplantacao[];navegar:(aba:string)=>void}){
  const resumo=progressoImplantacao(etapas)
  const proxima=etapas.find(x=>!x.concluida)
  return <section className="zelo-guia-implantacao" aria-labelledby="zelo-guia-titulo">
    <header className="zelo-guia-cabecalho">
      <span className="zelo-guia-icone" aria-hidden="true"><Route size={25}/></span>
      <div>
        <span className="zelo-guia-kicker">PRIMEIROS PASSOS</span>
        <h2 id="zelo-guia-titulo">{perfil==='DIRECAO'?'Coloque sua escola para funcionar':'Prepare sua primeira aula'}</h2>
        <p>Os passos acompanham os registros existentes. Nenhum dado é preenchido automaticamente.</p>
      </div>
    </header>
    <div className="zelo-guia-andamento">
      <div><strong>{resumo.concluidas} de {resumo.total} etapas</strong>
        <span>{resumo.completa?'Configuração básica concluída':'Configuração em andamento'}</span>
      </div>
      <progress value={resumo.concluidas} max={resumo.total} aria-label="Etapas básicas concluídas"/>
    </div>
    <ol className="zelo-guia-lista">
      {etapas.map((etapa,i)=><li key={etapa.id} className={etapa.concluida?'concluida':''}>
        <span className="zelo-guia-numero" aria-hidden="true">{etapa.concluida?<Check size={17}/>:i+1}</span>
        <div><strong>{etapa.titulo}</strong><span>{etapa.descricao}</span></div>
        <span className="zelo-guia-estado">{etapa.concluida?<><CheckCircle2 size={15}/> Feito</>:'Pendente'}</span>
      </li>)}
    </ol>
    {proxima?<div className="zelo-guia-proxima">
      <div><small>PRÓXIMA AÇÃO</small><strong>{proxima.titulo}</strong></div>
      <button type="button" onClick={()=>navegar(proxima.aba)}>{proxima.acao} <ArrowRight size={17}/></button>
    </div>:<p className="zelo-guia-final" role="status"><ClipboardCheck size={19}/> Configuração básica encontrada. Continue acompanhando as turmas.</p>}
    <small className="zelo-guia-rodape">Esses passos não significam homologação institucional ou autorização para usar dados pessoais reais.</small>
  </section>
}
