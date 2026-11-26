import test from 'node:test'
import assert from 'node:assert/strict'
import {revisarAtividade,validarConta,validarTurma} from '../src/portal/formularios-seguros.ts'

const atividade=()=>({
  turmaId:7,disciplina:'MATEMATICA',titulo:'  Multiplicação  ',
  pergunta:'  Quanto é 2 × 3?  ',opcoes:[' 5 ',' 6 ',' 7 ',' 8 '],
  correta:1,explicacao:'  Duas vezes três é seis.  ',prazoEntrega:'2027-03-20',
})

test('atividade válida normaliza espaços e preserva gabarito correto antes da publicação',()=>{
  const resultado=revisarAtividade(atividade(),'2027-03-01')
  assert.deepEqual(resultado.erros,[])
  assert.equal(resultado.pronto.titulo,'Multiplicação')
  assert.deepEqual(resultado.pronto.opcoes,['5','6','7','8'])
  assert.equal(resultado.pronto.correta,1)
  assert.equal(resultado.pronto.prazoEntrega,'2027-03-20')
})

test('não deixa publicar opções repetidas mesmo com maiúsculas, acentos e espaços',()=>{
  const q=atividade()
  q.opcoes=['Árvore','árvore ','Outra','Mais']
  const r=revisarAtividade(q,'2027-03-01')
  assert.equal(r.pronto,null)
  assert.ok(r.erros.some(e=>e.campo==='opcoes'&&/diferentes/i.test(e.mensagem)))
})

test('atividade rejeita título vazio, alternativas faltantes, gabarito inválido e prazo anterior ao dia',()=>{
  const q=atividade()
  q.titulo='  ';q.opcoes=['A',' ','C','D'];q.correta=9;q.prazoEntrega='2027-02-28'
  const r=revisarAtividade(q,'2027-03-01')
  assert.equal(r.pronto,null)
  assert.deepEqual(new Set(r.erros.map(e=>e.campo)),new Set(['titulo','opcoes','correta','prazoEntrega']))
})

test('atividade não aceita publicação sem turma ou disciplina, nem datas inventadas',()=>{
  const q=atividade();q.turmaId=0;q.disciplina=' ';q.prazoEntrega='2027-02-30'
  const r=revisarAtividade(q,'2027-03-01')
  assert.equal(r.pronto,null)
  assert.ok(r.erros.some(e=>e.campo==='turma'))
  assert.ok(r.erros.some(e=>e.campo==='disciplina'))
  assert.ok(r.erros.some(e=>e.campo==='prazoEntrega'))
})

test('turma duplicada da mesma escola e ano é bloqueada, ignorando caixa',()=>{
  const r=validarTurma({codigo:'  QA27a ',nome:'Turma A',anoLetivo:2027},[
    {codigo:'qa27A',anoLetivo:2027}
  ])
  assert.equal(r.pronto,null)
  assert.ok(r.erros.some(e=>e.campo==='codigo'&&/existe/i.test(e.mensagem)))
})

test('turma com código existente em outro ano é permitida, depois de normalizar',()=>{
  const r=validarTurma({codigo:' 3A ',nome:'  Terceiro ano A  ',anoLetivo:2027},[
    {codigo:'3A',anoLetivo:2026}
  ])
  assert.deepEqual(r.erros,[])
  assert.deepEqual(r.pronto,{codigo:'3A',nome:'Terceiro ano A',anoLetivo:2027})
})

test('conta rejeita e-mail duplicado com maiúsculas e espaços',()=>{
  const r=validarConta({nome:'Maria',email:'  MARIA@EXAMPLE.COM ',senha:'longa-senha-123',papel:'ALUNO'},[
    {email:'maria@example.com'}
  ])
  assert.equal(r.pronto,null)
  assert.ok(r.erros.some(e=>e.campo==='email'&&/existe/i.test(e.mensagem)))
})

test('conta não aceita nome branco, e-mail inválido, senha fraca ou papel proibido',()=>{
  const r=validarConta({nome:' ',email:'sem-email',senha:'123',papel:'DIRECAO'},[])
  assert.equal(r.pronto,null)
  assert.deepEqual(new Set(r.erros.map(e=>e.campo)),new Set(['nome','email','senha','papel']))
})

test('conta válida preserva senha para transporte HTTPS mas nunca exige exibi-la na revisão',()=>{
  const r=validarConta({
    nome:'  Professora QA  ',email:' TESTE@EXAMPLE.COM ',senha:'senha-ficticia-2027',papel:'PROFESSOR',
  },[])
  assert.deepEqual(r.erros,[])
  assert.deepEqual(r.pronto,{
    nome:'Professora QA',email:'teste@example.com',senha:'senha-ficticia-2027',papel:'PROFESSOR',
  })
})
