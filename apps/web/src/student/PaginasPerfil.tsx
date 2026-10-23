import { useState } from 'react'
import { ArrowLeft, BookOpen, ChevronRight, CircleHelp, GraduationCap, Settings2 } from 'lucide-react'
import { calcularMedia, classificarMedia, disciplinasDemo, formatarNota, resumirBoletim } from '../academic/boletim'
import { preferenciasPadrao, type Preferencias } from '../preferences/preferencias'
import './paginas-perfil.css'

export type SubpaginaPerfil = 'boletim' | 'preferencias' | 'ajuda'

export function MenuPerfil({ onAbrir }: { onAbrir: (destino: SubpaginaPerfil) => void }) {
  const itens = [
    { id: 'boletim', nome: 'Meu boletim', descricao: 'Notas e faltas do ano', Icone: GraduationCap },
    { id: 'preferencias', nome: 'Preferências', descricao: 'Personalize sua experiência', Icone: Settings2 },
    { id: 'ajuda', nome: 'Central de ajuda', descricao: 'Dúvidas sobre o aplicativo', Icone: CircleHelp },
  ] as const
  return <section className="bloco-conteudo perfil-servicos" aria-labelledby="perfil-servicos-titulo">
    <div className="titulo-secao"><h2 id="perfil-servicos-titulo">Mais opções</h2></div>
    {itens.map(({ id, nome, descricao, Icone }) =>
      <button key={id} type="button" className="perfil-link" onClick={() => onAbrir(id)}>
        <span className="perfil-link-icone"><Icone size={21} /></span>
        <span className="perfil-link-texto"><strong>{nome}</strong><small>{descricao}</small></span>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    )}
  </section>
}

function CabecalhoPagina({ titulo, subtitulo, onVoltar }: { titulo: string; subtitulo: string; onVoltar: () => void }) {
  return <header className="subpagina-cabecalho">
    <button className="subpagina-voltar" type="button" onClick={onVoltar}><ArrowLeft size={19} /> Voltar ao perfil</button>
    <span className="subpagina-etiqueta">{subtitulo}</span>
    <h2>{titulo}</h2>
  </header>
}

export function Boletim({ onVoltar }: { onVoltar: () => void }) {
  const resumo = resumirBoletim(disciplinasDemo)
  return <div className="pagina subpagina">
    <CabecalhoPagina titulo="Meu boletim" subtitulo="VIDA ESCOLAR" onVoltar={onVoltar} />
    <p className="demo-aviso"><BookOpen size={18} /> Exemplo com notas fictícias. O boletim da escola ainda não está conectado.</p>
    <section className="boletim-resumo" aria-label="Resumo do boletim">
      <div><span>Média das matérias</span><strong>{formatarNota(resumo.mediaGeral)}</strong></div>
      <div><span>Precisam de atenção</span><strong>{resumo.emAtencao}</strong></div>
      <div><span>Faltas no exemplo</span><strong>{resumo.totalFaltas}</strong></div>
    </section>
    <section className="bloco-conteudo" aria-labelledby="notas-titulo">
      <div className="titulo-secao"><h3 id="notas-titulo">Notas por matéria</h3></div>
      <div className="boletim-rolagem" role="region" aria-label="Tabela de notas" tabIndex={0}>
        <table className="boletim-tabela">
          <thead><tr><th scope="col">Matéria</th><th scope="col">1º</th><th scope="col">2º</th><th scope="col">3º</th><th scope="col">4º</th><th scope="col">Média</th><th scope="col">Faltas</th><th scope="col">Situação</th></tr></thead>
          <tbody>{disciplinasDemo.map((disciplina) => {
            const media = calcularMedia(disciplina.notas)
            const situacao = classificarMedia(media)
            return <tr key={disciplina.nome}>
              <th scope="row">{disciplina.nome}</th>
              {disciplina.notas.map((nota, indice) => <td key={indice}>{formatarNota(nota)}</td>)}
              <td><strong>{formatarNota(media)}</strong></td>
              <td>{disciplina.faltas}</td>
              <td><span className={`boletim-situacao boletim-${situacao.classe}`}>{situacao.rotulo}</span></td>
            </tr>
          })}</tbody>
        </table>
      </div>
      <p className="subpagina-nota">Usamos 7,0 como referência ilustrativa. As regras de aprovação da sua escola podem ser diferentes.</p>
    </section>
  </div>
}

function Alternador({ nome, descricao, ativo, onMudar }: { nome: string; descricao: string; ativo: boolean; onMudar: () => void }) {
  return <div className="preferencia-linha">
    <span><strong>{nome}</strong><small>{descricao}</small></span>
    <button className="preferencia-alternador" type="button" role="switch" aria-label={nome} aria-checked={ativo} onClick={onMudar}><span /></button>
  </div>
}

