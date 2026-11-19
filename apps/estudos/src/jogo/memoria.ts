export type AreaMemoria = 'matematica' | 'historia' | 'tecnologia'
export type CartaMemoria = {id:string;par:string;texto:string}
export type MemoriaEstado = {
  cartas:readonly CartaMemoria[]
  abertas:readonly number[]
  encontrados:readonly string[]
  acertos:number
  finalizado:boolean
}
const conteudos:Record<AreaMemoria, readonly [string,string,string][]> = {
  matematica:[
    ['Porcentagem','Parte de 100'],
    ['Média','Soma dividida pela quantidade'],
    ['Equação','Igualdade com incógnita'],
    ['Perímetro','Soma das medidas do contorno'],
  ],
  historia:[
    ['Fonte primária','Registro produzido na época estudada'],
    ['Revolução Industrial','Transformação da produção por máquinas'],
    ['Constituição','Conjunto fundamental de leis'],
    ['Historiografia','Estudo da escrita da história'],
  ],
  tecnologia:[
    ['Algoritmo','Sequência de passos'],
    ['Criptografia','Proteção de dados por codificação'],
    ['Backup','Cópia de segurança'],
    ['Phishing','Tentativa de roubo por mensagem falsa'],
  ]
}
export function paresMemoria():AreaMemoria[] {return Object.keys(conteudos) as AreaMemoria[]}
export function iniciarMemoria(area:AreaMemoria):MemoriaEstado {
  if(!conteudos[area])throw new Error('Área inválida.')
  const cartas=conteudos[area].flatMap(([conceito,explicacao],i)=>[
    {id:`${area}-${i}-a`,par:`${i}`,texto:conceito},
    {id:`${area}-${i}-b`,par:`${i}`,texto:explicacao},
  ])
  const ordem=[2,5,0,7,3,6,1,4]
  return {cartas:ordem.map(i=>cartas[i]),abertas:[],encontrados:[],acertos:0,finalizado:false}
}
export function revelarCarta(estado:MemoriaEstado,indice:number):MemoriaEstado {
  if(estado.finalizado||!Number.isInteger(indice)||indice<0||indice>=estado.cartas.length||
     estado.abertas.includes(indice)||estado.abertas.length>=2||
     estado.encontrados.includes(estado.cartas[indice].par))return estado
  const abertas=[...estado.abertas,indice]
  if(abertas.length===2 && estado.cartas[abertas[0]].par===estado.cartas[abertas[1]].par){
    const encontrados=[...estado.encontrados,estado.cartas[indice].par]
    return {...estado,abertas:[],encontrados,acertos:encontrados.length,
      finalizado:encontrados.length===conteudos[estado.cartas[0].id.split('-')[0] as AreaMemoria].length}
  }
  return {...estado,abertas}
}
export function estadoDaMemoria(estado:MemoriaEstado):MemoriaEstado {
  if(estado.abertas.length!==2)return estado
  return {...estado,abertas:[]}
}
