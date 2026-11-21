import {test,expect,type Page} from '@playwright/test'
type Papel='ALUNO'|'PROFESSOR'|'DIRECAO'
async function entrar(page:Page,papel:Papel){
  const email=process.env['QA_'+papel+'_EMAIL'],senha=process.env['QA_'+papel+'_SENHA']
  if(!email||!senha)throw new Error('Configure somente contas sintéticas nos GitHub Actions Secrets.')
  await page.goto('/')
  await expect(page.locator('#portal-email')).toBeVisible()
  await page.locator('#portal-email').fill(email)
  await page.locator('#portal-senha').fill(senha)
  await page.getByRole('button',{name:'Entrar',exact:true}).click()
  if(papel==='ALUNO')
    await expect(page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})).toBeVisible()
  else
    await expect(page.locator('.portal-hero')).toBeVisible()
}

test('aluno QA ve sua prova e historico apos F5, sem acesso da direção',async({page})=>{
  await entrar(page,'ALUNO')
  await page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})
    .getByRole('button',{name:'Minha turma'}).click()
  await expect(page.getByRole('tab',{name:'Prova'})).toBeVisible()
  await expect(page.getByRole('tab',{name:'Histórico'})).toHaveCount(0)
  await page.getByRole('tab',{name:'Prova'}).click()
  await expect(page.getByRole('heading',{name:'Prova · Preparação individual'})).toBeVisible()
  await expect(page.getByText('Não é nota escolar').first()).toBeVisible()
  await page.reload()
  await page.getByRole('navigation',{name:'Navegação da ferramenta de estudos'})
    .getByRole('button',{name:'Minha turma'}).click()
  await expect(page.getByRole('tab',{name:'Prova'})).toBeVisible()
})

test('professor QA entra em Materiais e IA sem acessos exclusivos da direção',async({page})=>{
  await entrar(page,'PROFESSOR')
  await expect(page.getByRole('tab',{name:'Materiais e IA'})).toBeVisible()
  await expect(page.getByRole('tab',{name:'Pessoas'})).toHaveCount(0)
  await expect(page.getByRole('tab',{name:'Prova'})).toHaveCount(0)
})

test('direção QA pode consultar diagnóstico da IA sem exposição de segredos',async({page})=>{
  await entrar(page,'DIRECAO')
  await expect(page.getByRole('tab',{name:'Histórico'})).toBeVisible()
  await expect(page.getByRole('tab',{name:'Prova'})).toHaveCount(0)
  const resposta=await page.request.get('/api/gestao/ia/diagnostico')
  expect(resposta.status()).toBe(200)
  const dados=await resposta.json()
  expect(typeof dados.chaveConfigurada).toBe('boolean')
  expect(typeof dados.professorHabilitado).toBe('boolean')
  expect(typeof dados.alunoHabilitado).toBe('boolean')
  expect(dados).not.toHaveProperty('token')
  expect(dados).not.toHaveProperty('chave')
})
