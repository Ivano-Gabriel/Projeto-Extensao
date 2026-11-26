import test from 'node:test'
import assert from 'node:assert/strict'
import { passosDirecao, passosProfessor, progressoImplantacao } from '../src/portal/implantacao.ts'

test('direção sem cadastros mostra primeiro criar turma e progresso zero',()=>{
  const passos=passosDirecao({turmas:0,professores:0,alunos:0,matriculasNaTurma:0,vinculosNaTurma:0,avisosPublicados:0})
  assert.deepEqual(passos.map(p=>p.aba),['turmas','pessoas','vinculos','avisos'])
  assert.deepEqual(progressoImplantacao(passos),{concluidas:0,total:4,proximaAba:'turmas',completa:false})
})

test('direção só considera vínculo completo com aluno matriculado e docente ligado à mesma turma',()=>{
  const dados={turmas:1,professores:1,alunos:1,matriculasNaTurma:1,vinculosNaTurma:0,avisosPublicados:1}
  let passos=passosDirecao(dados)
  assert.equal(passos[2].concluida,false)
  assert.equal(progressoImplantacao(passos).proximaAba,'vinculos')
  passos=passosDirecao({...dados,vinculosNaTurma:1,matriculasNaTurma:0})
  assert.equal(passos[2].concluida,false)
  passos=passosDirecao({...dados,vinculosNaTurma:1})
  assert.deepEqual(progressoImplantacao(passos),{concluidas:4,total:4,proximaAba:null,completa:true})
})

test('professor sem turma não recebe falso sucesso nem incentivo para publicar',()=>{
  const passos=passosProfessor({turmas:0,disciplinaVinculada:false,atividadesNaTurma:0,avisosDoProfessor:0})
  assert.equal(passos[0].concluida,false)
  assert.equal(progressoImplantacao(passos).proximaAba,'turmas')
  assert.match(passos[0].descricao,/direção/i)
})

test('professor só vê etapa de publicação quando existe conteúdo persistido',()=>{
  let passos=passosProfessor({turmas:1,disciplinaVinculada:true,atividadesNaTurma:0,avisosDoProfessor:0})
  assert.equal(progressoImplantacao(passos).proximaAba,'atividades')
  assert.equal(passos[1].concluida,false)
  passos=passosProfessor({turmas:1,disciplinaVinculada:true,atividadesNaTurma:2,avisosDoProfessor:0})
  assert.equal(progressoImplantacao(passos).proximaAba,'mural')
  passos=passosProfessor({turmas:1,disciplinaVinculada:true,atividadesNaTurma:2,avisosDoProfessor:1})
  assert.equal(progressoImplantacao(passos).completa,true)
})

test('nenhum registro indica etapa concluída a partir de números negativos ou não finitos',()=>{
  const passos=passosDirecao({turmas:-1,professores:NaN,alunos:0,matriculasNaTurma:0,vinculosNaTurma:0,avisosPublicados:0})
  assert.ok(passos.every(p=>!p.concluida))
})

test('as etapas nunca dependem de nome, e-mail ou identidade do estudante',()=>{
  const diretor=passosDirecao({turmas:1,professores:1,alunos:2,matriculasNaTurma:1,vinculosNaTurma:1,avisosPublicados:1})
  const professor=passosProfessor({turmas:1,disciplinaVinculada:true,atividadesNaTurma:1,avisosDoProfessor:1})
  assert.equal(JSON.stringify({diretor,professor}).includes('@'),false)
  assert.equal(diretor.length,4)
  assert.equal(professor.length,3)
})