export function PreferenciasPagina({ preferencias, onAlterar, onVoltar }: { preferencias: Preferencias; onAlterar: (valor: Preferencias) => void; onVoltar: () => void }) {
  const atualizar = (chave: keyof Preferencias, valor: boolean | Preferencias['tamanhoTexto']) =>
    onAlterar({ ...preferencias, [chave]: valor })
  return <div className="pagina subpagina">
    <CabecalhoPagina titulo="Preferências" subtitulo="DO SEU JEITO" onVoltar={onVoltar} />
    <p className="demo-aviso">As preferências ficam salvas neste navegador. Lembretes automáticos ainda não estão disponíveis.</p>
    <section className="bloco-conteudo" aria-label="Preferências de avisos">
      <h3>Lembretes (em preparação)</h3>
      <Alternador nome="Provas" descricao="Guardar minha escolha para futuros lembretes." ativo={preferencias.notificarProvas} onMudar={() => atualizar('notificarProvas', !preferencias.notificarProvas)} />
      <Alternador nome="Trabalhos" descricao="Guardar minha escolha para futuros lembretes." ativo={preferencias.notificarTrabalhos} onMudar={() => atualizar('notificarTrabalhos', !preferencias.notificarTrabalhos)} />
      <Alternador nome="Avisos da escola" descricao="Guardar minha escolha para futuros lembretes." ativo={preferencias.notificarAvisos} onMudar={() => atualizar('notificarAvisos', !preferencias.notificarAvisos)} />
    </section>
    <section className="bloco-conteudo" aria-label="Aparência do aplicativo">
      <h3>Leitura e aparência</h3>
      <fieldset className="preferencia-tamanho">
        <legend>Tamanho do texto</legend>
        <label><input type="radio" name="tamanho-texto" checked={preferencias.tamanhoTexto === 'normal'} onChange={() => atualizar('tamanhoTexto', 'normal')} /> Normal</label>
        <label><input type="radio" name="tamanho-texto" checked={preferencias.tamanhoTexto === 'grande'} onChange={() => atualizar('tamanhoTexto', 'grande')} /> Maior</label>
      </fieldset>
      <Alternador nome="Reduzir animações" descricao="Evita movimentos desnecessários nas páginas." ativo={preferencias.reduzirAnimacoes} onMudar={() => atualizar('reduzirAnimacoes', !preferencias.reduzirAnimacoes)} />
      <button type="button" className="subpagina-voltar" onClick={() => onAlterar({ ...preferenciasPadrao })}>Restaurar preferências</button>
    </section>
  </div>
}

const perguntas = [
  { pergunta: 'Já posso ver minhas notas reais?', resposta: 'Ainda não. O boletim mostra dados de exemplo. Quando o backend estiver integrado, a gente conecta as notas reais com as permissões certas.' },
  { pergunta: 'Como vejo provas e trabalhos?', resposta: 'Toque em Agenda na barra de navegação. Por enquanto, as atividades são demonstrativas.' },
  { pergunta: 'As preferências ficam salvas?', resposta: 'Sim, neste navegador. Elas não são sincronizadas entre aparelhos por enquanto.' },
  { pergunta: 'Como volto para a página inicial?', resposta: 'Use a opção Início na barra de navegação inferior ou no menu lateral.' },
]
export function Ajuda({ onVoltar }: { onVoltar: () => void }) {
  const [busca, setBusca] = useState('')
  const encontradas = perguntas.filter((item) => (item.pergunta + ' ' + item.resposta).toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')))
  return <div className="pagina subpagina">
    <CabecalhoPagina titulo="Central de ajuda" subtitulo="PODE PERGUNTAR" onVoltar={onVoltar} />
    <section className="bloco-conteudo" aria-labelledby="duvidas-titulo">
      <h3 id="duvidas-titulo">Dúvidas frequentes</h3>
      <label className="ajuda-busca" htmlFor="ajuda-pesquisa">Buscar uma dúvida</label>
      <input className="ajuda-input" id="ajuda-pesquisa" type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Ex.: boletim, agenda..." />
      {encontradas.length ? encontradas.map((item) => <details key={item.pergunta} className="ajuda-pergunta">
        <summary>{item.pergunta}</summary><p>{item.resposta}</p>
      </details>) : <p role="status" className="subpagina-nota">Não encontramos essa dúvida. Tenta buscar por outra palavra.</p>}
    </section>
    <p className="demo-aviso">Precisa falar com a equipe? O canal de suporte ainda não foi configurado.</p>
  </div>
}
