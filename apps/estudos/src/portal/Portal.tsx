import { useState } from 'react'
import { ArrowLeft, GraduationCap, LogOut, School, ShieldCheck } from 'lucide-react'
import type { UsuarioEscolar } from './api'
import { areaDoUsuario } from './perfis'
import AlunoPainel from './AlunoPainel'
import ProfessorPainel from './ProfessorPainel'
import DirecaoPainel from './DirecaoPainel'
import AdminPainel from './AdminPainel'
import { falha } from './ComponentesPortal'
import './portal.css'
import './portal-academico.css'

type Props={usuario:UsuarioEscolar;onSair:()=>Promise<void>;voltar?:()=>void}
export default function Portal({usuario,onSair,voltar}:Props){
  const [erro,setErro]=useState('')
  const [saindo,setSaindo]=useState(false)
  const area=areaDoUsuario(usuario)
  const papel=area==='ADMIN'?'ADMINISTRADOR':area==='DIRECAO'?'DIREÇÃO':
    area==='PROFESSOR'?'PROFESSOR':'ALUNO'
  const sair=async()=>{
    if(saindo)return
    setErro('');setSaindo(true)
    try{await onSair()}catch(e){setErro(falha(e));setSaindo(false)}
  }
  return <div className="pagina portal-pagina">
    {voltar&&<button type="button" className="botao-voltar" onClick={voltar}>
      <ArrowLeft size={18}/> Voltar aos estudos
    </button>}
    <header className="portal-hero">
      <span className="portal-hero-marca"><School size={21}/> EXTENSÃO ESCOLAR</span>
      <h1>Olá, {usuario.nome.split(' ')[0]}!</h1>
      <div className="portal-acesso">
        <span><ShieldCheck size={17}/>{papel}</span>
        <button type="button" onClick={()=>void sair()} disabled={saindo}>
          <LogOut size={17}/>{saindo?'Saindo...':'Sair'}
        </button>
      </div>
    </header>
    {erro&&<p role="alert" className="portal-feedback falha">{erro}</p>}
    {area==='ADMIN'?<AdminPainel/>:area==='DIRECAO'?<DirecaoPainel/>:
      area==='PROFESSOR'?<ProfessorPainel/>:<AlunoPainel/>}
    <footer className="portal-rodape"><GraduationCap size={16}/>
      Sistema em homologação · Somente dados fictícios de teste
    </footer>
  </div>
}
