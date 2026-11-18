import { ArrowRight, BookOpen, CheckCircle2, Flame, Sparkles, XCircle } from 'lucide-react'
import { questaoDoDia, type RespostaDiaria } from './regras'
import './desafio.css'

type Props = {
  data: string
  resposta?: RespostaDiaria
  responder: (questaoId:string, opcao:number) => void
  abrirMaterial: (id:string) => void
}
export default function DesafioDia({data,resposta,responder,abrirMaterial}:Props){
  const questao=questaoDoDia(data)
  const concluido=resposta!==undefined
  const acertou=concluido&&resposta.opcao===questao.correta
  return <section className="desafio-dia" aria-label="Desafio do dia">
    <div className="desafio-dia-cabecalho">
      <div><span className="desafio-dia-selo"><Flame size={16}/> UM POUCO TODO DIA</span>
        <h2>Desafio do dia <Sparkles size={22} aria-hidden="true"/></h2>
        <p>Uma pergunta rápida, uma explicação clara. Sem competição e sem pressão.</p>
      </div>
      <span className="desafio-dia-data">01 DESAFIO</span>
    </div>
    <div className="desafio-dia-corpo">
      <div className="desafio-dia-tema"><BookOpen size={16}/> {questao.materia}</div>
      <h3>{questao.pergunta}</h3>
      <div className="desafio-dia-opcoes" role="group" aria-label="Alternativas do desafio do dia">
        {questao.opcoes.map((texto,i)=><button type="button" key={i} disabled={concluido}
          aria-pressed={resposta?.opcao===i}
          className={concluido?(i===questao.correta?'certa':i===resposta.opcao?'errada':''):''}
          onClick={()=>responder(questao.id,i)}>
          <span>{String.fromCharCode(65+i)}</span>{texto}
        </button>)}
      </div>
      {concluido&&<div className={acertou?'desafio-dia-resposta acerto':'desafio-dia-resposta'} role="status">
        <strong>{acertou?<CheckCircle2 size={20}/>:<XCircle size={20}/>}
          {acertou?'Boa! Você acertou.':'Você aprendeu algo novo!'}
        </strong>
        <p>{questao.explicacao}</p>
        <small>Desafio concluído neste aparelho. Amanhã tem outra pergunta.</small>
      </div>}
      <button type="button" className="desafio-dia-material" onClick={()=>abrirMaterial(questao.materialId)}>
        Ler o resumo deste tema <ArrowRight size={16}/>
      </button>
    </div>
  </section>
}
