import { useState } from 'react'
import { ArrowLeft, GraduationCap, KeyRound, LogOut, School, ShieldCheck } from 'lucide-react'
import type { UsuarioEscolar } from './api'
import { areaDoUsuario } from './perfis'
import ZeloMarca from '../marca/ZeloMarca'
import SegurancaConta from './SegurancaConta'
import AlunoPainel from './AlunoPainel'
import ProfessorPainel from './ProfessorPainel'
import DirecaoPainel from './DirecaoPainel'
import AdminPainel from './AdminPainel'
import { falha } from './ComponentesPortal'
import './portal.css'
import './portal-academico.css'
import './portal-premium.css'

type Props={usuario:UsuarioEscolar;onSair:()=>Promise<void>;voltar?:()=>void}
export default function Portal({usuario,onSair,voltar}:Props){
  const [erro,setErro]=useState('')
  const [saindo,setSaindo]=useState(false)
  const [seguranca,setSeguranca]=useState(false)
  const area=areaDoUsuario(usuario)
  const papel=area==='ADMIN'?'ADMINISTRADOR':area==='DIRECAO'?'DIREÇÃO':
    area==='PROFESSOR'?'PROFESSOR':'ALUNO'
  const sair=async()=>{
    if(saindo)return
    setErro('');setSaindo(true)
    try{await onSair()}catch(e){setErro(falha(e));setSaindo(false)}
  }
  return <div className={`pagina portal-pagina portal-pagina--${area.toLowerCase()}`}>
    {voltar&&<button type="button" className="botao-voltar" onClick={voltar}>
      <ArrowLeft size={18}/> Voltar aos estudos
    </button>}
    <header className="portal-hero">
      <span className="portal-hero-marca"><ZeloMarca variante="compacta" clara/>
        <span>{area==='ALUNO'?'MEUS ESTUDOS':area==='PROFESSOR'?'ÁREA DO PROFESSOR':
          area==='DIRECAO'?'GESTÃO ESCOLAR':'ADMINISTRAÇÃO'}</span></span>
      <h1>Olá, {usuario.nome.split(' ')[0]}!</h1>
      <div className="portal-acesso">
        <span><ShieldCheck size={17}/>{papel}</span>
        <button type="button" aria-expanded={seguranca} onClick={()=>setSeguranca(x=>!x)}>
          <KeyRound size={17}/>{seguranca?'Fechar segurança':'Minha segurança'}
        </button>
        <button type="button" onClick={()=>void sair()} disabled={saindo}>
          <LogOut size={17}/>{saindo?'Saindo...':'Sair'}
        </button>
      </div>
    </header>
    {erro&&<p role="alert" className="portal-feedback falha">{erro}</p>}
    {seguranca&&<SegurancaConta/>}
    {area==='ADMIN'?<AdminPainel/>:area==='DIRECAO'?<DirecaoPainel usuarioId={usuario.id}/>:
      area==='PROFESSOR'?<ProfessorPainel usuarioId={usuario.id}/>:<AlunoPainel/>}
    <footer className="portal-rodape"><GraduationCap size={16}/>
      Homologação · registros persistidos de teste, não dados oficiais da escola
    </footer>
  </div>
}
