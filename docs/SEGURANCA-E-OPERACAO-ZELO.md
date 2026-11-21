# zELO+ — Execução de segurança e homologação (Rodada 1)

Atualizado em 20/11/2026. **Ambiente de staging somente com contas fictícias.**

## Implementado nesta rodada

1. **Troca de senha autenticada** via POST `/api/me/senha`. Exige a senha atual, senha nova distinta (mínimo 12 caracteres), sessão válida e CSRF. A senha é armazenada apenas como BCrypt, e sessões JDBC são revogadas. Não foi criado fluxo de "esqueci minha senha" por e-mail, pois isso exige provedor, expiração, rate limiting e proteção contra abuso.
2. **Auditoria inicial** em `auditoria_escolar`: transferência de aluno e remoção de vínculo docente. A direção vê somente a própria escola (50 eventos recentes). O banco registra ator, escola, ação, entidade e identificador; nunca senha ou resposta de aluno. **Ainda não é auditoria integral** de alterações em todo o sistema.
3. **Vínculos docentes coerentes**: ao remover um vínculo, horários atribuídos ao professor nessa disciplina/turma mantêm os períodos, mas deixam o professor como responsável. O professor perde acesso à turma quando não possuir outro vínculo.
4. **Respostas históricas após transferência**: estudante pode recuperar as próprias respostas de atividades da escola anterior à transferência entre turmas da mesma escola. Não consegue consultar respostas de outra conta.
5. **Testes integrados**: cadastro/publicação do professor → resposta real → transferência pela direção → histórico do próprio aluno, com verificações CSRF e permissões; suite Java e build Vite.

## Testar manualmente no zELO+

- Entrar como direção da escola fictícia e ir a **Vínculos**; remover professor atribuído a um horário e confirmar que o horário permanece com campo de responsável vazio.
- Na mesma direção, ir a **Histórico**; conferir eventos de remoção e transferência, sem dados de outra escola.
- Entrar como aluno de teste, responder uma atividade publicada pela turma A, depois transferir para turma B; confirmar que as atividades oferecidas são de B e que o histórico das respostas antigas pode ser recuperado.
- Entrar como aluno/professor, clicar **Minha segurança**, alterar senha com a senha atual e confirmar que há logout; entrar novamente usando a senha nova e verificar que a senha anterior é inválida.
- Testar uma alteração de senha com senha errada e sem CSRF: deve ser rejeitada.
- Executar tela pública no TinyFish **somente leitura**. Não autorizar contorno de autenticação nem marcar testes de perfis como verificados quando não houver contas de homologação disponibilizadas.

## Infra: decisão necessária antes de 18/12/2026

O PostgreSQL gratuito `extensao-staging` possui vencimento em **18/12/2026**. O backend também está em Render Free, com deploy manual. Essa infraestrutura não tem garantias de produção. **Não remover/alterar banco, plano, servidor ou dados agora.**

Antes de migrar ou pagar:
- Definir destino e responsável financeiro, janela de manutenção, disponibilidade, região, backups e restore.
- Fazer backup do banco com ferramenta `pg_dump` através de canal autorizado com acesso às credenciais; nunca incluir a string de conexão em repositório, prints ou chat.
- Testar **restauração** em banco temporário vazio, conferir schema Flyway e contagens agregadas sem dados pessoais.
- Gerar checksum do backup e armazená-lo criptografado fora da infraestrutura principal.
- Congelar gravações durante a passagem e verificar divergência antes de atualizar variáveis privadas da API.
- Validar o ciclo completo com contas fictícias e o procedimento de rollback.
- Evitar conceder acesso externo ao banco sem necessidade. A conexão direta a partir desta ferramenta está bloqueada pelo allowlist vazio, que é uma proteção útil.

## Evidência

**Não marcar os 20 cenários humanos como aprovados só porque o CI passou.**
Registrar resultados reais e capturas sem PII no arquivo [HOMOLOGACAO-ZELO.md](HOMOLOGACAO-ZELO.md). O teste integrado automático valida o ciclo da API com banco de teste; TinyFish público valida apenas o login/navegação que não requer conta.

