import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {apiEscolar,requisitar} from '../src/portal/api.ts'

const sala=readFileSync(new URL('../src/portal/SalaDocente.tsx',import.meta.url),'utf8')
const docente=readFileSync(new URL('../src/portal/ProfessorPainel.tsx',import.meta.url),'utf8')
const assistente=readFileSync(new URL('../src/portal/AssistenteEscolar.tsx',import.meta.url),'utf8')
const tutor=readFileSync(new URL('../src/portal/TutorPedagogico.tsx',import.meta.url),'utf8')
function responder(data,status=200){
  return {ok:status>=200&&status<300,status,
    headers:{get:()=> 'application/json'},json:async()=>data}
}

test('a chamada de tutor usa cookie e token CSRF da mesma origem',async()=>{
  const chamadas=[]
  const trans=async(path,opts)=>{
    chamadas.push({path,opts})
    return path==='/api/csrf'?responder({token:'csrf-teste'}):
      responder({texto:'A raiz quadrada é...',aviso:'Revisar',restantesHoje:5})
  }
  const dados={turmaId:7,disciplina:'MATEMATICA',pergunta:'Como encontrar a raiz quadrada?'}
  const resposta=await requisitar('POST','/api/portal/ia/explicar',dados,trans)
  assert.equal(chamadas.length,2)
  assert.equal(chamadas[1].path,'/api/portal/ia/explicar')
  assert.equal(chamadas[1].opts.credentials,'same-origin')
  assert.equal(chamadas[1].opts.headers['X-XSRF-TOKEN'],'csrf-teste')
  assert.deepEqual(JSON.parse(chamadas[1].opts.body),dados)
  assert.equal(resposta.restantesHoje,5)
})

test('consulta status nao cria pedido de IA',async()=>{
  const chamadas=[]
  await requisitar('GET','/api/portal/ia/status',undefined,
    async(url,opts)=>{chamadas.push({url,opts});return responder({habilitada:false,restantesHoje:0,mensagem:'Não ativado'})})
  assert.deepEqual(chamadas.map(c=>c.url),['/api/portal/ia/status'])
  assert.equal(chamadas[0].opts.credentials,'same-origin')
  assert.equal(typeof apiEscolar.gerarRascunho,'function')
  assert.equal(typeof apiEscolar.disciplinasIaAluno,'function')
  assert.equal(typeof apiEscolar.explicarIa,'function')
})

test('professor revisa quiz estruturado antes de publicar',()=>{
  assert.match(sala,/aoPrepararQuiz/)
  assert.match(sala,/resposta\.quiz/)
  assert.match(sala,/Revisar quiz no editor de atividades/)
  assert.match(docente,/prepararQuizIa/)
  assert.match(docente,/setCorreta\(quiz\.correta\)/)
  assert.match(docente,/setAba\('atividades'\)/)
})

test('modos escolares e tutoria generativa sao distintos',()=>{
  assert.match(assistente,/Minha escola/)
  assert.match(assistente,/Entender matéria com IA/)
  assert.match(assistente,/<TutorPedagogico\/>/)
  assert.match(tutor,/status\?\.habilitada/)
  assert.match(tutor,/apiEscolar\.explicarIa/)
  assert.match(tutor,/Não digite nome completo/)
})
