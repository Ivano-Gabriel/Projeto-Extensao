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
  await page.getByRole('button',{name:'Abrir menu de áreas'}).click()
  await page.getByRole('navigation',{name:'Todas as áreas de estudos'})
    .getByRole('button',{name:/Minha turma/}).click()
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

test('hub com livro simples abre as áreas e fecha novamente',async({page})=>{
  await portalSimulado(page,'ALUNO')
  await page.setViewportSize({width:390,height:844})
  await page.goto('/')
  const livro=page.getByRole('button',{name:'Abrir menu de áreas'})
  await expect(livro).toBeVisible()
  await livro.click()
  await expect(page.getByRole('navigation',{name:'Todas as áreas de estudos'})).toBeVisible()
  await expect(page.locator('.zelo-hub-v4-emblema')).toBeVisible()
  await expect(page.locator('.zelo-livro-pagina')).toHaveCount(0)
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
  await page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})
    .getByRole('button',{name:'Minha turma'}).click()
  await expect(page.getByRole('heading',{name:/Bom te ver, QA\./})).toBeVisible()
  const hero=page.locator('.zelo-hero-portal')
  await expect(hero).toBeVisible()
  await expect(hero.locator('.zelo-hero-fotografia')).toBeAttached()
  await expect.poll(()=>hero.locator('.zelo-hero-fotografia').evaluate(node=>
    getComputedStyle(node).backgroundImage.includes('images.unsplash.com'))).toBe(true)
})


for (const perfil of ['DIRECAO','PROFESSOR'] as const){
  test(perfil+' exibe sidebar de desktop e ações com contraste suficiente',async({page})=>{
    await portalSimulado(page,perfil)
    await page.setViewportSize({width:900,height:800})
    await page.goto('/')
    const painel=page.locator(perfil==='DIRECAO'?'.zelo-direcao':'.zelo-professor')
    const nav=painel.locator('.zelo-nav-direta')
    await expect(nav).toBeVisible()
    await expect.poll(()=>nav.evaluate(el=>getComputedStyle(el).position)).toBe('sticky')
    await expect(painel.getByRole('button',{name:'Mais áreas'})).toBeHidden()
    await expect(painel.getByRole('tab',{name:perfil==='DIRECAO'?'Histórico':'Resultados'})).toBeVisible()
    const layout=await painel.evaluate(el=>getComputedStyle(el).gridTemplateColumns)
    expect(layout.trim().split(/\s+/).length).toBe(2)
    const botoes=painel.locator('.zelo-destaque-tarefa .botao-principal, .zelo-destaque-tarefa .botao-secundario')
    await expect(botoes.first()).toBeVisible()
    for(let i=0;i<await botoes.count();i++){
      const cores=await botoes.nth(i).evaluate(el=>{
        const s=getComputedStyle(el)
        return {fg:s.color,bg:s.backgroundColor}
      })
      const rgb=(s:string)=>s.match(/[\d.]+/g)?.slice(0,3).map(Number)??[0,0,0]
      const L=(v:number)=>{const s=v/255;return s<=.04045?s/12.92:Math.pow((s+.055)/1.055,2.4)}
      const luminancia=(s:string)=>rgb(s).reduce((acc,c,k)=>acc+c*0+(k===0?.2126:k===1?.7152:.0722)*L(c),0)
      const a=luminancia(cores.fg),b=luminancia(cores.bg)
      expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThanOrEqual(4.5)
    }
  })
  test(perfil+' no celular mantém navegação fixa legível e modal sem cortes',async({page})=>{
    await portalSimulado(page,perfil)
    await page.setViewportSize({width:390,height:844})
    await page.goto('/')
    const painel=page.locator(perfil==='DIRECAO'?'.zelo-direcao':'.zelo-professor')
    const nav=painel.locator('.zelo-nav-direta')
    await expect(nav).toBeVisible()
    await expect.poll(()=>nav.evaluate(el=>getComputedStyle(el).position)).toBe('fixed')
    await expect(painel.getByRole('button',{name:'Mais áreas'})).toBeVisible()
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBe(0)
    await painel.getByRole('button',{name:'Mais áreas'}).click()
    const modal=page.getByRole('dialog',{name:'Mais áreas do portal'})
    await expect(modal).toBeVisible()
    const bounds=await modal.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(844)
  })
}


