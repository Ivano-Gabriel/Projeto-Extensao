import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8')
const app=read('src/App.tsx')
const login=read('src/portal/PortalLogin.tsx')
const portal=read('src/portal/Portal.tsx')
const index=read('../index.html')
const manifest=JSON.parse(read('public/manifest.webmanifest'))
const worker=read('public/sw.js')
const brand=read('src/marca/ZeloMarca.tsx')

test('zELO+ identifica login, cabecalho escolar e portal sem remover o aviso de demo',()=>{
  assert.match(login,/zELO\+/)
  assert.match(portal,/ZeloMarca/)
  assert.match(app,/ZeloMarca/)
  assert.doesNotMatch(login,/Bem-vindo ao Extens[aã]o/)
  assert.doesNotMatch(app,/PROJETO EXTENS[AÃ]O|<strong>Extens[aã]o<\/strong>/)
  assert.match(app,/Laborat[oó]rio \(demo\)/)
})

test('identidade PWA usa a nova marca com assets separados por tamanho e atualiza cache',()=>{
  assert.equal(manifest.name,'zELO+ — Plataforma escolar')
  assert.equal(manifest.short_name,'zELO+')
  assert.deepEqual(manifest.icons.filter(icon=>icon.type==='image/png').map(x=>x.sizes),['192x192','512x512'])
  assert.match(index,/<title>zELO\+/)
  assert.match(index,/zelo-icon-192\.png/)
  assert.match(worker,/zelo-icon-192\.png/)
  assert.match(worker,/zelo-icon-512\.png/)
  assert.match(worker,/zelo-wordmark\.svg/)
  assert.doesNotMatch(worker,/extensao-estudos-v3/)
})

test('logo responsiva preserva nome acessivel e arquivo grafico da marca',()=>{
  assert.match(brand,/zELO\+/)
  assert.match(brand,/aria-label|alt=/)
  assert.match(brand,/zelo-wordmark\.svg/)
})

test('relatorios e roteiros distinguem dados reais, demo e requisitos pendentes',()=>{
  const relatorio=read('../docs/TRABALHO-ACADEMICO-ZELO.md')
  const homologacao=read('../docs/HOMOLOGACAO-ZELO.md')
  const plano=read('../docs/PLANO-INSTITUCIONAL-ZELO.md')
  for(const word of ['Objetivos','Metodologia','Arquitetura','Resultados','Limitações'])
    assert.ok(relatorio.includes(word),'Falta seção: '+word)
  for(const word of ['Direção','Professor','Aluno','CSRF','matrícula','evidência'])
    assert.ok(homologacao.toLowerCase().includes(word.toLowerCase()),'Falta: '+word)
  assert.match(plano,/LGPD/)
  assert.match(plano,/acessibilidade/)
  assert.match(plano,/licita[cç][aã]o|contrata[cç][aã]o/i)
  assert.match(plano,/piloto/)
})
