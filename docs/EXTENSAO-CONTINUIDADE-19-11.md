# Extensão — ciclo escolar e continuidade (19/11/2026)

## Estado confirmado
- Vercel `https://extensao-estudos.vercel.app`: app React com login obrigatório, visuais de estudos para aluno e portal por perfil.
- API Spring Boot Java 21: `https://extensao-api-staging.onrender.com`, serviço `srv-dbuut9gm7kps73e8anng`, Render Free com deploy manual.
- Banco exclusivo Render Postgres `extensao-staging` em Oregon, expira 18/12/2026; gratuito, **não apto a uso oficial nem persistência de dados de alunos**.
- Não reutilizar banco de Nummo ou GabGym. Credenciais sempre em variáveis seguras; nunca no GitHub.
- Login com sessão HttpOnly/Secure e token CSRF, autorização por escola/turma. Super-ADM não acessa registros escolares sem autorização. Conclusão end-to-end no navegador com diferentes perfis ainda precisa de teste acompanhado.

## Modelo real no banco
- V1 usuários e sessões; V2 escolas/turmas/matrículas/vínculos por disciplina; V3 atividades, questões e respostas.
- V4 comunicados por escola/turma e público `TODOS`, `ALUNOS`, `FUNCIONARIOS`. Direção pode publicar para sua escola; professor somente para alunos de turmas onde está vinculado. Aluno só vê comunicados autorizados.
- V5 aulas e presenças registradas por professor vinculado. Frequência é **provisória e de homologação**, não oficial. Não calcular benefícios ou limite de faltas a partir de registros incompletos.

## APIs novas desta entrega
- `GET /api/portal/avisos`, `POST /api/gestao/avisos`, `POST /api/professor/avisos`
- `GET /api/professor/turmas/{id}/disciplinas`: apenas disciplinas de fato vinculadas ao professor.
- `GET /api/professor/turmas/{id}/desempenho`: atividades atribuídas, respondidas e acertos em quizzes por aluno autorizado. **Não são notas oficiais**.
- `GET /api/gestao/turmas/{id}/vinculos` e `DELETE /api/gestao/turmas/{id}/professores/{professorId}/disciplinas/{disciplina}` com escopo da direção.
- `GET /api/portal/meu-desempenho`, `GET /api/portal/minhas-respostas`: resultado e explicação de questões exclusivamente do aluno autenticado.
- `POST /api/portal/assistente`: **assistente guiado** com consultas restritas às atividades, turmas, professores e avisos do aluno. Recusa inventar notas/frequência; é determinístico, não LLM externo. Para um modelo generativo, precisaremos de credenciais de API, orçamento e revisão de privacidade com a escola.
- `POST /api/professor/aulas`, `GET /api/professor/turmas/{id}/aulas`, `POST /api/professor/aulas/{id}/presencas`, `GET /api/portal/minha-frequencia`.

## Próximos passos
- Deploy manual no Render após CI/PR e verificação das migrations V4-V5. Sem automatizar banco ou criar serviço pago.
- Front mobile-first: navegação por abas de direção/professor/aluno; acompanhar alunos, aulas, avisos, quiz e assistente guiado.
- Testar perfis e escolas cruzadas em CI. E2E com TinyFish sem credenciais não substitui prova de login de usuários reais.
- Segurança: estratégia de convites, recuperação de senha, trilhas de auditoria, logs sem PII, backups testados, retenção e LGPD.
- IA generativa de conteúdo: receber tema/texto e PDF/imagem somente após controles de upload, revisão docente e provedor aprovado; qualquer questão gerada é rascunho até professor confirmar.
- Experiência: desafio de memória e jogos educativos rápidos com suporte a movimento reduzido, nada de som automático nem competição compulsiva.
- Infra: o workspace Render distribui 750h gratuitas/mês entre serviços. Não agendar ping 14/14min sem plano de capacidade; para 5 professores, 2 diretores e 25 alunos testar carga e proteger banco. Migração para Postgres persistente isolado com backups é requisito antes de usar dados oficiais.

## Contrato de trabalho
Usuário autoriza branches/PRs/deploys/merges com testes, prefere resposta direta com o que mudou, links e pendências. Evitar arquivos repletos de comentários; não apagar cegamente símbolos // que fazem parte de URLs ou código.
