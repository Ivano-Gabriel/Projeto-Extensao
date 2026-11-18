import { useState } from 'react'
import type { FormEvent } from 'react'
import { BookOpen, CheckCircle2, Info, Plus, ShieldCheck } from 'lucide-react'
import { materiais, type Materia } from '../dados/materiais'
import { disciplinas } from './dados'
import { formatarDataLocal } from './regras'
import type { NovoPostDemo } from './mural'
import { criarRascunhoDeTema } from './atividade'

type Props = {criar:(post:NovoPostDemo)=>void; quantidade:number}

export default function MuralDemo({criar,quantidade}:Props) {
  const [titulo,setTitulo]=useState('')
  const [texto,setTexto]=useState('')
  const [materia,setMateria]=useState<Materia>('Matemática')
  const [materialId,setMaterialId]=useState('')
  const [erro,setErro]=useState('')
  const [status,setStatus]=useState('')
  const lista=materiais.filter(m=>m.materia===materia)
  const enviar=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();setErro('');setStatus('')
    try{
      criar({titulo,texto,materia,criadoEm:formatarDataLocal(new Date()),
        ...(materialId?{materialId}:{})})
      setTitulo('');setTexto('');setMaterialId('')
      setStatus('Post demonstrativo criado neste navegador.')
    }catch(e){setErro(e instanceof Error?e.message:'Não foi possível criar a publicação.')}
  }
  return <section className="mural-simulador" aria-label="Simulador local de postagem">
    <header className="mural-simulador-cabecalho">
      <span className="mural-simulador-icone"><ShieldCheck size={24}/></span>
      <div><span className="sobretitulo">APRESENTAÇÃO PARA A ESCOLA</span><h3>Simular uma publicação do professor</h3></div>
    </header>
    <p className="mural-alerta"><Info size={18}/>
      <span><strong>Isto não é uma conta de professor.</strong> Qualquer pessoa com este navegador pode criar posts de exemplo.
      Eles não são enviados à escola, nem aparecem em outros aparelhos. Não inclua nomes ou informações de alunos.</span></p>
    <form onSubmit={enviar} className="mural-form">
      <label htmlFor="mural-titulo">Título do recado</label>
      <input type="text" id="mural-titulo" minLength={5} maxLength={100} required
        placeholder="Ex.: Revisão de funções na próxima aula" value={titulo}
        onChange={(e)=>setTitulo(e.target.value)}/>
      <label htmlFor="mural-texto">Mensagem fictícia</label>
      <textarea id="mural-texto" minLength={10} maxLength={500} required rows={4}
        placeholder="Escreva um aviso ou uma dica de estudo sem citar estudantes reais..."
        value={texto} onChange={(e)=>setTexto(e.target.value)}/>
      <div className="mural-form-campos">
        <div><label htmlFor="mural-materia">Matéria</label>
          <select id="mural-materia" value={materia} onChange={(e)=>{setMateria(e.target.value as Materia);setMaterialId('')}}>
            {disciplinas.map(m=><option key={m}>{m}</option>)}</select></div>
        <div><label htmlFor="mural-material">Material (opcional)</label>
          <select id="mural-material" value={materialId} onChange={(e)=>setMaterialId(e.target.value)}>
            <option value="">Sem material</option>
            {lista.map(m=><option value={m.id} key={m.id}>{m.titulo}</option>)}</select></div>
      </div>
      <div className="atividade-form-gerar">
        <strong>Gerar quiz de revisão a partir de um tema</strong>
        <p>Escolha um material acima. O app prepara título, recado e uma questão já revisada do nosso catálogo. Não usa IA e ainda não lê PDFs.</p>
        <button type="button" disabled={!materialId} onClick={()=>{
          try {
            const rascunho=criarRascunhoDeTema(materialId)
            setMateria(rascunho.materia)
            setTitulo(rascunho.titulo)
            setTexto(rascunho.texto)
            setErro('')
            setStatus('Atividade preparada. Confira o recado e clique em Publicar na simulação.')
          }catch(e){setErro(e instanceof Error?e.message:'Tema indisponível.')}
        }}>Gerar atividade deste tema</button>
      </div>
      <div className="mural-form-acoes">
        <small><BookOpen size={16}/> {quantidade}/15 posts locais</small>
        <button type="submit" className="botao-principal" disabled={quantidade>=15}>
          <Plus size={18}/> Publicar na simulação
        </button>
      </div>
      {erro && <p className="mural-erro" role="alert">{erro}</p>}
      {status && <p className="mural-sucesso" role="status"><CheckCircle2 size={17}/>{status}</p>}
    </form>
  </section>
}
