import test from 'node:test'
import assert from 'node:assert/strict'
import { apiEscolar, requisitar } from '../src/portal/api.ts'
import { acoesPorPerfil, opcoesProfessor } from '../src/portal/navegacao.ts'

function resp(valor,status=200){
  return {ok:status>=200&&status<300,status,
    headers:{get:()=> 'application/json'},json:async()=>valor}
}
test('professor e direção têm navegacao propria; aluno nao enxerga gestao',()=>{
  assert.deepEqual(acoesPorPerfil('PROFESSOR').map(x=>x.id),['inicio','turmas','atividades','mural','resultados','presenca'])
  assert.deepEqual(acoesPorPerfil('DIRECAO').map(x=>x.id),['inicio','turmas','pessoas','vinculos','avisos'])
  assert.deepEqual(acoesPorPerfil('ALUNO').map(x=>x.id),['inicio','atividades','avisos','assistente','progresso'])
})
test('disciplina do professor depende de vinculo devolvido pela API',()=>{
  assert.deepEqual(opcoesProfessor(['PORTUGUES','MATEMATICA','PORTUGUES']),['MATEMATICA','PORTUGUES'])
  assert.deepEqual(opcoesProfessor([]),[])
  assert.throws(()=>opcoesProfessor(['MATEMATICA','javascript:alert(1)']),/Disciplina inválida/)
})
test('exclusao de vinculo exige token csrf e cookie da origem',async()=>{
  const chamadas=[]
  const req=async(url,opts)=>{chamadas.push({url,opts});return url==='/api/csrf'?resp({token:'token-csrf'}):resp(null,204)}
  await requisitar('DELETE','/api/gestao/turmas/7/professores/22/disciplinas/MATEMATICA',undefined,req)
  assert.deepEqual(chamadas.map(x=>x.url),['/api/csrf','/api/gestao/turmas/7/professores/22/disciplinas/MATEMATICA'])
  assert.equal(chamadas[1].opts.credentials,'same-origin')
  assert.equal(chamadas[1].opts.headers['X-XSRF-TOKEN'],'token-csrf')
  assert.equal(chamadas[1].opts.method,'DELETE')
})
test('exclusao recusa dominio externo e consultas com parâmetros inseguros',async()=>{
  await assert.rejects(()=>requisitar('GET','https://externo.com/api/me'),/inválido/)
  await assert.rejects(()=>requisitar('GET','/api/portal/avisos?escolaId=999'),/inválido/)
  assert.equal(typeof apiEscolar.avisos,'function')
  assert.equal(typeof apiEscolar.assistente,'function')
})
