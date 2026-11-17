import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2,
  Circle, ClipboardList, Clock3, Info, Plus, Sparkles, Trash2 } from 'lucide-react'
import { materiais, type Materia } from '../dados/materiais'
import { formatarDataLocal } from '../escola/regras'
import { filtrarPlano, resumoPlano, type NovaTarefa, type TarefaPlano, type FiltroPlano } from './regras'
import './plano.css'

type Props = {
  tarefas: readonly TarefaPlano[]
  adicionar: (tarefa: NovaTarefa) => void
  alternar: (id: string) => void
  remover: (id: string) => void
  abrirMaterial: (id: string) => void
  voltar: () => void
}

const disciplinas: Materia[]=['Matemática','Português','Física','História']
const sugestoes = [
  {titulo:'Praticar porcentagem',materia:'Matemática' as const,materialId:'porcentagem'},
  {titulo:'Revisar figuras de linguagem',materia:'Português' as const,materialId:'figuras-linguagem'},
  {titulo:'Entender as leis de Newton',materia:'Física' as const,materialId:'leis-newton'},
  {titulo:'Resumir a Era Vargas',materia:'História' as const,materialId:'era-vargas'},
]
function diaFuturo(dias: number): string {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return formatarDataLocal(data)
}
function nomeData(data: string): string {
  const [a,m,d]=data.split('-').map(Number)
  return new Date(a,m-1,d).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})
}

