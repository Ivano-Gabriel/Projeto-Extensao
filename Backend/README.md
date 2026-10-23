# Backend do Projeto de Extensao — etapa B

Base do Mitchell refeita para login real e autorizacao por perfil. **Ainda nao publicar sem passar nos testes e concluir o banco (etapa C).**

## Requisitos

- Java 21
- Maven 3.6.3+
- Spring Boot 4.1.1
- PostgreSQL no deploy; H2 **apenas** no perfil local `dev` e nos testes

## Rodar localmente sem banco externo

Abra um PowerShell na pasta `Backend`:

```powershell
mvn.cmd test
mvn.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Para conseguir entrar, crie a primeira conta de DIRECAO **usando variaveis de ambiente no terminal local**, nunca salvas no GitHub:

```powershell
$env:APP_BOOTSTRAP_ADMIN_EMAIL = "direcao@exemplo.edu.br"
$env:APP_BOOTSTRAP_ADMIN_NAME = "Direcao"
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = "<crie-uma-senha-longa-e-unica>"
mvn.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

A senha acima e um marcador: substitua por uma senha sua com pelo menos 12 caracteres. A conta so e criada quando o banco esta vazio. **Remova as variaveis do ambiente apos o primeiro bootstrap.** O banco H2 do modo dev e temporario; reiniciar o processo recria os dados.

## API

As chamadas autenticadas usam cookie `EXTENSAO_SESSION` HttpOnly, SameSite=Lax e Secure na producao. **Nunca coloque token de sessao no localStorage.**

1. `GET /api/csrf` publica `XSRF-TOKEN`, e responde JSON `{"token":"..."}`.
2. `POST /api/login` com header `X-XSRF-TOKEN` e corpo `{"email":"...","senha":"..."}`. Cookie de sessao criado no login, sem token na resposta.
3. Depois do login, chame `GET /api/csrf` novamente para renovar o token.
4. `GET /api/me` retorna `{id,nome,email,papel,estado}` da conta logada.
5. `POST /api/estado` salva a ultima aba e dia **do proprio usuario** (CSRF obrigatorio).
6. `POST /api/logout` apaga a sessao (CSRF obrigatorio).
7. `GET /api/alunos/{id}`: apenas o proprio aluno ou direcao.
8. `GET /api/professor/area`: professor e direcao (sem acesso indiscriminado aos alunos).
9. `GET /api/gestao/usuarios` e `POST /api/gestao/usuarios`: somente direcao; cadastro publico desativado.
10. `GET /healthz`: publico, nao acessa o banco.

Todas as respostas com dados de usuario omitem senha e hash. Login devolve mensagem generica para credenciais incorretas; tentativas repetidas sofrem limite. O limite atual e por memoria da instancia (necessita controle distribuido se houver mais de uma instancia).

## Variaveis para producao (etapa C)

- `DB_URL`: URL JDBC do PostgreSQL, exemplo de formato `jdbc:postgresql://HOST:5432/DB?sslmode=require`.
- `DB_USERNAME` / `DB_PASSWORD`: usuario e senha separados, **nao fazer commit**.
- `APP_SECURE_COOKIES=true` (padrao, so desative no dev local).
- `APP_BOOTSTRAP_ADMIN_EMAIL`, `APP_BOOTSTRAP_ADMIN_PASSWORD` e opcional `APP_BOOTSTRAP_ADMIN_NAME`: apenas para criar a primeira conta.
- `PORT`: porta do Render (padrao 3001).

Nao fazer `ddl-auto=update`: o Flyway cria e versiona o esquema. O PostgreSQL e as sessoes ficam na mesma base.

## Limites do PR B

- Nao ha cadastro publico nem recuperacao de senha ainda.
- Nao ha relacao professor/turma, logo professores NAO podem consultar qualquer aluno.
- Nao ha notas reais ainda: nao expor boletim demonstrativo como dados reais.
- Falta integrar o React ao fluxo CSRF+cookies (etapa D) e testar o deploy.
- Em producao, use Vercel com proxy no mesmo dominio para `/api`; nao abra CORS para `*`.
