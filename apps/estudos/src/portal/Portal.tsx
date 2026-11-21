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
  return <div className={`pagina portal-pagina zelo-portal zelo-portal-${area.toLowerCase()}`}>
    {voltar&&<button type="button" className="botao-voltar" onClick={voltar}>
      <ArrowLeft size={18}/> Voltar aos estudos
    </button>}
    <header className="portal-hero zelo-hero-portal">
      <div className="zelo-hero-conteudo">
        <div className="zelo-hero-lockup">
          <ZeloMarca variante="compacta" clara/>
          <span>{area==='ALUNO'?'MEUS ESTUDOS':area==='PROFESSOR'?'SALA DO PROFESSOR':
            area==='DIRECAO'?'PAINEL DE GESTÃO':'ADMINISTRAÇÃO'}</span>
        </div>
        <span className="zelo-hero-eyebrow">
          {area==='ALUNO'?'SEU LUGAR DE APRENDER':area==='PROFESSOR'?'PLANEJE, ENSINE, ACOMPANHE':'CUIDE DA SUA ESCOLA'}
        </span>
        <h1>{area==='ALUNO'?'Bom te ver, ':area==='DIRECAO'?'Sua escola começa aqui, ':'Tudo pronto, '}{usuario.nome.split(' ')[0]}.</h1>
        <p>{area==='ALUNO'?'O próximo passo da sua jornada está a um toque.':
          area==='PROFESSOR'?'Sua turma e suas ferramentas, sem complicação.':
          'Acompanhe sua comunidade e organize o dia com clareza.'}</p>
        <div className="portal-acesso">
        <span><ShieldCheck size={17}/>{papel}</span>
        <button type="button" aria-expanded={seguranca} onClick={()=>setSeguranca(x=>!x)}>
          <KeyRound size={17}/>{seguranca?'Fechar segurança':'Minha segurança'}
        </button>
        <button type="button" onClick={()=>void sair()} disabled={saindo}>
          <LogOut size={17}/>{saindo?'Saindo...':'Sair'}
        </button>
        </div>
      </div>
      <div className="zelo-hero-fotografia" aria-hidden="true"/>
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