test('login mobile preserva o livro animado com texto e não fecha automaticamente',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.route('**/api/me',route=>route.fulfill({
    status:401,contentType:'application/json',body:'{"erro":"Faça login"}'
  }))
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Bem-vindo ao zELO+'})).toBeVisible()
  const arte=page.locator('.entrada-login .prime-login-arte')
  await expect(arte).toBeVisible()
  await expect(page.locator('.prime-book-page')).toHaveCount(4)
  await expect(page.locator('.prime-book-renovacao')).toContainText('Novas ideias')
  await expect.poll(()=>page.locator('.prime-book-page-one').evaluate(el=>
    getComputedStyle(el).animationIterationCount)).toContain('1')
  const dimensoes=await arte.boundingBox()
  expect(dimensoes).not.toBeNull()
  expect(dimensoes!.width).toBeGreaterThan(150)
  await expect(page.getByRole('button',{name:'Entrar'})).toBeVisible()
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBe(0)
})

test('Minha turma aparece primeiro e usa publicações do servidor, sem conteúdo inventado',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await portalSimulado(page,'ALUNO')
  await page.route('**/api/portal/atividades',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify([{
      id:321,turmaId:7,disciplina:'MATEMATICA',titulo:'Atividade real do professor',
      pergunta:'Qual é o resultado?',opcoes:['1','2','3','4'],prazoEntrega:null
    }])
  }))
  await page.route('**/api/portal/avisos',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify([{
      id:25,turmaId:7,publico:'ALUNOS',titulo:'Aviso da professora',
      texto:'Trazer o caderno na segunda.',importante:true,
      criadoEm:'2026-11-21T12:00:00',autorId:44,autorNome:'Professora QA',autorPapel:'PROFESSOR'
    }])
  }))
  await page.goto('/')
  const destaque=page.locator('.prime-turma-real')
  await expect(destaque).toBeVisible()
  await expect(destaque).toContainText('QA27A')
  await expect(destaque).toContainText('1 atividade pendente')
  await expect(destaque).toContainText('Aviso da professora')
  await page.getByRole('button',{name:'Abrir minha turma'}).click()
  await expect(page.getByRole('heading',{name:'Sua turma em primeiro lugar'})).toBeVisible()
  const vitrine=page.locator('.zelo-turma-vitrine')
  await expect(vitrine).toContainText('Aviso da professora')
  await expect(vitrine).toContainText('Professora QA')
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBe(0)
})


for (const perfilNav of ['ALUNO','PROFESSOR','DIRECAO'] as const){
  test(perfilNav+' usa cinco posições no celular e sidebar no desktop em larguras de transição',async({page})=>{
    await portalSimulado(page,perfilNav)
    for(const width of [320,390,840,899,900,1024]){
      await page.setViewportSize({width,height:820})
      await page.goto('/')
      if(perfilNav==='ALUNO'){
        if(width<900)await page.getByRole('button',{name:'Minha turma'}).click()
        else await page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})
          .getByRole('button',{name:'Minha turma'}).click()
      }
      const painel=page.locator(perfilNav==='ALUNO'?'.zelo-aluno':perfilNav==='PROFESSOR'?'.zelo-professor':'.zelo-direcao')
      const nav=painel.locator('.zelo-nav-v4')
      await expect(nav).toBeVisible()
      if(width<900){
        await expect(nav).toHaveCSS('position','fixed')
        const positions=await nav.locator('.zelo-nav-principal, .zelo-nav-mais')
          .evaluateAll(elements=>elements.filter(el=>getComputedStyle(el).display!=='none')
            .map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}))
        expect(positions).toHaveLength(5)
        for(let i=0;i<positions.length;i++){
          expect(positions[i].left).toBeGreaterThanOrEqual(-1)
          expect(positions[i].right).toBeLessThanOrEqual(width+1)
          expect(positions[i].bottom).toBeLessThanOrEqual(821)
          if(i>0)expect(positions[i].left).toBeGreaterThanOrEqual(positions[i-1].right-2)
        }
        await painel.getByRole('button',{name:'Mais áreas'}).click()
        const modal=page.getByRole('dialog',{name:'Mais áreas do portal'})
        await expect(modal).toBeVisible()
        await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).toBe('hidden')
        const bounds=await modal.boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds!.y).toBeGreaterThanOrEqual(-1)
        expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(821)
        await page.keyboard.press('Escape')
        await expect(modal).toHaveCount(0)
        await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden')
      }else{
        await expect(nav).toHaveCSS('position','sticky')
        await expect(nav.getByRole('button',{name:'Mais áreas'})).toBeHidden()
        await expect(nav.getByRole('tab',{name:perfilNav==='ALUNO'?'Avisos':perfilNav==='PROFESSOR'?'Mural':'Histórico'})).toBeVisible()
      }
    }
  })
}
