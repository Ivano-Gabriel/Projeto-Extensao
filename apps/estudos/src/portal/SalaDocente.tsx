import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { BookOpen, Bot, ClipboardCopy, Edit3, Save, Sparkles, Trash2 } from 'lucide-react'
import { apiEscolar } from './api'
import type { MaterialFormulario, MaterialTurma, QuizGeradoIa, RespostaIa, StatusIa, TipoRascunho } from './api'
import { falha } from './ComponentesPortal'

type Props={turmaId:number;disciplina:string;disciplinas:readonly string[];aoPrepararQuiz:(quiz:QuizGeradoIa)=>void}
const vazio:MaterialFormulario={disciplina:'',titulo:'',conteudo:'',publicado:false}
export default function SalaDocente({turmaId,disciplina,disciplinas,aoPrepararQuiz}:Props){
  const [materiais,setMateriais]=useState<MaterialTurma[]>([])
  const [usuarioId,setUsuarioId]=useState(0)
  const [form,setForm]=useState<MaterialFormulario>(vazio)
  const [editando,setEditando]=useState<number|null>(null)
  const [tema,setTema]=useState('')
  const [tipo,setTipo]=useState<TipoRascunho>('QUIZ')
  const [contexto,setContexto]=useState('')
  const [resposta,setResposta]=useState<RespostaIa|null>(null)
  const [statusIa,setStatusIa]=useState<StatusIa|null>(null)
  const [ocupado,setOcupado]=useState(false)
  const [gerando,setGerando]=useState(false)
  const [erro,setErro]=useState('')
  const [sucesso,setSucesso]=useState('')
  useEffect(()=>{
    if(!turmaId)return
    let ativo=true
    setErro('');setForm({...vazio,disciplina});setEditando(null)
    Promise.all([apiEscolar.materiaisTurma(turmaId),apiEscolar.me(),apiEscolar.statusIa()])
      .then(([m,eu,si])=>{if(ativo){setMateriais(m);setUsuarioId(eu.id);setStatusIa(si)}})
      .catch(e=>{if(ativo)setErro(falha(e))})
    return()=>{ativo=false}
  },[turmaId])
  useEffect(()=>{if(editando===null)setForm(atual=>({...atual,disciplina}))},[disciplina,editando])
  const recarregar=async()=>setMateriais(await apiEscolar.materiaisTurma(turmaId))
  const limpar=()=>{setForm({...vazio,disciplina});setEditando(null)}
  const salvar=async(e:FormEvent)=>{
    e.preventDefault();if(!disciplina)return
    setOcupado(true);setErro('');setSucesso('')
    try{
      if(editando!==null)await apiEscolar.editarMaterial(editando,form)
      else await apiEscolar.criarMaterial(turmaId,form)
      await recarregar();limpar()
      setSucesso(form.publicado?'Material publicado para alunos.':'Rascunho salvo no banco.')
    }catch(e){setErro(falha(e))}finally{setOcupado(false)}
  }
  const excluir=async(id:number)=>{
    setOcupado(true);setErro('')
    try{await apiEscolar.apagarMaterial(id);await recarregar();limpar();setSucesso('Material excluído.')}
    catch(e){setErro(falha(e))}finally{setOcupado(false)}
  }
  const gerar=async(e:FormEvent)=>{
    e.preventDefault();if(!turmaId||!disciplina)return
    setGerando(true);setErro('');setResposta(null)
    try{
      const r=await apiEscolar.gerarRascunho({turmaId,disciplina,tema,tipo,contexto})
      setResposta(r)
      setStatusIa(prev=>prev?{...prev,restantesHoje:r.restantesHoje}:prev)
    }
    catch(e){setErro(falha(e))}finally{setGerando(false)}
  }
  if(!turmaId)return <p className="ext-empty">A direção precisa vincular você a uma turma.</p>
  const visiveis=materiais.filter(m=>m.disciplina===disciplina)
  return <div className="ext-docente">
    {erro&&<p className="portal-feedback falha" role="alert">{erro}</p>}
    {sucesso&&<p className="portal-feedback sucesso" role="status">{sucesso}</p>}
    <div className="ext-duas-colunas">
      <article className="ext-surface">
        <h3><BookOpen size={19}/> {editando!==null?'Editar material':'Preparar material da turma'}</h3>
        <p className="ext-ajuda">Organize aulas, resumos e orientações. Escolha quando o aluno poderá visualizar.</p>
        <form className="portal-form" onSubmit={e=>void salvar(e)}>
          <label htmlFor="mat-disc">Disciplina</label>
          <select id="mat-disc" value={form.disciplina} required disabled={editando!==null}
            onChange={e=>setForm({...form,disciplina:e.target.value})}>
            {disciplinas.length===0&&<option value="">Sem vínculo</option>}
            {disciplinas.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          <label htmlFor="mat-titulo">Título</label>
          <input id="mat-titulo" maxLength={150} required value={form.titulo}
            placeholder="Ex.: Revisão de equações" onChange={e=>setForm({...form,titulo:e.target.value})}/>
          <label htmlFor="mat-conteudo">Conteúdo do material</label>
          <textarea id="mat-conteudo" rows={7} maxLength={4000} required value={form.conteudo}
            placeholder="Resumo, exemplos e orientações de estudo."
            onChange={e=>setForm({...form,conteudo:e.target.value})}/>
          <label className="ext-check"><input type="checkbox" checked={form.publicado}
            onChange={e=>setForm({...form,publicado:e.target.checked})}/>
            {form.publicado?'Publicado para os alunos':'Salvar como rascunho privado'}</label>
          <div className="ext-acoes">
            <button type="submit" className="botao-principal" disabled={ocupado||!form.disciplina}>
              <Save size={17}/>{ocupado?'Salvando...':editando===null?'Salvar material':'Atualizar material'}</button>
            {editando!==null&&<button type="button" className="botao-secundario" onClick={limpar}>Cancelar</button>}
          </div>
        </form>
      </article>
      <article className="ext-surface ext-ia">
        <h3><Bot size={20}/> Assistente pedagógico IA</h3>
        <p className="ext-ajuda">Crie atividades, explicações e planos de aula para sua turma.
          Revise antes de publicar: a IA não lança notas nem envia nada aos alunos sozinha.</p>
        <p className="ext-ia-disponibilidade" role="status">
          {statusIa===null?'Consultando a disponibilidade da IA...':
            statusIa.habilitada?`IA ativa · ${statusIa.restantesHoje} gerações restantes hoje`:
            'IA generativa ainda não ativada no ambiente. O editor manual continua funcionando.'}
        </p>
        <form className="portal-form" onSubmit={e=>void gerar(e)}>
          <label htmlFor="ia-tipo">Tipo de rascunho</label>
          <select id="ia-tipo" value={tipo} onChange={e=>setTipo(e.target.value as TipoRascunho)}>
            <option value="QUIZ">Questão de múltipla escolha</option>
            <option value="EXPLICACAO">Explicação didática</option>
            <option value="PLANO_AULA">Plano de aula</option>
          </select>
          <label htmlFor="ia-tema">Tema</label>
          <input id="ia-tema" required maxLength={300} value={tema}
            placeholder="Ex.: Função do 1º grau" onChange={e=>setTema(e.target.value)}/>
          <label htmlFor="ia-contexto">Orientação adicional</label>
          <textarea id="ia-contexto" rows={3} maxLength={1200} value={contexto}
            placeholder="Ex.: linguagem simples, duração de 45 minutos."
            onChange={e=>setContexto(e.target.value)}/>
          <p className="ext-aviso-ia">Não envie dados pessoais de alunos. Revise toda resposta antes de utilizar.</p>
          <button type="submit" className="botao-principal" disabled={!disciplina||gerando||!statusIa?.habilitada||statusIa.restantesHoje===0}>
            <Sparkles size={18}/>{gerando?'Gerando...':'Gerar rascunho com IA'}</button>
        </form>
        {resposta&&<div className="ext-resposta" aria-live="polite">
          <strong>Rascunho para revisão</strong>
          {resposta.quiz?<div className="ext-quiz-ia">
            <h4>{resposta.quiz.titulo}</h4>
            <p>{resposta.quiz.pergunta}</p>
            <ol type="A">{resposta.quiz.opcoes.map((opcao,i)=>
              <li key={i} className={i===resposta.quiz?.correta?'correta':''}>{opcao}</li>)}</ol>
            <p><strong>Gabarito para o professor:</strong> {String.fromCharCode(65+resposta.quiz.correta)}</p>
            <p><strong>Explicação:</strong> {resposta.quiz.explicacao}</p>
          </div>:<p>{resposta.texto}</p>}
          <small>{resposta.aviso}</small>
          <div className="ext-acoes">
            {resposta.quiz?<button type="button" className="botao-principal"
              onClick={()=>{aoPrepararQuiz(resposta.quiz!);setResposta(null)}}>
              <Edit3 size={17}/> Revisar quiz no editor de atividades</button>:
            <button type="button" className="botao-secundario" onClick={()=>{
              setForm({...vazio,conteudo:resposta.texto.slice(0,4000),disciplina})
              setEditando(null);setSucesso('Rascunho levado ao editor. Revise e salve.')
            }}><Edit3 size={17}/> Levar ao editor de materiais</button>}
            <button type="button" className="botao-secundario" onClick={()=>void navigator.clipboard.writeText(resposta.texto)}>
              <ClipboardCopy size={17}/> Copiar</button>
          </div>
        </div>}
      </article>
    </div>
    <article className="ext-surface">
      <h3>Materiais salvos</h3>
      {visiveis.length===0?<p className="ext-empty">Nenhum material cadastrado nesta disciplina.</p>:
        <div className="ext-registros">{visiveis.map(m=><div key={m.id} className="ext-registro">
          <div><strong>{m.titulo}</strong><small>{m.publicado?'Publicado':'Rascunho privado'} · {m.disciplina}</small>
            <p className="ext-trecho">{m.conteudo}</p></div>
          {m.professorId===usuarioId&&<div className="ext-acoes">
            <button type="button" className="botao-secundario" onClick={()=>{
              setEditando(m.id);setForm({disciplina:m.disciplina,titulo:m.titulo,conteudo:m.conteudo,publicado:m.publicado})
            }}><Edit3 size={16}/> Editar</button>
            <button type="button" className="ext-remover" disabled={ocupado}
              aria-label={'Excluir '+m.titulo} onClick={()=>{if(window.confirm('Excluir este material?'))void excluir(m.id)}}>
              <Trash2 size={17}/></button>
          </div>}
        </div>)}</div>}
    </article>
  </div>
}
