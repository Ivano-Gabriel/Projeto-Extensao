import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiEscolar } from './api'
import type { EscolaResumo } from './api'
import { Aviso, Cartao, falha, type Feedback } from './ComponentesPortal'

export default function AdminPainel(){
  const [escolas,setEscolas]=useState<EscolaResumo[]>([])
  const [codigo,setCodigo]=useState(''),[nome,setNome]=useState('')
  const [escola,setEscola]=useState(''),[diretor,setDiretor]=useState(''),[email,setEmail]=useState(''),[senha,setSenha]=useState('')
  const [estado,setEstado]=useState<Feedback>({})
  const atualizar=async()=>{const lista=await apiEscolar.escolas();setEscolas(lista);setEscola(prev=>prev||String(lista[0]?.id||''))}
  useEffect(()=>{atualizar().catch(e=>setEstado({erro:falha(e)}))},[])
  const criarEscola=async(e:FormEvent)=>{
    e.preventDefault();setEstado({})
    try{await apiEscolar.criarEscola(codigo,nome);await atualizar();setEstado({ok:'Escola criada.'})}
    catch(err){setEstado({erro:falha(err)})}
  }
  const criarDirecao=async(e:FormEvent)=>{
    e.preventDefault();setEstado({})
    try{await apiEscolar.criarDirecao(Number(escola),{nome:diretor,email,senha});setSenha('')
      setEstado({ok:'Direção vinculada à escola.'})}
    catch(err){setEstado({erro:falha(err)})}
  }
  return <div className="portal-paineis">
    <Aviso estado={estado}/>
    <Cartao titulo="Escolas da plataforma">
      <div className="portal-etiquetas">{escolas.map(e=><span key={e.id}>{e.nome} · {e.codigo}</span>)}</div>
      <form className="portal-form" onSubmit={criarEscola}>
        <label htmlFor="adm-nome">Nome da escola</label><input id="adm-nome" required maxLength={150} value={nome} onChange={e=>setNome(e.target.value)}/>
        <label htmlFor="adm-codigo">Código identificador</label><input id="adm-codigo" required maxLength={40} pattern="[a-z0-9-]{3,40}" value={codigo} onChange={e=>setCodigo(e.target.value)}/>
        <button type="submit" className="botao-principal">Criar escola</button>
      </form>
    </Cartao>
    <Cartao titulo="Criar direção de escola">
      <form className="portal-form" onSubmit={criarDirecao}>
        <label htmlFor="adm-escola">Escola</label><select id="adm-escola" required value={escola} onChange={e=>setEscola(e.target.value)}>
          <option value="">Selecione</option>{escolas.map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}</select>
        <label htmlFor="adm-diretor">Nome do responsável</label><input id="adm-diretor" required maxLength={150} value={diretor} onChange={e=>setDiretor(e.target.value)}/>
        <label htmlFor="adm-email">E-mail institucional</label><input id="adm-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/>
        <label htmlFor="adm-senha">Senha inicial forte</label><input id="adm-senha" type="password" required minLength={16} autoComplete="new-password" value={senha} onChange={e=>setSenha(e.target.value)}/>
        <button type="submit" className="botao-principal">Criar direção</button>
      </form>
    </Cartao>
  </div>
}
