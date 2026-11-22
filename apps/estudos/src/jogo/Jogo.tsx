import { useState } from 'react'
import MemoriaJogo from './MemoriaJogo'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Code2, RotateCcw, ScanSearch, Sparkles } from 'lucide-react'
import { avancar, estadoInicial, iniciarJogo, missoes, pontos, responder, type MissaoId } from './regras'
import './jogo.css'

type Props={voltar:()=>void}
const icons={tecnologia:Code2,negocios:BriefcaseBusiness,jornalismo:ScanSearch}
export default function Jogo({voltar}:Props){
  const [partida,setPartida]=useState(estadoInicial)
  const [memoria,setMemoria]=useState(false)
  if(memoria)return <MemoriaJogo voltar={()=>setMemoria(false)}/>
  const missao=missoes.find(m=>m.id===partida.missao)
  const pergunta=missao?.perguntas[partida.indice]
  const respondeu=partida.respostas.length>partida.indice
  const resposta=partida.respostas[partida.indice]
  const correta=pergunta?.correta===resposta
  const reiniciar=()=>setPartida(estadoInicial())
  return <div className="pagina arcade-pagina">
    <nav className="arcade-navegacao" aria-label="Navegação dos desafios">
      <button type="button" className="botao-voltar" onClick={voltar}><ArrowLeft size={18}/> Voltar</button>
      <span><Sparkles size={16}/> APRENDIZAGEM EM AÇÃO</span>
    </nav>
    {!missao?<><header className="arcade-cabecalho">
      <span className="sobretitulo">DESAFIOS PRÁTICOS</span>
      <h1>Casos para resolver</h1>
      <p>Escolha um tema, analise três situações e entenda as respostas. Tudo demonstrativo, sem nota escolar.</p>
    </header>
      <div className="missao-grade">{missoes.map(m=>{
        const Icon=icons[m.id]
        return <button type="button" key={m.id} className={`missao-card missao-${m.cor}`}
            onClick={()=>setPartida(iniciarJogo(m.id))}>
           <span className="missao-card-foto" aria-hidden="true"/>
          <span className="missao-icon"><Icon size={28}/></span>
          <span className="sobretitulo">{m.profissao}</span>
          <strong>{m.nome}</strong>
          <small>{m.descricao}</small>
          <span className="missao-cta">Começar <ArrowRight size={18}/></span>
        </button>})}
        <button type="button" className="missao-card missao-memoria" onClick={()=>setMemoria(true)}>
           <span className="missao-card-foto" aria-hidden="true"/>
          <span className="missao-icon"><Sparkles size={28}/></span>
          <span className="sobretitulo">REVISÃO COM CARTAS</span>
          <strong>Pares de conceitos</strong><small>Associe cada conceito à explicação em três matérias.</small>
          <span className="missao-cta">Jogar <ArrowRight size={18}/></span>
        </button>
      </div>
    </>:<><header className="arcade-cabecalho">
      <span className="sobretitulo">{missao.profissao}</span>
      <h1>{missao.nome}</h1>
      <p>{partida.concluido?'Missão concluída. O aprendizado continua.':`Situação ${partida.indice+1} de ${missao.perguntas.length}`}</p>
    </header>
    <div className="missao-trilha" role="progressbar" aria-label="Progresso da missão"
      aria-valuemin={0} aria-valuemax={missao.perguntas.length}
      aria-valuenow={partida.concluido?missao.perguntas.length:partida.indice}>
      <span style={{width:`${100*(partida.concluido?1:partida.indice/missao.perguntas.length)}%`}}/>
    </div>
    {partida.concluido?<section className="missao-final">
      <span aria-hidden="true">✦</span>
      <h2>{pontos(partida)} pontos</h2>
      <p>Você concluiu três situações. Cada escolha é uma chance de aprender.</p>
      <div className="missao-acoes">
        <button type="button" className="botao-principal" onClick={()=>setPartida(iniciarJogo(missao.id))}><RotateCcw size={18}/> Refazer</button>
        <button type="button" className="botao-secundario" onClick={reiniciar}>Outra missão <ArrowRight size={18}/></button>
      </div>
    </section>:<section className="missao-jogo" aria-label="Questão da missão">
      <span className="missao-situacao">{pergunta?.situacao}</span>
      <h2>{pergunta?.desafio}</h2>
      <div className="missao-opcoes" role="group" aria-label="Opções da decisão">
        {pergunta?.opcoes.map((texto,i)=><button type="button" key={i} disabled={respondeu}
          className={respondeu?(i===pergunta.correta?'correta':i===resposta?'errada':''):''}
          aria-pressed={resposta===i}
          onClick={()=>setPartida(atual=>responder(atual,i))}>
          <span className="missao-letra">{String.fromCharCode(65+i)}</span><span>{texto}</span>
          {respondeu&&i===pergunta.correta&&<Check size={18} aria-hidden="true"/>}
        </button>)}
      </div>
      {respondeu&&<div className={correta?'missao-explicacao acertou':'missao-explicacao'} role="status">
        <strong>{correta?'Boa decisão!':'Olha essa dica:'}</strong>
        <p>{pergunta?.explicacao}</p>
        <button type="button" className="botao-principal" onClick={()=>setPartida(avancar)}>
          {partida.indice===missao.perguntas.length-1?'Ver meu resultado':'Próxima situação'} <ArrowRight size={18}/>
        </button>
      </div>}
      <button type="button" className="missao-trocar" onClick={reiniciar}>Escolher outra área</button>
    </section>}</>}
    <p className="arcade-nota">Sem cadastro, ranking ou coleta de dados. Você aprende no seu ritmo.</p>
  </div>
}
