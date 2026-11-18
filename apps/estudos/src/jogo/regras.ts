export const DURACAO_TICKS = 300
const VELOCIDADE = 3.5
export type Fase = 'pronto' | 'jogando' | 'fim'
export type EstadoJogo = {
  fase: Fase
  ticks: number
  pontos: number
  vidas: number
  pulo: number
  obstaculos: number[]
}
export function estadoInicial(): EstadoJogo {
  return {fase:'pronto',ticks:0,pontos:0,vidas:2,pulo:0,obstaculos:[]}
}
export function iniciarJogo(): EstadoJogo {
  return {...estadoInicial(),fase:'jogando'}
}
export function pular(estado: EstadoJogo): EstadoJogo {
  if(estado.fase!=='jogando'||estado.pulo>0) return estado
  return {...estado,pulo:9}
}
export function avancar(estado: EstadoJogo): EstadoJogo {
  if(estado.fase!=='jogando') return estado
  const ticks=Math.min(DURACAO_TICKS,estado.ticks+1)
  const pulo=Math.max(0,estado.pulo-1)
  let pontos=estado.pontos
  let vidas=estado.vidas
  const obstaculos:number[]=[]
  for(const antiga of estado.obstaculos) {
    const x=antiga-VELOCIDADE
    if(x>=3&&x<=10&&pulo<=3) {
      vidas=Math.max(0,vidas-1)
    }else if(x<0) {
      pontos+=10
    }else {
      obstaculos.push(x)
    }
  }
  if(ticks%20===0&&ticks<DURACAO_TICKS) obstaculos.push(100)
  return {fase:vidas<=0||ticks>=DURACAO_TICKS?'fim':'jogando',
    ticks,pontos,vidas,pulo,obstaculos}
}
