import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { apiEscolar } from './api'
import { falha } from './ComponentesPortal'

export default function SegurancaConta(){
  const [atual,setAtual]=useState('')
  const [nova,setNova]=useState('')
  const [confirmacao,setConfirmacao]=useState('')
  const [ocupado,setOcupado]=useState(false)
  const [erro,setErro]=useState('')
  const enviar=async(e:FormEvent)=>{
    e.preventDefault()
    if(ocupado)return
    if(nova!==confirmacao){setErro('As novas senhas não coincidem.');return}
    setErro('');setOcupado(true)
    try{
      await apiEscolar.trocarSenha(atual,nova)
      window.location.assign('/')
    }catch(e){setErro(falha(e));setOcupado(false)}
  }
  return <section className="ext-surface ext-seguranca-conta" aria-label="Segurança da conta">
    <h2><KeyRound size={20}/> Trocar minha senha</h2>
    <p>Informe a senha atual para proteger sua conta. Depois da alteração, entre novamente.
      A recuperação por e-mail ainda não está disponível neste piloto.</p>
    <form className="portal-form" onSubmit={e=>void enviar(e)}>
      <label htmlFor="seg-atual">Senha atual</label>
      <input id="seg-atual" type="password" autoComplete="current-password"
        value={atual} onChange={e=>setAtual(e.target.value)} required maxLength={200}/>
      <label htmlFor="seg-nova">Nova senha (mínimo 12 caracteres)</label>
      <input id="seg-nova" type="password" autoComplete="new-password"
        value={nova} onChange={e=>setNova(e.target.value)} required minLength={12} maxLength={200}/>
      <label htmlFor="seg-confirmar">Confirmar nova senha</label>
      <input id="seg-confirmar" type="password" autoComplete="new-password"
        value={confirmacao} onChange={e=>setConfirmacao(e.target.value)} required minLength={12} maxLength={200}/>
      <button className="botao-principal" disabled={ocupado} type="submit">
        <ShieldCheck size={18}/>{ocupado?'Atualizando...':'Alterar senha e sair'}
      </button>
      {erro&&<p className="portal-feedback falha" role="alert">{erro}</p>}
    </form>
  </section>
}
