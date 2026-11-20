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
