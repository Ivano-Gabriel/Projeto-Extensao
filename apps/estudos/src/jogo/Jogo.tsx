import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Heart, Play, RotateCcw, Sparkles } from 'lucide-react'
import { avancar, DURACAO_TICKS, estadoInicial, iniciarJogo, pular, type EstadoJogo } from './regras'
import './jogo.css'

type Props = {voltar:()=>void}
const TOTAL_SEGUNDOS=DURACAO_TICKS/10
function saltoAltura(puloRestante:number){
  if(puloRestante<=0) return 0
  return Math.round(68*Math.sin((9-puloRestante)/9*Math.PI))
}
export default function Jogo({voltar}:Props) {
  const [jogo,setJogo]=useState<EstadoJogo>(estadoInicial)
  useEffect(()=>{
    if(jogo.fase!=='jogando') return
    const interval=window.setInterval(()=>setJogo((atual)=>avancar(atual)),100)
    return ()=>window.clearInterval(interval)
  },[jogo.fase])
  useEffect(()=>{
    const tecla=(evento:KeyboardEvent)=>{
      if((evento.code==='Space'||evento.code==='ArrowUp')&&jogo.fase==='jogando'){
        evento.preventDefault()
        setJogo((atual)=>pular(atual))
      }
    }
    window.addEventListener('keydown',tecla)
    return ()=>window.removeEventListener('keydown',tecla)
  },[jogo.fase])
  const tempo=Math.max(0,Math.ceil(TOTAL_SEGUNDOS-jogo.ticks/10))
  const iniciar=()=>setJogo(iniciarJogo())
  return <div className="pagina arcade-pagina">
    <div className="arcade-navegacao">
      <button type="button" className="botao-voltar" onClick={voltar}><ArrowLeft size={18}/> Voltar aos estudos</button>
      <span><Sparkles size={16}/> PAUSA RÁPIDA</span>
    </div>
    <header className="arcade-cabecalho">
      <div><span className="sobretitulo">ARCADE DO SABER · JOGO ORIGINAL</span>
        <h1>Pula, Livrinho!</h1>
        <p>Uma pausa de 30 segundos entre os estudos. Pule os obstáculos, tente sua pontuação e volte pro que importa.</p>
      </div>
      <span className="arcade-medalha" aria-hidden="true">✦</span>
    </header>
    <section className="arcade-painel" aria-label="Minigame de pulo">
      <div className="arcade-placar">
        <span><strong>{jogo.pontos}</strong><small>PONTOS</small></span>
        <span><strong>{tempo}s</strong><small>TEMPO</small></span>
        <span><strong><Heart size={18} fill="currentColor"/> {jogo.vidas}</strong><small>VIDAS</small></span>
      </div>
      <div className="arcade-cenario" aria-label="Livrinho pulando os obstáculos">
        <div className="arcade-estrelas" aria-hidden="true"><span>✦</span><span>✳</span><span>✦</span></div>
        <div className="arcade-personagem" style={{transform:`translateY(-${saltoAltura(jogo.pulo)}px)`}} aria-hidden="true">
          <div className="arcade-livro"><BookOpen size={32} strokeWidth={2.3}/></div>
          <span className="arcade-sombra"/>
        </div>
        {jogo.obstaculos.map((x,i)=><div key={i} className="arcade-obstaculo" style={{left:`${x}%`}} aria-hidden="true">?</div>)}
        <div className="arcade-chao"/>
        {jogo.fase!=='jogando'&&<div className="arcade-overlay">
          <span className="arcade-overlay-icone">{jogo.fase==='fim'?'★':'✦'}</span>
          <h2>{jogo.fase==='fim'?(jogo.vidas>0?'Boa corrida!':'Fim de jogo!'):'Preparado pra pular?'}</h2>
          <p>{jogo.fase==='fim'?`Você fez ${jogo.pontos} pontos. O legal é tentar e aprender!`:'Pule os pontos de interrogação. Duas vidas, uma corrida curta.'}</p>
          <button type="button" className="botao-principal" onClick={iniciar}>
            {jogo.fase==='fim'?<RotateCcw size={19}/>:<Play size={19}/>}
            {jogo.fase==='fim'?'Jogar de novo':'Começar corrida'}
          </button>
        </div>}
      </div>
      <div className="arcade-controles">
        <button type="button" className="arcade-pular" disabled={jogo.fase!=='jogando'} onClick={()=>setJogo((atual)=>pular(atual))}>
          <BookOpen size={21}/> PULAR!
        </button>
        <p>No celular, toque em PULAR. No computador, use <kbd>Espaço</kbd> ou <kbd>↑</kbd>.</p>
      </div>
    </section>
    <p className="arcade-nota">Este jogo não salva ranking, não coleta dados e não envia nada à escola. Faça pausas quando quiser.</p>
  </div>
}
