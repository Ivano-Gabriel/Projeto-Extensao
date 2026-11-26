import {acoesPorPerfil} from './navegacao.ts'
import type {PapelEscolar} from './api.ts'

export type ModoExperiencia='essencial'|'completo'
type Leitura={getItem:(chave:string)=>string|null}
type Escrita={setItem:(chave:string,valor:string)=>void}
type SituacaoAluno={turmas:number;pendentes:number;materiais:number;avisos:number}
export type PassoAluno={titulo:string;descricao:string;acao:string|null;aba:string|null}

const chave=(id:number)=>Number.isSafeInteger(id)&&id>0?`zelo:experiencia:v1:${id}`:null

export function lerModo(id:number,armazenamento:Leitura|null):ModoExperiencia{
  try{
    const key=chave(id)
    if(key&&armazenamento?.getItem(key)==='completo')return 'completo'
  }catch{}
  return 'essencial'
}

export function salvarModo(id:number,modo:ModoExperiencia,armazenamento:Escrita|null):boolean{
  try{
    const key=chave(id)
    if(!key||!armazenamento)return false
    armazenamento.setItem(key,modo)
    return true
  }catch{return false}
}

const principais:Record<PapelEscolar,readonly string[]>={
  ALUNO:['atividades','materiais','avisos'],
  PROFESSOR:['atividades','materiais','mural'],
  DIRECAO:['turmas','pessoas','vinculos'],
}
const apelidos:Record<string,readonly string[]>={
  inicio:['inicio','comeco','hoje','pagina inicial'],
  atividades:['tarefas','licao','exercicios','questoes','dever','publicar atividade'],
  materiais:['livro','leitura','apostila','conteudo','material escolar','biblioteca','textos'],
  avisos:['recados','comunicados','mural','avisos da escola'],
  mural:['recados','comunicados','avisos','publicar recado'],
  prova:['treino','simulado','quiz','avaliacao'],
  assistente:['duvidas','ajuda','perguntar','tutor'],
  progresso:['evolucao','acertos','meu progresso'],
  turmas:['classe','salas','turma escolar'],
  pessoas:['cadastros','contas','professores','alunos','usuarios'],
  vinculos:['matriculas','matricular','associar professor','vinculacao'],
  auditoria:['historico','auditoria','seguranca'],
  resultados:['respostas','desempenho','acertos','resultado'],
  presenca:['frequencia','chamada','presenca','aulas'],
}
const normalizar=(texto:string)=>texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim()

export function procurarAcoes(perfil:PapelEscolar,busca:string){
  const permitidas=acoesPorPerfil(perfil)
  const termo=normalizar(busca)
  if(!termo)return principais[perfil].map(id=>permitidas.find(x=>x.id===id)).filter((a):a is (typeof permitidas)[number]=>!!a)
  return permitidas.filter(a=>normalizar([a.titulo,...(apelidos[a.id]??[])].join(' ')).includes(termo))
}

export function orientarAluno(s:SituacaoAluno):PassoAluno{
  if(!Number.isFinite(s.turmas)||s.turmas<=0)return {
    titulo:'Aguardando sua turma',descricao:'A direção ainda precisa confirmar seu vínculo com uma turma.',
    aba:null,acao:null,
  }
  if(s.pendentes>0)return {
    titulo:'Sua próxima atividade está aqui',
    descricao:`${s.pendentes} ${s.pendentes===1?'atividade espera':'atividades esperam'} por você, publicadas pela escola.`,
    aba:'atividades',acao:'Ver minhas atividades',
  }
  if(s.avisos>0)return {
    titulo:'Confira os recados da escola',
    descricao:`Você tem ${s.avisos} ${s.avisos===1?'comunicado':'comunicados'} disponível para leitura.`,
    aba:'avisos',acao:'Ver comunicados',
  }
  if(s.materiais>0)return {
    titulo:'Continue estudando',
    descricao:`Há ${s.materiais} ${s.materiais===1?'material publicado':'materiais publicados'} pelo professor.`,
    aba:'materiais',acao:'Abrir materiais',
  }
  return {
    titulo:'Seu espaço está preparado',
    descricao:'Quando seus professores publicarem atividades e materiais, eles aparecerão na sua turma.',
    aba:'materiais',acao:'Ver minha turma',
  }
}
