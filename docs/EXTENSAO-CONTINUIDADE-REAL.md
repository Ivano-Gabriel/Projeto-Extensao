# Projeto Extensao — continuidade para novos chats

Atualizado em 18/11/2026. Objetivo do usuario: migrar da demonstracao para sistema escolar real, voltado ao ENSINO MEDIO, com turmas, professores, direcao, administrador da plataforma, atividades e IA com acesso limitado por permissao. Usuario autoriza avancos de desenvolvimento; nao ultrapassar limites de custo sem acordo e nao cadastrar menores reais antes de validar privacidade.

## Codigo e hospedagem
Repositorio: https://github.com/Ivano-Gabriel/Projeto-Extensao
Frontend publicamente disponivel: https://extensao-estudos.vercel.app
Vercel projeto: extensao-estudos, root apps/estudos. Main anterior a nova branch: b4fe52c3f9a4b94a568a819bee00576cc15859d9.
Render workspace confirmado: My Workspace. PostgreSQL staging separado: extensao-staging, plano FREE, criado 18/11, expira 18/12/2026.
Supabase da conta possui Nummo e GabGym; nao reutilizar seus bancos.

## Frontend atual
Estudos (proposta 3) possui materiais, perguntas, plano semanal, agenda de hoje, feed demonstrativo, criacao local de desafios a partir de temas ja cadastrados, desafio do dia, foguinho e arcade. CSS possui abertura animada de livro e modo escuro ainda criticado pelo usuario. PWA presente, mas verificacao iOS/Android pendente.
Interface atual nao possui login real ou sincronizacao entre usuarios. Nao tratar dados ficticios de frequencia e notas como reais.

## Backend em desenvolvimento
Branch: feature/extensao-escolas-turmas-seguranca.
Stack Spring Boot 4.1.1 / Java 21 / Flyway / Postgres / cookie de sessao HttpOnly / CSRF / BCrypt.
V1: usuarios e sessoes JDBC. V2: escolas, turma, matriculas, vinculos docentes, escola_id no usuario e papel admin de plataforma separado.
V3: atividades, questoes e respostas. Professor vinculado publica questao; aluno matriculado responde uma vez e recebe explicacao. Endpoint GET do aluno nao mostra gabarito.
Conta ADM so via bootstrap seguro e pode cadastrar escola e diretor. Direcao vincula usuarios, turmas e docentes de sua escola. Testes em GitHub Actions.
Nao afirmar que backend esta no ar antes de verificar o servico e o healthcheck.

## Proximas prioridades
P0: CI verde, PR revisado, merge, configurar API Render conectada ao Postgres isolado com variaveis protegidas, smoke /healthz e /api/csrf, registro da primeira escola apenas pelo ADM.
P0: criar SPA de login e portal por perfil; proxy same-origin na Vercel, cookies, CSRF, /api/me, logout, acesso de professor e aluno; nunca simular autorizacao via seletor de papel.
P0: teste de isolamento entre duas escolas, aluno A/B, professor sem turma, expiracao de sessao e sem gabarito antes da resposta.
P1: questoes por assunto, tarefas/prazos, upload de PDF seguro e IA geradora de RASCUNHOS; revisao docente obrigatoria; API de IA usa consultas estruturadas a dados autorizados e nunca SQL livre.
P1: polir visual mobile-first, modo escuro, microinteracoes e substituir arcade do livro por experiencias mais adequadas ao ensino medio (profissoes, desafios curtos, logica).
P1: LGPD, consentimento institucional, retencao e exclusao de dados, acessibilidade, testes em iOS e Android.

## Regras
Nao publicar dados pessoais reais de alunos em apps de demonstracao, prints, testes, GitHub ou ferramentas de IA. Nao usar contas ou bancos do Nummo/GabGym.
Nao consumir previews Vercel desnecessariamente; agrupar alteracoes do frontend num unico PR. Evitar comentarios explicativos no codigo conforme pedido.
O usuario prefere relatorios diretos: o que mudou, o que funciona, o que falta, link de teste e percentuais estimados com ressalva.

## Ambiente de producao
Backend Spring nao roda dentro do Supabase Postgres; renderiza-se em Render ou equivalente. Banco definitivo dedicado e persistente com backup. Free Render PostgreSQL expira em 30 dias; nao usar para dados reais.
