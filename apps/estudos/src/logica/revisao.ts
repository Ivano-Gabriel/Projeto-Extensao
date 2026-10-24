import type { Questao } from '../dados/questoes.ts'

export type Resposta = { questaoId: string; opcao: number }

export function responderQuestao(
  respostas: readonly Resposta[], questao: Questao, opcao: number,
): Resposta[] {
  if (!Number.isInteger(opcao) || opcao < 0 || opcao >= questao.opcoes.length
      || respostas.some((resposta) => resposta.questaoId === questao.id)) {
    return [...respostas]
  }
  return [...respostas, { questaoId: questao.id, opcao }]
}

export function resumirRespostas(questoes: readonly Questao[], respostas: readonly Resposta[]) {
  const mapa = new Map(respostas.map((item) => [item.questaoId, item.opcao]))
  const respondidas = questoes.filter((questao) => mapa.has(questao.id)).length
  const acertos = questoes.filter((questao) => mapa.get(questao.id) === questao.correta).length
  return {
    total: questoes.length,
    respondidas,
    acertos,
    percentual: respondidas ? Math.round((acertos / respondidas) * 100) : 0,
    concluido: questoes.length > 0 && respondidas === questoes.length,
  }
}
