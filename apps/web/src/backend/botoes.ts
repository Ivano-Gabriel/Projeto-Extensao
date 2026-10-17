/**
 * Mapa de botões: o que cada botão do app faz hoje (protótipo com banco local)
 * e qual chamada de API vai assumir o papel dele no backend Spring Boot.
 * A aba "Botões" da página de backend lê esta lista; ao criar um botão novo, registre-o aqui.
 */
export type BotaoInfo = {
  tela: string
  botao: string
  funcao: string
  api: string
  estado: 'ativo' | 'planejado'
}

export const botoes: BotaoInfo[] = [
  { tela: 'Login', botao: 'Entrar como aluno', funcao: 'Abre o painel do aluno. Ainda não valida e-mail e senha.', api: 'POST /api/auth/login', estado: 'planejado' },
  { tela: 'Topo', botao: 'Sino de notificações', funcao: 'Abre a tela Avisos. O ponto vermelho aparece enquanto houver aviso não lido.', api: 'GET /api/compromissos?tipo=Aviso&status=pendente', estado: 'ativo' },
  { tela: 'Início', botao: 'Ver tudo', funcao: 'Abre a Agenda com todos os compromissos.', api: 'GET /api/compromissos', estado: 'ativo' },
  { tela: 'Início / Agenda / Avisos', botao: 'Seta de abrir', funcao: 'Abre a ficha do item com título, disciplina, data e status.', api: 'GET /api/compromissos/{id}', estado: 'ativo' },
  { tela: 'Ficha do item', botao: 'Marcar como concluído / lido', funcao: 'Alterna o status entre pendente e concluído. Atualiza contadores e o radar da semana.', api: 'PATCH /api/compromissos/{id}/status', estado: 'ativo' },
  { tela: 'Ficha do item', botao: 'Excluir', funcao: 'Remove o item do banco, depois de pedir confirmação.', api: 'DELETE /api/compromissos/{id}', estado: 'ativo' },
  { tela: 'Agenda', botao: 'Filtros (Todos, Provas, Trabalhos, Avisos)', funcao: 'Filtra a lista pelo tipo. Só afeta a tela, não altera o banco.', api: 'GET /api/compromissos?tipo={tipo}', estado: 'ativo' },
  { tela: 'Menu inferior', botao: 'Início, Agenda, Avisos, Perfil', funcao: 'Troca de tela sem recarregar a página.', api: 'Nenhuma (navegação local)', estado: 'ativo' },
  { tela: 'Perfil', botao: 'Painel do backend', funcao: 'Abre esta página de administração do banco.', api: 'Nenhuma (restringir a direção quando houver login real)', estado: 'ativo' },
  { tela: 'Perfil', botao: 'Sair', funcao: 'Volta para o login.', api: 'POST /api/auth/logout', estado: 'planejado' },
  { tela: 'Backend', botao: 'Salvar / Adicionar', funcao: 'Cria um compromisso novo ou grava a edição de um existente.', api: 'POST /api/compromissos · PUT /api/compromissos/{id}', estado: 'ativo' },
  { tela: 'Backend', botao: 'Editar', funcao: 'Carrega a linha no formulário para alterar.', api: 'GET /api/compromissos/{id}', estado: 'ativo' },
  { tela: 'Backend', botao: 'Concluir / Reabrir', funcao: 'Alterna o status do item direto na tabela.', api: 'PATCH /api/compromissos/{id}/status', estado: 'ativo' },
  { tela: 'Backend', botao: 'Excluir', funcao: 'Apaga a linha, depois de pedir confirmação.', api: 'DELETE /api/compromissos/{id}', estado: 'ativo' },
  { tela: 'Backend', botao: 'Restaurar dados de exemplo', funcao: 'Apaga tudo e recria os 7 compromissos de demonstração. Rota de administração, só para desenvolvimento.', api: 'POST /api/admin/restaurar', estado: 'ativo' },
  { tela: 'Backend', botao: 'Copiar SQL', funcao: 'Copia o esquema do banco para a área de transferência.', api: 'Nenhuma', estado: 'ativo' },
]
