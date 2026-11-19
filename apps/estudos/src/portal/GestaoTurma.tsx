import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarClock, Check, GraduationCap, Palette, Plus, Save, School, Trash2, Users } from 'lucide-react'
import { apiEscolar } from './api'
import type { AlunoResumo, HorarioTurma, TurmaConfiguracao, Vinculo } from './api'
import { falha } from './ComponentesPortal'

type Props={turmaId:number;aoSalvar:()=>Promise<void>}
const dias=['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
const disciplinas=['MATEMATICA','PORTUGUES','FISICA','HISTORIA','BIOLOGIA','QUIMICA','GEOGRAFIA','INGLES','SOCIOLOGIA','FILOSOFIA']
const inicioFormulario={disciplina:'MATEMATICA',diaSemana:1,inicio:'07:00',fim:'07:50',professorId:0}

export default function GestaoTurma({turmaId,aoSalvar}:Props){
  const [config,setConfig]=useState<TurmaConfiguracao|null>(null)
  const [horarios,setHorarios]=useState<HorarioTurma[]>([])
  const [vinculos,setVinculos]=useState<Vinculo[]>([])
  const [alunos,setAlunos]=useState<AlunoResumo[]>([])
  const [horario,setHorario]=useState(inicioFormulario)
  const [carregando,setCarregando]=useState(true)
  const [salvando,setSalvando]=useState(false)
  const [erro,setErro]=useState('')
  const [sucesso,setSucesso]=useState('')
  const carregar=async()=>{
    const [c,h,v,a]=await Promise.all([
      apiEscolar.configuracaoTurma(turmaId),apiEscolar.horariosTurma(turmaId),
      apiEscolar.vinculos(turmaId),apiEscolar.alunos(turmaId),
    ])
    setConfig(c);setHorarios(h);setVinculos(v);setAlunos(a)
  }
  useEffect(()=>{
    let ativa=true
    setCarregando(true);setErro('');setConfig(null)
    Promise.all([
      apiEscolar.configuracaoTurma(turmaId),apiEscolar.horariosTurma(turmaId),
      apiEscolar.vinculos(turmaId),apiEscolar.alunos(turmaId),
    ]).then(([c,h,v,a])=>{if(ativa){setConfig(c);setHorarios(h);setVinculos(v);setAlunos(a)}})
      .catch(e=>{if(ativa)setErro(falha(e))})
      .finally(()=>{if(ativa)setCarregando(false)})
    return()=>{ativa=false}
  },[turmaId])
  const executar=async(operacao:()=>Promise<void>,mensagem:string)=>{
    setErro('');setSucesso('');setSalvando(true)
    try{await operacao();await carregar();setSucesso(mensagem)}
    catch(e){setErro(falha(e))}
    finally{setSalvando(false)}
  }
  const salvar=async(e:FormEvent)=>{
    e.preventDefault()
    if(!config)return
    await executar(async()=>{
      await apiEscolar.atualizarTurma(turmaId,{
        codigo:config.codigo,nome:config.nome,anoLetivo:config.anoLetivo,
        descricao:config.descricao,cor:config.cor,
      })
      await aoSalvar()
    },'Turma atualizada no banco.')
  }
  const adicionarHorario=async(e:FormEvent)=>{
    e.preventDefault()
    if(horario.inicio>=horario.fim){setErro('O horário inicial deve ser anterior ao final.');return}
    await executar(async()=>{
      await apiEscolar.criarHorario(turmaId,{
        disciplina:horario.disciplina,diaSemana:horario.diaSemana,
        inicio:horario.inicio,fim:horario.fim,professorId:horario.professorId||null,
      })
    },'Horário cadastrado.')
  }
  if(carregando)return <div className="ext-empty">Carregando configuração desta turma...</div>
  if(!config)return <p role="alert" className="portal-feedback falha">{erro||'Turma indisponível.'}</p>
  const professorDaDisciplina=vinculos.filter(v=>v.disciplina===horario.disciplina)
  return <section className="ext-gestao" aria-label="Gestão detalhada da turma">
    <header className="ext-turma-cabecalho" style={{borderTopColor:config.cor}}>
      <span className="ext-turma-emblema" style={{background:config.cor}}><School size={25}/></span>
      <div><span className="sobretitulo">GESTÃO DE TURMA · DADOS SALVOS</span>
        <h2>{config.codigo} — {config.nome}</h2>
        <p>{config.descricao||'Adicione uma apresentação desta turma.'}</p></div>
    </header>
    {erro&&<p className="portal-feedback falha" role="alert">{erro}</p>}
    {sucesso&&<p className="portal-feedback sucesso" role="status"><Check size={17}/>{sucesso}</p>}
    <div className="ext-resumo">
      <span><Users size={17}/><strong>{alunos.length}</strong> alunos</span>
      <span><GraduationCap size={17}/><strong>{vinculos.length}</strong> vínculos docentes</span>
      <span><CalendarClock size={17}/><strong>{horarios.length}</strong> horários</span>
    </div>
    <div className="ext-duas-colunas">
      <article className="ext-surface">
        <h3><Palette size={19}/> Identidade e descrição</h3>
        <p className="ext-ajuda">Esses dados são persistidos e exibidos somente às pessoas autorizadas.</p>
        <form className="portal-form" onSubmit={e=>void salvar(e)}>
          <div className="portal-campos">
            <div><label htmlFor="conf-codigo">Código</label>
              <input id="conf-codigo" required maxLength={32} pattern="[a-zA-Z0-9-]{1,32}"
                value={config.codigo} onChange={e=>setConfig({...config,codigo:e.target.value})}/></div>
            <div><label htmlFor="conf-ano">Ano letivo</label>
              <input id="conf-ano" type="number" required min={2020} max={2100}
                value={config.anoLetivo} onChange={e=>setConfig({...config,anoLetivo:Number(e.target.value)})}/></div>
          </div>
          <label htmlFor="conf-nome">Nome da turma</label>
          <input id="conf-nome" required maxLength={100} value={config.nome}
            onChange={e=>setConfig({...config,nome:e.target.value})}/>
          <label htmlFor="conf-descricao">Apresentação da turma</label>
          <textarea id="conf-descricao" rows={3} maxLength={500} value={config.descricao}
            placeholder="Objetivos, informações gerais e boas-vindas."
            onChange={e=>setConfig({...config,descricao:e.target.value})}/>
          <label htmlFor="conf-cor">Cor de identificação</label>
          <div className="ext-cor"><input id="conf-cor" type="color" value={config.cor}
            onChange={e=>setConfig({...config,cor:e.target.value})}/>
            <span>{config.cor}</span></div>
          <button className="botao-principal" type="submit" disabled={salvando}>
            <Save size={17}/>{salvando?'Salvando...':'Salvar alterações'}</button>
        </form>
      </article>
      <article className="ext-surface">
        <h3><CalendarClock size={19}/> Grade de horários</h3>
        <p className="ext-ajuda">Cadastre os horários das disciplinas. Atribua professores já vinculados à turma.</p>
        <form className="portal-form" onSubmit={e=>void adicionarHorario(e)}>
          <label htmlFor="hor-disciplina">Disciplina</label>
          <select id="hor-disciplina" value={horario.disciplina}
            onChange={e=>setHorario({...horario,disciplina:e.target.value,professorId:0})}>
            {disciplinas.map(d=><option key={d}>{d}</option>)}
          </select>
          <label htmlFor="hor-dia">Dia da semana</label>
          <select id="hor-dia" value={horario.diaSemana}
            onChange={e=>setHorario({...horario,diaSemana:Number(e.target.value)})}>
            {dias.slice(1).map((d,i)=><option key={d} value={i+1}>{d}</option>)}
          </select>
          <div className="portal-campos">
            <div><label htmlFor="hor-inicio">Início</label><input id="hor-inicio" type="time" required value={horario.inicio}
              onChange={e=>setHorario({...horario,inicio:e.target.value})}/></div>
            <div><label htmlFor="hor-fim">Fim</label><input id="hor-fim" type="time" required value={horario.fim}
              onChange={e=>setHorario({...horario,fim:e.target.value})}/></div>
          </div>
          <label htmlFor="hor-prof">Professor responsável</label>
          <select id="hor-prof" value={horario.professorId}
            onChange={e=>setHorario({...horario,professorId:Number(e.target.value)})}>
            <option value={0}>Sem atribuição por enquanto</option>
            {professorDaDisciplina.map(v=><option key={v.professorId} value={v.professorId}>{v.nome}</option>)}
          </select>
          <button className="botao-principal" type="submit" disabled={salvando}>
            <Plus size={17}/> Adicionar horário</button>
        </form>
      </article>
    </div>
    <article className="ext-surface">
      <h3>Horários cadastrados</h3>
      {horarios.length===0?<p className="ext-empty">Nenhum horário criado. Comece pela grade acima.</p>:
        <div className="ext-registros">{horarios.map(h=><div key={h.id} className="ext-registro">
          <div><strong>{dias[h.diaSemana]} · {h.inicio}–{h.fim}</strong>
            <small>{h.disciplina} · {h.professorNome||'Sem professor atribuído'}</small></div>
          <button type="button" className="ext-remover" disabled={salvando}
            aria-label={'Remover horário de '+h.disciplina}
            onClick={()=>void executar(()=>apiEscolar.apagarHorario(turmaId,h.id),'Horário removido.')}>
            <Trash2 size={17}/></button>
        </div>)}</div>}
    </article>
  </section>
}
