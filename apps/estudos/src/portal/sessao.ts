import { ErroApi, type UsuarioEscolar } from './api.ts'
import { areaDoUsuario } from './perfis.ts'

export function paginaDoUsuario(usuario:UsuarioEscolar): 'estudos'|'funcionarios' {
  return areaDoUsuario(usuario)==='ALUNO'?'estudos':'funcionarios'
}

export function erroNaVerificacaoDeSessao(erro:unknown):'login'|'indisponivel' {
  return erro instanceof ErroApi && erro.status===401?'login':'indisponivel'
}
