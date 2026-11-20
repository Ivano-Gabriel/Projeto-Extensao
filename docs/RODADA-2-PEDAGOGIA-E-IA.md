# zELO+ — Rodada 2: atividades, relatórios, IA e manutenção

Data: 20/11/2026. Esta rodada **não equivale à aprovação do Estado** e não altera a situação jurídica/financeira do projeto.

## Melhorias funcionais

- **Prazo opcional por atividade** persistido em `atividades.prazo_entrega` (Flyway V10). Professor escolhe data; aluno vê a data e o servidor recusa respostas depois do encerramento (HTTP 409). Sem prazo, o comportamento anterior continua.
- **Exportar desempenho CSV** com aluno, total de atividades, respondidas e acertos. A rota reutiliza o mesmo controle de autorização do relatório da turma. CSV neutraliza células com fórmulas para reduzir risco em softwares de planilha. O arquivo representa **resultado de quiz**, nunca nota oficial.
- **Auditoria ampliada** para publicação, edição e remoção de atividades; dados pessoais não são enviados para a trilha de ações.
- **IA com contrato testável localmente:** extraída política básica de identificação pessoal e parser de resposta do provedor, com testes determinísticos usando respostas sintéticas, sem chave ou cobrança. O provedor real **continua inativo** até aprovação, custo e segurança definidos.
- **Manutenção do código:** utilitários separados para IA e CSV. Mantidos imports distintos `materiais` (conteúdo) e `materias` (disciplinas), com teste de build. Não mexer no CSS do livro já aprovado.

## O que continua pendente / não inventar

1. Exercícios discursivos, múltiplas questões por avaliação, anexos e comentários dependem de modelagem e UX mais extensas — **não foram implementados nesta rodada**.
2. A IA generativa real só pode ser considerada homologada quando testes autorizados com provedor configurado, orçamento, revisão de qualidade e registros de latência/erros comprovarem resultado em staging.
3. Banco `extensao-staging` continua gratuito e expira em 18/12/2026. Não houve migração para banco pago, backup nem restauração realizados.
4. Os 20 cenários manuais ainda exigem conta de homologação e evidência no navegador. Testes Java e TinyFish público são complementares.
5. Não há auditoria externa, parecer de LGPD, SLA, orçamento de implantação nem aprovação por secretaria estadual.

## Roteiro para o notebook na homologação

1. Entrar como professor fictício; criar atividade com prazo futuro e verificar que aparece no aluno.
2. Criar atividade sem prazo: deve funcionar como antes.
3. Como aluno, responder atividade antes do prazo; atualizar página e conferir histórico.
4. Usando dados de staging autorizados, preparar uma atividade expirada e confirmar bloqueio no servidor e no cliente.
5. Como professor, ir a **Resultados → Exportar desempenho CSV**; conferir número de respostas e acertos. Conferir que aluno/professor de outra turma não exporta esse relatório.
6. Como direção, verificar auditoria e vínculos; as ações precisam ser limitadas à própria escola.
7. No modo de IA, confirmar o texto de indisponibilidade caso não haja provedor; **não colocar chave nos repositórios**.

## Próximos passos até 22/11/2026

- Completar teste humano H01–H20, corrigir os bugs críticos e registrar evidência.
- Ensaiar backup e restauração com um operador autorizado, sem abrir o banco ao público.
- Revisar Política de Privacidade, retenção, ciclo de vida dos alunos, acessibilidade e autoria/licença com a equipe.
- Somente depois de confiança técnica comprovada, apresentar a proposta a uma escola piloto — **não prometer adoção estatal**.
