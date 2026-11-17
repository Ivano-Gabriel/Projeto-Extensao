# Projeto de Extensão — arquitetura e caminho para piloto

> **Status em 17/11/2026:** proposta 3 foi escolhida pelos estudantes. O protótipo React funciona com dados fictícios. O backend Spring Boot tem autenticação e papéis, **mas não está integrado** ao app escolhido. Não usar registros de crianças reais na demonstração.

## 1. Nosso produto, a partir da voz dos alunos

**Para o aluno:** conteúdos curtos, quizzes, plano semanal, frequência por disciplina e período, notas, mensagens docentes, lembretes e um espaço para feedback. Priorizar celular, linguagem simples e acessibilidade.

**Para o professor:** publicar conteúdo e avisos **somente para turmas vinculadas**, cadastrar materiais e consultar o necessário ao seu trabalho, sem poder navegar por dados de outros alunos.

**Para a direção:** administrar usuários, vínculos e calendário, autorizar acesso e auditar ajustes em registros oficiais. Dados reais dependem de autorização institucional.

Não confundir o **foguinho de estudo** com frequência oficial. A intenção "Vou amanhã" não é chamada. Notas simuladas não representam aprovação. O app não decide elegibilidade nem pagamento do Pé-de-Meia.

## 2. Estado atual (confirmado no repositório)

| Área | Situação | Limitação |
|---|---|---|
| Estudos: materiais + quiz | Protótipo navegável | Conteúdo fictício, não validado por docentes |
| Estudo: progresso e sequência | localStorage | Não sincroniza entre aparelhos |
| Escola: notas/frequência | Dados fictícios gerados no frontend | Não integrado a diário escolar |
| Feed do professor | Publicações fictícias | Não há login/publicação real |
| Feedback | Rascunho local copiável | Não envia para equipe/escola |
| Modo escuro/offline | Tema local e Service Worker no build | Requer QA em iOS/Android e conexão inicial |
| Backend | Java 21, Spring Boot, Spring Security e Flyway | Perfis base; **sem turma/matrícula/diário** |
| Infra/deploy | Repositório com Vite e Java | Nenhum deploy produtivo/DB homologado por este documento |

## 3. Limites de arquitetura

```text
[Apps]
  apps/estudos (React + TypeScript + Vite, mobile first)
  apps/web, apps/biblioteca (protótipos de referência, preservados)
        |
        | FUTURO: HTTPS /api no mesmo domínio + cookie de sessão HttpOnly
        v
[Backend/ Spring Boot] -> autenticação -> autorização por papel + VÍNCULO com turma
        |
        | Flyway, transações, trilha de auditoria, backups
        v
[PostgreSQL gerenciado por escola/projeto, SOMENTE após homologação]
```

**Regra:** frontend nunca define o papel nem decide sozinho quais dados escolares podem ser vistos. Verificações de aluno/turma/disciplina são feitas em toda operação no backend. Não expor sessão/token em localStorage. Não publicar API sem revisão específica.

### Contratos conceituais sugeridos (não implementados)

| Entidade | Campos essenciais | Condição de acesso |
|---|---|---|
| Escola | id, nome, fuso, calendário | Direção da escola |
| Turma | id, escolaId, nome, turno | Direção / docentes vinculados |
| Matrícula | alunoId, turmaId, período, estado | Aluno próprio, direção |
| ComponenteCurricular | id, escolaId, cargaHorária, ano | Turma e direção |
| VínculoDocente | professorId, turmaId, componenteId | Direção administra |
| Aula | id, turmaId, componenteId, início, duraçãoMinutos, situação | Professor vinculado |
| Presença | aulaId, alunoId, minutosPresentes, situação, justificativa | Professor vinculado altera; aluno próprio lê |
| Avaliação | id, componenteId, turmaId, peso, período, regra | Professor vinculado |
| Nota | avaliaçãoId, alunoId, valor, revisão/histórico | Professor vinculado altera; aluno próprio lê |
| Publicação | id, autorId, turmaId, assunto, corpo, data | Professor vinculado publica; turma lê |
| Material | id, autorId, componenteId, visibilidade, revisão | Professor vinculado publica |
| Feedback | id, tipo, corpo, criadoEm, destino | Política e moderação aprovadas previamente |

