import type { MatriculaResumo, TurmaEscolar } from './api'

export type TransferenciaPendente = {
  alunoId:number
  alunoNome:string
  origemTurmaId:number
  origemCodigo:string
  destinoTurmaId:number
  destinoCodigo:string
  anoLetivo:number
}

export function prepararTransferencia(
  matricula:MatriculaResumo|undefined,
  destino:TurmaEscolar|undefined,
):TransferenciaPendente|null{
  if(!matricula||!destino||
    matricula.turmaId===destino.id||
    matricula.anoLetivo!==destino.anoLetivo)return null
  return {
    alunoId:matricula.alunoId,
    alunoNome:matricula.alunoNome,
    origemTurmaId:matricula.turmaId,
    origemCodigo:matricula.turmaCodigo,
    destinoTurmaId:destino.id,
    destinoCodigo:destino.codigo,
    anoLetivo:matricula.anoLetivo,
  }
}
