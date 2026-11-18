import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, GraduationCap, LockKeyhole, LogOut, School, ShieldCheck, Users, UserRoundCog, Sparkles } from 'lucide-react'
import { apiEscolar } from './api'
import PortalLogin from './PortalLogin'
import { areaDoUsuario } from './perfis'
import type { AtividadeEscolar, EscolaResumo, TurmaEscolar, UsuarioEscolar, UsuarioResumido, ResultadoAtividade } from './api'
import './portal.css'

type Props={voltar:()=>void}
type Feedback={ok?:string;erro?:string}
const disciplinas=['MATEMATICA','PORTUGUES','FISICA','HISTORIA','BIOLOGIA','QUIMICA','GEOGRAFIA','INGLES','SOCIOLOGIA','FILOSOFIA']
const falha=(e:unknown)=>e instanceof Error?e.message:'Não foi possível concluir. Tente novamente.'
const dataAtual=()=>new Date().getFullYear()
function Aviso({estado}:{estado:Feedback}){return <>
  {estado.ok&&<p className="portal-feedback sucesso" role="status"><CheckCircle2 size={17}/>{estado.ok}</p>}
  {estado.erro&&<p className="portal-feedback falha" role="alert">{estado.erro}</p>}
</>}
function Cartao({titulo,children}:{titulo:string;children:ReactNode}){
  return <section className="portal-cartao"><h2>{titulo}</h2>{children}</section>
}
function Aluno(){
  const [turmas,setTurmas]=useState<TurmaEscolar[]>([])
  const [atividades,setAtividades]=useState<AtividadeEscolar[]>([])
  const [respostas,setRespostas]=useState<Record<number,ResultadoAtividade>>({})
  const [escolhas,setEscolhas]=useState<Record<number,number>>({})
  const [carregando,setCarregando]=useState(true)
  const [estado,setEstado]=useState<Feedback>({})
  useEffect(()=>{let vivo=true;Promise.all([apiEscolar.turmas(),apiEscolar.atividades()])
    .then(([t,a])=>{if(vivo){setTurmas(t);setAtividades(a)}})
    .catch(e=>{if(vivo)setEstado({erro:falha(e)})})
    .finally(()=>{if(vivo)setCarregando(false)})
    return()=>{vivo=false}},[])
  const enviar=async(id:number)=>{
    if(escolhas[id]===undefined)return
    setEstado({})
    try{const r=await apiEscolar.responder(id,escolhas[id]);setRespostas(prev=>({...prev,[id]:r}))}
    catch(e){setEstado({erro:falha(e)})}
  }
  return <div className="portal-paineis">
    <Cartao titulo="Minhas turmas">{carregando?<p>Carregando...</p>:turmas.length?
      <div className="portal-etiquetas">{turmas.map(t=><span key={t.id}>{t.codigo} · {t.nome}</span>)}</div>:
      <p>Você ainda não tem turma vinculada. Procure a direção da escola.</p>}</Cartao>
    <Cartao titulo="Atividades da minha turma">
      <Aviso estado={estado}/>
      {!carregando&&atividades.length===0&&<p>As novas atividades aparecerão aqui quando um professor publicar.</p>}
      <div className="portal-atividades">{atividades.map(a=><article key={a.id} className="portal-atividade">
        <span className="sobretitulo">{a.disciplina}</span><h3>{a.titulo}</h3><p>{a.pergunta}</p>
        <div className="portal-alternativas" role="group" aria-label={`Respostas: ${a.titulo}`}>
          {a.opcoes.map((texto,i)=><button type="button" key={i}
            disabled={respostas[a.id]!==undefined}
            aria-pressed={escolhas[a.id]===i} className={escolhas[a.id]===i?'selecionada':''}
            onClick={()=>setEscolhas(prev=>({...prev,[a.id]:i}))}>
            <strong>{String.fromCharCode(65+i)}</strong>{texto}</button>)}
        </div>
        {respostas[a.id]?<div className="portal-resultado" role="status"><strong>{respostas[a.id].acertou?'Resposta correta!':'Vamos aprender com essa questão'}</strong>
          <p>{respostas[a.id].explicacao}</p></div>:
          <button type="button" className="botao-principal" disabled={escolhas[a.id]===undefined}
            onClick={()=>enviar(a.id)}>Enviar resposta <ArrowRight size={17}/></button>}
      </article>)}</div>
    </Cartao>
  </div>
}
function Professor(){
  const [turmas,setTurmas]=useState<TurmaEscolar[]>([])
  const [atividades,setAtividades]=useState<AtividadeEscolar[]>([])
  const [estado,setEstado]=useState<Feedback>({})
  const [turma,setTurma]=useState(''),[disciplina,setDisciplina]=useState('MATEMATICA')
  const [titulo,setTitulo]=useState(''),[pergunta,setPergunta]=useState(''),[explicacao,setExplicacao]=useState('')
  const [opcoes,setOpcoes]=useState(['','','','']),[correta,setCorreta]=useState(0),[enviando,setEnviando]=useState(false)
  const recarregar=async()=>{const [t,a]=await Promise.all([apiEscolar.turmas(),apiEscolar.atividades()])
    setTurmas(t);setAtividades(a);setTurma(prev=>prev||String(t[0]?.id||''))}
  useEffect(()=>{recarregar().catch(e=>setEstado({erro:falha(e)}))},[])
  const publicar=async(e:FormEvent)=>{
    e.preventDefault();setEnviando(true);setEstado({})
    try{await apiEscolar.publicar({turmaId:Number(turma),disciplina,titulo,pergunta,opcoes,correta,explicacao})
      setTitulo('');setPergunta('');setOpcoes(['','','','']);setExplicacao('')
      await recarregar();setEstado({ok:'Atividade publicada para a turma vinculada.'})}
    catch(err){setEstado({erro:falha(err)})}finally{setEnviando(false)}
  }
  return <div className="portal-paineis">
    <Cartao titulo="Publicar atividade">
      <p>Somente professores vinculados à turma e à disciplina podem publicar.</p>
      <form className="portal-form" onSubmit={publicar}>
        <div className="portal-campos">
          <div><label htmlFor="prof-turma">Turma</label><select id="prof-turma" required value={turma} onChange={e=>setTurma(e.target.value)}>
            <option value="">Selecione</option>{turmas.map(t=><option key={t.id} value={t.id}>{t.codigo} · {t.nome}</option>)}</select></div>
          <div><label htmlFor="prof-disciplina">Disciplina</label><select id="prof-disciplina" value={disciplina} onChange={e=>setDisciplina(e.target.value)}>
            {disciplinas.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
        </div>
        <label htmlFor="prof-titulo">Título</label><input id="prof-titulo" value={titulo} onChange={e=>setTitulo(e.target.value)} required maxLength={150} placeholder="Ex.: Porcentagem no cotidiano"/>
        <label htmlFor="prof-pergunta">Pergunta</label><textarea id="prof-pergunta" value={pergunta} onChange={e=>setPergunta(e.target.value)} required maxLength={500} rows={3}/>
        <div className="portal-campos">{opcoes.map((texto,i)=><div key={i}>
          <label htmlFor={`opcao-${i}`}>Alternativa {String.fromCharCode(65+i)}</label>
          <input id={`opcao-${i}`} required maxLength={200} value={texto}
            onChange={e=>setOpcoes(prev=>prev.map((v,n)=>n===i?e.target.value:v))}/>
        </div>)}</div>
        <label htmlFor="prof-correta">Alternativa correta</label><select id="prof-correta" value={correta} onChange={e=>setCorreta(Number(e.target.value))}>
          {[0,1,2,3].map(i=><option key={i} value={i}>{String.fromCharCode(65+i)}</option>)}</select>
        <label htmlFor="prof-explicacao">Explicação para o aluno após responder</label>
        <textarea id="prof-explicacao" value={explicacao} onChange={e=>setExplicacao(e.target.value)} required maxLength={1000} rows={3}/>
        <button type="submit" className="botao-principal" disabled={enviando||!turma}>{enviando?'Publicando...':'Publicar atividade'}</button>
        <Aviso estado={estado}/>
      </form>
    </Cartao>
    <Cartao titulo="Minhas publicações">
      {atividades.length?atividades.map(a=><div className="portal-linha" key={a.id}>
        <strong>{a.titulo}</strong><small>{a.disciplina} · Turma #{a.turmaId}</small></div>):<p>Nenhuma atividade publicada ainda.</p>}
    </Cartao>
  </div>
}
function Direcao(){
  const [turmas,setTurmas]=useState<TurmaEscolar[]>([]),[usuarios,setUsuarios]=useState<UsuarioResumido[]>([])
  const [estado,setEstado]=useState<Feedback>({})
  const [codigo,setCodigo]=useState(''),[nomeTurma,setNomeTurma]=useState('')
  const [ano,setAno]=useState(dataAtual())
  const [nome,setNome]=useState(''),[email,setEmail]=useState(''),[senha,setSenha]=useState('')
  const [papel,setPapel]=useState<'ALUNO'|'PROFESSOR'>('ALUNO')
  const [turma,setTurma]=useState(''),[pessoa,setPessoa]=useState(''),[disciplina,setDisciplina]=useState('MATEMATICA')
  const recarregar=async()=>{const [t,u]=await Promise.all([apiEscolar.turmas(),apiEscolar.usuarios()])
    setTurmas(t);setUsuarios(u);setTurma(prev=>prev||String(t[0]?.id||''))}
  useEffect(()=>{recarregar().catch(e=>setEstado({erro:falha(e)}))},[])
  const executar=async(fn:()=>Promise<unknown>,sucesso:string)=>{
    setEstado({})
    try{await fn();await recarregar();setEstado({ok:sucesso})}
    catch(e){setEstado({erro:falha(e)})}
  }
  return <div className="portal-paineis">
    <Aviso estado={estado}/>
    <Cartao titulo="Turmas da escola">
      <form className="portal-form" onSubmit={e=>{e.preventDefault();void executar(
        ()=>apiEscolar.criarTurma({codigo,nome:nomeTurma,anoLetivo:ano}), 'Turma cadastrada.') }}>
        <div className="portal-campos">
          <div><label htmlFor="dir-codigo">Código</label><input id="dir-codigo" required maxLength={32} value={codigo} onChange={e=>setCodigo(e.target.value)} placeholder="3A"/></div>
          <div><label htmlFor="dir-ano">Ano letivo</label><input id="dir-ano" type="number" min={2020} max={2100} value={ano} onChange={e=>setAno(Number(e.target.value))}/></div>
        </div>
        <label htmlFor="dir-turma">Nome da turma</label><input id="dir-turma" required maxLength={100} value={nomeTurma} onChange={e=>setNomeTurma(e.target.value)} placeholder="3º ano A"/>
        <button type="submit" className="botao-principal">Criar turma</button>
      </form>
      <div className="portal-etiquetas">{turmas.map(t=><span key={t.id}>{t.codigo} · {t.nome} ({t.anoLetivo})</span>)}</div>
    </Cartao>
    <Cartao titulo="Contas de alunos e professores">
      <p>Contas criadas pela direção da escola. Sem cadastro público.</p>
      <form className="portal-form" onSubmit={e=>{e.preventDefault();void executar(async()=>{
        await apiEscolar.criarUsuario({nome,email,senha,papel});setSenha('')},'Conta criada. Vincule à turma abaixo.')}} >
        <label htmlFor="dir-nome">Nome</label><input id="dir-nome" required maxLength={150} value={nome} onChange={e=>setNome(e.target.value)}/>
        <label htmlFor="dir-email">E-mail</label><input id="dir-email" type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/>
        <label htmlFor="dir-senha">Senha inicial</label><input id="dir-senha" type="password" required minLength={12} maxLength={200}
          value={senha} autoComplete="new-password" onChange={e=>setSenha(e.target.value)}/>
        <label htmlFor="dir-papel">Perfil</label><select id="dir-papel" value={papel} onChange={e=>setPapel(e.target.value as 'ALUNO'|'PROFESSOR')}>
          <option value="ALUNO">Aluno</option><option value="PROFESSOR">Professor</option></select>
        <button type="submit" className="botao-principal">Criar conta</button>
      </form>
      <p className="portal-nota">Utilize apenas contas de teste até a escola aprovar privacidade, gestão de senhas e recuperação de acesso.</p>
    </Cartao>
    <Cartao titulo="Vincular pessoas às turmas">
      <div className="portal-form">
        <label htmlFor="vinc-turma">Turma</label><select id="vinc-turma" value={turma} onChange={e=>setTurma(e.target.value)}>
          <option value="">Selecione</option>{turmas.map(t=><option key={t.id} value={t.id}>{t.codigo} · {t.nome}</option>)}</select>
        <label htmlFor="vinc-pessoa">Aluno ou professor</label><select id="vinc-pessoa" value={pessoa} onChange={e=>setPessoa(e.target.value)}>
          <option value="">Selecione</option>{usuarios.filter(u=>u.papel==='ALUNO'||u.papel==='PROFESSOR').map(u=>
            <option key={u.id} value={u.id}>{u.nome} · {u.papel}</option>)}</select>
        <label htmlFor="vinc-disciplina">Disciplina para professor</label><select id="vinc-disciplina" value={disciplina} onChange={e=>setDisciplina(e.target.value)}>
          {disciplinas.map(d=><option key={d} value={d}>{d}</option>)}</select>
        <button type="button" className="botao-principal" disabled={!pessoa||!turma}
          onClick={()=>{const usuario=usuarios.find(u=>String(u.id)===pessoa);if(!usuario)return
            void executar(()=>usuario.papel==='PROFESSOR'
              ?apiEscolar.vincularProfessor(Number(turma),usuario.id,disciplina)
              :apiEscolar.matricular(Number(turma),usuario.id),'Vínculo com a turma criado.')}}>
          Vincular à turma</button>
      </div>
    </Cartao>
  </div>
}
function Administrador(){
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
export default function Portal({voltar}:Props){
  const [usuario,setUsuario]=useState<UsuarioEscolar|null>(null)
  const [carregando,setCarregando]=useState(true)
  const [erro,setErro]=useState(''),[saindo,setSaindo]=useState(false)
  useEffect(()=>{let ativo=true;apiEscolar.me().then(u=>{if(ativo)setUsuario(u)})
    .catch(()=>{}).finally(()=>{if(ativo)setCarregando(false)})
    return()=>{ativo=false}},[])
  const sair=async()=>{
    setErro('');setSaindo(true)
    try{await apiEscolar.logout();setUsuario(null)}
    catch(e){setErro(falha(e))}finally{setSaindo(false)}
  }
  const area=usuario?areaDoUsuario(usuario):null
  const perfil=area==='ADMIN'?'ADMINISTRADOR':area==='DIRECAO'?'DIREÇÃO':area==='PROFESSOR'?'PROFESSOR':'ALUNO'
  return <div className="pagina portal-pagina">
    <button type="button" className="botao-voltar" onClick={voltar}><ArrowLeft size={17}/> Voltar ao Estudos</button>
    <header className="portal-hero">
      <span className="portal-hero-marca"><School size={23}/> EXTENSÃO ESCOLAR</span>
      <h1>{usuario?`Bem-vindo, ${usuario.nome.split(' ')[0]}.`:'Sua escola, seu espaço.'}</h1>
      <p>{usuario?'Acesse somente as turmas, atividades e funções autorizadas para sua conta.':'Entre para consultar turmas ou administrar suas atividades com segurança.'}</p>
      {usuario&&<div className="portal-acesso">
        <span><ShieldCheck size={18}/>{perfil}</span>
        <button type="button" onClick={sair} disabled={saindo}><LogOut size={17}/>{saindo?'Saindo...':'Sair da conta'}</button>
      </div>}
    </header>
    {erro&&<p className="portal-feedback falha" role="alert">{erro}</p>}
    {carregando?<p className="portal-carregando">Verificando sua sessão...</p>:
      !usuario?<PortalLogin entrar={u=>setUsuario(u)}/>:
      area==='ADMIN'?<Administrador/>:
      area==='DIRECAO'?<Direcao/>:
      area==='PROFESSOR'?<Professor/>:<Aluno/>}
    <footer className="portal-rodape"><GraduationCap size={18}/> Portal institucional em implementação. Nunca use contas reais antes da homologação da escola.</footer>
  </div>
}
