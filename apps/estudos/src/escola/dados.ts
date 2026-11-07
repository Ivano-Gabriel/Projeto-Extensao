import type { Materia } from '../dados/materiais.ts'
import type { Aula } from './regras.ts'
import { formatarDataLocal } from './regras.ts'

export type Nota = { materia: Materia; bimestres: [number | null, number | null, number | null, number | null] }
export type Publicacao = {
  id: string; nome: string; iniciais: string; disciplina: Materia; quando: string
  titulo: string; texto: string; materialId?: string; fixado?: boolean
}

export const disciplinas: Materia[] = ['Matemática', 'Português', 'Física', 'História']

// Valores demonstrativos, sem qualquer vinculo com escola ou estudante real.
export const notasDemo: Nota[] = [
  {materia:'Matemática',bimestres:[7.5,8.2,6.8,null]},
  {materia:'Português',bimestres:[8.5,9.0,8.0,null]},
  {materia:'Física',bimestres:[6.5,7.0,7.8,null]},
  {materia:'História',bimestres:[9.0,8.5,9.2,null]},
]

export const publicacoes: Publicacao[] = [
  {id:'post-1',nome:'Prof. Marina',iniciais:'MM',disciplina:'Matemática',quando:'HOJE',
    titulo:'Funções do 2º grau: revisão da semana',
    texto:'Separei um resumo sobre raízes, parábolas e delta. Leia com calma e tente o quiz depois! ✏️',
    materialId:'funcao-quadratica',fixado:true},
  {id:'post-2',nome:'Prof. Carlos',iniciais:'CS',disciplina:'Física',quando:'ONTEM',
    titulo:'Por que o cinto de segurança importa?',
    texto:'Isso tem tudo a ver com a 1ª lei de Newton. Experimenta explicar o que acontece com seu corpo quando o ônibus freia.',
    materialId:'leis-newton'},
  {id:'post-3',nome:'Profª. Luana',iniciais:'LS',disciplina:'Português',quando:'HÁ 2 DIAS',
    titulo:'Desafio rápido de interpretação',
    texto:'Metáfora e personificação aparecem em letras, poemas e conversas do dia a dia. Acha um exemplo e anota no caderno.',
    materialId:'figuras-linguagem'},
  {id:'post-4',nome:'Prof. André',iniciais:'AL',disciplina:'História',quando:'HÁ 3 DIAS',
    titulo:'Linha do tempo: Era Vargas',
    texto:'Organize no seu caderno três datas: 1930, 1937 e 1945. Depois explique por que são importantes.',
    materialId:'era-vargas'},
]

export function gerarFrequenciaDemo(hoje = new Date()): Aula[] {
  const aulas: Aula[] = []
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  // O painel anual cobre o ano letivo demonstrativo do inicio do ano ate hoje.
  const primeiroDia = new Date(inicio.getFullYear(), 0, 1)
  const diasNoAno = Math.round((inicio.getTime() - primeiroDia.getTime()) / 86400000)
  for (let atraso = diasNoAno; atraso >= 0; atraso--) {
    const dia = new Date(inicio)
    dia.setDate(inicio.getDate() - atraso)
    if ([0,6].includes(dia.getDay())) continue
    const indice = Math.floor((inicio.getTime() - dia.getTime()) / 86400000)
    const diaSemana = dia.getDay()
    const materiasDoDia = diaSemana % 2 === 0 ? ['Matemática','Física'] : ['Português','História']
    materiasDoDia.forEach((materia, ordem) => {
      const ausencia = materia === 'Física' ? (indice + ordem) % 5 === 0
        : materia === 'História' ? (indice + ordem) % 7 === 0
        : materia === 'Matemática' ? (indice + ordem) % 11 === 0
        : (indice + ordem) % 9 === 0
      aulas.push({data:formatarDataLocal(dia),materia,aulas:2,presencas:ausencia ? 0 : 2})
    })
  }
  return aulas
}
