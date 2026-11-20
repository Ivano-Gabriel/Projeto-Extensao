import type { PapelEscolar } from './api.ts'

export type AbaPortal = {id:string;titulo:string;icone:string}
const abas={
  ALUNO:[
    {id:'inicio',titulo:'Hoje',icone:'home'},
    {id:'atividades',titulo:'Atividades',icone:'book'},
    {id:'materiais',titulo:'Materiais da turma',icone:'book'},
    {id:'avisos',titulo:'Avisos',icone:'bell'},
    {id:'assistente',titulo:'Assistente',icone:'sparkles'},
    {id:'progresso',titulo:'Meu progresso',icone:'chart'},
  ],
  PROFESSOR:[
    {id:'inicio',titulo:'Visão geral',icone:'home'},
    {id:'turmas',titulo:'Minhas turmas',icone:'users'},
    {id:'atividades',titulo:'Atividades',icone:'book'},
    {id:'materiais',titulo:'Materiais e IA',icone:'sparkles'},
    {id:'mural',titulo:'Mural',icone:'bell'},
    {id:'resultados',titulo:'Resultados',icone:'chart'},
    {id:'presenca',titulo:'Aulas',icone:'calendar'},
  ],
  DIRECAO:[
    {id:'inicio',titulo:'Visão geral',icone:'home'},
    {id:'turmas',titulo:'Turmas',icone:'users'},
    {id:'pessoas',titulo:'Pessoas',icone:'user'},
    {id:'vinculos',titulo:'Vínculos',icone:'link'},
    {id:'auditoria',titulo:'Histórico',icone:'shield'},
    {id:'avisos',titulo:'Comunicados',icone:'bell'},
  ]
} as const satisfies Record<PapelEscolar,readonly AbaPortal[]>

export function acoesPorPerfil(perfil:PapelEscolar): readonly AbaPortal[] {
  return abas[perfil]
}
export function opcoesProfessor(entrada:readonly string[]):string[] {
  if(entrada.some(m=>!/^[A-Z_]{3,60}$/.test(m)))throw new Error('Disciplina inválida.')
  return [...new Set(entrada)].sort()
}
