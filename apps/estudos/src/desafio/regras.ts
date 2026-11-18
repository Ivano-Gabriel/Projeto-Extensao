import { questoes } from '../dados/questoes.ts'

export type RespostaDiaria = {data:string;questaoId:string;opcao:number}
const MAX_DIAS = 30

function dataValida(data:unknown):data is string {
  if(typeof data!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(data))return false
  const [ano,mes,dia]=data.split('-').map(Number)
  if(ano<2020||ano>2100)return false
  return new Date(Date.UTC(ano,mes-1,dia)).toISOString().slice(0,10)===data
}

export function questaoDoDia(data:string) {
  if(!dataValida(data))throw new Error('Data inválida para o desafio.')
  const [ano,mes,dia]=data.split('-').map(Number)
  const indice=Math.floor(Date.UTC(ano,mes-1,dia)/86400000)%questoes.length
  return questoes[indice]
}

export function registrarRespostaDiaria(registros:readonly RespostaDiaria[],data:string,questaoId:string,opcao:number):RespostaDiaria[] {
  const questao=questaoDoDia(data)
  if(questao.id!==questaoId||!Number.isInteger(opcao)||opcao<0||opcao>=questao.opcoes.length)
    throw new Error('Resposta inválida para o desafio.')
  if(registros.some(r=>r.data===data))return [...registros]
  return [...registros.slice(-(MAX_DIAS-1)),{data,questaoId,opcao}]
}

export function validarDesafiosDiarios(dados:unknown):RespostaDiaria[] {
  if(!Array.isArray(dados))return []
  let lista:RespostaDiaria[]=[]
  for(const bruto of dados.slice(-100)){
    if(!bruto||typeof bruto!=='object'||Array.isArray(bruto))continue
    const item=bruto as Record<string,unknown>
    if(typeof item.data!=='string'||typeof item.questaoId!=='string'||typeof item.opcao!=='number')continue
    try {
      lista=registrarRespostaDiaria(lista,item.data,item.questaoId,item.opcao)
    }catch{continue}
  }
  return lista
}
