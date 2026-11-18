import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, GraduationCap, LockKeyhole, ShieldCheck, Users } from 'lucide-react'
import { apiEscolar } from './api'
import type { UsuarioEscolar } from './api'
import './portal.css'

type Props = { entrar: (pessoa: UsuarioEscolar) => void }
type Categoria = 'aluno' | 'funcionario'

export default function PortalLogin({entrar}:Props){
  const [categoria,setCategoria]=useState<Categoria>('aluno')
  const [email,setEmail]=useState('')
  const [senha,setSenha]=useState('')
  const [mostrarSenha,setMostrarSenha]=useState(false)
  const [enviando,setEnviando]=useState(false)
  const [erro,setErro]=useState('')
  const entrarNoPortal=async(evento:FormEvent)=>{
    evento.preventDefault()
    if(enviando)return
    setErro('')
    setEnviando(true)
    try{
      const pessoa=await apiEscolar.login(email.trim(),senha)
      setSenha('')
      entrar(pessoa)
    }catch(falha){
      setErro(falha instanceof Error?falha.message:'Não foi possível entrar. Tente novamente.')
    }finally{
      setEnviando(false)
    }
  }
  return <section className="portal-login" aria-labelledby="portal-titulo-login">
    <header className="portal-login-cabecalho">
      <span className="portal-identidade"><LockKeyhole size={22}/></span>
      <span className="sobretitulo">ACESSO INSTITUCIONAL</span>
      <h2 id="portal-titulo-login">Entrar no Extensão</h2>
      <p>Selecione sua área de acesso.</p>
    </header>
    <div className="portal-perfis" role="group" aria-label="Área de acesso">
      <button type="button" aria-pressed={categoria==='aluno'}
        className={categoria==='aluno'?'selecionado':''} onClick={()=>setCategoria('aluno')}>
        <GraduationCap size={22}/><strong>Sou aluno</strong>
      </button>
      <button type="button" aria-pressed={categoria==='funcionario'}
        className={categoria==='funcionario'?'selecionado':''} onClick={()=>setCategoria('funcionario')}>
        <Users size={22}/><strong>Sou funcionário</strong>
      </button>
    </div>
    <form onSubmit={entrarNoPortal} className="portal-form">
      <label htmlFor="portal-email">E-mail</label>
      <input id="portal-email" type="email" autoComplete="username" required maxLength={254}
        placeholder="Seu e-mail cadastrado" value={email} onChange={evento=>setEmail(evento.target.value)}/>
      <label htmlFor="portal-senha">Senha</label>
      <div className="portal-senha-campo">
        <input id="portal-senha" type={mostrarSenha?'text':'password'} autoComplete="current-password"
          required maxLength={200} value={senha} onChange={evento=>setSenha(evento.target.value)}/>
        <button type="button" className="portal-senha-visivel" aria-label={mostrarSenha?'Ocultar senha':'Mostrar senha'}
          aria-pressed={mostrarSenha} onClick={()=>setMostrarSenha(atual=>!atual)}>
          {mostrarSenha?<EyeOff size={19}/>:<Eye size={19}/>}
        </button>
      </div>
      <button className="botao-principal" type="submit" disabled={enviando}>
        <LockKeyhole size={18}/>{enviando?'Verificando...':'Entrar'}
      </button>
      {erro&&<p className="portal-feedback falha" role="alert">{erro}</p>}
    </form>
    <p className="portal-nota portal-login-seguranca"><ShieldCheck size={17}/>
      {categoria==='aluno'?'Seu estudo e suas atividades.':'Professor, direção e administração.'}
      {' '}A escola confirma suas permissões após o login.
    </p>
  </section>
}
