import {useState} from 'react'
import {ArrowRight,Search,X} from 'lucide-react'
import {procurarAcoes} from './experiencia'
import type {PapelEscolar} from './api'

export default function BuscaAcoes({perfil,navegar}:{perfil:PapelEscolar;navegar:(id:string)=>void}){
  const [busca,setBusca]=useState('')
  const lista=procurarAcoes(perfil,busca)
  const limpar=()=>setBusca('')
  const abrir=(aba:string)=>{limpar();navegar(aba)}
  return <section className="zelo-busca-acoes" aria-labelledby="zelo-busca-titulo">
    <div className="zelo-busca-titulo">
      <span className="zelo-busca-simbolo" aria-hidden="true"><Search size={21}/></span>
      <div><span className="zelo-kicker">SEM COMPLICAÇÃO</span>
        <h2 id="zelo-busca-titulo">O que você quer fazer?</h2>
        <p>Escolha uma ação. As ferramentas completas continuam disponíveis no menu.</p>
      </div>
    </div>
    <div className="zelo-busca-campo">
      <label htmlFor="zelo-buscar-funcao">Buscar uma função</label>
      <div>
        <Search size={19} aria-hidden="true"/>
        <input id="zelo-buscar-funcao" type="search" value={busca}
          placeholder={perfil==='DIRECAO'?'Ex.: contas, turmas, matrículas':perfil==='PROFESSOR'?'Ex.: atividade, recado, presença':'Ex.: lição, material, avisos'}
          autoComplete="off" onChange={e=>setBusca(e.target.value)}
          onKeyDown={e=>{if(e.key==='Escape')limpar()}}/>
        {busca&&<button type="button" onClick={limpar} aria-label="Limpar busca"><X size={18}/></button>}
      </div>
    </div>
    <div className="zelo-busca-resultado" role="status" aria-live="polite">
      {busca?lista.length===1?'1 função encontrada':`${lista.length} funções encontradas`:'Acessos rápidos'}
    </div>
    {lista.length?<div className="zelo-busca-opcoes">
      {lista.map(item=><button key={item.id} type="button"
        onClick={()=>abrir(item.id)}>
        <strong>{item.titulo}</strong><ArrowRight size={18} aria-hidden="true"/>
      </button>)}
    </div>:<p className="zelo-busca-vazio">Não encontramos essa função no seu perfil. Tente outra palavra.</p>}
  </section>
}
