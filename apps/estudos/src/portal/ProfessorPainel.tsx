import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Download, Sparkles, Users } from 'lucide-react'
import { apiEscolar } from './api'
import type { AlunoResumo, AtividadeEscolar, AulaEscolar, Aviso, DesempenhoAluno, QuizGeradoIa, TurmaEscolar } from './api'
import { Abas, Aviso as MensagemStatus, Cartao, Selo, Vazio, falha, type Feedback } from './ComponentesPortal'
import { CriarAviso, Mural } from './Avisos'
import { acoesPorPerfil, opcoesProfessor } from './navegacao'
import SalaDocente from './SalaDocente'
import { baixarRelatorio } from './RelatorioCsv'
import { materiais } from '../dados/materiais'
import { questoes } from '../dados/questoes'

const assuntoDe=(materia:string)=>({
  'Matemática':'MATEMATICA','Português':'PORTUGUES',
  'Física':'FISICA','História':'HISTORIA'
} as Record<string,string>)[materia]

export default function ProfessorPainel({usuarioId}:{usuarioId:number}){
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
  const [editandoAtividade,setEditandoAtividade]=useState<number|null>(null)
  const [titulo,setTitulo]=useState('')
  const [pergunta,setPergunta]=useState('')
  const [opcoes,setOpcoes]=useState(['','','',''])
  const [correta,setCorreta]=useState(0)
  const [explicacao,setExplicacao]=useState('')
  const [prazoEntrega,setPrazoEntrega]=useState('')
  const [exportando,setExportando]=useState(false)
  const [temaCatalogo,setTemaCatalogo]=useState('')
  const [dataAula,setDataAula]=useState(new Date().toLocaleDateString('en-CA'))
  const [ordem,setOrdem]=useState(1)
  const [temaAula,setTemaAula]=useState('')
  const [aulaSelecionada,setAulaSelecionada]=useState(0)
  const [marcadas,setMarcadas]=useState<Record<string,boolean>>({})
  const [carregandoChamada,setCarregandoChamada]=useState(false)
  const [chamadaPronta,setChamadaPronta]=useState(false)
  const [registrandoPresenca,setRegistrandoPresenca]=useState<number|null>(null)
  const [corrigindoPresenca,setCorrigindoPresenca]=useState<string|null>(null)
  const [recargaChamada,setRecargaChamada]=useState(0)
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
  useEffect(()=>{
    let ativo=true
    setMarcadas({})
    setCorrigindoPresenca(null)
    setChamadaPronta(false)
    if(!aulaSelecionada){setCarregandoChamada(false);return}
    setCarregandoChamada(true)
    apiEscolar.presencasAula(aulaSelecionada)
      .then(registros=>{
        if(!ativo)return
        setMarcadas(Object.fromEntries(registros.map(p=>[`${aulaSelecionada}:${p.alunoId}`,p.presente])))
        setChamadaPronta(true)
      })
      .catch(e=>{if(ativo)setMensagem({erro:falha(e)})})
      .finally(()=>{if(ativo)setCarregandoChamada(false)})
    return()=>{ativo=false}
  },[aulaSelecionada,recargaChamada])
  const completarQuestao=()=>{
    const q=questoes.find(q=>q.materialId===temaCatalogo&&assuntoDe(q.materia)===disciplina)
    const m=materiais.find(m=>m.id===temaCatalogo)
    if(!q||!m)return
    setTitulo('Desafio: '+m.titulo);setPergunta(q.pergunta)
    setOpcoes([...q.opcoes]);setCorreta(q.correta);setExplicacao(q.explicacao)
    setMensagem({ok:'Questão do catálogo preenchida. Revise antes de publicar.'})
  }
  const prepararEdicao=async(id:number)=>{
    setMensagem({})
    try{
      const dados=await apiEscolar.dadosEdicaoAtividade(id)
      setTitulo(dados.titulo);setPergunta(dados.pergunta);setOpcoes(dados.opcoes)
      setCorreta(dados.correta);setExplicacao(dados.explicacao);setPrazoEntrega(dados.prazoEntrega||'');setEditandoAtividade(id)
      setDisciplina(dados.disciplina);setAba('atividades')
      setMensagem({ok:'Atividade carregada para edição. Questões com respostas registradas não podem ser alteradas.'})
    }catch(e){setMensagem({erro:falha(e)})}
  }
  const apagarAtividade=async(id:number)=>{
    if(!window.confirm('Excluir esta atividade? Não é permitido apagar questões já respondidas.'))return
    setMensagem({})
    try{
      await apiEscolar.apagarAtividade(id)
      setAtividades(await apiEscolar.atividades())
      setMensagem({ok:'Atividade removida.'})
    }catch(e){setMensagem({erro:falha(e)})}
  }
  const publicar=async(e:FormEvent)=>{
    e.preventDefault()
    if(!turma||!disciplina)return
    setEnviando(true);setMensagem({})
    try{
      const dados={turmaId:turma,disciplina,titulo,pergunta,opcoes,correta,explicacao,prazoEntrega:prazoEntrega||null}
      if(editandoAtividade!==null)await apiEscolar.editarAtividade(editandoAtividade,dados)
      else await apiEscolar.publicar(dados)
      setEditandoAtividade(null)
      setTitulo('');setPergunta('');setOpcoes(['','','','']);setExplicacao('');setPrazoEntrega('');setTemaCatalogo('')
      const a=await apiEscolar.atividades();setAtividades(a)
      setMensagem({ok:'Atividade salva. A edição só é permitida antes de receber respostas.'})
    }catch(e){setMensagem({erro:falha(e)})}
    finally{setEnviando(false)}
  }
  const prepararQuizIa=(quiz:QuizGeradoIa)=>{
    setEditandoAtividade(null)
    setTitulo(quiz.titulo);setPergunta(quiz.pergunta)
    setOpcoes([...quiz.opcoes]);setCorreta(quiz.correta)
    setExplicacao(quiz.explicacao);setPrazoEntrega('');setTemaCatalogo('')
    setAba('atividades')
    setMensagem({ok:'Rascunho da IA carregado. Revise pergunta, alternativas, gabarito e explicação antes de publicar.'})
    window.scrollTo({top:0,behavior:'smooth'})
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
    if(!aulaSelecionada||!chamadaPronta||registrandoPresenca!==null)return
    setMensagem({});setRegistrandoPresenca(alunoId)
    try{await apiEscolar.registrarPresenca(aulaSelecionada,{alunoId,presente})
      setMarcadas(prev=>({...prev,[`${aulaSelecionada}:${alunoId}`]:presente}))
      setMensagem({ok:'Presença registrada.'})}
    catch(e){setMensagem({erro:falha(e)})}
    finally{setRegistrandoPresenca(null)}
  }
  const corrigir=async(alunoId:number)=>{
    const chave=`${aulaSelecionada}:${alunoId}`
    if(!aulaSelecionada||!chamadaPronta||registrandoPresenca!==null||
      !Object.hasOwn(marcadas,chave)||corrigindoPresenca!==chave)return
    setMensagem({});setRegistrandoPresenca(alunoId)
    const presente=!marcadas[chave]
    try{
      await apiEscolar.corrigirPresenca(aulaSelecionada,{alunoId,presente})
      setMarcadas(prev=>({...prev,[chave]:presente}))
      setCorrigindoPresenca(null)
      setMensagem({ok:'Presença corrigida. A alteração ficou registrada no histórico.'})
    }catch(e){setMensagem({erro:falha(e)})}
    finally{setRegistrandoPresenca(null)}
  }
  const selecionada=turmas.find(t=>t.id===turma)
  const atividadesDaTurma=atividades.filter(a=>a.turmaId===turma)
  const avisosDaTurma=avisos.filter(a=>a.turmaId===turma||a.turmaId===null)
  const respondidasDaTurma=desempenho.reduce((total,a)=>total+a.respondidas,0)
  const recarregarFeed=async()=>setAvisos(await apiEscolar.avisos())
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
            onClick={()=>setAba('atividades')}><BookOpen size={18}/> Publicar atividade real</button>
          <button type="button" className="botao-secundario" disabled={!turma||!disciplina}
            onClick={()=>setAba('materiais')}><Sparkles size={18}/> Materiais da turma e IA</button>
          <button type="button" className="botao-secundario" onClick={()=>setAba('mural')}>
            <Bell size={18}/> Avisar turma</button>
        </div>
      </Cartao>
      <Cartao titulo="Feed de turma · publicações recentes">
        <p>Seu perfil docente publica orientações e conteúdos somente nas turmas vinculadas.
          Os alunos veem o mesmo feed na conta deles.</p>
        <Mural avisos={avisosDaTurma.slice(0,4)} usuarioId={usuarioId}
          perfil="PROFESSOR" atualizado={recarregarFeed}/>
        <button type="button" className="botao-secundario" onClick={()=>setAba('mural')}>
          <Bell size={18}/> Escrever no feed da turma
        </button>
      </Cartao>
      <Cartao titulo="Acompanhar aprendizagem">
        <p>Na turma {selecionada?.codigo||'não definida'}, há {atividadesDaTurma.length} atividades
          publicadas e {respondidasDaTurma} respostas registradas em quizzes.</p>
        <div className="portal-acoes-rapidas">
          <button type="button" className="botao-secundario" onClick={()=>setAba('resultados')}>Ver desempenho dos quizzes</button>
          <button type="button" className="botao-secundario" onClick={()=>setAba('presenca')}>Registrar aula provisória</button>
        </div>
      </Cartao>
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
      <div className="ext-aviso-atividade-real" role="note">
        <strong><BookOpen size={20}/> Você está criando uma atividade de verdade</strong>
        <p>Escolha sua disciplina vinculada, escreva a questão, configure o gabarito e publique.
          Ela será salva no banco e ficará visível aos alunos matriculados nesta turma.
          Não é conteúdo do Laboratório (demo).</p>
      </div>
      <Cartao titulo={editandoAtividade===null?'Criar atividade da turma':'Editar atividade'}>
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
          <label htmlFor="ativ-prazo">Prazo de entrega (opcional)</label>
          <input id="ativ-prazo" type="date" value={prazoEntrega}
            onChange={e=>setPrazoEntrega(e.target.value)}/>
          <small>Após a data escolhida, novas respostas serão bloqueadas pelo servidor. Deixe vazio para não definir prazo.</small>
          <label htmlFor="ativ-explicacao">Explicação</label>
          <textarea id="ativ-explicacao" required maxLength={1000} rows={3} value={explicacao}
            onChange={e=>setExplicacao(e.target.value)}/>
          <button type="submit" className="botao-principal" disabled={!disciplina||enviando}>
            <ClipboardList size={18}/>{enviando?'Salvando...':editandoAtividade===null?'Publicar atividade':'Salvar alterações'}</button>
          {editandoAtividade!==null&&<button className="botao-secundario" type="button"
            onClick={()=>{setEditandoAtividade(null);setTitulo('');setPergunta('');setOpcoes(['','','','']);setExplicacao('');setPrazoEntrega('')}}>Cancelar edição</button>}
        </form>
      </Cartao>
      <Cartao titulo="Atividades publicadas no banco">
        {atividadesDaTurma.length?atividadesDaTurma.map(a=><div className="portal-linha" key={a.id}>
          <strong>{a.titulo}</strong><small>{a.disciplina} · {selecionada?.codigo}{a.prazoEntrega?' · Entrega até '+new Date(a.prazoEntrega+'T12:00:00').toLocaleDateString('pt-BR'):''}</small>
          <div className="ext-acoes">
            <button type="button" className="botao-secundario" onClick={()=>void prepararEdicao(a.id)}>Editar</button>
            <button type="button" className="botao-secundario" onClick={()=>void apagarAtividade(a.id)}>Excluir</button>
          </div>
        </div>):<Vazio texto="Nenhuma atividade publicada."/>}
      </Cartao>
    </>}
    {!carregando&&aba==='materiais'&&<SalaDocente turmaId={turma} disciplina={disciplina} disciplinas={disciplinas} aoPrepararQuiz={prepararQuizIa}
      aoPublicarPacote={async()=>setAtividades(await apiEscolar.atividades())}/>}
    {!carregando&&aba==='mural'&&<>
      <Cartao titulo="Postar aviso">
        <CriarAviso key={turma} turmaInicial={turma} turmas={turmas} como="PROFESSOR" enviado={async()=>setAvisos(await apiEscolar.avisos())}/>
      </Cartao>
      <Cartao titulo="Feed de turma">
        <p>Publicações reais com autor e data; você pode editar ou remover apenas suas próprias publicações.</p>
        <Mural avisos={avisosDaTurma} usuarioId={usuarioId} perfil="PROFESSOR" atualizado={recarregarFeed}/>
      </Cartao>
    </>}
    {!carregando&&aba==='resultados'&&<Cartao titulo="Progresso da turma">
      <p>Desempenho em atividades, não notas oficiais.</p>
      <button type="button" className="botao-secundario" disabled={!turma||exportando}
        onClick={()=>{setExportando(true);void baixarRelatorio(turma)
          .catch(e=>setMensagem({erro:falha(e)})).finally(()=>setExportando(false))}}>
        <Download size={18}/>{exportando?'Exportando...':'Exportar desempenho CSV'}
      </button>
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
        <select id="prof-aula-lista" value={aulaSelecionada} onChange={e=>{setAulaSelecionada(Number(e.target.value));setMarcadas({});setChamadaPronta(false)}}>
          {aulas.length===0&&<option value={0}>Nenhuma aula</option>}
          {aulas.map(a=><option key={a.id} value={a.id}>{a.data} · {a.tema} · {a.disciplina}</option>)}
        </select>
        {aulaSelecionada>0&&<>
          <button type="button" className="botao-secundario" disabled={carregandoChamada}
            onClick={()=>setRecargaChamada(v=>v+1)}>Recarregar chamada</button>
          {carregandoChamada&&<p role="status">Consultando presenças registradas...</p>}
          {!carregandoChamada&&!chamadaPronta&&<p role="alert">Não foi possível carregar a chamada. Recarregue antes de marcar.</p>}
        </>}
        {aulaSelecionada>0&&chamadaPronta&&<div className="portal-chamada">{alunos.map(aluno=>{
          const chave=`${aulaSelecionada}:${aluno.id}`
          return <div className="portal-chamada-linha" key={aluno.id}>
            <strong>{aluno.nome}</strong>
            {Object.hasOwn(marcadas,chave)?
              <div className="portal-chamada-botoes">
                <span className="portal-situacao"><CheckCircle2 size={16}/>{marcadas[chave]?'Presente':'Ausente'} anotado</span>
                {corrigindoPresenca===chave?
                  <div className="portal-acoes-rapidas" role="group" aria-label="Revisar correção de chamada">
                    <span>Alterar para {marcadas[chave]?'Ausente':'Presente'}?</span>
                    <button type="button" disabled={registrandoPresenca!==null}
                      onClick={()=>void corrigir(aluno.id)}>Confirmar correção</button>
                    <button type="button" disabled={registrandoPresenca!==null}
                      onClick={()=>setCorrigindoPresenca(null)}>Cancelar correção</button>
                  </div>:
                  <button type="button" disabled={registrandoPresenca!==null}
                    onClick={()=>setCorrigindoPresenca(chave)}>Corrigir registro</button>}
              </div>:
              <div className="portal-chamada-botoes">
                <button type="button" disabled={registrandoPresenca!==null} onClick={()=>void marcar(aluno.id,true)}>Presente</button>
                <button type="button" disabled={registrandoPresenca!==null} onClick={()=>void marcar(aluno.id,false)}>Ausente</button>
              </div>}
          </div>
        })}</div>}
      </Cartao>
    </>}
  </div>
}