export default function Plano({tarefas,adicionar,alternar,remover,abrirMaterial,voltar}:Props) {
  const [titulo,setTitulo]=useState('')
  const [materia,setMateria]=useState<Materia>('Matemática')
  const [data,setData]=useState(()=>diaFuturo(1))
  const [materialId,setMaterialId]=useState('')
  const [filtro,setFiltro]=useState<FiltroPlano>('pendentes')
  const [erro,setErro]=useState('')
  const [aviso,setAviso]=useState('')
  const [confirmarExclusao,setConfirmarExclusao]=useState<string|null>(null)
  const resumo=resumoPlano(tarefas)
  const filtradas=filtrarPlano(tarefas,filtro)
  const materiaisDaMateria=materiais.filter((m)=>m.materia===materia)

  const salvar=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    setErro('');setAviso('')
    try {
      adicionar({titulo,materia,data,...(materialId ? {materialId}:{})})
      setTitulo('');setMaterialId('')
      setAviso('Tarefa adicionada ao seu plano!')
      setFiltro('pendentes')
    }catch(e){setErro(e instanceof Error ? e.message:'Não foi possível criar a tarefa.')}
  }
  const adicionarSugestao=(sugestao:typeof sugestoes[number])=>{
    setErro('');setAviso('')
    try {
      adicionar({...sugestao,data:diaFuturo(2)})
      setAviso('Sugestão adicionada! Você pode mudar a data criando outra tarefa.')
      setFiltro('pendentes')
    }catch(e){setErro(e instanceof Error ? e.message:'Não foi possível adicionar.')}
  }
  return <div className="pagina plano-pagina">
    <button type="button" className="botao-voltar" onClick={voltar}><ArrowLeft size={17}/> Voltar ao início</button>
    <header className="plano-cabecalho">
      <div><span className="sobretitulo">SEU RITMO, SEU PLANO</span>
        <h1>Vamos organizar a semana?</h1>
        <p>Um lembrete de cada vez. Escolha o que estudar e marque o que terminou, sem pressão.</p></div>
      <span className="plano-selo"><ClipboardList size={18}/> PLANO PESSOAL</span>
    </header>
    <div className="demo-nota" role="note"><Info size={19}/>
      <span><strong>Seu planejamento é pessoal.</strong> Salvo só neste navegador, sem login nem envio para professores. Não equivale a tarefa oficial da escola.</span>
    </div>
    <section className="plano-contadores" aria-label="Resumo do plano">
      <div><span><Clock3 size={19}/> PENDENTES</span><strong>{resumo.pendentes}</strong><small>Pra fazer no seu tempo</small></div>
      <div><span><CheckCircle2 size={19}/> CONCLUÍDAS</span><strong>{resumo.concluidas}</strong><small>Conquistas já feitas</small></div>
      <div><span><CalendarDays size={19}/> PRÓXIMOS 7 DIAS</span><strong>{resumo.proximos7Dias}</strong><small>Tarefas planejadas</small></div>
    </section>
    {resumo.atrasadas>0 && <p className="plano-atraso" role="status"><Info size={17}/>
      {resumo.atrasadas} {resumo.atrasadas===1?'tarefa passou':'tarefas passaram'} da data planejada. Tudo bem reorganizar seus estudos.</p>}
    <div className="plano-colunas">
      <section className="plano-painel" aria-labelledby="plano-form-titulo">
        <span className="sobretitulo">COMECE POR AQUI</span><h2 id="plano-form-titulo">Nova tarefa de estudo</h2>
        <p>Que assunto você quer revisar?</p>
        <form className="plano-form" onSubmit={salvar}>
          <label htmlFor="plano-titulo">O que vou estudar?</label>
          <input id="plano-titulo" type="text" maxLength={90} minLength={3}
            placeholder="Ex.: resolver 5 questões de Física" value={titulo} required
            onChange={(e)=>setTitulo(e.target.value)}/>
          <div className="plano-campos">
            <div><label htmlFor="plano-materia">Matéria</label>
              <select id="plano-materia" value={materia} onChange={(e)=>{
                setMateria(e.target.value as Materia);setMaterialId('')
              }}>{disciplinas.map((nome)=><option key={nome}>{nome}</option>)}</select></div>
            <div><label htmlFor="plano-data">Quando?</label>
              <input id="plano-data" type="date" value={data} min={formatarDataLocal(new Date())} max="2100-12-31" required
                onChange={(e)=>setData(e.target.value)}/></div>
          </div>
          <label htmlFor="plano-material">Vincular material (opcional)</label>
          <select id="plano-material" value={materialId} onChange={(e)=>setMaterialId(e.target.value)}>
            <option value="">Sem vínculo</option>
            {materiaisDaMateria.map((m)=><option value={m.id} key={m.id}>{m.titulo}</option>)}
          </select>
          <button type="submit" className="botao-principal"><Plus size={18}/> Adicionar ao plano</button>
          <small>Até 50 tarefas por navegador. Não coloque informações pessoais nos títulos.</small>
        </form>
        <h3 className="plano-sugestoes-titulo"><Sparkles size={18}/> Sugestões rápidas</h3>
        <div className="plano-sugestoes">
          {sugestoes.map((s)=><button key={s.materialId} type="button" onClick={()=>adicionarSugestao(s)}>
            <span><strong>{s.titulo}</strong><small>{s.materia} · material disponível</small></span><Plus size={19}/></button>)}
        </div>
        {erro && <p role="alert" className="plano-erro">{erro}</p>}
        {aviso && <p role="status" className="plano-sucesso"><Check size={16}/>{aviso}</p>}
      </section>
      <section className="plano-painel" aria-labelledby="plano-lista-titulo">
        <div className="plano-lista-titulo"><div><span className="sobretitulo">ORGANIZAÇÃO</span><h2 id="plano-lista-titulo">Minhas tarefas</h2></div>
          <span>{tarefas.length}/50</span></div>
        <div className="plano-filtros" role="group" aria-label="Filtrar tarefas">
          {([{id:'pendentes',nome:'Pendentes'},{id:'concluidas',nome:'Feitas'},{id:'todas',nome:'Todas'}] as const)
            .map(({id,nome})=><button key={id} type="button" className={filtro===id?'ativo':''}
              aria-pressed={filtro===id} onClick={()=>setFiltro(id)}>{nome}</button>)}
        </div>
        {filtradas.length===0 ? <div className="plano-vazio">
          <BookOpen size={34}/><h3>{tarefas.length===0?'Seu plano começa aqui ✳':'Nada nessa lista'}</h3>
          <p>{tarefas.length===0?'Adicione uma tarefa ou escolha uma sugestão pra começar.':'Troque o filtro ou adicione uma nova tarefa.'}</p>
        </div> : <ul className="plano-lista">{filtradas.map((tarefa)=>
          <li key={tarefa.id} className={tarefa.feito?'feito':''}>
            <div className="plano-tarefa-topo">
              <button type="button" className="plano-check" aria-pressed={tarefa.feito}
                aria-label={tarefa.feito?`Reabrir ${tarefa.titulo}`:`Concluir ${tarefa.titulo}`}
                onClick={()=>alternar(tarefa.id)}>
                {tarefa.feito?<CheckCircle2 size={25}/>:<Circle size={25}/>}
              </button>
              <div className="plano-tarefa-conteudo">
                <h3>{tarefa.titulo}</h3><span>{tarefa.materia} · {nomeData(tarefa.data)}</span>
              </div>
              <button type="button" className="plano-excluir" aria-label={`Excluir ${tarefa.titulo}`}
                onClick={()=>setConfirmarExclusao(confirmarExclusao===tarefa.id?null:tarefa.id)}>
                <Trash2 size={18}/></button>
            </div>
            {tarefa.materialId && <button type="button" className="plano-abrir-material"
              onClick={()=>abrirMaterial(tarefa.materialId!)}>
              Abrir material vinculado <ArrowRight size={16}/></button>}
            {confirmarExclusao===tarefa.id && <div className="plano-confirmar">
              <span>Excluir esta tarefa?</span>
              <button type="button" onClick={()=>{remover(tarefa.id);setConfirmarExclusao(null)}}>Excluir</button>
              <button type="button" onClick={()=>setConfirmarExclusao(null)}>Cancelar</button>
            </div>}
          </li>)}</ul>}
      </section>
    </div>
  </div>
}