## Pendente

Recuperação de senha por e-mail e seu provedor; logs abrangentes para criação/edição de material, atividade, presença, horário, usuário e acesso; política de privacidade e retenção; backup/restauração comprovados; SLA; auditoria externa.


## Revisão operacional 21/11/2026 — antes de publicar o backend

**Separação aprovada:** PRs exclusivamente de backend podem ser mesclados após CI; o Render `extensao-api-staging` está configurado com `autoDeploy=no` na branch `main`. O merge não equivale a deploy. PR #68 (redesign frontend) está fechado **sem merge** e não integra este lote.

**Inventário conferido em modo leitura (Render):**
- Serviço: `extensao-api-staging`, plano Free, Oregon, deploy manual.
- Banco: `extensao-staging`, PostgreSQL Free, expira **18/12/2026**.
- Acesso externo direto ao banco bloqueado por allowlist vazia. **Não abrir allowlist** para auditoria improvisada: a consulta remota de diagnóstico foi negada e não foi executada.
- Não houve mudança de variável de ambiente, credencial, backup, plano, banco ou deploy nesta revisão.

### P0 — recuperação e operação segura (pendência para ação autorizada)

1. **Credencial historicamente exposta:** o operador com acesso ao Render deve gerar nova credencial, atualizar apenas as variáveis privadas da API, testar conexão/health e revogar a antiga; não copiar senha, URL completa ou tokens em GitHub, chat ou logs. A rotação **ainda não foi confirmada**.
2. **Backup antes de migração/deploy estrutural:** conectar por meio autorizado, executar `pg_dump --format=custom --no-owner --no-acl --file=<caminho-restrito> <conexao_privada>` sem registrar parâmetros secretos em histórico/log; criar checksum SHA-256 e armazenar **criptografado**, com acesso restrito e prazo de retenção definido. Não colocar backup no GitHub.
3. **Teste de restauração:** usar banco *temporário e isolado*, nunca sobrescrever o staging; `pg_restore --list` para validar estrutura e `pg_restore --no-owner --no-acl --dbname=<destino_isolado> <arquivo>`. Verificar migrations Flyway, tabelas esperadas, contagens agregadas, consultas autorizadas e integridade, registrando evidência sem dados pessoais.
4. **Rollback/observabilidade:** registrar SHA do backend antes do deploy, verificar `/healthz`, erros/latência, modelo de conexão, disponibilidade e restauração; se a atualização falhar, restaurar build anterior com deploy manual. Nenhum teste de carga foi declarado concluído.
5. **Menores/dados reais:** manter somente dados sintéticos até revisão LGPD da escola, política de retenção, restauração comprovada e permissão institucional. O banco gratuito temporário não deve receber dados pessoais reais.

### Matriz de evidências: rumo ao piloto funcional de 85%

- **Segurança e isolamento:** cobertura integrada Java para sessão/CSRF, perfis, escola, transferências, aluno A/B e docentes sem vínculo. Ainda falta homologação com **duas escolas no navegador** e comprovação de credenciais revogadas.
- **Direção/professor:** transferências, vínculos, aula/presença provisória, material/atividade e comunicado possuem rotas e testes; a matriz de 20 frentes da issue #52 conserva cenários PARCIAIS/BLOQUEADOS. Não substituir testes manuais por CI.
- **IA:** PR #69 corrigiu estorno de cota após falha, com 88 testes Java aprovados e merge na `main`; validação de gabarito/alternativas está sendo reforçada na branch de QA. Não habilitar Groq em staging até revisão.
- **Operação:** backup + restore reais, carga 20/50/100 usuários fictícios e rotação de credencial **pendentes**; limite de Free e vencimento do banco são bloqueadores para dados reais.
- **Homologação:** a evidência vigente é o relatório de 20/11/2026 na issue #52; aprovação automatizada não significa aceite visual ou institucional.

**Critério de fechamento:** só alterar a prontidão estimada de 80% para 85% após testar fluxos críticos, registrar bloqueios resolvidos com evidência e obter aceite do responsável. Não alegar certificado de segurança, LGPD ou operação institucional.
