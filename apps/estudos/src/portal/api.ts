export type PapelEscolar = 'ALUNO' | 'PROFESSOR' | 'DIRECAO'
export type UsuarioEscolar = {
  id: number
  nome: string
  email: string
  papel: PapelEscolar
  escolaId: number | null
  administrador: boolean
}
export type TurmaEscolar = {id:number;codigo:string;nome:string;anoLetivo:number}
export type UsuarioResumido = {id:number;nome:string;email:string;papel:PapelEscolar}
export type EscolaResumo = {id:number;codigo:string;nome:string}
export type AtividadeEscolar = {
  id:number;turmaId:number;disciplina:string;titulo:string;pergunta:string;opcoes:string[]
}
export type ResultadoAtividade = {acertou:boolean;explicacao:string}
type Metodo = 'GET' | 'POST'

export class ErroApi extends Error {
  readonly status:number
  constructor(mensagem:string,status:number){
    super(mensagem)
    this.name='ErroApi'
    this.status=status
  }
}

function validarRota(path:string) {
  if(!/^\/api\/(?:[a-z-]+\/)*[a-z0-9-]+(?:\/\d+)*(?:\/[a-z-]+)*$/.test(path))
    throw new Error('Caminho de API inválido.')
}
async function jsonSeguro<T>(resposta:Response):Promise<T> {
  const tipo=resposta.headers.get('content-type')||''
  if(!tipo.includes('application/json'))throw new Error('A API escolar não está disponível neste endereço.')
  return resposta.json() as Promise<T>
}
export async function requisitar<T>(
  metodo:Metodo,path:string,corpo?:unknown,transport:typeof fetch=fetch
):Promise<T> {
  validarRota(path)
  const headers:Record<string,string> = {Accept:'application/json'}
  if(metodo==='POST'){
    const csrf=await transport('/api/csrf',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}})
    if(!csrf.ok)throw new Error('Não foi possível iniciar a sessão segura. Tente novamente.')
    const dados=await jsonSeguro<{token:string}>(csrf)
    if(typeof dados.token!=='string'||!dados.token)throw new Error('Proteção da sessão indisponível.')
    headers['X-XSRF-TOKEN']=dados.token
    if(corpo!==undefined)headers['Content-Type']='application/json'
  }
  const resposta=await transport(path,{
    method:metodo,credentials:'same-origin',cache:'no-store',redirect:'error',
    headers,...(corpo===undefined?{}:{body:JSON.stringify(corpo)}),
  })
  if(!resposta.ok){
    if(resposta.status===401)throw new ErroApi('Faça login para continuar.',401)
    if(resposta.status===403)throw new ErroApi('Você não tem permissão para esta ação.',403)
    if(resposta.status===404)throw new Error('Informação não encontrada ou indisponível.')
    if(resposta.status===409)throw new Error('Este registro já existe ou já foi respondido.')
    if(resposta.status===400)throw new Error('Revise os dados e tente novamente.')
    throw new Error('Não foi possível concluir. Tente novamente.')
  }
  if(resposta.status===204)return undefined as T
  return jsonSeguro<T>(resposta)
}
export const apiEscolar={
  me:()=>requisitar<UsuarioEscolar>('GET','/api/me'),
  login:(email:string,senha:string)=>requisitar<UsuarioEscolar>('POST','/api/login',{email,senha}),
  logout:()=>requisitar<void>('POST','/api/logout'),
  turmas:()=>requisitar<TurmaEscolar[]>('GET','/api/portal/turmas'),
  atividades:()=>requisitar<AtividadeEscolar[]>('GET','/api/portal/atividades'),
  criarTurma:(body:{codigo:string;nome:string;anoLetivo:number})=>
    requisitar<TurmaEscolar>('POST','/api/gestao/turmas',body),
  usuarios:()=>requisitar<UsuarioResumido[]>('GET','/api/gestao/usuarios'),
  criarUsuario:(body:{nome:string;email:string;senha:string;papel:'ALUNO'|'PROFESSOR'})=>
    requisitar<UsuarioResumido>('POST','/api/gestao/usuarios',body),
  matricular:(turmaId:number,alunoId:number)=>
    requisitar<void>('POST',`/api/gestao/turmas/${turmaId}/matriculas`,{alunoId}),
  vincularProfessor:(turmaId:number,professorId:number,disciplina:string)=>
    requisitar<void>('POST',`/api/gestao/turmas/${turmaId}/professores`,{professorId,disciplina}),
  publicar:(body:{turmaId:number;disciplina:string;titulo:string;pergunta:string;opcoes:string[];correta:number;explicacao:string})=>
    requisitar<AtividadeEscolar>('POST','/api/professor/atividades',body),
  responder:(id:number,opcao:number)=>
    requisitar<ResultadoAtividade>('POST',`/api/portal/atividades/${id}/respostas`,{opcao}),
  escolas:()=>requisitar<EscolaResumo[]>('GET','/api/admin/escolas'),
  criarEscola:(codigo:string,nome:string)=>
    requisitar<EscolaResumo>('POST','/api/admin/escolas',{codigo,nome}),
  criarDirecao:(id:number,body:{nome:string;email:string;senha:string})=>
    requisitar<UsuarioResumido>('POST',`/api/admin/escolas/${id}/direcao`,body),
}
