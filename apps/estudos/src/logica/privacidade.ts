import { CHAVE_ESTUDOS } from './persistencia.ts'
import { CHAVE_ESCOLA } from '../escola/estado.ts'
import { CHAVE_PLANO } from '../plano/regras.ts'

type Armazenamento = { removeItem:(chave:string)=>void }

export function chavesDoEstudos(): string[] {
  return [CHAVE_ESTUDOS,CHAVE_ESCOLA,CHAVE_PLANO]
}

export function apagarDadosDoEstudos(store: Armazenamento | null | undefined): boolean {
  if(!store) return false
  try {
    for(const chave of chavesDoEstudos()) store.removeItem(chave)
    return true
  }catch{return false}
}
