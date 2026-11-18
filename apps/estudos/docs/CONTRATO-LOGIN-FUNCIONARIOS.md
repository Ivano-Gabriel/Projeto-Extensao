# Contrato de integração — Login / Área de funcionários

Responsabilidade desta branch: **autenticação, cookies, CSRF, página de entrada e roteamento por papel**. Os componentes de professor e direção podem ser evoluídos em PR separado pelo colega, sem criar outra autenticação.

## Fluxo único
1. Usuário abre o botão **Portal escolar**.
2. Escolhe **Sou aluno** ou **Sou funcionário**; essa seleção só altera a apresentação visual, não concede permissões.
3. Envia e-mail e senha em `POST /api/login` com token de `GET /api/csrf`.
4. A API cria sessão no servidor e emite cookie `EXTENSAO_SESSION` Secure, HttpOnly, SameSite=Lax; o frontend **não armazena JWT, cookie ou token em localStorage**.
5. A resposta de `GET /api/me` e do login define o perfil real: `ALUNO`, `PROFESSOR`, `DIRECAO`, ou `administrador=true` (super-ADM).
6. O componente `Portal.tsx` mostra o painel correto. O backend verifica escola/turma/papel em **toda** requisição, independentemente da tela.

## Para o colega (funcionários)
- Manter `apps/estudos/src/portal/api.ts` como cliente único da API.
- Importar `areaDoUsuario(usuario)` de `apps/estudos/src/portal/perfis.ts` para navegação após login.
- Desenvolver professor/direção em componentes próprios (ex.: `FuncionarioProfessor.tsx`, `FuncionarioDirecao.tsx`) e depois integrar ao `Portal.tsx` por PR; não alterar `PortalLogin.tsx`.
- Nunca criar `localStorage.setItem('token')`, credenciais no frontend, permissões por formulário, endpoint sem autorização ou cadastro de alunos sem conta da direção.
- `GET /api/portal/turmas` lista turmas **autorizadas pelo servidor**; `POST /api/professor/atividades` exige vínculo docente de turma + disciplina.
- Contas são da escola; ainda não há recuperação de senha, convites, calendário, notas e frequência oficiais. Não tratar demonstração local como dado escolar.

## Testes
- `cd apps/estudos && npm ci && npm test && npm run build`
- O service worker não intercepta nada em `/api/`, incluindo navegações diretas.
- Vercel aplica `Cache-Control: no-store` em `/api/:path*` e impede carregamento em iframes.
- Antes de contas reais: banco durável/backup, credenciais rotacionadas, homologação LGPD, CSRF/session/logoff em navegador real.

## IA futura
`/api/assistente` deverá usar a sessão para identificar aluno, ferramentas tipadas `minhasNotas()`, `minhaFrequencia()`, `meuCalendario()`, `minhasAtividades()` com filtros por escola/aluno. Sem consultas SQL geradas pelo modelo e sem dados de outras pessoas. Python é opcional e só vale se processamento pesado de PDF/OCR exigir worker separado.
