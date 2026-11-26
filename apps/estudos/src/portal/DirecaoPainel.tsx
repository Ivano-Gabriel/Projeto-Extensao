import NavegacaoDireta from './NavegacaoDireta'
import GuiaPrimeirosPassos from './GuiaPrimeirosPassos'
import {passosDirecao} from './implantacao'
import type {ModoExperiencia} from './experiencia'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Bell, CalendarDays, Link2, School, Trash2, UserPlus, Users } from 'lucide-react'
import { apiEscolar } from './api'
import type { Aviso, MatriculaResumo, TurmaEscolar, UsuarioResumido, Vinculo } from './api'
import { Aviso as MensagemStatus, Cartao, Selo, Vazio, falha, type Feedback } from './ComponentesPortal'
import { CriarAviso, Mural } from './Avisos'
import GestaoTurma from './GestaoTurma'
import AuditoriaEscola from './AuditoriaEscola'
import { prepararTransferencia, type TransferenciaPendente } from './transferencia'

const disciplinas=['MATEMATICA','PORTUGUES','FISICA','HISTORIA','BIOLOGIA','QUIMICA','GEOGRAFIA','INGLES','SOCIOLOGIA','FILOSOFIA']
export default function DirecaoPainel({usuarioId,aba,mudar,modo}:{usuarioId:number;aba:string;mudar:(id:string)=>void;modo:ModoExperiencia}){
  const setAba=mudar
  const [turmas,setTurmas]=useState<TurmaEscolar[]>([])
  const [matriculas,setMatriculas]=useState<MatriculaResumo[]>([])
  const [alunoMover,setAlunoMover]=useState(0)
  const [destinoMover,setDestinoMover]=useState(0)
  const [transferenciaPendente,setTransferenciaPendente]=useState<TransferenciaPendente|null>(null)
  const [usuarios,setUsuarios]=useState<UsuarioResumido[]>([])
  const [avisos,setAvisos]=useState<Aviso[]>([])
  const [turma,setTurma]=useState(0)
  const [vinculos,setVinculos]=useState<Vinculo[]>([])
  const [mensagem,setMensagem]=useState<Feedback>({})
  const [carregando,setCarregando]=useState(true)
  const [dadosConfiaveis,setDadosConfiaveis]=useState(false)
  const [vinculosConfiaveis,setVinculosConfiaveis]=useState(false)
  const [enviando,setEnviando]=useState(false)
  const [codigo,setCodigo]=useState('')
  const [nomeTurma,setNomeTurma]=useState('')
  const [ano,setAno]=useState(new Date().getFullYear())
  const [nome,setNome]=useState('')
  const [email,setEmail]=useState('')
  const [senha,setSenha]=useState('')
  const [papel,setPapel]=useState<'ALUNO'|'PROFESSOR'>('ALUNO')
  const [pessoa,setPessoa]=useState(0)
  const [disciplina,setDisciplina]=useState('MATEMATICA')
  const [confirmarRemocao,setConfirmarRemocao]=useState<string|null>(null)
  const atualizar=async()=>{
    const [t,u,a,m]=await Promise.all([apiEscolar.turmas(),apiEscolar.usuarios(),apiEscolar.avisos(),apiEscolar.matriculasDaEscola()])
    setTurmas(t);setUsuarios(u);setAvisos(a);setMatriculas(m);setTurma(prev=>prev||t[0]?.id||0)
    setDadosConfiaveis(true)
  }
  useEffect(()=>{
    let ativo=true
    Promise.all([apiEscolar.turmas(),apiEscolar.usuarios(),apiEscolar.avisos(),apiEscolar.matriculasDaEscola()])
      .then(([t,u,a,m])=>{if(ativo){setTurmas(t);setUsuarios(u);setAvisos(a);setMatriculas(m);setTurma(t[0]?.id||0);setDadosConfiaveis(true)}})
      .catch(e=>{if(ativo){setDadosConfiaveis(false);setMensagem({erro:falha(e)})}})
      .finally(()=>{if(ativo)setCarregando(false)})
    return()=>{ativo=false}
  },[])
  useEffect(()=>{
    setVinculos([]);setVinculosConfiaveis(false)
    if(!turma){setVinculosConfiaveis(true);return}
    let ativo=true
    apiEscolar.vinculos(turma).then(v=>{if(ativo){setVinculos(v);setVinculosConfiaveis(true)}})
      .catch(e=>{if(ativo){setVinculosConfiaveis(false);setMensagem({erro:falha(e)})}})
    return()=>{ativo=false}
  },[turma])
  const executar=async(acao:()=>Promise<unknown>,texto:string):Promise<boolean>=>{
    if(enviando)return false
    setEnviando(true);setMensagem({})
    let alteracaoSalva=false
    try{
      await acao()
      alteracaoSalva=true
      await atualizar()
      if(turma)setVinculos(await apiEscolar.vinculos(turma))
      setMensagem({ok:texto})
    }catch(e){
      setMensagem({erro:alteracaoSalva
        ? 'A alteração foi salva, mas a lista não atualizou. Recarregue a página para conferir.'
        : falha(e)})
    }finally{setEnviando(false)}
    return alteracaoSalva
  }
  const criarTurma=async(e:FormEvent)=>{
    e.preventDefault()
    await executar(async()=>{await apiEscolar.criarTurma({codigo,nome:nomeTurma,anoLetivo:ano})
      setCodigo('');setNomeTurma('')},'Turma criada.')
  }
  const criarConta=async(e:FormEvent)=>{
    e.preventDefault()
    await executar(async()=>{await apiEscolar.criarUsuario({nome,email,senha,papel})
      setNome('');setEmail('');setSenha('')},'Conta criada. Agora vincule à turma.')
  }
  const vincular=async()=>{
    const selecionada=usuarios.find(u=>u.id===pessoa)
    if(!selecionada||!turma)return
    await executar(async()=>{
      if(selecionada.papel==='PROFESSOR')
        await apiEscolar.vincularProfessor(turma,pessoa,disciplina)
      else if(selecionada.papel==='ALUNO')
        await apiEscolar.matricular(turma,pessoa)
    },'Pessoa vinculada à turma.')
  }
  const matriculaAtiva=matriculas.find(m=>m.alunoId===alunoMover)
  const opcoesDestino=turmas.filter(t=>t.id!==matriculaAtiva?.turmaId &&
    t.anoLetivo===matriculaAtiva?.anoLetivo)
  const revisarTransferencia=()=>{
    if(enviando)return
    const destino=opcoesDestino.find(t=>t.id===destinoMover)
    const revisao=prepararTransferencia(matriculaAtiva,destino)
    if(!revisao){
      setMensagem({erro:'Selecione uma matrícula e outra turma do mesmo ano letivo.'})
      return
    }
    setMensagem({})
    setTransferenciaPendente(revisao)
  }
  const transferir=async()=>{
    const pendente=transferenciaPendente
    if(!pendente||enviando)return
    const origemAtual=matriculas.find(m=>m.alunoId===pendente.alunoId)
    if(!origemAtual||origemAtual.turmaId!==pendente.origemTurmaId||
      origemAtual.anoLetivo!==pendente.anoLetivo){
      setTransferenciaPendente(null)
      setMensagem({erro:'A matrícula mudou. Atualize a página e confira a turma atual.'})
      return
    }
    setTransferenciaPendente(null)
    const salva=await executar(
      ()=>apiEscolar.transferirAluno(pendente.origemTurmaId,pendente.alunoId,pendente.destinoTurmaId),
      'Aluno transferido para a nova turma. A movimentação foi registrada no banco.',
    )
    if(salva){setDestinoMover(0);setAlunoMover(0)}
  }
  const remover=async(v:Vinculo)=>{
    await executar(()=>apiEscolar.desvincular(turma,v.professorId,v.disciplina),
      'Vínculo de professor removido.')
    setConfirmarRemocao(null)
  }
  const totalProfessores=usuarios.filter(u=>u.papel==='PROFESSOR').length
  const totalAlunos=usuarios.filter(u=>u.papel==='ALUNO').length
  const totalMatriculados=new Set(matriculas.map(m=>m.alunoId)).size
  const alunosSemTurma=Math.max(0,totalAlunos-totalMatriculados)
  const recarregarFeed=async()=>setAvisos(await apiEscolar.avisos())
  const passos=passosDirecao({turmas:turmas.length,professores:totalProfessores,alunos:totalAlunos,
    matriculasNaTurma:matriculas.filter(m=>m.turmaId===turma).length,vinculosNaTurma:vinculos.length,
    avisosPublicados:avisos.filter(a=>a.autorId===usuarioId&&a.autorPapel==='DIRECAO').length})
  return <div className="portal-paineis portal-mobile zelo-layout zelo-direcao">
    <NavegacaoDireta perfil="DIRECAO" atual={aba} mudar={setAba}/>
    <main className={`zelo-area-conteudo ${aba==='inicio'?'zelo-area-inicio':''}`}>
    <MensagemStatus estado={mensagem}/>
    {carregando&&<Vazio texto="Carregando sua escola..."/>}
    {!carregando&&aba==='inicio'&&<>
      {dadosConfiaveis&&(!turma||vinculosConfiaveis)&&
        <GuiaPrimeirosPassos perfil="DIRECAO" etapas={passos} navegar={setAba}/>}
      {dadosConfiaveis&&turma>0&&!vinculosConfiaveis&&
        <p role="status" className="portal-aviso-discreto">Não foi possível confirmar vínculos desta turma. Revise a conexão antes de interpretar o andamento.</p>}
      {modo==='completo'&&<>
      <Cartao titulo="O que fazer agora" classe="zelo-destaque-tarefa">
        <div className="portal-acoes-rapidas">
          <button type="button" className="botao-principal" onClick={()=>setAba('turmas')}>
            <Link2 size={18}/> Organizar turmas <ArrowRight size={17}/></button>
          <button type="button" className="botao-secundario" onClick={()=>setAba('avisos')}>
            <Bell size={18}/> Publicar comunicado</button>
        </div>
      </Cartao>
      <div className="portal-metricas">
        <Selo valor={turmas.length} legenda="Turmas"/>
        <Selo valor={usuarios.filter(u=>u.papel==='PROFESSOR').length} legenda="Professores"/>
        <Selo valor={usuarios.filter(u=>u.papel==='ALUNO').length} legenda="Alunos"/>
      </div>
      <Cartao titulo="Acompanhamento da escola">
        <p>Gestão do zELO+: organizar vínculos, permitir publicações na turma e acompanhar estudos.
          Esta área não substitui diário de classe, boletim ou secretaria escolar.</p>
        <div className="portal-metricas">
          <Selo valor={totalMatriculados} legenda="Alunos matriculados"/>
          <Selo valor={alunosSemTurma} legenda="Aguardando turma"/>
          <Selo valor={avisos.length} legenda="Publicações no feed"/>
        </div>
        {alunosSemTurma>0&&<p className="portal-aviso-discreto">
          Existem {alunosSemTurma} alunos da escola sem matrícula encontrada no portal.</p>}
      </Cartao>

      <Cartao titulo="Publicações recentes da comunidade">
        <Mural avisos={avisos.slice(0,3)} usuarioId={usuarioId} perfil="DIRECAO" atualizado={recarregarFeed}/>
      </Cartao>
      <Cartao titulo="Calendário escolar">
        <p className="portal-aviso-discreto"><CalendarDays size={17}/> Horários e calendário oficial entrarão na próxima etapa.
          Por enquanto, a direção pode informar datas no mural.</p>
      </Cartao>
      </>}
    </>}
    {!carregando&&aba==='turmas'&&<>
      <Cartao titulo="Turmas cadastradas">
        {turmas.length?<div className="portal-lista-turmas">{turmas.map(t=><div key={t.id}>
          <span className="portal-avatar"><School size={19}/></span>
          <div><strong>{t.codigo} · {t.nome}</strong><small>{t.anoLetivo}</small></div>
          <button type="button" className="portal-link" onClick={()=>{setTurma(t.id);setMensagem({ok:'Turma selecionada para personalização.'})}}>Personalizar <ArrowRight size={16}/></button>
        </div>)}</div>:<Vazio texto="Nenhuma turma cadastrada."/>}
      </Cartao>
      <Cartao titulo="Nova turma">
        <form className="portal-form" onSubmit={e=>void criarTurma(e)}>
          <div className="portal-campos">
            <div><label htmlFor="dir-codigo">Código</label>
              <input id="dir-codigo" value={codigo} maxLength={32} required pattern="[a-zA-Z0-9-]{1,32}"
                placeholder="3A" onChange={e=>setCodigo(e.target.value)}/></div>
            <div><label htmlFor="dir-ano">Ano</label>
              <input id="dir-ano" type="number" min={2020} max={2100} value={ano}
                onChange={e=>setAno(Number(e.target.value))}/></div>
          </div>
          <label htmlFor="dir-turma">Nome</label>
          <input id="dir-turma" required maxLength={100} value={nomeTurma}
            placeholder="3º ano A" onChange={e=>setNomeTurma(e.target.value)}/>
          <button className="botao-principal" type="submit" disabled={enviando}>
            <Users size={18}/> Criar turma</button>
        </form>
      </Cartao>
      {turma>0&&<GestaoTurma key={turma} turmaId={turma} aoSalvar={atualizar}/>}
    </>}
    {!carregando&&aba==='pessoas'&&<>
      <Cartao titulo="Criar conta">
        <form className="portal-form" onSubmit={e=>void criarConta(e)}>
          <label htmlFor="dir-nome">Nome</label><input id="dir-nome" required maxLength={150}
            value={nome} onChange={e=>setNome(e.target.value)}/>
          <label htmlFor="dir-email">E-mail</label><input id="dir-email" required type="email" maxLength={254}
            value={email} onChange={e=>setEmail(e.target.value)}/>
          <label htmlFor="dir-senha">Senha inicial</label><input id="dir-senha" required type="password"
            minLength={12} maxLength={200} autoComplete="new-password" value={senha}
            onChange={e=>setSenha(e.target.value)}/>
          <label htmlFor="dir-papel">Perfil</label><select id="dir-papel" value={papel}
            onChange={e=>setPapel(e.target.value as 'ALUNO'|'PROFESSOR')}>
            <option value="ALUNO">Aluno</option><option value="PROFESSOR">Professor</option>
          </select>
          <button type="submit" className="botao-principal" disabled={enviando}>
            <UserPlus size={18}/> Criar conta</button>
        </form>
        <p className="portal-aviso-discreto">Somente contas fictícias neste ambiente. Falta implementar convites e recuperação de senha.</p>
      </Cartao>
      <Cartao titulo="Pessoas da escola">
        {usuarios.length?<div className="portal-lista-alunos">{usuarios.map(u=><div key={u.id}>
          <span className="portal-avatar">{u.nome.charAt(0)}</span>
          <span>{u.nome}<small>{u.papel==='PROFESSOR'?'Professor':u.papel==='ALUNO'?'Aluno':'Direção'}</small></span>
        </div>)}</div>:<Vazio texto="Nenhuma conta cadastrada."/>}
      </Cartao>
    </>}
    {!carregando&&aba==='vinculos'&&<>
      <Cartao titulo="Professores e alunos">
        <div className="portal-form">
          <label htmlFor="vinc-turma">Turma</label>
          <select id="vinc-turma" value={turma} onChange={e=>{setTurma(Number(e.target.value));setConfirmarRemocao(null)}}>
            {turmas.length===0&&<option value={0}>Sem turmas</option>}
            {turmas.map(t=><option key={t.id} value={t.id}>{t.codigo} · {t.nome}</option>)}
          </select>
          <label htmlFor="vinc-pessoa">Pessoa</label>
          <select id="vinc-pessoa" value={pessoa} onChange={e=>setPessoa(Number(e.target.value))}>
            <option value={0}>Selecione</option>
            {usuarios.filter(u=>u.papel==='ALUNO'||u.papel==='PROFESSOR').map(u=>
              <option key={u.id} value={u.id}>{u.nome} · {u.papel}</option>)}
          </select>
          {usuarios.find(u=>u.id===pessoa)?.papel==='PROFESSOR'&&<>
            <label htmlFor="vinc-disciplina">Disciplina</label>
            <select id="vinc-disciplina" value={disciplina} onChange={e=>setDisciplina(e.target.value)}>
              {disciplinas.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </>}
          <button type="button" className="botao-principal" disabled={!turma||!pessoa||enviando}
            onClick={()=>void vincular()}><Link2 size={18}/> Vincular à turma</button>
        </div>
      </Cartao>
      <Cartao titulo="Realocar aluno de turma">
        <p className="portal-aviso-discreto">Mudança real no banco: apenas entre turmas do mesmo ano letivo e da mesma escola. O histórico de respostas permanece preservado.</p>
        {matriculas.length===0?<Vazio texto="Não há alunos matriculados para transferir."/>:
          <div className="portal-form">
            <label htmlFor="dir-aluno-mover">Aluno matriculado</label>
            <select id="dir-aluno-mover" value={alunoMover}
              onChange={e=>{setAlunoMover(Number(e.target.value));setDestinoMover(0);setTransferenciaPendente(null)}}>
              <option value={0}>Selecione um aluno</option>
              {matriculas.map(m=><option key={m.alunoId+':'+m.anoLetivo} value={m.alunoId}>
                {m.alunoNome} · {m.turmaCodigo} ({m.anoLetivo})</option>)}
            </select>
            {matriculaAtiva&&<>
              <div className="ext-matricula-atual">
                <strong>Turma atual: {matriculaAtiva.turmaCodigo}</strong>
                <span>{matriculaAtiva.turmaNome} · {matriculaAtiva.anoLetivo}</span>
              </div>
              <label htmlFor="dir-destino-mover">Nova turma</label>
              <select id="dir-destino-mover" value={destinoMover}
                onChange={e=>{setDestinoMover(Number(e.target.value));setTransferenciaPendente(null)}}>
                <option value={0}>Escolha outra turma do mesmo ano</option>
                {opcoesDestino.map(t=><option key={t.id} value={t.id}>{t.codigo} · {t.nome}</option>)}
              </select>
              <button type="button" className="botao-principal" disabled={!destinoMover||enviando}
                onClick={revisarTransferencia}><Users size={18}/> Revisar transferência</button>
              {transferenciaPendente&&<div className="portal-aviso-discreto" role="group"
                aria-label="Confirmar movimentação">
                <p>Transferir <strong>{transferenciaPendente.alunoNome}</strong> de
                  {' '}{transferenciaPendente.origemCodigo} para {transferenciaPendente.destinoCodigo}
                  {' '}({transferenciaPendente.anoLetivo})? As respostas anteriores permanecem
                  registradas, mas o aluno deixa de acessar as atividades da turma anterior.</p>
                <div className="portal-acoes-rapidas">
                  <button type="button" className="botao-principal" disabled={enviando}
                    onClick={()=>void transferir()}>Confirmar movimentação</button>
                  <button type="button" className="botao-secundario" disabled={enviando}
                    onClick={()=>setTransferenciaPendente(null)}>Cancelar transferência</button>
                </div>
              </div>}
            </>}
          </div>}
        <div className="ext-matriculas-grid">
          {matriculas.slice(0,30).map(m=><div key={m.alunoId+':'+m.anoLetivo}>
            <strong>{m.alunoNome}</strong><span>{m.turmaCodigo} · {m.anoLetivo}</span>
          </div>)}
        </div>
      </Cartao>
      <Cartao titulo="Vínculos docentes">
        {vinculos.length?vinculos.map(v=><div className="portal-vinculo" key={v.professorId+v.disciplina}>
          <div><strong>{v.nome}</strong><small>{v.disciplina}</small></div>
          {confirmarRemocao===`${v.professorId}:${v.disciplina}`?
            <div className="portal-acoes-rapidas">
              <button type="button" className="botao-perigo" onClick={()=>void remover(v)}>Confirmar</button>
              <button type="button" className="botao-secundario" onClick={()=>setConfirmarRemocao(null)}>Cancelar</button>
            </div>:
            <button type="button" className="portal-icone-botao" aria-label={`Desvincular ${v.nome} de ${v.disciplina}`}
              onClick={()=>setConfirmarRemocao(`${v.professorId}:${v.disciplina}`)}><Trash2 size={17}/></button>}
        </div>):<Vazio texto="Nenhum professor vinculado a esta turma."/>}
        <p className="portal-aviso-discreto">Vínculos repetidos não são duplicados. Use Remover para corrigir uma atribuição.</p>
      </Cartao>
    </>}
    {!carregando&&aba==='auditoria'&&<AuditoriaEscola/>}
    {!carregando&&aba==='avisos'&&<>
      <Cartao titulo="Novo comunicado">
        <CriarAviso turmas={turmas} como="DIRECAO" enviado={async()=>setAvisos(await apiEscolar.avisos())}/>
      </Cartao>
      <Cartao titulo="Feed da escola · moderação">
        <p>A direção pode remover publicações inadequadas apenas na própria escola.
          A ação fica registrada no histórico administrativo.</p>
        <Mural avisos={avisos} usuarioId={usuarioId} perfil="DIRECAO" atualizado={recarregarFeed}/>
      </Cartao>
    </>}
    </main>
  </div>
}