Separar IDs de aluno e professor do nome apresentado. Campos de presença/nota devem ter autoria, instante da mudança e trilha de correção. Não criar calendário escolar a partir de suposições do app: feriados, reposições, semanas e cargas horárias precisam vir da escola.

### API possível (projeto de contrato, não endpoints disponíveis)

- `GET /api/me`: sessão atual, papel e permissões (já existe no backend base).
- `GET /api/minhas-turmas`: turmas autorizadas por sessão.
- `GET /api/me/frequencia?periodo=YYYY-MM`: somente do aluno autenticado.
- `GET /api/me/notas`: somente do aluno autenticado.
- `GET /api/turmas/{id}/feed`: verifica vínculo antes de listar.
- `POST /api/turmas/{id}/publicacoes`: somente professor vinculado, corpo validado.
- `POST /api/aulas/{id}/presencas`: somente professor vinculado, auditoria obrigatória.
- `POST /api/feedback`: apenas após política de privacidade, moderação e limites de abuso.

Os caminhos acima **não estão implementados**. Antes de qualquer endpoint, acordar as regras com a escola, implementar autorização no servidor e cobrir 401/403/testes de acesso indevido.

## 4. Segurança e proteção de menores — antes do piloto real

1. Obter autorização da instituição e definir responsáveis pela gestão, finalidade e prazo de retenção, considerando LGPD e direitos de crianças/adolescentes.
2. Ter contas reais apenas quando o fluxo de recuperação, revogação, acesso por turma, auditoria e implantação estiver revisado.
3. **Nunca** pedir CPF, endereço, telefone, dados de saúde ou publicar lista de alunos em feed público.
4. Dados acadêmicos precisam de acesso restrito, não armazenados no cache offline de conteúdo público. Cache de PWA apenas de assets e material não pessoal.
5. Feedback real exige processo de moderação e encaminhamento responsável. Mensagens e imagens públicas requerem revisão.
6. Não permitir que estudantes alterem presenças e notas oficiais; apenas registros de organização pessoal.
7. Exigir backup/restore testado, monitoramento, gerenciamento de segredos fora do Git e ambientes separados.
8. Antes de usar IA: nenhuma transferência de dados pessoais de menores a provedores sem análise e autorização específicas.

## 5. Entregas propostas em PRs pequenos

| Etapa | Entrega e critério para aceitar |
|---|---|
| A — Qualidade do repositório | CI nos apps e API, documentação, revisão por PR, comandos reproduzíveis |
| B — Planejador local | Criar tarefa, escolher data/matéria, concluir, excluir; validação e persistência com testes |
| C — Professor demonstrativo | Criar/gerenciar posts **fictícios, neste aparelho**, sem simular privilégio real |
| D — Coleta de feedback com a escola | Roteiro de 5–8 tarefas, indicadores de compreensão e problemas de acessibilidade |
| E — Contratos e base de dados | Modelos de turma e matrícula, migrations, testes de acesso cross-turma |
| F — Integração segura | CSRF/cookies em origem única, API real, supervisão da escola, dados autorizados |
| G — Piloto de verdade | Homologação, termo/documentação, retenção, suporte, backup e validação com alunos/docentes |

**Critério mínimo de homologação:** `npm ci && npm test && npm run build`, testes Maven, revisão de permissão, teste mobile com teclado, QA offline, consentimentos apropriados, nenhuma identificação pessoal na demo.

## 6. Coleta de feedback simples com os estudantes

Roteiro de sessão de 10–15 min, sem coletar nome nem nota real:
1. Ache um material de estudo e abra um resumo.
2. Faça uma questão e diga se o feedback ajudou.
3. Crie um plano pra revisar uma matéria e conclua uma tarefa.
4. Localize a área de frequência e explique o que o percentual significa.
5. Encontre o post de um professor e diga como gostaria de receber avisos.
6. Ative o modo escuro, navegue sem mouse e teste textos/tamanhos.
7. Conte o que confunde e o que falta; registre apenas feedback anonimizado com autorização da escola.

Documentar achados como **problema observado → impacto → prioridade → correção → reteste**. Evitar prometer benefícios ou alertas governamentais automáticos.
