import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Sparkles, Users } from 'lucide-react'
import { apiEscolar } from './api'
import type { AlunoResumo, AtividadeEscolar, AulaEscolar, Aviso, DesempenhoAluno, TurmaEscolar } from './api'
import { Abas, Aviso as MensagemStatus, Cartao, Selo, Vazio, falha, type Feedback } from './ComponentesPortal'
import { CriarAviso, Mural } from './Avisos'
import { acoesPorPerfil, opcoesProfessor } from './navegacao'
import { materiais } from '../dados/materiais'
import { questoes } from '../dados/questoes'

const assuntoDe=(materia:string)=>({
  'Matemática':'MATEMATICA','Português':'PORTUGUES',
  'Física':'FISICA','História':'HISTORIA'
} as Record<string,string>)[materia]

export default function ProfessorPainel(){
  const [aba,setAba]=useState('inicio')
  const [turmas,setTurmas]=useState<TurmaEscolar[]>([])
  const [turma,setTurma]=useState(0)
  const [disciplinas,setDisciplinas]=useState<string[]>([])
  const [disciplina,setDisciplina]=useState('')
  const [atividades,setAtividades]=useState<AtividadeEscolar[]>([])
  const [avisos,setAvisos]=useState<Aviso[]>([])
  const [alunos,setAlunos]=useState<AlunoResumo[]>([])
  const [desempenho,setDesempenho]=useState<DesempenhoAluno[]>([])
  const [aulas,setAulas]=useState<AulaEscolar[]>([])
  const [mensagem,setMensagem]=useState<Feedback>({})
  const [carregando,setCarregando]=useState(true)
  const [enviando,setEnviando]=useState(false)
  const [titulo,setTitulo]=useState('')
  const [pergunta,setPergunta]=useState('')
  const [opcoes,setOpcoes]=useState(['','','',''])
  const [correta,setCorreta]=useState(0)
  const [explicacao,setExplicacao]=useState('')
  const [temaCatalogo,setTemaCatalogo]=useState('')
  const [dataAula,setDataAula]=useState(new Date().toLocaleDateString('en-CA'))
  const [ordem,setOrdem]=useState(1)
  const [temaAula,setTemaAula]=useState('')
  const [aulaSelecionada,setAulaSelecionada]=useState(0)
  const [marcadas,setMarcadas]=useState<Record<string,boolean>>({})
  const atualizar=async()=>{
    const [t,a,v]=await Promise.all([apiEscolar.turmas(),apiEscolar.atividades(),apiEscolar.avisos()])
    setTurmas(t);setAtividades(a);setAvisos(v);setTurma(atual=>atual||t[0]?.id||0)
  }
  useEffect(()=>{
    let vivo=true
    Promise.all([apiEscolar.turmas(),apiEscolar.atividades(),apiEscolar.avisos()])
      .then(([t,a,v])=>{if(vivo){setTurmas(t);setAtividades(a);setAvisos(v);setTurma(t[0]?.id||0)}})
      .catch(e=>{if(vivo)setMensagem({erro:falha(e)})})
      .finally(()=>{if(vivo)setCarregando(false)})
    return()=>{vivo=false}
  },[])
  useEffect(()=>{
    if(!turma){setDisciplinas([]);setDisciplina('');setAlunos([]);setDesempenho([]);setAulas([]);return}
    let vivo=true
    Promise.all([
      apiEscolar.disciplinas(turma),apiEscolar.alunos(turma),apiEscolar.desempenhoTurma(turma),apiEscolar.aulas(turma),
    ]).then(([d,a,p,l])=>{
      if(!vivo)return
      const opcoes=opcoesProfessor(d)
      setDisciplinas(opcoes);setDisciplina(opcoes[0]||'')
      setAlunos(a);setDesempenho(p);setAulas(l);setAulaSelecionada(l[0]?.id||0)
    }).catch(e=>{if(vivo)setMensagem({erro:falha(e)})})
    return()=>{vivo=false}
  },[turma])
  const completarQuestao=()=>{
    const q=questoes.find(q=>q.materialId===temaCatalogo&&assuntoDe(q.materia)===disciplina)
    const m=materiais.find(m=>m.id===temaCatalogo)
    if(!q||!m)return
    setTitulo('Desafio: '+m.titulo);setPergunta(q.pergunta)
    setOpcoes([...q.opcoes]);setCorreta(q.correta);setExplicacao(q.explicacao)
    setMensagem({ok:'Questão do catálogo preenchida. Revise antes de publicar.'})
  }
  const publicar=async(e:FormEvent)=>{
    e.preventDefault()
    if(!turma||!disciplina)return
    setEnviando(true);setMensagem({})
    try{
      await apiEscolar.publicar({turmaId:turma,disciplina,titulo,pergunta,opcoes,correta,explicacao})
      setTitulo('');setPergunta('');setOpcoes(['','','','']);setExplicacao('');setTemaCatalogo('')
      const a=await apiEscolar.atividades();setAtividades(a)
      setMensagem({ok:'Atividade publicada na turma.'})
    }catch(e){setMensagem({erro:falha(e)})}
    finally{setEnviando(false)}
  }
  const criarAula=async(e:FormEvent)=>{
    e.preventDefault();setMensagem({})
    try{
      const aula=await apiEscolar.criarAula({turmaId:turma,disciplina,data:dataAula,ordem,tema:temaAula})
      const lista=await apiEscolar.aulas(turma)
      setAulas(lista);setAulaSelecionada(aula.id);setTemaAula('');setMarcadas({})
      setMensagem({ok:'Aula registrada. Marque a presença dos alunos.'})
    }catch(e){setMensagem({erro:falha(e)})}
  }
  const marcar=async(alunoId:number,presente:boolean)=>{
    if(!aulaSelecionada)return
    setMensagem({})
    try{await apiEscolar.registrarPresenca(aulaSelecionada,{alunoId,presente})
      setMarcadas(prev=>({...prev,[`${aulaSelecionada}:${alunoId}`]:presente}))
      setMensagem({ok:'Presença registrada.'})}
    catch(e){setMensagem({erro:falha(e)})}
  }
  const selecionada=turmas.find(t=>t.id===turma)
  const atividadesDaTurma=atividades.filter(a=>a.turmaId===turma)
  const temas=materiais.filter(m=>assuntoDe(m.materia)===disciplina)
  return <div className="portal-paineis portal-mobile">
    <Abas abas={acoesPorPerfil('PROFESSOR')} atual={aba} mudar={setAba}/>
    <MensagemStatus estado={mensagem}/>
    {!carregando&&<div className="portal-turma-barra">
      <label htmlFor="prof-turma-ativa">Turma atual</label>
      <select id="prof-turma-ativa" value={turma} onChange={e=>setTurma(Number(e.target.value))}>
        {turmas.length===0&&<option value={0}>Sem turmas</option>}
        {turmas.map(t=><option key={t.id} value={t.id}>{t.codigo} · {t.nome}</option>)}
      </select>
      {disciplina&&<span className="portal-chip">{disciplina}</span>}
    </div>}
    {carregando&&<Vazio texto="Carregando suas turmas..."/>}
    {!carregando&&aba==='inicio'&&<>
      <div className="portal-metricas">
        <Selo valor={turmas.length} legenda="Turmas"/>
        <Selo valor={alunos.length} legenda="Alunos na turma"/>
        <Selo valor={atividades.length} legenda="Atividades"/>
      </div>
      <Cartao titulo="Sua próxima ação">
        <p>{selecionada?`Você está na turma ${selecionada.codigo}.`:'Você ainda não foi vinculado a uma turma.'}</p>
        <div className="portal-acoes-rapidas">
          <button type="button" className="botao-principal" disabled={!turma||!disciplina}
            onClick={()=>setAba('atividades')}><BookOpen size={18}/> Criar atividade</button>
          <button type="button" className="botao-secundario" onClick={()=>setAba('mural')}>
            <Bell size={18}/> Avisar turma</button>
        </div>
      </Cartao>
      <Cartao titulo="Últimos comunicados"><Mural avisos={avisos.slice(0,3)}/></Cartao>
    </>}
    {!carregando&&aba==='turmas'&&<>
      <Cartao titulo="Minhas turmas">
        {turmas.length?<div className="portal-etiquetas">{turmas.map(t=><span key={t.id}>
          {t.codigo} · {t.nome} ({t.anoLetivo})</span>)}</div>:<Vazio texto="A direção precisa vincular você à turma."/>}
      </Cartao>
      <Cartao titulo="Alunos da turma">
        {alunos.length?<div className="portal-lista-alunos">{alunos.map(a=><div key={a.id}>
          <span className="portal-avatar">{a.nome.charAt(0)}</span><span>{a.nome}</span></div>)}</div>:
          <Vazio texto="Nenhum aluno matriculado nesta turma."/>}
      </Cartao>
    </>}
    {!carregando&&aba==='atividades'&&<>
      <Cartao titulo="Nova atividade">
        <div className="portal-gerador">
          <div className="portal-gerador-marca"><Sparkles size={21}/><strong>Atalho de conteúdo</strong></div>
          <p>Comece com uma questão revisada do catálogo.</p>
          <div className="portal-linha-campos">
            <select aria-label="Tema do catálogo" value={temaCatalogo} onChange={e=>setTemaCatalogo(e.target.value)}>
              <option value="">Selecione um tema</option>
              {temas.map(m=><option key={m.id} value={m.id}>{m.titulo}</option>)}
            </select>
            <button type="button" className="botao-secundario" disabled={!temaCatalogo}
              onClick={completarQuestao}>Preencher</button>
          </div>
          <small>Questões prontas do catálogo, não geradas por IA. Revise antes de publicar.</small>
        </div>
        <form className="portal-form" onSubmit={e=>void publicar(e)}>
          <label htmlFor="prof-disciplina-real">Disciplina vinculada</label>
          <select id="prof-disciplina-real" value={disciplina} onChange={e=>setDisciplina(e.target.value)}
            required disabled={disciplinas.length===0}>
            {disciplinas.length===0&&<option value="">Sem vínculo</option>}
            {disciplinas.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          <label htmlFor="ativ-titulo">Título</label>
          <input id="ativ-titulo" value={titulo} required maxLength={150} placeholder="Ex.: Porcentagem"
            onChange={e=>setTitulo(e.target.value)}/>
          <label htmlFor="ativ-pergunta">Pergunta</label>
          <textarea id="ativ-pergunta" required rows={2} maxLength={500} value={pergunta}
            onChange={e=>setPergunta(e.target.value)}/>
          <div className="portal-campos">{opcoes.map((o,i)=><div key={i}>
            <label htmlFor={`ativ-opcao-${i}`}>Opção {String.fromCharCode(65+i)}</label>
            <input id={`ativ-opcao-${i}`} required maxLength={200} value={o}
              onChange={e=>setOpcoes(prev=>prev.map((v,j)=>j===i?e.target.value:v))}/>
          </div>)}</div>
          <label htmlFor="ativ-correta">Correta</label>
          <select id="ativ-correta" value={correta} onChange={e=>setCorreta(Number(e.target.value))}>
            {[0,1,2,3].map(i=><option key={i} value={i}>{String.fromCharCode(65+i)}</option>)}
          </select>
          <label htmlFor="ativ-explicacao">Explicação</label>
          <textarea id="ativ-explicacao" required maxLength={1000} rows={3} value={explicacao}
            onChange={e=>setExplicacao(e.target.value)}/>
          <button type="submit" className="botao-principal" disabled={!disciplina||enviando}>
            <ClipboardList size={18}/>{enviando?'Publicando...':'Publicar atividade'}</button>
        </form>
      </Cartao>
      <Cartao titulo="Atividades publicadas">
        {atividadesDaTurma.length?atividadesDaTurma.map(a=><div className="portal-linha" key={a.id}>
          <strong>{a.titulo}</strong><small>{a.disciplina} · {selecionada?.codigo}</small>
        </div>):<Vazio texto="Nenhuma atividade publicada."/>}
      </Cartao>
    </>}
    {!carregando&&aba==='mural'&&<>
      <Cartao titulo="Postar aviso">
        <CriarAviso key={turma} turmas={turmas} como="PROFESSOR" enviado={async()=>setAvisos(await apiEscolar.avisos())}/>
      </Cartao>
      <Cartao titulo="Mural"><Mural avisos={avisos}/></Cartao>
    </>}
    {!carregando&&aba==='resultados'&&<Cartao titulo="Progresso da turma">
      <p>Desempenho em atividades, não notas oficiais.</p>
      {desempenho.length===0?<Vazio texto="Ainda sem alunos na turma."/>:
        <div className="portal-tabela"><table>
          <thead><tr><th>Aluno</th><th>Feitas</th><th>Acertos</th></tr></thead>
          <tbody>{desempenho.map(d=><tr key={d.alunoId}>
            <td>{d.alunoNome}</td><td>{d.respondidas}/{d.atividades}</td><td>{d.acertos}</td>
          </tr>)}</tbody>
        </table></div>}
    </Cartao>}
    {!carregando&&aba==='presenca'&&<>
      <Cartao titulo="Registrar aula">
        <form className="portal-form" onSubmit={e=>void criarAula(e)}>
          <div className="portal-campos">
            <div><label htmlFor="aula-data">Data</label>
              <input id="aula-data" type="date" required value={dataAula} onChange={e=>setDataAula(e.target.value)}/></div>
            <div><label htmlFor="aula-ordem">Aula do dia</label>
              <select id="aula-ordem" value={ordem} onChange={e=>setOrdem(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map(x=><option key={x} value={x}>{x}ª aula</option>)}</select></div>
          </div>
          <label htmlFor="aula-tema">Assunto</label><input id="aula-tema" required maxLength={160}
            value={temaAula} onChange={e=>setTemaAula(e.target.value)} placeholder="Ex.: Equação do 2º grau"/>
          <button className="botao-principal" type="submit" disabled={!turma||!disciplina}>
            <CalendarDays size={18}/> Registrar aula</button>
        </form>
      </Cartao>
      <Cartao titulo="Chamada de teste">
        <p>Registro provisório. A frequência oficial depende da escola.</p>
        <label htmlFor="prof-aula-lista">Aula</label>
        <select id="prof-aula-lista" value={aulaSelecionada} onChange={e=>{setAulaSelecionada(Number(e.target.value));setMarcadas({})}}>
          {aulas.length===0&&<option value={0}>Nenhuma aula</option>}
          {aulas.map(a=><option key={a.id} value={a.id}>{a.data} · {a.tema} · {a.disciplina}</option>)}
        </select>
        {aulaSelecionada>0&&<div className="portal-chamada">{alunos.map(aluno=>{
          const chave=`${aulaSelecionada}:${aluno.id}`
          return <div className="portal-chamada-linha" key={aluno.id}>
            <strong>{aluno.nome}</strong>
            {Object.hasOwn(marcadas,chave)?
              <span className="portal-situacao"><CheckCircle2 size={16}/>{marcadas[chave]?'Presente':'Ausente'} anotado</span>:
              <div className="portal-chamada-botoes">
                <button type="button" onClick={()=>void marcar(aluno.id,true)}>Presente</button>
                <button type="button" onClick={()=>void marcar(aluno.id,false)}>Ausente</button>
              </div>}
          </div>
        })}</div>}
      </Cartao>
    </>}
  </div>
}
