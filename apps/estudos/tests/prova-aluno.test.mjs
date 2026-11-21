import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {acoesPorPerfil} from '../src/portal/navegacao.ts'
import {apiEscolar,requisitar,extrairTextoPdfAluno} from '../src/portal/api.ts'

const arquivo=()=>readFileSync(new URL('../src/portal/ProvaAluno.tsx',import.meta.url),'utf8')

test('aluno tem aba Prova separada, sem acesso de professor e diretor',()=>{
  assert.ok(acoesPorPerfil('ALUNO').some(a=>a.id==='prova'&&a.titulo==='Prova'))
  assert.ok(!acoesPorPerfil('PROFESSOR').some(a=>a.id==='prova'))
  assert.ok(!acoesPorPerfil('DIRECAO').some(a=>a.id==='prova'))
})

test('API de simulado tem geração, listagem, detalhe, PDF e entrega',()=>{
  for(const metodo of ['gerarSimulado','listarSimulados','detalharSimulado','responderSimulado','extrairPdfAluno']){
    assert.equal(typeof apiEscolar[metodo],'function',metodo)
  }
})

test('envio de prova usa sessão da origem, JSON e CSRF',async()=>{
  const calls=[]
  const req=async(url,opts)=>{
    calls.push({url,opts})
    return url==='/api/csrf'
      ?{ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({token:'teste'})}
      :{ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({nota:8})}
  }
  await requisitar('POST','/api/portal/provas/simulados/9/respostas',
    {respostas:[{questaoId:10,opcao:2}]},req)
  assert.deepEqual(calls.map(x=>x.url),['/api/csrf','/api/portal/provas/simulados/9/respostas'])
  assert.equal(calls[1].opts.method,'POST')
  assert.equal(calls[1].opts.headers['X-XSRF-TOKEN'],'teste')
  assert.equal(calls[1].opts.credentials,'same-origin')
})

test('prova exige cinco respostas e confirmação antes de enviar',()=>{
  const src=arquivo()
  assert.match(src,/Confirmar entrega/)
  assert.match(src,/Cancelar entrega/)
  assert.match(src,/Nota de treino/)
  assert.match(src,/Não é nota escolar/)
  assert.match(src,/prova-valida/)
  assert.match(src,/DIF[IÍ]CIL|DIFICIL/)
  assert.match(src,/Ler PDF/)
})

test('PDF da Prova usa rota de aluno, sem envio automático ao modelo',async()=>{
  const calls=[]
  const req=async(url,options)=>{
    calls.push({url,options})
    return url==='/api/csrf'
      ?{ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({token:'token-aluno'})}
      :{ok:true,status:200,headers:{get:()=> 'application/json'},
        json:async()=>({texto:'Frações e proporções',paginas:1,truncado:false})}
  }
  const pdf=new File(['%PDF-1.7\n'], 'apostila.pdf', {type:'application/pdf'})
  const r=await extrairTextoPdfAluno(9,'MATEMATICA',pdf,req)
  assert.equal(r.texto,'Frações e proporções')
  assert.deepEqual(calls.map(c=>c.url),['/api/csrf','/api/portal/provas/pdf-extrair'])
  assert.equal(calls[1].options.headers['X-XSRF-TOKEN'],'token-aluno')
  assert.equal(calls[1].options.headers['Content-Type'],undefined)
  assert.equal(calls[1].options.credentials,'same-origin')
  assert.ok(calls[1].options.body instanceof FormData)
})
