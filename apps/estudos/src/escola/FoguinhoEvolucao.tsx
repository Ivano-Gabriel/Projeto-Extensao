import {CalendarDays, Droplets, Flame, Sparkles, Trophy} from 'lucide-react'
import {calendarioFoguinho,resumoFoguinho} from './foguinho'
import './foguinho.css'

const semana=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const formatar=(data:string)=>new Date(data+'T12:00:00').toLocaleDateString('pt-BR',
  {day:'numeric',month:'long',year:'numeric'})

export default function FoguinhoEvolucao({diasEstudo}:{diasEstudo:readonly string[]}){
  const r=resumoFoguinho(diasEstudo)
  const calendario=calendarioFoguinho(diasEstudo)
  const aceso=r.sequencia>0
  return <section className="zelo-streak" aria-label="Seu foguinho e calendário de estudos">
    <header className="zelo-streak-topo">
      <div>
        <span className="zelo-streak-sobretitulo">CONSTÂNCIA NOS ESTUDOS</span>
        <h2>Seu foguinho <Flame size={23} aria-hidden="true"/></h2>
        <p>Estude um pouco a cada dia e acompanhe sua jornada.</p>
      </div>
      <span className="zelo-streak-data"><CalendarDays size={16}/>{new Date().toLocaleDateString('pt-BR')}</span>
    </header>
    <div className="zelo-streak-principal">
      <div className={aceso?'zelo-streak-chama acesa':'zelo-streak-chama apagada'} aria-hidden="true">
        <span className="zelo-streak-halo"/>
        <Flame size={77} strokeWidth={1.7}/>
        {aceso?<Sparkles className="zelo-streak-brilho" size={21}/>:<Droplets className="zelo-streak-gota" size={24}/>}
      </div>
      <div className="zelo-streak-contador">
        <div><strong>{r.sequencia}</strong><span>{r.sequencia===1?'dia seguido':'dias seguidos'}</span></div>
        <p>{aceso?'Continue para alcançar sua próxima conquista.':
          'Recomece hoje: um pequeno estudo já faz diferença.'}</p>
      </div>
    </div>
    <div className="zelo-streak-metas">
      <div className="zelo-streak-meta-legenda">
        <span>Próxima conquista</span><strong>{r.proximaMeta} dias</strong>
      </div>
      <div className="zelo-streak-barra" role="progressbar"
        aria-label="Progresso para a próxima meta de estudos" aria-valuemin={0}
        aria-valuemax={r.proximaMeta} aria-valuenow={r.sequencia}>
        <span style={{width:r.progresso+'%'}}/>
      </div>
    </div>
    <div className="zelo-streak-numeros" aria-label="Resumo de constância">
      <div><Trophy size={18}/><strong>{r.recorde}</strong><span>Recorde</span></div>
      <div><Flame size={18}/><strong>{r.mesAtual}</strong><span>Neste mês</span></div>
      <div><CalendarDays size={18}/><strong>{r.diasTotais}</strong><span>Dias registrados</span></div>
    </div>
    <div className="zelo-streak-calendario">
      <div className="zelo-streak-cal-cabecalho">
        <h3>Últimas cinco semanas</h3>
        <small>{r.ultimaAtividade?'Último estudo: '+formatar(r.ultimaAtividade):'Sem estudo registrado ainda'}</small>
      </div>
      <div className="zelo-streak-grade" aria-label="Dias de estudo registrados">
        {semana.map(d=><span key={d} className="zelo-streak-dia-nome">{d}</span>)}
        {calendario.map(d=><span key={d.data}
          className={'zelo-streak-dia'+(d.estudado?' feito':'')+(d.hoje?' hoje':'')}
          title={formatar(d.data)+(d.estudado?' — estudou':' — sem registro')}
          aria-label={formatar(d.data)+(d.estudado?', estudo registrado':', sem registro')}>
          {d.estudado?<Flame size={16} aria-hidden="true"/>:d.dia}
        </span>)}
      </div>
    </div>
    <p className="zelo-streak-rodape">Este histórico é demonstrativo e fica salvo apenas neste dispositivo;
      não é frequência, nota nem registro oficial da escola.</p>
  </section>
}
