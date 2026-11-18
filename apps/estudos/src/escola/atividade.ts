import { materiais } from '../dados/materiais.ts'
import { questoes } from '../dados/questoes.ts'

export type RespostaAtividade = {postId:string;questaoId:string;opcao:number}
export type ReferenciaPost = {id:string;materialId?:string}

export function questaoDoMaterial(materialId?:string){
  if(!materialId) return undefined
  return questoes.find(q=>q.materialId===materialId)
}

export function criarRascunhoDeTema(materialId:string){
  const material=materiais.find(m=>m.id===materialId)
  if(!material||!questaoDoMaterial(materialId)) throw new Error('Escolha um tema com atividade disponível.')
  return {
    titulo:`Desafio: ${material.titulo}`,
    texto:`Leia o resumo “${material.titulo}” e responda ao desafio de revisão. A questão e a explicação já estão prontas nesta demonstração.`,
    materia:material.materia,
    materialId:material.id,
  }
}

export function registrarAtividade(
  respostas:readonly RespostaAtividade[], postId:string, questaoId:string, opcao:number,
  posts:readonly ReferenciaPost[]
):RespostaAtividade[] {
  const post=posts.find(p=>p.id===postId)
  const questao=questoes.find(q=>q.id===questaoId)
  if(!post||!questao||questao.materialId!==post.materialId||
    !Number.isInteger(opcao)||opcao<0||opcao>=questao.opcoes.length)
    throw new Error('Resposta ou atividade inválida.')
  if(respostas.some(r=>r.postId===postId)) return [...respostas]
  return [...respostas.slice(-49),{postId,questaoId,opcao}]
}

export function validarAtividades(entrada:unknown,posts:readonly ReferenciaPost[]):RespostaAtividade[]{
  if(!Array.isArray(entrada))return []
  const respostas:RespostaAtividade[]=[]
  for(const item of entrada.slice(0,100)){
    if(!item||typeof item!=='object'||Array.isArray(item))continue
    const {postId,questaoId,opcao}=item as Record<string,unknown>
    if(typeof postId!=='string'||typeof questaoId!=='string'||typeof opcao!=='number')continue
    if(respostas.some(r=>r.postId===postId))continue
    try {
      const proxima=registrarAtividade(respostas,postId,questaoId,opcao,posts)
      if(proxima.length>respostas.length)respostas.push({postId,questaoId,opcao})
    }catch{continue}
  }
  return respostas
}
