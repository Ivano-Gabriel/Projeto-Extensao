import { CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import type { Questao } from '../dados/questoes'
import type { RespostaAtividade } from './atividade'
import './atividade.css'

type Props={
  questao:Questao
  resposta?:RespostaAtividade
  responder:(opcao:number)=>void
  refazer:()=>void
}
export default function AtividadeQuiz({questao,resposta,responder,refazer}:Props){
  const respondeu=resposta!==undefined
  const acertou=resposta?.opcao===questao.correta
  return <section className="atividade-quiz" aria-label="Atividade rápida de revisão">
    <div className="atividade-cabecalho">
      <span><Sparkles size={17}/> DESAFIO DO TEMA</span>
      <small>1 PERGUNTA · CONTEÚDO DE EXEMPLO</small>
    </div>
    <h4>{questao.pergunta}</h4>
    <div className="atividade-respostas" role="group" aria-label="Opções de resposta">
      {questao.opcoes.map((opcao,i)=><button key={i} type="button" disabled={respondeu}
        className={respondeu?(i===questao.correta?'correta':i===resposta.opcao?'errada':''):''}
        aria-pressed={resposta?.opcao===i} onClick={()=>responder(i)}>
        <span>{String.fromCharCode(65+i)}</span>{opcao}
      </button>)}
    </div>
    {respondeu&&<div className={acertou?'atividade-explicacao acertou':'atividade-explicacao'} role="status">
      <strong>{acertou?<CheckCircle2 size={20}/>:<XCircle size={20}/>}
        {acertou?'Mandou bem!':'Boa tentativa!'}
      </strong>
      <p>{questao.explicacao}</p>
      <button type="button" className="botao-secundario" onClick={refazer}><RotateCcw size={16}/> Tentar novamente</button>
    </div>}
    <p className="atividade-rodape">Resposta guardada somente neste navegador; isto não é nota escolar.</p>
  </section>
}
