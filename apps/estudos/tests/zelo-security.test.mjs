import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const ler=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('portal permite trocar a propria senha sem expor reset por email inexistente',()=>{
  assert.match(ler('src/portal/Portal.tsx'),/SegurancaConta/)
  const tela=ler('src/portal/SegurancaConta.tsx')
  assert.match(tela,/autoComplete="current-password"/)
  assert.match(tela,/autoComplete="new-password"/)
  assert.match(tela,/apiEscolar.trocarSenha/)
  assert.match(tela,/recuperação por e-mail ainda não está disponível/)
  assert.match(ler('src/portal/api.ts'),/\/api\/me\/senha/)
})
test('direcao consulta trilha de auditoria com escopo escolar',()=>{
  const ui=ler('src/portal/DirecaoPainel.tsx')
  assert.match(ui,/apiEscolar.auditoria/)
  assert.match(ui,/AuditoriaEscola/)
})
