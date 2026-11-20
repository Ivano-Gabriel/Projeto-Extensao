# zELO+ — ativação controlada da IA pedagógica

## O que esta entrega oferece

Há dois fluxos distintos. O professor, se vinculado à turma e disciplina, gera um rascunho
de quiz estruturado, explicação ou plano de aula. O quiz gerado preenche os campos do
editor existente, mas **só é publicado após revisão e ação explícita do professor**.

O aluno pode escolher uma disciplina da turma em que está matriculado e pedir uma
explicação pedagógica. A IA não é autorizada a consultar dados de notas, faltas, nomes
de alunos nem documentos do sistema.

O assistente escolar guiado anterior permanece independente e funciona mesmo com a IA
generativa desligada. Seus dados vêm do banco sob as permissões existentes.

## Configuração segura no Render

Configurar apenas via painel de variáveis privadas do serviço `extensao-api-staging`.
Jamais colocar chave nos arquivos, frontend, mensagens, prints ou GitHub.

| Variável | Valor inicial |
| --- | --- |
| `EXTENSAO_IA_ENABLED` | `false` |
| `EXTENSAO_IA_ALUNOS_ENABLED` | `false` |
| `OPENAI_API_KEY` | **Não configurada** |
| `OPENAI_MODEL` | `gpt-4.1-mini` (substituível após avaliação) |
| `EXTENSAO_IA_PROFESSOR_POR_DIA` | `12` |
| `EXTENSAO_IA_ALUNO_POR_DIA` | `6` |

Os limites por conta são máximos configuráveis, com teto de segurança no serviço
(40/professor/dia e 20/aluno/dia). A tabela `ia_uso_diario` armazena
**somente id da conta, dia UTC e número de chamadas reservadas**.
A contagem é persistente, inclusive se o Render reiniciar, e a reserva é
transacional para a mesma conta. Chamadas falhadas também consomem cota, por
segurança de orçamento.

**Essas cotas não representam um teto financeiro global em reais ou dólares.**
Antes de ativar, configurar limites de orçamento, alertas e restrições na conta
do provedor de API, verificar preços do modelo e carga estimada. Manter a
feature desativada até aprovação de uso com dados escolares.

Para liberar apenas professores, depois de proteger chave e orçamento,
definir `EXTENSAO_IA_ENABLED=true` mantendo
`EXTENSAO_IA_ALUNOS_ENABLED=false`.
A abertura para estudantes é **uma decisão independente**, sujeita à
avaliação de privacidade, governança escolar e homologação.

## Dados enviados ao provedor

- **Professor**: tipo, disciplina, tema e orientação que ele mesmo escreveu.
- **Aluno**: disciplina e a dúvida escrita por ele.
- Nunca: tokens de sessão, senhas, nomes, notas, matrícula, informações de
  frequência ou dados reais do banco.

O backend tenta bloquear endereços de e-mail, telefones, CPF e campos
identificadores evidentes. É uma barreira adicional, **não uma garantia de
detecção de todo dado pessoal**. Interfaces orientam não inserir informações
pessoais.

A chamada usa `store: false` para impedir armazenamento da resposta como
estado de aplicação no provedor. Isso não equivale a ausência de quaisquer
logs ou a garantia contratual de retenção zero. Conferir os termos e opções
de retenção do provedor e as exigências da LGPD antes de uso com menores.

## Roteiro de homologação com contas fictícias

1. Fazer login como professor vinculado e abrir **Materiais e IA**.
2. Confirmar status **desativado** sem chave configurada, sem quebrar editor manual.
3. Quando habilitado no ambiente seguro, gerar uma questão de teste.
4. Conferir título, pergunta, quatro alternativas, gabarito e explicação.
5. Pressionar **Revisar quiz no editor** e editar livremente; nada deve ser
   publicado sem confirmação explícita.
6. Entrar como aluno vinculado e abrir **Assistente → Entender matéria com IA**.
7. Confirmar seleção de disciplina da própria turma e impedimento para
   outra escola ou turma, com aviso de privacidade.
8. Confirmar que o modo **Minha escola** continua funcionando sem IA.
9. Repetir até limite diário e verificar bloqueio por cota com HTTP 429.
10. Validar no mobile e desktop, inclusive teclado, zoom e leitor de tela.

## Plano de reversão

A qualquer momento voltar `EXTENSAO_IA_ENABLED=false` e
`EXTENSAO_IA_ALUNOS_ENABLED=false` e aplicar o ambiente atualizado.
Não é necessário apagar nem reverter as tabelas de limite.
A reversão não apaga atividades que um professor já tenha publicado manualmente.

## Não incluído

- Chat persistente ou envio automático de mensagens a alunos
- IA treinada em registros escolares
- Avaliação automática de aluno ou atribuição de notas
- Execução de modelo sem chave e orçamento configurados
- Garantia de resultado perfeito do modelo: a conferência humana continua necessária
