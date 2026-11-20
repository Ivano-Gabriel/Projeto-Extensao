import {diasConsecutivosEstudados,formatarDataLocal} from './regras'

export type DiaFoguinho={data:string;dia:number;diaSemana:string;estudado:boolean;hoje:boolean}
export type ResumoFoguinho={
  sequencia:number;recorde:number;diasTotais:number;mesAtual:number;
  proximaMeta:number;ultimaAtividade:string|null;progresso:number
}

function normalizar(dias:readonly string[],hoje:Date):string[]{
  const limite=formatarDataLocal(hoje)
  return [...new Set(dias)].filter(s=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||s>limite)return false
    const [ano,mes,dia]=s.split('-').map(Number)
    return formatarDataLocal(new Date(ano,mes-1,dia,12))===s
  }).sort()
}

export function resumoFoguinho(dias:readonly string[],hoje=new Date()):ResumoFoguinho{
  const datas=normalizar(dias,hoje)
  const sequencia=diasConsecutivosEstudados(datas,hoje)
  let recorde=0,corrente=0,anterior:Date|null=null
  for(const d of datas){
    const [ano,mes,dia]=d.split('-').map(Number)
    const atual=new Date(ano,mes-1,dia,12)
    if(anterior){
      const proximo=new Date(anterior)
      proximo.setDate(proximo.getDate()+1)
      corrente=formatarDataLocal(proximo)===d?corrente+1:1
    }else corrente=1
    recorde=Math.max(recorde,corrente)
    anterior=atual
  }
  const mesAtual=datas.filter(d=>d.slice(0,7)===formatarDataLocal(hoje).slice(0,7)).length
  const proximaMeta=[3,7,14,30,60,100,365].find(v=>v>sequencia)||365
  return {
    sequencia,recorde,diasTotais:datas.length,mesAtual,
    proximaMeta,ultimaAtividade:datas.at(-1)||null,
    progresso:Math.min(100,Math.round(100*sequencia/proximaMeta)),
  }
}

export function calendarioFoguinho(dias:readonly string[],hoje=new Date()):DiaFoguinho[]{
  const marcados=new Set(normalizar(dias,hoje))
  const inicio=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate(),12)
  inicio.setDate(inicio.getDate()-((inicio.getDay()+6)%7)-28)
  const dataHoje=formatarDataLocal(hoje)
  return Array.from({length:35},(_,i)=>{
    const d=new Date(inicio)
    d.setDate(d.getDate()+i)
    const data=formatarDataLocal(d)
    return {
      data,dia:d.getDate(),
      diaSemana:new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(d),
      estudado:marcados.has(data),hoje:data===dataHoje,
    }
  })
}
