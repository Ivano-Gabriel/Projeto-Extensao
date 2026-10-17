import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Copy, RotateCcw } from 'lucide-react'
import { formatarQuando, ordenar, type Banco } from './backend/banco'
import { botoes } from './backend/botoes'
import { esquemaSql } from './backend/esquema'
import type { Compromisso, NovoCompromisso, TipoCompromisso } from './backend/tipos'
import './funcoes.css'

type Aba = 'dados' | 'botoes' | 'sql'
type Formulario = { tipo: TipoCompromisso; titulo: string; disciplina: string; quando: string }

const vazio: Formulario = { tipo: 'Prova', titulo: '', disciplina: '', quando: '' }

/** ISO (UTC) → valor do <input type="datetime-local">, no fuso do usuário. */
function paraCampo(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function Backend({ banco, onVoltar }: { banco: Banco; onVoltar: () => void }) {
  const [aba, setAba] = useState<Aba>('dados')
  const [form, setForm] = useState<Formulario>(vazio)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)

  const total = banco.itens.length
  const pendentes = banco.itens.filter((i) => i.status === 'pendente').length

  function salvar(e: FormEvent) {
    e.preventDefault()
    const quando = new Date(form.quando)
    if (!form.titulo.trim() || !form.disciplina.trim() || Number.isNaN(quando.getTime())) {
      setErro('Preencha título, disciplina e uma data válida.')
      return
    }
    const dados: NovoCompromisso = {
      tipo: form.tipo,
      titulo: form.titulo.trim(),
      disciplina: form.disciplina.trim(),
      quando: quando.toISOString(),
    }
    if (editandoId === null) banco.criar(dados)
    else banco.atualizar(editandoId, dados)
    cancelar()
  }

  function editar(item: Compromisso) {
    setEditandoId(item.id)
    setForm({ tipo: item.tipo, titulo: item.titulo, disciplina: item.disciplina, quando: paraCampo(item.quando) })
    setErro('')
  }

  function cancelar() {
    setEditandoId(null)
    setForm(vazio)
    setErro('')
  }

  function excluir(item: Compromisso) {
    if (!window.confirm(`Excluir "${item.titulo}"?`)) return
    banco.excluir(item.id)
    if (editandoId === item.id) cancelar()
  }

  function restaurar() {
    if (!window.confirm('Apagar todos os dados e voltar aos exemplos?')) return
    banco.restaurarExemplo()
    cancelar()
  }

  async function copiarSql() {
    try {
      await navigator.clipboard.writeText(esquemaSql)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <main className="backend-page">
      <header className="backend-head">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Painel do backend</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onVoltar}>
          <ArrowLeft size={16} /> Voltar ao app
        </button>
      </header>

      <div className="stat-row">
        <span className="stat">{total} registros</span>
        <span className="stat">{pendentes} pendentes</span>
        <span className="stat">{total - pendentes} concluídos</span>
      </div>

      <div className="tabs" role="tablist">
        {([['dados', 'Dados'], ['botoes', 'Botões'], ['sql', 'Esquema SQL']] as const).map(([id, nome]) => (
          <button key={id} role="tab" aria-selected={aba === id} className={`tab ${aba === id ? 'active' : ''}`} type="button" onClick={() => setAba(id)}>
            {nome}
          </button>
        ))}
      </div>

      {aba === 'dados' && (
        <>
          <form className="backend-form" onSubmit={salvar}>
            <label>
              Tipo
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCompromisso })}>
                <option>Prova</option>
                <option>Trabalho</option>
                <option>Aviso</option>
              </select>
            </label>
            <label>
              Título
              <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </label>
            <label>
              Disciplina
              <input value={form.disciplina} onChange={(e) => setForm({ ...form, disciplina: e.target.value })} />
            </label>
            <label>
              Data e hora
              <input type="datetime-local" value={form.quando} onChange={(e) => setForm({ ...form, quando: e.target.value })} />
            </label>
            <div className="form-actions">
              <button className="primary-button compact" type="submit">
                {editandoId === null ? 'Adicionar' : 'Salvar'}
              </button>
              {editandoId !== null && (
                <button className="secondary-button" type="button" onClick={cancelar}>
                  Cancelar
                </button>
              )}
            </div>
            {erro && <p className="form-error">{erro}</p>}
          </form>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Tipo</th><th>Título</th><th>Disciplina</th><th>Quando</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {ordenar(banco.itens).map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.tipo}</td>
                    <td>{item.titulo}</td>
                    <td>{item.disciplina}</td>
                    <td>{formatarQuando(item.quando)}</td>
                    <td><span className={`badge ${item.status === 'concluido' ? 'ok' : ''}`}>{item.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => editar(item)}>Editar</button>
                        <button type="button" onClick={() => banco.alternarConcluido(item.id)}>
                          {item.status === 'concluido' ? 'Reabrir' : 'Concluir'}
                        </button>
                        <button type="button" onClick={() => excluir(item)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr><td colSpan={7} className="empty-note">Nenhum registro. Adicione um acima.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 16 }}>
            <button className="secondary-button" type="button" onClick={restaurar}>
              <RotateCcw size={15} /> Restaurar dados de exemplo
            </button>
          </p>
        </>
      )}

      {aba === 'botoes' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Tela</th><th>Botão</th><th>O que faz</th><th>Chamada de API</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {botoes.map((b) => (
                <tr key={`${b.tela}-${b.botao}`}>
                  <td>{b.tela}</td>
                  <td><strong>{b.botao}</strong></td>
                  <td>{b.funcao}</td>
                  <td><code className="api">{b.api}</code></td>
                  <td><span className={`badge ${b.estado === 'ativo' ? 'ok' : 'plan'}`}>{b.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'sql' && (
        <>
          <p style={{ margin: '0 0 12px' }}>
            <button className="secondary-button" type="button" onClick={copiarSql}>
              <Copy size={15} /> {copiado ? 'Copiado!' : 'Copiar SQL'}
            </button>
          </p>
          <pre className="sql-box"><code>{esquemaSql}</code></pre>
        </>
      )}
    </main>
  )
}
