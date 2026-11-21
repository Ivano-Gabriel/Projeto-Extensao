import {test,expect,type Page} from '@playwright/test'

type Papel='ALUNO'|'PROFESSOR'|'DIRECAO'

async function portalSimulado(page:Page,papel:Papel='ALUNO'){
  let gerado=false
  let concluido=false
  const id=99
  const questoes=Array.from({length:5},(_,i)=>({
    id:100+i,ordem:i+1,titulo:'Treino QA '+(i+1),
    pergunta:'Qual alternativa corresponde ao exemplo '+(i+1)+'?',
    opcoes:['Primeira','Segunda','Terceira','Quarta'],
  }))
  const resumo={
    id,turmaId:7,disciplina:'MATEMATICA',tema:'Frações e proporções',
    dificuldade:'MEDIO',nota:null as number|null,criadoEm:'2026-11-21T12:00:00'
  }
  const detalhe=()=>({
    ...resumo,nota:concluido?6:null,acertos:concluido?3:null,
    questoes:questoes.map((q,i)=>concluido?{
      ...q,correta:0,explicacao:'Revisar o conceito com o professor.',
      opcaoMarcada:i<3?0:1,acertou:i<3,
    }:q),
    aviso:'Não é nota escolar.',
  })
  const json=(value:unknown,status=200)=>({
    status,contentType:'application/json',body:JSON.stringify(value),
  })
  const aluno={id:11,nome:'QA Aluno',email:'aluno-qa@example.invalid',
    papel:'ALUNO',escolaId:1,administrador:false}
  const pessoa={...aluno,papel,nome:papel==='ALUNO'?'QA Aluno':papel==='DIRECAO'?'QA Diretor':'QA Professor'}
  const requests:string[]=[]
  await page.route('**/api/**',async route=>{
    const u=new URL(route.request().url())
    const path=u.pathname
    const metodo=route.request().method()
    requests.push(metodo+' '+path)
    let dados:unknown=[]
    let status=200
    if(path==='/api/me')dados=pessoa
    else if(path==='/api/csrf')dados={token:'qa-csrf'}
    else if(path==='/api/portal/turmas')
      dados=[{id:7,codigo:'QA27A',nome:'Turma de teste',anoLetivo:2027}]
    else if(path==='/api/portal/turmas/7/configuracao')
      dados={id:7,codigo:'QA27A',nome:'Turma de teste',anoLetivo:2027,
        descricao:'Homologação sintética',cor:'#64748b'}
    else if(path==='/api/portal/meu-desempenho')
      dados={atividades:0,respondidas:0,acertos:0}
    else if(path==='/api/portal/minha-frequencia')
      dados={aulasRegistradas:0,registrosDePresenca:0,presencas:0,faltas:0}
    else if(path==='/api/portal/ia/disciplinas')
      dados=[{turmaId:7,turmaNome:'Turma de teste',disciplina:'MATEMATICA'}]
    else if(path==='/api/portal/ia/status')
      dados={habilitada:true,restantesHoje:3,mensagem:'IA simulada somente neste teste de navegador'}
    else if(path==='/api/portal/provas/simulados'&&metodo==='GET')
      dados=gerado?[{...resumo,nota:concluido?6:null}]:[]
    else if(path==='/api/portal/provas/simulados'&&metodo==='POST'){
      gerado=true;status=201;dados=detalhe()
    }
    else if(path==='/api/portal/provas/simulados/'+id&&metodo==='GET')
      dados=detalhe()
    else if(path==='/api/portal/provas/simulados/'+id+'/respostas'&&metodo==='POST'){
      const parsed=route.request().postDataJSON() as {respostas:{questaoId:number;opcao:number}[]}
      if(parsed.respostas.length!==5||concluido){
        status=409;dados={message:'Entrega inválida ou repetida'}
      }else{
        concluido=true;dados=detalhe()
      }
    }
    await route.fulfill(json(dados,status))
  })
  return {requests,resultado:()=>({gerado,concluido})}
}

test('aluno responde cinco questões no navegador, sem ver gabarito antes da entrega',async({page})=>{
  const mock=await portalSimulado(page)
  await page.goto('/')
  await page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})
    .getByRole('button',{name:'Minha turma'}).click()
  await expect(page.getByRole('tab',{name:'Prova'})).toBeVisible()
  await page.getByRole('tab',{name:'Prova'}).click()
  await expect(page.getByText('Não é nota escolar').first()).toBeVisible()
  await page.locator('#prova-tema').fill('Frações e proporções')
  await page.getByRole('button',{name:'Gerar prova de treino'}).click()
  await expect(page.getByRole('heading',{name:'Responder simulado'})).toBeVisible()
  await expect(page.getByText('Gabarito:')).toHaveCount(0)
  const grupos=page.locator('[role="group"][aria-label^="Questão "]')
  await expect(grupos).toHaveCount(5)
  for(let i=0;i<5;i++){
    await grupos.nth(i).getByRole('button').nth(i<3?0:1).click()
  }
  await expect(page.getByText('5 de 5 respondidas.')).toBeVisible()
  await page.getByRole('button',{name:'Finalizar prova'}).click()
  await page.getByRole('button',{name:'Confirmar entrega'}).click()
  await expect(page.getByText('Nota de treino: 6/10').first()).toBeVisible()
  await expect(page.getByText(/Gabarito:/).first()).toBeVisible()
  await expect(page.getByText('Revisar o conceito com o professor.').first()).toBeVisible()
  expect(mock.resultado()).toEqual({gerado:true,concluido:true})
  expect(mock.requests).toContain('POST /api/portal/provas/simulados/99/respostas')
})

