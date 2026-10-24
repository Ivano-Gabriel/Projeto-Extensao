import type { Materia, Material } from '../dados/materiais.ts'
import type { Resposta } from './revisao.ts'

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
}

export function buscarMateriais(
  acervo: readonly Material[], termo: string, materia: 'Todas' | Materia,
): Material[] {
  const busca = normalizar(termo)
  return acervo.filter((item) => {
    const texto = normalizar(`${item.titulo} ${item.materia} ${item.tema} ${item.descricao}`)
    return (!busca || texto.includes(busca)) && (materia === 'Todas' || item.materia === materia)
  })
}

export function resumoEstudos(
  acervo: readonly Material[], revisados: readonly string[], respostas: readonly Resposta[],
) {
  const validos = new Set(acervo.map((item) => item.id))
  const feitos = new Set(revisados.filter((id) => validos.has(id)))
  return {
    materiais: acervo.length,
    revisados: feitos.size,
    percentual: acervo.length ? Math.round((feitos.size / acervo.length) * 100) : 0,
    questoesRespondidas: respostas.length,
  }
}

export function alternarRevisado(revisados: readonly string[], id: string, acervo: readonly Material[]): string[] {
  if (!acervo.some((item) => item.id === id)) return [...revisados]
  return revisados.includes(id) ? revisados.filter((item) => item !== id) : [...revisados, id]
}
