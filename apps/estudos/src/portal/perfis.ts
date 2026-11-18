import type { UsuarioEscolar } from './api'

export type AreaPortal = 'ALUNO' | 'PROFESSOR' | 'DIRECAO' | 'ADMIN'
export type CategoriaVisual = 'aluno' | 'funcionario'

export function areaDoUsuario(usuario: UsuarioEscolar): AreaPortal {
  if (!['ALUNO','PROFESSOR','DIRECAO'].includes(usuario.papel))
    throw new Error('Perfil de usuário inválido.')
  if (usuario.administrador === true) return 'ADMIN'
  return usuario.papel
}

export function categoriaDoUsuario(usuario: UsuarioEscolar): CategoriaVisual {
  return areaDoUsuario(usuario)==='ALUNO'?'aluno':'funcionario'
}
