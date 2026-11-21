import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {prepararPublicacaoPacote} from '../src/portal/pacotes.ts'
import {apiEscolar,requisitar,extrairTextoPdf} from '../src/portal/api.ts'

const questao=(titulo,pergunta)=>({
  titulo,pergunta,opcoes:['A','B','C','D'],correta:2,explicacao:'Justificativa.'
})

test('professor revisa pacote e transforma em atividades para turma e disciplina',()=>{
  const r=prepararPublicacaoPacote(7,'MATEMATICA',
    [questao('Q1','Quanto e 2+2?'),questao('Q2','Quanto e 4+4?')],'2030-12-31')
  assert.equal(r.length,2)
  assert.equal(r[0].turmaId,7)
  assert.equal(r[1].disciplina,'MATEMATICA')
  assert.equal(r[0].prazoEntrega,'2030-12-31')
  assert.equal(r[1].correta,2)
})

test('pacote invalido nunca vai ao servidor',()=>{
  assert.throws(()=>prepararPublicacaoPacote(0,'MATEMATICA',
    [questao('Q1','Uma?'),questao('Q2','Duas?')],''),/turma/i)
  assert.throws(()=>prepararPublicacaoPacote(7,'MATEMATICA',
    [questao('Q1','Uma?')],''),/duas/i)
  assert.throws(()=>prepararPublicacaoPacote(7,'MATEMATICA',
    [questao('Q1','Uma?'),questao('Q2','Uma?')],''),/repetid/i)
  assert.throws(()=>prepararPublicacaoPacote(7,'MATEMATICA',
    [questao('Q1','Uma?'),{...questao('Q2','Duas?'),opcoes:['A','A','C','D']}],''),/alternativas/i)
  assert.throws(()=>prepararPublicacaoPacote(7,'MATEMATICA',
    [questao('Q1','Uma?'),{...questao('Q2','Duas?'),correta:8}],''),
    /gabarito/i)
})

test('novos endpoints usam sessão e token CSRF',async()=>{
  assert.equal(typeof apiEscolar.gerarPacote,'function')
  assert.equal(typeof apiEscolar.publicarLote,'function')
  const chamadas=[]
  const req=async(url,opts)=>{
    chamadas.push({url,opts})
    return url==='/api/csrf'
      ?{ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({token:'qa-token'})}
      :{ok:true,status:201,headers:{get:()=> 'application/json'},json:async()=>[]}
  }
  await requisitar('POST','/api/professor/atividades/lote',{atividades:[]},req)
  assert.equal(chamadas[1].opts.headers['X-XSRF-TOKEN'],'qa-token')
  assert.equal(chamadas[1].opts.credentials,'same-origin')
})

test('interface da sala docente exige revisão humana antes de publicar',()=>{
  const s=readFileSync(new URL('../src/portal/SalaDocente.tsx',import.meta.url),'utf8')
  assert.match(s,/Gerar pacote de questões|PACOTE/)
  assert.match(s,/Publicar pacote revisado/)
  assert.match(s,/prepararPublicacaoPacote/)
  assert.match(s,/fonteTexto/)
})

test('PDF é enviado como multipart com CSRF e não aciona IA automaticamente',async()=>{
  const arquivo=new File(['%PDF-1.7\nQA'], 'aula.pdf', {type:'application/pdf'})
  const chamadas=[]
  const transport=async(url,opts)=>{
    chamadas.push({url,opts})
    return url==='/api/csrf'
      ?{ok:true,status:200,headers:{get:()=> 'application/json'},
         json:async()=>({token:'csrf-qa'})}
      :{ok:true,status:200,headers:{get:()=> 'application/json'},
         json:async()=>({texto:'Revisar este trecho',paginas:1,truncado:false})}
  }
  const resposta=await extrairTextoPdf(7,'MATEMATICA',arquivo,transport)
  assert.equal(resposta.texto,'Revisar este trecho')
  assert.deepEqual(chamadas.map(c=>c.url),['/api/csrf','/api/professor/ia/pdf-extrair'])
  assert.equal(chamadas[1].opts.method,'POST')
  assert.equal(chamadas[1].opts.credentials,'same-origin')
  assert.equal(chamadas[1].opts.headers['X-XSRF-TOKEN'],'csrf-qa')
  assert.equal(chamadas[1].opts.headers['Content-Type'],undefined)
  assert.ok(chamadas[1].opts.body instanceof FormData)
  assert.equal(chamadas[1].opts.body.get('disciplina'),'MATEMATICA')
  assert.equal(chamadas[1].opts.body.get('arquivo').name,'aula.pdf')
  assert.match(readFileSync(new URL('../src/portal/SalaDocente.tsx',import.meta.url),'utf8'),
    /Ler PDF para revisão/)
})
