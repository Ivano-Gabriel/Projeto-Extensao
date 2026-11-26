import type {AtividadeFormulario,TurmaEscolar,UsuarioResumido} from './api.ts'

export type ErroFormulario={campo:string;mensagem:string}
type FormularioConta={nome:string;email:string;senha:string;papel:string}
type FormularioTurma={codigo:string;nome:string;anoLetivo:number}

const nomeLimpo=(valor:string)=>valor.trim().replace(/\s+/g,' ')
const comparar=(valor:string)=>valor.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ')
const validaData=(valor:string)=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(valor))return false
  const [ano,mes,dia]=valor.split('-').map(Number)
  const data=new Date(Date.UTC(ano,mes-1,dia))
  return data.getUTCFullYear()===ano&&data.getUTCMonth()===mes-1&&data.getUTCDate()===dia
}

export function revisarAtividade(dados:AtividadeFormulario,hoje:string){
  const erros:ErroFormulario[]=[]
  const titulo=nomeLimpo(dados.titulo)
  const pergunta=dados.pergunta.trim()
  const opcoes=dados.opcoes.map(op=>nomeLimpo(op))
  const explicacao=dados.explicacao.trim()
  const disciplina=dados.disciplina.trim()
  const prazoEntrega=dados.prazoEntrega?.trim()||null
  if(!Number.isSafeInteger(dados.turmaId)||dados.turmaId<1)
    erros.push({campo:'turma',mensagem:'Selecione uma turma válida.'})
  if(!disciplina)erros.push({campo:'disciplina',mensagem:'Escolha a disciplina vinculada à turma.'})
  if(!titulo||titulo.length>150)erros.push({campo:'titulo',mensagem:'Informe um título com até 150 caracteres.'})
  if(!pergunta||pergunta.length>500)erros.push({campo:'pergunta',mensagem:'Escreva a pergunta com até 500 caracteres.'})
  if(opcoes.length!==4||opcoes.some(op=>!op||op.length>200))
    erros.push({campo:'opcoes',mensagem:'Preencha as quatro alternativas, cada uma com até 200 caracteres.'})
  else if(new Set(opcoes.map(comparar)).size!==4)
    erros.push({campo:'opcoes',mensagem:'As quatro alternativas precisam ser diferentes.'})
  if(!Number.isInteger(dados.correta)||dados.correta<0||dados.correta>3)
    erros.push({campo:'correta',mensagem:'Selecione uma alternativa correta entre A e D.'})
  if(!explicacao||explicacao.length>1000)
    erros.push({campo:'explicacao',mensagem:'Explique a resposta, usando até 1000 caracteres.'})
  if(prazoEntrega&&(!validaData(prazoEntrega)||!validaData(hoje)||prazoEntrega<hoje))
    erros.push({campo:'prazoEntrega',mensagem:'O prazo deve ser uma data válida, hoje ou posterior.'})
  return {
    erros,
    pronto:erros.length?null:{
      turmaId:dados.turmaId,disciplina,titulo,pergunta,opcoes,correta:dados.correta,
      explicacao,prazoEntrega,
    } satisfies AtividadeFormulario,
  }
}

export function validarTurma(dados:FormularioTurma,existentes:readonly Pick<TurmaEscolar,'codigo'|'anoLetivo'>[]){
  const erros:ErroFormulario[]=[]
  const codigo=dados.codigo.trim().toUpperCase()
  const nome=nomeLimpo(dados.nome)
  if(!/^[A-Z0-9-]{1,32}$/.test(codigo))
    erros.push({campo:'codigo',mensagem:'Use de 1 a 32 letras, números ou hífens no código.'})
  if(!nome||nome.length>100)
    erros.push({campo:'nome',mensagem:'Informe o nome da turma com até 100 caracteres.'})
  if(!Number.isInteger(dados.anoLetivo)||dados.anoLetivo<2020||dados.anoLetivo>2100)
    erros.push({campo:'anoLetivo',mensagem:'Escolha um ano letivo entre 2020 e 2100.'})
  if(existentes.some(t=>t.anoLetivo===dados.anoLetivo&&comparar(t.codigo)===comparar(codigo)))
    erros.push({campo:'codigo',mensagem:'Já existe uma turma com esse código e ano letivo.'})
  return {erros,pronto:erros.length?null:{codigo,nome,anoLetivo:dados.anoLetivo}}
}

export function validarConta(dados:FormularioConta,existentes:readonly Pick<UsuarioResumido,'email'>[]){
  const erros:ErroFormulario[]=[]
  const nome=nomeLimpo(dados.nome)
  const email=dados.email.trim().toLowerCase()
  if(!nome||nome.length>150)
    erros.push({campo:'nome',mensagem:'Informe o nome da pessoa com até 150 caracteres.'})
  if(email.length>254||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    erros.push({campo:'email',mensagem:'Digite um e-mail válido.'})
  else if(existentes.some(u=>u.email.trim().toLowerCase()===email))
    erros.push({campo:'email',mensagem:'Já existe uma conta com este e-mail.'})
  if(dados.senha.length<12||dados.senha.length>200||!dados.senha.trim())
    erros.push({campo:'senha',mensagem:'Crie uma senha inicial entre 12 e 200 caracteres.'})
  if(dados.papel!=='ALUNO'&&dados.papel!=='PROFESSOR')
    erros.push({campo:'papel',mensagem:'Só é permitido cadastrar aluno ou professor por este formulário.'})
  return {erros,pronto:erros.length?null:{
    nome,email,senha:dados.senha,papel:dados.papel as 'ALUNO'|'PROFESSOR',
  }}
}
