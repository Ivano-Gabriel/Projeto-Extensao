import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {
  BookOpen,CalendarDays,CheckSquare,ClipboardList,GraduationCap,Home,Link2,
  Megaphone,MoreHorizontal,ShieldCheck,Sparkles,Users,X
} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import {acoesPorPerfil} from './navegacao'
import type {PapelEscolar} from './api'

type Props={perfil:PapelEscolar;atual:string;mudar:(id:string)=>void}
const icones:Record<string,LucideIcon>={
  home:Home,users:Users,book:BookOpen,clipboard:ClipboardList,bell:Megaphone,
  sparkles:Sparkles,chart:CheckSquare,calendar:CalendarDays,user:GraduationCap,
  link:Link2,shield:ShieldCheck,
}
const principais:Record<PapelEscolar,readonly string[]>={
  ALUNO:['inicio','atividades','prova','materiais'],
  PROFESSOR:['inicio','turmas','atividades','materiais'],
  DIRECAO:['inicio','turmas','pessoas','vinculos'],
}
const compactos:Record<string,string>={
  inicio:'Início',atividades:'Atividades',prova:'Prova',
  materiais:'Materiais',turmas:'Turmas',pessoas:'Pessoas',vinculos:'Vínculos',
}
const nomes:Record<PapelEscolar,string>={
  ALUNO:'Seu espaço de estudos',PROFESSOR:'Seu ambiente docente',DIRECAO:'Gestão da escola',
}
export default function NavegacaoDireta({perfil,atual,mudar}:Props){
  const [mais,setMais]=useState(false)
  const botaoMais=useRef<HTMLButtonElement>(null)
  const secoes=acoesPorPerfil(perfil)
  const primeiras=principais[perfil]
  const extras=secoes.filter(item=>!primeiras.includes(item.id))
  const navegar=(id:string)=>{setMais(false);mudar(id)}
  useEffect(()=>{
    if(!mais)return
    const overflowAnterior=document.body.style.overflow
    document.body.style.overflow='hidden'
    const fechar=(event:KeyboardEvent)=>{if(event.key==='Escape')setMais(false)}
    const redimensionar=()=>{if(window.innerWidth>=900)setMais(false)}
    window.addEventListener('keydown',fechar)
    window.addEventListener('resize',redimensionar)
    document.querySelector<HTMLButtonElement>('.zelo-mais-v4 .zelo-mais-fechar')?.focus()
    return()=>{
      document.body.style.overflow=overflowAnterior
      window.removeEventListener('keydown',fechar)
      window.removeEventListener('resize',redimensionar)
      if(window.innerWidth<900)botaoMais.current?.focus()
    }
  },[mais])
  return <>
    <aside className="zelo-nav-direta zelo-nav-v4" aria-label={nomes[perfil]}>
      <div className="zelo-nav-marca" aria-hidden="true">
        <span className="zelo-nav-mini">z<span>ELO</span><b>+</b></span>
        <strong>{nomes[perfil]}</strong>
        <small>Suas ferramentas, sem caminhos escondidos.</small>
      </div>
      <nav className="zelo-nav-todas" role="tablist" aria-label="Seções do portal">
        {secoes.map(item=>{
          const Icone=icones[item.icone]||BookOpen
          return <button key={item.id} type="button" role="tab"
            className={'zelo-nav-item '+(primeiras.includes(item.id)?'zelo-nav-principal ':'zelo-nav-extra ')+(atual===item.id?'ativa':'')}
            aria-label={item.titulo} aria-selected={atual===item.id} onClick={()=>navegar(item.id)}>
            <Icone size={22} aria-hidden="true"/>
            <span className="zelo-nav-texto-curto" aria-hidden="true">{compactos[item.id]||item.titulo}</span>
            <span className="zelo-nav-texto-completo" aria-hidden="true">{item.titulo}</span>
          </button>
        })}
        <button type="button" ref={botaoMais} className={'zelo-nav-mais '+(mais||extras.some(e=>e.id===atual)?'ativa':'')}
          aria-label="Mais áreas" aria-expanded={mais} aria-controls="zelo-mais-areas"
          onClick={()=>setMais(x=>!x)}>
          <MoreHorizontal size={24} aria-hidden="true"/><span>Mais</span>
        </button>
      </nav>
    </aside>
    {mais&&createPortal(<div className="zelo-mais-fundo zelo-mais-v4" role="presentation"
      onClick={()=>setMais(false)}>
      <section className="zelo-mais-folha" role="dialog" aria-modal="true"
        aria-label="Mais áreas do portal" id="zelo-mais-areas"
        onClick={e=>e.stopPropagation()}>
        <div className="zelo-mais-titulo">
          <div><span>NAVEGUE PELO PORTAL</span><strong>Mais áreas</strong></div>
          <button className="zelo-mais-fechar" type="button" aria-label="Fechar mais áreas"
            onClick={()=>setMais(false)}><X size={21}/></button>
        </div>
        <div className="zelo-mais-itens">
          {extras.map(item=>{
            const Icone=icones[item.icone]||BookOpen
            return <button key={item.id} type="button"
              aria-current={atual===item.id?'page':undefined}
              onClick={()=>navegar(item.id)}>
              <Icone size={23}/><strong>{item.titulo}</strong>
            </button>
          })}
        </div>
      </section>
    </div>,document.body)}
  </>
}
