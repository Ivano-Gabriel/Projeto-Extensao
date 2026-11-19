import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import './portal-academico.css'

export type Feedback = {ok?:string;erro?:string}
export const falha=(e:unknown)=>e instanceof Error?e.message:'Tente novamente.'
export function Cartao({titulo,children,classe=''}:{titulo:string;children:ReactNode;classe?:string}){
  return <section className={`portal-cartao ${classe}`}>
    <h2>{titulo}</h2>{children}
  </section>
}
export function Aviso({estado}:{estado:Feedback}){
  return <>
    {estado.ok&&<p className="portal-feedback sucesso" role="status"><CheckCircle2 size={18}/>{estado.ok}</p>}
    {estado.erro&&<p className="portal-feedback falha" role="alert"><AlertCircle size={18}/>{estado.erro}</p>}
  </>
}
export function Vazio({texto}:{texto:string}){return <p className="portal-vazio">{texto}</p>}
export function Selo({valor,legenda}:{valor:number|string;legenda:string}){
  return <div className="portal-metrica">
    <strong>{valor}</strong><span>{legenda}</span>
  </div>
}
export function Abas({abas,atual,mudar}:{abas:readonly {id:string;titulo:string}[];atual:string;mudar:(id:string)=>void}){
  return <div className="portal-abas" role="tablist" aria-label="Seções do portal">
    {abas.map(a=><button key={a.id} type="button" role="tab" aria-selected={atual===a.id}
      className={atual===a.id?'ativa':''} onClick={()=>mudar(a.id)}>{a.titulo}</button>)}
  </div>
}
