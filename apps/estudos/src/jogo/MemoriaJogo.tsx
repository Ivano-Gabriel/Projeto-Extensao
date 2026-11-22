import { useEffect, useState } from 'react'
import { ArrowLeft, Brain, Check, RotateCcw, Sparkles } from 'lucide-react'
import { estadoDaMemoria, iniciarMemoria, revelarCarta, type AreaMemoria, type MemoriaEstado } from './memoria'

type Props={voltar:()=>void}
const areas:{id:AreaMemoria;nome:string;descricao:string}[]=[
  {id:'matematica',nome:'Matemática',descricao:'Conceitos e definições'},
  {id:'historia',nome:'História',descricao:'Acontecimentos e contexto'},
  {id:'tecnologia',nome:'Tecnologia',descricao:'Termos do mundo digital'},
]
export default function MemoriaJogo({voltar}:Props){
  const [jogo,setJogo]=useState<MemoriaEstado|null>(null)
  const [area,setArea]=useState<AreaMemoria>('matematica')
  useEffect(()=>{
    if(!jogo||jogo.abertas.length!==2)return
    const timeout=window.setTimeout(()=>setJogo(atual=>atual?estadoDaMemoria(atual):atual),800)
    return()=>window.clearTimeout(timeout)
  },[jogo])
  const iniciar=(novaArea:AreaMemoria)=>{
    setArea(novaArea);setJogo(iniciarMemoria(novaArea))
  }
  return <div className="pagina memoria-pagina">
    <button type="button" className="botao-voltar" onClick={voltar}>
      <ArrowLeft size={18}/> Desafios
    </button>
    <header className="memoria-cabecalho">
      <span className="sobretitulo">PRATIQUE COM CARTAS</span>
      <h1>Associe e aprenda.</h1>
      <p>Encontre quatro pares de conceito e significado. Um treino de memória, não uma avaliação escolar.</p>
    </header>
    {!jogo?<div className="memoria-areas">{areas.map(a=><button type="button" key={a.id}
      onClick={()=>iniciar(a.id)}>
      <Brain size={24}/><strong>{a.nome}</strong><small>{a.descricao}</small>
    </button>)}</div>:<>
      <div className="memoria-barra">
        <strong><Sparkles size={18}/> {jogo.acertos}/4 pares</strong>
        <button type="button" onClick={()=>iniciar(area)}><RotateCcw size={16}/> Reiniciar</button>
      </div>
      <div className="memoria-grid" role="group" aria-label="Jogo de memória de conceitos">
        {jogo.cartas.map((c,i)=>{
          const aberta=jogo.abertas.includes(i),encontrada=jogo.encontrados.includes(c.par)
          return <button type="button" key={c.id}
            aria-label={aberta||encontrada?`Carta ${i+1}: ${c.texto}`:`Virar carta ${i+1}`}
            disabled={aberta||encontrada||jogo.abertas.length>=2}
            className={aberta?'virada':encontrada?'encontrada':''}
            onClick={()=>setJogo(atual=>atual?revelarCarta(atual,i):atual)}>
            {aberta||encontrada?<span>{encontrada&&<Check size={18}/>} {c.texto}</span>:
              <span className="memoria-verso"><Brain size={25}/></span>}
          </button>
        })}
      </div>
      {jogo.finalizado&&<div className="memoria-fim" role="status">
        <strong>4 pares encontrados!</strong>
        <p>Agora tente explicar dois conceitos sem olhar as cartas.</p>
        <button type="button" className="botao-principal" onClick={()=>setJogo(null)}>
          Outro assunto</button>
      </div>}
      <p className="arcade-nota">Sem cronômetro, ranking ou coleta de dados. O objetivo é lembrar.</p>
    </>}
  </div>
}
