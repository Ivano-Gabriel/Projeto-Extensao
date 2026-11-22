import NavegacaoDireta from './NavegacaoDireta'
import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Flame, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { apiEscolar } from './api'
import type { AtividadeEscolar, Aviso, FrequenciaEscolar, HorarioTurma, MaterialTurma, MeuDesempenho, RespostaSalva, TurmaConfiguracao, TurmaEscolar } from './api'
import { Aviso as MensagemStatus, Cartao, Selo, Vazio, falha, type Feedback } from './ComponentesPortal'
import { Mural } from './Avisos'
import AssistenteEscolar from './AssistenteEscolar'
import ProvaAluno from './ProvaAluno'

export default function AlunoPainel(){
  const [aba,setAba]=useState('inicio')
  const [buscaMaterial,setBuscaMaterial]=useState('')
  const [filtroDisciplina,setFiltroDisciplina]=useState('Todas')
  const [turmas,setTurmas]=useState<TurmaEscolar[]>([])
  const [atividades,setAtividades]=useState<AtividadeEscolar[]>([])
  const [materiais,setMateriais]=useState<MaterialTurma[]>([])
  const [horarios,setHorarios]=useState<HorarioTurma[]>([])
  const [configTurmas,setConfigTurmas]=useState<TurmaConfiguracao[]>([])
  const [avisos,setAvisos]=useState<Aviso[]>([])
  const [respostas,setRespostas]=useState<RespostaSalva[]>([])
  const [desempenho,setDesempenho]=useState<MeuDesempenho|null>(null)
  const [frequencia,setFrequencia]=useState<FrequenciaEscolar|null>(null)
  const [escolhas,setEscolhas]=useState<Record<number,number>>({})
  const [enviando,setEnviando]=useState<number|null>(null)
  const [carregando,setCarregando]=useState(true)
  const [mensagem,setMensagem]=useState<Feedback>({})
  const recarregar=async()=>{
    const [t,a,v,r,d,f]=await Promise.all([
      apiEscolar.turmas(),apiEscolar.atividades(),apiEscolar.avisos(),
      apiEscolar.minhasRespostas(),apiEscolar.meuDesempenho(),apiEscolar.minhaFrequencia(),
    ])
    setTurmas(t);setAtividades(a);setAvisos(v);setRespostas(r);setDesempenho(d);setFrequencia(f)
  }
  useEffect(()=>{
    let ativo=true
    Promise.all([
      apiEscolar.turmas(),apiEscolar.atividades(),apiEscolar.avisos(),
      apiEscolar.minhasRespostas(),apiEscolar.meuDesempenho(),apiEscolar.minhaFrequencia(),
    ]).then(([t,a,v,r,d,f])=>{
      if(!ativo)return
      setTurmas(t);setAtividades(a);setAvisos(v);setRespostas(r);setDesempenho(d);setFrequencia(f)
    }).catch(e=>{if(ativo)setMensagem({erro:falha(e)})})
      .finally(()=>{if(ativo)setCarregando(false)})
    return()=>{ativo=false}
  },[])
  useEffect(()=>{
    if(!turmas.length){setMateriais([]);setHorarios([]);setConfigTurmas([]);return}
    let ativo=true
    Promise.all(turmas.map(t=>Promise.all([
      apiEscolar.configuracaoTurma(t.id),apiEscolar.horariosTurma(t.id),
      apiEscolar.materiaisTurma(t.id),
    ]))).then(resultados=>{
      if(!ativo)return
      setConfigTurmas(resultados.map(r=>r[0]))
      setHorarios(resultados.flatMap(r=>r[1]))
      setMateriais(resultados.flatMap(r=>r[2]))
    }).catch(e=>{if(ativo)setMensagem({erro:falha(e)})})
    return()=>{ativo=false}
  },[turmas])
  const enviar=async(id:number)=>{
    if(escolhas[id]===undefined||enviando!==null)return
    setEnviando(id);setMensagem({})
    try{await apiEscolar.responder(id,escolhas[id]);await recarregar()
      setMensagem({ok:'Resposta registrada. Confira a explicação.'})}
    catch(e){setMensagem({erro:falha(e)})}
    finally{setEnviando(null)}
  }
  const pendentes=atividades.filter(a=>!respostas.some(r=>r.atividadeId===a.id))
  const importante=avisos.find(a=>a.importante)
  const materiasDisponiveis=[...new Set(materiais.map(m=>m.disciplina))].sort()
  const materiaisFiltrados=materiais.filter(m=>
    (filtroDisciplina==='Todas'||m.disciplina===filtroDisciplina)&&
    (m.titulo+' '+m.disciplina+' '+m.conteudo).toLocaleLowerCase('pt-BR')
      .includes(buscaMaterial.trim().toLocaleLowerCase('pt-BR')))
  return <div className="portal-paineis portal-mobile zelo-layout zelo-aluno">
    <NavegacaoDireta perfil="ALUNO" atual={aba} mudar={setAba}/>
    <main className="zelo-area-conteudo">
    <MensagemStatus estado={mensagem}/>
    {carregando&&<p className="portal-vazio">Carregando sua escola...</p>}
    {!carregando&&aba==='inicio'&&<>
      <section className="zelo-aluno-bemvindo">
        <div><span className="zelo-kicker">AGORA É COM VOCÊ</span>
        <h2>Um passo por vez. Você chega lá.</h2>
        <p>Resolva uma atividade, prepare uma prova ou encontre seus materiais.</p></div>
        <div className="zelo-aluno-bemvindo-acoes">
          <button type="button" className="botao-principal" onClick={()=>setAba('atividades')}>
            <BookOpen size={18}/> Atividades
          </button>
          <button type="button" className="botao-secundario" onClick={()=>setAba('prova')}>
            <Sparkles size={18}/> Simulado
          </button>
        </div>
      </section>
      <div className="portal-metricas">
        <Selo valor={turmas.length} legenda="Turmas"/>
        <Selo valor={pendentes.length} legenda="Para fazer"/>
        <Selo valor={desempenho?.acertos||0} legenda="Acertos"/>
      </div>
      {importante&&<Cartao titulo="Aviso importante">
        <div className="mural-card importante"><strong>{importante.titulo}</strong><p>{importante.texto}</p></div>
        <button type="button" className="portal-link" onClick={()=>setAba('avisos')}>Ver avisos <ArrowRight size={17}/></button>
      </Cartao>}
      <Cartao titulo="Sua escola">
        {turmas.length?<div className="portal-etiquetas">{turmas.map(t=><span key={t.id}>{t.codigo} · {t.nome}</span>)}</div>:
          <Vazio texto="Ainda sem turma vinculada. Procure a direção."/>}
        {pendentes.length>0&&<button type="button" className="botao-principal" onClick={()=>setAba('atividades')}>
          <BookOpen size={17}/> Fazer atividade <ArrowRight size={17}/></button>}
      </Cartao>
      <Cartao titulo="Tire uma dúvida">
        <p>Atividades, comunicados e professores da sua turma.</p>
        <button type="button" className="portal-link" onClick={()=>setAba('assistente')}>
          <Sparkles size={18}/> Perguntar ao assistente <ArrowRight size={18}/></button>
      </Cartao>
    </>}
    {!carregando&&aba==='prova'&&<ProvaAluno/>}
    {!carregando&&aba==='atividades'&&<Cartao titulo="Atividades da turma">
      <p className="portal-aviso-discreto">Aqui aparecem apenas atividades publicadas pelos professores vinculados à sua turma. São registradas no banco, não quizzes demonstrativos.</p>
      {atividades.length===0&&<Vazio texto="Nenhuma atividade publicada ainda."/>}
      <div className="portal-atividades">{atividades.map(a=>{
        const salva=respostas.find(r=>r.atividadeId===a.id)
        const prazoEncerrado=!!a.prazoEntrega&&a.prazoEntrega<new Date().toISOString().slice(0,10)
        return <article key={a.id} className="portal-atividade">
          <span className="sobretitulo">{a.disciplina}</span><h3>{a.titulo}</h3>
          {a.prazoEntrega&&<p className="portal-aviso-discreto">{prazoEncerrado?'Prazo encerrado':'Prazo até '+new Date(a.prazoEntrega+'T12:00:00').toLocaleDateString('pt-BR')}</p>}
          <p>{a.pergunta}</p>
          {salva?<div className="portal-resultado" role="status">
            <strong><CheckCircle2 size={17}/> {salva.acertou?'Acertou!':'Revise este conceito'}</strong>
            <p>{salva.explicacao}</p>
            <small>Resposta salva no servidor. Você pode rever esta explicação quando quiser.</small>
          </div>:prazoEncerrado?<p className="portal-feedback falha" role="status">Prazo encerrado. Não é possível enviar uma nova resposta.</p>:<>
            <div className="portal-alternativas" role="group" aria-label={`Respostas de ${a.titulo}`}>
              {a.opcoes.map((alt,i)=><button type="button" key={i}
                className={escolhas[a.id]===i?'selecionada':''} aria-pressed={escolhas[a.id]===i}
                onClick={()=>setEscolhas(prev=>({...prev,[a.id]:i}))}>
                <strong>{String.fromCharCode(65+i)}</strong>{alt}</button>)}
            </div>
            <button type="button" className="botao-principal" disabled={enviando!==null||escolhas[a.id]===undefined}
              onClick={()=>void enviar(a.id)}>{enviando===a.id?'Enviando...':'Responder'} <ArrowRight size={18}/></button>
          </>}
        </article>
      })}</div>
    </Cartao>}
    {!carregando&&aba==='materiais'&&<>
      {configTurmas.map(t=><div key={t.id} className="ext-turma-cabecalho" style={{borderTopColor:t.cor}}>
        <span className="ext-turma-emblema" style={{background:t.cor}}><BookOpen size={22}/></span>
        <div><span className="sobretitulo">MINHA TURMA · {t.anoLetivo}</span><h2>{t.codigo} · {t.nome}</h2>
          <p>{t.descricao||'A direção ainda não cadastrou uma apresentação desta turma.'}</p></div>
      </div>)}
      <section className="zelo-biblioteca-real" aria-label="Biblioteca da sua turma">
        <div className="zelo-biblioteca-topo">
          <span className="zelo-kicker">BIBLIOTECA DA TURMA</span>
          <h2>Seu material. Do seu jeito.</h2>
          <p>Pesquise um assunto e abra só o que deseja ler. Conteúdo publicado pelo professor.</p>
        </div>
        <div className="zelo-biblioteca-filtros">
          <label htmlFor="zelo-material-busca"><Search size={17}/> Buscar material</label>
          <input id="zelo-material-busca" type="search" value={buscaMaterial}
            placeholder="Assunto, título ou palavra-chave"
            onChange={e=>setBuscaMaterial(e.target.value)}/>
          <label htmlFor="zelo-material-disciplina">Disciplina</label>
          <select id="zelo-material-disciplina" value={filtroDisciplina}
            onChange={e=>setFiltroDisciplina(e.target.value)}>
            <option value="Todas">Todas as disciplinas</option>
            {materiasDisponiveis.map(nome=><option key={nome} value={nome}>
              {nome.replaceAll('_',' ')}</option>)}
          </select>
          <span role="status" className="zelo-biblioteca-contagem">{materiaisFiltrados.length}
            {materiaisFiltrados.length===1?' material encontrado':' materiais encontrados'}</span>
        </div>
        {materiaisFiltrados.length===0?<Vazio texto={
          materiais.length===0?'Seus professores ainda não publicaram materiais nesta turma.':
          'Não encontramos esse assunto. Tente outra palavra.'}/>:
          <div className="zelo-lista-materiais">
            {materiaisFiltrados.map((m,index)=><details className="zelo-material-leitor" key={m.id}>
              <summary>
                <span className={'zelo-foto-livro zelo-foto-livro-'+(index%3+1)} aria-hidden="true"/>
                <span className="zelo-material-dados">
                  <small>{m.disciplina.replaceAll('_',' ')}</small>
                  <strong>{m.titulo}</strong>
                  <span>{m.conteudo.length>135?m.conteudo.slice(0,135).trim()+'…':m.conteudo}</span>
                </span>
                <ChevronDown size={20} className="zelo-chevron-material" aria-hidden="true"/>
              </summary>
              <div className="zelo-material-completo">
                <span className="zelo-kicker">HORA DE ESTUDAR</span>
                <h3>{m.titulo}</h3>
                <p>{m.conteudo}</p>
                <span className="zelo-fim-leitura"><CheckCircle2 size={16}/> Material completo</span>
              </div>
            </details>)}
          </div>}
      </section>
      <Cartao titulo="Horários da turma">
        {horarios.length===0?<Vazio texto="A direção ainda não cadastrou os horários."/>:
          <div className="ext-registros">{horarios.map(h=><div key={h.id} className="ext-registro">
            <div><strong>{['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'][h.diaSemana]} · {h.inicio}–{h.fim}</strong>
              <small>{h.disciplina} · {h.professorNome||'Professor a definir'}</small></div>
          </div>)}</div>}
      </Cartao>
    </>}
    {!carregando&&aba==='avisos'&&<Cartao titulo="Mural da escola"><Mural avisos={avisos}/></Cartao>}
    {aba==='assistente'&&<AssistenteEscolar/>}
    {!carregando&&aba==='progresso'&&<>
      <Cartao titulo="Seu aprendizado">
        <div className="portal-metricas">
          <Selo valor={desempenho?.atividades||0} legenda="Atividades"/>
          <Selo valor={desempenho?.respondidas||0} legenda="Feitas"/>
          <Selo valor={desempenho?.acertos||0} legenda="Acertos"/>
        </div>
        <p className="portal-aviso-discreto"><ShieldCheck size={16}/> Acertos em atividades, não notas do boletim.</p>
        {respostas.filter(r=>!r.acertou).length>0&&<button className="portal-link" type="button"
          onClick={()=>setAba('atividades')}><Flame size={18}/> Revisar erros <ArrowRight size={17}/></button>}
      </Cartao>
      <Cartao titulo="Presença de teste">
        <div className="portal-metricas">
          <Selo valor={frequencia?.presencas||0} legenda="Presenças"/>
          <Selo valor={frequencia?.faltas||0} legenda="Ausências"/>
          <Selo valor={frequencia?.registrosDePresenca||0} legenda="Registros"/>
        </div>
        <p className="portal-aviso-discreto">Somente aulas registradas no Extensão. Não é frequência oficial nem indica quantas faltas são permitidas.</p>
      </Cartao>
    </>}
    </main>
  </div>
}
