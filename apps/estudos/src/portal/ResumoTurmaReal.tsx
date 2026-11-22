import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, GraduationCap, Megaphone, School, Sparkles } from 'lucide-react'
import { apiEscolar, type AtividadeEscolar, type Aviso, type TurmaEscolar } from './api'

type Estado = {
  turmas: TurmaEscolar[]
  atividades: AtividadeEscolar[]
  avisos: Aviso[]
  pendentes: number
}
type Props = {
  abrirTurma: () => void
  abrirAtividades: () => void
}

/** Na home só entram dados persistidos no servidor e autorizados para o aluno. */
export default function ResumoTurmaReal({abrirTurma,abrirAtividades}:Props){
  const [dados,setDados]=useState<Estado|null>(null)
  const [erro,setErro]=useState(false)
  useEffect(()=>{
    let ativo=true
    Promise.all([
      apiEscolar.turmas(),apiEscolar.atividades(),apiEscolar.avisos(),
      apiEscolar.minhasRespostas(),
    ]).then(([turmas,atividades,avisos,respostas])=>{
      if(!ativo)return
      const respondidas=new Set(respostas.map(r=>r.atividadeId))
      setDados({turmas,atividades,avisos,
        pendentes:atividades.filter(atividade=>!respondidas.has(atividade.id)).length})
      setErro(false)
    }).catch(()=>{if(ativo)setErro(true)})
    return()=>{ativo=false}
  },[])
  const turma=dados?.turmas[0]
  const comunicado=dados?.avisos.find(a=>a.importante)||dados?.avisos[0]
  return <section className="prime-turma-real" aria-labelledby="prime-turma-titulo">
    <div className="prime-turma-cabecalho">
      <span className="prime-turma-emblema"><School size={24} aria-hidden="true"/></span>
      <div>
        <span className="zelo-kicker">PRIMEIRO, SUA ESCOLA</span>
        <h2 id="prime-turma-titulo">Minha turma</h2>
        <p>Conteúdo publicado pelos professores e pela direção, diretamente do portal escolar.</p>
      </div>
      <button type="button" className="prime-turma-ir" onClick={abrirTurma}>
        Abrir minha turma <ArrowRight size={18} aria-hidden="true"/>
      </button>
    </div>
    {!dados&&!erro&&<p className="prime-turma-estado" role="status">Consultando as informações da sua turma…</p>}
    {erro&&<div className="prime-turma-estado" role="status">
      <p>Não conseguimos consultar sua turma agora. Os dados não foram substituídos por exemplos.</p>
      <button type="button" onClick={abrirTurma}>Abrir portal e tentar novamente <ArrowRight size={16}/></button>
    </div>}
    {dados&&<div className="prime-turma-conteudo" role="status">
      <div className="prime-turma-resumo">
        <span className="prime-turma-etiqueta"><GraduationCap size={17}/>{turma?turma.codigo+' · '+turma.nome:'Aguardando vínculo com uma turma'}</span>
        <strong>{dados.pendentes} {dados.pendentes===1?'atividade pendente':'atividades pendentes'}</strong>
        <p>{turma?'Sua escola já pode reunir avisos, atividades e materiais em um só lugar.':'A direção precisa vincular sua matrícula a uma turma.'}</p>
        <button type="button" onClick={abrirAtividades} disabled={!turma}>
          Ver atividades <ArrowRight size={17}/>
        </button>
      </div>
      <div className="prime-turma-publicacao">
        <span className="prime-turma-etiqueta"><Megaphone size={17}/> ÚLTIMO COMUNICADO</span>
        {comunicado?<><strong>{comunicado.titulo}</strong>
          <p>{comunicado.texto.length>175?comunicado.texto.slice(0,175).trim()+'…':comunicado.texto}</p>
          <small>{comunicado.autorNome} · {new Date(comunicado.criadoEm).toLocaleDateString('pt-BR')}</small></>:
          <><strong>O mural está pronto</strong><p>Assim que o professor ou a direção publicar, você verá a mensagem aqui.</p></>}
      </div>
      <div className="prime-turma-atalhos">
        <span><BookOpen size={18}/> {dados.atividades.length} atividades publicadas</span>
        <span><Sparkles size={18}/> {dados.avisos.length} comunicados recebidos</span>
      </div>
    </div>}
  </section>
}
