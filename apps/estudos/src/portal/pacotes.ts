import type {AtividadeFormulario,QuizGeradoIa} from './api'

export function prepararPublicacaoPacote(
  turmaId:number,disciplina:string,questoes:QuizGeradoIa[],prazoEntrega:string
):AtividadeFormulario[]{
  if(!Number.isInteger(turmaId)||turmaId<=0||!disciplina)
    throw new Error('Selecione uma turma e disciplina vinculadas.')
  if(questoes.length<2||questoes.length>6)
    throw new Error('O pacote precisa ter entre duas e seis questões.')
  const perguntas=new Set<string>()
  return questoes.map(q=>{
    const titulo=q.titulo.trim(),pergunta=q.pergunta.trim(),explicacao=q.explicacao.trim()
    const opcoes=q.opcoes.map(x=>x.trim())
    if(!titulo||titulo.length>150||!pergunta||pergunta.length>500||
      !explicacao||explicacao.length>1000)
      throw new Error('Revise os títulos, perguntas e explicações do pacote.')
    if(opcoes.length!==4||opcoes.some(x=>!x||x.length>200)||
      new Set(opcoes.map(x=>x.toLocaleLowerCase('pt-BR'))).size!==4)
      throw new Error('Cada questão exige quatro alternativas diferentes e preenchidas.')
    if(!Number.isInteger(q.correta)||q.correta<0||q.correta>3)
      throw new Error('Revise o gabarito de cada questão antes de publicar.')
    const chave=pergunta.toLocaleLowerCase('pt-BR')
    if(perguntas.has(chave))throw new Error('O pacote contém perguntas repetidas.')
    perguntas.add(chave)
    return {turmaId,disciplina,titulo,pergunta,opcoes,
      correta:q.correta,explicacao,prazoEntrega:prazoEntrega||null}
  })
}
