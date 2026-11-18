# Portal Escolar — integração real

O app `apps/estudos` continua oferecendo materiais e exercícios de demonstração sem autenticação. **Portal escolar** é uma nova área independente que usa a API Java com sessão e autorização reais.

## Endereços e fluxo
- Frontend: `https://extensao-estudos.vercel.app`, root Vercel `apps/estudos`
- API de homologação: `https://extensao-api-staging.onrender.com`
- Proxy de mesma origem: `/api/:path*` no arquivo `apps/estudos/vercel.json`. O navegador **não** chama o domínio Render diretamente; cookies Secure+HttpOnly e CSRF ficam no domínio do frontend.
- Aluno: login, próprias turmas, atividades atribuídas, respostas e explicações.
- Professor: próprias turmas, formulário de publicação de atividades, consulta das próprias atividades.
- Direção: próprias turmas, cadastro de alunos/professores, matrículas e vínculos docentes por disciplina.
- Super-ADM: escolas da plataforma e vinculação de direções, sem acesso global irrestrito aos dados dos alunos.

## Segurança
- Não há registro público de aluno, seleção de papel por botão, usuário demo nem senha embutida no frontend.
- Login exige conta criada por uma autoridade autorizada. O backend verifica escola e turma em cada requisição.
- Tokens CSRF obtidos de `GET /api/csrf` antes de cada POST; cookie de sessão é HttpOnly e Secure. Nunca persista senhas ou sessões em localStorage.
- API retorna atividades **sem gabarito**; a explicação vem após uma resposta gravada no banco.
- O frontend não autoriza nada sozinho; todos os endpoints relevantes negam acessos indevidos.
- Os dados da demonstração não são registros oficiais da escola; notas e frequência ainda não estão no backend real.

## Como homologar
1. Confirmar `GET /healthz` no Render e migrações Flyway no log.
2. Rotacionar credenciais do PostgreSQL antes de criar contas, já que uma credencial apareceu em log anterior.
3. Configurar no Render `APP_BOOTSTRAP_ADMIN=true`, `APP_BOOTSTRAP_ADMIN_EMAIL`, `APP_BOOTSTRAP_ADMIN_NAME` e uma senha **forte, exclusiva, >=16 caracteres** em `APP_BOOTSTRAP_ADMIN_PASSWORD`. O bootstrap só cria usuário quando a tabela ainda está vazia. Não colocar valores reais no GitHub.
4. Fazer deploy uma vez; entrar pelo Portal Escolar; cadastrar uma escola e a direção.
5. Pela direção, criar uma turma, contas fictícias de professor e aluno, matricular o aluno e vincular professor à disciplina.
6. Entrar como professor, publicar atividade; entrar como aluno, responder.
7. Validar que outra escola/usuário não encontra turmas nem atividades não autorizadas; validar logout, CSRF, proteção contra XSS, erro de rede e zoom/mobile.
8. **Antes do uso real:** recuperação de contas, convite/ativação, revisão institucional de privacidade e banco persistente com backup e política de retenção.

A API e o banco atuais são gratuitos de homologação. O banco gratuito expira em 18/12/2026. Não colocar alunos reais neste ambiente nem considerar acesso institucional pronto.

## Próximas entregas
- Matérias e vínculos no seletor docente vindos do servidor, sem lista estática.
- Regras de calendário/horários, notas e frequência validadas pela escola.
- IA: backend com funções autenticadas e consultas por aluno/turma, revisão docente para conteúdo gerado e processamento seguro de texto/PDF/imagem. Nunca enviar dados pessoais a provedor sem aprovação.
