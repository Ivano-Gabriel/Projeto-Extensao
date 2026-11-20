import { useState } from 'react'
import type { FormEvent } from 'react'
import { Atom, BookOpenCheck, BookText, Brain, Code2, Eye, EyeOff, FlaskConical, Globe2, GraduationCap, Landmark, LockKeyhole, ShieldCheck, Sigma, Users } from 'lucide-react'
import { apiEscolar } from './api'
import ZeloMarca from '../marca/ZeloMarca'
import type { UsuarioEscolar } from './api'
import './portal.css'
import './portal-premium.css'

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
  return <section className="portal-login prime-login" aria-labelledby="portal-titulo-login">
    <div className="prime-login-cena" aria-hidden="true">
      <div className="prime-login-arte">
        <div className="prime-book-spread">
          <div className="prime-book-cover prime-book-left">
            <span className="prime-book-caption">MEU CADERNO</span>
            <BookOpenCheck size={32}/>
            <strong>Descobertas</strong>
            <small>Aprender transforma.</small>
          </div>
          <div className="prime-book-cover prime-book-right">
            <span className="prime-book-caption">SEU FUTURO</span>
            <GraduationCap size={35}/>
            <strong>Vamos além!</strong>
            <small>Um passo por dia.</small>
          </div>
          <div className="prime-book-page prime-book-page-four">
            <span className="prime-book-page-face prime-book-page-front">
              <span className="prime-book-caption">FILOSOFIA</span>
              <Brain size={26}/><strong>Por quê?</strong><small>Ideias mudam tudo.</small>
              <span className="prime-book-page-index">07</span>
            </span>
            <span className="prime-book-page-face prime-book-page-back">
              <span className="prime-book-caption">TECNOLOGIA</span>
              <Code2 size={27}/><strong>{'</>'}</strong><small>Criar o amanhã.</small>
              <span className="prime-book-page-index">08</span>
            </span>
          </div>
          <div className="prime-book-page prime-book-page-three">
            <span className="prime-book-page-face prime-book-page-front">
              <span className="prime-book-caption">PORTUGUÊS</span>
              <BookText size={25}/><strong>Ler</strong><small>Abre mil mundos.</small>
              <span className="prime-book-page-index">05</span>
            </span>
            <span className="prime-book-page-face prime-book-page-back">
              <span className="prime-book-caption">QUÍMICA</span>
              <FlaskConical size={25}/><strong>H₂O</strong><small>Água da vida.</small>
              <span className="prime-book-page-index">06</span>
            </span>
          </div>
          <div className="prime-book-page prime-book-page-two">
            <span className="prime-book-page-face prime-book-page-front">
              <span className="prime-book-caption">HISTÓRIA</span>
              <Landmark size={25}/><strong>1822</strong><small>Conhecer o passado.</small>
              <span className="prime-book-page-index">03</span>
            </span>
            <span className="prime-book-page-face prime-book-page-back">
              <span className="prime-book-caption">GEOGRAFIA</span>
              <Globe2 size={25}/><strong>Nosso mundo</strong><small>Explore o planeta.</small>
              <span className="prime-book-page-index">04</span>
            </span>
          </div>
          <div className="prime-book-page prime-book-page-one">
            <span className="prime-book-page-face prime-book-page-front">
              <span className="prime-book-caption">MATEMÁTICA</span>
              <Sigma size={25}/><strong>Δ = b² − 4ac</strong><small>Descubra as raízes.</small>
              <span className="prime-book-page-index">01</span>
            </span>
            <span className="prime-book-page-face prime-book-page-back">
              <span className="prime-book-caption">CIÊNCIAS</span>
              <Atom size={25}/><strong>E = mc²</strong><small>Conheça o universo.</small>
              <span className="prime-book-page-index">02</span>
            </span>
          </div>
          <div className="prime-book-spine"/>
        </div>
        <span className="prime-book-spark prime-book-spark-left">✦</span>
        <span className="prime-book-spark prime-book-spark-right">✦</span>
      </div>
      <strong>Uma nova forma de aprender.</strong>
      <p>Suas aulas, descobertas e conquistas em um só lugar.</p>
    </div>
    <div className="prime-login-corpo">
    <header className="portal-login-cabecalho">
      <ZeloMarca className="zelo-login-lockup"/>
      <span className="sobretitulo">ACESSO ESCOLAR</span>
      <h2 id="portal-titulo-login">Bem-vindo ao zELO+</h2>
      <p>Entre para continuar seus estudos.</p>
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
    </div>
  </section>
}
