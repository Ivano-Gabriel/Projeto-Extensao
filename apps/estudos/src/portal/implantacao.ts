export type EtapaImplantacao={id:string;titulo:string;descricao:string;aba:string;acao:string;concluida:boolean}
type Direcao={turmas:number;professores:number;alunos:number;matriculasNaTurma:number;vinculosNaTurma:number;avisosPublicados:number}
type Professor={turmas:number;disciplinaVinculada:boolean;atividadesNaTurma:number;avisosDoProfessor:number}
const existe=(n:number)=>Number.isFinite(n)&&n>0

export function passosDirecao(s:Direcao):EtapaImplantacao[]{
  return [
    {id:'turma',titulo:'Organize a primeira turma',descricao:'Cadastre o código, nome e ano letivo da turma.',aba:'turmas',acao:'Organizar turmas',concluida:existe(s.turmas)},
    {id:'pessoas',titulo:'Cadastre os participantes',descricao:'Cadastre pelo menos um professor e um aluno de teste.',aba:'pessoas',acao:'Cadastrar pessoas',concluida:existe(s.professores)&&existe(s.alunos)},
    {id:'vinculos',titulo:'Vincule a turma selecionada',descricao:'Matricule um aluno e vincule um professor a uma disciplina da turma.',aba:'vinculos',acao:'Configurar vínculos',concluida:existe(s.matriculasNaTurma)&&existe(s.vinculosNaTurma)},
    {id:'avisos',titulo:'Publique um comunicado',descricao:'Escreva um aviso da direção para a comunidade escolar.',aba:'avisos',acao:'Criar comunicado',concluida:existe(s.avisosPublicados)},
  ]
}

export function passosProfessor(s:Professor):EtapaImplantacao[]{
  return [
    {id:'vinculo',titulo:'Confirme sua turma e disciplina',descricao:'Se não aparecer uma turma, solicite à direção seu vínculo.',aba:'turmas',acao:'Ver minhas turmas',concluida:existe(s.turmas)&&s.disciplinaVinculada===true},
    {id:'atividade',titulo:'Disponibilize uma atividade',descricao:'Sua turma precisa ter ao menos uma atividade publicada.',aba:'atividades',acao:'Publicar atividade',concluida:existe(s.turmas)&&existe(s.atividadesNaTurma)},
    {id:'aviso',titulo:'Envie um recado à turma',descricao:'Publique uma orientação própria no mural.',aba:'mural',acao:'Escrever comunicado',concluida:existe(s.turmas)&&existe(s.avisosDoProfessor)},
  ]
}

export function progressoImplantacao(etapas:readonly EtapaImplantacao[]){
  const concluidas=etapas.filter(x=>x.concluida).length
  return {concluidas,total:etapas.length,proximaAba:etapas.find(x=>!x.concluida)?.aba??null,completa:etapas.length>0&&concluidas===etapas.length}
}
