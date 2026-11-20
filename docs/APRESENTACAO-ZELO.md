# zELO+ — Roteiro de apresentação do trabalho

**Duração sugerida:** 7 a 9 minutos, com duas pessoas apresentando. Ajustar à disciplina e ao tempo estabelecido pelo docente. Não incluir dados pessoais de alunos reais.

## Slide 1 — Contexto (Apresentador 1, 40 s)

**Tema:** tecnologia na rotina escolar. **Fala sugerida:** “Nosso grupo desenvolveu protótipos para explorar como ferramentas digitais podem apoiar os estudos e a organização da escola. Entre três propostas, aprofundamos a ferramenta de estudos, que evoluiu para o portal zELO+.”

**Mostrar:** três protótipos e a escolha do módulo de estudos. Explicar que **zELO+ é identidade provisória**, não marca registrada.

## Slide 2 — Problema e público (Apresentador 1, 60 s)

Falar de três necessidades diferentes: aluno consulta atividades; professor publica materiais e acompanha respostas; direção organiza turmas e pessoas. Evitar prometer notas oficiais ou substituição de diários escolares.

## Slide 3 — Arquitetura (Apresentador 1, 90 s)

Mostrar:

```text
React / TypeScript / Vite (PWA)
  ↓ Requisições HTTP/JSON, sessão HttpOnly e CSRF
Java 21 / Spring Boot (API e autorização)
  ↓ SQL / migrações Flyway
PostgreSQL (registros de homologação)
```

**Explicar rapidamente:**

- **Frontend**: telas, navegação responsiva e formulários.
- **Backend**: regras de acesso, validação e registro de atividades.
- **API**: ponte pela qual a interface consulta/atualiza dados.
- **Banco**: guarda matrículas, vínculos, atividades, respostas e comunicados.
- **PWA**: opção de instalar o aplicativo no dispositivo; não equivale a funcionamento integral offline.

## Slide 4 — Demonstração (Apresentador 2, 2 min)

Demonstrar em sequência, com contas fictícias previamente preparadas:

1. **Direção:** criar turma ou mostrar turma cadastrada, vínculo e matrícula.
2. **Professor:** publicar uma atividade com quatro alternativas, gabarito e explicação.
3. **Aluno:** abrir Minha Turma e responder a atividade publicada.
4. Voltar ao professor para mostrar desempenho registrado, quando houver.
5. Se houver tempo, exibir transferência de matrícula e histórico.

**Se o Render estiver indisponível:** usar vídeo de demonstração gravado **com dados fictícios** e explicar que é evidência de uma execução anterior, não simulação de ambiente ao vivo.

## Slide 5 — Design e acessibilidade (Apresentador 2, 60 s)

Mostrar login com livro animado, logo zELO+, menu mobile e a redução de rolagem no início. Relatar que mudanças vieram de testes humanos, e que a auditoria completa de acessibilidade ainda é pendência.

## Slide 6 — Assistentes e limites (Apresentador 2, 50 s)

- **Assistente gratuito:** regras e respostas guiadas para consulta de informações autorizadas e conteúdos introdutórios.
- **IA generativa:** integração existente, mas desativada até haver fornecedor, chave, orçamento, revisão docente e avaliação de privacidade.
- **Diferença demo vs. registro no banco:** biblioteca demonstrativa não é boletim ou frequência oficial.

## Slide 7 — Testes e evolução (Apresentador 1, 70 s)

Exibir a PR desta entrega, workflows de CI, roteiro de 20 testes, registro de erros de UX e documentação de arquitetura.

**Não fixar no slide números de testes que podem mudar:** preencher com o total real visto no último pipeline após o merge e registrar URL/commit da execução.

## Slide 8 — Próximos passos e conclusão (ambos, 40 s)

“Entregamos um protótipo evoluído, com acesso por perfil, experiências diferenciadas e registros de homologação persistentes. Para implantação institucional, precisamos de avaliação pedagógica, segurança, privacidade de dados, backups comprovados, acessibilidade e acordo com uma escola parceira.”

Finalizar pedindo feedback da banca/estudantes, sem apresentar contratação pelo Estado como resultado já alcançado.

## Perguntas que a banca pode fazer

**Por que React e Java?** React facilita UI componentizada e responsiva; Spring Boot concentra regras de negócio/autorização; cada tecnologia resolve uma parte do problema.

**Qual a diferença entre backend e banco?** O backend recebe pedidos, verifica permissões, aplica regras e consulta o banco; o banco persiste os registros.

**O professor pode publicar dados em qualquer turma?** Não: a API verifica vínculo e disciplina autorizada.

**É possível usar sem internet?** Parte do conteúdo estático pode ter cache pelo PWA, mas login e operações do portal dependem da API.

**O app já é oficial?** Não. Trabalha com dados fictícios e presença provisória. Implantação oficial exige aceite e governança.

**Como vocês testaram?** CI para lógica/build e homologação manual por jornada, perfil, dispositivo e verificação da persistência, com evidências.

## Checklist pré-apresentação

- Verificar deploy e API; testar a sessão antes da apresentação.
- Separar contas fictícias já matriculadas; jamais projetar senhas.
- Confirmar atividade publicada e resposta no banco.
- Gravar vídeo reserva sem nomes reais.
- Levar README, relatório, prints e link da PR.
- Confirmar nomes dos integrantes, disciplinas, instituição, orientador e créditos.