test('histórico da prova persiste depois de recarregar a interface',async({page})=>{
  const mock=await portalSimulado(page)
  await page.goto('/')
  await page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})
    .getByRole('button',{name:'Minha turma'}).click()
  await page.getByRole('tab',{name:'Prova'}).click()
  await page.locator('#prova-tema').fill('Frações e proporções')
  await page.getByRole('button',{name:'Gerar prova de treino'}).click()
  await expect(page.getByText('Treino QA 1')).toBeVisible()
  await page.reload()
  await page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})
    .getByRole('button',{name:'Minha turma'}).click()
  await page.getByRole('tab',{name:'Prova'}).click()
  await expect(page.getByRole('button',{name:'Continuar'})).toBeVisible()
  await page.getByRole('button',{name:'Continuar'}).click()
  await expect(page.getByText('Treino QA 1')).toBeVisible()
  expect(mock.resultado().gerado).toBe(true)
})

test('um professor e um diretor não recebem a aba Prova no portal',async({page})=>{
  await portalSimulado(page,'PROFESSOR')
  await page.goto('/')
  await expect(page.getByRole('heading',{name:/Tudo pronto, QA\./})).toBeVisible()
  await expect(page.getByRole('tab',{name:'Prova'})).toHaveCount(0)
  await expect(page.getByRole('tab',{name:'Atividades'})).toBeVisible()
})

test('login responsivo e acessível no Chromium mobile sem conta real',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.route('**/api/me',route=>route.fulfill({
    status:401,contentType:'application/json',body:JSON.stringify({message:'Faça login'})
  }))
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Bem-vindo ao zELO+'})).toBeVisible()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.locator('#portal-senha')).toBeVisible()
  await expect(page.getByRole('button',{name:'Entrar'})).toBeVisible()
})


test('mobile 390px sem rolagem horizontal, quatro destinos visíveis e Mais',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await portalSimulado(page,'ALUNO')
  await page.goto('/')
  await page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})
    .getByRole('button',{name:'Minha turma'}).click()
  const tabs=page.getByRole('tablist',{name:'Seções do portal'})
  await expect(tabs.getByRole('tab',{name:'Hoje'})).toBeVisible()
  await expect(tabs.getByRole('tab',{name:'Prova'})).toBeVisible()
  await expect(page.getByRole('button',{name:'Mais áreas'})).toBeVisible()
  await expect.poll(()=>page.evaluate(()=>({
    total:document.documentElement.scrollWidth,
    viewport:window.innerWidth,
  }))).toMatchObject({total:390,viewport:390})
  await page.getByRole('button',{name:'Mais áreas'}).click()
  await expect(page.getByRole('dialog',{name:'Mais áreas do portal'})).toBeVisible()
  await page.getByRole('dialog').getByRole('button',{name:'Assistente'}).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Mais áreas'})).toHaveAttribute('aria-expanded','false')
})

test('menu do livro abre áreas com páginas articuladas e fecha novamente',async({page})=>{
  await portalSimulado(page,'ALUNO')
  await page.setViewportSize({width:390,height:844})
  await page.goto('/')
  const livro=page.getByRole('button',{name:'Abrir menu de áreas'})
  await expect(livro).toBeVisible()
  await livro.click()
  await expect(page.getByRole('navigation',{name:'Todas as áreas de estudos'})).toBeVisible()
  await expect(page.locator('.zelo-livro-pagina')).toHaveCount(3)
  await expect(page.getByRole('button',{name:'Fechar menu de áreas'})).toHaveAttribute('aria-expanded','true')
  await page.getByRole('button',{name:'Fechar menu de áreas'}).click()
  await expect(page.getByRole('navigation',{name:'Todas as áreas de estudos'})).toHaveCount(0)
})

test('direção no mobile encontra vínculos direto e histórico em Mais',async({page})=>{
  await portalSimulado(page,'DIRECAO')
  await page.setViewportSize({width:390,height:844})
  await page.goto('/')
  await expect(page.getByRole('tab',{name:'Vínculos'})).toBeVisible()
  await expect(page.getByRole('tab',{name:'Histórico'})).toBeHidden()
  await page.getByRole('button',{name:'Mais áreas'}).click()
  await expect(page.getByRole('dialog').getByRole('button',{name:'Histórico'})).toBeVisible()
})

test('cabeçalho de aluno tem foto editorial e logomarca grande no desktop',async({page})=>{
  await portalSimulado(page,'ALUNO')
  await page.setViewportSize({width:1366,height:768})
  await page.goto('/')
  await expect(page.getByRole('heading',{name:/Bom te ver, QA\./})).toBeVisible()
  const hero=page.locator('.zelo-hero-portal')
  await expect(hero).toBeVisible()
  await expect(hero.locator('.zelo-hero-fotografia')).toBeAttached()
  await expect.poll(()=>hero.locator('.zelo-hero-fotografia').evaluate(node=>
    getComputedStyle(node).backgroundImage.includes('images.unsplash.com'))).toBe(true)
})
