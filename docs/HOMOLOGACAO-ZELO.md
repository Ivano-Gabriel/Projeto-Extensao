# zELO+ — Roteiro oficial de homologação manual

**Versão:** 19/11/2026 · **Ambiente:** staging · **Responsável pelo teste:** preencher · **Build/commit:** preencher · **Dispositivos:** preencher.

## Objetivo e critérios

Verificar o que o usuário **realmente consegue fazer**, não apenas se endpoints e testes unitários passaram. Executar com contas **fictícias**, por exemplo `gestora@exemplo.test`, `docente@exemplo.test` e `estudante@exemplo.test`, todas criadas pelas telas de administração. Nunca reutilizar credenciais de contas reais.

Cada caso deve ser registrado com **PASSOU / FALHOU / BLOQUEADO / NÃO TESTADO**, captura ou vídeo, data, dispositivo, passos e versão do app. Não marcar como aprovado um teste não executado.

## Massa mínima de teste (criar nas interfaces autorizadas)

- Escola fictícia **Escola Modelo Horizonte**, código `HOMOLOG-HORIZONTE`.
- Turmas `1A`, `1B` e `2A`; duas no mesmo ano letivo e outra de ano distinto.
- Direção: 1 usuário; professores: 3; estudantes: 8 a 12 contas fictícias distintas.
- Vínculos docentes: Matemática, Português e História; matricular alunos em 1A/1B.
- Atividades: pelo menos 6 questões distintas escritas/testadas pelos professores, com gabarito e explicação.
- Materiais: 2 rascunhos privados e 2 publicações; 2 comunicados; 2 aulas com presença provisória.

**Não usar nomes, fotos, notas, matrículas ou documentos reais de crianças e adolescentes.** Para ideias prontas de atividades, consulte [Massa de teste](./DADOS-HOMOLOGACAO-ZELO.md).

## Casos de teste (executar desktop e mobile quando aplicável)

| ID | Perfil | Passos | Resultado esperado | Status | Evidência |
| --- | --- | --- | --- | --- | --- |
| H01 | Público | Abrir o zELO+ | Marca no login, livro animado, sem rolagem horizontal | NÃO TESTADO | — |
| H02 | Público | Instalar o PWA, fechar e reabrir | Nome/ícone zELO+; abertura standalone | NÃO TESTADO | — |
| H03 | Público | Alterar tamanho de tela e zoom para 200% | Sem controles cortados; leitura confortável | NÃO TESTADO | — |
| H04 | Todos | Tentar login inválido e login válido | Falha clara sem expor credenciais; papel correto no sucesso | NÃO TESTADO | — |
| H05 | Direção | Cadastrar escola/turma e vincular professor | Dados aparecem apenas na escola autorizada | NÃO TESTADO | — |
| H06 | Direção | Matricular aluno de homologação em 1A | Aluno passa a ver somente turma e conteúdos autorizados | NÃO TESTADO | — |
| H07 | Direção | Transferir 1A → 1B no mesmo ano | Mudança persistida, confirmação e histórico sem perder respostas anteriores | NÃO TESTADO | — |
| H08 | Direção | Tentar transferir para 2A de outro ano / escola distinta | Operação rejeitada com mensagem apropriada | NÃO TESTADO | — |
| H09 | Direção | Personalizar turma e cadastrar horário | Salvar/recarregar mantém dados e horários | NÃO TESTADO | — |
| H10 | Professor | Criar atividade própria de matemática | Questão persistida e exibida ao aluno matriculado | NÃO TESTADO | — |
| H11 | Professor | Editar atividade ainda não respondida | Alteração persistida e visível; revisão do gabarito possível | NÃO TESTADO | — |
| H12 | Professor | Tentar editar atividade já respondida | Operação bloqueada para preservar histórico | NÃO TESTADO | — |
| H13 | Professor | Criar material rascunho e publicar | Rascunho não visível ao aluno; após publicar, sim | NÃO TESTADO | — |
| H14 | Aluno | Responder atividade da turma, atualizar página | Resposta, acerto e explicação permanecem | NÃO TESTADO | — |
| H15 | Aluno | Abrir Assistente gratuito, pedir data/hora/Bhaskara | Resposta guiada, sem geração paga nem exposição de dados | NÃO TESTADO | — |
| H16 | Aluno | Abrir Laboratório (demo) | Dados de exemplo identificados como demo, nunca como boletim oficial | NÃO TESTADO | — |
| H17 | Professor | Registrar aula e presença de teste | Registro marcado como **provisório** e autorizado por turma | NÃO TESTADO | — |
| H18 | Todos | Sair; usar voltar do navegador; tentar ação sem login | Acesso a dados escolares exige sessão válida | NÃO TESTADO | — |
| H19 | Todos | Navegar por teclado, testar foco e leitor de tela | Foco visível, botões identificáveis e formulário compreensível | NÃO TESTADO | — |
| H20 | Funcionário | Abrir assistente generativo sem chave habilitada | Indisponibilidade segura; atividades manuais continuam operacionais | NÃO TESTADO | — |

## Matriz de testes cruzados e segurança

- Um professor **não** pode cadastrar atividades em turma/disciplina sem vínculo.
- Um aluno **não** pode acessar materiais privados, edição ou dados de outra escola.
- Direção de uma escola **não** pode matricular, transferir, criar usuários ou consultar registros em outra.
- Requisições de alteração sem CSRF devem ser rejeitadas.
- Respostas de quiz registradas devem permanecer íntegras após transferência de turma.
- Não registrar segredos nem dados pessoais identificáveis em capturas, logs de incidente ou relatórios.

## Avaliação específica de UX mobile

Verificar nas larguras **320, 360, 390, 430, 768 e 1280 px**; testar toque com uma mão, menu do livro, animações opcionais/reduced-motion, campo de senha, rolagem vertical, ausência de rolagem horizontal, tamanho dos controles, orientação paisagem e contraste. Prioridade para celulares modestos.

## Ficha de defeito (duplicar para cada ocorrência)

```text
Bug: ZELO-UX-____
Data/hora:
Versão/commit:
Perfil:
Dispositivo / sistema / navegador / largura:
Tela e ação:
Resultado esperado:
Resultado obtido:
Passos para reproduzir:
Impacto: crítico | alto | médio | baixo
Evidência (imagem/vídeo sem PII):
Reprodução por outra pessoa: sim | não | pendente
PR de correção:
Reteste: passou | falhou | pendente
```

## Critérios mínimos para fechar a homologação interna

1. **100% dos casos críticos H04, H06, H07, H08, H10, H14, H18 aprovados**, com evidência.
2. Nenhuma falha crítica de autorização, perda de dados ou vazamento de informação aberta.
3. Fluxos essenciais de direção, professor e aluno testados em pelo menos um desktop e dois celulares diferentes.
4. Procedimento de backup/restauração e planos de tratamento de incidentes definidos antes de qualquer uso com dados reais.
5. Relatório com falhas abertas e aceitas: não declarar perfeição ou conformidade institucional por ausência de defeitos reportados.

## Como registrar resultado do trabalho

Preencher: total executados, aprovados, reprovados, bloqueados; links das evidências; problemas encontrados e corrigidos; diferenças entre desktop/mobile; alterações na interface em resposta às observações. **Só calcular percentual depois de executar os casos.**

Consulte também [Relatório acadêmico](./TRABALHO-ACADEMICO-ZELO.md) e [Plano institucional](./PLANO-INSTITUCIONAL-ZELO.md).
