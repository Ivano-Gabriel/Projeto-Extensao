import {ArrowUpRight,Bell,BookOpen,CalendarDays,ClipboardList,Home,Link2,ShieldCheck,Sparkles,Users,UserPlus} from 'lucide-react'
import {acoesPorPerfil} from './navegacao'

type Perfil='PROFESSOR'|'DIRECAO'
type Props={perfil:Perfil;atual:string;mudar:(id:string)=>void}

const iconografia={
  home:Home,
  users:Users,
  book:BookOpen,
  sparkles:Sparkles,
  bell:Bell,
  chart:ClipboardList,
  calendar:CalendarDays,
  user:UserPlus,
  link:Link2,
  shield:ShieldCheck,
}
const resumos:Record<string,string>={
  inicio:'O que precisa de você',
  turmas:'Turmas e alunos',
  atividades:'Criar e acompanhar',
  materiais:'Conteúdos e IA',
  mural:'Publicações da turma',
  resultados:'Aprendizado',
  presenca:'Aulas e chamada',
  pessoas:'Contas da escola',
  vinculos:'Matrículas e docentes',
  auditoria:'Alterações registradas',
  avisos:'Comunicados da escola',
}

export default function NavegacaoPortal({perfil,atual,mudar}:Props){
  const docente=perfil==='PROFESSOR'
  const abas=acoesPorPerfil(perfil)
  const nome=docente?'Navegação do professor':'Navegação da direção'
  return <aside className="portal-ux-navegacao">
    <header className="portal-ux-navegacao-cabecalho">
      <span>{docente?'ÁREA DOCENTE':'GESTÃO ESCOLAR'}</span>
      <strong>{docente?'Seu espaço de ensino':'Sua escola, organizada'}</strong>
      <p>{docente?'Escolha uma tarefa e concentre-se nela.':
        'Turmas, pessoas e vínculos em um só lugar.'}</p>
    </header>
    <nav className="portal-ux-trilhas" role="tablist" aria-label={nome}>
      {abas.map(aba=>{
        const Icone=iconografia[aba.icone as keyof typeof iconografia]||BookOpen
        return <button key={aba.id} type="button" role="tab"
          className={atual===aba.id?'ativa':''} aria-selected={atual===aba.id}
          onClick={()=>mudar(aba.id)}>
          <span className="portal-ux-trilha-icone"><Icone size={19} aria-hidden="true"/></span>
          <span className="portal-ux-trilha-texto">
            <strong>{aba.titulo}</strong>
            <small>{resumos[aba.id]}</small>
          </span>
          <ArrowUpRight size={15} className="portal-ux-trilha-seta" aria-hidden="true"/>
        </button>
      })}
    </nav>
    <p className="portal-ux-navegacao-rodape">
      <ShieldCheck size={16} aria-hidden="true"/> Permissões por escola e vínculo
    </p>
  </aside>
}
